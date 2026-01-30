import { IMarketplaceService, MarketplaceOrder, N11Config } from './types';
import { XMLParser } from 'fast-xml-parser';

export class N11Service implements IMarketplaceService {
    private config: N11Config;
    private baseUrl: string;

    constructor(config: N11Config) {
        this.config = config;
        this.baseUrl = 'https://api.n11.com/ws/OrderService';
    }

    private getSoapEnvelope(body: string): string {
        return `
        <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:sch="http://www.n11.com/ws/schemas">
            <soapenv:Header/>
            <soapenv:Body>
                ${body}
            </soapenv:Body>
        </soapenv:Envelope>`;
    }

    private async makeRequest(action: string, bodyContent: string): Promise<any> {
        const xml = this.getSoapEnvelope(`
            <sch:${action}>
                <auth>
                    <appKey>${this.config.apiKey}</appKey>
                    <appSecret>${this.config.apiSecret}</appSecret>
                </auth>
                ${bodyContent}
            </sch:${action}>
        `);

        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/xml; charset=utf-8',
                    'SOAPAction': `http://www.n11.com/ws/OrderService/${action}`
                },
                body: xml
            });

            const text = await response.text();

            // Parse XML response
            const parser = new XMLParser({
                ignoreAttributes: true,
                removeNSPrefix: true
            });
            const result = parser.parse(text);

            // Check for SOAP Fault
            if (result?.Envelope?.Body?.Fault) {
                const fault = result.Envelope.Body.Fault;
                throw new Error(`N11 API Hatası: ${fault.faultstring}`);
            }

            return result?.Envelope?.Body?.[`${action}Response`];
        } catch (error) {
            console.error(`N11 ${action} Hatası:`, error);
            throw error;
        }
    }

    async validateConnection(): Promise<boolean> {
        try {
            // DetailedOrderListRequest ile basit bir sorgu atarak bağlantıyı test et
            const result = await this.makeRequest('DetailedOrderListRequest', `
                <searchData>
                    <status>New</status>
                    <period>
                        <startDate>01/01/2026</startDate>
                        <endDate>02/01/2026</endDate>
                    </period>
                </searchData>
                <pagingData>
                    <currentPage>0</currentPage>
                    <pageSize>1</pageSize>
                </pagingData>
            `);

            // Eğer result dönerse ve result içinde orderList veya result (işlem sonucu) varsa başarılıdır
            return !!result?.result?.status;
        } catch (error) {
            console.error('N11 bağlantı doğrulama hatası:', error);
            return false;
        }
    }

    async getOrders(startDate?: Date, endDate?: Date): Promise<MarketplaceOrder[]> {
        try {
            // Tarih formatı dd/MM/yyyy olmalı
            const formatDate = (date: Date) => {
                const d = date.getDate().toString().padStart(2, '0');
                const m = (date.getMonth() + 1).toString().padStart(2, '0');
                const y = date.getFullYear();
                return `${d}/${m}/${y}`;
            };

            const startStr = startDate ? formatDate(startDate) : formatDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
            const endStr = endDate ? formatDate(endDate) : formatDate(new Date());

            const result = await this.makeRequest('DetailedOrderListRequest', `
                <searchData>
                    <period>
                        <startDate>${startStr}</startDate>
                        <endDate>${endStr}</endDate>
                    </period>
                </searchData>
                <pagingData>
                    <currentPage>0</currentPage>
                    <pageSize>50</pageSize>
                </pagingData>
            `);

            const orderList = result?.orderList?.order || [];
            // orderList tek bir obje de olabilir, array de
            const orders = Array.isArray(orderList) ? orderList : [orderList];

            return orders.map((order: any) => this.mapOrder(order)).filter((o: any) => o !== null);
        } catch (error) {
            console.error('N11 sipariş çekme hatası:', error);
            throw error;
        }
    }

    private mapOrder(n11Order: any): MarketplaceOrder { // Returns MarketplaceOrder
        if (!n11Order || !n11Order.id) return null as any;

        // Ürün listesi tek veya çok olabilir
        const itemList = n11Order.itemList?.item || [];
        const items = Array.isArray(itemList) ? itemList : [itemList];

        return {
            id: n11Order.id.toString(),
            orderNumber: n11Order.orderNumber,
            customerName: n11Order.billingAddress?.fullName || 'Misafir',
            customerEmail: n11Order.buyer?.email || '', // N11 e-posta vermeyebilir
            orderDate: new Date(n11Order.createDate), // DFormatı kontrol edilmeli, genelde çalışır
            status: this.mapStatus(n11Order.status),
            totalAmount: parseFloat(n11Order.billingTemplate?.totalPrice || '0'),
            currency: 'TRY',
            cargoTrackingNumber: n11Order.shipmentInfo?.trackingNumber,
            cargoProvider: n11Order.shipmentInfo?.campaignNumber ? 'Kampanyalı' : (n11Order.shipmentCompany?.name || 'Diğer'),
            shippingAddress: {
                fullName: n11Order.shippingAddress?.fullName || '',
                address: n11Order.shippingAddress?.address || '',
                city: n11Order.shippingAddress?.city || '',
                district: n11Order.shippingAddress?.district || '',
                phone: n11Order.shippingAddress?.gsm || ''
            },
            invoiceAddress: {
                fullName: n11Order.billingAddress?.fullName || '',
                address: n11Order.billingAddress?.address || '',
                city: n11Order.billingAddress?.city || '',
                district: n11Order.billingAddress?.district || '',
                phone: n11Order.billingAddress?.gsm || ''
            },
            items: items.map((item: any) => ({
                productName: item.productName,
                sku: item.sellerStockCode || item.productId, // Merchant SKU is better
                quantity: parseInt(item.quantity || '1'),
                price: parseFloat(item.price || '0'), // Birim fiyat (N11 sellerInvoiceAmount verebilir)
                taxRate: 0, // API'den gelmeyebilir
                discountAmount: parseFloat(item.discountAmount || '0')
            }))
        };
    }

    private mapStatus(n11Status: string): string {
        const statuses: { [key: string]: string } = {
            'New': 'Yeni Sipariş',
            'Approved': 'Onaylandı',
            'Rejected': 'İptal Edildi',
            'Shipped': 'Kargolandı',
            'Delivered': 'Teslim Edildi',
            'Completed': 'Tamamlandı'
        };
        return statuses[n11Status] || n11Status;
    }
}
