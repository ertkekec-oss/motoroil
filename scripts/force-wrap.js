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
    
    // Safety check: is it already converted?
    if (code.includes('<EnterprisePageShell')) continue;

    // First replace the import
    if (!code.includes('EnterprisePageShell')) {
        code = code.replace(/import {([^}]*)} from ['"]lucide-react['"];/, 'import { $1 } from "lucide-react";\nimport { EnterprisePageShell } from "@/components/ui/enterprise";');
    }

    // Now isolate the wrapper div.
    // Notice that some pages have <div className="bg-slate-50... 
    // And then <div className="max-w-[1600px]...
    // Let's replace those two exact instances.
    code = code.replace(/<div className="[^"]*(bg-slate-50|min-h-screen)[^"]*">\s*<div className="[^"]*max-w-\[1600px\][^"]*">/, '<EnterprisePageShell\n        title="Yönetim Paneli"\n        description="Sistem detaylarını yapılandırın."\n    >\n        <div className="animate-in fade-in duration-300">');
    
    // Now replace the end closing tags
    // We just need to replace the last two </div> with </EnterprisePageShell>
    // This is safe to do with a regex at the end of the file.
    code = code.replace(/<\/div>\s*<\/div>\s*\)\s*;\s*}\s*$/, '</EnterprisePageShell>\n    );\n}\n');
    // If there were three divs...
    code = code.replace(/<\/div>\s*<\/EnterprisePageShell>/, '</EnterprisePageShell>');

    fs.writeFileSync(file, code);
    console.log('Fixed wrapper on', file);
}
