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

// --- REUSABLE PDF PROXY HANDLER ---
async function handlePdfProxy(invoiceId: string, sessionCompanyId?: string) {
    try {
        let invoice = await (prisma as any).salesInvoice.findUnique({ where: { id: invoiceId } });
        let isIncoming = false;

        if (!invoice) {
            // Check if it's a purchase invoice in local DB
            const purchaseInv = await (prisma as any).purchaseInvoice.findUnique({ where: { id: invoiceId } });
            if (purchaseInv) {
                invoice = purchaseInv;
                isIncoming = true;
            }
        }

        const effectiveCompanyId = invoice?.companyId || sessionCompanyId;
        if (!effectiveCompanyId) {
            return new Response('Firma oturumu veya fatura bulunamadı.', { status: 400 });
        }

        // Use the new IntegratorSettings table
        const settings = await prisma.integratorSettings.findUnique({
            where: { companyId: effectiveCompanyId }
        });

        if (!settings || !settings.isActive) {
            return new Response('Aktif Nilvera entegrasyonu bulunamadı.', { status: 404 });
        }

        // Decrypt credentials to get API key
        const { decrypt } = require('@/lib/encryption');
        let apiKey = '';
        try {
            const creds = JSON.parse(decrypt(settings.credentials));
            apiKey = (creds.apiKey || creds.ApiKey || '').trim();
        } catch (e) {
            return new Response('Entegrasyon anahtarı çözülemedi.', { status: 500 });
        }

        if (!apiKey) {
            return new Response('Nilvera API anahtarı boş.', { status: 500 });
        }

        const baseUrl = (settings.environment === 'PRODUCTION') ? 'https://api.nilvera.com' : 'https://apitest.nilvera.com';
        const uuid = invoice?.formalUuid || (invoiceId.length > 20 ? invoiceId : null);

        if (!uuid) {
            return new Response('Fatura henüz resmileşmemiş (UUID yok).', { status: 400 });
        }

        const endpointsToTry = [];
        const formalType = invoice?.formalType;

        if (isIncoming) {
            endpointsToTry.push(`${baseUrl}/einvoice/Purchase/${uuid}/pdf`);
        } else if (formalType === 'EFATURA') {
            endpointsToTry.push(`${baseUrl}/einvoice/Sale/${uuid}/pdf`);
        } else if (formalType === 'EARSIV') {
            endpointsToTry.push(`${baseUrl}/earchive/Invoices/${uuid}/pdf`);
            endpointsToTry.push(`${baseUrl}/earchive/Sale/${uuid}/pdf`);
        } else if (formalType === 'EIRSALIYE') {
            endpointsToTry.push(`${baseUrl}/edespatch/Despatch/${uuid}/pdf`);
        }

        // Universal fallbacks
        const fallbacks = [
            `${baseUrl}/einvoice/Sale/${uuid}/pdf`,
            `${baseUrl}/einvoice/Purchase/${uuid}/pdf`,
            `${baseUrl}/earchive/Invoices/${uuid}/pdf`,
            `${baseUrl}/earchive/Sale/${uuid}/pdf`,
            `${baseUrl}/edespatch/Despatch/${uuid}/pdf`
        ];

        for (const f of fallbacks) {
            if (!endpointsToTry.includes(f)) endpointsToTry.push(f);
        }

        for (const url of endpointsToTry) {
            try {
                console.log(`[PDF Proxy] Trying URL: ${url}`);
                const pdfResponse = await fetch(url, {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Accept': 'application/pdf'
                    },
                    cache: 'no-store'
                });

                if (pdfResponse.ok) {
                    const contentType = pdfResponse.headers.get('content-type');
                    // Check if it's REALLY a PDF and not an error HTML/JSON
                    if (contentType?.includes('application/pdf')) {
                        console.log(`[PDF Proxy] Success for URL: ${url}`);
                        const buffer = await pdfResponse.arrayBuffer();
                        return new Response(buffer, {
                            status: 200,
                            headers: {
                                'Content-Type': 'application/pdf',
                                'Content-Disposition': `inline; filename="Fatura-${uuid}.pdf"`,
                                'Cache-Control': 'no-store'
                            }
                        });
                    }
                }
                console.warn(`[PDF Proxy] Failed ${url} with status ${pdfResponse.status}`);
            } catch (err: any) {
                console.warn(`[PDF Proxy] Error for ${url}:`, err.message);
            }
        }

        return new Response('Fatura PDF dosyası Nilvera sunucularından alınamadı.', { status: 404 });

    } catch (error: any) {
        console.error("[PDF Proxy Critical Error]:", error);
        return new Response('Sunucu hatası.', { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');
        const invoiceId = searchParams.get('invoiceId');

        const session = await getSession();

        if (action === 'get-pdf' && invoiceId) {
            return await handlePdfProxy(invoiceId, (session as any)?.companyId);
        }

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
        const body = await request.json();
        const { action, invoiceId } = body;

        // Support for PDF fetch via POST (legacy/component support)
        if (action === 'get-pdf' && invoiceId) {
            const session = await getSession();
            return await handlePdfProxy(invoiceId, (session as any)?.companyId);
        }

        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });

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

                    // SECOND STEP: Create E-Archive Report (Mandatory for immediate portal/GİB visibility)
                    if (sendResult.type === 'EARSIV') {
                        try {
                            console.log('[Formal Send] Triggering immediate report creation for e-Archive...');
                            await nilveraService.createArchiveReport(formalId, invoice.invoiceDate ? new Date(invoice.invoiceDate) : undefined);
                        } catch (reportErr: any) {
                            console.warn('[Formal Send] Background report creation warning:', reportErr.message);
                        }
                    }

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
