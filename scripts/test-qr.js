const QRCode = require('qrcode');
const { PDFDocument } = require('pdf-lib');

async function test() {
    // Empty PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]);

    // QR
    const url = "https://periodya.com/verify/123";
    const qrDataUrl = await QRCode.toDataURL(url, {
        errorCorrectionLevel: 'H',
        margin: 1,
        color: { dark: '#000000', light: '#ffffff' }
    });

    const b64 = qrDataUrl.split(',')[1];
    const imageBytes = Buffer.from(b64, 'base64');

    const qrImage = await pdfDoc.embedPng(imageBytes);

    page.drawImage(qrImage, {
        x: 20,
        y: 20,
        width: 75,
        height: 75
    });

    const out = await pdfDoc.save();
    console.log("PDF generated, size:", out.byteLength);
}

test().catch(console.error);
