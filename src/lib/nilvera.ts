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
        // API Key ve giriş bilgilerindeki olası boşlukları temizle
        this.apiKey = config.apiKey?.trim();
        this.username = config.username?.trim();
        this.password = config.password?.trim();
        this.baseUrl = config.environment === 'production'
            ? 'https://api.nilvera.com'
            : 'https://apitest.nilvera.com';
    }

    private getHeaders() {
        if (this.token) {
            return {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            };
        }
        return {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
        };
    }

    async login(): Promise<void> {
        // Öncelik API Key'de. Eğer API Key varsa login endpointine gitme.
        if (this.apiKey) return;

        if (!this.username || !this.password) {
            throw new Error('API Key veya Kullanıcı Adı/Şifre gereklidir.');
        }

        try {
            const response = await axios.post(`${this.baseUrl}/General/Login`, {
                UserName: this.username,
                Password: this.password
            });

            if (response.data && response.data.Token) {
                this.token = response.data.Token;
            } else {
                throw new Error('Geçersiz kullanıcı adı veya şifre.');
            }
        } catch (error: any) {
            console.error('Nilvera Login Error:', error.response?.data || error.message);
            // Login endpointi 404 olabilir, bu durumda kullanıcıyı uyar.
            if (error.response?.status === 404) {
                throw new Error('Login servisi bulunamadı (404). Lütfen API Key kullanarak deneyin.');
            }
            throw new Error('Giriş başarısız: ' + (error.response?.data?.Message || error.message));
        }
    }

    async checkUser(vkn: string): Promise<{ isEInvoiceUser: boolean; alias?: string }> {
        try {
            const response = await axios.get(`${this.baseUrl}/General/CheckUser/${vkn}`, {
                headers: this.getHeaders()
            });

            const data = response.data;
            let isEInvoiceUser = false;
            let alias = '';

            if (Array.isArray(data) && data.length > 0) {
                isEInvoiceUser = true;
                // İlk bulduğumuz GİB aliasını alalım
                const gibAlias = data.find((item: any) => item.Alias && item.Alias.includes('gib.gov.tr'));
                alias = gibAlias ? gibAlias.Alias : data[0].Alias;
            } else if (data && data.IsEInvoiceUser) {
                isEInvoiceUser = true;
                alias = data.Alias || data.Aliases?.[0] || '';
            }

            return {
                isEInvoiceUser,
                alias
            };
        } catch (error: any) {
            console.error('Nilvera checkUser error:', error.response?.data || error.message);
            // Hata durumunda (örneğin 404) e-fatura kullanıcısı değil varsayalım
            return { isEInvoiceUser: false };
        }
    }

    async getCompanyInfo(): Promise<any> {
        try {
            // Dokümantasyona göre endpoint: /general/Company
            const response = await axios.get(`${this.baseUrl}/general/Company`, {
                headers: this.getHeaders()
            });
            return response.data;
        } catch (error: any) {
            console.error('Nilvera getCompanyInfo error:', error.response?.data || error.message);
            if (error.response?.status === 401 || error.response?.status === 403) {
                throw new Error('Yetkisiz Erişim: API Key geçersiz.');
            }
            throw error;
        }
    }

    async sendInvoice(invoiceData: any, type: 'EFATURA' | 'EARSIV'): Promise<{ success: boolean; resultMsg?: string; formalId?: string; error?: string }> {
        const endpoint = type === 'EFATURA' ? '/EInvoice/Send/Model' : '/EArchive/Send/Model';
        try {
            // Nilvera endpointi tekil obje bekliyor ("Cannot deserialize JSON array...").
            const payload = invoiceData;

            const response = await axios.post(`${this.baseUrl}${endpoint}`, payload, {
                headers: this.getHeaders(),
                validateStatus: () => true // 400 hatalarını catch'e düşürme, response'u inceleyelim
            });

            if (response.status >= 400) {
                // Hata detayını yakala
                const errorData = response.data;
                let msg = 'Bilinmeyen Hata';

                if (errorData) {
                    if (typeof errorData === 'string') msg = errorData;
                    else if (errorData.Message) msg = errorData.Message;
                    else if (errorData.Errors && Array.isArray(errorData.Errors)) msg = errorData.Errors.map((e: any) => e.Description || e.Message).join(', ');
                    else if (errorData.ModelState) msg = Object.values(errorData.ModelState).flat().join(', ');
                    else if (errorData.ValidationErrors) msg = errorData.ValidationErrors.map((e: any) => e.Message).join(', ');
                    else msg = JSON.stringify(errorData); // Hata formatını bilmiyorsak ham veriyi gösterelim
                } else {
                    msg = 'Sunucudan boş yanıt döndü.';
                }

                return {
                    success: false,
                    error: `Nilvera API Hatası (${response.status}): ${msg}`
                };
            }

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

            let errorMsg = error.response?.data?.Message || error.message;
            const data = error.response?.data;

            // Detaylı validasyon hatalarını yakala
            if (data) {
                if (typeof data === 'string') {
                    errorMsg = data;
                } else if (data.Errors && Array.isArray(data.Errors)) {
                    // Nilvera "Errors" yapısı
                    errorMsg = data.Errors.map((e: any) => e.Description || e.Message || e.Detail || JSON.stringify(e)).join(', ');
                } else if (data.ModelState) {
                    // ASP.NET Validation Errors
                    const errors = Object.values(data.ModelState).flat();
                    if (errors.length > 0) errorMsg = errors.join(', ');
                } else if (data.ValidationErrors && Array.isArray(data.ValidationErrors)) {
                    // Nilvera Validation Errors
                    errorMsg = data.ValidationErrors.map((e: any) => e.Message || e).join(', ');
                } else if (data.Message && data.Message !== errorMsg) {
                    // Eğer ana mesaj farklı bir detay içeriyorsa
                    errorMsg = data.Message;
                }
            }

            return {
                success: false,
                error: `Nilvera Hatası: ${errorMsg}`
            };
        }
    }

    async sendDespatch(despatchData: any): Promise<{ success: boolean; resultMsg?: string; formalId?: string; error?: string }> {
        try {
            const response = await axios.post(`${this.baseUrl}/EDespatch/Send/Model`, despatchData, {
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
