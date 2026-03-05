import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';

export async function applyWatermark(pdfBuffer: Buffer, watermarkText: string): Promise<Buffer> {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();

    // Default system font
    const font = await pdfDoc.embedStandardFont(StandardFonts.HelveticaBold);

    pages.forEach(page => {
        const { width, height } = page.getSize();

        // Simple diagonal watermark
        page.drawText(watermarkText, {
            x: 50,
            y: height / 2 - 100,
            size: 60,
            font: font,
            color: rgb(0.5, 0.5, 0.5),
            opacity: 0.2, // Subtle watermark
            rotate: degrees(45),
        });
    });

    const uint8Array = await pdfDoc.save();
    return Buffer.from(uint8Array);
}
