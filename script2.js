const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'src/app/(app)/customers/[id]/CustomerDetailClient.tsx');
let data = fs.readFileSync(file, 'utf8');
const lines = data.split('\n');
console.log(lines.slice(100, 150).join('\n'));
