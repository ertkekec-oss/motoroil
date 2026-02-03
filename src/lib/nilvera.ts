import axios from 'axios';

export interface NilveraConfig {
    apiKey?: string;
    username?: string;
    password?: string;
    environment: 'test' | 'production';
    baseUrl?: string;
}

export class NilveraService {
    private apiKey?: string;
    private username?: string;
    private password?: string;
    private baseUrl: string;
    private token?: string;

    constructor(config: NilveraConfig) {
        this.apiKey = config.apiKey?.trim();
        this.username = config.username?.trim();
        this.password = config.password?.trim();

        if (config.baseUrl) {
            this.baseUrl = config.baseUrl.endsWith('/') ? config.baseUrl.slice(0, -1) : config.baseUrl;
        } else {
            this.baseUrl = config.environment === 'production'
                ? 'https://api.nilvera.com'
                : 'https://apitest.nilvera.com';
        }
    }

    private getHeaders() {
        return {
            'Authorization': `Bearer ${this.apiKey || this.token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
    }

    async checkUser(vkn: string): Promise<{ isEInvoiceUser: boolean; alias?: string; rawData?: any }> {
        if (!vkn) return { isEInvoiceUser: false };
        const cleanVkn = vkn.replace(/\s/g, '');

        try {
            // DOĞRU ENDPOINT: GlobalCompany/Check
            const response = await axios.get(`${this.baseUrl}/general/GlobalCompany/Check/TaxNumber/${cleanVkn}?globalUserType=Invoice`, {
                headers: this.getHeaders(),
                validateStatus: () => true
            });

            const data = response.data;
            let isEInvoiceUser = false;
            let alias = '';

            // Yanıt boş dizi ise mükellef değildir.
            if (Array.isArray(data) && data.length > 0) {
                isEInvoiceUser = true;
                // İlk bulduğumuz alias'ı veya default olanı alalım
                // Genellikle: urn:mail:defaultpk@... olan tercih edilir ama herhangi biri de olur
                const defaultAlias = data.find((d: any) => d.Alias && d.Alias.includes('defaultpk'));
                alias = defaultAlias ? defaultAlias.Alias : data[0].Alias;
            }

            return { isEInvoiceUser, alias, rawData: data };
        } catch (error: any) {
            console.error("User Check Error Details:", error.response?.data || error.message);
            return { isEInvoiceUser: false, rawData: error.response?.data };
        }
    }

    async getCompanyInfo(): Promise<any> {
        try {
            const response = await axios.get(`${this.baseUrl}/general/Company`, {
                headers: this.getHeaders()
            });
            return response.data;
        } catch (error) {
            return null;
        }
    }

    async sendInvoice(invoiceData: any, type: 'EFATURA' | 'EARSIV'): Promise<{ success: boolean; resultMsg?: string; formalId?: string; error?: string; errorCode?: number }> {
        const endpoint = type === 'EFATURA' ? '/EInvoice/Send/Model' : '/EArchive/Send/Model';
        try {
            const response = await axios.post(`${this.baseUrl}${endpoint}`, invoiceData, {
                headers: this.getHeaders(),
                validateStatus: () => true
            });

            if (response.status >= 400) {
                const errorData = response.data;
                console.error('NILVERA RAW ERROR:', JSON.stringify(errorData, null, 2));

                let detailedMsg = '';
                if (errorData) {
                    if (typeof errorData === 'string') {
                        detailedMsg = errorData;
                    } else if (errorData.Errors && Array.isArray(errorData.Errors)) {
                        detailedMsg = errorData.Errors.map((e: any) => `[${e.Code || 'Hata'}] ${e.Description || e.Message}`).join(' | ');
                    } else if (errorData.ModelState) {
                        detailedMsg = Object.values(errorData.ModelState).flat().join(' | ');
                    } else if (errorData.Message || errorData.message) {
                        detailedMsg = errorData.Message || errorData.message;
                    } else {
                        detailedMsg = JSON.stringify(errorData);
                    }
                }

                return {
                    success: false,
                    error: detailedMsg || `Bilinmeyen API Hatası (${response.status})`,
                    errorCode: response.status
                };
            }

            const result = Array.isArray(response.data) ? response.data[0] : response.data;
            if (result && (result.UUID || result.InvoiceNumber || result.Id)) {
                return { success: true, formalId: result.InvoiceNumber || result.UUID || result.Id };
            }
            return { success: false, error: 'Nilvera geçersiz yanıt döndürdü.' };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }
}
