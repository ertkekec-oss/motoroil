import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { NilveraService } from '@/lib/nilvera';

/**
 * E-Fatura/e-Arşiv/e-İrsaliye Gönderme API (Nilvera Only)
 * POST /api/integrations/send
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { invoiceId, type = 'invoice' } = body;

        if (!invoiceId) {
            return NextResponse.json({
                success: false,
                error: 'Fatura ID gerekli'
            }, { status: 400 });
        }

        // Get invoice from database
        const invoice = await (prisma as any).salesInvoice.findUnique({
            where: { id: invoiceId },
            include: {
                customer: true
            }
        });

        if (!invoice) {
            return NextResponse.json({
                success: false,
                error: 'Fatura bulunamadı'
            }, { status: 404 });
        }

        // Get Nilvera settings from AppSettings
        const settingsRecord = await prisma.appSettings.findUnique({
            where: { key: 'eFaturaSettings' }
        });

        const rawConfig = settingsRecord?.value as any;
        // Config yapısı bazen direkt root'ta bazen 'nilvera' altında olabilir.
        const config = rawConfig?.apiKey ? rawConfig : (rawConfig?.nilvera || {});

        if (!config || !config.apiKey) {
            return NextResponse.json({
                success: false,
                error: 'Nilvera entegrasyonu yapılandırılmamış. Lütfen Ayarlar > Entegrasyonlar sayfasından Nilvera API bilgilerini girin.'
            }, { status: 400 });
        }

        const nilvera = new NilveraService({
            apiKey: config.apiKey,
            environment: config.environment || 'test',
            username: config.username,
            password: config.password
        });

        // Check if customer is e-Invoice user
        const customerVkn = invoice.customer.taxNumber || invoice.customer.identityNumber;
        if (!customerVkn) {
            return NextResponse.json({
                success: false,
                error: 'Müşteri VKN/TCKN bilgisi eksik'
            }, { status: 400 });
        }

        let isEInvoiceUser = false;
        let customerAlias = "";
        try {
            const userCheck = await nilvera.checkUser(customerVkn);
            isEInvoiceUser = userCheck.isEInvoiceUser;
            customerAlias = userCheck.alias || "";
        } catch (checkErr) {
            console.warn('User check failed, defaulting to e-Archive', checkErr);
            isEInvoiceUser = false;
        }

        // Prepare invoice data
        const invoiceItems = Array.isArray(invoice.items) ? invoice.items : JSON.parse(JSON.stringify(invoice.items || []));

        // Calculate Totals and Prepare Lines
        let totalTaxExclusiveAmount = 0;
        let totalTaxAmount = 0;
        let totalDiscountAmount = 0;

        const lines = invoiceItems.map((item: any) => {
            const qty = Number(item.qty || item.quantity || 1);
            const price = Number(item.price || item.unitPrice || 0);
            const vatRate = Number(item.vat || item.vatRate || 20);
            const discount = Number(item.discount || 0);

            const lineTotal = qty * price;
            const vatAmount = (lineTotal * vatRate) / 100;

            totalTaxExclusiveAmount += lineTotal;
            totalTaxAmount += vatAmount;
            totalDiscountAmount += discount;

            return {
                Name: item.name || item.productName || 'Urun',
                Quantity: qty,
                UnitCode: "C62", // Adet
                UnitPrice: price,
                Taxes: [
                    {
                        TaxCode: "0015", // KDV
                        Rate: vatRate,
                        Amount: Number(vatAmount.toFixed(2))
                    }
                ],
                DiscountAmount: discount
            };
        });

        // Determine scenario
        const scenario = isEInvoiceUser ? "TEMELFATURA" : "EARSIVFATURA";

        const invoiceData = {
            InvoiceNumber: "",
            UUID: crypto.randomUUID(),
            InvoiceDate: new Date(invoice.invoiceDate).toISOString().split('.')[0],
            CurrencyCode: invoice.currency || 'TRY',
            InvoiceType: "SATIS",
            InvoiceScenario: scenario,
            PaymentType: "EFT/HAVALE",
            Note: invoice.description || 'Fatura',

            // Calculated Totals
            TaxExclusiveAmount: Number(totalTaxExclusiveAmount.toFixed(2)),
            TaxAmount: Number(totalTaxAmount.toFixed(2)),
            PayableAmount: Number((totalTaxExclusiveAmount + totalTaxAmount - totalDiscountAmount).toFixed(2)),

            Receiver: {
                Name: customerVkn.length === 10 ? invoice.customer.name : undefined,
                FirstName: customerVkn.length === 11 ? (invoice.customer.name.split(' ').slice(0, -1).join(' ') || invoice.customer.name) : undefined,
                FamilyName: customerVkn.length === 11 ? invoice.customer.name.split(' ').slice(-1).join(' ') : undefined,

                TaxNumber: customerVkn,
                TaxOffice: invoice.customer.taxOffice || '',
                Address: invoice.customer.address || 'Adres bilgisi girilmemis',
                City: invoice.customer.city || 'ISTANBUL',
                District: invoice.customer.district || 'MERKEZ',
                Country: 'TURKIYE',
                Email: invoice.customer.email || '',
                Phone: invoice.customer.phone || '',
                Alias: isEInvoiceUser ? (customerAlias || "urn:mail:defaultpk@gib.gov.tr") : undefined
            },
            Lines: lines
        };

        let result;
        if (type === 'despatch') {
            result = await nilvera.sendDespatch(invoiceData);
        } else {
            const invoiceType = isEInvoiceUser ? 'EFATURA' : 'EARSIV';
            result = await nilvera.sendInvoice(invoiceData, invoiceType);
        }

        if (result.success) {
            const uuid = result.formalId;
            await (prisma as any).salesInvoice.update({
                where: { id: invoiceId },
                data: {
                    isFormal: true,
                    formalType: type === 'despatch' ? 'EIRSALIYE' : (isEInvoiceUser ? 'EFATURA' : 'EARSIV'),
                    formalId: uuid,
                    formalUuid: uuid,
                    formalStatus: 'SENT'
                }
            });

            return NextResponse.json({
                success: true,
                message: `${isEInvoiceUser ? 'e-Fatura' : 'e-Arşiv'} başarıyla gönderildi`,
                uuid: uuid,
                type: isEInvoiceUser ? 'E_FATURA' : 'E_ARSIV'
            });
        } else {
            return NextResponse.json({
                success: false,
                error: result.error || 'Gönderim başarısız'
            }, { status: 500 }); // Client shows error message from body
        }

    } catch (error: any) {
        console.error('Integration/Send Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Entegrasyon hatası'
        }, { status: 500 });
    }
}
