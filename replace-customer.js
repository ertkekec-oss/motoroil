const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'src/app/(app)/customers/[id]/CustomerDetailClient.tsx');

let data = fs.readFileSync(file, 'utf8');
const lines = data.split('\n');

const startIndex = lines.findIndex(l => l.includes('{/* --- CUSTOMER COMMAND CENTER (STICKY) --- */}'));
let endIndex = -1;
for (let i = startIndex + 1; i < lines.length; i++) {
    if (lines[i].includes('                {/* CONTENT AREA */}')) {
        endIndex = i + 1; 
        break;
    }
}

console.log('Start Index:', startIndex, 'End Index:', endIndex);
