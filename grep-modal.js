const fs = require('fs');
const file = 'c:/Users/ertke/OneDrive/Masaüstü/periodya/muhasebeapp/motoroil/src/app/(app)/customers/[id]/CustomerDetailClient.tsx';
const data = fs.readFileSync(file, 'utf8');
const lines = data.split('\n');
const index = lines.findIndex(l => l.includes('Bakiye Düzeltme Modalý'));
console.log(lines.slice(index, index + 30).join('\n'));
