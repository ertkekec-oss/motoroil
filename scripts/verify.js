const fs = require('fs');

const files = [
    'src/app/(app)/admin/security/page.tsx',
    'src/app/(app)/admin/logs/page.tsx'
];

for(const file of files) {
    if(!fs.existsSync(file)) continue;
    let code = fs.readFileSync(file, 'utf-8');

    if (!code.includes('EnterprisePageShell')) {
        code = code.replace(/import {([^}]*)} from ['"]lucide-react['"];/, 'import { $1 } from "lucide-react";\nimport { EnterprisePageShell } from "@/components/ui/enterprise";');
    }

    // Usually they have some <div className="bg-slate-50 or min-h-screen
    code = code.replace(/<div className="[^"]*(bg-slate-50|p-4 sm:p-6)[^"]*">\s*(?:<div className="[^"]*(max-w-|bg-white)[^"]*">)?/, '<EnterprisePageShell title="Yönetim" description="Ayrıntıları yapılandırın.">\n        <div className="animate-in fade-in duration-300">');
    
    code = code.replace(/<\/div>\s*<\/div>\s*\)\s*;\s*}\s*$/, '</EnterprisePageShell>\n    );\n}\n');
    code = code.replace(/<\/div>\s*<\/div>\s*<\/div>\s*\)\s*;\s*}\s*$/, '</div>\n</EnterprisePageShell>\n    );\n}\n');

    fs.writeFileSync(file, code);
    console.log('Fixed wrapper on', file);
}
