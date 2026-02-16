import { IMarketplaceService, MarketplaceOrder, HepsiburadaConfig } from './types';

export class HepsiburadaService implements IMarketplaceService {
    private config: HepsiburadaConfig;
    private baseUrl: string;

    constructor(config: HepsiburadaConfig) {
        this.config = config;
        // Test/Prod base URL selection
        if (this.config.isTest || this.config.merchantId === '18c17301-9348-4937-b5c0-6912f54eb142') {
            this.baseUrl = 'https://oms-external-sit.hepsiburada.com';
        } else {
            this.baseUrl = 'https://oms-external.hepsiburada.com';
        }
    }

    private getAuthHeader(): string {
        const merchantId = (this.config.merchantId || '').trim();
        const secretKey = (this.config.password || '').trim(); // Using password field as Secret Key
        const token = Buffer.from(`${merchantId}:${secretKey}`).toString('base64');
        return `Basic ${token}`;
    }

    private hbDate(date: Date): string {
        const pad = (n: number) => n.toString().padStart(2, '0');
        const yr = date.getFullYear();
        const mo = pad(date.getMonth() + 1);
        const dy = pad(date.getDate());
        const hr = pad(date.getHours());
        const mi = pad(date.getMinutes());
        const sc = pad(date.getSeconds());
        return `${yr}-${mo}-${dy} ${hr}:${mi}:${sc}`;
    }

    async validateConnection(): Promise<boolean> {
        try {
            const merchantId = (this.config.merchantId || '').trim();
            const url = `${this.baseUrl}/orders/merchantid/${merchantId}?limit=1`;
            const response = await fetch(url, {
                headers: {
                    'Authorization': this.getAuthHeader(),
                    'User-Agent': 'motoroil_dev'
                }
            });
            return response.ok;
        } catch (error) {
            console.error('Hepsiburada connection validation error:', error);
            return false;
        }
    }

    async getOrders(startDate?: Date, endDate?: Date): Promise<MarketplaceOrder[]> {
        try {
            const merchantId = (this.config.merchantId || '').trim();
            const now = new Date();
            const begin = startDate || new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30);
            const end = endDate || now;

            const queryParams = new URLSearchParams({
                limit: '50',
                beginDate: this.hbDate(begin),
                endDate: this.hbDate(end)
            });

            const url = `${this.baseUrl}/orders/merchantid/${merchantId}?${queryParams.toString()}`;
            console.log(`[Hepsiburada] Fetching orders with URL: ${url}`);

            const response = await fetch(url, {
                headers: {
                    'Authorization': this.getAuthHeader(),
                    'User-Agent': 'motoroil_dev',
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[HB_ERROR] Status: ${response.status}, Body: ${errorText}`);
                throw new Error(`Hepsiburada API Hatası: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            const ordersRaw = Array.isArray(data) ? data : (data?.items || (data?.id ? [data] : []));

            return ordersRaw.map((order: any) => this.mapOrder(order));
        } catch (error) {
            console.error('Hepsiburada getOrders error:', error);
            throw error;
        }
    }

    private mapOrder(hbOrder: any): MarketplaceOrder {
        return {
            id: hbOrder.id || hbOrder.orderNumber,
            orderNumber: hbOrder.orderNumber,
            customerName: hbOrder.customer?.name || 'Müşteri',
            customerEmail: hbOrder.customer?.email || '',
            orderDate: new Date(hbOrder.orderDate),
            status: hbOrder.status,
            totalAmount: hbOrder.totalPrice?.amount || 0,
            currency: hbOrder.totalPrice?.currency || 'TRY',
            shippingAddress: {
                fullName: hbOrder.shippingAddress?.name || '',
                address: `${hbOrder.shippingAddress?.address || ''} ${hbOrder.shippingAddress?.district || ''}`,
                city: hbOrder.shippingAddress?.city || '',
                district: hbOrder.shippingAddress?.town || '',
                phone: hbOrder.shippingAddress?.phoneNumber || ''
            },
            invoiceAddress: {
                fullName: hbOrder.billingAddress?.name || '',
                address: hbOrder.billingAddress?.address || '',
                city: hbOrder.billingAddress?.city || '',
                district: hbOrder.billingAddress?.town || '',
                phone: hbOrder.billingAddress?.phoneNumber || ''
            },
            items: (hbOrder.items || []).map((item: any) => ({
                productName: item.productName || item.name,
                sku: item.sku || item.merchantSku,
                quantity: item.quantity,
                price: item.price?.amount || 0,
                taxRate: 20,
                discountAmount: 0
            }))
        };
    }
}
