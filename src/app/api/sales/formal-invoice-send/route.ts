import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { NilveraService } from '@/lib/nilvera';

function generateGIBInvoiceNo(prefix: string) {
    const now = new Date();
    const year = now.getFullYear().toString();
    const timePart = now.getHours().toString().padStart(2, '0') +
        now.getMinutes().toString().padStart(2, '0') +
        now.getSeconds().toString().padStart(2, '0');
    const randomPart = Math.floor(Math.random() * 999).toString().padStart(3, '0');
    return `${prefix}${year}${timePart}${randomPart}`;
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

        const settingsRecord = await prisma.appSettings.findUnique({ where: { key: 'eFaturaSettings' } });
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
            const prefix = isEInvoice ? "EFT" : "ARS";
            const invoiceNo = generateGIBInvoiceNo(prefix);
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
                    Index: (idx + 1).toString(),
                    Name: item.name || 'Urun',
                    Quantity: qty,
                    UnitType: "C62",
                    Price: price,
                    AllowanceTotal: discount,
                    KDVPercent: vatRate,
                    KDVTotal: Number(vat.toFixed(2)),
                    Taxes: [{ TaxCode: "0015", Total: Number(vat.toFixed(2)), Percent: vatRate }]
                };
            });

            const invoiceInfo: any = {
                UUID: uuid,
                CustomizationID: "TR1.2",
                InvoiceType: "SATIS",
                InvoiceSerieOrNumber: invoiceNo,
                IssueDate: new Date(invoice.invoiceDate || invoice.createdAt).toISOString(),
                CurrencyCode: "TRY",
                LineExtensionAmount: Number(totalTaxExclusiveAmount.toFixed(2)),
                KdvTotal: Number(totalTaxAmount.toFixed(2)),
                PayableAmount: Number((totalTaxExclusiveAmount + totalTaxAmount).toFixed(2)),
                GeneralKDV20Total: Number(totalKdv20.toFixed(2)),
                GeneralAllowanceTotal: 0
            };

            if (isEInvoice) {
                invoiceInfo.InvoiceProfile = "TICARIFATURA";
            } else {
                invoiceInfo.InvoiceProfile = "EARSIVFATURA";
                invoiceInfo.SalesPlatform = "NORMAL";
                invoiceInfo.SendType = "ELEKTRONIK";
                invoiceInfo.ISDespatch = false;
            }

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

            if (isEInvoice) {
                return await nilvera.sendInvoice({ EInvoice: payload, CustomerAlias: alias }, 'EFATURA');
            } else {
                return await nilvera.sendInvoice({ ArchiveInvoice: payload }, 'EARSIV');
            }
        }

        let userCheck = await nilvera.checkUser(customerVkn);
        let isEInvoice = userCheck.isEInvoiceUser;
        let alias = userCheck.alias;

        let result = await attemptSending(isEInvoice, alias);

        if (!result.success && result.errorCode === 422) {
            isEInvoice = !isEInvoice;
            if (isEInvoice) {
                const retry = await nilvera.checkUser(customerVkn);
                alias = retry.alias;
                if (!alias) {
                    return NextResponse.json({
                        success: false,
                        error: 'Müşteri e-Fatura mükellefi olarak tespit edildi ancak gönderim için gerekli olan sistem etiketi (Posta Kutusu Alias) Nilvera üzerinde bulunamadı.'
                    }, { status: 400 });
                }
            }
            result = await attemptSending(isEInvoice, alias);
        }

        if (result.success) {
            await (prisma as any).salesInvoice.update({
                where: { id: invoiceId },
                data: { isFormal: true, formalStatus: 'SENT', formalUuid: result.formalId }
            });
            return NextResponse.json({ success: true, message: 'Başarıyla gönderildi.', formalId: result.formalId });
        } else {
            let errMsg = result.error || 'Fatura gönderilemedi.';
            if (result.errorCode === 401) errMsg = 'Nilvera API Yetkilendirme Hatası.';
            return NextResponse.json({ success: false, error: errMsg }, { status: 400 });
        }

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
