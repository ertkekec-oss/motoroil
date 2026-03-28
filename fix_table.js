const fs = require('fs');
let code = fs.readFileSync('src/app/(app)/customers/[id]/CustomerDetailClient.tsx', 'utf8');

code = code.replace(/background: 'var\(--bg-card, rgba\(255,255,255,0\.02\)\)'/g, "background: 'rgba(8,10,15, 0.4)'");
code = code.replace(/border: '1px solid var\(--border-color, rgba\(255,255,255,0\.05\)\)'/g, "border: '1px solid rgba(255,255,255,0.05)'");
code = code.replace(/background: 'var\(--bg-panel, rgba\(15, 23, 42, 0\.4\)\)'/g, "background: 'rgba(8,10,15, 0.4)'");

fs.writeFileSync('src/app/(app)/customers/[id]/CustomerDetailClient.tsx', code);
console.log("Table styles fixed");
