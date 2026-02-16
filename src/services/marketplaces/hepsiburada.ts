import { IMarketplaceService, MarketplaceOrder, HepsiburadaConfig } from './types';

export class HepsiburadaService implements IMarketplaceService {
    private config: HepsiburadaConfig;
    private baseUrl: string;

    constructor(config: HepsiburadaConfig) {
        this.config = config;
        // Test/Prod base URL selection
        if (this.config.isTest || this.config.merchantId === '18c17301-9348-4937-b5c0-6912f54eb142') {
            this.baseUrl = 'https://oms-external-sit.hepsiburada.com';
        } else {
            this.baseUrl = 'https://oms-external.hepsiburada.com';
        }
    }

    private getAuthHeader(): string {
        const username = (this.config.username || '').trim();
        const password = (this.config.password || '').trim();
        const merchantId = (this.config.merchantId || '').trim();

        // Security: Log username for trace, but never log password in prod without guard
        console.log(`[HB_AUTH_TRACE] User: ${username} | Merchant: ${merchantId}`);

        const token = Buffer.from(`${username}:${password}`).toString('base64');
        return `Basic ${token}`;
    }

    private hbDate(date: Date): string {
        const pad = (n: number) => n.toString().padStart(2, '0');
        const yr = date.getFullYear();
        const mo = pad(date.getMonth() + 1);
        const dy = pad(date.getDate());
        const hr = pad(date.getHours());
        const mi = pad(date.getMinutes());
        const sc = pad(date.getSeconds());
        return `${yr}-${mo}-${dy} ${hr}:${mi}:${sc}`;
    }

    async validateConnection(): Promise<boolean> {
        try {
            const merchantId = (this.config.merchantId || '').trim();
            const url = `${this.baseUrl}/orders/merchantid/${merchantId}?offset=0&limit=1`;
            const response = await fetch(url, {
                headers: {
                    'Authorization': this.getAuthHeader(),
                    'User-Agent': 'Periodya_OMS_v1'
                }
            });
            return response.ok;
        } catch (error) {
            console.error('Hepsiburada connection validation error:', error);
            return false;
        }
    }

    async getOrders(startDate?: Date, endDate?: Date): Promise<MarketplaceOrder[]> {
        const allOrders: MarketplaceOrder[] = [];
        let offset = 0;
        const limit = 50;
        let hasMore = true;

        const merchantId = (this.config.merchantId || '').trim();
        const now = new Date();
        let begin = startDate || new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30);
        let end = endDate || now;

        if (begin > end) {
            const tmp = begin;
            begin = end;
            end = tmp;
        }

        const bStr = this.hbDate(begin);
        const eStr = this.hbDate(end);

        console.log(`[HB_SYNC_PLAN] Merchant: ${merchantId} | Range: ${bStr} to ${eStr}`);

        while (hasMore) {
            try {
                // Production-ready URL construction
                const params = new URLSearchParams({
                    offset: offset.toString(),
                    limit: limit.toString(),
                    begindate: bStr,
                    enddate: eStr
                });

                const url = `${this.baseUrl}/orders/merchantid/${merchantId}?${params.toString()}`;

                const response = await fetch(url, {
                    headers: {
                        'Authorization': this.getAuthHeader(),
                        'User-Agent': 'Periodya_OMS_v1',
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    const errorBody = await response.text();
                    console.error(`[HB_REMOTE_ERROR] Status: ${response.status} | Body: ${errorBody} | URL: ${url}`);

                    if (response.status === 401) {
                        throw new Error(`UNAUTHORIZED: Hepsiburada API anahtarlarınız veya User/Pass bilgileriniz hatalı. (401)`);
                    }
                    throw new Error(`HEPSIBURADA_API_ERROR: ${response.status} - ${errorBody}`);
                }

                const data = await response.json();

                // HB API check: orders list might be direct array or wrapped in { items: [] } or { data: [] }
                const items = Array.isArray(data) ? data : (data.items || data.data || []);

                if (items.length === 0) {
                    console.log(`[HB_SYNC] No more data at offset ${offset}`);
                    hasMore = false;
                    break;
                }

                console.log(`[HB_SYNC] Fetched ${items.length} items at offset ${offset}`);

                for (const item of items) {
                    allOrders.push(this.mapOrder(item));
                }

                if (items.length < limit) {
                    hasMore = false;
                } else {
                    offset += limit;
                }

                // Vercel / Cloud Run safety: if we fetched too many, break to avoid timeout
                if (allOrders.length > 500) {
                    console.warn(`[HB_SYNC] Reach safe limit (500), stopping pagination.`);
                    hasMore = false;
                }

            } catch (error: any) {
                console.error(`[HB_PAGINATION_FAIL] Offset: ${offset} | Error: ${error.message}`);
                throw error;
            }
        }

        return allOrders;
    }

    private mapOrder(hbOrder: any): MarketplaceOrder {
        try {
            return {
                id: hbOrder.id || hbOrder.orderNumber,
                orderNumber: hbOrder.orderNumber,
                customerName: hbOrder.customer?.name || 'Müşteri',
                customerEmail: hbOrder.customer?.email || '',
                orderDate: new Date(hbOrder.orderDate || Date.now()),
                status: hbOrder.status,
                totalAmount: hbOrder.totalPrice?.amount || hbOrder.totalAmount || 0,
                currency: hbOrder.totalPrice?.currency || 'TRY',
                shipmentPackageId: hbOrder.packageNumber || hbOrder.shipmentPackageId,
                shippingAddress: {
                    fullName: hbOrder.shippingAddress?.name || hbOrder.shippingAddress?.fullName || '',
                    address: hbOrder.shippingAddress?.address || '',
                    city: hbOrder.shippingAddress?.city || '',
                    district: hbOrder.shippingAddress?.town || hbOrder.shippingAddress?.district || '',
                    phone: hbOrder.shippingAddress?.phoneNumber || ''
                },
                invoiceAddress: {
                    fullName: hbOrder.billingAddress?.name || hbOrder.billingAddress?.fullName || '',
                    address: hbOrder.billingAddress?.address || '',
                    city: hbOrder.billingAddress?.city || '',
                    district: hbOrder.billingAddress?.town || hbOrder.billingAddress?.district || '',
                    phone: hbOrder.billingAddress?.phoneNumber || ''
                },
                items: (hbOrder.items || []).map((item: any) => ({
                    productName: item.productName || item.name,
                    sku: item.sku || item.merchantSku,
                    quantity: item.quantity,
                    price: item.price?.amount || item.price || 0,
                    taxRate: item.taxRate || 20,
                    discountAmount: 0
                }))
            };
        } catch (err) {
            console.error('[HB_MAP_ERROR] Failed to map order:', hbOrder.id, err);
            // Return minimal fallback if one order fails to map
            return {
                id: hbOrder.id || 'err',
                orderNumber: hbOrder.orderNumber || 'err',
                customerName: 'Error Mapping',
                customerEmail: '',
                orderDate: new Date(),
                status: 'MAPPING_ERROR',
                totalAmount: 0,
                currency: 'TRY',
                shippingAddress: { fullName: '', address: '', city: '', district: '', phone: '' },
                invoiceAddress: { fullName: '', address: '', city: '', district: '', phone: '' },
                items: []
            };
        }
    }
}
