const fs = require('fs');
const glob = require('glob');

const paths = [
    'src/app/(app)/admin/audit-logs/page.tsx',
    'src/app/(app)/admin/companies/page.tsx',
    'src/app/(app)/admin/disputes/page.tsx',
    'src/app/(app)/admin/ops/ledgers/page.tsx',
    'src/app/(app)/admin/payments-escrow/audit/page.tsx',
    'src/app/(app)/admin/payments-escrow/commissions/page.tsx',
    'src/app/(app)/admin/payments-escrow/policies/page.tsx',
    'src/app/(app)/admin/payments-escrow/providers/page.tsx',
    'src/app/(app)/admin/products/page.tsx',
    'src/app/(app)/admin/security/page.tsx',
    'src/app/(app)/admin/system/doctor/page.tsx',
    'src/app/(app)/admin/tenants/page.tsx'
];

let count = 0;

for (const path of paths) {
    if (!fs.existsSync(path)) continue;
    let code = fs.readFileSync(path, 'utf-8');

    // Make LF line endings standard for script logic
    code = code.replace(/\r\n/g, '\n');

    // Ensure EnterprisePageShell is imported
    if (!code.includes('EnterprisePageShell') && !code.includes('@/components/ui/enterprise')) {
        code = code.replace(/import .*?lucide-react.*?;/, match => match + '\nimport { EnterprisePageShell } from "@/components/ui/enterprise";');
    } else if (!code.includes('EnterprisePageShell')) {
        code = code.replace(/import {([^}]*)} from ['"]@\/components\/ui\/enterprise['"];/, 'import { EnterprisePageShell, $1 } from "@/components/ui/enterprise";');
    }

    // Now logic to replace the standard header
    // Some headers have a subtitle, some have buttons.
    // So we match from <div className="bg-slate-50... down to </p> or </h1>
    
    // We can do a manual replacement if it's too complex, but let's try a regex for the <div> wrapper first
    const regexOuter = /<div className="bg-slate-50[^>]*>\s*<div className="max-w-\[1600px\][^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>\s*\)\s*;\s*}\s*$/;
    
    // Actually, it's safer to just replace the header with the EnterprisePageShell component manually in the codebase later if this regex is too wild.
    // Let's try to just do the outer replacement.
}

console.log('Processed ' + count);
