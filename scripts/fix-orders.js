const fs = require('fs');
let code = fs.readFileSync('src/app/(app)/admin/ops/orders/page.tsx', 'utf-8');

if (!code.includes('EnterprisePageShell')) {
    code = code.replace(/import {([^}]*)} from ['"]lucide-react['"];/, 'import { $1 } from "lucide-react";\nimport { EnterprisePageShell } from "@/components/ui/enterprise";');
}

const headerRegex = /<div className="min-h-screen[^>]*>\s*<div className="max-w-\[1600px\][^>]*>\s*{\/\* Header Area \*\/}\s*<div className="border-b[^>]*>\s*<div>\s*<h1[^>]*>[\s\S]*?<\/h1>\s*<p[^>]*>Global B2B & Escrow İşlemleri Merkezi<\/p>\s*<\/div>\s*<div className="flex items-center gap-2">\s*(<button[\s\S]*?<\/button>)\s*<\/div>\s*<\/div>/;

if (code.match(headerRegex)) {
    const match = code.match(headerRegex);
    code = code.replace(headerRegex, `        <EnterprisePageShell
            title="Sipariş İzleme (Ops)"
            description="Global B2B & Escrow İşlemleri Merkezi"
            actions={
                <div className="flex items-center gap-2">
                    ${match[1]}
                </div>
            }
        >
            <div className="animate-in fade-in duration-300 space-y-6">`);
            
    code = code.replace(/<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*\)\s*;\s*}\s*$/ms, '                </div>\n            </div>\n        </EnterprisePageShell>\n    );\n}\n');
    fs.writeFileSync('src/app/(app)/admin/ops/orders/page.tsx', code);
    console.log('Fixed ops/orders/page.tsx');
} else {
    console.log('Match failed');
}
