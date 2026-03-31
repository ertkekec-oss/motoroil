const fs = require('fs');
const file = 'src/app/(app)/customers/[id]/CustomerDetailClient.tsx';
const data = fs.readFileSync(file, 'utf8');
const lines = data.split('\n');

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('fixed inset-0 z-50')) {
        console.log('Found modal at line:', i + 1);
        console.log(lines.slice(i, i + 8).join('\n'));
        console.log('---');
    }
}
