const fs = require('fs');
let content = fs.readFileSync('src/app/(app)/payment/page.tsx', 'utf8');
content = content.replace(/\\\$\{/g, '${');
fs.writeFileSync('src/app/(app)/payment/page.tsx', content, 'utf8');
console.log('Fixed dollar signs successfully');
