import { IMarketplaceService, MarketplaceOrder, TrendyolConfig } from './types';

export class TrendyolService implements IMarketplaceService {
    private config: TrendyolConfig;
    private baseUrl: string;

    constructor(config: TrendyolConfig) {
        this.config = config;
        // OFFICIAL: Using apigw.trendyol.com per developer docs
        // Recommendation: Use stageapigw for test
        this.baseUrl = config.isTest
            ? 'https://stageapigw.trendyol.com'
            : 'https://apigw.trendyol.com';
    }

    private getAuthHeader(): string {
        const authString = `${this.config.apiKey}:${this.config.apiSecret}`;
        return `Basic ${Buffer.from(authString).toString('base64')}`;
    }

    private async safeFetchJson(url: string, options: any = {}): Promise<{ data: any; status: number }> {
        const maxAttempts = 5;
        const baseDelayMs = 2000;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            let res: Response;
            try {
                // Timeout logic wrapper
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 25000);
                res = await fetch(url, { ...options, signal: controller.signal });
                clearTimeout(timeoutId);
            } catch (err: any) {
                // Network/Timeout error handling
                if (attempt < maxAttempts) {
                    const delay = baseDelayMs * Math.pow(1.5, attempt - 1);
                    console.log(`[TRENDYOL_PROXY] Network error (attempt ${attempt}/${maxAttempts}), retrying in ${Math.round(delay)}ms...`);
                    await new Promise(r => setTimeout(r, delay));
                    continue;
                }
                throw new Error(`Trendyol fetch failed (network): ${err.message}`);
            }

            const text = await res.text();
            const trimmed = text.trim();

            // 1. Handle Proxy "OK" (Busy/Pending) Signal
            if (trimmed === 'OK') {
                if (attempt < maxAttempts) {
                    const delay = baseDelayMs * Math.pow(1.5, attempt - 1);
                    console.log(`[TRENDYOL_PROXY] Received 'OK' busy signal (attempt ${attempt}/${maxAttempts}), retrying in ${Math.round(delay)}ms...`);
                    await new Promise(r => setTimeout(r, delay));
                    continue;
                }
                throw new Error(`Trendyol Proxy meşgul (Sürekli 'OK' dönüyor). Lütfen daha sonra tekrar deneyin.`);
            }

            // 2. Handle HTTP Errors
            if (!res.ok) {
                // Use a standard error object, avoiding 'statusCode' reference errors
                throw new Error(`Trendyol API Hatası: ${res.status} - ${trimmed.substring(0, 300)}`);
            }

