
const fs = require('fs');
const content = fs.readFileSync('src/app/(app)/settings/page.tsx', 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
    if (line.includes('.map(')) {
        console.log(`Line ${index + 1}: ${line.trim()}`);
    }
});
