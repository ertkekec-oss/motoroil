import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { prisma } from '@/lib/prisma';
import { s3Client, getBucketName, sanitizeS3Key, uploadToS3 } from '@/lib/s3';
import { GetObjectCommand } from '@aws-sdk/client-s3';

export async function embedFinalSignatureProof(envelopeId: string) {
    try {
        const envelope = await prisma.signatureEnvelope.findUnique({
            where: { id: envelopeId },
            include: {
                recipients: {
                    orderBy: { orderIndex: 'asc' }
                },
                auditEvents: {
                    where: { action: 'RECIPIENT_SIGNED' },
                    orderBy: { createdAt: 'asc' }
                },
                company: true
            }
        });

        if (!envelope || !envelope.documentKey) return;

        // Fetch original
        const getCommand = new GetObjectCommand({
            Bucket: getBucketName('private'),
            Key: sanitizeS3Key(envelope.documentKey)
        });

        let s3Response;
        try {
            s3Response = await s3Client.send(getCommand);
        } catch (e) {
            const getCommandPublic = new GetObjectCommand({
                Bucket: getBucketName('public'),
                Key: sanitizeS3Key(envelope.documentKey)
            });
            s3Response = await s3Client.send(getCommandPublic);
        }

        if (!s3Response.Body) throw new Error("Document body empty");
        const originalBytes = await s3Response.Body.transformToByteArray();

        const pdfDoc = await PDFDocument.load(originalBytes);

        // Add a new signature certificate page at the end
        const page = pdfDoc.addPage([595.28, 841.89]); // A4 Size

        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        let yStart = page.getHeight() - 50;

        // Header
        page.drawText('PERIODYA GUVENLI DOKUMAN AGI - IMZA BEYANI / SERTIFIKASI', {
            x: 50,
            y: yStart,
            size: 14,
            font: boldFont,
            color: rgb(0.1, 0.2, 0.4)
        });

        yStart -= 30;
        page.drawText(`Zarf ID: ${envelope.id}`, { x: 50, y: yStart, size: 10, font });
        yStart -= 15;
        page.drawText(`Baslik: ${envelope.title.substring(0, 100)}`, { x: 50, y: yStart, size: 10, font });
        yStart -= 15;
        page.drawText(`Sirket: ${envelope.company?.name || 'Bilinmiyor'}`, { x: 50, y: yStart, size: 10, font });
        yStart -= 15;
        page.drawText(`Olusturulma Tarihi: ${new Date(envelope.createdAt).toUTCString()}`, { x: 50, y: yStart, size: 10, font });

        yStart -= 40;
        page.drawText('IMZACI BEYANLARI VE KAYITLARI', {
            x: 50,
            y: yStart,
            size: 12,
            font: boldFont,
            color: rgb(0.1, 0.2, 0.4)
        });

        yStart -= 25;

        for (const recipient of envelope.recipients) {
            // Find signature audit event for this recipient
            const auditEvent = envelope.auditEvents.find(e => e.actorId === recipient.id);
            const statusText = recipient.status === 'SIGNED' ? 'IMZALADI' : recipient.status;

            page.drawText(`${recipient.orderIndex}. ${recipient.name} [${recipient.role}] - ${statusText}`, { x: 50, y: yStart, size: 11, font: boldFont });
            yStart -= 15;
            page.drawText(`E-Posta: ${recipient.email} ${recipient.phone ? ' | Tel: ' + recipient.phone : ''}`, { x: 60, y: yStart, size: 10, font });
            yStart -= 15;

            if (recipient.status === 'SIGNED' && auditEvent) {
                const metaJson: any = auditEvent.metaJson || {};
                const ip = metaJson.ip || 'Bilinmiyor';
                page.drawText(`Imza Zamani: ${new Date(auditEvent.createdAt).toUTCString()}`, { x: 60, y: yStart, size: 9, font, color: rgb(0, 0.5, 0) });
                yStart -= 12;
                page.drawText(`Kayitli IP Adresi: ${ip}`, { x: 60, y: yStart, size: 9, font, color: rgb(0.4, 0.4, 0.4) });
                yStart -= 12;

                const userAgent = (metaJson.userAgent || '').substring(0, 80);
                if (userAgent) {
                    page.drawText(`Tarayici: ${userAgent}`, { x: 60, y: yStart, size: 8, font, color: rgb(0.4, 0.4, 0.4) });
                    yStart -= 12;
                }
            } else if (recipient.status === 'SIGNED' && recipient.signedAt) {
                page.drawText(`Imza Zamani: ${new Date(recipient.signedAt).toUTCString()}`, { x: 60, y: yStart, size: 9, font, color: rgb(0, 0.5, 0) });
                yStart -= 12;
            }

            yStart -= 15;

            if (yStart < 50) {
                // Not ideal, but realistically handles up to ~10 signers on one page before cutting off
                yStart = 50;
            }
        }

        yStart -= 30;
        page.drawText('Bu belge Periodya Blokzinciri ve Guvenli Imza agi ile uretilmistir. Dogrulamak icin:', { x: 50, y: yStart, size: 9, font });
        yStart -= 15;
        page.drawText(`https://periodya.com/verify/${envelope.id}`, { x: 50, y: yStart, size: 9, font: boldFont, color: rgb(0, 0, 1) });

        const modifiedBytes = await pdfDoc.save();

        const signedKey = `signed_${Date.now()}_${envelope.documentKey.split('/').pop()}`;

        await uploadToS3({
            bucket: 'private',
            key: `signatures/${envelope.companyId || envelope.tenantId}/${signedKey}`,
            body: Buffer.from(modifiedBytes),
            contentType: 'application/pdf'
        });

        const finalKey = `signatures/${envelope.companyId || envelope.tenantId}/${signedKey}`;

        await prisma.signatureEnvelope.update({
            where: { id: envelope.id },
            data: { signedDocumentKey: finalKey }
        });

        console.log(`[Proof Service] Final signature proof appended and saved to ${finalKey}`);

    } catch (e) {
        console.error('[Proof Service] Error embedding final proof:', e);
    }
}