            // 3. Handle JSON Parsing
            try {
                return { data: JSON.parse(trimmed), status: res.status };
            } catch (e) {
                // If it's not JSON (e.g. HTML error page from proxy/gateway)
                throw new Error(`Trendyol yanıtı okunamadı (JSON bekleniyordu). İlk 100 karakter: ${trimmed.substring(0, 100)}`);
            }
        }

        throw new Error('Trendyol fetch failed (Unknown logic error)');
    }

    private getProxyKeyHeader(): string {
        return (process.env.PERIODYA_PROXY_KEY || '').trim();
    }

    private getHeaders(extra: Record<string, string> = {}): Record<string, string> {
        const headers: any = {
            'Authorization': this.getAuthHeader(),
            'User-Agent': `${this.config.supplierId} - SelfIntegration`,
            'x-agentname': `${this.config.supplierId} - SelfIntegration`, // Mandatory per some Trendyol docs
            'Accept': 'application/json, application/pdf', // Default to both
            'Content-Type': 'application/json',
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
            // Updated to recommended V2 endpoint
            const url = `${this.baseUrl}/integration/order/sellers/${this.config.supplierId}/orders?size=1`;
            const effectiveProxy = (process.env.MARKETPLACE_PROXY_URL || '').trim();
            const fetchUrl = effectiveProxy ? `${effectiveProxy}?url=${encodeURIComponent(url)}` : url;

            const response = await this.safeFetchJson(fetchUrl, {
                headers: this.getHeaders()
            });

            return !!response.data;
        } catch (error) {
            console.error('Trendyol bağlantı hatası:', error);
            return false;
        }
    }

    async updateCargoProvider(shipmentPackageId: string, cargoProviderCode: string): Promise<{ success: boolean; error?: string }> {
        try {
            const url = `${this.baseUrl}/integration/order/sellers/${this.config.supplierId}/shipment-packages/${shipmentPackageId}/cargo-providers`;
            const effectiveProxy = (process.env.MARKETPLACE_PROXY_URL || '').trim();
            const fetchUrl = effectiveProxy ? `${effectiveProxy}?url=${encodeURIComponent(url)}` : url;

            const response = await fetch(fetchUrl, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify({ cargoProvider: cargoProviderCode })
            });

            if (!response.ok) {
                const errorText = await response.text();
                return { success: false, error: errorText };
            }

            return { success: true };
        } catch (error: any) {
            console.error('Trendyol kargo güncelleme hatası:', error);
            return { success: false, error: error.message || 'Bağlantı hatası' };
        }
    }

    async updateShipmentPackageStatus(shipmentPackageId: string, status: 'Picking' | 'Invoiced'): Promise<{ success: boolean; error?: string }> {
        try {
            const url = `${this.baseUrl}/integration/order/sellers/${this.config.supplierId}/shipment-packages/${shipmentPackageId}`;
            const effectiveProxy = (process.env.MARKETPLACE_PROXY_URL || '').trim();
            const fetchUrl = effectiveProxy ? `${effectiveProxy}?url=${encodeURIComponent(url)}` : url;

            const response = await fetch(fetchUrl, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify({ status })
            });

            if (!response.ok) {
                const errorText = await response.text();
                return { success: false, error: errorText };
            }

            return { success: true };
        } catch (error: any) {
            console.error('Trendyol paket statü güncelleme hatası:', error);
            return { success: false, error: error.message || 'Bağlantı hatası' };
        }
    }

    async createCommonLabelRequest(shipmentPackageId: string, cargoTrackingNumber: string, format: 'ZPL' | 'PDF' = 'ZPL'): Promise<{ success: boolean; status?: number; body?: string; error?: string }> {
        try {
            const url = `${this.baseUrl}/integration/sellers/${this.config.supplierId}/common-label/${cargoTrackingNumber}`;
            const effectiveProxy = (process.env.MARKETPLACE_PROXY_URL || '').trim();
            const fetchUrl = effectiveProxy ? `${effectiveProxy}?url=${encodeURIComponent(url)}` : url;
            const body = JSON.stringify({ format, boxQuantity: 1 });

            console.log(`[TRENDYOL-DEBUG] POST Request: ${url} | Body: ${body}`);

            const response = await fetch(fetchUrl, {
                method: 'POST',
                headers: this.getHeaders(),
                body
            });

            const responseText = await response.text();
            console.log(`[TRENDYOL-DEBUG] POST Response: ${response.status} | Body Snippet: ${responseText.substring(0, 200)}`);

            if (!response.ok) {
                return { success: false, status: response.status, body: responseText, error: responseText };
            }

            return { success: true, status: response.status, body: responseText };
        } catch (error: any) {
            console.error('Trendyol common-label request error:', error);
            return { success: false, error: error.message };
        }
    }

    async getCommonLabel(shipmentPackageId: string, cargoTrackingNumber?: string): Promise<{
        status: 'SUCCESS' | 'PENDING' | 'FAILED' | 'REDIRECT_REQUIRED';
        pdfBase64?: string;
        error?: string;
        redirectUrl?: string;
        message?: string;
        httpStatus?: number;
        raw?: any;
    }> {
        try {
            const supplierId = this.config.supplierId;
            const effectiveProxy = (process.env.MARKETPLACE_PROXY_URL || '').trim();

            const pkg = await this.getShipmentPackageDetails(shipmentPackageId);
            const provider = (pkg.cargoProviderName || '').toLowerCase();
            const status = pkg.shipmentPackageStatus;
            let deliveryModel = pkg.deliveryModel;
            const trackingNo = pkg.cargoTrackingNumber || cargoTrackingNumber;

            // Debug initial state
            console.log(`[TRENDYOL-STRATEGY] pkg=${shipmentPackageId}, trk=${trackingNo}, carrier="${provider}", model="${deliveryModel || 'unknown'}", status="${status}"`);

            if (!trackingNo) {
                return { status: 'FAILED', error: "Kargo takip numarası henüz oluşmamış. Lütfen önce siparişi onaylayıp kargo numarası oluşmasını bekleyin." };
            }

            // Decision Grid (Based on Doc)
            const isTEX = provider.includes('tex') || provider.includes('trendyol express');
            const isAras = provider.includes('aras');
            // If model is missing but carrier contains "marketplace", it is VERY likely Trendyol-Paid
            const isLikelyPaid = deliveryModel === 'Trendyol-Paid' || (provider.includes('marketplace') && !deliveryModel);

            // If carrier is not eligible OR it is explicitly "Satıcı Öder", fallback to Panel
            if ((!isTEX && !isAras) || (deliveryModel && deliveryModel !== 'Trendyol-Paid')) {
                return {
                    status: 'REDIRECT_REQUIRED',
                    message: `Bu gönderi tipi (Kargo: ${provider}, Model: ${deliveryModel || 'Harici'}) sistem üzerinden etiketlenemiyor. Lütfen panelden yazdırın.`,
                    redirectUrl: `https://partner.trendyol.com/orders/all?orderNumber=${pkg.orderNumber}`
                };
            }

            // --- COMMON LABEL FLOW ---

            // a) Ensure Status (Recommended: Picking)
            if (status === 'Created') {
                console.log(`[TRENDYOL-STRATEGY] Promoting status to Picking...`);
                await this.updateShipmentPackageStatus(shipmentPackageId, 'Picking');
            }

            // b) Trigger Label (POST)
            const triggerRes = await this.createCommonLabelRequest(shipmentPackageId, trackingNo, 'ZPL');

            // If POST fails with 400 NOT_ALLOWED, redirect immediately
            if (!triggerRes.success && triggerRes.status === 400 && triggerRes.body?.includes('COMMON_LABEL_NOT_ALLOWED')) {
                console.log(`[TRENDYOL-STRATEGY] POST returned NOT_ALLOWED. Redirecting...`);
                return {
                    status: 'REDIRECT_REQUIRED',
                    message: "Bu paket ortak barkod sürecine dahil değil. Lütfen panel üzerinden yazdırın.",
                    redirectUrl: `https://partner.trendyol.com/orders/all?orderNumber=${pkg.orderNumber}`
                };
            }

            // c) Retrieval (GET)
            const getUrl = `${this.baseUrl}/integration/sellers/${supplierId}/common-label/${trackingNo}`;
            const fetchGetUrl = effectiveProxy ? `${effectiveProxy}?url=${encodeURIComponent(getUrl)}` : getUrl;

            console.log(`[TRENDYOL-DEBUG] GET Request: ${getUrl}`);
            const res = await fetch(fetchGetUrl, { headers: this.getHeaders({ 'Accept': 'application/json' }) });
            const body = await res.text();
            console.log(`[TRENDYOL-DEBUG] GET Response: ${res.status} | Body Snippet: ${body.substring(0, 100)}`);

            if (res.ok && body.trim() !== 'OK') {
                try {
                    const json = JSON.parse(body);
                    const labelData = json.data?.[0];
                    if (labelData?.label) {
                        if (labelData.format === 'ZPL') {
                            console.log(`[TRENDYOL-STRATEGY] Converting ZPL to PDF...`);
                            const pdfBuf = await this.convertZplToPdf(labelData.label);
                            if (pdfBuf) return { status: 'SUCCESS', pdfBase64: pdfBuf.toString('base64'), httpStatus: 200 };
                        } else if (labelData.format === 'PDF') {
                            return { status: 'SUCCESS', pdfBase64: labelData.label, httpStatus: 200 };
                        }
                    }
                } catch (e) {
                    console.error("[TRENDYOL-LABEL-PARSE-ERR]", e);
                }
            }

            // d) Handle 400 COMMON_LABEL_NOT_ALLOWED in GET
            if (res.status === 400 && body.includes('COMMON_LABEL_NOT_ALLOWED')) {
                return {
                    status: 'REDIRECT_REQUIRED',
                    message: "Bu paket ortak barkod (Common Label) sürecine dahil değil. Lütfen panel üzerinden yazdırın.",
                    redirectUrl: `https://partner.trendyol.com/orders/all?orderNumber=${pkg.orderNumber}`
                };
            }

            return {
                status: 'PENDING',
                message: "Etiket Trendyol tarafından hazırlanıyor... (Yaklaşık 15 dk sürebilir)",
                httpStatus: res.status,
                raw: body
            };

        } catch (error: any) {
            console.error(`[TRENDYOL-STRATEGY-ERR]`, error);
            return { status: 'FAILED', error: error.message };
        }
    }

    private async convertZplToPdf(zpl: string): Promise<Buffer | null> {
        try {
            // Labelary API (Open / No-key for low volume)
            const url = 'https://api.labelary.com/v1/printers/8dpmm/labels/4x6/0/';
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Accept': 'application/pdf' },
                body: zpl
            });
            if (res.ok) {
                const ab = await res.arrayBuffer();
                return Buffer.from(ab);
            }
            return null;
        } catch (e) {
            console.error('Labelary conversion failed:', e);
            return null;
        }
    }

    async getShipmentPackageDetails(shipmentPackageId: string): Promise<any> {
        // Use v2 style filtering via /orders to get delivery model and package info
        const url = `${this.baseUrl}/integration/order/sellers/${this.config.supplierId}/orders?shipmentPackageIds=${shipmentPackageId}`;
        const effectiveProxy = (process.env.MARKETPLACE_PROXY_URL || '').trim();
        const fetchUrl = effectiveProxy ? `${effectiveProxy}?url=${encodeURIComponent(url)}` : url;

        const response = await this.safeFetchJson(fetchUrl, {
            headers: this.getHeaders({ 'Accept-Language': 'tr-TR' })
        });

        if (response.data && response.data.content && response.data.content.length > 0) {
            return response.data.content[0];
        }

        throw new Error('Paket detayları Trendyol\'dan alınamadı.');
    }


    private async _fetchLabel(url: string, method: 'GET' | 'POST' = 'GET'): Promise<{
        status: 'SUCCESS' | 'PENDING' | 'FAILED';
        pdfBase64?: string;
        error?: string;
        httpStatus?: number;
        raw?: any;
    }> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        try {
            const effectiveProxy = (process.env.MARKETPLACE_PROXY_URL || '').trim();
            const fetchUrl = effectiveProxy ? `${effectiveProxy}?url=${encodeURIComponent(url)}` : url;

            console.log(`[NEW-DEBUG] Fetching (${method}): ${url}`);

            const response = await fetch(fetchUrl, {
                method,
                headers: this.getHeaders({
                    'Accept': url.includes('integration') ? 'application/json, application/pdf' : 'application/pdf'
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            const httpStatus = response.status;
            const ct = (response.headers.get("content-type") || "").toLowerCase();

            if (!response.ok) {
                const errText = await response.text();
                console.log(`[NEW-DEBUG] HTTP ${httpStatus} | ${errText.substring(0, 50)}`);
                return { status: 'FAILED', error: `Trendyol API Hatası: ${httpStatus}`, httpStatus, raw: errText };
            }

            // --- JSON RESPONSE HANDLING ---
            if (ct.includes("application/json")) {
                const json = await response.json();
                console.log(`[NEW-DEBUG] JSON Body:`, JSON.stringify(json).substring(0, 200));

                // Case A: v3 Query [ { label: "..." } ]
                if (Array.isArray(json.data) && json.data[0]?.label) {
                    return { status: 'SUCCESS', raw: json.data[0], httpStatus };
                }
                // Case B: Direct label object { label: "..." }
                if (json.label) {
                    return { status: 'SUCCESS', raw: json, httpStatus };
                }

                return { status: 'PENDING', raw: json, httpStatus };
            }

            // --- BINARY RESPONSE HANDLING ---
            const ab = await response.arrayBuffer();
            const buf = Buffer.from(ab);
            const text = buf.toString('utf-8').trim();

            if (text === 'OK') {
                console.log(`[NEW-DEBUG] Received plaintext "OK" ack.`);
                return { status: 'PENDING', httpStatus, raw: 'OK' };
            }

            // Check signature
            const isPdf = buf.subarray(0, 4).toString() === '%PDF';
            const isZpl = text.startsWith('^XA');

            if (isPdf || isZpl || buf.length > 1000) {
                console.log(`[NEW-DEBUG] Binary Success. PDF=${isPdf}, ZPL=${isZpl}, Len=${buf.length}`);
                return {
                    status: 'SUCCESS',
                    pdfBase64: buf.toString('base64'),
                    httpStatus
                };
            }

            console.log(`[NEW-DEBUG] Unknown body (len ${buf.length}): ${text.substring(0, 50)}`);
            return { status: 'PENDING', httpStatus, raw: text };

        } catch (error: any) {
            clearTimeout(timeoutId);
            console.error(`[NEW-DEBUG] Fetch Error:`, error);
            return { status: 'FAILED', error: error.message || 'Bağlantı hatası', raw: error };
        }
    }

    async getOrders(startDate?: Date, endDate?: Date): Promise<MarketplaceOrder[]> {
        try {
            const queryParams = new URLSearchParams();
            queryParams.append('orderByField', 'PackageLastModifiedDate'); // Recommended field
            queryParams.append('orderByDirection', 'DESC');
            queryParams.append('size', '50'); // Son 50 sipariş

            if (startDate) {
                queryParams.append('startDate', startDate.getTime().toString());
            }
            if (endDate) {
                queryParams.append('endDate', endDate.getTime().toString());
            }

            // Varsayılan olarak son 2 güne indirdik (Initial load azaltmak için)
            if (!startDate && !endDate) {
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(oneWeekAgo.getDate() - 2);
                queryParams.append('startDate', oneWeekAgo.getTime().toString());
            }

            // Fix: Added /integration/order/sellers/ prefix
            const url = `${this.baseUrl}/integration/order/sellers/${this.config.supplierId}/orders?${queryParams.toString()}`;
            const effectiveProxy = (process.env.MARKETPLACE_PROXY_URL || '').trim();
            const fetchUrl = effectiveProxy ? `${effectiveProxy}?url=${encodeURIComponent(url)}` : url;

            console.log('Trendyol Fetching:', url, `(Proxy: ${!!effectiveProxy})`);

            const response = await this.safeFetchJson(fetchUrl, {
                headers: this.getHeaders()
            });

            const data = response.data;

            if (!data || !data.content) {
                return [];
            }

            return data.content.map((order: any) => this.mapOrder(order));
        } catch (error) {
            console.error('Trendyol sipariş çekme hatası:', error);
            throw error;
        }
    }

    async getOrderByNumber(orderNumber: string): Promise<MarketplaceOrder | null> {
        try {
            // Fix: Added /integration/order/sellers/ prefix
            const url = `${this.baseUrl}/integration/order/sellers/${this.config.supplierId}/orders?orderNumber=${encodeURIComponent(orderNumber)}`;
            const effectiveProxy = (process.env.MARKETPLACE_PROXY_URL || '').trim();
            const fetchUrl = effectiveProxy ? `${effectiveProxy}?url=${encodeURIComponent(url)}` : url;

            const response = await this.safeFetchJson(fetchUrl, {
                headers: this.getHeaders(),
            });
            const data = response.data;
            return data.content?.[0] ? this.mapOrder(data.content[0]) : null;
        } catch {
            return null;
        }
    }

    private mapOrder(ptOrder: any): MarketplaceOrder {
        return {
            id: ptOrder.id.toString(),
            orderNumber: ptOrder.orderNumber,
            customerName: `${ptOrder.customerFirstName} ${ptOrder.customerLastName}`,
            customerEmail: ptOrder.customerEmail,
            orderDate: new Date(ptOrder.orderDate),
            status: ptOrder.status,
            totalAmount: ptOrder.totalPrice,
            currency: ptOrder.currencyCode || 'TRY',
            cargoTrackingNumber: ptOrder.cargoTrackingNumber,
            cargoTrackingLink: ptOrder.cargoTrackingLink,
            cargoProvider: ptOrder.cargoProviderName,
            // CRITICAL: Map shipmentPackageId from Trendyol API and ensure String
            shipmentPackageId: (ptOrder.shipmentPackageId || ptOrder.packageId || ptOrder.lines?.[0]?.shipmentPackageId || '').toString() || null,
            shippingAddress: {
                fullName: `${ptOrder.shipmentAddress.firstName} ${ptOrder.shipmentAddress.lastName}`,
                address: ptOrder.shipmentAddress.fullAddress,
                city: ptOrder.shipmentAddress.city,
                district: ptOrder.shipmentAddress.district,
                phone: ptOrder.shipmentAddress.phone || ''
            },
            invoiceAddress: {
                fullName: `${ptOrder.invoiceAddress.firstName} ${ptOrder.invoiceAddress.lastName}`,
                address: ptOrder.invoiceAddress.fullAddress,
                city: ptOrder.invoiceAddress.city,
                district: ptOrder.invoiceAddress.district,
                phone: ptOrder.invoiceAddress.phone || ''
            },
            items: ptOrder.lines.map((line: any) => ({
                productName: line.productName,
                sku: line.merchantSku || line.sku,
                quantity: line.quantity,
                price: line.price,
                taxRate: line.vatRate || (line.vatBaseAmount ? (line.amount / line.vatBaseAmount) * 100 : 0),
                discountAmount: line.discountAmount
            }))
        };
    }
}
