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

            // BYPASS PROXY for Auth: OAuth2 servers usually don't have IP whitelists.
            // The proxy at .156 seems to return "OK" for POST requests instead of forwarding them.
            const fetchUrl = this.authUrl;

            console.log(`[PAZARAMA_AUTH] Fetching token directly from: ${fetchUrl}`);

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
            let data: any;
            try {
                data = JSON.parse(text);
            } catch (e: any) {
                throw new Error(`Pazarama Auth JSON Parse Error: ${e.message}. Body: ${text.substring(0, 100)}`);
            }

            // Pazarama sometimes wraps the token response in a standard result object
            // keys: [ 'success', 'messageCode', 'message', 'userMessage', 'data' ]
            let tokenSource = data;
            if (data.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
                tokenSource = data.data;
            }

            // Pazarama sometimes uses access_token (standard) or AccessToken (pascal)
            this.accessToken = tokenSource.access_token || tokenSource.AccessToken || tokenSource.accessToken;

            if (!this.accessToken) {
                console.error('[PAZARAMA_AUTH_FAIL] Received keys:', Object.keys(data));
                const errorDetail = data.userMessage || data.message || 'No token found in response';
                console.error('[PAZARAMA_AUTH_MSG]:', errorDetail);
                throw new Error(`Pazarama Auth Error: ${errorDetail}`);
            }

            // Set expiry with a small buffer (5 mins)
            const expiresIn = Number(tokenSource.expires_in || tokenSource.ExpiresIn || tokenSource.expiresIn || 3600);
            this.tokenExpiry = Date.now() + (expiresIn * 1000) - 300000;

            console.log(`[PAZARAMA_AUTH] Token received successfully. Length: ${this.accessToken.length}`);

            return this.accessToken;
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
        const allOrders: MarketplaceOrder[] = [];
        const start = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const end = endDate || new Date();

        // Pazarama limits date range to 30 days. We chunk it.
        const CHUNK_DAYS = 30;
        let currentStart = new Date(start);

        while (currentStart < end) {
            let currentEnd = new Date(currentStart);
            currentEnd.setDate(currentEnd.getDate() + CHUNK_DAYS);
            if (currentEnd > end) currentEnd = new Date(end);

            const chunkOrders = await this.fetchOrdersInRange(currentStart, currentEnd);
            allOrders.push(...chunkOrders);

            // Move to next chunk (next day after currentEnd)
            currentStart = new Date(currentEnd);
            currentStart.setDate(currentStart.getDate() + 1);
        }

        return allOrders;
    }

    private async fetchOrdersInRange(start: Date, end: Date): Promise<MarketplaceOrder[]> {
        const rangeOrders: MarketplaceOrder[] = [];
        const startDateStr = start.toISOString().split('T')[0];
        const endDateStr = end.toISOString().split('T')[0];
        const url = `${this.baseUrl}/order/getOrdersForApi`;

        let pageNumber = 1;
        const pageSize = 100;
        let hasMore = true;

        while (hasMore) {
            const body = {
                pageSize,
                pageNumber,
                startDate: startDateStr,
                endDate: endDateStr
            };

            console.log(`[PAZARAMA_GET_ORDERS] POST to: ${url}`, body);

            const response = await fetch(url, {
                method: 'POST',
                headers: await this.getHeaders(),
                body: JSON.stringify(body)
            });

            console.log(`[PAZARAMA_RESPONSE] Status: ${response.status}`);

            const text = await response.text();
            if (!response.ok) {
                console.error(`[PAZARAMA_ERROR_TEXT]: ${text.slice(0, 1000)}`);
                throw new Error(`Pazarama HTTP Error: ${response.status}`);
            }

            let result;
            try {
                result = JSON.parse(text);
            } catch (e: any) {
                console.error(`Pazarama JSON parse hatası. İçerik: "${text.substring(0, 500)}"`);
                throw new Error(`Pazarama geçersiz yanıt (JSON bekleniyor)`);
            }

            // SUCCESS CHECK (CRITICAL)
            if (result.success === false) {
                const errorDetail = result.userMessage || result.message || 'API rejected request';
                console.error(`[PAZARAMA_API_REJECTED] ${result.messageCode}: ${errorDetail}`);
                throw new Error(`Pazarama API Hatası: ${errorDetail}`);
            }

            const data = Array.isArray(result.data) ? result.data : [];
            console.log(`[PAZARAMA_RANGE_RESULT] Page ${pageNumber}, items: ${data.length}, total: ${result.totalCount || '?'}`);

            rangeOrders.push(...data.map((order: any) => this.mapOrder(order)));

            // Pagination logic: if we got a full page and there's a next page flag
            // Pazarama docs/behavior might use hasNextPage or totalCount
            const totalCount = Number(result.totalCount || 0);
            const loadedSoFar = (pageNumber - 1) * pageSize + data.length;

            if (result.hasNextPage === true || (totalCount > loadedSoFar && data.length > 0)) {
                pageNumber++;
            } else {
                hasMore = false;
            }
        }

        return rangeOrders;
    }

    async getOrderByNumber(orderNumber: string): Promise<MarketplaceOrder | null> {
        try {
            // Using the same POST endpoint with orderNumber filter if supported, 
            // or searching in a small window.
            const url = `${this.baseUrl}/order/getOrdersForApi`;
            const body = {
                pageSize: 10,
                pageNumber: 1,
                orderNumber: orderNumber
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: await this.getHeaders(),
                body: JSON.stringify(body)
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
            // Updated to potential partner API naming convention if Order/GetCargoLabel fails
            const url = `${this.baseUrl}/order/getLabelForApi?orderNumber=${orderNumber}`;
            const fetchUrl = url;

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
        // Diagnostic: If items are missing, log keys for first occurrence
        const items = pzOrder.items || pzOrder.orderItems || pzOrder.orderItemDetails || [];
        const totalAmount = pzOrder.totalPrice || pzOrder.totalAmount || pzOrder.grossAmount || 0;

        if (items.length === 0) {
            console.warn(`[PAZARAMA_MAP_WARN] Order ${pzOrder.orderNumber} has no items. Keys: ${Object.keys(pzOrder).join(',')}`);
        }

        const firstName = pzOrder.customerFirstName || pzOrder.recipientFirstName || '';
        const lastName = pzOrder.customerLastName || pzOrder.recipientLastName || '';
        const customerName = `${firstName} ${lastName}`.trim() || pzOrder.recipientName || 'Müşteri';

        return {
            id: String(pzOrder.orderNumber),
            orderNumber: String(pzOrder.orderNumber),
            customerName,
            customerEmail: pzOrder.customerEmail || '',
            orderDate: new Date(pzOrder.orderDate),
            status: this.mapStatus(pzOrder.orderStatus),
            totalAmount: Number(totalAmount),
            currency: 'TRY',
            cargoTrackingNumber: pzOrder.cargoTrackingNumber,
            cargoProvider: pzOrder.cargoProviderName,
            shipmentPackageId: String(pzOrder.orderNumber),
            shippingAddress: {
                fullName: `${pzOrder.shippingAddress?.firstName || ''} ${pzOrder.shippingAddress?.lastName || ''}`.trim() || pzOrder.shippingAddress?.fullName || '',
                address: pzOrder.shippingAddress?.fullAddress || '',
                city: pzOrder.shippingAddress?.city || '',
                district: pzOrder.shippingAddress?.district || '',
                phone: pzOrder.shippingAddress?.phone || ''
            },
            invoiceAddress: {
                fullName: `${pzOrder.billingAddress?.firstName || ''} ${pzOrder.billingAddress?.lastName || ''}`.trim() || pzOrder.billingAddress?.fullName || '',
                address: pzOrder.billingAddress?.fullAddress || '',
                city: pzOrder.billingAddress?.city || '',
                district: pzOrder.billingAddress?.district || '',
                phone: pzOrder.billingAddress?.phone || ''
            },
            items: items.map((item: any) => ({
                productName: item.productName || item.itemName || item.name || 'Ürün',
                sku: item.sku || item.merchantSku || item.productSku || item.barcode,
                quantity: Number(item.quantity || 1),
                price: Number(item.price || item.unitPrice || 0),
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
