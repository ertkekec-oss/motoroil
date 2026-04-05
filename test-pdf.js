const fs = require('fs');
const pdf = require('pdf-parse');
async function t() {
  try {
    const buf = Buffer.alloc(10);
    await pdf(buf);
  } catch (e) {
    console.log('caught', e.message);
  }
}
t();
