const fs = require('fs');
const file = 'src/app/(app)/customers/[id]/CustomerDetailClient.tsx';
const data = fs.readFileSync(file, 'utf8');
const lines = data.split('\n');
const startIndex = lines.findIndex(l => l.includes('{/* EXECUTIVE HEADER STRIP */}'));
console.log('START:', startIndex);
if (startIndex !== -1) {
    console.log(lines.slice(startIndex, startIndex + 5).join('\n'));
    console.log('...');
    // find end
    let endIndex = startIndex;
    for (let i = startIndex; i < lines.length; i++) {
        if (lines[i].includes('                            </div>')) {
            // Keep going. We need the end of the sticky header.
            // Look for         </div> that closes the header and the start of next layout.
            // Let's find "        {/* QUICK STATS & CHARTS */}" or something.
        }
        if (lines[i].includes('{/* GROUPED NAVIGATION & FILTERS */}')) {
             console.log('FOUND GROUPED NAV at', i);
             for(let j=i; j< i+150; j++) {
                 if(lines[j] && (lines[j].includes('            {/* QUICK STATS & CHARTS */}'))) {
                     console.log('FOUND END at', j);
                     break;
                 }
                 if(lines[j] && (lines[j].includes('            <div className="max-w-[1600px]') || lines[j].includes('            <div className="w-full">'))) {
                     console.log('FOUND DIV END at', j);
                 }
             }
             break;
        }
    }
}
