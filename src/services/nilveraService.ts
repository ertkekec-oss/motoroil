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
    Email?: string;
    TaxOffice?: string;
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
    Email?: string;
    TaxOffice?: string;
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
                const findAlias = (item: any) => item.Alias || item.alias || item.identifier;
                const defaultAliasObj = data.find((d: any) => findAlias(d)?.toLowerCase().includes('defaultpk'));
                const finalAlias = defaultAliasObj ? findAlias(defaultAliasObj) : findAlias(data[0]);
                return { isEInvoiceUser: true, alias: finalAlias || "urn:mail:defaultpk@nilvera.com" };
            }
            return { isEInvoiceUser: false };
        } catch (error) {
            console.error("Nilvera Check Error:", error);
            return { isEInvoiceUser: false };
        }
    }

    async checkDespatchTaxpayer(vkn: string): Promise<{ isDespatchUser: boolean; alias?: string }> {
        try {
            const res = await axios.get(
                `${this.config.baseUrl}/general/GlobalCompany/Check/TaxNumber/${vkn}?globalUserType=Despatch`,
                { headers: this.getHeaders() }
            );
            const data = res.data;
            if (Array.isArray(data) && data.length > 0) {
                const findAlias = (item: any) => item.Alias || item.alias || item.identifier;
                const defaultAliasObj = data.find((d: any) => findAlias(d)?.toLowerCase().includes('defaultpk'));
                const finalAlias = defaultAliasObj ? findAlias(defaultAliasObj) : findAlias(data[0]);
                return { isDespatchUser: true, alias: finalAlias || "urn:mail:defaultpk@nilvera.com" };
            }
            return { isDespatchUser: false };
        } catch (error) {
            console.error("Nilvera Despatch Check Error:", error);
            return { isDespatchUser: false };
        }
    }

    /**
     * 2. Adım: Varsayılan Seri Çekme
     */
    async getDefaultSeries(type: 'EFATURA' | 'EARSIV'): Promise<string> {
        const module = type === 'EFATURA' ? 'einvoice' : 'earchive';
        try {
            const res = await axios.get(`${this.config.baseUrl}/${module}/Series?IsDefault=true&IsActive=true`, { headers: this.getHeaders() });
            const content = res.data?.Content || [];
            const defaultSeries = content[0];
            let seriesName = defaultSeries?.Name || (type === 'EFATURA' ? 'EFT' : 'ARS');
            if (type === 'EARSIV' && (seriesName === '10B' || seriesName === 'EFT')) {
                seriesName = 'ARS';
            }
            return seriesName;
        } catch (error) {
            return type === 'EFATURA' ? 'EFT' : 'ARS';
        }
    }

    async getDefaultDespatchSeries(): Promise<string> {
        try {
            const res = await axios.get(`${this.config.baseUrl}/edespatch/Series?IsDefault=true&IsActive=true`, { headers: this.getHeaders() });
            const content = res.data?.Content || [];
            return content[0]?.Name || 'IRS';
        } catch (error) {
            return 'IRS';
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

        // 3. Tarih ve Diğer Hazırlıklar (Milisaniye ve 'Z' karakterinden tamamen arındırılmış)
        const trNow = new Date(new Date().getTime() + (3 * 60 * 60 * 1000));
        const issueDate = trNow.toISOString().split('.')[0]; // YYYY-MM-DDTHH:mm:ss
        const issueTime = issueDate.split('T')[1]; // HH:mm:ss

        const anyLineExempt = params.lines.some(l => l.VatRate === 0);
        const isTotalExempt = params.amounts.tax === 0;

        console.log(`[NilveraService] Processing Invoice: totalTax=${params.amounts.tax}, anyExempt=${anyLineExempt}, type=${isEInvoiceUser ? 'EF' : 'EA'}`);

        const invoiceInfo: any = {
            UUID: crypto.randomUUID(),
            InvoiceType: (anyLineExempt || isTotalExempt) ? 2 : 0, // 2: ISTISNA, 0: SATIS
            InvoiceProfile: isEInvoiceUser ? 2 : 5,
            InvoiceSerieOrNumber: series,
            IssueDate: issueDate,
            IssueTime: issueTime, // e-Arşiv için kritik
            CurrencyCode: "TRY",
            LineExtensionAmount: params.amounts.base,
            TaxExclusiveAmount: params.amounts.base,
            TaxInclusiveAmount: params.amounts.total,
            PayableAmount: params.amounts.total
        };

        // KDV Muafiyet Bilgileri (Garantici ve Yedekli Yapı)
        if (anyLineExempt || isTotalExempt) {
            const exemptionData = {
                KDVExemptionReasonCode: "351",
                KDVExemptionReason: "Diger",
                TaxExemptionReasonCode: "351",
                TaxExemptionReason: "Diger"
            };

            // Header seviyesinde nesne olarak ve doğrudan ekle
            invoiceInfo.TaxExemptionReasonInfo = exemptionData;
            invoiceInfo.KdvExemptionReasonInfo = exemptionData;

            // Redundant fields at root of InvoiceInfo
            Object.assign(invoiceInfo, exemptionData);
        }

        if (!isEInvoiceUser) {
            invoiceInfo.GeneralKDV20Total = Number(params.amounts.tax.toFixed(2));
            invoiceInfo.KdvTotal = Number(params.amounts.tax.toFixed(2));
            invoiceInfo.ISDespatch = true; // İrsaliye yerine geçer ibaresi

            if (params.isInternetSale) {
                // E-ARSIV Ozel: INTERNET SATISI
                invoiceInfo.SalesPlatform = 1; // 1: INTERNET
                invoiceInfo.SendType = 2;      // 2: ELEKTRONIK

                const internetData = {
                    WebSite: params.internetInfo?.WebSite || "www.kech.tr",
                    PaymentMethod: "KREDIKARTI/BANKAKARTI", // Nilvera'nın beklediği tam format
                    PaymentDate: params.internetInfo?.PaymentDate || issueDate.split('T')[0],
                    TransporterName: params.internetInfo?.TransporterName || "ARAS KARGO",
                    TransporterRegisterNumber: "11111111111", // Zorunlu: Kargo VKN/TCKN
                    TransportDate: issueDate // Zorunlu: Taşıma Tarihi (Fatura tarihi ile aynı)
                };
                invoiceInfo.InternetInfo = internetData;
                invoiceInfo.InternetSalesInformation = internetData;
            } else {
                // E-ARSIV Ozel: MAGAZA SATISI (En Güvenli Yol)
                invoiceInfo.SalesPlatform = 0; // 0: NORMAL (Kargo kontrolünü kapatır)
                invoiceInfo.SendType = 2;      // 2: ELEKTRONIK
                invoiceInfo.SendMethod = 0;    // 0: Elektronik (Redundant field check)
                // InternetInfo nesnesi tamamen OMIT ediliyor (Hata almayı engeller)
            }
        }

        // 4. Model Normalizasyonu (Tüm yedekli alan isimlerini dolduruyoruz)
        const invoiceLines = params.lines.map((line, idx) => {
            const lineExtensionAmount = Number((line.Quantity * line.Price).toFixed(2));
            const vatAmount = Number((lineExtensionAmount * (line.VatRate / 100)).toFixed(2));

            const baseLine: any = {
                Index: idx + 1,
                Name: line.Name,
                Quantity: line.Quantity,
                UnitType: (line.UnitType || "C62").toUpperCase(),
                LineExtensionAmount: lineExtensionAmount,
                // Hem e-fatura hem e-arşiv alanlarını beraber gönderiyoruz (Garantici yaklaşım)
                UnitPrice: line.Price,
                Price: line.Price,
                VatRate: line.VatRate,
                KDVPercent: line.VatRate,
                VatAmount: vatAmount,
                KDVTotal: vatAmount
            };

            const isExempt = line.VatRate === 0;
            if (isExempt) {
                baseLine.TaxExemptionReasonCode = "351";
                baseLine.TaxExemptionReason = "Diger";
                baseLine.KDVExemptionReasonCode = "351";
                baseLine.KDVExemptionReason = "Diger";
            }
            return baseLine;
        });

        const payload = isEInvoiceUser
            ? { EInvoice: { InvoiceInfo: invoiceInfo, CompanyInfo: params.company, CustomerInfo: params.customer, InvoiceLines: invoiceLines }, CustomerAlias: alias.toString() }
            : { ArchiveInvoice: { InvoiceInfo: invoiceInfo, CompanyInfo: params.company, CustomerInfo: params.customer, InvoiceLines: invoiceLines } };

        console.log(`[NilveraService] FINAL PAYLOAD:`, JSON.stringify(payload, null, 2));

        const endpoint = isEInvoiceUser ? '/EInvoice/Send/Model' : '/EArchive/Send/Model';

        try {
            const response = await axios.post(`${this.config.baseUrl}${endpoint}`, payload, {
                headers: this.getHeaders(),
                validateStatus: () => true
            });

            if (response.status >= 400) {
                console.error("[NilveraService] Error Response:", response.data);
                // Akıllı Hata Mesajı Çıkarma (Object Object engelleyici)
                let errMsg = "Nilvera API Hatası";
                const d = response.data;

                if (d?.Errors && Array.isArray(d.Errors)) {
                    errMsg = d.Errors.map((e: any) => `[${e.Code}] ${e.Description} - ${e.Detail || ''}`).join(" | ");
                } else if (d?.Message) {
                    errMsg = d.Message;
                } else if (d?.ModelState) {
                    errMsg = Object.values(d.ModelState).flat().join(" | ");
                } else if (typeof d === 'object') {
                    errMsg = JSON.stringify(d);
                } else {
                    errMsg = String(d);
                }

                return { success: false, status: response.status, error: errMsg, data: d, payload };
            }

            console.log("[NilveraService] SUCCESS:", response.data);
            return {
                success: true,
                status: response.status,
                data: response.data,
                type: isEInvoiceUser ? 'EFATURA' : 'EARSIV' // Hangi tipte gönderildiğini dön
            };
        } catch (error: any) {
            console.error("[NilveraService] Exception:", error.message);
            return {
                success: false,
                error: error.response?.data ? JSON.stringify(error.response.data) : error.message
            };
        }
    }

    /**
     * e-İrsaliye Gönderimi
     */
    async processAndSendDespatch(params: {
        customer: CustomerInfo,
        company: CompanyInfo,
        lines: InvoiceLine[],
        description?: string,
        shipmentDate?: string, // YYYY-MM-DD
        shipmentTime?: string, // HH:mm:ss
        plateNumber?: string,
        driverName?: string,
        driverSurname?: string,
        driverId?: string
    }) {
        const { isDespatchUser, alias } = await this.checkDespatchTaxpayer(params.customer.TaxNumber);

        // E-İrsaliye sadece mükelleflere gönderilebilir
        if (!isDespatchUser) {
            return { success: false, error: "Alıcı e-İrsaliye mükellefi değil. Lütfen kağıt irsaliye düzenleyiniz." };
        }

        const series = await this.getDefaultDespatchSeries();

        const trNow = new Date(new Date().getTime() + (3 * 60 * 60 * 1000));
        const issueDate = trNow.toISOString().split('.')[0]; // YYYY-MM-DDTHH:mm:ss
        const issueTime = issueDate.split('T')[1];

        // GİB kuralı: Fiili sevk tarihi irsaliye tarihinden küçük olamaz.
        // Eğer kullanıcı geçmiş tarih seçtiyse bugüne çekiyoruz.
        const actualDate = params.shipmentDate || issueDate.split('T')[0];
        const actualTime = params.shipmentTime || issueTime;

        const despatchInfo: any = {
            UUID: crypto.randomUUID(),
            DespatchType: "SEVK",
            DespatchProfile: "TEMELIRSALIYE",
            DespatchSerieOrNumber: series,
            IssueDate: issueDate,
            IssueTime: issueTime,
            CurrencyCode: "TRY",
            ActualDespatchDate: actualDate,
            ActualDespatchTime: actualTime
        };

        const despatchLines = params.lines.map((line, idx) => ({
            Index: idx + 1,
            Name: line.Name,
            Quantity: line.Quantity,
            UnitType: (line.UnitType || "C62").toUpperCase(),
            DeliveredQuantity: line.Quantity,
            DeliveredUnitType: (line.UnitType || "C62").toUpperCase()
        }));

        // Adreslerde PostalCode zorunlu
        const customerAddress = {
            ...params.customer,
            PostalCode: (params.customer as any).PostalCode || "34000"
        };
        const companyAddress = {
            ...params.company,
            PostalCode: (params.company as any).PostalCode || "34000"
        };

        const shipmentInfo: any = {
            ActualDespatchDate: actualDate,
            ActualDespatchTime: actualTime,
            Driver: [{
                Name: params.driverName || "Sürücü Adı",
                Surname: params.driverSurname || "Sürücü Soyadı",
                NationalityID: params.driverId || "11111111111"
            }],
            Carrier: {
                TaxNumber: params.company.TaxNumber,
                Name: params.company.Name
            },
            Delivery: {
                Address: customerAddress
            },
            ShipmentInfo: {
                // Taşıma bilgisi objesi gerekebilir
            }
        };

        if (params.plateNumber) {
            shipmentInfo.TransportEquipment = [params.plateNumber];
        }

        const payload = {
            EDespatch: {
                DespatchInfo: despatchInfo,
                DespatchSupplierInfo: companyAddress,
                DeliveryCustomerInfo: customerAddress,
                DespatchLines: despatchLines,
                ShipmentDetail: shipmentInfo,
                Notes: [params.description || "İrsaliye"]
            },
            CustomerAlias: alias
        };

        try {
            // E-İrsaliye alıcısı değilse matbu irsaliye olarak (arşiv gibi) mi gider?
            // Nilvera'da e-İrsaliye zorunlu mükellefler arasıdır. Ama biz model gönderiyoruz.
            const response = await axios.post(`${this.config.baseUrl}/EDespatch/Send/Model`, payload, {
                headers: this.getHeaders(),
                validateStatus: () => true
            });

            if (response.status >= 400) {
                return { success: false, status: response.status, error: JSON.stringify(response.data), data: response.data };
            }

            return { success: true, status: response.status, data: response.data, type: 'EIRSALIYE' };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }
    async getIncomingInvoices(page: number = 1, pageSize: number = 20) {
        try {
            const now = new Date();
            const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());

            const startDate = threeMonthsAgo.toISOString().split('T')[0];
            const endDate = now.toISOString().split('T')[0];

            console.log(`[NilveraService] Fetching Incoming: url=${this.config.baseUrl}/EInvoice/Incoming, page=${page}, range=${startDate}-${endDate}`);

            const res = await axios.get(
                `${this.config.baseUrl}/EInvoice/Incoming?PageIndex=${page}&PageSize=${pageSize}&StartDate=${startDate}&EndDate=${endDate}`,
                { headers: this.getHeaders() }
            );

            console.log(`[NilveraService] Received result. TotalCount=${res.data?.TotalCount || 0}, ContentSize=${res.data?.Content?.length || 0}`);

            return { success: true, data: res.data };
        } catch (error: any) {
            const detail = error.response?.data || error.message;
            console.error("[NilveraService] Incoming Invoices Error:", detail);
            return { success: false, error: typeof detail === 'object' ? JSON.stringify(detail) : detail };
        }
    }
}
