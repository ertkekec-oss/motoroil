const fs = require('fs');
const file = 'src/app/(app)/customers/[id]/CustomerDetailClient.tsx';
let data = fs.readFileSync(file, 'utf8');

data = data.replace(/\) : \(\s*\{customer/g, ') : customer');

fs.writeFileSync(file, data);
console.log('Fixed trailing braces');
