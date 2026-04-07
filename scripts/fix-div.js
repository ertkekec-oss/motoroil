const fs = require('fs');
const files = [
    'src/app/(app)/admin/ops/orders/page.tsx',
    'src/app/(app)/admin/ops/providers/page.tsx',
    'src/app/(app)/admin/ops/shipments/page.tsx',
    'src/app/(app)/admin/payments-escrow/audit/page.tsx',
    'src/app/(app)/admin/payments-escrow/commissions/page.tsx',
    'src/app/(app)/admin/payments-escrow/policies/page.tsx',
    'src/app/(app)/admin/payments-escrow/providers/page.tsx'
];

for(const file of files) {
    if(!fs.existsSync(file)) continue;
    let code = fs.readFileSync(file, 'utf-8');
    
    // Check if the file is missing the closing div before </EnterprisePageShell>
    // Specifically looking at the end of the file
    // Example: </EnterprisePageShell>\n  );\n}
    
    if (code.match(/<\/EnterprisePageShell>\s*\)\s*;\s*}\s*$/)) {
        if (!code.match(/<\/div>\s*<\/EnterprisePageShell>/)) {
            code = code.replace(/(<\/EnterprisePageShell>\s*\)\s*;\s*}\s*$)/, '</div>\n        $1');
            fs.writeFileSync(file, code);
            console.log('Patched missing div in', file);
        } else {
             console.log('Div already exists in', file);
        }
    }
}
