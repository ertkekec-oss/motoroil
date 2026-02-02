import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { NilveraService } from '@/lib/nilvera';

/**
 * Nilvera için GİB Standartlarında Benzersiz Fatura Numarası Üretir
 * Format: [SERI(3)][YIL(4)][SIRA(9)] -> TOPLAM 16 HANE
 */
function generateGIBInvoiceNo(prefix: string) {
    const now = new Date();
    const year = now.getFullYear().toString();

    // Testlerde çakışmayı önlemek için zaman damgasını (timestamp) baz alan bir sıra numarası üretelim
    // Toplam 9 hane olacak şekilde: HHmmSS + 3 hane milisaniye (veya rastgele)
    const timePart = now.getHours().toString().padStart(2, '0') +
        now.getMinutes().toString().padStart(2, '0') +
        now.getSeconds().toString().padStart(2, '0');

    const randomPart = Math.floor(Math.random() * 999).toString().padStart(3, '0');
    const sequence = (timePart + randomPart).slice(0, 9);

    return `${prefix}${year}${sequence}`;
}

function getNilveraDate(dateInput?: string | Date) {
    const d = dateInput ? new Date(dateInput) : new Date();
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
                        TaxCode: "0015",
                        Total: Number(vat.toFixed(2)),
                        Percent: vatRate
                    }
                ]
            };
        });

        const uuid = crypto.randomUUID();
        const dateStr = getNilveraDate(invoice.invoiceDate);

        // Seri ve No üretimi (Zorunlu Alan!)
        const prefix = isEInvoiceUser ? "EFT" : "ARS";
        const invoiceNo = generateGIBInvoiceNo(prefix);

        const invoiceInfo: any = {
            UUID: uuid,
            CustomizationID: "TR1.2",
            InvoiceType: "SATIS",
            InvoiceSerieOrNumber: invoiceNo, // Artık EA2026... formatında dolu gidiyor
            IssueDate: dateStr,
            CurrencyCode: "TRY",
            LineExtensionAmount: Number(totalTaxExclusiveAmount.toFixed(2)),
            KdvTotal: Number(totalTaxAmount.toFixed(2)),
            PayableAmount: Number((totalTaxExclusiveAmount + totalTaxAmount).toFixed(2)),
            GeneralKDV20Total: Number(totalKdv20.toFixed(2)),
            GeneralAllowanceTotal: 0
        };

        if (isEInvoiceUser) {
            invoiceInfo.InvoiceProfile = "TICARIFATURA";
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
                    formalId: result.formalId || invoiceNo,
                    formalUuid: uuid,
                    formalStatus: 'SENT'
                }
            });
            return NextResponse.json({ success: true, uuid: uuid, message: `Fatura (${invoiceNo}) başarıyla gönderildi.` });
        } else {
            return NextResponse.json({ success: false, error: result.error }, { status: 400 });
        }
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
