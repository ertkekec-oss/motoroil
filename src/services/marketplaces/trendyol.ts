import { IMarketplaceService, MarketplaceOrder, TrendyolConfig } from './types';

export class TrendyolService implements IMarketplaceService {
    private config: TrendyolConfig;
    private baseUrl: string;

    constructor(config: TrendyolConfig) {
        this.config = config;
        // OFFICIAL: Using apigw.trendyol.com per developer docs
        this.baseUrl = config.isTest
            ? 'https://stageapi.trendyol.com'
            : 'https://apigw.trendyol.com';
    }

    private getAuthHeader(): string {
        const authString = `${this.config.apiKey}:${this.config.apiSecret}`;
        return `Basic ${Buffer.from(authString).toString('base64')}`;
    }

    private getProxyKeyHeader(): string {
        return (process.env.PERIODYA_PROXY_KEY || '').trim();
    }

    private getHeaders(extra: Record<string, string> = {}): Record<string, string> {
        const headers: any = {
            'Authorization': this.getAuthHeader(),
            'User-Agent': `${this.config.supplierId} - SelfIntegration`,
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
            // Updated to apigw structure
            const url = `${this.baseUrl}/sapigw/suppliers/${this.config.supplierId}/orders?size=1`;
            const effectiveProxy = (process.env.MARKETPLACE_PROXY_URL || '').trim();
            const fetchUrl = effectiveProxy ? `${effectiveProxy}?url=${encodeURIComponent(url)}` : url;

            const response = await fetch(fetchUrl, {
                headers: this.getHeaders()
            });

            return response.ok;
        } catch (error) {
            console.error('Trendyol bağlantı hatası:', error);
            return false;
        }
    }

