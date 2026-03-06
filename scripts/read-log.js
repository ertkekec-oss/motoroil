const fs = require('fs');
const out = fs.readFileSync('test-output-2.txt', 'utf16le');
console.log(out);
