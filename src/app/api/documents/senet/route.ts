import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { putObject } from '@/services/storage/objectStorage';
import { v4 as uuidv4 } from 'uuid';
import { redisConnection } from '@/lib/queue/redis';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const session: any = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const searchParams = req.nextUrl.searchParams;
        const action = searchParams.get('action');
        const invoiceId = searchParams.get('invoiceId');

        if (!invoiceId) return NextResponse.json({ error: 'invoiceId required' }, { status: 400 });

        const invoice = await prisma.salesInvoice.findUnique({
            where: { id: invoiceId },
            include: { customer: true, company: true }
        });

        if (!invoice) return NextResponse.json({ error: 'Fatura bulunamadı' }, { status: 404 });

        // Find associated PaymentPlan
        const paymentPlan = await prisma.paymentPlan.findFirst({
            where: {
                description: invoice.id,
                companyId: invoice.companyId
            },
            include: { installments: { orderBy: { installmentNo: 'asc' } } }
        });

        const tr2en = (text: string) => {
            if (!text) return '';
            return text.replace(/Ğ/g, 'G').replace(/ğ/g, 'g')
                       .replace(/Ü/g, 'U').replace(/ü/g, 'u')
                       .replace(/Ş/g, 'S').replace(/ş/g, 's')
                       .replace(/İ/g, 'I').replace(/ı/g, 'i')
                       .replace(/Ö/g, 'O').replace(/ö/g, 'o')
                       .replace(/Ç/g, 'C').replace(/ç/g, 'c');
        };

        // 1. Generate the PDF
        const pdfDoc = await PDFDocument.create();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        let installmentsToPrint = [];
        if (!paymentPlan || paymentPlan.installments.length === 0) {
            installmentsToPrint = [{
                amount: Number(invoice.totalAmount),
                dueDate: invoice.dueDate || new Date(),
                installmentNo: 1
            }];
        } else {
            installmentsToPrint = paymentPlan.installments;
        }

        const totalInstallments = installmentsToPrint.length;
        const startDateString = paymentPlan ? new Date(paymentPlan.startDate).toLocaleDateString('tr-TR') : new Date().toLocaleDateString('tr-TR');

        for (const inst of installmentsToPrint) {
            const page = pdfDoc.addPage([595.28, 841.89]);
            const w = page.getWidth();
            const h = page.getHeight();
            
            // Outer Border
            page.drawRectangle({ x: 30, y: 30, width: w - 60, height: h - 60, borderColor: rgb(0,0,0), borderWidth: 2 });
            page.drawRectangle({ x: 35, y: 35, width: w - 70, height: h - 70, borderColor: rgb(0,0,0), borderWidth: 0.5 });
            
            // Header: EMRE MUHARRER SENET (Centered)
            const title = "EMRE MUHARRER SENET";
            const titleWidth = boldFont.widthOfTextAtSize(title, 20);
            page.drawText(title, { x: (w - titleWidth) / 2, y: h - 80, size: 20, font: boldFont });
            
            // Amount Box (Top Right)
            const amtStr = `# ${Number(inst.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL #`;
            const amtBoxW = 180;
            const amtBoxH = 50;
            const amtBoxX = w - 40 - amtBoxW;
            const amtBoxY = h - 160;
            
            page.drawRectangle({ x: amtBoxX, y: amtBoxY, width: amtBoxW, height: amtBoxH, borderColor: rgb(0,0,0), borderWidth: 1, color: rgb(0.97,0.97,0.97) });
            page.drawText("TUTAR:", { x: amtBoxX + 15, y: amtBoxY + 30, size: 10, font: boldFont });
            page.drawText(amtStr, { x: amtBoxX + 15, y: amtBoxY + 12, size: 14, font: boldFont });
            
            // Dates (Top Left)
            page.drawText("Duzenleme Tarihi:", { x: 50, y: amtBoxY + 30, size: 10, font: boldFont });
            page.drawText(startDateString, { x: 155, y: amtBoxY + 30, size: 10, font });
            
            page.drawText("Vade Tarihi:", { x: 50, y: amtBoxY + 12, size: 10, font: boldFont });
            page.drawText(new Date(inst.dueDate).toLocaleDateString('tr-TR'), { x: 155, y: amtBoxY + 12, size: 10, font: boldFont, color: rgb(0.8, 0, 0) });
            
            // No / Ref
            const refNo = `No: ${inst.installmentNo}/${totalInstallments}   -   Islem Ref: ${tr2en(invoice.invoiceNo)}`;
            page.drawText(refNo, { x: 50, y: amtBoxY - 25, size: 10, font: boldFont });

            // Legal Text (Center)
            const textY = amtBoxY - 70;
            const legalText = `Isbu emre muharrer senedimin vadesinde yukarida yazili olan ${Number(inst.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL bedelini,\n${tr2en(invoice.company.name)} sirketine veya emrine havalesine,\nkayitsiz sartsiz ve nakden odeyecegimi beyan ve taahhut ederim.\n\nBedeli malen/nakden ahzolunmustur. Ihtilaf vukuunda Istanbul Mahkemeleri ve\nIcra Dairelerinin yetkili oldugunu pesinen kabul eylerim.`;
            page.drawText(legalText, { x: 50, y: textY, size: 11, font, lineHeight: 18 });
            
            // Info boxes: ALACAKLI & BORCLU
            const boxY = textY - 140;
            const boxWidth = w/2 - 60;
            const boxHeight = 130;
            
            // BORCLU BOX
            page.drawRectangle({ x: 50, y: boxY - boxHeight + 20, width: boxWidth, height: boxHeight, borderColor: rgb(0.5,0.5,0.5), borderWidth: 1 });
            page.drawRectangle({ x: 50, y: boxY, width: boxWidth, height: 20, color: rgb(0.9,0.9,0.9), borderColor: rgb(0.5,0.5,0.5), borderWidth: 1 });
            page.drawText("ODECEYEK OLAN (BORCLU)", { x: 55, y: boxY + 6, size: 10, font: boldFont });
            
            page.drawText(tr2en(invoice.customer.name), { x: 55, y: boxY - 20, size: 10, font: boldFont });
            page.drawText(`VKN/TCKN: ${invoice.customer.taxNumber || invoice.customer.identityNumber || 'Belirtilmemis'}`, { x: 55, y: boxY - 40, size: 10, font });
            
            // Safe wrap address text
            const addr = tr2en(invoice.customer.address || 'Adres bilgisi bulunmuyor.');
            const maxLen = 35;
            if (addr.length > maxLen) {
                page.drawText("Adres: " + addr.substring(0, maxLen), { x: 55, y: boxY - 60, size: 9, font });
                page.drawText(addr.substring(maxLen, maxLen * 2), { x: 55, y: boxY - 72, size: 9, font });
                page.drawText(addr.substring(maxLen * 2, maxLen * 3), { x: 55, y: boxY - 84, size: 9, font });
            } else {
                page.drawText("Adres: " + addr, { x: 55, y: boxY - 60, size: 9, font });
            }
            page.drawText(`Tel: ${invoice.customer.phone || '-'}`, { x: 55, y: boxY - 100, size: 9, font });

            // KEFIL BOX
            const kefilX = w/2 + 10;
            page.drawRectangle({ x: kefilX, y: boxY - boxHeight + 20, width: boxWidth, height: boxHeight, borderColor: rgb(0.5,0.5,0.5), borderWidth: 1 });
            page.drawRectangle({ x: kefilX, y: boxY, width: boxWidth, height: 20, color: rgb(0.9,0.9,0.9), borderColor: rgb(0.5,0.5,0.5), borderWidth: 1 });
            page.drawText("KEFIL (AVAL)", { x: kefilX + 5, y: boxY + 6, size: 10, font: boldFont });
            
            page.drawText("Ad Soyad: ___________________________", { x: kefilX + 5, y: boxY - 20, size: 10, font });
            page.drawText("TCKN:        ___________________________", { x: kefilX + 5, y: boxY - 40, size: 10, font });
            page.drawText("Adres:       ___________________________", { x: kefilX + 5, y: boxY - 60, size: 10, font });
            page.drawText("                 ___________________________", { x: kefilX + 5, y: boxY - 80, size: 10, font });
            page.drawText("Tel:            ___________________________", { x: kefilX + 5, y: boxY - 100, size: 10, font });

            // Signatures
            const sigY = boxY - boxHeight - 20;
            
            // BORÇLU İMZA
            page.drawText("BORCLU IMZASI", { x: 90, y: sigY, size: 11, font: boldFont });
            page.drawText("(Secure Digital OTP / Wet Signature)", { x: 60, y: sigY - 15, size: 8, font, color: rgb(0.5,0.5,0.5) });
            
            // KEFİL İMZA
            page.drawText("KEFIL IMZASI", { x: kefilX + 50, y: sigY, size: 11, font: boldFont });
            page.drawText("(Secure Digital OTP / Wet Signature)", { x: kefilX + 20, y: sigY - 15, size: 8, font, color: rgb(0.5,0.5,0.5) });
            
            // Footer Warning
            page.drawText("Isbu belge Periodya Guvenli Agi tarafindan uretilmis olup 5549 Sayili Kanun kapsaminda dijital iz tasimaktadir.", { x: 50, y: 50, size: 8, font, color: rgb(0.4, 0.4, 0.4) });
            page.drawText(`Document ID: ${invoice.id} * SysDate: ${new Date().toISOString()}`, { x: 50, y: 40, size: 8, font, color: rgb(0.4, 0.4, 0.4) });
        }

        const pdfBytes = await pdfDoc.save();

        if (action === 'get-pdf') {
            return new NextResponse(pdfBytes, {
                status: 200,
                headers: {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': `inline; filename="Senet-${invoice.invoiceNo}.pdf"`,
                    'Cache-Control': 'no-store'
                }
            });
        }

        if (action === 'send-otp') {
            // Upload to S3
            const objectKey = `signatures/${session.tenantId}/senet-${uuidv4()}.pdf`;
            
            try {
                if (process.env.STORAGE_BUCKET) {
                    await putObject(objectKey, Buffer.from(pdfBytes), 'application/pdf');
                } else {
                    console.warn('STORAGE_BUCKET is not set. Skipping physical S3 upload for local development.');
                }
            } catch (s3Err) {
                console.error("S3 Upload failed, proceeding without physical document for now:", s3Err);
            }

            // Fallback: Write backup to Redis (ttl 7 days) just in case S3 fails or is not configured
            try {
                await redisConnection.set(`DOC_CACHE:${objectKey}`, Buffer.from(pdfBytes).toString('base64'), 'EX', 7 * 24 * 3600);
            } catch (redisErr) {
                console.warn("[Redis Backup] Failed to cache senet in Redis:", redisErr);
            }

            // Send to envelope endpoint (create envelope)
            const recipients = [];
            if (invoice.customer.email) {
                recipients.push({ name: invoice.customer.name, email: invoice.customer.email, phone: invoice.customer.phone });
            } else if (invoice.customer.phone) {
                recipients.push({ name: invoice.customer.name, email: `no-reply-${Date.now()}@periodya.com`, phone: invoice.customer.phone });
            } else {
                return NextResponse.json({ error: 'Müşterinin e-posta veya telefon bilgisi eksik, OTP gönderilemiyor.' }, { status: 400 });
            }

            // Create signature envelope directly
            const reqHost = req.headers.get('host') || 'localhost:3000';
            const protocol = reqHost.includes('localhost') ? 'http' : 'https';
            
            const envelopeRes = await fetch(`${protocol}://${reqHost}/api/signatures/envelopes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': req.headers.get('cookie') || '' 
                },
                body: JSON.stringify({
                    title: `Senet Onayı: ${invoice.invoiceNo}`,
                    documentKey: objectKey,
                    documentFileName: `Senet-${invoice.invoiceNo}.pdf`,
                    category: 'AGREEMENT', // Changed from SENET to match valid Prisma Enum (DocumentCategory)
                    otpRequired: true,
                    recipients: recipients
                })
            });

            const envData = await envelopeRes.json();
            if (envData.success) {
                return NextResponse.json({ success: true, envelope: envData.envelope });
            } else {
                return NextResponse.json({ error: envData.error || 'İmza zarfı oluşturulamadı.' }, { status: 400 });
            }
        }

        return NextResponse.json({ error: 'Bilinmeyen işlem' }, { status: 400 });

    } catch (e: any) {
        console.error('Senet Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
