import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { putObject } from '@/services/storage/objectStorage';
import { v4 as uuidv4 } from 'uuid';

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

        if (!paymentPlan || paymentPlan.installments.length === 0) {
            // No plan? Generate a single summary senet
            const page = pdfDoc.addPage([595.28, 841.89]); // A4
            page.drawText('PROMISSORY NOTE (SENET)', { x: 200, y: 800, size: 16, font: boldFont });
            page.drawText(`Date: ${new Date().toLocaleDateString('tr-TR')}`, { x: 50, y: 760, size: 12, font });
            page.drawText(`Company: ${tr2en(invoice.company.name)}`, { x: 50, y: 740, size: 12, font });
            page.drawText(`Customer: ${tr2en(invoice.customer.name)}`, { x: 50, y: 720, size: 12, font });
            page.drawText(`Amount: ${invoice.totalAmount} TL`, { x: 50, y: 700, size: 12, font });
            page.drawText(`Invoice No: ${tr2en(invoice.invoiceNo)}`, { x: 50, y: 680, size: 12, font });
            page.drawText(`This document serves as a promissory note for the invoice.`, { x: 50, y: 640, size: 12, font });
        } else {
            // Generate multiple pages (one per installment)
            for (const inst of paymentPlan.installments) {
                const page = pdfDoc.addPage([595.28, 841.89]);
                page.drawText('EMRE MUHARRER SENET (PROMISSORY NOTE)', { x: 140, y: 800, size: 14, font: boldFont });
                
                page.drawText(`Duzenleme Tarihi (Issue Date): ${new Date(paymentPlan.startDate).toLocaleDateString('tr-TR')}`, { x: 50, y: 750, size: 12, font });
                page.drawText(`Vade Tarihi (Due Date): ${new Date(inst.dueDate).toLocaleDateString('tr-TR')}`, { x: 50, y: 730, size: 12, font: boldFont, color: rgb(0.8, 0.1, 0.1) });
                page.drawText(`Tutar (Amount): ${inst.amount.toLocaleString('tr-TR')} TL`, { x: 50, y: 710, size: 12, font: boldFont });
                
                page.drawText(`Alici (Debtor): ${tr2en(invoice.customer.name)}`, { x: 50, y: 670, size: 12, font });
                page.drawText(`TCKN/VKN: ${invoice.customer.taxNumber || invoice.customer.identityNumber || '-'}`, { x: 50, y: 650, size: 12, font });
                page.drawText(`Adres: ${tr2en(invoice.customer.address || '-')}`, { x: 50, y: 630, size: 10, font });
                
                page.drawText(`Alacakli (Creditor): ${tr2en(invoice.company.name)}`, { x: 50, y: 590, size: 12, font: boldFont });
                
                // For PDF-lib you need multiple calls for line wraps.
                const line1 = `Isbu emre muharrer senedimin vadesinde yukarida yazili olan ${inst.amount.toLocaleString('tr-TR')} TL`;
                const line2 = `bedelini ${tr2en(invoice.company.name)}'e veya emrine odeyecegimi beyan`;
                const line3 = `ve taahhut ederim. Ihtilaf halinde Istanbul Mahkemeleri yetkilidir.`;
                page.drawText(line1, { x: 50, y: 540, size: 11, font });
                page.drawText(line2, { x: 50, y: 524, size: 11, font });
                page.drawText(line3, { x: 50, y: 508, size: 11, font });
                
                page.drawText('Borclu Imza (Debtor Signature)', { x: 350, y: 460, size: 12, font: boldFont });
                page.drawText('(OTP/Digital Signature Pending)', { x: 340, y: 440, size: 10, font, color: rgb(0.5, 0.5, 0.5) });
                
                page.drawText(`Taksit No: ${inst.installmentNo} / ${paymentPlan.installmentCount}`, { x: 50, y: 100, size: 10, font });
                page.drawText(`Fatura Ref: ${tr2en(invoice.invoiceNo)} (${invoice.id})`, { x: 50, y: 80, size: 10, font });
            }
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