    async updateCargoProvider(shipmentPackageId: string, cargoProviderCode: string): Promise<{ success: boolean; error?: string }> {
        try {
            const url = `${this.baseUrl}/${this.config.supplierId}/shipment-packages/${shipmentPackageId}/carriages`;
            const effectiveProxy = (process.env.MARKETPLACE_PROXY_URL || '').trim();
            const fetchUrl = effectiveProxy ? `${effectiveProxy}?url=${encodeURIComponent(url)}` : url;

            const response = await fetch(fetchUrl, {
                method: 'PUT',
                headers: this.getHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({
                    cargoProvider: cargoProviderCode
                })
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

    async getCommonLabel(shipmentPackageId: string, cargoTrackingNumber?: string): Promise<{
        status: 'SUCCESS' | 'PENDING' | 'FAILED';
        pdfBase64?: string;
        error?: string;
        httpStatus?: number;
        raw?: any;
    }> {
        // Step 1: Ensure we have a barcode
        let barcode = cargoTrackingNumber;
        if (!barcode) {
            console.log(`[TRENDYOL-ZPL] Missing barcode. Fetching for ${shipmentPackageId}...`);
            try {
                const packageDetails = await this.getShipmentPackageDetails(shipmentPackageId);
                barcode = packageDetails.cargoTrackingNumber;
            } catch (e) {
                console.error(`[TRENDYOL-ZPL] Failed to fetch barcode:`, e);
                return { status: 'FAILED', error: 'Barkod bilgisi alınamadı' };
            }
        }

        if (!barcode) return { status: 'FAILED', error: 'Barkod bulunamadı' };
        console.log(`[TRENDYOL-ZPL] Starting Official Flow for Barcode: ${barcode}`);

        // Step 2: Trigger Creation (POST)
        const trigger = await this.createCommonLabelPost(barcode);
        if (!trigger.success) {
            console.error(`[TRENDYOL-ZPL] Trigger failed: ${trigger.error}`);
            return { status: 'FAILED', error: `Etiket Tetikleme Hatası: ${trigger.error}` };
        }

        // Step 3: Fetch ZPL (GET) - Try both Query (v3) and Path (v2) styles
        let zpl: string | null = null;
        for (let i = 0; i < 2; i++) {
            console.log(`[TRENDYOL-ZPL] Fetching ZPL (Attempt ${i + 1}/2)...`);

            // Try v3 Query endpoint
            zpl = await this.getZplFromQuery(barcode);

            // If v3 fails, try v2 Path endpoint
            if (!zpl) {
                zpl = await this.getZplFromPath(barcode);
            }

            if (zpl) break;

            if (i === 0) {
                console.log(`[TRENDYOL-ZPL] Not ready, waiting 3s before retry...`);
                await new Promise(r => setTimeout(r, 3000));
            }
        }

        if (!zpl) {
            console.log(`[TRENDYOL-ZPL] ZPL not ready after short retry logic.`);
            return { status: 'PENDING', raw: 'ZPL_NOT_READY' };
        }

        // Step 4: Convert ZPL to PDF via Labelary
        try {
            const pdfBuffer = await this.convertZplToPdf(zpl);
            return {
                status: 'SUCCESS',
                pdfBase64: pdfBuffer.toString('base64'),
                httpStatus: 200
            };
        } catch (err: any) {
            console.error(`[TRENDYOL-ZPL] Labelary Error:`, err);
            return { status: 'FAILED', error: `PDF Dönüştürme Hatası: ${err.message}` };
        }
    }

    private async getShipmentPackageDetails(shipmentPackageId: string): Promise<any> {
        const url = `${this.baseUrl}/sapigw/suppliers/${this.config.supplierId}/shipment-packages/${shipmentPackageId}`;
        const response = await fetch(url, { headers: this.getHeaders() });
        if (!response.ok) throw new Error(`Status ${response.status}`);
        return await response.json();
    }

    async createCommonLabelPost(barcode: string): Promise<{ success: boolean; error?: string }> {
        // OFFICIAL FIX: Remove ?format=ZPL from URL, must be in BODY only
        const url = `${this.baseUrl}/integration/sellers/${this.config.supplierId}/common-label/${barcode}`;
        console.log(`[TRENDYOL-ZPL] Step 1 POST: ${url}`);

        const response = await fetch(url, {
            method: 'POST',
            headers: this.getHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ format: 'ZPL' })
        });

        if (!response.ok) {
            const errText = await response.text();
            return { success: false, error: `${response.status} ${errText}` };
        }

        console.log(`[TRENDYOL-ZPL] POST SUCCESS (OK ack received)`);
        return { success: true };
    }

    async getZplFromQuery(barcode: string): Promise<string | null> {
        const url = `${this.baseUrl}/integration/sellers/${this.config.supplierId}/common-label/query?id=${barcode}`;
        const response = await fetch(url, { headers: this.getHeaders() });

        if (!response.ok) return null;
        const json = await response.json();

        const labelData = json.data?.[0]?.label || json.label;
        if (labelData && typeof labelData === 'string' && labelData.includes('^XA')) {
            return labelData;
        }
        return null;
    }

    async getZplFromPath(barcode: string): Promise<string | null> {
        const url = `${this.baseUrl}/integration/sellers/${this.config.supplierId}/common-label/${barcode}?format=ZPL`;
        console.log(`[TRENDYOL-ZPL] GET Path Fallback: ${url}`);
        const response = await fetch(url, { headers: this.getHeaders() });
        if (!response.ok) return null;
        const text = await response.text();
        return (text.startsWith('^XA') && text.includes('^XZ')) ? text : null;
    }

    async convertZplToPdf(zpl: string): Promise<Buffer> {
        console.log(`[TRENDYOL-ZPL] Step 3: Labelary PDF Conversion...`);
        const response = await fetch('https://api.labelary.com/v1/printers/8dpmm/labels/4x6/0/', {
            method: 'POST',
            headers: { 'Accept': 'application/pdf' },
            body: zpl
        });

        if (!response.ok) {
            throw new Error(`Labelary API failed (${response.status})`);
        }

        const ab = await response.arrayBuffer();
        return Buffer.from(ab);
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
            queryParams.append('orderBy', 'CreatedDate');
            queryParams.append('order', 'DESC');
            queryParams.append('size', '50'); // Son 50 sipariş

            if (startDate) {
                queryParams.append('startDate', startDate.getTime().toString());
            }
            if (endDate) {
                queryParams.append('endDate', endDate.getTime().toString());
            }

            // Varsayılan olarak son 1 hafta
            if (!startDate && !endDate) {
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                queryParams.append('startDate', oneWeekAgo.getTime().toString());
            }

            const url = `${this.baseUrl}/${this.config.supplierId}/orders?${queryParams.toString()}`;
            const effectiveProxy = (process.env.MARKETPLACE_PROXY_URL || '').trim();
            const fetchUrl = effectiveProxy ? `${effectiveProxy}?url=${encodeURIComponent(url)}` : url;

            console.log('Trendyol Fetching:', url, `(Proxy: ${!!effectiveProxy})`);

            const response = await fetch(fetchUrl, {
                headers: this.getHeaders()
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Trendyol API Hatası: ${response.status} - ${errorText}`);
            }

            const data = await response.json();

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
            const url = `${this.baseUrl}/${this.config.supplierId}/orders?orderNumber=${encodeURIComponent(orderNumber)}`;
            const response = await fetch(url, {
                headers: this.getHeaders(),
            });
            if (!response.ok) return null;
            const data = await response.json();
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
