import axios from 'axios';

export interface NilveraConfig {
    apiKey: string;
    environment: 'test' | 'production';
}

export class NilveraService {
    private apiKey: string;
    private baseUrl: string;

    constructor(config: NilveraConfig) {
        this.apiKey = config.apiKey;
        this.baseUrl = config.environment === 'production'
            ? 'https://api.nilvera.com'
            : 'https://apitest.nilvera.com';
    }

    private getHeaders() {
        return {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
        };
    }

    async checkUser(vkn: string): Promise<{ isEInvoiceUser: boolean; aliases?: any[] }> {
        try {
            const response = await axios.get(`${this.baseUrl}/general/CheckUser/${vkn}`, {
                headers: this.getHeaders()
            });
            return {
                isEInvoiceUser: response.data.IsEInvoiceUser,
                aliases: response.data.Aliases
            };
        } catch (error: any) {
            console.error('Nilvera checkUser error:', error.response?.data || error.message);
            // If authorized but check failed (e.g. 404), return false. 
            // If unauthorized (401), throw error to alert connection failure.
            if (error.response?.status === 401 || error.response?.status === 403) {
                throw new Error('Yetkisiz Erişim: API Key geçersiz.');
            }
            // For other errors, we might assume user is not found or other non-critical issues for checking flow
            // BUT for connection test, we should surface errors.
            // Let's throw all errors if we are in a connection test context. 
            // However, this Service is shared. Let's make it robust: 
            // 401/403 -> Throw
            // Network Error -> Throw
            // 400 Bad Request -> Throw
            throw error;
        }
    }

    async sendInvoice(invoiceData: any, type: 'EFATURA' | 'EARSIV'): Promise<{ success: boolean; resultMsg?: string; formalId?: string; error?: string }> {
        const endpoint = type === 'EFATURA' ? '/einvoice/Send/Model' : '/earchive/Send/Model';
        try {
            const response = await axios.post(`${this.baseUrl}${endpoint}`, invoiceData, {
                headers: this.getHeaders()
            });

            // Nilvera typically returns a UUID and sometimes a status message
            // Note: In real scenarios, Nilvera returns an array of results or a single object depending on the count
            const result = Array.isArray(response.data) ? response.data[0] : response.data;

            if (result && (result.UUID || result.Id)) {
                return {
                    success: true,
                    formalId: result.UUID, // Or ReferenceId
                    resultMsg: 'Belge başarıyla kuyruğa eklendi.'
                };
            }

            return {
                success: false,
                error: 'Nilvera geçersiz yanıt döndürdü.'
            };
        } catch (error: any) {
            console.error('Nilvera sendInvoice error:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.Message || error.message
            };
        }
    }

    async sendDespatch(despatchData: any): Promise<{ success: boolean; resultMsg?: string; formalId?: string; error?: string }> {
        try {
            const response = await axios.post(`${this.baseUrl}/edespatch/Send/Model`, despatchData, {
                headers: this.getHeaders()
            });
            const result = Array.isArray(response.data) ? response.data[0] : response.data;

            if (result && (result.UUID || result.Id)) {
                return {
                    success: true,
                    formalId: result.UUID,
                    resultMsg: 'İrsaliye başarıyla kuyruğa eklendi.'
                };
            }

            return {
                success: false,
                error: 'Nilvera geçersiz yanıt döndürdü.'
            };
        } catch (error: any) {
            console.error('Nilvera sendDespatch error:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.Message || error.message
            };
        }
    }
}
