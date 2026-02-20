import { IMarketplaceService, MarketplaceOrder, HepsiburadaConfig } from './types';

export class HepsiburadaService implements IMarketplaceService {
    private config: HepsiburadaConfig;
    private baseUrl: string;
    private targetHost: string;

    constructor(config: HepsiburadaConfig) {
        this.config = config;
        const proxy = (process.env.MARKETPLACE_PROXY_URL || '').trim().replace(/\/$/, '');
        const isTest =
            this.config.isTest ||
            this.config.merchantId === '18c17301-9348-4937-b5c0-6912f54eb142';

        this.targetHost = isTest
            ? 'oms-external-sit.hepsiburada.com'
            : 'oms-external.hepsiburada.com';

        if (proxy) {
            // Option B: Reverse Proxy Mode (Path-based)
            // Normalize: remove trailing /proxy if it exists to avoid double /proxy/proxy
            const baseHost = proxy.replace(/\/proxy$/, '');
            this.baseUrl = isTest ? `${baseHost}/proxy/hepsiburada-sit` : `${baseHost}/proxy/hepsiburada`;
        } else {
            // Option A: Direct Mode
            this.baseUrl = `https://${this.targetHost}`;
        }

        console.log(`[HB_INIT] baseUrl=${this.baseUrl} | Target: ${this.targetHost}`);
    }

    private getAuthHeader(): string {
        const password = (this.config.password || '').trim();
        const merchantId = (this.config.merchantId || '').trim();
        const token = Buffer.from(`${merchantId}:${password}`).toString('base64');
        return `Basic ${token}`;
    }

    private getProxyKeyHeader(): string {
        return (process.env.PERIODYA_PROXY_KEY || '').trim();
    }

    private getHeaders(extra: Record<string, string> = {}): Record<string, string> {
        const headers: any = {
            'Authorization': this.getAuthHeader(),
            'User-Agent': (this.config.username || 'Periodya-Integration').trim(),
            'Accept': 'application/json',
            'Host': this.targetHost, // CRITICAL: Explicitly set target Host
            ...extra
        };

        const proxyKey = this.getProxyKeyHeader();
        if (proxyKey) {
            headers['X-Periodya-Key'] = proxyKey;
        }

        return headers;
    }

    async validateConnection(): Promise<boolean> {
        try {
            const merchantId = (this.config.merchantId || '').trim();
            const url = `${this.baseUrl}/orders/merchantid/${merchantId}?offset=0&limit=1`;
            const headers = this.getHeaders();
            const response = await this.safeFetchJson(url, { headers });
            return !!response.data;
        } catch (error) {
            console.error('[HB_VAL_CONN_ERR]', error);
            return false;
        }
    }

    private async safeFetchJson(url: string, options: any = {}): Promise<{ data: any; status: number; raw?: string }> {
        console.log(`[HB_FETCH_REQ] URL: ${url}`);

        const res = await fetch(url, options);
        const status = res.status;
        const text = await res.text();
        const trimmed = text.trim();

        if (!res.ok) {
            console.error(`[HB_FETCH_ERR] Status: ${status} | URL: ${url} | Res: ${trimmed.substring(0, 200)}`);
            return { data: null, status, raw: trimmed };
        }

        if (trimmed === 'OK') {
            console.log(`[HB_PROXY] Received OK busy signal, retrying in 2s...`);
            await new Promise(r => setTimeout(r, 2000));
            const res2 = await fetch(url, options);
            const text2 = await res2.text();
            if (!res2.ok) return { data: null, status: res2.status, raw: text2 };
            return { data: JSON.parse(text2), status: res2.status };
        }

        try {
            return { data: JSON.parse(trimmed), status };
        } catch (e: any) {
            console.error(`[HB_JSON_PARSE_ERR] Status: ${status} | URL: ${url} | Body: ${trimmed.substring(0, 100)}`);
            return { data: null, status, raw: trimmed };
        }
    }

