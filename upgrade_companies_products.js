const fs = require('fs');

function upgradeCompanies() {
    let code = fs.readFileSync('src/app/(app)/admin/companies/page.tsx', 'utf8');
    if (code.includes('EnterprisePageShell')) return;
    
    code = code.replace(
        'import CompanyAdminClient from "./CompanyAdminClient";',
        'import CompanyAdminClient from "./CompanyAdminClient";\nimport { EnterprisePageShell } from "@/components/ui/enterprise";'
    );
    
    code = code.replace(
        /<div className="min-h-screen bg-slate-50 dark:bg-\[#0f172a\] text-slate-900 dark:text-slate-100 p-4 md:p-6 font-sans w-full pb-16 focus:outline-none">/,
        '<div className="w-full">'
    );

    code = code.replace(
        /<div className="max-w-\[1600px\] mx-auto space-y-6 animate-in fade-in duration-300">/,
        `<EnterprisePageShell
            title="Firma Yönetimi"
            description="Platform aktörlerini, rollerini ve erişim durumlarını yönetin."
        >
            <div className="space-y-6">`
    );

    const headerMatch = code.match(/<div className="border-b border-slate-200 dark:border-white\/10 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">[\s\S]*?<\/div>\s*<\/div>/);
    if(headerMatch) {
       code = code.replace(headerMatch[0], "");
    }

    code = code.replace(
        /<\/div>\s*<\/div>\s*\)\;/m,
        '</div>\n            </EnterprisePageShell>\n        </div>\n    );'
    );
    
    fs.writeFileSync('src/app/(app)/admin/companies/page.tsx', code);
    console.log("Upgraded companies");
}

function upgradeProducts() {
    let code = fs.readFileSync('src/app/(app)/admin/products/page.tsx', 'utf8');
    if (code.includes('EnterprisePageShell')) return;
    
    code = code.replace(
        'import ProductModerationClient from "./ProductModerationClient";',
        'import ProductModerationClient from "./ProductModerationClient";\nimport { EnterprisePageShell } from "@/components/ui/enterprise";'
    );
    
    code = code.replace(
        /<div className="min-h-screen bg-slate-50 dark:bg-\[#0f172a\] text-slate-900 dark:text-slate-100 p-4 md:p-6 font-sans w-full pb-16 focus:outline-none">/,
        '<div className="w-full">'
    );

    code = code.replace(
        /<div className="max-w-\[1600px\] mx-auto space-y-6 animate-in fade-in duration-300">/,
        `<EnterprisePageShell
            title="Ürün Moderasyonu"
            description="Tedarikçiler tarafından gönderilen ürünleri inceleyin ve onaylayın."
        >
            <div className="space-y-6">`
    );

    const headerMatch = code.match(/<div className="border-b border-slate-200 dark:border-white\/10 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">[\s\S]*?<\/div>\s*<\/div>/);
    if(headerMatch) {
       code = code.replace(headerMatch[0], "");
    }

    code = code.replace(
        /<\/div>\s*<\/div>\s*\)\;/m,
        '</div>\n            </EnterprisePageShell>\n        </div>\n    );'
    );
    
    fs.writeFileSync('src/app/(app)/admin/products/page.tsx', code);
    console.log("Upgraded products");
}

upgradeCompanies();
upgradeProducts();
