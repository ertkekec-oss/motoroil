const fs = require('fs');
const file = 'src/app/(app)/suppliers/[id]/SupplierDetailClient.tsx';
let data = fs.readFileSync(file, 'utf8');

data = data.replace(/\) : \(\s*\{paginatedList\.map/g, ') : paginatedList.map');
data = data.replace(/<div style=\{\{ fontWeight: '700', color: 'var\(--text-main, #e2e8f0\)', marginBottom: '4px' \}\}>\{item\.date\}\s*<span style=\{\{/g, `<div style={{ fontWeight: '700', color: 'var(--text-main, #e2e8f0)', marginBottom: '4px' }}>{item.date}</div>\n<span style={{`); 

fs.writeFileSync(file, data);
console.log('Fixed Braces');