    async getCargoLabel(packageNumber: string): Promise<{ pdfBase64?: string; error?: string; status?: number; rawBody?: string }> {
        try {
            const merchantId = (this.config.merchantId || '').trim();
            const url = `${this.baseUrl}/packages/merchantid/${merchantId}/packagenumber/${packageNumber}/labels?format=PDF`;

            const headers = this.getHeaders({
                'Accept': '*/*, application/pdf, application/json'
            });

            console.log(`[HB_LABEL_REQ] URL: ${url}`);

            const res = await fetch(url, { headers });
            const status = res.status;
            const contentType = (res.headers.get('content-type') || '').toLowerCase();

            console.log(`[HB_LABEL_RES] Status: ${status} | Type: ${contentType}`);

            if (res.ok) {
                if (contentType.includes('pdf') || contentType === 'application/octet-stream') {
                    const arrayBuffer = await res.arrayBuffer();
                    const pdfBase64 = Buffer.from(arrayBuffer).toString('base64');
                    return { pdfBase64, status };
                } else if (contentType.includes('json')) {
                    const data = await res.json();
                    if (data?.pdfData) return { pdfBase64: data.pdfData, status };
                    if (data?.base64) return { pdfBase64: data.base64, status };
                    if (typeof data?.data === 'string' && data.data.length > 500) return { pdfBase64: data.data, status };
                    return { error: 'HB JSON döndürdü fakat etiket bulunamadı.', status };
                }

                const buffer = await res.arrayBuffer();
                const text = Buffer.from(buffer).toString('utf8');
                if (text.substring(0, 4) === '%PDF') {
                    return { pdfBase64: Buffer.from(buffer).toString('base64'), status };
                }
                return { error: `Desteklenmeyen içerik: ${contentType}`, status };
            } else {
                const text = await res.text();
                console.error(`[HB_LABEL_FAIL] Status: ${status} | URL: ${url} | Body: ${text.substring(0, 200)}`);
                return {
                    error: `HB API Hatası (${status}): ${text.substring(0, 100)}`,
                    status,
                    rawBody: text
                };
            }
        } catch (err: any) {
            console.error(`[HB_LABEL_ERR] pkg: ${packageNumber}`, err);
            return { error: err.message || 'Hepsiburada etiket bağlantı hatası' };
        }
    }

    private hbDateYmdHi(d: Date) {
        const pad = (n: number) => String(n).padStart(2, "0");
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
        x.setHours(23, 59, 59, 999);
        return x;
    }

    async getOrders(startDate?: Date, endDate?: Date): Promise<MarketplaceOrder[]> {
        const allOrdersMap = new Map<string, MarketplaceOrder>();
        const merchantId = (this.config.merchantId || '').trim();
        const begin = startDate || new Date(Date.now() - 1000 * 60 * 60 * 24 * 30);
        const end = endDate || new Date();

        const bStr = this.hbDateYmdHi(this.startOfDay(begin));
        const eStr = this.hbDateYmdHi(this.endOfDay(end));

        const syncTargets = [
            { name: 'UNPACKED', urlPart: `orders/merchantid/${merchantId}`, params: ['limit'] },
            { name: 'PACKED', urlPart: `packages/merchantid/${merchantId}/packed`, params: ['limit'] },
            { name: 'SHIPPED', urlPart: `packages/merchantid/${merchantId}/shipped`, params: ['begindate', 'enddate'] },
            { name: 'DELIVERED', urlPart: `packages/merchantid/${merchantId}/delivered`, params: ['begindate', 'enddate'] },
            { name: 'CANCELLED', urlPart: `orders/merchantid/${merchantId}/cancelled`, params: ['begindate', 'enddate'] }
        ];

        for (const target of syncTargets) {
            let offset = 0;
            const limit = 50;
            let hasMore = true;

            while (hasMore) {
                try {
                    const qs = new URLSearchParams();
                    if (target.params.includes('limit')) qs.set('limit', String(limit));
                    if (target.params.includes('offset')) qs.set('offset', String(offset));
                    if (target.params.includes('begindate')) qs.set('begindate', bStr);
                    if (target.params.includes('enddate')) qs.set('enddate', eStr);

                    const url = `${this.baseUrl}/${target.urlPart}?${qs.toString()}`;
                    const response = await this.safeFetchJson(url, { headers: this.getHeaders() });
                    if (!response.data) {
                        hasMore = false;
                        break;
                    }

                    const data = response.data;
                    let items: any[] = [];
                    if (Array.isArray(data)) items = data;
                    else if (data && typeof data === 'object') {
                        items = data.items || data.data || data.packages || data.orders || (data.id || data.orderNumber ? [data] : []);
                    }

                    if (items.length === 0) {
                        hasMore = false;
                        break;
                    }

                    for (const item of items) {
                        const mapped = this.mapOrder(item, target.name);
                        const key = mapped.id || mapped.orderNumber;
                        if (key && key !== 'unknown') allOrdersMap.set(key, mapped);
                    }

                    if (items.length < limit || !target.params.includes('offset')) hasMore = false;
                    else offset += limit;

                    if (hasMore) await new Promise(r => setTimeout(r, 200));
                } catch (err: any) {
                    console.error(`[HB_SYNC_ERR] ${target.name}: ${err.message}`);
                    hasMore = false;
                }
            }
        }

        return Array.from(allOrdersMap.values());
    }

