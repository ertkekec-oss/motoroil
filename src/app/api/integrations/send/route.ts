import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { NilveraService } from '@/lib/nilvera';

/**
 * Nilvera için tam uyumlu tarih (YYYY-MM-DDTHH:mm:ss.0000000+03:00)
 */
function getNilveraDate() {
    const now = new Date();
    // Vercel UTC olsa bile biz +3 saat ekleyip Türkiye saatini simüle edelim
    const trTime = new Date(now.getTime() + (3 * 60 * 60 * 1000));
    const pad = (n: number) => n.toString().padStart(2, '0');

    return `${trTime.getUTCFullYear()}-${pad(trTime.getUTCMonth() + 1)}-${pad(trTime.getUTCDate())}T${pad(trTime.getUTCHours())}:${pad(trTime.getUTCMinutes())}:${pad(trTime.getUTCSeconds())}.0000000+03:00`;
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { invoiceId, type = 'invoice' } = body;

        if (!invoiceId) {
            return NextResponse.json({ success: false, error: 'Fatura ID gerekli' }, { status: 400 });
        }

        const invoice = await (prisma as any).salesInvoice.findUnique({
            where: { id: invoiceId },
            include: { customer: true }
        });

        if (!invoice) {
            return NextResponse.json({ success: false, error: 'Fatura bulunamadı' }, { status: 404 });
        }

        const settingsRecord = await prisma.appSettings.findUnique({ where: { key: 'eFaturaSettings' } });
        const rawConfig = settingsRecord?.value as any;
        const config = rawConfig?.apiKey ? rawConfig : (rawConfig?.nilvera || {});

        if (!config || !config.apiKey) {
            return NextResponse.json({ success: false, error: 'Nilvera ayarları eksik.' }, { status: 400 });
        }

        const nilvera = new NilveraService({
            apiKey: config.apiKey,
            environment: config.environment || 'test',
            username: config.username,
            password: config.password
        });

        const customerVkn = invoice.customer.taxNumber || invoice.customer.identityNumber;
        let isEInvoiceUser = false;
        let customerAlias = "";
        try {
            const userCheck = await nilvera.checkUser(customerVkn);
            isEInvoiceUser = userCheck.isEInvoiceUser;
            customerAlias = userCheck.alias || "";
        } catch (e) {
            console.warn('User check error', e);
        }

        // Firma Bilgileri
        let companyInfo = {
            TaxNumber: "1111111111",
            Name: "Firma Adi",
            TaxOffice: "",
            Address: "Adres",
            District: "Merkez",
            City: "Istanbul",
            Country: "Turkiye",
            Phone: "",
            Mail: "",
            WebSite: ""
        };

        try {
            const info = await nilvera.getCompanyInfo();
            if (info && info.TaxNumber) {
                companyInfo = {
                    TaxNumber: info.TaxNumber,
                    Name: info.Name || info.Title || 'Firma Adi',
                    TaxOffice: info.TaxOffice || '',
                    Address: info.Address || '',
                    District: info.District || '',
                    City: info.City || '',
                    Country: info.Country || 'Turkiye',
                    Phone: info.Phone || '',
                    Mail: info.Mail || '',
                    WebSite: info.WebSite || ''
                };
            }
        } catch (e) { }

        const invoiceItems = Array.isArray(invoice.items) ? invoice.items : JSON.parse(JSON.stringify(invoice.items || []));
        let totalTaxExclusiveAmount = 0;
        let totalTaxAmount = 0;

        const invoiceLines = invoiceItems.map((item: any, idx: number) => {
            const qty = Number(item.qty || 1);
            const price = Number(item.price || 0);
            const vatRate = Number(item.vat || 20);
            const discount = Number(item.discount || 0);

            const base = (qty * price) - discount;
            const vat = (base * vatRate) / 100;

            totalTaxExclusiveAmount += base;
            totalTaxAmount += vat;

            return {
                Index: (idx + 1).toString(),
                SellerCode: null,
                BuyerCode: null,
                Name: item.name || 'Urun',
                Description: null,
                Quantity: qty,
                UnitType: "C62",
                Price: price,
                AllowanceTotal: discount,
                KDVPercent: vatRate,
                KDVTotal: Number(vat.toFixed(2)),
                Taxes: null,
                DeliveryInfo: null,
                ManufacturerCode: null,
                BrandName: null,
                ModelName: null,
                Note: null,
                OzelMatrahReason: null,
                OzelMatrahTotal: null
            };
        });

        const uuid = crypto.randomUUID();
        const dateStr = getNilveraDate();

        const modelCore = {
            InvoiceInfo: {
                UUID: uuid,
                TemplateUUID: "cd1aff46-00ac-4a4f-96a2-6d58a3cb84f9", // Dökümandaki örnek Guid
                TemplateBase64String: null,
                InvoiceType: "SATIS",
                InvoiceSerieOrNumber: "EFT", // Örnekteki Seri
                IssueDate: dateStr,
                CurrencyCode: "TRY",
                ExchangeRate: null,
                InvoiceProfile: isEInvoiceUser ? "TICARIFATURA" : "EARSIVFATURA", // Örnekte TICARIFATURA var
                DespatchDocumentReference: null,
                OrderReference: null,
                OrderReferenceDocument: null,
                AdditionalDocumentReferences: null,
                TaxExemptionReasonInfo: null,
                PaymentTermsInfo: null,
                PaymentMeansInfo: null,
                OKCInfo: null,
                ReturnInvoiceInfo: null,
                AccountingCost: null,
                InvoicePeriod: null,
                SGKInfo: null,
                LineExtensionAmount: Number(totalTaxExclusiveAmount.toFixed(2)),
                GeneralKDV1Total: 0,
                GeneralKDV8Total: 0,
                GeneralKDV18Total: 0,
                GeneralAllowanceTotal: 0,
                PayableAmount: Number((totalTaxExclusiveAmount + totalTaxAmount).toFixed(2)),
                KdvTotal: Number(totalTaxAmount.toFixed(2))
            },
            CompanyInfo: companyInfo,
            CustomerInfo: {
                TaxNumber: customerVkn,
                Name: invoice.customer.name,
                TaxOffice: invoice.customer.taxOffice || null,
                PartyIdentifications: null,
                AgentPartyIdentifications: null,
                Address: invoice.customer.address || 'Adres',
                District: invoice.customer.district || 'Merkez',
                City: invoice.customer.city || 'Istanbul',
                Country: 'Turkiye',
                PostalCode: null,
                Phone: invoice.customer.phone || null,
                Fax: null,
                Mail: invoice.customer.email || null,
                WebSite: null
            },
            BuyerCustomerInfo: null,
            ExportCustomerInfo: null,
            TaxFreeInfo: null,
            InvoiceLines: invoiceLines,
            Notes: ["Elektronik Fatura", invoice.description || ""]
        };

        const endpointType = isEInvoiceUser ? 'EFATURA' : 'EARSIV';
        const finalPayload = isEInvoiceUser
            ? { EInvoice: modelCore, CustomerAlias: customerAlias || null }
            : { ArchiveInvoice: modelCore };

        console.log(`Sending ${endpointType} to Nilvera. UUID: ${uuid}`);

        const result = await nilvera.sendInvoice(finalPayload, endpointType);

        if (result.success) {
            await (prisma as any).salesInvoice.update({
                where: { id: invoiceId },
                data: {
                    isFormal: true,
                    formalType: endpointType,
                    formalId: result.formalId || uuid,
                    formalUuid: uuid,
                    formalStatus: 'SENT'
                }
            });

            return NextResponse.json({ success: true, message: 'Başarıyla gönderildi', uuid: uuid });
        } else {
            return NextResponse.json({ success: false, error: result.error || 'Hata oluştu' }, { status: 400 });
        }

    } catch (error: any) {
        console.error('Integration/Send Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
