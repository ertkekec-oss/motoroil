import { NextResponse } from 'next/server';
import { authorize } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ActionProviderRegistry } from '@/services/marketplaces/actions/registry';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { getLabelSignedUrl } from '@/lib/s3';
import { redisConnection } from '@/lib/queue/redis';

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
        const helveticaBoldFont = await mergedPdf.embedFont(StandardFonts.HelveticaBold);

        // Process sequentially to not overload S3 / APIGateways
        for (const order of orders) {
            const { marketplace, id: orderId, shipmentPackageId } = order;
            if (!marketplace || !orderId || !shipmentPackageId) continue;

            try {
                // 0) Check if label already exists in DB (Fast Path)
                let existingPdfBuffer: Buffer | null = null;
                const existingLabel = await (prisma as any).marketplaceLabel.findUnique({
                    where: { companyId_marketplace_shipmentPackageId: { companyId, marketplace, shipmentPackageId } }
                });

                if (existingLabel?.storageKey) {
                    try {
                        const b64 = await redisConnection.get(`LABEL_CACHE:${existingLabel.storageKey}`);
                        if (b64) existingPdfBuffer = Buffer.from(b64, 'base64');
                    } catch(ex) { console.warn("Redis read error in bulk existing:", ex); }

                    if (!existingPdfBuffer) {
                        try {
                            const url = await getLabelSignedUrl(existingLabel.storageKey);
                            const pdfBufferResp = await fetch(url);
                            if (pdfBufferResp.ok) {
                                existingPdfBuffer = Buffer.from(await pdfBufferResp.arrayBuffer());
                            }
                        } catch(ex) { console.warn("S3 read error in bulk existing:", ex); }
                    }

                    if (existingPdfBuffer) {
                        const sourcePdf = await PDFDocument.load(existingPdfBuffer);
                        const pages = await mergedPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
                        pages.forEach(p => mergedPdf.addPage(p));
                        continue;
                    }
                }

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
                    let pdfBuffer: Buffer | null = null;
                    
                    // 1) Fast Path: Try retrieving from Redis cache
                    try {
                        const b64 = await redisConnection.get(`LABEL_CACHE:${result.result.storageKey}`);
                        if (b64) {
                            pdfBuffer = Buffer.from(b64, 'base64');
                        }
                    } catch(ex) { console.warn("Redis read error in bulk:", ex); }

                    // 2) S3 Fallback
                    if (!pdfBuffer) {
                        const url = await getLabelSignedUrl(result.result.storageKey);
                        const pdfBufferResp = await fetch(url);
                        if (pdfBufferResp.ok) {
                            pdfBuffer = Buffer.from(await pdfBufferResp.arrayBuffer());
                        } else {
                            throw new Error(`S3 okuma hatası: ${pdfBufferResp.status}`);
                        }
                    }
                    
                    if (pdfBuffer) {
                        const sourcePdf = await PDFDocument.load(pdfBuffer);
                        const pages = await mergedPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
                        pages.forEach(p => mergedPdf.addPage(p));
                        continue;
                    }
                }

                // If fallbackData is returned, draw natively inside the PDF
                if (result.result?.fallbackData) {
                    await drawNativePdfFallback(mergedPdf, helveticaFont, helveticaBoldFont, result.result.fallbackData, result.errorMessage || "ZPL/PDF Hatasi");
                    continue;
                }

                // If FAILED completely
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

async function drawNativePdfFallback(
    pdf: PDFDocument, 
    font: any, 
    fontBold: any, 
    fallbackData: any, 
    errorMsg: string
) {
    const page = pdf.addPage([595, 842]); // A4
    const sanitizeText = (txt: string) => txt ? txt.toString().replace(/ğ/g, 'g').replace(/Ğ/g, 'G').replace(/ç/g, 'c').replace(/Ç/g, 'C').replace(/ş/g, 's').replace(/Ş/g, 'S').replace(/ü/g, 'u').replace(/Ü/g, 'U').replace(/ö/g, 'o').replace(/Ö/g, 'O').replace(/ı/g, 'i').replace(/İ/g, 'I').replace(/[^A-Za-z0-9 .,:;\/\-\_()]/g, '') : "";

    const orderNumber = sanitizeText(fallbackData?.orderNumber || fallbackData?.id || "BILINMIYOR");
    const addressInfo = fallbackData?.shipmentAddress || fallbackData?.invoiceAddress || {};
    const fullName = sanitizeText(addressInfo.fullName || (fallbackData?.customerFirstName + " " + fallbackData?.customerLastName) || "Alici Adi Bulunamadi");
    const fullAddress = sanitizeText(addressInfo.fullAddress || [addressInfo.address1, addressInfo.address2, addressInfo.district, addressInfo.city].filter(Boolean).join(" ") || "Adres Bilgisi Yok");
    const providerName = sanitizeText(fallbackData?.cargoProviderName || "Kargo Firmasi");
    const trackingNumber = sanitizeText(fallbackData?.cargoTrackingNumber || "");
    const marketplace = sanitizeText(fallbackData?.marketplace || "Pazaryeri");

    const marginX = 40;
    let currentY = 780;

    // Header Marketplace
    page.drawText(`${marketplace} Siparisi`.toUpperCase(), { x: marginX, y: currentY, size: 12, font: fontBold, color: rgb(0.3, 0.4, 0.5) });
    currentY -= 30;

    // Title
    page.drawText(`KARGO ALICI BILGILERI`, { x: marginX, y: currentY, size: 16, font: fontBold });
    currentY -= 25;

    // Info
    page.drawText(`Siparis No : ${orderNumber}`, { x: marginX, y: currentY, size: 12, font: fontBold });
    currentY -= 20;
    page.drawText(`Ad-Soyad   : ${fullName}`, { x: marginX, y: currentY, size: 12, font: fontBold });
    currentY -= 20;

    // Word wrap address
    const wrappedAddress = [];
    let currentLine = "";
    const words = fullAddress.split(" ");
    for (const w of words) {
        if ((currentLine + w).length > 40) {
            wrappedAddress.push(currentLine);
            currentLine = w + " ";
        } else {
            currentLine += w + " ";
        }
    }
    if (currentLine) wrappedAddress.push(currentLine);

    page.drawText(`Adres      :`, { x: marginX, y: currentY, size: 12, font: fontBold });
    for (let i = 0; i < wrappedAddress.length; i++) {
        page.drawText(wrappedAddress[i], { x: marginX + 65, y: currentY - (i * 15), size: 12, font: font });
    }
    
    currentY -= (wrappedAddress.length * 15) + 30;

    // Barcode Section (Right Side)
    const rightX = 350;
    const barcodeY = 740;
    page.drawText(`KARGO BARKODU`, { x: rightX + 20, y: barcodeY + 25, size: 14, font: fontBold });
    
    if (trackingNumber) {
        try {
            const bwipUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${trackingNumber}&scale=3&includetext=false`;
            const bcResp = await fetch(bwipUrl);
            if (bcResp.ok) {
                const bcBuffer = await bcResp.arrayBuffer();
                const pngImage = await pdf.embedPng(bcBuffer);
                const pngDims = pngImage.scale(0.5);
                page.drawImage(pngImage, {
                    x: rightX,
                    y: barcodeY - 30,
                    width: Math.min(200, pngDims.width),
                    height: 40
                });
            }
        } catch(e) { console.error('barcode png embed error', e); }
        
        page.drawText(trackingNumber, { x: rightX + 20, y: barcodeY - 50, size: 14, font: fontBold });
        page.drawText(providerName, { x: rightX + 30, y: barcodeY - 70, size: 12, font: font });
    } else {
        page.drawText(`Barkod Alinamadi`, { x: rightX + 20, y: barcodeY - 20, size: 12, font: fontBold, color: rgb(0.8, 0.1, 0.1) });
    }

    // Divider
    page.drawLine({
        start: { x: marginX, y: currentY },
        end: { x: 555, y: currentY },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8)
    });
    currentY -= 30;

    // Footer Security Text
    page.drawText(`Periodya Guvenlik Agi tarafindan olusturulmustur.`, { x: marginX + 100, y: currentY, size: 10, font: fontBold });
    currentY -= 20;
    const secMsg = "DIKKAT: Paketinizi kargo gorevlisinin onunde acip kontrol ediniz. Siparisinizde istenmeyen\nbir durum olustugunu dusunuyorsaniz kargo gorevlisi ile birlikte tutanak tutarak\ngerekli aksiyonu almanizi tavsiye ederiz.";
    page.drawText(secMsg, { x: marginX + 30, y: currentY, size: 9, font: font, lineHeight: 12, color: rgb(0.4, 0.4, 0.4) });

    // Debug Error String
    const safeErr = sanitizeText(errorMsg || "").substring(0, 150);
    page.drawText(`System Log: ${safeErr}`, { x: marginX, y: 30, size: 7, font: font, color: rgb(0.7, 0.7, 0.7) });
}
