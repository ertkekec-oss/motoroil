import { IMarketplaceService, MarketplaceOrder, HepsiburadaConfig } from './types';

export class HepsiburadaService implements IMarketplaceService {
    private config: HepsiburadaConfig;
    private baseUrl: string;

    constructor(config: HepsiburadaConfig) {
        this.config = config;
        // Test ortamı kontrolü (SIT environment)
        if (this.config.isTest || this.config.merchantId === '18c17301-9348-4937-b5c0-6912f54eb142') {
            this.baseUrl = 'https://oms-external-sit.hepsiburada.com';
        } else {
            this.baseUrl = 'https://oms-external.hepsiburada.com';
        }
    }

    private getAuthHeader(): string {
        const merchantId = this.config.merchantId?.trim() || '';
        const password = this.config.password?.trim() || ''; // This is the Secret Key
        const authString = `${merchantId}:${password}`;
        return `Basic ${Buffer.from(authString).toString('base64')}`;
    }

    async validateConnection(): Promise<boolean> {
        try {
            // Hepsiburada'da bağlantıyı test etmek için limit=1 ile sipariş çekmeyi deneriz
            const merchantId = this.config.merchantId?.trim() || '';
            const response = await fetch(`${this.baseUrl}/orders/merchantid/${merchantId}?limit=1`, {
                headers: {
                    'Authorization': this.getAuthHeader(),
                    'User-Agent': 'motoroil_dev'
                }
            });

            return response.ok;
        } catch (error) {
            console.error('Hepsiburada bağlantı hatası:', error);
            return false;
        }
    }

    async getOrders(startDate?: Date, endDate?: Date): Promise<MarketplaceOrder[]> {
        try {
            const merchantId = this.config.merchantId?.trim() || '';
            const limit = 50;

            // Hepsiburada OMS API expects: YYYY-MM-DD HH:mm:ss (with space, no T/Z)
            const formatDate = (date: Date) => {
                const pad = (n: number) => n.toString().padStart(2, '0');
                return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
            };

            const startStr = startDate ? formatDate(startDate) : '';
            const endStr = endDate ? formatDate(endDate) : '';

            // Hepsiburada usually requires status or date range. 
            // We'll fetch multiple statuses if possible, or just use the date range.
            let url = `${this.baseUrl}/orders/merchantid/${merchantId}?limit=${limit}`;

            if (startStr) url += `&beginDate=${encodeURIComponent(startStr)}`;
            if (endStr) url += `&endDate=${encodeURIComponent(endStr)}`;

            console.log(`[Hepsiburada] Fetching: ${url}`);

            const response = await fetch(url, {
                headers: {
                    'Authorization': this.getAuthHeader(),
                    'User-Agent': 'motoroil_dev'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Hepsiburada API Hatası: ${response.status} - ${errorText}`);
            }

            const data = await response.json();

            // Hepsiburada can return { items: [] } or just []
            let ordersRaw = [];
            if (Array.isArray(data)) {
                ordersRaw = data;
            } else if (data && Array.isArray(data.items)) {
                ordersRaw = data.items;
            } else if (data && typeof data === 'object') {
                // Sometimes it returns a single order object if only one exists or different structure
                ordersRaw = data.id ? [data] : [];
            }

            return ordersRaw.map((order: any) => this.mapOrder(order));
        } catch (error) {
            console.error('Hepsiburada sipariş çekme hatası:', error);
            throw error;
        }
    }

    private mapOrder(hbOrder: any): MarketplaceOrder {
        // Not: Hepsiburada API yanıtındaki alan adları değişebilir, dokümantasyona göre güncellenmelidir.
        // Bu mapping Hepsiburada'nın standart OmsExternal API yapısına göredir.

        return {
            id: hbOrder.id || hbOrder.orderNumber,
            orderNumber: hbOrder.orderNumber,
            customerName: hbOrder.customer ? hbOrder.customer.name : 'Müşteri',
            customerEmail: hbOrder.customer ? hbOrder.customer.email : '',
            orderDate: new Date(hbOrder.orderDate),
            status: hbOrder.status,
            totalAmount: hbOrder.totalPrice ? hbOrder.totalPrice.amount : 0,
            currency: hbOrder.totalPrice ? hbOrder.totalPrice.currency : 'TRY',
            shippingAddress: {
                fullName: hbOrder.shippingAddress ? hbOrder.shippingAddress.name : '',
                address: hbOrder.shippingAddress ? `${hbOrder.shippingAddress.address} ${hbOrder.shippingAddress.district}` : '',
                city: hbOrder.shippingAddress ? hbOrder.shippingAddress.city : '',
                district: hbOrder.shippingAddress ? hbOrder.shippingAddress.town : '', // Hepsiburada'da town olabilir
                phone: hbOrder.shippingAddress ? hbOrder.shippingAddress.phoneNumber : ''
            },
            invoiceAddress: {
                fullName: hbOrder.billingAddress ? hbOrder.billingAddress.name : '',
                address: hbOrder.billingAddress ? `${hbOrder.billingAddress.address}` : '',
                city: hbOrder.billingAddress ? hbOrder.billingAddress.city : '',
                district: hbOrder.billingAddress ? hbOrder.billingAddress.town : '',
                phone: hbOrder.billingAddress ? hbOrder.billingAddress.phoneNumber : ''
            },
            items: (hbOrder.items || []).map((item: any) => ({
                productName: item.productName || item.name,
                sku: item.sku || item.merchantSku,
                quantity: item.quantity,
                price: item.price ? item.price.amount : 0,
                taxRate: 0, // Hepsiburada API'sinde vergi oranı direkt dönmeyebilir
                discountAmount: 0 // İndirim logic'i
            }))
        };
    }
}
