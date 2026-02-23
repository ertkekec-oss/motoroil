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

    async createCommonLabelRequest(shipmentPackageId: string, cargoTrackingNumber: string): Promise<{ success: boolean; status?: number; body?: string; error?: string }> {
        try {
            const url = `${this.baseUrl}/integration/sellers/${this.config.supplierId}/common-label/${cargoTrackingNumber}`;
            const effectiveProxy = (process.env.MARKETPLACE_PROXY_URL || '').trim();
            const fetchUrl = effectiveProxy ? `${effectiveProxy}?url=${encodeURIComponent(url)}` : url;
            const body = JSON.stringify({ format: 'ZPL' });
            console.log(`[TRENDYOL-DEBUG] POST Request: ${url} | Body: ${body}`);
            const response = await fetch(fetchUrl, { method: 'POST', headers: this.getHeaders(), body });
            const responseText = await response.text();
            console.log(`[TRENDYOL-DEBUG] POST Response: ${response.status} | Body Snippet: ${responseText.substring(0, 200)}`);
            if (!response.ok) return { success: false, status: response.status, body: responseText, error: responseText };
            return { success: true, status: response.status, body: responseText };
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
    }> {
        const ctx = `[TRENDYOL-LABEL][pkg:${shipmentPackageId}]`;
        try {
            // 1) Fetch Official Metadata from Trendyol
            const pkg = await this.getShipmentPackageDetails(shipmentPackageId);
            const cargoProviderName = pkg.cargoProviderName || '';
            const cargoProvider = cargoProviderName.toLowerCase();
            const status = pkg.shipmentPackageStatus;
            const trackingNo = pkg.cargoTrackingNumber ? String(pkg.cargoTrackingNumber) : null;

            console.info(`${ctx} Processing: carrier="${cargoProvider}", status="${status}", trk="${trackingNo}"`);

            // 2) Strict Eligibility Checks (Based on Professional Prompt)

            // a) Status Check: must be in [Picking, Invoiced, ReadyToShip, Shipped]
            const allowedStatuses = ['Picking', 'Invoiced', 'ReadyToShip', 'Shipped'];
            if (!allowedStatuses.includes(status)) {
                return {
                    status: 'FAILED',
                    error: `Paket statüsü (${status}) barkod yazdırmak için uygun değil. Gerekli statüler: [Picking, Invoiced, ReadyToShip, Shipped].`
                };
            }

            // b) Carrier & Trendyol Paid (Marketplace) Check
            const isAras = cargoProvider.includes('aras');
            const isTex = cargoProvider.includes('trendyol') && cargoProvider.includes('express');
            const isMarketplacePaid = cargoProvider.includes('marketplace');

            if (!isAras && !isTex) {
                return {
                    status: 'FAILED',
                    error: `Bu kargo firması (${cargoProviderName}) Ortak Barkod sürecine dahil değil. Sadece TEX ve Aras Kargo Marketplace desteklenir.`
                };
            }

            if (!isMarketplacePaid) {
                return {
                    status: 'FAILED',
                    error: "Paket 'Trendyol Öder' (Marketplace) kapsamında değil. Ortak Barkod sadece bu kapsamdaki siparişler için geçerlidir."
                };
            }

            if (!trackingNo) {
                return {
                    status: 'FAILED',
                    error: "Kargo takip numarası (cargoTrackingNumber) bulunamadı. Barkod talebi için kargo kodu gereklidir."
                };
            }

            // 3) POST .../common-label/{cargoTrackingNumber} (Create Request)
            const postResult = await this.createCommonLabelRequest(shipmentPackageId, trackingNo);
            if (!postResult.success) {
                if (postResult.status === 400 && postResult.body?.includes('COMMON_LABEL_NOT_ALLOWED')) {
                    return {
                        status: 'FAILED',
                        error: "Trendyol: Bu paket için ortak barkod izni verilmedi (COMMON_LABEL_NOT_ALLOWED). Sadece TEX/Aras ve Trendyol Öder paketlerde çalışır. Lütfen paketi onayladığınızdan emin olun."
                    };
                }
                return {
                    status: 'FAILED',
                    error: `Trendyol API Hatası (POST): ${postResult.status}`,
                    httpStatus: postResult.status
                };
            }

            // 4) GET .../common-label/{cargoTrackingNumber} with Polling
            const schedule = [1000, 2000, 3000, 5000, 8000, 10000];
            let labels: string[] = [];

            const getUrl = `${this.baseUrl}/integration/sellers/${this.config.supplierId}/common-label/${trackingNo}`;
            const effectiveProxy = (process.env.MARKETPLACE_PROXY_URL || '').trim();
            const fetchUrl = effectiveProxy ? `${effectiveProxy}?url=${encodeURIComponent(getUrl)}` : getUrl;

            for (let i = 0; i < schedule.length; i++) {
                await new Promise(r => setTimeout(r, schedule[i]));
                console.log(`${ctx} Poll Attempt ${i + 1}/${schedule.length}...`);

                const response = await fetch(fetchUrl, { headers: this.getHeaders({ 'Accept': 'application/json' }) });
                const bodyText = await response.text();

                if (response.ok && bodyText !== 'OK') {
                    try {
                        const json = JSON.parse(bodyText);
                        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
                            labels = json.data.filter((d: any) => d.format === 'ZPL').map((d: any) => d.label);
                            if (labels.length > 0) break;
                        }
                    } catch { }
                }

                if (response.status === 400 && bodyText.includes('COMMON_LABEL_NOT_ALLOWED')) {
                    return { status: 'FAILED', error: "Trendyol: Ortak barkod oluşturma izni reddedildi (NOT_ALLOWED)." };
                }
            }

            if (labels.length === 0) {
                return {
                    status: 'PENDING',
                    error: "Barkod henüz Trendyol tarafında hazır değil. Lütfen biraz sonra tekrar deneyin."
                };
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
            const pdfBuffer = await this.convertZplToPdf(combinedZpl);

            if (!pdfBuffer) {
                return { status: 'FAILED', error: "ZPL etiketi PDF formatına dönüştürülemedi (Labelary renderer hatası)." };
            }

            return {
                status: 'SUCCESS',
                pdfBase64: pdfBuffer.toString('base64'),
                httpStatus: 200
            };
        } catch (error: any) {
            console.error(`${ctx} Error:`, error);
            return { status: 'FAILED', error: error.message || 'Etiket alma işlemi sırasında beklenmedik hata oluştu.' };
        }
    }

    private async convertZplToPdf(zpl: string): Promise<Buffer | null> {
        try {
            const url = 'https://api.labelary.com/v1/printers/8dpmm/labels/4x6/0/';
            const res = await fetch(url, { method: 'POST', headers: { 'Accept': 'application/pdf' }, body: zpl });
            if (res.ok) return Buffer.from(await res.arrayBuffer());
            return null;
        } catch {
            return null;
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
