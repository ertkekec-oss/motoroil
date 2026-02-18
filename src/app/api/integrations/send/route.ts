import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { NilveraService } from '@/lib/nilvera';

// Nilvera için seri kodu
// Nilvera otomatik olarak tam fatura numarasını üretir
// Örnek: "101" -> Nilvera "101000000112" üretir
function getInvoiceSeries() {
    return "101";
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { invoiceId } = body;

        const invoice = await (prisma as any).salesInvoice.findUnique({
            where: { id: invoiceId },
            include: { customer: true }
        });

        if (!invoice) return NextResponse.json({ success: false, error: 'Fatura bulunamadı' }, { status: 404 });

        const settingsRecord = await prisma.appSettings.findUnique({
            where: {
                companyId_key: {
                    companyId: invoice.companyId,
                    key: 'eFaturaSettings'
                }
            }
        });
        const rawConfig = settingsRecord?.value as any;
        const config = rawConfig?.apiKey ? rawConfig : (rawConfig?.nilvera || {});

        const nilvera = new NilveraService({
            apiKey: config.apiKey,
            baseUrl: config.apiUrl,
            environment: config.environment || 'test'
        });

        const customerVkn = (invoice.customer.taxNumber || invoice.customer.identityNumber || "").trim();

        let companyInfo: any = { TaxNumber: "1111111111", Name: "Firma", Address: "Adres", District: "Merkez", City: "Istanbul", Country: "Turkiye" };
        try {
            const info = await nilvera.getCompanyInfo();
            if (info) {
                companyInfo = {
                    TaxNumber: info.TaxNumber,
                    Name: info.Name || info.Title || "Firma",
                    Address: info.Address || "Adres",
                    District: info.District || "Merkez",
                    City: info.City || "Istanbul",
                    Country: info.Country || "Turkiye"
                };
            }
        } catch (e) { }

        async function attemptSending(isEInvoice: boolean, alias?: string) {
            const invoiceNo = getInvoiceSeries();
            const uuid = crypto.randomUUID();

            const invoiceItems = Array.isArray(invoice.items) ? invoice.items : [];
            let totalTaxExclusiveAmount = 0;
            let totalTaxAmount = 0;
            let totalKdv20 = 0;

            const invoiceLines = invoiceItems.map((item: any, idx: number) => {
                const qty = Number(item.qty || 1);
                const price = Number(item.price || 0);
                const vatRate = Number(item.vat || 20);
                const discount = Number(item.discount || 0);
                const base = (qty * price) - discount;
                const vat = (base * vatRate) / 100;
                totalTaxExclusiveAmount += base;
                totalTaxAmount += vat;
                if (vatRate === 20) totalKdv20 += vat;

                return {
                    Index: idx + 1,
                    Name: item.name || 'Urun',
                    Quantity: qty,
                    UnitType: "C62",
                    UnitPrice: price,
                    VatRate: vatRate,
                    VatAmount: Number(vat.toFixed(2)),
                    LineExtensionAmount: Number(base.toFixed(2))
                };
            });

            // Tarih ve saat formatı - TRT (UTC+3) ZORUNLU
            // Sunucu UTC çalışsa bile Türkiye saatine göre işlem yapmalıyız
            const now = new Date();
            const trTime = new Date(now.getTime() + (3 * 60 * 60 * 1000));

            const issueDate = trTime.toISOString().split('T')[0]; // YYYY-MM-DD
            const issueTime = trTime.toISOString().split('T')[1].split('.')[0]; // HH:MM:SS

            const invoiceInfo: any = {
                UUID: uuid,
                InvoiceType: "SATIS",
                InvoiceProfile: isEInvoice ? "TICARIFATURA" : "EARSIVFATURA",
                InvoiceSerieOrNumber: invoiceNo,
                IssueDate: issueDate,
                IssueTime: issueTime,
                CurrencyCode: "TRY",
                LineExtensionAmount: Number(totalTaxExclusiveAmount.toFixed(2)),
                TaxExclusiveAmount: Number(totalTaxExclusiveAmount.toFixed(2)),
                TaxInclusiveAmount: Number((totalTaxExclusiveAmount + totalTaxAmount).toFixed(2)),
                PayableAmount: Number((totalTaxExclusiveAmount + totalTaxAmount).toFixed(2))
            };



            const payload = {
                InvoiceInfo: invoiceInfo,
                CompanyInfo: companyInfo,
                CustomerInfo: {
                    TaxNumber: customerVkn,
                    Name: invoice.customer.name,
                    Address: invoice.customer.address || "Adres",
                    District: invoice.customer.district || "Merkez",
                    City: invoice.customer.city || "Istanbul",
                    Country: "Turkiye"
                },
                InvoiceLines: invoiceLines,
                Notes: [invoice.description || "Fatura"]
            };

            // ALTIN KURAL: E-Fatura ise CustomerAlias ŞART, E-Arşiv ise YASAK!
            let sendResult;
            if (isEInvoice) {
                sendResult = await nilvera.sendInvoice({ EInvoice: payload, CustomerAlias: alias }, 'EFATURA');
            } else {
                sendResult = await nilvera.sendInvoice({ ArchiveInvoice: payload }, 'EARSIV');
            }

            // Fatura numarasını da dönelim
            return { ...sendResult, invoiceNo };
        }

        // Mükellef sorgula
        let userCheck = await nilvera.checkUser(customerVkn);

        // İlk Deneme Kararı
        let isEInvoice = userCheck.isEInvoiceUser;
        let alias = userCheck.alias;

        // E-Fatura ama etiketi yoksa, kullanıcıyı uyaralım (veya e-arşiv deneyebiliriz ama 422 alırız)
        // Ancak bazı durumlarda checkUser hatalı "false" dönebilir, o yüzden e-arşiv denemek bir fallback'tir.

        let result = await attemptSending(isEInvoice, alias);

        // 422 Mükellef Tipi Hatası Aldıysak (Genellikle e-Arşiv gönderdik ama e-Fatura çıktı)
        if (!result.success && result.errorCode === 422) {
            // Tam tersini dene
            isEInvoice = !isEInvoice;

            // Eğer e-Fatura'ya döndüysek etiket ŞART
            if (isEInvoice) {
                const retry = await nilvera.checkUser(customerVkn);
                alias = retry.alias;

                if (!alias) {
                    return NextResponse.json({
                        success: false,
                        error: 'Müşteri e-Fatura mükellefi olarak tespit edildi ancak gönderim için gerekli olan sistem etiketi (Posta Kutusu Alias) Nilvera üzerinde bulunamadı. Lütfen müşterinin e-fatura bilgilerini kontrol ediniz veya Nilvera panelinden sorgulayınız.'
                    }, { status: 400 });
                }
            }

            result = await attemptSending(isEInvoice, alias);
        }

        if (result.success) {
            await (prisma as any).salesInvoice.update({
                where: { id: invoiceId },
                data: {
                    isFormal: true,
                    formalStatus: 'SENT',
                    formalUuid: result.invoiceNo // Fatura numarasını kaydediyoruz
                }
            });
            return NextResponse.json({ success: true, message: 'Başarıyla gönderildi.' });
        } else {
            // Hata mesajını biraz daha detaylı verelim
            let errMsg = result.error || 'Fatura gönderilemedi.';
            if (result.errorCode === 401) errMsg = 'Nilvera API Yetkilendirme Hatası. Lütfen API Key\'inizi kontrol edin.';

            return NextResponse.json({ success: false, error: errMsg }, { status: 400 });
        }

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
