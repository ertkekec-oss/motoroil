const fs = require('fs');
const file = 'src/app/(app)/customers/[id]/CustomerDetailClient.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace("fetch(`/api/assets/`${editingAsset.id}`, {", "fetch(`/api/assets/${editingAsset.id}`, {");
content = content.replace("fetch(`/api/assets/`${a.id}`, { method: 'DELETE' })", "fetch(`/api/assets/${a.id}`, { method: 'DELETE' })");

fs.writeFileSync(file, content);
console.log('Fixed syntax errors');