    async getOrderByNumber(orderNumber: string): Promise<MarketplaceOrder | null> {
        try {
            const merchantId = (this.config.merchantId || '').trim();
            const url = `${this.baseUrl}/orders/merchantid/${merchantId}/ordernumber/${orderNumber}`;
            const response = await this.safeFetchJson(url, { headers: this.getHeaders() });
            if (!response.data) return null;
            return this.mapOrder(response.data, 'UNKNOWN');
        } catch (err) {
            console.error(`[HB_ORDER_ERR] ${orderNumber}:`, err);
            return null;
        }
    }

    async getPackageByOrderNumber(orderNumber: string): Promise<any> {
        try {
            const merchantId = (this.config.merchantId || '').trim();
            const url = `${this.baseUrl}/packages/merchantid/${merchantId}/ordernumber/${orderNumber}`;
            console.log(`[HB_PKG_BY_ORDER_REQ] Order: ${orderNumber} | URL: ${url}`);
            const response = await this.safeFetchJson(url, { headers: this.getHeaders() });
            return response.data;
        } catch (err) {
            console.error(`[HB_PKG_BY_ORDER_ERR] Order: ${orderNumber}:`, err);
            return null;
        }
    }

    private mapOrder(hbOrder: any, fallbackStatus: string): MarketplaceOrder {
        try {
            const rawStatus = hbOrder.status || hbOrder.orderStatus || hbOrder.cargoStatus || fallbackStatus;
            let rawLines = hbOrder.items || hbOrder.PackageItems || hbOrder.orderLines || hbOrder.lines || hbOrder.packageItems || [];

            if ((!Array.isArray(rawLines) || rawLines.length === 0) && (hbOrder.data)) {
                rawLines = hbOrder.data.items || hbOrder.data.lines || hbOrder.data.packageItems || [];
            }

            const orderNo = hbOrder.orderNumber || hbOrder.OrderNumber || (Array.isArray(hbOrder.OrderNumbers) ? hbOrder.OrderNumbers[0] : null) || hbOrder.packageNumber || hbOrder.id || 'unknown';
            const orderItems = Array.isArray(rawLines) ? rawLines : [];

            let shipmentPackageId = (hbOrder.packageNumber || hbOrder.shipmentPackageId || hbOrder.id)?.toString();
            if (!shipmentPackageId || shipmentPackageId === orderNo.toString()) {
                const firstWithPkg = orderItems.find(i => i.packageNumber || i.PackageNumber);
                if (firstWithPkg) shipmentPackageId = (firstWithPkg.packageNumber || firstWithPkg.PackageNumber).toString();
            }

            return {
                id: (hbOrder.id || orderNo || 'unknown').toString(),
                orderNumber: orderNo.toString(),
                customerName: hbOrder.customer?.name || hbOrder.customerName || hbOrder.billingAddress?.fullName || 'Müşteri',
                customerEmail: hbOrder.customer?.email || '',
                orderDate: new Date(hbOrder.orderDate || hbOrder.issueDate || Date.now()),
                status: rawStatus.toString().toUpperCase(),
                totalAmount: Number(hbOrder.totalPrice?.amount || hbOrder.totalAmount || 0),
                currency: hbOrder.totalPrice?.currency || hbOrder.currency || 'TRY',
                shipmentPackageId: shipmentPackageId,
                shippingAddress: {
                    fullName: hbOrder.shippingAddress?.fullName || hbOrder.customerName || '',
                    address: hbOrder.shippingAddress?.address || '',
                    city: hbOrder.shippingAddress?.city || '',
                    district: hbOrder.shippingAddress?.town || '',
                    phone: hbOrder.shippingAddress?.phoneNumber || ''
                },
                invoiceAddress: {
                    fullName: hbOrder.billingAddress?.fullName || hbOrder.customerName || '',
                    address: hbOrder.billingAddress?.address || '',
                    city: hbOrder.billingAddress?.city || '',
                    district: hbOrder.billingAddress?.town || '',
                    phone: hbOrder.billingAddress?.phoneNumber || ''
                },
                items: orderItems.map((item: any) => ({
                    productName: item.productName || item.name || item.skuDescription || 'Ürün',
                    sku: item.sku || item.merchantSku || 'SKU',
                    quantity: Number(item.quantity || 1),
                    price: Number(item.totalPrice?.amount || item.unitPrice?.amount || item.price || 0),
                    taxRate: Number(item.taxRate || 20),
                    discountAmount: Number(item.discountAmount || 0)
                }))
            };
        } catch (err) {
            console.error('[HB_MAP_ERR]', hbOrder?.id, err);
            return {
                id: 'err', orderNumber: 'err', customerName: 'Error', customerEmail: '', orderDate: new Date(),
                status: 'MAPPING_ERROR', totalAmount: 0, currency: 'TRY',
                shippingAddress: { fullName: '', address: '', city: '', district: '', phone: '' },
                invoiceAddress: { fullName: '', address: '', city: '', district: '', phone: '' },
                items: []
            };
        }
    }
}
