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

    private getHeaders(extra: Record<string, string> = {}): Record<string, string> {
        return {
            'Authorization': this.getAuthHeader(),
            // High-reputation real browser User-Agent
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
            'x-supplier-id': this.config.supplierId,
            'Referer': 'https://partner.trendyol.com/',
            ...extra
        };
    }

    async validateConnection(): Promise<boolean> {
        try {
            // Basit bir istek ile bağlantıyı doğrula (örneğin siparişleri limit 1 ile çek)
            // Trendyol'da sırf doğrulama için özel bir endpoint yok, orders'ı test ediyoruz
            const response = await fetch(`${this.baseUrl}/${this.config.supplierId}/orders?size=1`, {
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
            // Doğru endpoint: /carriages (Trendyol resmi dokümantasyonuna göre)
            const url = `${this.baseUrl}/${this.config.supplierId}/shipment-packages/${shipmentPackageId}/carriages`;

            const response = await fetch(url, {
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

    async getCommonLabel(shipmentPackageId: string): Promise<{
        status: 'SUCCESS' | 'PENDING' | 'FAILED';
        pdfBase64?: string;
        error?: string;
        httpStatus?: number;
        raw?: any;
    }> {
        const attempts = [
            `${this.baseUrl}/${this.config.supplierId}/shipment-packages/${shipmentPackageId}/common-label?format=A4`,
            `${this.baseUrl}/${this.config.supplierId}/common-label/${shipmentPackageId}?format=A4`,
            `${this.baseUrl}/${this.config.supplierId}/shipment-packages/${shipmentPackageId}/label?format=PDF`,
            `${this.baseUrl}/${this.config.supplierId}/common-label/${shipmentPackageId}`
        ];

        let lastResult: any = null;

        for (const url of attempts) {
            const result = await this._fetchLabel(url);
            lastResult = result;

            if (result.status === 'SUCCESS' || result.status === 'PENDING') {
                return result;
            }

            console.log(`[TRENDYOL] Attempt for ${url} failed with ${result.httpStatus}.`);
        }

        return lastResult;
    }

    private async _fetchLabel(url: string): Promise<{
        status: 'SUCCESS' | 'PENDING' | 'FAILED';
        pdfBase64?: string;
        error?: string;
        httpStatus?: number;
        raw?: any;
    }> {
        try {
            console.log(`[TRENDYOL] Fetching Label: ${url}`);
            const response = await fetch(url, {
                headers: this.getHeaders()
            });

            const httpStatus = response.status;
            const responseText = await response.text();
            let raw: any = null;
            try {
                raw = responseText ? JSON.parse(responseText) : null;
            } catch {
                raw = responseText;
            }

            if (!response.ok) {
                return { status: 'FAILED', error: `Trendyol API Hatası: ${httpStatus}`, httpStatus, raw };
            }

            if (raw && raw.content && raw.content.length > 100) {
                return { status: 'SUCCESS', pdfBase64: raw.content, httpStatus, raw };
            }

            return { status: 'PENDING', httpStatus, raw };
        } catch (error: any) {
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

            console.log('Trendyol Fetching:', url);

            const response = await fetch(url, {
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
