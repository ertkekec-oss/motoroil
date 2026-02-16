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
        const username = this.config.username?.trim() || merchantId; // Fallback to merchantId
        const password = this.config.password?.trim() || '';
        const authString = `${username}:${password}`;
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
            // Hepsiburada'da tarih filtresi olmayabilir veya farklı parametrelerle olabilir
            // Bu örnekte temel listeleme yapıyoruz
            const merchantId = this.config.merchantId?.trim() || '';
            const url = `${this.baseUrl}/orders/merchantid/${merchantId}?limit=50`;

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

            // Hepsiburada yanıt yapısı değişebilir, genel yapıyı varsayıyoruz
            // Genellikle { items: [...] } döner
            const orders = data.items || data || [];

            return orders.map((order: any) => this.mapOrder(order));
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
