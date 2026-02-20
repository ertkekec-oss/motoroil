import { IMarketplaceService, MarketplaceOrder, N11Config } from './types';

export class N11Service implements IMarketplaceService {
    private config: N11Config;
    private baseUrl: string;

    constructor(config: N11Config) {
        this.config = config;
        this.baseUrl = 'https://api.n11.com/rest/delivery/v1';
    }

    private async makeRequest(path: string, params: Record<string, string> = {}): Promise<any> {
        const query = new URLSearchParams(params).toString();
        const url = `${this.baseUrl}/${path}${query ? `?${query}` : ''}`;

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'appkey': this.config.apiKey,
                    'appsecret': this.config.apiSecret,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`N11 REST API Hatası (${response.status}): ${errorText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`N11 REST Request Hatası [${path}]:`, error);
            throw error;
        }
    }

    async validateConnection(): Promise<boolean> {
        try {
            // Simple request to fetch a few created orders to check credentials
            const result = await this.makeRequest('shipmentPackages', {
                page: '0',
                size: '1',
                status: 'Created'
            });
            return result !== undefined;
        } catch (error) {
            console.error('N11 bağlantı doğrulama hatası:', error);
            return false;
        }
    }

    async getOrders(startDate?: Date, endDate?: Date): Promise<MarketplaceOrder[]> {
        try {
            // Statuses to fetch (REST API expects one status per request)
            const statuses = ['Created', 'Picking', 'Shipped', 'Cancelled', 'Delivered', 'UnPacked', 'UnSupplied'];

            const params: Record<string, string> = {
                page: '0',
                size: '100',
                orderByDirection: 'DESC'
            };

            if (startDate) {
                params.startDate = startDate.getTime().toString();
            }
            if (endDate) {
                params.endDate = endDate.getTime().toString();
            }

            const allOrders: MarketplaceOrder[] = [];

            for (const status of statuses) {
                try {
                    const statusParams = { ...params, status };
                    const result = await this.makeRequest('shipmentPackages', statusParams);

                    if (result?.content && Array.isArray(result.content)) {
                        const mapped = result.content.map((pkg: any) => this.mapOrder(pkg));
                        allOrders.push(...mapped);
                    }
                } catch (statusErr) {
                    console.warn(`N11 status fetch error for [${status}]:`, statusErr);
                    // Continue with other statuses
                }
            }

            // Deduplicate (since an order might technically change status between calls, though unlikely in a single run)
            const uniqueOrders = Array.from(new Map(allOrders.map(o => [o.id, o])).values());

            return uniqueOrders.sort((a, b) => b.orderDate.getTime() - a.orderDate.getTime());
        } catch (error) {
            console.error('N11 sipariş çekme hatası:', error);
            throw error;
        }
    }

    async getCargoLabel(packageId: string): Promise<{ pdfBase64?: string; error?: string; status?: number }> {
        const url = `${this.baseUrl}/shipmentPackages/${packageId}/label`;
        try {
            console.log(`[N11_LABEL_REQ] URL: ${url}`);
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'appkey': this.config.apiKey,
                    'appsecret': this.config.apiSecret,
                    'Accept': 'application/pdf'
                }
            });

            const status = response.status;
            if (!response.ok) {
                const text = await response.text();
                console.error(`[N11_LABEL_ERR] Status: ${status} | URL: ${url} | Res: ${text.substring(0, 200)}`);
                return { error: `N11 Etiket Hatası (${status}): ${text}`, status };
            }

            const buffer = await response.arrayBuffer();
            const pdfBase64 = Buffer.from(buffer).toString('base64');
            console.log(`[N11_LABEL_SUCCESS] pkg: ${packageId} | buffer: ${buffer.byteLength} bytes`);
            return { pdfBase64, status };
        } catch (error: any) {
            console.error(`[N11_LABEL_CRITICAL_ERR] pkg: ${packageId}:`, error);
            return { error: error.message || 'N11 etiket bağlantı hatası' };
        }
    }

    async getOrderByNumber(orderNumber: string): Promise<MarketplaceOrder | null> {
        try {
            // N11 REST API lets we query by orderNumber in shipmentPackages
            const result = await this.makeRequest('shipmentPackages', {
                orderNumber: orderNumber,
                page: '0',
                size: '1'
            });

            if (result?.content && Array.isArray(result.content) && result.content.length > 0) {
                return this.mapOrder(result.content[0]);
            }
            return null;
        } catch (error) {
            console.error(`N11 getOrderByNumber error [${orderNumber}]:`, error);
            return null;
        }
    }

    private mapOrder(n11Pkg: any): MarketplaceOrder {
        if (!n11Pkg || !n11Pkg.id) return null as any;

        const lines = Array.isArray(n11Pkg.lines) ? n11Pkg.lines : [];

        // Find creation date from history if available, else fallback
        let orderDate = new Date(n11Pkg.lastModifiedDate || Date.now());
        if (n11Pkg.packageHistories && Array.isArray(n11Pkg.packageHistories)) {
            const created = n11Pkg.packageHistories.find((h: any) => h.status === 'Created');
            if (created) orderDate = new Date(created.createdDate);
        }

        return {
            id: n11Pkg.id.toString(),
            orderNumber: n11Pkg.orderNumber,
            shipmentPackageId: n11Pkg.id.toString(), // CRITICAL: Mapping to n11Pkg.id
            customerName: n11Pkg.customerfullName || n11Pkg.billingAddress?.fullName || 'Misafir',
            customerEmail: n11Pkg.customerEmail || '',
            orderDate: orderDate,
            status: this.mapStatus(n11Pkg.shipmentPackageStatus),
            totalAmount: Number(n11Pkg.totalAmount || 0),
            currency: 'TRY',
            cargoTrackingNumber: n11Pkg.cargoTrackingNumber || n11Pkg.cargoSenderNumber,
            cargoTrackingLink: n11Pkg.cargoTrackingLink,
            cargoProvider: n11Pkg.cargoProviderName || 'N11 Lojistik',
            shippingAddress: {
                fullName: n11Pkg.shippingAddress?.fullName || '',
                address: n11Pkg.shippingAddress?.address || '',
                city: n11Pkg.shippingAddress?.city || '',
                district: n11Pkg.shippingAddress?.district || '',
                phone: n11Pkg.shippingAddress?.gsm || ''
            },
            invoiceAddress: {
                fullName: n11Pkg.billingAddress?.fullName || '',
                address: n11Pkg.billingAddress?.address || '',
                city: n11Pkg.billingAddress?.city || '',
                district: n11Pkg.billingAddress?.district || '',
                phone: n11Pkg.billingAddress?.gsm || ''
            },
            items: lines.map((line: any) => ({
                productName: line.productName,
                sku: line.stockCode || line.productId.toString(),
                quantity: Number(line.quantity || 1),
                price: Number(line.price || 0),
                taxRate: Number(line.vatRate || 20),
                discountAmount: Number(line.totalSellerDiscountPrice || 0)
            }))
        };
    }

    private mapStatus(n11Status: string): string {
        const statuses: { [key: string]: string } = {
            'Created': 'Yeni Sipariş',
            'Picking': 'Hazırlanıyor',
            'Shipped': 'Kargolandı',
            'Delivered': 'Teslim Edildi',
            'Cancelled': 'İptal Edildi',
            'UnPacked': 'Paketlenmedi',
            'UnSupplied': 'Tedarik Edilemedi'
        };
        return statuses[n11Status] || n11Status;
    }
}

