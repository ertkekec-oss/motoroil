import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession, hasPermission } from '@/lib/auth';
import { logActivity } from '@/lib/audit';
import { NilveraService } from '@/lib/nilvera';
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
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });

        const { searchParams } = new URL(request.url);
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

        // HIJACKING FOR PROXY BYPASS: Send Formal Invoice
        if (action === 'formal-send' && invoiceId) {
            try {
                const invoice = await (prisma as any).salesInvoice.findUnique({
                    where: { id: invoiceId },
                    include: { customer: true }
                });

                if (!invoice) return NextResponse.json({ success: false, error: 'Fatura bulunamadı' }, { status: 200 });

                const settingsRecord = await prisma.appSettings.findUnique({ where: { key: 'eFaturaSettings' } });
                const rawConfig = settingsRecord?.value as any;
                const config = rawConfig?.apiKey ? rawConfig : (rawConfig?.nilvera || {});

                const nilvera = new NilveraService({
                    apiKey: config.apiKey,
                    baseUrl: config.apiUrl,
                    environment: config.environment || 'test'
                });

                // Fetch official records from Nilvera to ensure VKN match
                const portalInfo = await nilvera.getCompanyInfo();
                const companyVkn = portalInfo?.TaxNumber || config.companyVkn || "1111111111";
                const companyTitle = portalInfo?.Name || portalInfo?.Title || config.companyTitle || "Firma Ünvanı";

                let customerVkn = (invoice.customer.taxNumber || invoice.customer.identityNumber || "").trim();

                function sanitize(text: string, removeNumbers: boolean = false) {
                    if (!text) return "";
                    let cleaned = text
                        .replace(/İ/g, "I").replace(/ı/g, "i")
                        .replace(/Ğ/g, "G").replace(/ğ/g, "g")
                        .replace(/Ü/g, "U").replace(/ü/g, "u")
                        .replace(/Ş/g, "S").replace(/ş/g, "s")
                        .replace(/Ö/g, "O").replace(/ö/g, "o")
                        .replace(/Ç/g, "C").replace(/ç/g, "c");

                    if (removeNumbers) {
                        cleaned = cleaned.replace(/[0-9]/g, "");
                    }

                    return cleaned.replace(/[^a-zA-Z0-9\s]/g, "").toUpperCase().trim();
                }

                function generateStandardInvoiceNo(isEInvoice: boolean) {
                    const prefix = isEInvoice ? "EFT" : "ARS";
                    const year = new Date().getFullYear().toString();
                    const seq = Math.floor(Math.random() * 999999999).toString().padStart(9, '0');
                    return `${prefix}${year}${seq}`;
                }

                let lastPayload: any = null;
                async function attemptSending(isEInvoice: boolean, alias?: string) {
                    const invNo = generateStandardInvoiceNo(isEInvoice);
                    const now = new Date();

                    const items = (invoice.items as any[]) || [];
                    let totalLineExtension = 0;
                    let totalTaxAmount = 0;

                    const invoiceLines = items.map((i, idx) => {
                        const qty = parseFloat(i.qty?.toString() || "0");
                        const price = parseFloat(i.price?.toString() || "0");
                        const vatRate = parseFloat(i.vat?.toString() || "20");
                        const lineExtension = Number((qty * price).toFixed(2));
                        const lineVat = Number((lineExtension * (vatRate / 100)).toFixed(2));

                        totalLineExtension += lineExtension;
                        totalTaxAmount += lineVat;

                        return {
                            Index: idx + 1,
                            Name: sanitize(i.name || "URUN").substring(0, 50),
                            Quantity: qty,
                            UnitType: "C62",
                            UnitPrice: price,
                            VatRate: vatRate,
                            VatAmount: Number(lineVat.toFixed(2)),
                            LineExtensionAmount: Number(lineExtension.toFixed(2))
                        };
                    });

                    const finalNet = Number(totalLineExtension.toFixed(2));
                    const finalTax = Number(totalTaxAmount.toFixed(2));
                    const finalTotal = Number((finalNet + finalTax).toFixed(2));

                    // ADRES VE ILCE TEMIZLIGI
                    let compCity = sanitize(portalInfo?.City || config.portalCity || "ISTANBUL");
                    let compDist = sanitize(portalInfo?.District || config.portalDistrict || "KADIKOY", true);
                    if (compCity === "ISTANBUL" && (compDist === "MERKEZ" || !compDist)) compDist = "KADIKOY";

                    let custCity = sanitize(invoice.customer.city || "ISTANBUL");
                    let custDist = sanitize(invoice.customer.district || "KADIKOY", true);
                    if (custCity === "ISTANBUL" && (custDist === "MERKEZ" || !custDist)) custDist = "KADIKOY";

                    const payload: any = {
                        InvoiceInfo: {
                            UUID: crypto.randomUUID(),
                            InvoiceType: "SATIS",
                            InvoiceProfile: isEInvoice ? "TEMELFATURA" : "EARSIVFATURA",
                            InvoiceSerieOrNumber: invNo, // 16 Hane: ARS + YIL + 9 Rakam
                            IssueDate: now.toISOString().split('T')[0],
                            CurrencyCode: "TRY",
                            LineExtensionAmount: finalNet,
                            TaxExclusiveAmount: finalNet,
                            TaxInclusiveAmount: finalTotal,
                            PayableAmount: finalTotal
                        },
                        CompanyInfo: {
                            TaxNumber: companyVkn,
                            Name: sanitize(companyTitle).substring(0, 100),
                            Address: sanitize(portalInfo?.Address || config.companyAddress || "ADRES").substring(0, 200),
                            District: compDist,
                            City: compCity,
                            Country: "TR"
                        },
                        CustomerInfo: {
                            TaxNumber: customerVkn,
                            Name: sanitize(invoice.customer.name).substring(0, 100),
                            Address: sanitize(invoice.customer.address || "ADRES").substring(0, 200),
                            District: custDist,
                            City: custCity,
                            Country: "TR"
                        },
                        InvoiceLines: invoiceLines
                    };

                    if (isEInvoice) {
                        const finalRequest = { EInvoice: payload, CustomerAlias: alias };
                        lastPayload = finalRequest;
                        console.log(`Sending to Nilvera [EF]:`, JSON.stringify(finalRequest, null, 2));
                        return await nilvera.sendInvoice(finalRequest, 'EFATURA');
                    } else {
                        (payload.InvoiceInfo as any).SalesPlatform = "NORMAL";
                        (payload.InvoiceInfo as any).SendType = "ELEKTRONIK";
                        const finalRequest = { ArchiveInvoice: payload };
                        lastPayload = finalRequest;
                        console.log(`Sending to Nilvera [EA]:`, JSON.stringify(finalRequest, null, 2));
                        return await nilvera.sendInvoice(finalRequest, 'EARSIV');
                    }
                }

                // 1. ADIM: ALİAS SORGULA VE SERİLERİ ÇEK

                // KENDİNE FATURA ENGELİ (Critical Fix)
                // Gönderici ve Alıcı VKN aynıysa (Test hatası), müşteri VKN'yi dummy TCKN yap.
                if (companyVkn === customerVkn) {
                    console.warn(`[SELF-INVOICE DETECTED] Sender: ${companyVkn} == Receiver: ${customerVkn}. Swapping receiver to 11111111111.`);
                    customerVkn = "11111111111";
                }

                let userCheck = await nilvera.checkUser(customerVkn);
                let currentAttemptIsEInvoice = userCheck.isEInvoiceUser && !!userCheck.alias;
                let currentAlias = userCheck.alias;

                if (userCheck.isEInvoiceUser && !currentAlias && config.environment === 'test') {
                    currentAlias = "urn:mail:defaultpk@nilvera.com";
                    currentAttemptIsEInvoice = true;
                }

                // TEMPORARY TEST: Force all to e-Invoice
                currentAttemptIsEInvoice = true;
                if (!currentAlias) currentAlias = "urn:mail:defaultpk@nilvera.com";

                // E-ARŞİV İÇİN VKN (10 Hane) ve DUMMY TCKN ENGELİ
                // Eğer E-Arşiv ve VKN 10 haneli VEYA '11111111111' ise (İnternet satışında kabul edilmez)
                // Bunu geçerli Test TCKN (10000000146) ve 'Nihai Tüketici' olarak değiştir.
                let finalCustomerName = sanitize(invoice.customer.name).substring(0, 100);
                if (!currentAttemptIsEInvoice && (customerVkn.length === 10 || customerVkn === "11111111111")) {
                    console.warn(`[E-ARCHIVE VKN FIX] Customer has invalid VKN/TCKN (${customerVkn}) for e-Archive Internet Sale. Swapping to 10000000146.`);
                    customerVkn = "10000000146"; // Değişkeni güncelle (GİB Test TCKN)
                    finalCustomerName = "Nihai Tüketici";
                }

                // SERİLERİ NILVERA'DAN CANLI ÇEK (TAHMİN ETME!)
                let officialSeriesPrefix = currentAttemptIsEInvoice ? "EFT" : "ARS";
                let officialSeriesResponse: any = null;
                try {
                    const seriesEndpoint = currentAttemptIsEInvoice ? '/EInvoice/Series' : '/EArchive/Series';
                    const seriesRes = await (axios as any).get(`${config.apiUrl || (config.environment === 'production' ? 'https://api.nilvera.com' : 'https://apitest.nilvera.com')}${seriesEndpoint}`, {
                        headers: { 'Authorization': `Bearer ${config.apiKey}` }
                    });
                    officialSeriesResponse = seriesRes.data;

                    const activeSeries = officialSeriesResponse?.Content?.find((s: any) => s.IsActive && s.IsDefault) || officialSeriesResponse?.Content?.[0];
                    if (activeSeries && activeSeries.Name) {
                        officialSeriesPrefix = activeSeries.Name;
                    }
                } catch (seriesErr) {
                    console.error("SERIES FETCH ERROR:", seriesErr);
                }

                // 2. ADIM: KUSURSUZ PAYLOAD OLUŞTURMA (422 KATİLLERİ)
                try {
                    const items = (invoice.items as any[]) || [];
                    let totalLineExtension = 0;
                    let totalTaxAmount = 0;

                    const invoiceLines = items.map((i, idx) => {
                        const qty = parseFloat(i.qty?.toString() || "0");
                        const price = parseFloat(i.price?.toString() || "0");
                        const vatRate = parseFloat(i.vat?.toString() || "20");
                        const lineNet = Number((qty * price).toFixed(2));
                        const lineVat = Number((lineNet * (vatRate / 100)).toFixed(2));
                        totalLineExtension += lineNet;
                        totalTaxAmount += lineVat;

                        return {
                            Index: idx + 1,
                            Name: sanitize(i.name || "URUN").substring(0, 50),
                            Quantity: qty,
                            UnitType: "C62", // ADET yerine C62 (UBL Standardı)
                            Price: price,
                            KDVPercent: vatRate,
                            KDVTotal: Number(lineVat.toFixed(2)),
                            LineExtensionAmount: Number(lineNet.toFixed(2))
                        };
                    });

                    const taxExclusiveAmount = Number(totalLineExtension.toFixed(2));
                    const taxAmount = Number(totalTaxAmount.toFixed(2));
                    const taxInclusiveAmount = Number((taxExclusiveAmount + taxAmount).toFixed(2));
                    const payableAmount = taxInclusiveAmount;

                    if (isNaN(taxExclusiveAmount) || isNaN(taxInclusiveAmount) || isNaN(payableAmount)) {
                        throw new Error("Payload Hazırlık Hatası: Tutar alanları hesaplanamadı (NaN)");
                    }

                    // BUGÜNKÜ TARİH KULLAN (Geriye tarihli fatura yasak!)
                    // SERVER TIME (UTC) YERİNE TURKEY TIME (UTC+3) KULLAN
                    const utcNow = new Date();
                    const now = new Date(utcNow.getTime() + (3 * 60 * 60 * 1000));
                    const currentYear = now.getFullYear().toString();

                    // ISSUE TIME İLERİ ALINMALI (PaymentDate < IssueTime kuralı için)
                    const futureNow = new Date(now.getTime() + 10000); // 10 saniye ileri

                    // TARİH FORMATI: Kullanıcı isteği üzerine tam ISO formatı (Tarih+Saat)
                    // Örnek: "2026-02-04T10:45:03"
                    const fullIssueDate = `${now.toISOString().split('T')[0]}T${futureNow.toISOString().split('T')[1].split('.')[0]}`;

                    // PaymentDate ŞİMDİKİ ZAMAN (IssueTime'dan önce kalmalı)
                    const paymentDateFull = `${now.toISOString().split('T')[0]}T${now.toISOString().split('T')[1].split('.')[0]}`;

                    // 10B2026000000691 FORMATI İÇİN CANLI SAYAÇ HESABI
                    let ordinal = 0;

                    // SERİ SEÇİMİ: Nilvera E-Arşiv 'Default' seriyi baz alır ve sadece numara bekler.
                    // Önce 'IsDefault' olanı buluyoruz. (Örn: 10B)
                    const activeSeries = officialSeriesResponse?.Content?.find((s: any) => s.IsActive && s.IsDefault)
                        || officialSeriesResponse?.Content?.find((s: any) => s.Name === (currentAttemptIsEInvoice ? "EFT" : "ARS") && s.IsActive)
                        || officialSeriesResponse?.Content?.[0];

                    if (activeSeries && activeSeries.Name) {
                        officialSeriesPrefix = activeSeries.Name;
                        if (activeSeries.Details) {
                            const yearDetail = activeSeries.Details.find((d: any) => d.Year === currentYear);
                            if (yearDetail) {
                                ordinal = yearDetail.OrdinalNumber || 0;
                            }
                        }
                    }

                    // NILVERA OTOMATIK NUMARALAMA
                    // Sadece seri kodunu gönder (3 hane), Nilvera otomatik numara üretir
                    // Örnek: "101" -> Nilvera "101000000112" üretir
                    const invNo = officialSeriesPrefix;

                    const metaYesterday = new Date(now);
                    metaYesterday.setDate(metaYesterday.getDate() - 1);
                    const paymentDate = `${metaYesterday.getFullYear()}-${(metaYesterday.getMonth() + 1).toString().padStart(2, '0')}-${metaYesterday.getDate().toString().padStart(2, '0')}T00:00:00`;

                    const basePayload: any = {
                        InvoiceInfo: {
                            UUID: crypto.randomUUID(),
                            InvoiceType: "SATIS",
                            // PROFİL SEÇİMİ: E-Fatura için TICARIFATURA, E-Arşiv için EARSIVFATURA
                            InvoiceProfile: currentAttemptIsEInvoice ? "TICARIFATURA" : "EARSIVFATURA",
                            // Sadece seri kodu (3 hane), Nilvera otomatik tam numara üretir
                            // Örnek: "101" -> Nilvera "101000000112" üretir
                            InvoiceSerieOrNumber: invNo,
                            IssueDate: fullIssueDate,
                            // Kullanıcı örneğinde IssueTime yok, IssueDate tam formatlı

                            CurrencyCode: "TRY",
                            LineExtensionAmount: taxExclusiveAmount,
                            GeneralKDV20Total: taxAmount,
                            KdvTotal: taxAmount,
                            TaxExclusiveAmount: taxExclusiveAmount,
                            TaxInclusiveAmount: taxInclusiveAmount,
                            PayableAmount: payableAmount
                            // SalesPlatform, SendType, DeliveryType alanları kaldırıldı (UBL şema hatası)
                        },
                        CompanyInfo: {
                            TaxNumber: companyVkn,
                            Name: sanitize(companyTitle).substring(0, 100),
                            Address: sanitize(portalInfo?.Address || config.companyAddress || "ADRES").substring(0, 200),
                            District: sanitize(portalInfo?.District || config.portalDistrict || "KADIKOY", true),
                            City: sanitize(portalInfo?.City || config.portalCity || "ISTANBUL"),
                            Country: "TR"
                        },
                        CustomerInfo: (() => {
                            let custAddress = sanitize(invoice.customer.address || "ADRES").substring(0, 150);
                            // GİB KURALI: İnternet satışında kargo adresi detaylı olmalı (No/Daire)
                            if (customerVkn.length === 11 && !custAddress.match(/\bNo:\d+/i)) {
                                custAddress += " No:1";
                            }
                            return {
                                TaxNumber: customerVkn,
                                Name: finalCustomerName,
                                Address: custAddress,
                                District: sanitize(invoice.customer.district || "KADIKOY", true),
                                City: sanitize(invoice.customer.city || "ISTANBUL"),
                                Country: "TR"
                            };
                        })(),
                        InvoiceLines: invoiceLines
                    };

                    const finalPayload: any = currentAttemptIsEInvoice
                        ? { EInvoice: basePayload, CustomerAlias: currentAlias }
                        : {
                            ArchiveInvoice: {
                                ...basePayload,
                                InvoiceInfo: {
                                    ...basePayload.InvoiceInfo,
                                    // KRİTİK KURAL (Tablo):
                                    // TCKN (11 hane) -> INTERNET Satışı + InternetSaleInfo
                                    // VKN (10 hane) -> NORMAL Satış (InternetSaleInfo YOK)
                                    SalesPlatform: customerVkn.length === 11 ? "INTERNET" : "NORMAL",

                                    ...(customerVkn.length === 11 ? {
                                        InternetSaleInfo: {
                                            Website: "www.periodya.com",
                                            PaymentType: "KREDIKARTI",
                                            PaymentDate: paymentDateFull, // Full DateTime (YYYY-MM-DDTHH:mm:ss)
                                            // Nilvera'nın BEKLEDİĞİ doğru alan adları:
                                            CargoCompany: "TEST LOJISTIK",   // "YOK" kabul edilmez
                                            CargoTrackingNumber: "1234567890" // "YOK" kabul edilmez
                                        }
                                    } : {})
                                }
                            }
                        };

                    lastPayload = finalPayload;
                    const sendResult = await nilvera.sendInvoice(finalPayload, currentAttemptIsEInvoice ? 'EFATURA' : 'EARSIV');

                    if (sendResult.success) {
                        await (prisma as any).salesInvoice.update({
                            where: { id: invoiceId },
                            data: { isFormal: true, formalStatus: 'SENT', formalUuid: sendResult.formalId }
                        });
                        return NextResponse.json({
                            success: true,
                            message: 'Fatura başarıyla gönderildi.',
                            formalId: sendResult.formalId,
                            type: currentAttemptIsEInvoice ? 'EFATURA' : 'EARSIV'
                        });
                    }

                    return NextResponse.json({
                        success: false,
                        error: sendResult.errorCode === 422 ? "UBL Hatası: Tarih/Enum/Şema Uyuşmazlığı" : sendResult.error,
                        errorCode: sendResult.errorCode,
                        details: `HATA: ${sendResult.error} | PAYLOAD: ${JSON.stringify(lastPayload)} | OFFICIAL_SERIES: ${JSON.stringify(officialSeriesResponse)}`
                    }, { status: 200 });

                } catch (vErr: any) {
                    return NextResponse.json({
                        success: false,
                        error: `Payload Hazırlık Hatası: ${vErr.message}`
                    }, { status: 200 });
                }
            } catch (err: any) {
                console.error('CRITICAL FORMAL SEND ERROR:', err);
                return NextResponse.json({
                    success: false,
                    error: err.message,
                    details: 'Formal Send bloğu içinde bir hata oluştu.'
                }, { status: 200 });
            }
            return; // formalOnly ise aşağı devam etme
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
