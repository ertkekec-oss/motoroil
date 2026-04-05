const { PDFParse } = require('pdf-parse');
async function t() {
  try {
    const parser = new PDFParse({ data: new Uint8Array(10) }); // Invalid PDF, will throw
    await parser.getText();
  } catch (e) {
    if (e.message.includes('Invalid PDF structure')) {
      console.log('SUCCESS: Module is properly imported and throwing expected valid error.');
    } else {
      console.log('caught:', e.message);
    }
  }
}
t();
