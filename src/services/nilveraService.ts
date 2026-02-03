import axios from 'axios';
import crypto from 'crypto';

// --- INTERFACES ---

export interface NilveraConfig {
    apiKey: string;
    baseUrl: string; // https://api.nilvera.com veya https://apitest.nilvera.com
}

export interface InvoiceLine {
    Name: string;
    Quantity: number;
    UnitType: string; // C62 (Adet) vb.
    Price: number;
    VatRate: number;
}

export interface CustomerInfo {
    TaxNumber: string;
    Name: string;
    Address: string;
    District: string;
    City: string;
    Country: string;
}

export interface InternetInfo {
    WebSite: string;
    PaymentMethod: string; // KREDIKARTI, BANKA vb.
    PaymentDate: string;
    TransporterName: string;
}

export interface CompanyInfo {
    TaxNumber: string;
    Name: string;
    Address: string;
    District: string;
    City: string;
    Country: string;
}

// --- SERVICE CLASS ---

export class NilveraInvoiceService {
    private config: NilveraConfig;

    constructor(config: NilveraConfig) {
        this.config = config;
    }

    private getHeaders() {
        return {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
    }

    /**
     * 1. Adım: Mükellefiyet Sorgulama
     */
    async checkTaxpayer(vkn: string): Promise<{ isEInvoiceUser: boolean; alias?: string }> {
        try {
            const res = await axios.get(
                `${this.config.baseUrl}/general/GlobalCompany/Check/TaxNumber/${vkn}?globalUserType=Invoice`,
                { headers: this.getHeaders() }
            );
            const data = res.data;
            if (Array.isArray(data) && data.length > 0) {
                // Alias veya alias alanlarından birini bul
                const findAlias = (item: any) => item.Alias || item.alias || item.identifier;

                const defaultAliasObj = data.find((d: any) => findAlias(d)?.toLowerCase().includes('defaultpk'));
                const finalAlias = defaultAliasObj ? findAlias(defaultAliasObj) : findAlias(data[0]);

                return {
                    isEInvoiceUser: true,
                    alias: finalAlias || "urn:mail:defaultpk@nilvera.com" // Kritik Fallback: Alias yoksa default ata
                };
            }
            return { isEInvoiceUser: false };
        } catch (error) {
            console.error("Nilvera Check Error:", error);
            // Hata durumunda e-Arşiv olarak devam etmesi daha güvenli
            return { isEInvoiceUser: false };
        }
    }

    /**
     * 2. Adım: Varsayılan Seri Çekme
     */
    async getDefaultSeries(type: 'EFATURA' | 'EARSIV'): Promise<string> {
        const module = type === 'EFATURA' ? 'einvoice' : 'earchive';
        try {
            // Dokümana göre: Filtreli çekmek daha garantidir
            const res = await axios.get(`${this.config.baseUrl}/${module}/Series?IsDefault=true&IsActive=true`, { headers: this.getHeaders() });
            const content = res.data?.Content || [];
            const defaultSeries = content[0]; // IsDefault=true filtresiyle geldiği için ilk eleman varsayılan olandır

            let seriesName = defaultSeries?.Name || (type === 'EFATURA' ? 'EFT' : 'ARS');

            // Güvenlik: E-Arşiv için yanlış seri seçilmesini engelle
            if (type === 'EARSIV' && (seriesName === '10B' || seriesName === 'EFT')) {
                seriesName = 'ARS';
            }

            return seriesName;
        } catch (error) {
            return type === 'EFATURA' ? 'EFT' : 'ARS';
        }
    }

    /**
     * 3. Adım: Akıllı Gönderim
     */
    async processAndSend(params: {
        customer: CustomerInfo,
        company: CompanyInfo,
        lines: InvoiceLine[],
        amounts: { base: number, tax: number, total: number },
        isInternetSale?: boolean,
        internetInfo?: InternetInfo
    }) {
        // 1. Mükellefiyete göre karar ver (Alias fallback içerde yapılıyor)
        const { isEInvoiceUser, alias } = await this.checkTaxpayer(params.customer.TaxNumber);

        const type = isEInvoiceUser ? 'EFATURA' : 'EARSIV';

        // 2. Doğru seriyi çek
        const series = await this.getDefaultSeries(type);

        // 3. Tarih ve Diğer Hazırlıklar...
        const trNow = new Date(new Date().getTime() + (3 * 60 * 60 * 1000));
        const issueDate = trNow.toISOString().split('.')[0];

        // 4. Model Normalizasyonu
        const invoiceLines = params.lines.map((line, idx) => {
            const lineExtensionAmount = Number((line.Quantity * line.Price).toFixed(2));
            const baseLine: any = {
                Index: idx + 1,
                Name: line.Name,
                Quantity: line.Quantity,
                UnitType: line.UnitType || "C62",
                LineExtensionAmount: lineExtensionAmount
            };

            if (isEInvoiceUser) {
                baseLine.UnitPrice = line.Price;
                baseLine.VatRate = line.VatRate;
                baseLine.VatAmount = Number((lineExtensionAmount * (line.VatRate / 100)).toFixed(2));
            } else {
                baseLine.Price = line.Price;
                baseLine.KDVPercent = line.VatRate;
                baseLine.KDVTotal = Number((lineExtensionAmount * (line.VatRate / 100)).toFixed(2));
            }
            return baseLine;
        });

        const invoiceInfo: any = {
            UUID: crypto.randomUUID(),
            InvoiceType: "SATIS",
            InvoiceProfile: isEInvoiceUser ? "TICARIFATURA" : "EARSIVFATURA",
            InvoiceSerieOrNumber: series,
            IssueDate: issueDate,
            CurrencyCode: "TRY",
            LineExtensionAmount: params.amounts.base,
            TaxExclusiveAmount: params.amounts.base,
            TaxInclusiveAmount: params.amounts.total,
            PayableAmount: params.amounts.total
        };

        if (!isEInvoiceUser) {
            invoiceInfo.SalesPlatform = params.isInternetSale ? "INTERNET" : "NORMAL";
            if (params.isInternetSale && params.internetInfo) {
                invoiceInfo.InternetInfo = {
                    WebSite: params.internetInfo.WebSite,
                    PaymentMethod: params.internetInfo.PaymentMethod,
                    PaymentDate: params.internetInfo.PaymentDate || issueDate.split('T')[0],
                    TransporterName: params.internetInfo.TransporterName
                };
            }
        }

        const payload = isEInvoiceUser
            ? { EInvoice: { InvoiceInfo: invoiceInfo, CompanyInfo: params.company, CustomerInfo: params.customer, InvoiceLines: invoiceLines }, CustomerAlias: alias }
            : { ArchiveInvoice: { InvoiceInfo: invoiceInfo, CompanyInfo: params.company, CustomerInfo: params.customer, InvoiceLines: invoiceLines } };

        const endpoint = isEInvoiceUser ? '/EInvoice/Send/Model' : '/EArchive/Send/Model';

        try {
            const response = await axios.post(`${this.config.baseUrl}${endpoint}`, payload, {
                headers: this.getHeaders(),
                validateStatus: () => true
            });

            if (response.status >= 400) {
                // Akıllı Hata Mesajı Çıkarma
                let errMsg = "Nilvera API Hatası";
                const d = response.data;
                if (d?.Errors && Array.isArray(d.Errors)) errMsg = d.Errors.map((e: any) => e.Description).join(" | ");
                else if (d?.Message) errMsg = d.Message;
                else if (typeof d === 'string') errMsg = d;

                return { success: false, status: response.status, error: errMsg, data: d };
            }

            return { success: true, status: response.status, data: response.data };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }
}
