import { NextResponse } from 'next/server';
import { authorize } from "@/lib/auth";
import { ActionProviderRegistry } from '@/services/marketplaces/actions/registry';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { getLabelSignedUrl } from '@/lib/s3';

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
    try {
        const auth = await authorize();
        if (!auth.authorized) {
            return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
        }
        
        const companyId = auth.user.companyId;
        if (!companyId) return NextResponse.json({ error: "Şirket hesabı bulunamadı" }, { status: 400 });

        const body = await request.json();
        const orders: { marketplace: string; id: string; shipmentPackageId: string }[] = body.orders;

        if (!Array.isArray(orders) || orders.length === 0) {
            return NextResponse.json({ error: "Geçersiz giriş" }, { status: 400 });
        }

        const mergedPdf = await PDFDocument.create();
        const helveticaFont = await mergedPdf.embedFont(StandardFonts.Helvetica);

        // Process sequentially to not overload S3 / APIGateways
        for (const order of orders) {
            const { marketplace, id: orderId, shipmentPackageId } = order;
            if (!marketplace || !orderId || !shipmentPackageId) continue;

            try {
                // 1) Get provider
                const provider = ActionProviderRegistry.getProvider(marketplace);
                
                // 2) Try fetch / generate label
                let result = await provider.executeAction({
                    companyId,
                    marketplace: marketplace as any,
                    orderId,
                    actionKey: 'PRINT_LABEL_A4',
                    idempotencyKey: `bulk_label_${marketplace}_${orderId}_${shipmentPackageId}`,
                    payload: { labelShipmentPackageId: shipmentPackageId }
                });

                // 3) If PENDING, wait a bit and retry (simple poll)
                if (result.status === 'PENDING') {
                   // Polling simplistic implementation for bulk
                   for (let p = 0; p < 4; p++) {
                      await new Promise(r => setTimeout(r, 2000));
                      result = await provider.executeAction({
                           companyId,
                           marketplace: marketplace as any,
                           orderId,
                           actionKey: 'PRINT_LABEL_A4',
                           idempotencyKey: `bulk_label_${marketplace}_${orderId}_${shipmentPackageId}`,
                           payload: { labelShipmentPackageId: shipmentPackageId }
                      });
                      if (result.status !== 'PENDING') break;
                   }
                }

                if (result.status === 'SUCCESS' && result.result?.storageKey) {
                    // Success! Fetch PDF buffer from S3
                    const url = await getLabelSignedUrl(result.result.storageKey);
                    const pdfBufferResp = await fetch(url);
                    if (pdfBufferResp.ok) {
                        const buffer = await pdfBufferResp.arrayBuffer();
                        const sourcePdf = await PDFDocument.load(buffer);
                        const pages = await mergedPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
                        pages.forEach(p => mergedPdf.addPage(p));
                        continue;
                    } else {
                        throw new Error(`S3 okuma hatası: ${pdfBufferResp.status}`);
                    }
                }

                // If FAILED or fallbackData returned
                throw new Error(result.errorMessage || "Etiket servisi reddedildi.");

            } catch (error: any) {
                // FALLBACK: Draw error page inside merged PDF
                console.error(`Bulk Label Error for ${orderId}:`, error);
                const errorPage = mergedPdf.addPage([595, 842]);
                errorPage.drawText(`ETIKET OLUSTURULAMADI`, { x: 50, y: 780, size: 24, font: helveticaFont, color: rgb(0.9, 0.1, 0.1) });
                errorPage.drawText(`Siparis No: ${orderId}`, { x: 50, y: 740, size: 16, font: helveticaFont });
                errorPage.drawText(`Platform..: ${marketplace}`, { x: 50, y: 710, size: 16, font: helveticaFont });
                errorPage.drawText(`Paket ID..: ${shipmentPackageId}`, { x: 50, y: 680, size: 16, font: helveticaFont });
                
                const errMsg = String(error?.message || "Bilinmeyen hata");
                let safeErr = errMsg.length > 500 ? errMsg.substring(0, 500) + '...' : errMsg;
                // Sanitize Turkish characters for WinAnsi encoding compatibility
                const sanitizeText = (txt: string) => txt.replace(/ğ/g, 'g').replace(/Ğ/g, 'G').replace(/ç/g, 'c').replace(/Ç/g, 'C').replace(/ş/g, 's').replace(/Ş/g, 'S').replace(/ü/g, 'u').replace(/Ü/g, 'U').replace(/ö/g, 'o').replace(/Ö/g, 'O').replace(/ı/g, 'i').replace(/İ/g, 'I');
                safeErr = sanitizeText(safeErr);
                
                errorPage.drawText(`System Error:\n${safeErr.replace(/[\n\r]+/g, ' ')}`, {
                    x: 50,
                    y: 630,
                    size: 10,
                    font: helveticaFont,
                    maxWidth: 480,
                    color: rgb(0.3, 0.3, 0.3),
                    lineHeight: 14
                });
            }
        }

        const pdfBytes = await mergedPdf.save();
        const buffer = Buffer.from(pdfBytes);
        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'inline; filename="toplu-etiketler.pdf"'
            }
        });

    } catch (error: any) {
        console.error('Bulk label critical error:', error);
        return NextResponse.json({ error: error.message || "Bilinmeyen bir hata oluştu" }, { status: 500 });
    }
}
