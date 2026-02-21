import { XMLParser } from 'fast-xml-parser';

export interface EcommerceOrder {
    orderId: string;
    customerName: string;
    customerEmail: string;
    orderDate: string;
    totalAmount: number;
    status: string;
    items: {
        productName: string;
        sku: string;
        quantity: number;
        price: number;
    }[];
}

export class EcommerceService {
    private url: string;
    private parser: XMLParser;

    constructor(url: string = 'https://www.periodya.com/xml.php?c=siparisler&xmlc=10a4cd8d5e') {
        this.url = url;
        this.parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: "@_"
        });
    }

    async fetchOrders(): Promise<EcommerceOrder[]> {
        try {
            console.log('Fetching orders from:', this.url);

            const response = await fetch(this.url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const xmlData = await response.text();

            // Eğer veri boşsa veya HTML döndüyse
            if (!xmlData || xmlData.trim().startsWith('<!DOCTYPE html>')) {
                console.warn('URL geçerli bir XML döndürmedi.');
                return [];
            }

            const jsonObj = this.parser.parse(xmlData);

            // XML Debug için console.log(JSON.stringify(jsonObj, null, 2));

            // <SIPARISLER><SIPARIS>... yapısı
            const root = jsonObj.SIPARISLER || jsonObj.root || jsonObj.orders;

            if (!root) {
                console.log('XML Root Bulunamadı. Gelen:', Object.keys(jsonObj));
                return [];
            }

            const ordersRaw = root.SIPARIS || root.order || [];
            const orders = Array.isArray(ordersRaw) ? ordersRaw : [ordersRaw];

            return orders.map((order: any) => {
                // Durum kodunu anlamsal duruma çevir (Örnek mapping)
                let status = 'Yeni';
                const durumNo = String(order.DURUM_NO);
                if (durumNo === '2') status = 'Hazırlanıyor'; // veya Onaylandı
                if (durumNo === '51') status = 'Kargolandı'; // Kargoya Teslim Edildi

                return {
                    orderId: String(order.SIPARIS_NO || order.id || 'UNKNOWN'),
                    customerName: order.TeslimAlici || order.customer_name || 'Misafir',
                    customerEmail: order.POSTA || order.email || '',
                    orderDate: order.TARIH ? new Date(`${order.TARIH}T${order.ZAMAN || '00:00:00'}`).toISOString() : new Date().toISOString(),
                    totalAmount: parseFloat(order.NET_TOPLAM || order.total || '0'),
                    status: status, // order.ODEME_DURUM da kullanılabilir
                    items: this.parseItems(order.SATIRLAR)
                };
            });

        } catch (error) {
            console.error('E-Ticaret entegrasyon hatası:', error);
            return [];
        }
    }

    private parseItems(itemsWrapper: any): any[] {
        if (!itemsWrapper) return [];
        // <SATIRLAR><SATIR>...</SATIR></SATIRLAR>
        const satirlar = itemsWrapper.SATIR || itemsWrapper.item || [];
        const itemsArray = Array.isArray(satirlar) ? satirlar : [satirlar];

        return itemsArray.map((item: any) => ({
            productName: item.ADI || item.name,
            sku: item.STOK_KODU || item.KOD || item.sku || '',
            quantity: parseInt(item.MIKTAR || item.qty || '1'),
            price: parseFloat(item.FIYAT || item.price || '0')
        }));
    }
}
