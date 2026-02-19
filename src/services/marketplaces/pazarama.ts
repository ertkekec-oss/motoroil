import { IMarketplaceService, MarketplaceOrder, PazaramaConfig } from './types';

export class PazaramaService implements IMarketplaceService {
    private config: PazaramaConfig;
    private baseUrl: string;
    private authUrl: string;
    private accessToken: string | null = null;
    private tokenExpiry: number = 0;

    constructor(config: PazaramaConfig) {
        this.config = config;
        // Official API base URL: isortagimapi.pazarama.com
        // Sandbox/Staging usually uses a different subdomain or the same one with test credentials
        this.baseUrl = config.isTest
            ? 'https://isortagimapi-sandbox.pazarama.com' // Common pattern, fallback if needed
            : 'https://isortagimapi.pazarama.com';

        // If the sandbox URL above is wrong, Pazarama docs often point to the same base URL
        if (config.isTest && this.baseUrl.includes('sandbox')) {
            // Some versions of Pazarama API use the same base for both
            this.baseUrl = 'https://isortagimapi.pazarama.com';
        }

        this.authUrl = 'https://isortagimgiris.pazarama.com/connect/token';
    }

    private async getAccessToken(): Promise<string> {
        // Return cached token if valid
        if (this.accessToken && Date.now() < this.tokenExpiry) {
            return this.accessToken;
        }

        try {
            const authString = Buffer.from(`${this.config.apiKey}:${this.config.apiSecret}`).toString('base64');

            const effectiveProxy = process.env.MARKETPLACE_PROXY_URL?.trim();
            const fetchUrl = effectiveProxy ? `${effectiveProxy}?url=${encodeURIComponent(this.authUrl)}` : this.authUrl;

            console.log(`[PAZARAMA_AUTH] Fetching token from: ${fetchUrl} (Direct: ${this.authUrl})`);

            const response = await fetch(fetchUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${authString}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json'
                },
                body: 'grant_type=client_credentials&scope=merchantgatewayapi.fullaccess'
            });

