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

    async createCommonLabelRequest(shipmentPackageId: string, cargoTrackingNumber: string, format: 'ZPL' | 'PDF' = 'ZPL'): Promise<{ success: boolean; status?: number; body?: string; error?: string }> {
        try {
            const url = `${this.baseUrl}/integration/sellers/${this.config.supplierId}/common-label/${cargoTrackingNumber}`;
            const effectiveProxy = (process.env.MARKETPLACE_PROXY_URL || '').trim();
            const fetchUrl = effectiveProxy ? `${effectiveProxy}?url=${encodeURIComponent(url)}` : url;
            const body = JSON.stringify({ format, boxQuantity: 1 });
            console.log(`[TRENDYOL-DEBUG] POST Request: ${url} | Body: ${body}`);
            const response = await fetch(fetchUrl, { method: 'POST', headers: this.getHeaders(), body });
            const responseText = await response.text();
            console.log(`[TRENDYOL-DEBUG] POST Response: ${response.status} | Body Snippet: ${responseText.substring(0, 200)}`);
            if (!response.ok) return { success: false, status: response.status, body: responseText, error: responseText };
            return { success: true, status: response.status, body: responseText };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    async getCommonLabel(shipmentPackageId: string): Promise<{
        status: 'SUCCESS' | 'PENDING' | 'FAILED';
        pdfBase64?: string;
        error?: string;
        httpStatus?: number;
        raw?: any;
    }> {
        const ctx = `[TRENDYOL-LABEL][pkg:${shipmentPackageId}]`;
        try {
            const pkg = await this.getShipmentPackageDetails(shipmentPackageId);
            const cargoProvider = (pkg.cargoProviderName || '').toLowerCase();
            const status = pkg.shipmentPackageStatus;
            // Casting to string is critical as API can return it as Number
            const trackingNo = pkg.cargoTrackingNumber ? String(pkg.cargoTrackingNumber) : null;

            console.info(`${ctx} Internal Check: carrier="${cargoProvider}", status="${status}", trk="${trackingNo}"`);

            // 1) Detect Carrier & Marketplace Paid Status (Trendyol Öder)
            // Carrier: Aras or Trendyol Express (TEX)
            const isAras = cargoProvider.includes('aras');
            const isTex = cargoProvider.includes('trendyol') && cargoProvider.includes('express');

            // "Trendyol Öder" detected via "marketplace" keyword in provider name (V2 API standard)
            const isMarketplacePaid = cargoProvider.includes('marketplace');

            if (!isAras && !isTex) {
                return { status: 'FAILED', error: `Bu kargo firması (${pkg.cargoProviderName}) Ortak Barkod sürecine dahil değil. Sadece TEX ve Aras Kargo desteklenir.` };
            }

            if (!isMarketplacePaid) {
                return { status: 'FAILED', error: "Bu paket 'Trendyol Öder' (Marketplace) kapsamında değil. Ortak Barkod sadece Trendyol ödemeli gönderilerde kullanılabilir." };
            }

            if (!trackingNo) {
                return { status: 'FAILED', error: "Kargo takip numarası henüz oluşmamış. Lütfen paket onaylanana kadar bekleyin." };
            }

            // 2) Status Handling (Soft check, promote if Created)
            if (status === 'Created') {
                console.info(`${ctx} Promoting status to 'Picking'...`);
                await this.updateShipmentPackageStatus(shipmentPackageId, 'Picking');
            } else if (status === 'Shipped') {
                console.warn(`${ctx} Warning: Package is already 'Shipped'. labelary might return previously generated label.`);
            }

            // 3) POST .../common-label/{trk} (Trigger)
            const postResult = await this.createCommonLabelRequest(shipmentPackageId, trackingNo, 'ZPL');
            if (!postResult.success) {
                if (postResult.status === 400 && postResult.body?.includes('COMMON_LABEL_NOT_ALLOWED')) {
                    return { status: 'FAILED', error: "Trendyol: Bu paket Ortak Barkod sürecine dahil edilmemiş (COMMON_LABEL_NOT_ALLOWED). Koşulların sağlandığından emin olun." };
                }
                return { status: 'FAILED', error: `Trendyol API Talebi başarısız (HTTP ${postResult.status}): ${postResult.body}`, httpStatus: postResult.status };
            }

            // 4) GET .../common-label/{trk} with Polling
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
                    return { status: 'FAILED', error: "Trendyol: Ortak barkod alınamadı (NOT_ALLOWED)." };
                }
            }

            if (labels.length === 0) {
                return { status: 'PENDING', error: "Barkod henüz Trendyol tarafında oluşmadı. Lütfen birkaç dakika sonra tekrar deneyin." };
            }

            // 5) Convert ZPL -> PDF
            console.info(`${ctx} SUCCESS. Converting ${labels.length} label(s) to PDF...`);
            const combinedZpl = labels.join('\n');
            const pdfBuffer = await this.convertZplToPdf(combinedZpl);

            if (!pdfBuffer) {
                return { status: 'FAILED', error: "ZPL içeriği PDF formatına dönüştürülemedi." };
            }

            return {
                status: 'SUCCESS',
                pdfBase64: pdfBuffer.toString('base64'),
                httpStatus: 200
            };
        } catch (error: any) {
            console.error(`${ctx} Error:`, error);
            return { status: 'FAILED', error: error.message || 'Beklenmedik bir hata oluştu.' };
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
        throw new Error('Paket detayları dökülemedi.');
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
