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
        // Hepsiburada docs recommend 30 days for initial sync to avoid errors
        let begin = startDate || new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30);
        let end = endDate || now;

        if (begin > end) [begin, end] = [end, begin];

        const bStr = this.hbDate(begin);
        const eStr = this.hbDate(end);

        console.log(`[HB_SYNC_START] Merchant: ${merchantId} | From: ${bStr} To: ${eStr}`);

        while (hasMore) {
            try {
                // Manual construct to guarantee %20 instead of + for legacy HB systems
                const url = `${this.baseUrl}/orders/merchantid/${merchantId}?offset=${offset}&limit=${limit}&begindate=${encodeURIComponent(bStr)}&enddate=${encodeURIComponent(eStr)}`;

                console.log(`[HB_CALL] HTTP GET ${url}`);

                const response = await fetch(url, {
                    headers: {
                        'Authorization': this.getAuthHeader(),
                        'User-Agent': 'Periodya_OMS_v1',
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                });

                const totalCount = response.headers.get('x-total-count') || response.headers.get('totalcount') || '0';
                const rateRemaining = response.headers.get('x-ratelimit-remaining') || 'unknown';

                console.log(`[HB_RESULT] Status: ${response.status} | Total: ${totalCount} | Rate: ${rateRemaining}`);

                if (!response.ok) {
                    const errorBody = await response.text();
                    console.error(`[HB_API_ERROR] Status: ${response.status} | URL: ${url} | Body: ${errorBody}`);

                    if (response.status === 401) throw new Error("Hepsiburada Yetkilendirme Hatası (401): API User/Pass yanlış.");
                    if (response.status === 429) throw new Error("Hepsiburada Rate Limit (429): Çok fazla istek atıldı.");
                    throw new Error(`HB_ERROR_${response.status}: ${errorBody.substring(0, 100)}`);
                }

                const data = await response.json();

                // Flexible data extraction
                let items: any[] = [];
                if (Array.isArray(data)) {
                    items = data;
                } else if (data && typeof data === 'object') {
                    items = data.items || data.data || (data.id ? [data] : []);
                }

                console.log(`[HB_DATA] Offset ${offset} yielded ${items.length} items.`);

                if (items.length === 0) {
                    hasMore = false;
                    break;
                }

                for (const item of items) {
                    allOrders.push(this.mapOrder(item));
                }

                if (items.length < limit || allOrders.length >= parseInt(totalCount)) {
                    hasMore = false;
                } else {
                    offset += limit;
                }

                // Safety break for Vercel
                if (allOrders.length > 300) {
                    console.warn(`[HB_SAFETY] Batch limit reached (300).`);
                    hasMore = false;
                }

            } catch (error: any) {
                console.error(`[HB_FATAL] ${error.message}`);
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
