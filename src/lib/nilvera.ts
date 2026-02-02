import axios from 'axios';

export interface NilveraConfig {
    apiKey?: string;
    username?: string;
    password?: string;
    environment: 'test' | 'production';
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
        this.baseUrl = config.environment === 'production'
            ? 'https://api.nilvera.com'
            : 'https://apitest.nilvera.com';
    }

    private getHeaders() {
        return {
            'Authorization': `Bearer ${this.apiKey || this.token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
    }

    async login(): Promise<void> {
        if (this.apiKey) return;
        try {
            const response = await axios.post(`${this.baseUrl}/general/Login`, {
                UserName: this.username,
                Password: this.password
            });
            if (response.data && response.data.Token) {
                this.token = response.data.Token;
            }
        } catch (error: any) {
            console.error('Nilvera Login Error:', error.response?.data || error.message);
        }
    }

    async checkUser(vkn: string): Promise<{ isEInvoiceUser: boolean; alias?: string }> {
        try {
            const response = await axios.get(`${this.baseUrl}/general/CheckUser/${vkn}`, {
                headers: this.getHeaders()
            });
            const data = response.data;
            let isEInvoiceUser = false;
            let alias = '';
            if (Array.isArray(data) && data.length > 0) {
                isEInvoiceUser = true;
                const gibAlias = data.find((item: any) => item.Alias && item.Alias.includes('gib.gov.tr'));
                alias = gibAlias ? gibAlias.Alias : data[0].Alias;
            } else if (data && data.IsEInvoiceUser) {
                isEInvoiceUser = true;
                alias = data.Alias || data.Aliases?.[0] || '';
            }
            return { isEInvoiceUser, alias };
        } catch (error) {
            return { isEInvoiceUser: false };
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

    async sendInvoice(invoiceData: any, type: 'EFATURA' | 'EARSIV'): Promise<{ success: boolean; resultMsg?: string; formalId?: string; error?: string }> {
        const endpoint = type === 'EFATURA' ? '/EInvoice/Send/Model' : '/EArchive/Send/Model';
        try {
            const response = await axios.post(`${this.baseUrl}${endpoint}`, invoiceData, {
                headers: this.getHeaders(),
                validateStatus: () => true
            });

            if (response.status >= 400) {
                const errorData = response.data;
                let msg = 'Bilinmeyen Hata';
                if (errorData) {
                    if (typeof errorData === 'string') msg = errorData;
                    else if (errorData.Message) msg = errorData.Message;
                    else if (errorData.Errors) msg = Array.isArray(errorData.Errors) ? errorData.Errors.map((e: any) => e.Description || e.Message).join(', ') : JSON.stringify(errorData.Errors);
                    else if (errorData.ModelState) msg = Object.values(errorData.ModelState).flat().join(', ');
                    else msg = JSON.stringify(errorData);
                }
                return { success: false, error: `Nilvera Hatası (${response.status}): ${msg}` };
            }

            const result = Array.isArray(response.data) ? response.data[0] : response.data;
            if (result && (result.UUID || result.InvoiceNumber || result.Id)) {
                return {
                    success: true,
                    formalId: result.UUID || result.InvoiceNumber || result.Id,
                    resultMsg: 'Başarılı'
                };
            }
            return { success: false, error: 'Nilvera geçersiz yanıt döndürdü.' };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    async sendDespatch(despatchData: any): Promise<{ success: boolean; resultMsg?: string; formalId?: string; error?: string }> {
        try {
            const response = await axios.post(`${this.baseUrl}/EDespatch/Send/Model`, despatchData, {
                headers: this.getHeaders()
            });
            const result = Array.isArray(response.data) ? response.data[0] : response.data;
            return { success: true, formalId: result.UUID };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }
}
