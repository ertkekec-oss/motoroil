import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession, hasPermission } from '@/lib/auth';
import { logActivity } from '@/lib/audit';
import { NilveraService } from '@/lib/nilvera';
import { NilveraInvoiceService } from '@/services/nilveraService';
import crypto from 'crypto';
import axios from 'axios';

export const dynamic = 'force-dynamic';

function generateGIBInvoiceNo(prefix: string) {
    const now = new Date();
    const year = now.getFullYear().toString();
    // GIB Standard requires 16 chars: PREFIX(3) + YEAR(4) + SERIAL(9)
    const serialPart = Math.floor(Math.random() * 999999999).toString().padStart(9, '0');
    return `${prefix}${year}${serialPart}`;
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');
        const invoiceId = searchParams.get('invoiceId');

        // --- PDF GÖRÜNTÜLEME PROXY (Public access for sharing) ---
        if (action === 'get-pdf' && invoiceId) {
            try {
                const invoice = await (prisma as any).salesInvoice.findUnique({ where: { id: invoiceId } });
                if (!invoice || !invoice.formalUuid) return NextResponse.json({ error: 'Fatura bulunamadı' }, { status: 404 });

                const settingsRecord = await prisma.appSettings.findUnique({
                    where: {
                        companyId_key: { companyId: invoice.companyId, key: 'eFaturaSettings' }
                    }
                });
                const config = (settingsRecord?.value as any) || {};

                const formalType = invoice.formalType;
                let module = 'EArchive';
                if (formalType === 'EFATURA') module = 'EInvoice';
                if (formalType === 'EIRSALIYE') module = 'EDespatch';

                const baseUrl = (config.environment?.toLowerCase() === 'production') ? 'https://api.nilvera.com' : 'https://apitest.nilvera.com';
                const endpoint = `${baseUrl}/${module}/Download/${invoice.formalUuid}/PDF`;

                const pdfResponse = await axios.get(endpoint, {
                    headers: { 'Authorization': `Bearer ${config.apiKey}` },
                    responseType: 'arraybuffer',
                    validateStatus: () => true
                });

                if (pdfResponse.status >= 400) {
                    console.error("[PDF Proxy Error]:", pdfResponse.status, pdfResponse.data?.toString());
                    return NextResponse.json({ success: false, error: 'Fatura henüz hazırlanıyor veya bulunamadı.' }, { status: pdfResponse.status });
                }

                return new NextResponse(pdfResponse.data, {
                    headers: {
                        'Content-Type': 'application/pdf',
                        'Content-Disposition': `inline; filename="Fatura-${invoice.formalUuid}.pdf"`
                    }
                });
            } catch (err: any) {
                console.error("CRITICAL PDF Fetch Error:", err.message);
                return NextResponse.json({ success: false, error: 'PDF sunucusuyla bağlantı hatası.' }, { status: 500 });
            }
        }

        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });

        const branch = searchParams.get('branch');

        const where: any = { deletedAt: null };
        if (branch && branch !== 'Tümü' && branch !== 'all') {
            where.branch = branch;
        }

        const invoices = await prisma.salesInvoice.findMany({
            where,
            include: { customer: true },
            orderBy: { createdAt: 'desc' }
        });

        const safeInvoices = invoices.map(inv => ({
            ...inv,
            isFormal: inv.isFormal && ((inv as any).formalId && (inv as any).formalId.length > 5)
        }));

        return NextResponse.json({ success: true, invoices: safeInvoices });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });

        const body = await request.json();
        const { action, invoiceId } = body;

        // HIJACKING FOR PROXY BYPASS: Send Formal Invoice / Despatch
        if (action === 'formal-send' && invoiceId) {
            try {
                console.log('[Formal Send] Incoming Body:', body);
                const { type, formalType, shipmentDate, shipmentTime, plateNumber, driverName, driverSurname, driverId } = body;
                const requestedType = formalType || type;
                console.log('[Formal Send] Requested Type:', requestedType);

                const invoice = await (prisma as any).salesInvoice.findUnique({
                    where: { id: invoiceId },
                    include: { customer: true }
                });

                if (!invoice) return NextResponse.json({ success: false, error: 'Fatura bulunamadı' }, { status: 200 });

                const settingsRecord = await prisma.appSettings.findUnique({
                    where: {
                        companyId_key: { companyId: invoice.companyId, key: 'eFaturaSettings' }
                    }
                });
                const config = (settingsRecord?.value as any) || {};

                // Initialize the new professional service
                const nilveraService = new NilveraInvoiceService({
                    apiKey: config.apiKey,
                    baseUrl: (config.environment?.toLowerCase() === 'production') ? 'https://api.nilvera.com' : 'https://apitest.nilvera.com'
                });

                // Prepare Data with precise rounding to prevent report generation errors
                const items = (invoice.items as any[]) || [];
                const invoiceLines = items.map(i => {
                    const qty = parseFloat(i.qty?.toString() || "1");
                    const price = parseFloat(i.price?.toString() || "0");
                    const vatRate = parseFloat(i.vat?.toString() || "20");
                    const otvRate = parseFloat(i.otv?.toString() || "0");

                    const lineNet = Number((qty * price).toFixed(2));
                    const lineOtv = Number((lineNet * (otvRate / 100)).toFixed(2));
                    const lineVatBase = lineNet + lineOtv;
                    const lineVat = Number((lineVatBase * (vatRate / 100)).toFixed(2));

                    return {
                        Name: i.name || "URUN",
                        Quantity: qty,
                        UnitType: "C62",
                        Price: price,
                        VatRate: vatRate,
                        OtvRate: otvRate,
                        LineNet: lineNet,
                        LineVat: lineVat,
                        LineOtv: lineOtv,
                        Total: Number((lineVatBase + lineVat).toFixed(2))
                    };
                });

                const totalNet = invoiceLines.reduce((sum, l) => sum + l.LineNet, 0);
                const totalVat = invoiceLines.reduce((sum, l) => sum + l.LineVat, 0);
                const totalOtv = invoiceLines.reduce((sum, l) => sum + l.LineOtv, 0);
                const grandTotal = invoiceLines.reduce((sum, l) => sum + l.Total, 0);

                let sendResult;

                if (requestedType?.toString().toUpperCase() === 'EIRSALIYE') {
                    sendResult = await nilveraService.processAndSendDespatch({
                        customer: {
                            TaxNumber: (invoice.customer.taxNumber || invoice.customer.identityNumber || "11111111111").trim(),
                            Name: invoice.customer.name,
                            Email: invoice.customer.email || "destek@kech.tr",
                            Address: invoice.customer.address || "ADRES",
                            District: invoice.customer.district || "KADIKOY",
                            City: invoice.customer.city || "ISTANBUL",
                            Country: "TR",
                            TaxOffice: invoice.customer.taxOffice || "KADIKOY"
                        },
                        company: {
                            TaxNumber: config.companyVkn || "1111111111",
                            Name: config.companyTitle || "FIRMA UNVANI",
                            Email: config.portalEmail || "destek@kech.tr",
                            Address: config.companyAddress || "ADRES",
                            District: config.portalDistrict || "KADIKOY",
                            City: config.portalCity || "ISTANBUL",
                            Country: "TR",
                            TaxOffice: config.portalTaxOffice || "KADIKOY"
                        },
                        lines: invoiceLines.map(l => ({
                            Name: l.Name,
                            Quantity: l.Quantity,
                            UnitType: l.UnitType,
                            Price: l.Price,
                            VatRate: l.VatRate
                        })),
                        description: invoice.description || "İrsaliye",
                        shipmentDate,
                        shipmentTime,
                        plateNumber,
                        driverName,
                        driverSurname,
                        driverId
                    });
                } else {
                    sendResult = await nilveraService.processAndSend({
                        customer: {
                            TaxNumber: (invoice.customer.taxNumber || invoice.customer.identityNumber || "11111111111").trim(),
                            Name: invoice.customer.name,
                            Email: invoice.customer.email || "destek@kech.tr",
                            Address: invoice.customer.address || "ADRES",
                            District: invoice.customer.district || "KADIKOY",
                            City: invoice.customer.city || "ISTANBUL",
                            Country: "TR",
                            TaxOffice: invoice.customer.taxOffice || "KADIKOY"
                        },
                        company: {
                            TaxNumber: config.companyVkn || "1111111111",
                            Name: config.companyTitle || "FIRMA UNVANI",
                            Email: config.portalEmail || "destek@kech.tr",
                            Address: config.companyAddress || "ADRES",
                            District: config.portalDistrict || "KADIKOY",
                            City: config.portalCity || "ISTANBUL",
                            Country: "TR",
                            TaxOffice: config.portalTaxOffice || "KADIKOY"
                        },
                        lines: invoiceLines.map(l => ({
                            Name: l.Name,
                            Quantity: l.Quantity,
                            UnitType: l.UnitType,
                            Price: l.Price,
                            VatRate: l.VatRate
                        })),
                        amounts: {
                            base: Number(totalNet.toFixed(2)),
                            tax: Number((totalVat + totalOtv).toFixed(2)),
                            total: Number(grandTotal.toFixed(2))
                        },
                        isInternetSale: false,
                        internetInfo: {
                            WebSite: "www.kech.tr",
                            PaymentMethod: "KREDIKARTI/BANKAKARTI",
                            PaymentDate: new Date().toISOString().split('T')[0],
                            TransporterName: "ARAS KARGO"
                        }
                    });
                }

                if (sendResult.success) {
                    const rawData = sendResult.data;
                    console.log('[Formal Send] Success Data:', JSON.stringify(rawData));

                    // Smart ID Extraction (Nilvera responses can vary)
                    let formalId = null;

                    // If it's an array, take the first element
                    const dataObj = Array.isArray(rawData) ? rawData[0] : rawData;

                    // Check various potential ID fields
                    formalId = dataObj?.UUID ||
                        dataObj?.formalId ||
                        dataObj?.Id ||
                        dataObj?.DespatchNumber ||
                        dataObj?.InvoiceNumber ||
                        dataObj?.Content?.UUID ||
                        dataObj?.Content?.InvoiceNumber;

                    if (!formalId) {
                        console.error('[Formal Send] Could not extract ID from response:', rawData);
                        return NextResponse.json({
                            success: false,
                            error: "Fatura gönderildi ancak sistem ID'si alınamadı. Lütfen entegrasyon panelinden kontrol edin.",
                            details: JSON.stringify(rawData)
                        });
                    }

                    await (prisma as any).salesInvoice.update({
                        where: { id: invoiceId },
                        data: {
                            isFormal: true,
                            formalStatus: 'SENT',
                            formalUuid: formalId,
                            formalType: sendResult.type // EFATURA, EARSIV veya EIRSALIYE
                        }
                    });

                    return NextResponse.json({
                        success: true,
                        message: `${sendResult.type === 'EIRSALIYE' ? 'İrsaliye' : 'Fatura'} başarıyla gönderildi.`,
                        formalId: formalId,
                        type: sendResult.type,
                        invoice: { id: invoiceId, invoiceNo: invoice.invoiceNo } // Return enough info for the share link
                    });
                }

                const errorDetail = sendResult.error || "Bilinmeyen API Hatası";
                const technicalDetails = typeof sendResult.data === 'object' ? JSON.stringify(sendResult.data) : String(sendResult.data);

                return NextResponse.json({
                    success: false,
                    error: errorDetail,
                    details: technicalDetails
                }, { status: 200 });

            } catch (err: any) {
                console.error('CRITICAL FORMAL SEND ERROR:', err);
                return NextResponse.json({
                    success: false,
                    error: "Sistemsel Hata",
                    details: err.message
                }, { status: 200 });
            }
        }

        // ORIGINAL INVOICE CREATION LOGIC
        if (!hasPermission(session, 'sales_invoice_manage')) {
            return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
        }

        const {
            customerId,
            items,
            amount,
            taxAmount,
            totalAmount,
            description,
            isFormal = false,
            status = 'Taslak',
            branch
        } = body;

        if (!customerId || !items || items.length === 0) {
            return NextResponse.json({ success: false, error: 'Müşteri ve ürün bilgileri zorunludur.' }, { status: 400 });
        }

        const createResult = await prisma.$transaction(async (tx) => {
            const customer = await tx.customer.findUnique({ where: { id: customerId } });
            const targetBranch = branch || customer?.branch || session.branch || 'Merkez';

            const invoice = await tx.salesInvoice.create({
                data: {
                    invoiceNo: `INV-${Date.now()}`,
                    customerId,
                    companyId: customer?.companyId || (session as any).companyId,
                    amount,
                    taxAmount,
                    totalAmount,
                    description,
                    items: items,
                    isFormal: isFormal,
                    status: status,
                    branch: String(targetBranch)
                }
            });

            if (isFormal || status === 'Onaylandı') {
                await tx.customer.update({
                    where: { id: customerId },
                    data: { balance: { increment: parseFloat(totalAmount.toString()) } }
                });

                const defaultKasa = await tx.kasa.findFirst({ where: { branch: String(targetBranch) } }) || await tx.kasa.findFirst();
                if (defaultKasa) {
                    await tx.transaction.create({
                        data: {
                            companyId: customer?.companyId || invoice.companyId,
                            type: 'SalesInvoice',
                            amount: totalAmount,
                            description: `Faturalı Satış: ${invoice.invoiceNo}`,
                            kasaId: defaultKasa.id.toString(),
                            customerId: customerId,
                            date: new Date(),
                            branch: String(targetBranch)
                        }
                    });
                }

                for (const item of items) {
                    if (item.productId) {
                        const pId = String(item.productId);
                        const qty = Number(item.qty);
                        await tx.product.update({ where: { id: pId }, data: { stock: { decrement: qty } } });
                        await tx.stock.upsert({
                            where: { productId_branch: { productId: pId, branch: String(targetBranch) } },
                            update: { quantity: { decrement: qty } },
                            create: { productId: pId, branch: String(targetBranch), quantity: -qty }
                        });
                        await (tx as any).stockMovement.create({
                            data: {
                                productId: pId,
                                branch: String(targetBranch),
                                companyId: customer?.companyId || invoice.companyId,
                                quantity: -qty,
                                price: item.price || 0,
                                type: 'SALE',
                                referenceId: invoice.id
                            }
                        });
                    }
                }
            }

            await logActivity({
                userId: session.id as string,
                userName: session.username as string,
                action: 'CREATE',
                entity: 'SalesInvoice',
                entityId: invoice.id,
                newData: invoice,
                details: `${invoice.invoiceNo} numaralı satış faturası oluşturuldu.`,
                branch: session.branch as string
            });

            return invoice;
        });

        return NextResponse.json({ success: true, invoice: createResult });

    } catch (error: any) {
        console.error('GLOBAL INVOICE API ERROR:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            errorType: error.name,
            stack: error.stack,
            details: 'Global API Catch'
        }, { status: 500 });
    }
}
