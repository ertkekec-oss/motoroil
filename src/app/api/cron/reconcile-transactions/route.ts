
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createNilveraClient } from '@/lib/nilvera';

export async function GET(req: NextRequest) {
    // 1. Güvenlik Kontrolü (Vercel Cron)
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        // Dev ortamında kolaylık olması için opsiyonel bırakılabilir, ama PROD'da zorunlu.
        // Şimdilik strict değilsek bile loglayalım.
        if (process.env.NODE_ENV === 'production') {
            return new NextResponse('Unauthorized', { status: 401 });
        }
    }

    try {
        // 2. Bekleyen İşlemleri Bul (Örn: 5 dakika ile 24 saat arası bekleyenler)
        // Çok yeni olanları almamak iyi olur (hala işleniyor olabilir).
        const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const pendingRequests = await prisma.externalRequest.findMany({
            where: {
                status: 'PENDING',
                provider: 'NILVERA',
                entityType: 'SALES_INVOICE',
                updatedAt: {
                    lt: fiveMinsAgo,
                    gt: oneDayAgo
                }
            },
            take: 50 // Her çalışmada en fazla 50 tane işle (Batch processing)
        });

        if (pendingRequests.length === 0) {
            return NextResponse.json({ message: 'No pending transactions found.' });
        }

        const stats = { processed: 0, recovered: 0, failed: 0, skipped: 0 };

        // 3. Her isteği işle
        for (const req of pendingRequests) {
            try {
                // Faturayı bul
                const invoice = await prisma.salesInvoice.findUnique({
                    where: { id: req.entityId },
                    include: { customer: true }
                });

                if (!invoice || !invoice.companyId) {
                    // Fatura silinmiş veya companyId yok -> FAILED işaretle
                    await prisma.externalRequest.update({
                        where: { id: req.id },
                        data: { status: 'FAILED', responsePayload: { error: 'Invoice or Company not found' } }
                    });
                    stats.failed++;
                    continue;
                }

                // Entegratör Client
                const nilvera = await createNilveraClient(invoice.companyId);

                // Nilvera'dan son 24 saatin faturalarını çek (Cachelenebilir, basitlik için her seferinde çağırıyoruz)
                // Optimize etmek için: Aynı companyId için sadece bir kere çekip loop içinde match edilebilir.
                // Burada döngü içinde çağırıyoruz, batch optimize edilebilir.
                const invoices = await nilvera.getInvoices(oneDayAgo, new Date(), 'EFATURA'); // Hepsini çek (e-arşiv de eklenebilir)
                // E-Arşiv için ayrı çağrı gerekebilir. Şimdilik sadece e-fatura varsayalım veya ikisini birleştir.
                const archives = await nilvera.getInvoices(oneDayAgo, new Date(), 'EARSIV');
                const allRemoteInvoices = [...invoices, ...archives];

                // Eşleşme Ara: Tutar ve Alıcı VKN
                // Not: Nilvera listesinde InvoiceNumber, UUID, PayableAmount, ReceiverTaxNumber olur.
                // UUID elimizde yoksa Tutar + VKN + Tarih eşleşmesi en iyisidir.
                const targetAmount = Number(invoice.totalAmount);
                const targetVkn = (invoice.customer.taxNumber || invoice.customer.identityNumber || "").trim();

                const match = allRemoteInvoices.find((ri: any) => {
                    // Tutar kontrolü (kuruş farkı olabilir, esnek olalım)
                    const remoteAmount = Number(ri.PayableAmount || ri.TotalAmount || 0);
                    const amountMatch = Math.abs(remoteAmount - targetAmount) < 0.05;

                    // VKN Kontrolü
                    // ri.ReceiverTaxNumber veya ri.ReceiverIdentifier
                    const remoteVkn = (ri.ReceiverTaxNumber || ri.ReceiverIdentifier || "").trim();
                    const vknMatch = remoteVkn === targetVkn;

                    return amountMatch && vknMatch;
                });

                if (match) {
                    // KURTARILDI: İşlem başarılıymış ama biz status alamamışız.
                    console.log(`RECOVERED Invoice: ${invoice.invoiceNo} matched with Remote UUID: ${match.UUID}`);

                    await prisma.$transaction([
                        prisma.externalRequest.update({
                            where: { id: req.id },
                            data: {
                                status: 'SUCCESS',
                                responsePayload: match,
                                updatedAt: new Date()
                            }
                        }),
                        prisma.salesInvoice.update({
                            where: { id: invoice.id },
                            data: {
                                isFormal: true,
                                formalStatus: 'SENT',
                                formalUuid: match.UUID || match.Id || match.InvoiceNumber
                            }
                        })
                    ]);
                    stats.recovered++;
                } else {
                    // HALA BULUNAMADI: Belki gerçekten gitmedi.
                    // Eğer çok eski ise (> 2 saat) FAILED yapabiliriz.
                    // Şimdilik PENDING bırakıyoruz veya bir sayaç (retry count) artırıyoruz.
                    // Sistemin sonsuza kadar pending kalmaması için 24 saat kuralı koyduk zaten.
                    console.log(`STILL PENDING: Invoice ${invoice.invoiceNo} not found in remote.`);
                    stats.skipped++;
                }

                stats.processed++;

            } catch (err: any) {
                console.error(`Error processing req ${req.id}:`, err);
                stats.failed++;
            }
        }

        return NextResponse.json({ success: true, stats });

    } catch (error: any) {
        console.error("Reconciliation Job Failed:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
