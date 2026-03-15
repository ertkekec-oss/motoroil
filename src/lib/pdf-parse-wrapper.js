const mod = require('pdf-parse');
const pdf = typeof mod === 'function' ? mod : (mod.PDFParse || mod.default);

if (typeof pdf !== 'function') {
  console.error("pdf-parse did not export a function. Exported keys:", Object.keys(mod));
}

module.exports = pdf;
