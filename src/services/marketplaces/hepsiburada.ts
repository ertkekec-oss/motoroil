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

            const response = await this.safeFetchJson(url, { headers });
            return !!response.data;
        } catch (error) {
            console.error('Hepsiburada connection validation error:', error);
            return false;
        }
    }

    private async safeFetchJson(url: string, options: any = {}): Promise<{ data: any; status: number }> {
        const res = await fetch(url, options);
        const text = await res.text();
        const trimmed = text.trim();

        if (!res.ok) {
            throw new Error(`HB API Hatası: ${res.status} - ${trimmed.substring(0, 500)}`);
        }

        if (trimmed === 'OK') {
            console.log(`[HB_PROXY] Received OK signal from proxy, retrying in 2s...`);
            await new Promise(r => setTimeout(r, 2000));
            const res2 = await fetch(url, options);
            const text2 = await res2.text();
            if (!res2.ok) throw new Error(`HB API Hatası (Retry): ${res2.status}`);
            if (text2.trim() === 'OK') throw new Error(`HB Proxy meşgul (OK dönüyor). Lütfen birazdan tekrar deneyin.`);
            return { data: JSON.parse(text2), status: res2.status };
        }

        try {
            return { data: JSON.parse(trimmed), status: res.status };
        } catch (e) {
            console.error(`[HB_JSON_PARSE_ERROR]: Response was not JSON. Body snippet: ${trimmed.substring(0, 100)}`);
            throw new Error(`HB yanıtı okunamadı (JSON bekleniyordu).`);
        }
    }

    async getCargoLabel(packageNumber: string): Promise<{ pdfBase64?: string; error?: string }> {
        try {
            const merchantId = (this.config.merchantId || '').trim();
            // Referencing Hepsiburada API: /packages/merchantid/{merchantId}/packagenumber/{packagenumber}/labels?format=PDF
            const url = `${this.baseUrl}/packages/merchantid/${merchantId}/packagenumber/${packageNumber}/labels?format=PDF`;

            const headers: any = {
                'Authorization': this.getAuthHeader(),
                'User-Agent': (this.config.username || '').trim(),
                'Accept': '*/*, application/pdf, application/json'
            };

            const proxyKey = this.getProxyKeyHeader();
            if (proxyKey) {
                headers['X-Periodya-Key'] = proxyKey;
            }

            console.log(`[HB_LABEL_FETCH] URL: ${url}`);

            const res = await fetch(url, { headers });

            if (res.ok) {
                const contentType = res.headers.get('content-type') || '';

                if (contentType.toLowerCase().includes('pdf') || contentType === 'application/octet-stream') {
                    const arrayBuffer = await res.arrayBuffer();
                    const pdfBase64 = Buffer.from(arrayBuffer).toString('base64');
                    return { pdfBase64 };
                } else if (contentType.includes('json')) {
                    const data = await res.json();

                    // Possible properties if Hepsiburada wraps it in JSON
                    if (data?.pdfData) return { pdfBase64: data.pdfData };
                    if (data?.base64) return { pdfBase64: data.base64 };
                    if (typeof data?.data === 'string' && data.data.length > 100) return { pdfBase64: data.data };
                    if (data?.data?.base64) return { pdfBase64: data.data.base64 };
                    if (Array.isArray(data) && data[0]?.pdf) return { pdfBase64: data[0].pdf };
                    if (data?.labels?.[0]?.pdf) return { pdfBase64: data.labels[0].pdf };

                    return { error: 'Hepsiburada API JSON döndürdü fakat beklenen etiket verisi bulunamadı.' };
                }

                const buffer = await res.arrayBuffer();
                const text = Buffer.from(buffer).toString('utf8');

                // Fallback check if it's actually PDF binary stream without content-type
                if (text.substring(0, 4) === '%PDF') {
                    return { pdfBase64: Buffer.from(buffer).toString('base64') };
                }

                return { error: `Desteklenmeyen içerik tipi: ${contentType} - ${text.substring(0, 100)}` };
            } else {
                const text = await res.text();
                return { error: `Hepsiburada Etiket API Hatası (${res.status}): ${text.substring(0, 200)}` };
            }
        } catch (err: any) {
            console.error(`[HB_GET_LABEL_ERR] packageNumber: ${packageNumber}`, err);
            return { error: err.message || 'Hepsiburada etiket bağlantısı sırasında bilinmeyen hata' };
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

                    const response = await this.safeFetchJson(url, { headers });
                    const data = response.data;
                    let items: any[] = [];

                    if (Array.isArray(data)) {
                        items = data;
                    } else if (data && typeof data === 'object') {
                        // Hepsiburada API can return data in various fields depending on the endpoint version
                        items = data.items || data.data || data.packages || data.orders || (data.id || data.orderNumber || data.packageNumber ? [data] : []);
                    }

                    if (items.length === 0) {
                        console.log(`[HB_SYNC_EMPTY] Target ${target.name} returned 0 items. URL: ${url}`);
                        hasMore = false;
                        break;
                    }

                    console.log(`[HB_SYNC_DATA] Target ${target.name} found ${items.length} records.`);

                    for (const item of items) {
                        let mapped = this.mapOrder(item, target.name);
                        const key = mapped.id || mapped.orderNumber;

                        if (mapped.items.length === 0 && mapped.orderNumber && mapped.orderNumber !== 'unknown') {
                            try {
                                const fullDetail = await this.getOrderByNumber(mapped.orderNumber);
                                if (fullDetail && fullDetail.items.length > 0) {
                                    mapped = { ...fullDetail, status: mapped.status };
                                }
                            } catch (detailErr) { }
                        }

                        if (allOrdersMap.has(key)) {
                            const existing = allOrdersMap.get(key)!;
                            if (existing.items.length > 0 && mapped.items.length === 0) continue;
                        }

                        if (key && key !== 'unknown') {
                            allOrdersMap.set(key, mapped);
                        }
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

    async getOrderByNumber(orderNumber: string): Promise<MarketplaceOrder | null> {
        try {
            const merchantId = (this.config.merchantId || '').trim();
            const url = `${this.baseUrl}/orders/merchantid/${merchantId}/ordernumber/${orderNumber}`;

            const headers: any = {
                'Authorization': this.getAuthHeader(),
                'User-Agent': (this.config.username || '').trim(),
                'Accept': 'application/json'
            };

            const proxyKey = this.getProxyKeyHeader();
            if (proxyKey) headers['X-Periodya-Key'] = proxyKey;

            const response = await this.safeFetchJson(url, { headers });
            const data = response.data;
            return this.mapOrder(data, 'UNKNOWN');
        } catch (err) {
            console.error(`[HB_GET_DETAIL_ERR] Order: ${orderNumber}`, err);
            return null;
        }
    }

    async getPackageByOrderNumber(orderNumber: string): Promise<any> {
        try {
            const merchantId = (this.config.merchantId || '').trim();
            // Hepsiburada API: GET /packages/merchantid/{merchantid}/ordernumber/{orderNumber}
            const url = `${this.baseUrl}/packages/merchantid/${merchantId}/ordernumber/${orderNumber}`;

            const headers: any = {
                'Authorization': this.getAuthHeader(),
                'User-Agent': (this.config.username || '').trim(),
                'Accept': 'application/json'
            };

            const proxyKey = this.getProxyKeyHeader();
            if (proxyKey) headers['X-Periodya-Key'] = proxyKey;

            const response = await this.safeFetchJson(url, { headers });
            return response.data;
        } catch (err) {
            console.error(`[HB_GET_PACKAGE_ERR] Order: ${orderNumber}`, err);
            return null;
        }
    }

    private mapOrder(hbOrder: any, fallbackStatus: string): MarketplaceOrder {
        try {
            // Hepsiburada status can be in multiple fields depending on endpoint
            const rawStatus = hbOrder.status || hbOrder.orderStatus || hbOrder.cargoStatus || fallbackStatus;

            // Search for items in multiple possible locations - Handling both camelCase and TitleCase
            let rawLines = hbOrder.items || hbOrder.PackageItems || hbOrder.orderLines || hbOrder.OrderLines || hbOrder.lines || hbOrder.Lines || hbOrder.packageItems || [];

            // If still empty but there is a 'data' object, check inside it
            if ((!Array.isArray(rawLines) || rawLines.length === 0) && (hbOrder.data || hbOrder.Data)) {
                const dataObj = hbOrder.data || hbOrder.Data;
                rawLines = dataObj.items || dataObj.Items || dataObj.lines || dataObj.Lines || dataObj.packageItems || dataObj.PackageItems || [];
            }

            // Fallback for packages: Handle both orderNumber and OrderNumber, packageNumber and PackageNumber
            const orderNo = hbOrder.orderNumber || hbOrder.OrderNumber || (Array.isArray(hbOrder.OrderNumbers) ? hbOrder.OrderNumbers[0] : null) || (Array.isArray(hbOrder.orderNumbers) ? hbOrder.orderNumbers[0] : null) || hbOrder.packageNumber || hbOrder.PackageNumber || hbOrder.id || hbOrder.Id || 'unknown';

            const orderItems = Array.isArray(rawLines) ? rawLines : [];

            return {
                id: (hbOrder.id || orderNo || 'unknown').toString(),
                orderNumber: orderNo.toString(),
                customerName: hbOrder.customer?.name || hbOrder.customerName || hbOrder.billingAddress?.fullName || hbOrder.shippingAddress?.fullName || hbOrder.customer?.fullName || 'Müşteri',
                customerEmail: hbOrder.customer?.email || hbOrder.customerEmail || '',
                orderDate: new Date(hbOrder.orderDate || hbOrder.issueDate || hbOrder.createdAt || Date.now()),
                status: rawStatus.toString().toUpperCase(),
                totalAmount: Number(hbOrder.totalPrice?.amount || hbOrder.TotalPrice?.Amount || hbOrder.totalAmount || hbOrder.TotalAmount || hbOrder.payableAmount || hbOrder.PayableAmount || hbOrder.totalPrice || hbOrder.TotalPrice || 0),
                currency: hbOrder.totalPrice?.currency || hbOrder.TotalPrice?.Currency || hbOrder.currency || hbOrder.Currency || 'TRY',
                shipmentPackageId: (hbOrder.packageNumber || hbOrder.PackageNumber || hbOrder.shipmentPackageId || hbOrder.ShipmentPackageId || hbOrder.id || hbOrder.Id)?.toString(),
                shippingAddress: {
                    fullName: hbOrder.shippingAddress?.name || hbOrder.shippingAddress?.fullName || hbOrder.customer?.name || hbOrder.customerName || '',
                    address: hbOrder.shippingAddress?.address || '',
                    city: hbOrder.shippingAddress?.city || '',
                    district: hbOrder.shippingAddress?.town || hbOrder.shippingAddress?.district || '',
                    phone: hbOrder.shippingAddress?.phoneNumber || hbOrder.shippingAddress?.phone || ''
                },
                invoiceAddress: {
                    fullName: hbOrder.billingAddress?.name || hbOrder.billingAddress?.fullName || hbOrder.customer?.name || hbOrder.customerName || '',
                    address: hbOrder.billingAddress?.address || '',
                    city: hbOrder.billingAddress?.city || '',
                    district: hbOrder.billingAddress?.town || hbOrder.billingAddress?.district || '',
                    phone: hbOrder.billingAddress?.phoneNumber || hbOrder.billingAddress?.phone || ''
                },
                items: orderItems.map((item: any) => ({
                    productName: item.productName || item.ProductName || item.name || item.Name || item.skuDescription || item.SkuDescription || item.description || item.Description || 'Ürün',
                    sku: item.sku || item.Sku || item.merchantSku || item.MerchantSku || item.hbSku || item.HbSku || item.productCode || item.ProductCode || 'SKU',
                    quantity: Number(item.quantity || item.Quantity || item.qty || item.Qty || 1),
                    price: Number(item.totalPrice?.amount || item.TotalPrice?.Amount || item.unitPrice?.amount || item.UnitPrice?.Amount || item.price?.amount || item.Price?.Amount || item.price || item.Price || item.unitPrice || item.UnitPrice || item.totalPrice || item.TotalPrice || 0),
                    taxRate: Number(item.taxRate || item.TaxRate || item.vatRate || item.VatRate || 20),
                    discountAmount: Number(item.discountAmount || item.DiscountAmount || 0)
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
