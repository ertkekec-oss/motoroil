const fs = require('fs');
const log = fs.readFileSync('tsc-err-utf8-4.log', 'utf8');
const regex = /import\("C:\/Users\/ertke\/OneDrive\/Masa\\u00FCst\\u00FC\/periodya\/muhasebeapp\/motoroil\/([^"]+)"\)/g;
const files = [...new Set([...log.matchAll(regex)].map(m => m[1]))];

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/(export async function [A-Z]+\(req: NextRequest, )\{ params \}: [^\)]+(\) \{)/g, '$1context: any$2\n    const params = await context.params;');
    fs.writeFileSync(file, content);
    console.log('Fixed', file);
}
