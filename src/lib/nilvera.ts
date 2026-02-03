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
            const response = await axios.get(`${this.baseUrl}/general/CheckUser/${cleanVkn}`, {
                headers: this.getHeaders(),
                validateStatus: () => true
            });

            const data = response.data;
            let isEInvoiceUser = false;
            let alias = '';

            // 1. Array formatı (En yaygın)
            if (Array.isArray(data) && data.length > 0) {
                isEInvoiceUser = true;
                const pkGib = data.find((item: any) =>
                    (item.Alias || item.alias || "").toLowerCase().includes('pk') &&
                    (item.Alias || item.alias || "").toLowerCase().includes('gib.gov.tr')
                );
                const anyPk = data.find((item: any) =>
                    (item.Alias || item.alias || "").toLowerCase().includes('pk') ||
                    (item.Type || item.type || "").toLowerCase() === 'pk'
                );
                const first = data[0];
                const firstAlias = typeof first === 'string' ? first : (first.Alias || first.alias || first.Role || first.name || '');

                alias = (pkGib?.Alias || pkGib?.alias) || (anyPk?.Alias || anyPk?.alias) || firstAlias;
            }
            // 2. Obje formatı
            else if (data && typeof data === 'object' && !Array.isArray(data)) {
                if (data.IsEInvoiceUser || data.isEInvoiceUser || data.UserType === 'EFATURA') {
                    isEInvoiceUser = true;
                }
                const rawAlias = data.Alias || data.alias || data.SelectedAlias;
                const rawAliases = data.Aliases || data.aliases || data.aliasesList || data.Items;

                if (rawAlias) {
                    alias = rawAlias;
                    isEInvoiceUser = true;
                } else if (Array.isArray(rawAliases) && rawAliases.length > 0) {
                    alias = rawAliases[0].Alias || rawAliases[0].alias || (typeof rawAliases[0] === 'string' ? rawAliases[0] : '');
                    isEInvoiceUser = true;
                }
            }

            return {
                isEInvoiceUser,
                alias: alias?.toString().trim(),
                rawData: data // Debug için ham veriyi de dönüyoruz
            };
        } catch (error: any) {
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
