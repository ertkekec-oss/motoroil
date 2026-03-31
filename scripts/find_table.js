const fs = require('fs');
const file = 'src/app/(app)/customers/[id]/CustomerDetailClient.tsx';
let data = fs.readFileSync(file, 'utf8');

const anchorStart = "<div style={{ overflowX: 'auto' }}>";

const lines = data.split('\n');
let tStart = -1;
let tEnd = -1;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("filteredHistory.length === 0 ? (")) {
        for (let j = i; j >= Math.max(0, i - 30); j--) {
            if (lines[j].includes(anchorStart)) {
                tStart = j;
                break;
            }
        }
        for (let j = i; j < lines.length; j++) {
            if (lines[j].includes("</table>")) {
                tEnd = j + 2; 
                break;
            }
        }
        break;
    }
}

if (tStart === -1 || tEnd === -1) {
    console.log('Not found');
    process.exit(1);
}

console.log('Found table from', tStart, 'to', tEnd);
