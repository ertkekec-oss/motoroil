const fs = require('fs');
const file = 'src/app/(app)/customers/[id]/CustomerDetailClient.tsx';
let data = fs.readFileSync(file, 'utf8');

data = data.replace(
    /<div style=\{\{\s*background: 'var\(--bg-panel, rgba\(15, 23, 42, 0\.4\)\)',\s*borderRadius: '20px',\s*border: '1px solid rgba\(255,255,255,0\.05\)',\s*overflow: 'hidden',\s*boxShadow: '0 4px 24px rgba\(0,0,0,0\.2\)'\s*\}\}>/,
    '<div className="w-full">'
);

fs.writeFileSync(file, data);
console.log('Removed massive background wrapper');
