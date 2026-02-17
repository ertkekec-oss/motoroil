import { IMarketplaceService, MarketplaceOrder, HepsiburadaConfig } from './types';

export class HepsiburadaService implements IMarketplaceService {
    private config: HepsiburadaConfig;
    private baseUrl: string;

    constructor(config: HepsiburadaConfig) {
        this.config = config;

        // ===== PROXY AWARE BASE URL =====
        // If MARKETPLACE_PROXY_URL exists (Vercel Production),
        // all traffic goes through Contabo static IP.
        const proxy = (process.env.MARKETPLACE_PROXY_URL || '').trim().replace(/\/$/, '');

        const isTest =
            this.config.isTest ||
            this.config.merchantId === '18c17301-9348-4937-b5c0-6912f54eb142';

        if (proxy) {
            // Production via proxy (static IP)
            this.baseUrl = isTest
                ? `${proxy}/hepsiburada-sit`
                : `${proxy}/hepsiburada`;
        } else {
            // Local / dev fallback (direct)
            this.baseUrl = isTest
                ? 'https://oms-external-sit.hepsiburada.com'
                : 'https://oms-external.hepsiburada.com';
        }

        console.log(`[HB_PROXY] baseUrl=${this.baseUrl}`);
    }

    private getAuthHeader(): string {
        const password = (this.config.password || '').trim();
        const merchantId = (this.config.merchantId || '').trim();

        console.log(`[HB_AUTH_TRACE] UserAgentUser: ${this.config.username} | Merchant: ${merchantId}`);

        const token = Buffer.from(`${merchantId}:${password}`).toString('base64');
        return `Basic ${token}`;
    }

    private getProxyKeyHeader(): string {
        // Nginx static-IP gateway lock (must match nginx config)
        return (process.env.PERIODYA_PROXY_KEY || '').trim();
    }

    private hbDate(date: Date): string {
        const pad = (n: number) => n.toString().padStart(2, '0');
        const yr = date.getFullYear();
        const mo = pad(date.getMonth() + 1);
        const dy = pad(date.getDate());
        const hr = pad(date.getHours());
        const mi = pad(date.getMinutes());
        const sc = pad(date.getSeconds());
        return `${yr}-${mo}-${dy}`;
    }

    async validateConnection(): Promise<boolean> {
        try {
            const merchantId = (this.config.merchantId || '').trim();
            const url = `${this.baseUrl}/orders/merchantid/${merchantId}?offset=0&limit=1`;

            const headers: any = {
                'Authorization': this.getAuthHeader(),
                'User-Agent': (this.config.username || '').trim(),
                'Accept': 'application/json'
            };

            const proxyKey = this.getProxyKeyHeader();
            if (proxyKey) {
                headers['X-Periodya-Key'] = proxyKey;
            }

            const response = await fetch(url, { headers });

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
                    const url =
                        `${this.baseUrl}/${target.urlPart}` +
                        `?offset=${offset}&limit=${limit}` +
                        `&beginDate=${encodeURIComponent(bStr)}` +
                        `&endDate=${encodeURIComponent(eStr)}`;

                    // LOGGING FOR DEBUGGING
                    const effectiveProxy = (process.env.MARKETPLACE_PROXY_URL || '').trim();
                    const userAgent = (this.config.username || '').trim();
                    const proxyKey = this.getProxyKeyHeader();

                    console.log(`[HB_FETCH] URL: ${url} | Proxy: ${!!effectiveProxy} | UA: ${userAgent}`);

                    const headers: any = {
                        'Authorization': this.getAuthHeader(),
                        'User-Agent': userAgent,
                        'Accept': 'application/json'
                    };

                    if (proxyKey) {
                        headers['X-Periodya-Key'] = proxyKey;
                    }

                    const response = await fetch(url, { headers });

                    console.log(`[HB_RESPONSE] Status: ${response.status} ${response.statusText}`);

                    if (!response.ok) {
                        const errText = await response.text();
                        const logBody = errText ? `. Body: ${errText.substring(0, 200)}` : '';
                        console.error(`[HB_TARGET_ERR] ${target.name} failed (Status: ${response.status})${logBody}`);

                        if (response.status === 401 || response.status === 403) {
                            throw new Error(`HB_AUTH_ERROR: Hepsiburada Yetkilendirme Hatası (${response.status}). Header formatını ve User-Agent kontrol edin.`);
                        }
                        if (response.status === 426) {
                            throw new Error(`HB_UPGRADE_REQ: Hepsiburada 426 (Upgrade Required) döndürdü. İstek header'larını ve protokolü kontrol edin.`);
                        }
                        if (response.status === 429) {
                            throw new Error(`HB_RATE_LIMIT: Hepsiburada API limitine takıldınız. (429)`);
                        }

                        throw new Error(`HB_API_ERROR: ${target.name} servisi ${response.status} hatası döndürdü: ${errText.substring(0, 200)}`);
                    }

                    const data = await response.json();
                    let items: any[] = [];

                    if (Array.isArray(data)) items = data;
                    else if (data && typeof data === 'object')
                        items = data.items || data.data || (data.id ? [data] : []);

                    if (items.length === 0) {
                        hasMore = false;
                        break;
                    }

                    for (const item of items) {
                        const mapped = this.mapOrder(item);
                        const key = mapped.id || mapped.orderNumber;
                        if (key) allOrdersMap.set(key, mapped);
                    }

                    if (items.length < limit) hasMore = false;
                    else offset += limit;

                    // Safety throttle between pages
                    if (hasMore) await new Promise(r => setTimeout(r, 200));

                } catch (err: any) {
                    console.error(`[HB_PHASE_FATAL] ${target.name} error: ${err.message}`);

                    // Re-throw specific errors that should abort the sync
                    if (err.message?.includes('HB_') ||
                        err.message?.includes('fetch failed') ||
                        err.message?.includes('ETIMEDOUT') ||
                        err.message?.includes('ECONNREFUSED')) {
                        throw err;
                    }

                    // Allow continuing to other targets if it's just a soft error for this phase
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
            console.error('[HB_MAP_ERROR] Failed to map order:', hbOrder?.id, err);
            return {
                id: hbOrder?.id || 'err',
                orderNumber: hbOrder?.orderNumber || 'err',
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
