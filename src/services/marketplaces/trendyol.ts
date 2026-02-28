import { IMarketplaceService, MarketplaceOrder, TrendyolConfig } from './types';

export class TrendyolService implements IMarketplaceService {
    private config: TrendyolConfig;
    private baseUrl: string;

    constructor(config: TrendyolConfig) {
        this.config = config;
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
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 25000);
                res = await fetch(url, { ...options, signal: controller.signal });
                clearTimeout(timeoutId);
            } catch (err: any) {
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

            if (trimmed === 'OK') {
                if (attempt < maxAttempts) {
                    const delay = baseDelayMs * Math.pow(1.5, attempt - 1);
                    console.log(`[TRENDYOL_PROXY] Received 'OK' busy signal (attempt ${attempt}/${maxAttempts}), retrying in ${Math.round(delay)}ms...`);
                    await new Promise(r => setTimeout(r, delay));
                    continue;
                }
                throw new Error(`Trendyol Proxy meşgul (Sürekli 'OK' dönüyor).`);
            }

            if (!res.ok) {
                throw new Error(`Trendyol API Hatası: ${res.status} - ${trimmed.substring(0, 300)}`);
            }

            try {
                return { data: JSON.parse(trimmed), status: res.status };
            } catch (e) {
                throw new Error(`Trendyol yanıtı okunamadı (JSON bekleniyordu).`);
            }
        }
        throw new Error('Trendyol fetch failed');
    }

    private getProxyKeyHeader(): string {
        return (process.env.PERIODYA_PROXY_KEY || '').trim();
    }

    private getHeaders(extra: Record<string, string> = {}): Record<string, string> {
        const headers: any = {
            'Authorization': this.getAuthHeader(),
            'User-Agent': `${this.config.supplierId} - SelfIntegration`,
            'x-agentname': `${this.config.supplierId} - SelfIntegration`,
            'Accept': 'application/json, application/pdf',
            'Content-Type': 'application/json',
            ...extra
        };
        const proxyKey = this.getProxyKeyHeader();
        if (proxyKey) headers['X-Periodya-Key'] = proxyKey;
        return headers;
    }

    async validateConnection(): Promise<boolean> {
        try {
            const url = `${this.baseUrl}/integration/order/sellers/${this.config.supplierId}/orders?size=1`;
            const effectiveProxy = (process.env.MARKETPLACE_PROXY_URL || '').trim();
            const fetchUrl = effectiveProxy ? `${effectiveProxy}?url=${encodeURIComponent(url)}` : url;
            const response = await this.safeFetchJson(fetchUrl, { headers: this.getHeaders() });
            return !!response.data;
        } catch {
            return false;
        }
    }

    async updateCargoProvider(shipmentPackageId: string, cargoProviderCode: string): Promise<{ success: boolean; error?: string }> {
        try {
            const url = `${this.baseUrl}/integration/order/sellers/${this.config.supplierId}/shipment-packages/${shipmentPackageId}/cargo-providers`;
            const effectiveProxy = (process.env.MARKETPLACE_PROXY_URL || '').trim();
            const fetchUrl = effectiveProxy ? `${effectiveProxy}?url=${encodeURIComponent(url)}` : url;
            const response = await fetch(fetchUrl, { method: 'PUT', headers: this.getHeaders(), body: JSON.stringify({ cargoProvider: cargoProviderCode }) });
            if (!response.ok) return { success: false, error: await response.text() };
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    async updateShipmentPackageStatus(shipmentPackageId: string, status: 'Picking' | 'Invoiced'): Promise<{ success: boolean; error?: string }> {
        try {
            const url = `${this.baseUrl}/integration/order/sellers/${this.config.supplierId}/shipment-packages/${shipmentPackageId}`;
            const effectiveProxy = (process.env.MARKETPLACE_PROXY_URL || '').trim();
            const fetchUrl = effectiveProxy ? `${effectiveProxy}?url=${encodeURIComponent(url)}` : url;
            const response = await fetch(fetchUrl, { method: 'PUT', headers: this.getHeaders(), body: JSON.stringify({ status }) });
            if (!response.ok) return { success: false, error: await response.text() };
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    async createCommonLabelRequest(shipmentPackageId: string, cargoTrackingNumber: string): Promise<{ success: boolean; status?: number; body?: string; error?: string; fullResponse?: string }> {
        try {
            const url = `${this.baseUrl}/integration/sellers/${this.config.supplierId}/common-label/${cargoTrackingNumber}`;
            const effectiveProxy = (process.env.MARKETPLACE_PROXY_URL || '').trim();
            const fetchUrl = effectiveProxy ? `${effectiveProxy}?url=${encodeURIComponent(url)}` : url;
            const body = JSON.stringify({
                format: 'ZPL',
                boxQuantity: 5,
                volumetricHeight: 3.5
            });
            console.log(`[TRENDYOL-DEBUG] POST Request: ${url} | Body: ${body}`);
            const response = await fetch(fetchUrl, { method: 'POST', headers: this.getHeaders(), body });
            const responseText = await response.text();
            console.log(`[TRENDYOL-DEBUG] POST Response: ${response.status} | Body Snippet: ${responseText.substring(0, 200)}`);
            if (!response.ok) return { success: false, status: response.status, body: responseText, error: responseText, fullResponse: responseText };
            return { success: true, status: response.status, body: responseText, fullResponse: responseText };
        } catch (error: any) {
            console.error('Trendyol createCommonLabelRequest error:', error);
            return { success: false, error: error.message };
        }
    }

    async getCommonLabel(shipmentPackageId: string, format: 'A4' | 'ZPL' = 'A4'): Promise<{
        status: 'SUCCESS' | 'PENDING' | 'FAILED';
        pdfBase64?: string;
        zpl?: string;
        error?: string;
        httpStatus?: number;
        __debugTimeline?: any;
        __debugErrorObject?: any;
    }> {
        const ctx = `[TRENDYOL-LABEL][pkg:${shipmentPackageId}]`;
        try {
            // 1) Fetch Official Metadata from Trendyol
            const pkg = await this.getShipmentPackageDetails(shipmentPackageId);
            const cargoProviderName = pkg.cargoProviderName || '';
            const cargoProvider = cargoProviderName.toLowerCase();
            const status = pkg.shipmentPackageStatus;
            const trackingNo = pkg.cargoTrackingNumber ? String(pkg.cargoTrackingNumber) : null;

            // Debugging object to collect all raw API data
            const fullDebugTimeline: any = {
                step1_packageDetails: pkg,
            };

            console.info(`${ctx} Processing: carrier="${cargoProvider}", status="${status}", trk="${trackingNo}"`);

            // 2) Skip local hardcoded restrictions and let the Trendyol API decide.
            // Many legacy/different configurations might work with the PDF fallback even if they don't look valid locally.
            if (!trackingNo) {
                // If there's no tracking number, we can't create a ZPL label. We'll skip straight to the PDF fallback later.
                console.warn(`${ctx} No tracking number found, will skip ZPL and try PDF fallback directly.`);
            }

            let labels: string[] = [];
            const getUrl = `${this.baseUrl}/integration/sellers/${this.config.supplierId}/common-label/${trackingNo}`;
            const effectiveProxy = (process.env.MARKETPLACE_PROXY_URL || '').trim();
            const fetchUrl = effectiveProxy ? `${effectiveProxy}?url=${encodeURIComponent(getUrl)}` : getUrl;

            // 3) INITIAL GET: CHECK IF LABEL ALREADY EXISTS (Prevents 400 INVALID_STATUS for Shipped/Delivered packages)
            if (trackingNo) {
                console.log(`${ctx} Checking existing ZPL label via GET...`);
                const initialGet = await fetch(fetchUrl, { headers: this.getHeaders({ 'Accept': 'application/json' }) });
                if (initialGet.ok) {
                    const bodyText = await initialGet.text();
                    try {
                        const json = JSON.parse(bodyText);
                        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
                            labels = json.data
                                .filter((d: any) => !d.format || d.format === 'ZPL')
                                .map((d: any) => d.label)
                                .filter(Boolean);
                            if (labels.length > 0) {
                                console.log(`${ctx} Found existing ZPL label. Skipping POST generation.`);
                            }
                        }
                    } catch { }
                }
            }

            // 4) IF NOT FOUND, POST (Create Request) AND POLL
            let lastPollBody = '';
            let lastPollStatus = 0;
            fullDebugTimeline.step3_pollingAttempts = [];

            if (labels.length === 0) {
                let postResult: { success: boolean, status?: number, body?: string, error?: string } = { success: false, status: 0, body: '', error: 'No Tracking Number' };
                if (trackingNo) {
                    postResult = await this.createCommonLabelRequest(shipmentPackageId, trackingNo);
                }

                fullDebugTimeline.step2_createLabelPost = {
                    status: postResult.status,
                    success: postResult.success,
                    body: postResult.body || postResult.error
                };

                if (!postResult.success) {
                    throw new Error(`ZPL Generate Request Failed: ${postResult.status}`);
                }

                const schedule = [1000, 2000, 3000, 5000, 8000, 10000];
                for (let i = 0; i < schedule.length; i++) {
                    await new Promise(r => setTimeout(r, schedule[i]));
                    console.log(`${ctx} Poll Attempt ${i + 1}/${schedule.length}...`);

                    const response = await fetch(fetchUrl, { headers: this.getHeaders({ 'Accept': 'application/json' }) });
                    const bodyText = await response.text();
                    lastPollStatus = response.status;
                    lastPollBody = bodyText;

                    fullDebugTimeline.step3_pollingAttempts.push({
                        attempt: i + 1,
                        status: response.status,
                        body: bodyText
                    });

                    if (response.ok && bodyText !== 'OK') {
                        try {
                            const json = JSON.parse(bodyText);
                            if (json.data && Array.isArray(json.data) && json.data.length > 0) {
                                labels = json.data
                                    .filter((d: any) => !d.format || d.format === 'ZPL')
                                    .map((d: any) => d.label)
                                    .filter(Boolean);
                                if (labels.length > 0) break;
                            }
                        } catch { }
                    }

                    if (response.status === 400 && bodyText.includes('COMMON_LABEL_NOT_ALLOWED')) {
                        throw new Error("Trendyol: Ortak barkod oluşturma izni reddedildi (NOT_ALLOWED).");
                    }
                }
            }

            if (labels.length === 0) {
                // If polling also failed, we just throw to trigger the fallback block below
                throw new Error("Polling ZPL labels timeout");
            }

            const combinedZpl = labels.join('\n');

            if (format === 'ZPL') {
                return {
                    status: 'SUCCESS',
                    zpl: combinedZpl,
                    httpStatus: 200
                };
            }

            // 5) Convert ZPL -> A4 PDF
            console.info(`${ctx} ZPL retrieved. Converting to PDF...`);
            const pdfResult = await this.convertZplToPdf(combinedZpl);

            if (!pdfResult.buffer) {
                return { status: 'FAILED', error: `ZPL etiketi PDF formatına dönüştürülemedi: ${pdfResult.error}` };
            }

            // Return success with debug payload containing all steps
            return {
                status: 'SUCCESS',
                pdfBase64: pdfResult.buffer.toString('base64'),
                httpStatus: 200,
                ...(fullDebugTimeline && { __debugTimeline: fullDebugTimeline })
            };
        } catch (error: any) {
            console.error(`${ctx} Error or Fallback Triggered:`, error);
            // IF ANY OF THE ABOVE ERROR OUT, FALLBACK TO NORMAL LABEL!

            console.warn(`${ctx} Falling back to integrated (standard) label endpoint...`);
            const fallback = await this.getIntegratedLabel(shipmentPackageId);

            if (fallback.success) {
                return {
                    status: 'SUCCESS',
                    pdfBase64: fallback.pdfBase64,
                    httpStatus: 200,
                    error: format === 'ZPL' ? "Trendyol Ortak ZPL barkod hatası. Standart PDF barkoduna geri dönüldü." : undefined
                };
            }

            return {
                status: 'FAILED',
                error: `Trendyol API Hatası: İletmiş olduğunuz paketin durumunu kontrol ediniz.\n\nStandart barkod denemesi (Fallback) de başarısız oldu: ${fallback.error || 'Bilinmeyen Hata'}`,
                __debugErrorObject: error.message
            };
        }
    }

    private async convertZplToPdf(zpl: string): Promise<{ buffer?: Buffer, error?: string }> {
        try {
            // Chrome cache yüzünden eski PDF görünmüş olabilir. 
            // ^PON komutu ekrana düz basılmasını sağlar.
            const correctedZpl = zpl.replace(/\^POI/g, '^PON').replace(/\^FWN,0/g, '^FWN');

            const url = 'https://api.labelary.com/v1/printers/8dpmm/labels/4x6/0/';
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Accept': 'application/pdf',
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: correctedZpl
            });

            if (res.ok) {
                return { buffer: Buffer.from(await res.arrayBuffer()) };
            }

            const errText = await res.text().catch(() => 'No text returned');
            console.error(`Labelary Error [${res.status}]: ${errText}`);
            return { error: `Labelary API [${res.status}]: ${errText}` };
        } catch (e: any) {
            console.error(`Labelary Catch Error:`, e);
            return { error: `Bağlantı Hatası: ${e.message}` };
        }
    }

    async getIntegratedLabel(shipmentPackageId: string): Promise<{ success: boolean; pdfBase64?: string; error?: string }> {
        try {
            const url = `${this.baseUrl}/integration/sellers/${this.config.supplierId}/labels?shipmentPackageIds=${shipmentPackageId}`;
            const effectiveProxy = (process.env.MARKETPLACE_PROXY_URL || '').trim();
            const fetchUrl = effectiveProxy ? `${effectiveProxy}?url=${encodeURIComponent(url)}` : url;
            const response = await fetch(fetchUrl, { headers: this.getHeaders({ 'Accept': 'application/pdf' }) });
            if (!response.ok) return { success: false, error: await response.text() };
            const buffer = await response.arrayBuffer();
            return { success: true, pdfBase64: Buffer.from(buffer).toString('base64') };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    async getShipmentPackageDetails(shipmentPackageId: string): Promise<any> {
        const url = `${this.baseUrl}/integration/order/sellers/${this.config.supplierId}/orders?shipmentPackageIds=${shipmentPackageId}`;
        const effectiveProxy = (process.env.MARKETPLACE_PROXY_URL || '').trim();
        const fetchUrl = effectiveProxy ? `${effectiveProxy}?url=${encodeURIComponent(url)}` : url;
        const response = await this.safeFetchJson(fetchUrl, { headers: this.getHeaders({ 'Accept-Language': 'tr-TR' }) });
        if (response.data?.content?.[0]) return response.data.content[0];
        throw new Error('Paket detayları alınamadı.');
    }

    async getOrders(startDate?: Date, endDate?: Date): Promise<MarketplaceOrder[]> {
        try {
            const queryParams = new URLSearchParams();
            queryParams.append('orderByField', 'PackageLastModifiedDate');
            queryParams.append('orderByDirection', 'DESC');
            queryParams.append('size', '50');
            if (startDate) queryParams.append('startDate', startDate.getTime().toString());
            if (endDate) queryParams.append('endDate', endDate.getTime().toString());
            if (!startDate && !endDate) {
                const twoDaysAgo = new Date();
                twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
                queryParams.append('startDate', twoDaysAgo.getTime().toString());
            }
            const url = `${this.baseUrl}/integration/order/sellers/${this.config.supplierId}/orders?${queryParams.toString()}`;
            const effectiveProxy = (process.env.MARKETPLACE_PROXY_URL || '').trim();
            const fetchUrl = effectiveProxy ? `${effectiveProxy}?url=${encodeURIComponent(url)}` : url;
            const response = await this.safeFetchJson(fetchUrl, { headers: this.getHeaders() });
            return (response.data.content || []).map((order: any) => this.mapOrder(order));
        } catch (error) {
            console.error('Sipariş çekme hatası:', error);
            throw error;
        }
    }

    async getOrderByNumber(orderNumber: string): Promise<MarketplaceOrder | null> {
        try {
            const url = `${this.baseUrl}/integration/order/sellers/${this.config.supplierId}/orders?orderNumber=${encodeURIComponent(orderNumber)}`;
            const effectiveProxy = (process.env.MARKETPLACE_PROXY_URL || '').trim();
            const fetchUrl = effectiveProxy ? `${effectiveProxy}?url=${encodeURIComponent(url)}` : url;
            const response = await this.safeFetchJson(fetchUrl, { headers: this.getHeaders() });
            return response.data.content?.[0] ? this.mapOrder(response.data.content[0]) : null;
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
                taxRate: line.vatRate || 0,
                discountAmount: line.discountAmount
            }))
        };
    }
}