            if (!response.ok) {
                const err = await response.text();
                throw new Error(`Pazarama Auth Error: ${response.status} - ${err}`);
            }

            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e: any) {
                throw new Error(`Pazarama Auth JSON Parse Error: ${e.message}. Body: ${text.substring(0, 100)}`);
            }

            this.accessToken = data.access_token;
            // Set expiry with a small buffer (5 mins)
            this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 300000;

            return this.accessToken!;
        } catch (error) {
            console.error('Pazarama Access Token Error:', error);
            throw error;
        }
    }

    private async getHeaders(): Promise<Record<string, string>> {
        const token = await this.getAccessToken();
        const headers: Record<string, string> = {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };

        const proxyKey = process.env.PERIODYA_PROXY_KEY?.trim();
        if (proxyKey) {
            headers['X-Periodya-Key'] = proxyKey;
        }

        return headers;
    }

    async validateConnection(): Promise<boolean> {
        try {
            await this.getAccessToken();
            return true;
        } catch (error) {
            return false;
        }
    }

    async getOrders(startDate?: Date, endDate?: Date): Promise<MarketplaceOrder[]> {
        try {
            const queryParams = new URLSearchParams();

            const start = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            const end = endDate || new Date();

            queryParams.append('StartDate', start.toISOString().split('T')[0]);
            queryParams.append('EndDate', end.toISOString().split('T')[0]);
            queryParams.append('Page', '1');
            queryParams.append('Size', '100');

            const url = `${this.baseUrl}/order/get-orders?${queryParams.toString()}`;
            const effectiveProxy = process.env.MARKETPLACE_PROXY_URL?.trim();
            const fetchUrl = effectiveProxy ? `${effectiveProxy}?url=${encodeURIComponent(url)}` : url;

            const response = await fetch(fetchUrl, {
                headers: await this.getHeaders()
            });

            if (!response.ok) {
                const err = await response.text();
                throw new Error(`Pazarama GetOrders Error: ${response.status} - ${err}`);
            }

            const text = await response.text();
            let result;
            try {
                result = JSON.parse(text);
            } catch (e: any) {
                console.error(`Pazarama JSON parse hatası. İçerik: "${text.substring(0, 500)}"`);
                throw new Error(`Pazarama geçersiz yanıt (JSON bekleniyor): ${text.substring(0, 50)}`);
            }

            if (!result.isSuccess || !result.data) {
                return [];
            }

            return result.data.map((order: any) => this.mapOrder(order));
        } catch (error) {
            console.error('Pazarama sipariş çekme hatası:', error);
            throw error;
        }
    }

    async getOrderByNumber(orderNumber: string): Promise<MarketplaceOrder | null> {
        try {
            const url = `${this.baseUrl}/order/get-orders?orderNumber=${encodeURIComponent(orderNumber)}`;
            const response = await fetch(url, {
                headers: await this.getHeaders(),
            });

            if (!response.ok) return null;
            const result = await response.json();

            if (!result.isSuccess || !result.data || result.data.length === 0) {
                return null;
            }

            return this.mapOrder(result.data[0]);
        } catch (error) {
            console.error('Pazarama tek sipariş çekme hatası:', error);
            return null;
        }
    }

    async getCargoLabel(orderNumber: string): Promise<{ pdfBase64?: string; error?: string }> {
        try {
            const url = `${this.baseUrl}/order/get-cargo-label?orderNumber=${orderNumber}`;
            const effectiveProxy = process.env.MARKETPLACE_PROXY_URL?.trim();
            const fetchUrl = effectiveProxy ? `${effectiveProxy}?url=${encodeURIComponent(url)}` : url;

            const response = await fetch(fetchUrl, {
                headers: await this.getHeaders()
            });

            if (!response.ok) {
                const err = await response.text();
                return { error: `Etiket alınamadı: ${response.status}` };
            }

            // Pazarama usually returns PDF binary or a JSON with base64
            const ct = response.headers.get('content-type') || '';
            if (ct.includes('application/json')) {
                const json = await response.json();
                return { pdfBase64: json.data?.labelBase64 || json.data };
            } else {
                const ab = await response.arrayBuffer();
                return { pdfBase64: Buffer.from(ab).toString('base64') };
            }
        } catch (error: any) {
            return { error: error.message };
        }
    }

    private mapOrder(pzOrder: any): MarketplaceOrder {
        return {
            id: pzOrder.orderNumber,
            orderNumber: pzOrder.orderNumber,
            customerName: `${pzOrder.customerFirstName || ''} ${pzOrder.customerLastName || ''}`.trim() || 'Müşteri',
            customerEmail: pzOrder.customerEmail || '',
            orderDate: new Date(pzOrder.orderDate),
            status: this.mapStatus(pzOrder.orderStatus),
            totalAmount: Number(pzOrder.totalPrice || 0),
            currency: 'TRY',
            cargoTrackingNumber: pzOrder.cargoTrackingNumber,
            cargoProvider: pzOrder.cargoProviderName,
            shipmentPackageId: pzOrder.orderNumber, // Pazarama usually uses orderNumber as reference
            shippingAddress: {
                fullName: `${pzOrder.shippingAddress?.firstName || ''} ${pzOrder.shippingAddress?.lastName || ''}`.trim(),
                address: pzOrder.shippingAddress?.fullAddress || '',
                city: pzOrder.shippingAddress?.city || '',
                district: pzOrder.shippingAddress?.district || '',
                phone: pzOrder.shippingAddress?.phone || ''
            },
            invoiceAddress: {
                fullName: `${pzOrder.billingAddress?.firstName || ''} ${pzOrder.billingAddress?.lastName || ''}`.trim(),
                address: pzOrder.billingAddress?.fullAddress || '',
                city: pzOrder.billingAddress?.city || '',
                district: pzOrder.billingAddress?.district || '',
                phone: pzOrder.billingAddress?.phone || ''
            },
            items: (pzOrder.orderItems || []).map((item: any) => ({
                productName: item.productName,
                sku: item.sku || item.merchantSku,
                quantity: Number(item.quantity || 1),
                price: Number(item.price || 0),
                taxRate: Number(item.taxRate || 20),
                discountAmount: Number(item.discountAmount || 0)
            }))
        };
    }

    private mapStatus(status: number | string): string {
        // Common Pazarama status mapping
        const statusMap: Record<string, string> = {
            '1': 'Yeni Sipariş',
            '2': 'Onaylandı',
            '3': 'Kargoya Verildi',
            '4': 'Teslim Edildi',
            '5': 'İptal Edildi',
            '6': 'İade Edildi',
            'Created': 'Yeni Sipariş',
            'Approved': 'Onaylandı',
            'Shipped': 'Kargolandı',
            'Delivered': 'Teslim Edildi',
            'Cancelled': 'İptal Edildi'
        };
        return statusMap[status.toString()] || status.toString();
    }
}
