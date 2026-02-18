import { IMarketplaceService, MarketplaceOrder, TrendyolConfig } from './types';

export class TrendyolService implements IMarketplaceService {
    private config: TrendyolConfig;
    private baseUrl: string;

    constructor(config: TrendyolConfig) {
        this.config = config;
        // Trendyol'un test ortamı varsa orası, yoksa prod
        this.baseUrl = config.isTest
            ? 'https://stageapi.trendyol.com/sapigw/suppliers'
            : 'https://api.trendyol.com/sapigw/suppliers';
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
            // OFFICIAL: "SellerId - SelfIntegration" is standard for self-developed apps
            'User-Agent': `${this.config.supplierId} - SelfIntegration`,
            'Accept': 'application/pdf',
            'x-supplier-id': this.config.supplierId,
            'x-seller-id': this.config.supplierId,
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
            const url = `${this.baseUrl}/${this.config.supplierId}/orders?size=1`;
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
        // High-fidelity attempt list based on newest Trendyol patterns
        const attempts = [
            // 1. Integration API (Singular) - Usually returns PDF stream directly
            `https://api.trendyol.com/integration/sellers/${this.config.supplierId}/common-label/${shipmentPackageId}?format=A4`,
            // 2. Integration API (Singular v2) - Newer variant
            `https://api.trendyol.com/integration/sellers/${this.config.supplierId}/common-label/v2/${shipmentPackageId}?format=A4`,
            // 3. SAPIGW (Plural) - Often returns "OK" if not ready or bad param
            `${this.baseUrl}/${this.config.supplierId}/shipment-packages/common-label?shipmentPackageIds=${shipmentPackageId}&format=A4`,
            // 4. SAPIGW (Singular)
            `${this.baseUrl}/${this.config.supplierId}/shipment-packages/${shipmentPackageId}/common-label?format=A4`,
            // 5. Tracking Number based queries
            ...(cargoTrackingNumber ? [
                `https://api.trendyol.com/integration/sellers/${this.config.supplierId}/common-label/query?id=${cargoTrackingNumber}`,
                `${this.baseUrl}/${this.config.supplierId}/common-label/query?id=${cargoTrackingNumber}`
            ] : []),
        ];

        console.log(`[NEW-DEBUG] Full Attempt List (${attempts.length} URLs):`, JSON.stringify(attempts, null, 2));

        let lastResult: any = { status: 'PENDING' };

        for (let i = 0; i < attempts.length; i++) {
            const url = attempts[i];
            console.log(`[NEW-DEBUG] Trying URL ${i + 1}/${attempts.length}: ${url}`);
            const result = await this._fetchLabel(url);

            if (result.status === 'SUCCESS') {
                console.log(`[NEW-DEBUG] SUCCESS on URL ${i + 1}`);
                return result;
            }

            // If we get PENDING (like "OK") or FAILED (like 403), we SAVE it as fallback
            // but we MUST continue to the next URL in the same loop.
            lastResult = result;
            console.log(`[NEW-DEBUG] URL ${i + 1} result: ${result.status} (Code: ${result.httpStatus}). Continuing to next URL...`);
        }

        // Only return PENDING or FAILED if ALL endpoints in the list have been tried and none gave SUCCESS.
        console.log(`[NEW-DEBUG] All URLs exhausted. Final result for this retry: ${lastResult.status}`);
        return lastResult;
    }

    private async _fetchLabel(url: string): Promise<{
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

            console.log(`[NEW-DEBUG] Fetching: ${url}`);

            // Try with headers (including Accept)
            const response = await fetch(fetchUrl, {
                headers: this.getHeaders(), // Already has Accept: application/pdf
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            const httpStatus = response.status;
            const ct = response.headers.get("content-type") || "";

            if (httpStatus === 404 || httpStatus === 409) {
                return { status: 'PENDING', httpStatus };
            }

            if (!response.ok) {
                const errText = await response.text();
                console.log(`[NEW-DEBUG] HTTP ${httpStatus} | ${errText.substring(0, 50)}`);
                return { status: 'FAILED', error: `Trendyol API Hatası: ${httpStatus}`, httpStatus, raw: errText };
            }

            const ab = await response.arrayBuffer();
            const buf = Buffer.from(ab);

            console.log("[NEW-DEBUG] status", httpStatus, "ct", ct, "len", buf.length);
            console.log("[NEW-DEBUG] hex", buf.subarray(0, 32).toString("hex"));
            console.log("[NEW-DEBUG] ascii", buf.subarray(0, 16).toString('utf-8').replace(/[^\x20-\x7E]/g, '.'));

            if (buf.length > 5) {
                console.log(`[NEW-DEBUG] SUCCESS detected. Binary data length: ${buf.length}`);
                return {
                    status: 'SUCCESS',
                    pdfBase64: buf.toString('base64'),
                    httpStatus
                };
            }

            const text = buf.toString('utf-8');
            console.log(`[NEW-DEBUG] Body too small: ${text}`);
            return { status: 'PENDING', httpStatus, raw: text };

        } catch (error: any) {
            clearTimeout(timeoutId);
            console.error(`[NEW-DEBUG] Global Error:`, error);
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
