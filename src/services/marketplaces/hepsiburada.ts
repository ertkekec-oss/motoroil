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

    private hbDateYmdHi(d: Date) {
        const pad = (n: number) => String(n).padStart(2, "0");
        // Use local time components as Hepsiburada expects "YYYY-MM-DD HH:mm" without timezone
        const yyyy = d.getFullYear();
        const mm = pad(d.getMonth() + 1);
        const dd = pad(d.getDate());
        const hh = pad(d.getHours());
        const mi = pad(d.getMinutes());
        return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
    }

    private startOfDay(d: Date) {
        const x = new Date(d);
        x.setHours(0, 0, 0, 0);
        return x;
    }

    private endOfDay(d: Date) {
        const x = new Date(d);
        x.setHours(23, 59, 0, 0);
        return x;
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

        // Use strict "YYYY-MM-DD HH:mm" format for dates, as expected by Hepsiburada OMS
        const bStr = this.hbDateYmdHi(this.startOfDay(begin));
        // Use end of day for the end date to cover full range
        const eStr = this.hbDateYmdHi(this.endOfDay(end));

        // Hepsiburada OMS requires separate calls for different life-cycle segments with SPECIFIC query params
        const syncTargets = [
            {
                name: 'UNPACKED',
                urlPart: `orders/merchantid/${merchantId}`,
                params: ['limit']
            },
            {
                name: 'PACKED',
                urlPart: `packages/merchantid/${merchantId}/packed`,
                params: ['limit']
            },
            {
                name: 'SHIPPED',
                urlPart: `packages/merchantid/${merchantId}/shipped`,
                params: ['begindate', 'enddate']
            },
            {
                name: 'DELIVERED',
                urlPart: `packages/merchantid/${merchantId}/delivered`,
                params: ['begindate', 'enddate']
            },
            {
                name: 'CANCELLED',
                urlPart: `orders/merchantid/${merchantId}/cancelled`,
                params: ['begindate', 'enddate']
            }
        ];

        console.log(`[HB_MULTI_SYNC] Starting sync for ${syncTargets.length} targets. Range: ${bStr} - ${eStr}`);

        for (const target of syncTargets) {
            let offset = 0;
            const limit = 50;
            let hasMore = true;

            console.log(`[HB_SYNC_PHASE] Checking ${target.name}...`);

            while (hasMore) {
                try {
                    const qs = new URLSearchParams();
                    if (target.params.includes('limit')) qs.set('limit', String(limit));
                    if (target.params.includes('offset')) qs.set('offset', String(offset));
                    if (target.params.includes('begindate')) qs.set('begindate', bStr);
                    if (target.params.includes('enddate')) qs.set('enddate', eStr);

                    const url = `${this.baseUrl}/${target.urlPart}?${qs.toString()}`;

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
                        console.error(`[HB_TARGET_ERR] ${target.name} failed (Status: ${response.status})`);

                        // 1. FATAL AUTH ERROR: Abort entire sync
                        if (response.status === 401 || response.status === 403) {
                            throw new Error(`HB_AUTH_ERROR: Hepsiburada Yetkilendirme Hatası (${response.status}). Nginx Authorization forward ve Host header kontrol edilmeli.`);
                        }

                        // 2. SOFT MISSING ENDPOINT: Skip this target (Environment/Config mismatch)
                        if (response.status === 404 || response.status === 405) {
                            console.warn(`[HB_SYNC_SKIP] ${target.name} endpoint bulunamadı (404/405). Bu segment atlanıyor.`);
                            hasMore = false;
                            break;
                        }

                        // 3. RETRYABLE RATE LIMIT
                        if (response.status === 429) {
                            throw new Error(`HB_RATE_LIMIT: Hepsiburada API limitine takıldınız. (429)`);
                        }

                        // 4. OTHER API ERRORS
                        throw new Error(`HB_API_ERROR: ${target.name} servisi ${response.status} hatası döndürdü.`);
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
                        const mapped = this.mapOrder(item, target.name);
                        const key = mapped.id || mapped.orderNumber;
                        if (key) allOrdersMap.set(key, mapped);
                    }

                    // Update: Only paginate if offset is supported AND we might have more pages
                    if (items.length < limit || !target.params.includes('offset')) {
                        hasMore = false;
                    } else {
                        offset += limit;
                    }

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

    private mapOrder(hbOrder: any, fallbackStatus: string): MarketplaceOrder {
        try {
            // Hepsiburada status can be in multiple fields depending on endpoint
            const rawStatus = hbOrder.status || hbOrder.orderStatus || hbOrder.cargoStatus || fallbackStatus;

            // Debug: Log if order has no items to help diagnose empty details
            const orderItems = hbOrder.items || hbOrder.orderLines || hbOrder.lines || hbOrder.packageItems || [];

            if (!Array.isArray(orderItems) || orderItems.length === 0) {
                console.warn(`[HB_MAP_WARN] Order ${hbOrder.orderNumber || hbOrder.id} has no items in raw data. Keys:`, Object.keys(hbOrder));
            }

            return {
                id: (hbOrder.id || hbOrder.orderNumber || hbOrder.packageNumber || 'unknown').toString(),
                orderNumber: (hbOrder.orderNumber || hbOrder.packageNumber || 'unknown').toString(),
                customerName: hbOrder.customer?.name || hbOrder.customerName || hbOrder.billingAddress?.fullName || hbOrder.shippingAddress?.fullName || 'Müşteri',
                customerEmail: hbOrder.customer?.email || hbOrder.customerEmail || '',
                orderDate: new Date(hbOrder.orderDate || hbOrder.issueDate || Date.now()),
                status: rawStatus.toString(),
                totalAmount: Number(hbOrder.totalPrice?.amount || hbOrder.totalAmount || hbOrder.payableAmount || hbOrder.totalPrice || 0),
                currency: hbOrder.totalPrice?.currency || hbOrder.currency || 'TRY',
                shipmentPackageId: (hbOrder.packageNumber || hbOrder.shipmentPackageId || hbOrder.id)?.toString(),
                shippingAddress: {
                    fullName: hbOrder.shippingAddress?.name || hbOrder.shippingAddress?.fullName || hbOrder.customer?.name || '',
                    address: hbOrder.shippingAddress?.address || '',
                    city: hbOrder.shippingAddress?.city || '',
                    district: hbOrder.shippingAddress?.town || hbOrder.shippingAddress?.district || '',
                    phone: hbOrder.shippingAddress?.phoneNumber || hbOrder.shippingAddress?.phone || ''
                },
                invoiceAddress: {
                    fullName: hbOrder.billingAddress?.name || hbOrder.billingAddress?.fullName || hbOrder.customer?.name || '',
                    address: hbOrder.billingAddress?.address || '',
                    city: hbOrder.billingAddress?.city || '',
                    district: hbOrder.billingAddress?.town || hbOrder.billingAddress?.district || '',
                    phone: hbOrder.billingAddress?.phoneNumber || hbOrder.billingAddress?.phone || ''
                },
                items: (Array.isArray(orderItems) ? orderItems : []).map((item: any) => ({
                    productName: item.productName || item.name || item.skuDescription || 'Ürün',
                    sku: item.sku || item.merchantSku || item.hbSku || 'SKU',
                    quantity: Number(item.quantity || item.qty || 1),
                    price: Number(item.price?.amount || item.price || item.unitPrice || item.totalPrice || 0),
                    taxRate: Number(item.taxRate || item.vatRate || 20),
                    discountAmount: Number(item.discountAmount || 0)
                })),
                // @ts-ignore - Internal raw data for debugging
                _raw: hbOrder
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
                items: [],
                // @ts-ignore
                _raw: hbOrder
            };
        }
    }
}
