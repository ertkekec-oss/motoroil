const fs = require('fs');
let code = fs.readFileSync('src/app/(app)/settings/page.tsx', 'utf8');

// Find the sharedProps block
const startIdx = code.indexOf('const sharedProps: any = {');
const endIdx = code.indexOf('};', startIdx) + 2;

if (startIdx > -1) {
    const propsBlock = code.slice(startIdx, endIdx);
    // Remove it from its current bad location
    code = code.slice(0, startIdx) + code.slice(endIdx);

    // Find the main return HTML
    const divIdx = code.indexOf('<div className="flex h-screen');
    const actualReturnIdx = code.lastIndexOf('return (', divIdx);

    const newCode = code.slice(0, actualReturnIdx) + propsBlock + '\n\n        ' + code.slice(actualReturnIdx);
    fs.writeFileSync('src/app/(app)/settings/page.tsx', newCode);
    console.log('Moved sharedProps successfully!');
} else {
    console.log('sharedProps not found!');
}
