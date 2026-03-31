const fs = require('fs');

const file = 'src/app/(app)/suppliers/[id]/SupplierDetailClient.tsx';
let data = fs.readFileSync(file, 'utf8');

data = data.replace(/\{item\.date\}\s*<span/g, '{item.date}</div>\n<span');

fs.writeFileSync(file, data);
console.log('Fixed item.date div end');
