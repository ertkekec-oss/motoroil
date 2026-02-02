import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { NilveraService } from '@/lib/nilvera';

/**
 * Nilvera Tarih Formatı (Z Formatı - UTC)
 */
function getNilveraDate(dateInput?: string | Date) {
    const d = dateInput ? new Date(dateInput) : new Date();
    // Milisaniye hassasiyetini 3 hanede tutup Z ekleyelim (Swagger standardı)
    return d.toISOString();
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { invoiceId, type = 'invoice' } = body;

        const invoice = await (prisma as any).salesInvoice.findUnique({
            where: { id: invoiceId },
            include: { customer: true }
        });

        if (!invoice) return NextResponse.json({ success: false, error: 'Fatura bulunamadı' }, { status: 404 });

        const settingsRecord = await prisma.appSettings.findUnique({ where: { key: 'eFaturaSettings' } });
        const rawConfig = settingsRecord?.value as any;
        const config = rawConfig?.apiKey ? rawConfig : (rawConfig?.nilvera || {});

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
        } catch (e) { }

        let companyInfo = { TaxNumber: "1111111111", Name: "Firma", Address: "Adres", City: "Istanbul", Country: "Turkiye" };
        try {
            const info = await nilvera.getCompanyInfo();
            if (info) {
                // Şema uyumu: info'dan gelen alanları Nilvera CompanyInfo şemasına eşle
                companyInfo = {
                    TaxNumber: info.TaxNumber,
                    Name: info.Name || info.Title,
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
                Index: (idx + 1).toString(),
                Name: item.name || 'Urun',
                Quantity: qty,
                UnitType: "C62",
                Price: price,
                AllowanceTotal: discount,
                KDVPercent: vatRate,
                KDVTotal: Number(vat.toFixed(2)),
                Taxes: [
                    {
                        TaxCode: "0015", // KDV Standardı
                        Total: Number(vat.toFixed(2)),
                        Percent: vatRate
                    }
                ]
            };
        });

        const uuid = crypto.randomUUID();
        const dateStr = getNilveraDate(invoice.invoiceDate);

        // Nilvera UBL Model (InvoiceInfo)
        const invoiceInfo: any = {
            UUID: uuid,
            CustomizationID: "TR1.2", // Başarılı görseldeki "Özelleştirme No"
            InvoiceType: "SATIS",
            InvoiceSerieOrNumber: "",
            IssueDate: dateStr,
            CurrencyCode: "TRY",
            LineExtensionAmount: Number(totalTaxExclusiveAmount.toFixed(2)),
            KdvTotal: Number(totalTaxAmount.toFixed(2)),
            PayableAmount: Number((totalTaxExclusiveAmount + totalTaxAmount).toFixed(2)),
            GeneralKDV20Total: Number(totalKdv20.toFixed(2)),
            GeneralAllowanceTotal: 0
        };

        if (isEInvoiceUser) {
            invoiceInfo.InvoiceProfile = "TICARIFATURA"; // Başarılı görseldeki "Senaryo"
        } else {
            invoiceInfo.InvoiceProfile = "EARSIVFATURA";
            invoiceInfo.SalesPlatform = "NORMAL";
            invoiceInfo.SendType = "ELEKTRONIK";
            invoiceInfo.ISDespatch = false;
        }

        const modelCore = {
            InvoiceInfo: invoiceInfo,
            CompanyInfo: companyInfo,
            CustomerInfo: {
                TaxNumber: customerVkn,
                Name: invoice.customer.name,
                TaxOffice: invoice.customer.taxOffice || "Merkez",
                Address: invoice.customer.address || 'Adres',
                District: invoice.customer.district || 'Merkez',
                City: invoice.customer.city || 'Istanbul',
                Country: 'Turkiye'
            },
            InvoiceLines: invoiceLines,
            Notes: [invoice.description || "Fatura"]
        };

        const endpointType = isEInvoiceUser ? 'EFATURA' : 'EARSIV';
        const finalPayload = isEInvoiceUser
            ? { EInvoice: modelCore, CustomerAlias: customerAlias || null }
            : { ArchiveInvoice: modelCore };

        const result = await nilvera.sendInvoice(finalPayload, endpointType);

        if (result.success) {
            await (prisma as any).salesInvoice.update({
                where: { id: invoiceId },
                data: {
                    isFormal: true,
                    formalType: endpointType,
                    formalId: result.formalId,
                    formalUuid: uuid,
                    formalStatus: 'SENT'
                }
            });
            return NextResponse.json({ success: true, uuid: uuid, message: 'Fatura başarıyla gönderildi.' });
        } else {
            return NextResponse.json({ success: false, error: result.error }, { status: 400 });
        }
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
