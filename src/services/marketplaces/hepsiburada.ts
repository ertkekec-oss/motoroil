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
        const allOrdersMap = new Map<string, MarketplaceOrder>();

        const merchantId = (this.config.merchantId || '').trim();
        const now = new Date();
        const begin = startDate || new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30);
        const end = endDate || now;

        const bStr = this.hbDate(begin);
        const eStr = this.hbDate(end);

        // Hepsiburada OMS requires separate calls for different life-cycle segments
        const syncTargets = [
            { name: 'UNPACKED', urlPart: `orders/merchantid/${merchantId}` },
            { name: 'SHIPPED', urlPart: `packages/merchantid/${merchantId}/shipped` },
            { name: 'DELIVERED', urlPart: `packages/merchantid/${merchantId}/delivered` },
            { name: 'CANCELLED', urlPart: `packages/merchantid/${merchantId}/cancelled` }
        ];

        console.log(`[HB_MULTI_SYNC] Starting sync for ${syncTargets.length} targets. Range: ${bStr} - ${eStr}`);

        for (const target of syncTargets) {
            let offset = 0;
            const limit = 50;
            let hasMore = true;

            console.log(`[HB_SYNC_PHASE] Checking ${target.name}...`);

            while (hasMore) {
                try {
                    const url = `${this.baseUrl}/${target.urlPart}?offset=${offset}&limit=${limit}&begindate=${encodeURIComponent(bStr)}&enddate=${encodeURIComponent(eStr)}`;

                    const response = await fetch(url, {
                        headers: {
                            'Authorization': this.getAuthHeader(),
                            'User-Agent': 'Periodya_OMS_v1',
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        }
                    });

                    if (!response.ok) {
                        const errText = await response.text();
                        console.warn(`[HB_TARGET_ERR] ${target.name} failed (Status: ${response.status}). Body: ${errText.substring(0, 100)}`);
                        hasMore = false;
                        break;
                    }

                    const data = await response.json();
                    let items: any[] = [];
                    if (Array.isArray(data)) items = data;
                    else if (data && typeof data === 'object') items = data.items || data.data || (data.id ? [data] : []);

                    if (items.length === 0) {
                        hasMore = false;
                        break;
                    }

                    for (const item of items) {
                        const mapped = this.mapOrder(item);
                        // Use a composite key or id to deduplicate
                        const key = mapped.id || mapped.orderNumber;
                        if (key) allOrdersMap.set(key, mapped);
                    }

                    if (items.length < limit) hasMore = false;
                    else offset += limit;

                    // Safety throttle to avoid hitting 429 too fast between pages
                    if (hasMore) await new Promise(r => setTimeout(r, 200));

                } catch (err: any) {
                    console.error(`[HB_PHASE_FATAL] ${target.name} error: ${err.message}`);
                    hasMore = false;
                }
            }

            // Short delay between different endpoint targets
            await new Promise(r => setTimeout(r, 500));
        }

        const finalOrders = Array.from(allOrdersMap.values());
        console.log(`[HB_SYNC_COMPLETE] Total unique orders fetched across all statuses: ${finalOrders.length}`);
        return finalOrders;
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
