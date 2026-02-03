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

    async checkUser(vkn: string): Promise<{ isEInvoiceUser: boolean; alias?: string }> {
        if (!vkn) return { isEInvoiceUser: false };
        const cleanVkn = vkn.replace(/\s/g, '');

        try {
            const response = await axios.get(`${this.baseUrl}/general/CheckUser/${cleanVkn}`, {
                headers: this.getHeaders()
            });

            const data = response.data;
            let isEInvoiceUser = false;
            let alias = '';

            // Nilvera yanıtı array ise (En yaygın durum)
            if (Array.isArray(data) && data.length > 0) {
                isEInvoiceUser = true;
                // ÖNCELİK 1: İçinde 'pk' ve 'gib.gov.tr' geçen Posta Kutusu etiketi
                const bestPk = data.find((item: any) =>
                    item.Alias &&
                    item.Alias.toLowerCase().includes('pk') &&
                    item.Alias.toLowerCase().includes('gib.gov.tr')
                );
                // ÖNCELİK 2: Herhangi bir 'pk' etiketi
                const secondaryPk = data.find((item: any) => item.Alias && item.Alias.toLowerCase().includes('pk'));

                alias = bestPk?.Alias || secondaryPk?.Alias || data[0].Alias;
            }
            // Yanıt tekil obje ise
            else if (data && data.IsEInvoiceUser) {
                isEInvoiceUser = true;
                alias = data.Alias || (Array.isArray(data.Aliases) ? data.Aliases[0] : '');
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

    async sendInvoice(invoiceData: any, type: 'EFATURA' | 'EARSIV'): Promise<{ success: boolean; resultMsg?: string; formalId?: string; error?: string; errorCode?: number }> {
        const endpoint = type === 'EFATURA' ? '/EInvoice/Send/Model' : '/EArchive/Send/Model';
        try {
            const response = await axios.post(`${this.baseUrl}${endpoint}`, invoiceData, {
                headers: this.getHeaders(),
                validateStatus: () => true
            });

            if (response.status >= 400) {
                const errorData = response.data;
                let msg = 'İşlem Başarısız';
                if (errorData) {
                    if (typeof errorData === 'string') msg = errorData;
                    else if (errorData.Errors) msg = Array.isArray(errorData.Errors) ? errorData.Errors.map((e: any) => e.Description || e.Message || JSON.stringify(e)).join(' | ') : JSON.stringify(errorData.Errors);
                    else if (errorData.Message) msg = errorData.Message;
                    else if (errorData.ModelState) msg = Object.values(errorData.ModelState).flat().join(' | ');
                }
                return { success: false, error: msg, errorCode: response.status };
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
