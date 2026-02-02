import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { NilveraService } from '@/lib/nilvera';

function getNilveraDate() {
    const now = new Date();
    const trTime = new Date(now.getTime() + (3 * 60 * 60 * 1000));
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${trTime.getUTCFullYear()}-${pad(trTime.getUTCMonth() + 1)}-${pad(trTime.getUTCDate())}T${pad(trTime.getUTCHours())}:${pad(trTime.getUTCMinutes())}:${pad(trTime.getUTCSeconds())}.0000000+03:00`;
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
            if (info) companyInfo = { ...info, Name: info.Name || info.Title };
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
                Taxes: null
            };
        });

        const uuid = crypto.randomUUID();
        const dateStr = getNilveraDate();

        // Ekran görüntüsündeki MODEL ile tam uyumlu hiyerarşi
        const modelCore = {
            InvoiceInfo: {
                UUID: uuid,
                TemplateUUID: "123e4567-e89b-12d3-a456-426614174000", // Ekran görüntüsündeki Guid örneği
                InvoiceType: "SATIS",
                InvoiceSerieOrNumber: "EFT",
                IssueDate: dateStr,
                CurrencyCode: "TRY",
                InvoiceProfile: "TEMELFATURA", // Ekran görüntüsündeki default değer
                LineExtensionAmount: Number(totalTaxExclusiveAmount.toFixed(2)),
                GeneralKDV1Total: 0,
                GeneralKDV8Total: 0,
                GeneralKDV18Total: 0,
                GeneralKDV10Total: 0,
                GeneralKDV20Total: Number(totalKdv20.toFixed(2)),
                GeneralAllowanceTotal: 0,
                PayableAmount: Number((totalTaxExclusiveAmount + totalTaxAmount).toFixed(2)),
                KdvTotal: Number(totalTaxAmount.toFixed(2))
            },
            CompanyInfo: companyInfo,
            CustomerInfo: {
                TaxNumber: customerVkn,
                Name: invoice.customer.name,
                Address: invoice.customer.address || 'Adres',
                District: invoice.customer.district || 'Merkez',
                City: invoice.customer.city || 'Istanbul',
                Country: 'Turkiye',
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
                data: { isFormal: true, formalType: endpointType, formalId: result.formalId, formalUuid: uuid, formalStatus: 'SENT' }
            });
            return NextResponse.json({ success: true, uuid: uuid });
        } else {
            return NextResponse.json({ success: false, error: result.error }, { status: 400 });
        }
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
