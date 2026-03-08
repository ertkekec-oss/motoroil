import { PDFDocument, rgb } from 'pdf-lib';
import QRCode from 'qrcode';
import { s3Client, getBucketName, sanitizeS3Key, uploadToS3 } from '@/lib/s3';
import { GetObjectCommand } from '@aws-sdk/client-s3';

export async function embedVerificationQRCode(envelopeId: string, documentKey: string) {
    try {
        // 1. Fetch original document from S3 (assuming it's in private bucket initially)
        const getCommand = new GetObjectCommand({
            Bucket: getBucketName('private'),
            Key: sanitizeS3Key(documentKey)
        });

        let s3Response;
        try {
            s3Response = await s3Client.send(getCommand);
        } catch (e) {
            // fallback public if it was uploaded there
            const getCommandPublic = new GetObjectCommand({
                Bucket: getBucketName('public'),
                Key: sanitizeS3Key(documentKey)
            });
            s3Response = await s3Client.send(getCommandPublic);
        }

        if (!s3Response.Body) {
            throw new Error("Could not retrieve document body for QR embedding.");
        }

        const originalPdfBytes = await s3Response.Body.transformToByteArray();

        // 2. Generate QR Code image (DataURL or Buffer)
        const verifyUrl = `https://periodya.com/verify/${envelopeId}`;
        const qrCodeDataUrl = await QRCode.toDataURL(verifyUrl, {
            errorCorrectionLevel: 'H',
            margin: 1,
            color: {
                dark: '#0f172a',
                light: '#ffffff'
            }
        });

        // 3. Load PDF and embed QR Code
        const pdfDoc = await PDFDocument.load(originalPdfBytes);

        // Convert base64 data url to Uint8Array
        const qrImageBytes = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');
        const qrImage = await pdfDoc.embedPng(qrImageBytes);

        // We will stamp the QR code on the first page, bottom left or top right
        const pages = pdfDoc.getPages();
        if (pages.length === 0) return; // No pages to stamp

        const firstPage = pages[0];
        const { width, height } = firstPage.getSize();

        // Standard QR size
        const qrDims = qrImage.scale(0.3); // Scale down
        const qrSize = 75; // 75x75 points

        // Draw the QR Code at the bottom left with a small margin
        firstPage.drawImage(qrImage, {
            x: 20,
            y: 20,
            width: qrSize,
            height: qrSize,
        });

        // Add a small text below or above the QR code
        // Load a standard font
        // Constrained layout for text
        firstPage.drawText('Periodya E-Imza', {
            x: 20,
            y: 10,
            size: 8,
            color: rgb(0.2, 0.2, 0.2)
        });

        const modifiedPdfBytes = await pdfDoc.save();

        // 4. Upload the modified PDF back to S3, replacing the original
        await uploadToS3({
            bucket: 'private',  // ensure it is saved in private
            key: documentKey,
            body: Buffer.from(modifiedPdfBytes),
            contentType: 'application/pdf',
        });

        console.log(`[QR Service] Successfully embedded QR code for envelope ${envelopeId}`);

    } catch (error) {
        console.error(`[QR Service] Failed to embed QR code for envelope ${envelopeId}`, error);
        // We do not throw to avoid breaking the envelope creation flow entirely.
        // It's a progressive enhancement.
    }
}
