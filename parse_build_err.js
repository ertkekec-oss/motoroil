const fs = require('fs');
try {
    const content = fs.readFileSync('build_err2.txt', 'utf16le');
    console.log(content.slice(Math.max(0, content.length - 2000)));
} catch (e) {
    console.log('Error reading file:', e);
}
