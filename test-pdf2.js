const { PDFParse } = require('pdf-parse');
async function t() {
  try {
    const parser = new PDFParse({ data: new Uint8Array(10) }); // Invalid PDF, will throw but shouldn't be "not a function"
    await parser.getText();
  } catch (e) {
    console.log('caught correctly:', e.message);
  }
}
t();
