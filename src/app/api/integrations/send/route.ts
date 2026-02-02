import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { NilveraService } from '@/lib/nilvera';

/**
 * E-Fatura/e-Arşiv Gönderme API (Nilvera UBL Model)
 * POST /api/integrations/send
 */
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
        if (!customerVkn) {
            return NextResponse.json({ success: false, error: 'Müşteri VKN/TCKN bilgisi eksik' }, { status: 400 });
        }

        let isEInvoiceUser = false;
        let customerAlias = "";
        try {
            if (type !== 'despatch') {
                const userCheck = await nilvera.checkUser(customerVkn);
                isEInvoiceUser = userCheck.isEInvoiceUser;
                customerAlias = userCheck.alias || "";
            }
        } catch (checkErr) {
            console.warn('User check failed', checkErr);
        }

        let companyInfo = {
            TaxNumber: "1111111111",
            Name: "Test Firması",
            TaxOffice: "Merkez",
            Address: "Merkez",
            District: "Merkez",
            City: "Istanbul",
            Country: "Turkiye",
            Mail: "info@test.com",
            Phone: "08500000000"
        };
        try {
            const info = await nilvera.getCompanyInfo();
            if (info && info.TaxNumber) {
                companyInfo = {
                    TaxNumber: info.TaxNumber,
                    Name: info.Name || info.Title,
                    TaxOffice: info.TaxOffice || '',
                    Address: info.Address || '',
                    District: info.District || '',
                    City: info.City || '',
                    Country: info.Country || 'Turkiye',
                    Mail: info.Mail || '',
                    Phone: info.Phone || ''
                };
            }
        } catch (e) {
            console.warn('Firma bilgileri çekilemedi', e);
        }

        const invoiceItems = Array.isArray(invoice.items) ? invoice.items : JSON.parse(JSON.stringify(invoice.items || []));

        let totalTaxExclusiveAmount = 0;
        let totalTaxAmount = 0;
        let totalDiscountAmount = 0;
        let kdv20Total = 0;

        const invoiceLines = invoiceItems.map((item: any) => {
            const qty = Number(item.qty || item.quantity || 1);
            const price = Number(item.price || item.unitPrice || 0);
            const vatRate = Number(item.vat || item.vatRate || 20);
            const discount = Number(item.discount || 0);

            const lineAmount = qty * price;
            const allowanceTotal = discount;
            const baseAmount = lineAmount - allowanceTotal;
            const vatAmount = (baseAmount * vatRate) / 100;

            totalTaxExclusiveAmount += baseAmount;
            totalTaxAmount += vatAmount;

            if (vatRate === 20) kdv20Total += vatAmount;

            return {
                Name: item.name || item.productName || 'Urun',
                Quantity: qty,
                UnitType: "C62",
                Price: price,
                AllowanceTotal: allowanceTotal,
                KDVPercent: vatRate,
                KDVTotal: Number(vatAmount.toFixed(2))
            };
        });

        const uuid = crypto.randomUUID();
        // Tarih formatı: YYYY-MM-DDTHH:mm:ss.0000000+03:00 (Örnekteki gibi)
        const dateNow = new Date();
        const offset = "+03:00";
        const dateStr = dateNow.toISOString().replace('Z', '0000000' + offset);

        const modelCore = {
            InvoiceInfo: {
                UUID: uuid,
                InvoiceType: "SATIS",
                InvoiceProfile: isEInvoiceUser ? "TEMELFATURA" : "EARSIVFATURA",
                IssueDate: dateStr,
                CurrencyCode: "TRY",
                LineExtensionAmount: Number(totalTaxExclusiveAmount.toFixed(2)),
                GeneralKDV20Total: Number(kdv20Total.toFixed(2)),
                PayableAmount: Number((totalTaxExclusiveAmount + totalTaxAmount).toFixed(2)),
                KdvTotal: Number(totalTaxAmount.toFixed(2))
            },
            CompanyInfo: companyInfo,
            CustomerInfo: {
                TaxNumber: customerVkn,
                Name: invoice.customer.name,
                TaxOffice: invoice.customer.taxOffice || '',
                Address: invoice.customer.address || 'Adres',
                District: invoice.customer.district || 'Merkez',
                City: invoice.customer.city || 'Istanbul',
                Country: 'Turkiye',
                Mail: invoice.customer.email || '',
                Phone: invoice.customer.phone || ''
            },
            InvoiceLines: invoiceLines,
            Notes: ["Elektronik Arşiv Faturası", "Fatura Notu: " + (invoice.description || "")]
        };

        let result;
        const endpointType = isEInvoiceUser ? 'EFATURA' : 'EARSIV';

        const finalPayload = isEInvoiceUser
            ? { EInvoice: modelCore, CustomerAlias: customerAlias || "urn:mail:defaultpk@gib.gov.tr" }
            : { ArchiveInvoice: modelCore };

        result = await nilvera.sendInvoice(finalPayload, endpointType);

        if (result.success) {
            const formalId = result.formalId || uuid;
            await (prisma as any).salesInvoice.update({
                where: { id: invoiceId },
                data: {
                    isFormal: true,
                    formalType: endpointType,
                    formalId: formalId,
                    formalUuid: uuid,
                    formalStatus: 'SENT'
                }
            });

            return NextResponse.json({
                success: true,
                message: `${endpointType} başarıyla kuyruğa eklendi.`,
                uuid: uuid
            });
        } else {
            return NextResponse.json({
                success: false,
                error: result.error || 'Gönderim başarısız'
            }, { status: 400 });
        }

    } catch (error: any) {
        console.error('Send Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
