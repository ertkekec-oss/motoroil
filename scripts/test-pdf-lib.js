const fs = require('fs');
const { PDFDocument, rgb } = require('pdf-lib');

async function testPdfLib() {
    try {
        const mergedPdf = await PDFDocument.create();
        
        // Let's create an error page 
        const errorPage = mergedPdf.addPage([595, 842]); // A4 size
        errorPage.drawText('Fallback Error Page - Label Failed', {
            x: 50,
            y: 800,
            size: 20,
            color: rgb(1, 0, 0)
        });
        errorPage.drawText('Order: 12345, Tracking No: 1Z9999999999', {
            x: 50,
            y: 770,
            size: 15
        });

        // Save
        const pdfBytes = await mergedPdf.save();
        fs.writeFileSync('scripts/merged.pdf', pdfBytes);
        console.log('Successfully created merged.pdf');
    } catch (e) {
        console.error(e);
    }
}
testPdfLib();
