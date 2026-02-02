import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { NilveraService } from '@/lib/nilvera';

/**
 * Nilvera Tarih Formatlayıcı (YYYY-MM-DDTHH:mm:ss.0000000+03:00)
 */
function formatNilveraDate(date: Date) {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const y = date.getFullYear();
    const m = pad(date.getMonth() + 1);
    const d = pad(date.getDate());
    const h = pad(date.getHours());
    const min = pad(date.getMinutes());
    const s = pad(date.getSeconds());
    return `${y}-${m}-${d}T${h}:${min}:${s}.0000000+03:00`;
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

        // Firma Bilgileri
        let companyInfo = {
            TaxNumber: "1111111111",
            Name: "Test Firması",
            TaxOffice: "Merkez",
            Address: "Merkez",
            District: "Merkez",
            City: "Istanbul",
            Country: "Turkiye",
            Phone: "08500000000",
            Mail: "info@test.com"
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
                    Mail: info.Mail || ''
                };
            }
        } catch (e) {
            console.warn('Firma bilgileri çekilemedi', e);
        }

        const invoiceItems = Array.isArray(invoice.items) ? invoice.items : JSON.parse(JSON.stringify(invoice.items || []));

        let totalTaxExclusiveAmount = 0;
        let totalTaxAmount = 0;

        const invoiceLines = invoiceItems.map((item: any, index: number) => {
            const qty = Number(item.qty || item.quantity || 1);
            const price = Number(item.price || item.unitPrice || 0);
            const vatRate = Number(item.vat || item.vatRate || 20);
            const discount = Number(item.discount || 0);

            const lineAmount = qty * price;
            const baseAmount = lineAmount - discount;
            const vatAmount = (baseAmount * vatRate) / 100;

            totalTaxExclusiveAmount += baseAmount;
            totalTaxAmount += vatAmount;

            return {
                Index: (index + 1).toString(),
                Name: item.name || item.productName || 'Urun',
                Quantity: qty,
                UnitType: "C62",
                Price: price,
                AllowanceTotal: discount,
                KDVPercent: vatRate,
                KDVTotal: Number(vatAmount.toFixed(2)),
                Taxes: null // Örnek koda göre null bırakıyoruz
            };
        });

        const uuid = crypto.randomUUID();
        const dateStr = formatNilveraDate(new Date(invoice.invoiceDate));

        const modelCore = {
            InvoiceInfo: {
                UUID: uuid,
                InvoiceType: "SATIS",
                InvoiceSerieOrNumber: "", // Boş bırakınca varsayılan seriyi kullanır
                InvoiceProfile: isEInvoiceUser ? "TEMELFATURA" : "EARSIVFATURA",
                IssueDate: dateStr,
                CurrencyCode: "TRY",
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
                TaxOffice: invoice.customer.taxOffice || '',
                Address: invoice.customer.address || 'Adres',
                District: invoice.customer.district || 'Merkez',
                City: invoice.customer.city || 'Istanbul',
                Country: 'Turkiye',
                Mail: invoice.customer.email || '',
                Phone: invoice.customer.phone || ''
            },
            InvoiceLines: invoiceLines,
            Notes: ["Fatura Notu: " + (invoice.description || "")]
        };

        const endpointType = isEInvoiceUser ? 'EFATURA' : 'EARSIV';
        const finalPayload = isEInvoiceUser
            ? { EInvoice: modelCore, CustomerAlias: customerAlias || null }
            : { ArchiveInvoice: modelCore };

        const result = await nilvera.sendInvoice(finalPayload, endpointType);

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
                message: `${endpointType} gönderildi.`,
                uuid: uuid
            });
        } else {
            return NextResponse.json({
                success: false,
                error: result.error || 'Nilvera API Hatası'
            }, { status: 400 });
        }

    } catch (error: any) {
        console.error('Send Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
