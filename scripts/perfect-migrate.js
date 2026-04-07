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
    
    if (!code.includes('EnterprisePageShell')) {
        code = code.replace(/import {([^}]*)} from ['"]lucide-react['"];/, 'import { $1 } from "lucide-react";\nimport { EnterprisePageShell } from "@/components/ui/enterprise";');
    }

    // Replace the opening TWO div tags:
    // It usually matches <div className="min-h-screen bg-slate-50..."> <div className="max-w-[1600px]...">
    // Or sometimes just one outer <div className="bg-slate-50..."> and an inner <div className="...max-w-[1600px]...">
    code = code.replace(/return\s*\(\s*<div\b[^>]*>\s*<div\b[^>]*max-w-\[1600px\][^>]*>/, 
`return (
        <EnterprisePageShell
            title="Yönetim"
            description="Sistem detaylarını yapılandırın"
        >
            <div className="animate-in fade-in duration-300">`);

    // We opened ONE wrapper: <EnterprisePageShell> and ONE inner: <div>
    // We replaced TWO outer <div>s. So the structure number of tags is same!
    // But the closing tags at the bottom will be </div></div>
    // We must replace the LAST </div></div> with </div></EnterprisePageShell>
    // We can do this safely by matching the end of the file.
    let count = 0;
    // Replace the last </div> before the final ); }
    code = code.replace(/<\/div>\s*<\/div>\s*\)\s*;\s*}\s*(export\s+default[^;]+;?)?\s*$/m, '</div>\n        </EnterprisePageShell>\n    );\n}');

    fs.writeFileSync(file, code);
    console.log('Migrated', file);
}
