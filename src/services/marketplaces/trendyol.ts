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
        try {
            const effectiveProxy = (process.env.MARKETPLACE_PROXY_URL || '').trim();
            const supplierId = this.config.supplierId;

            // --- STEP 0: Status & Carrier Check ---
            // If the package is in 'Created' state, label is never ready.
            let pkgStatus = 'Unknown';
            let carrier = 'Unknown';
            try {
                console.log(`[TRENDYOL-LABEL] Checking status for package ${shipmentPackageId}...`);
                const pkg = await this.getShipmentPackageDetails(shipmentPackageId);
                pkgStatus = pkg.shipmentPackageStatus;
                carrier = (pkg.cargoProviderName || '').toLowerCase();
                console.log(`[TRENDYOL-LABEL] Package Status: ${pkgStatus}, Carrier: ${carrier}`);

                if (pkgStatus === 'Created') {
                    return {
                        status: 'FAILED',
                        error: 'Paket henüz "Hazırlanıyor" (Created) aşamasında. Trendyol panelinden "Toplanacak" (Picking) statüsüne geçirin, ardından tekrar deneyin.',
                        raw: pkg
                    };
                }
            } catch (e: any) {
                if (e.message.includes("Proxy returned OK")) {
                    console.info(`[TRENDYOL-LABEL] Status check is PENDING (Proxy OK). Proceeding to fetching strategies anyway...`);
                } else {
                    console.warn(`[TRENDYOL-LABEL] Status check error (proceeding anyway): ${e.message}`);
                }
            }

            // --- STRATEGY A: Trigger & Fetch via /common-label (For TEX/Aras) ---
            if (cargoTrackingNumber || carrier.includes('express') || carrier.includes('tex')) {
                console.info(`[TRENDYOL-LABEL] Starting Common-Label flow for ${carrier}...`);

                // Step A1: Multiple Trigger Attempts
                // 1. Trigger by Tracking Number
                if (cargoTrackingNumber) {
                    try {
                        const triggerUrl = `${this.baseUrl}/integration/sellers/${supplierId}/common-label/${cargoTrackingNumber}`;
                        const fetchTriggerUrl = effectiveProxy ? `${effectiveProxy}?url=${encodeURIComponent(triggerUrl)}` : triggerUrl;
                        await fetch(fetchTriggerUrl, {
                            method: 'POST',
                            headers: this.getHeaders({ 'Content-Type': 'application/json' }),
                            body: JSON.stringify({ format: 'PDF' })
                        });
                    } catch (e) { }
                }

                // 2. Trigger by Package IDs
                try {
                    const triggerArrayUrl = `${this.baseUrl}/integration/sellers/${supplierId}/common-label`;
                    const fetchTriggerArrayUrl = effectiveProxy ? `${effectiveProxy}?url=${encodeURIComponent(triggerArrayUrl)}` : triggerArrayUrl;
                    await fetch(fetchTriggerArrayUrl, {
                        method: 'POST',
                        headers: this.getHeaders({ 'Content-Type': 'application/json' }),
                        body: JSON.stringify({ shipmentPackageIds: [parseInt(shipmentPackageId)], format: 'PDF' })
                    });
                } catch (e) { }

                // Step A2: Retrieval (GET)
                if (cargoTrackingNumber) {
                    try {
                        const getUrl = `${this.baseUrl}/integration/sellers/${supplierId}/common-label/${cargoTrackingNumber}`;
                        const fetchGetUrl = effectiveProxy ? `${effectiveProxy}?url=${encodeURIComponent(getUrl)}` : getUrl;
                        const res = await fetch(fetchGetUrl, { headers: this.getHeaders({ 'Accept': 'application/json' }) });

                        if (res.ok) {
                            const body = await res.text();
                            const trimmedBody = body.trim();

                            // Multi-Signal 1: Plain text "OK"
                            if (trimmedBody === 'OK') {
                                console.info(`[TRENDYOL-LABEL] Common-Label GET returned OK (PENDING).`);
                            } else {
                                const json = JSON.parse(trimmedBody);
                                const labelData = json.data?.[0];
                                if (labelData?.label) {
                                    if (labelData.format === 'PDF') {
                                        return { status: 'SUCCESS', pdfBase64: labelData.label, httpStatus: 200 };
                                    }
                                    if (labelData.format === 'ZPL') {
                                        console.info(`[TRENDYOL-LABEL] Converting ZPL from Common-Label...`);
                                        const pdfBuf = await this.convertZplToPdf(labelData.label);
                                        if (pdfBuf) return { status: 'SUCCESS', pdfBase64: pdfBuf.toString('base64'), httpStatus: 200 };
                                    }
                                }
                            }
                        }
                    } catch (e) { }
                }
            }

            // --- STRATEGY B: Standard v2 Labels (Universal Fallback) ---
            const standardUrl = `${this.baseUrl}/integration/sellers/${supplierId}/labels?shipmentPackageIds=${shipmentPackageId}`;
            const fetchStandardUrl = effectiveProxy ? `${effectiveProxy}?url=${encodeURIComponent(standardUrl)}` : standardUrl;

            console.info(`[TRENDYOL-LABEL] Attempting Standard v2 Labels...`);
            const response = await fetch(fetchStandardUrl, {
                headers: this.getHeaders({ 'Accept': 'application/pdf, application/json' })
            });

            if (response.ok) {
                const ab = await response.arrayBuffer();
                const buf = Buffer.from(ab);
                const bodyText = buf.toString('utf-8').trim();

                if (bodyText === 'OK') {
                    console.info(`[TRENDYOL-LABEL] Standard API returned PENDING (OK body).`);
                    return { status: 'PENDING', httpStatus: 202, raw: 'OK' };
                }

                if (buf.subarray(0, 4).toString() === '%PDF') {
                    return { status: 'SUCCESS', pdfBase64: buf.toString('base64'), httpStatus: 200 };
                }

                try {
                    const json = JSON.parse(bodyText);
                    const label = json.data?.[0]?.label || json.label;
                    const format = json.data?.[0]?.format || json.format;
                    if (label) {
                        if (format === 'PDF') return { status: 'SUCCESS', pdfBase64: label, httpStatus: 200 };
                        if (format === 'ZPL') {
                            const pdfBuf = await this.convertZplToPdf(label);
                            if (pdfBuf) return { status: 'SUCCESS', pdfBase64: pdfBuf.toString('base64'), httpStatus: 200 };
                        }
                    }
                } catch { }
            }

            // --- STRATEGY C: Standard v1/Alt Path ---
            try {
                const altUrl = `${this.baseUrl}/integration/sellers/${supplierId}/labels/${shipmentPackageId}`;
                const fetchAltUrl = effectiveProxy ? `${effectiveProxy}?url=${encodeURIComponent(altUrl)}` : altUrl;
                const altRes = await fetch(fetchAltUrl, { headers: this.getHeaders({ 'Accept': 'application/pdf' }) });
                if (altRes.ok) {
                    const altAb = await altRes.arrayBuffer();
                    const altBuf = Buffer.from(altAb);
                    if (altBuf.subarray(0, 4).toString() === '%PDF') {
                        return { status: 'SUCCESS', pdfBase64: altBuf.toString('base64'), httpStatus: 200 };
                    }
                }
            } catch { }

            // Final fallback logic
            const status = response.status;
            if (status === 202 || status === 429 || status === 556 || (status >= 500 && status <= 504)) {
                console.info(`[TRENDYOL-LABEL] HTTP ${status} signal for async/busy. Returning PENDING.`);
                return { status: 'PENDING', error: 'Trendyol servisi meşgul veya hazırlanıyor.', httpStatus: status };
            }

            // Check for unexpected HTML (Gateway errors)
            const ct = (response.headers.get("content-type") || "").toLowerCase();
            if (ct.includes("text/html")) {
                console.warn(`[TRENDYOL-LABEL] Received unexpected HTML (len ${buf.length}). Treating as transient PENDING.`);
                return { status: 'PENDING', error: 'Bağlantı ara katmanı meşgul.', httpStatus: 202 };
            }

            return { status: 'PENDING', error: 'Etiket hazırlanıyor (Son aşama)...', httpStatus: 200 };

        } catch (error: any) {
            console.error(`[TRENDYOL-LABEL] Fatal Error:`, error);
            return { status: 'FAILED', error: `Sistem Hatası: ${error.message}` };
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

    private async getShipmentPackageDetails(shipmentPackageId: string): Promise<any> {
        const url = `${this.baseUrl}/sapigw/suppliers/${this.config.supplierId}/shipment-packages/${shipmentPackageId}`;
        const effectiveProxy = (process.env.MARKETPLACE_PROXY_URL || '').trim();
        const fetchUrl = effectiveProxy ? `${effectiveProxy}?url=${encodeURIComponent(url)}` : url;

        const response = await fetch(fetchUrl, {
            headers: this.getHeaders({ 'Accept-Language': 'tr-TR' })
        });

        if (!response.ok) {
            if (response.status === 556) {
                console.warn(`[TRENDYOL-LABEL] SAPIGW 556 - Service Unavailable for package details (Proxy: ${!!effectiveProxy})`);
                throw new Error(`Status 556`);
            }
            throw new Error(`Status ${response.status}`);
        }

        const bodyText = await response.text();
        if (bodyText.trim() === 'OK') {
            // If proxy returns OK but we expected JSON, it's a proxy pending state.
            // We retry once after a small delay.
            await new Promise(r => setTimeout(r, 2000));
            const retryRes = await fetch(fetchUrl, { headers: this.getHeaders({ 'Accept-Language': 'tr-TR' }) });
            if (retryRes.ok) {
                const retryBody = await retryRes.text();
                if (retryBody.trim() !== 'OK') return JSON.parse(retryBody);
            }
            throw new Error(`Proxy returned OK (Pending)`);
        }

        try {
            return JSON.parse(bodyText);
        } catch (e) {
            console.warn(`[TRENDYOL-LABEL] JSON Parse Error for details: ${bodyText.substring(0, 50)}`);
            throw new Error(`Invalid JSON response`);
        }
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
