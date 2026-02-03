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

                // ÖNCELİK 1: Posta Kutusu (PK) olan ve GIB içeren etiket
                const pkGib = data.find((item: any) =>
                    (item.Alias || item.alias || "").toLowerCase().includes('pk') &&
                    (item.Alias || item.alias || "").toLowerCase().includes('gib.gov.tr')
                );

                // ÖNCELİK 2: Herhangi bir PK etiketi
                const anyPk = data.find((item: any) =>
                    (item.Alias || item.alias || "").toLowerCase().includes('pk') ||
                    (item.Type || item.type || "").toLowerCase() === 'pk'
                );

                // ÖNCELİK 3: Herhangi bir etiket
                const first = data[0];
                const firstAlias = typeof first === 'string' ? first : (first.Alias || first.alias || '');

                alias = (pkGib?.Alias || pkGib?.alias) || (anyPk?.Alias || anyPk?.alias) || firstAlias;
            }
            // Yanıt tekil obje ise
            else if (data && typeof data === 'object') {
                if (data.IsEInvoiceUser || data.isEInvoiceUser || data.UserType === 'EFATURA') {
                    isEInvoiceUser = true;
                }

                // Bazı objelerde direkt Alias veya Aliases listesi olabilir
                const rawAlias = data.Alias || data.alias || data.SelectedAlias;
                const rawAliases = data.Aliases || data.aliases;

                if (rawAlias) {
                    alias = rawAlias;
                    isEInvoiceUser = true;
                } else if (Array.isArray(rawAliases) && rawAliases.length > 0) {
                    const firstA = rawAliases[0];
                    alias = typeof firstA === 'string' ? firstA : (firstA.Alias || firstA.alias || '');
                    isEInvoiceUser = true;
                }
            }

            // Eğer hala alias bulunamadıysa ama isEInvoiceUser true ise, Nilvera'nın e-fatura olduğunu bildiği bir durumdayız
            return { isEInvoiceUser, alias };
        } catch (error: any) {
            // Eğer 404 dönüyorsa genellikle kullanıcı sistemde kayıtlı değildir (e-Arşiv)
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
