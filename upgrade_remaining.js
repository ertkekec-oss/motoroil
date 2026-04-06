const fs = require('fs');

function wrapWithEnterpriseShell(filePath, title, description, actionsHtml = '') {
    if (!fs.existsSync(filePath)) return;
    let code = fs.readFileSync(filePath, 'utf8');
    if (code.includes('EnterprisePageShell')) return;
    
    // Import Enterprise components
    let lastImportIndex = code.lastIndexOf('import ');
    if (lastImportIndex !== -1) {
        let endOfLine = code.indexOf('\n', lastImportIndex);
        code = code.slice(0, endOfLine) + '\nimport { EnterprisePageShell } from "@/components/ui/enterprise";' + code.slice(endOfLine);
    } else {
        code = 'import { EnterprisePageShell } from "@/components/ui/enterprise";\n' + code;
    }

    // Replace outer div
    code = code.replace(
        /<div className="min-h-screen bg-slate-50 dark:bg-\[#0f172a\] text-slate-900 dark:text-slate-100 p-4 md:p-6 font-sans w-full pb-16 focus:outline-none">/g,
        '<div className="w-full">'
    );
    // sometimes it's p-4 sans font... handle variations
    code = code.replace(
        /<div className="min-h-screen bg-slate-50 dark:bg-\[#0f172a\] text-slate-900 dark:text-slate-100 p-4 font-sans focus:outline-none w-full pb-16">/g,
        '<div className="w-full">'
    );
    
    // Find the max-w container
    const maxWRegex = /<div className="max-w-\[1600px\] mx-auto space-y-6 animate-in fade-in duration-300( overflow-x-auto)?( lg:px-8)?">/;
    const contentStartMatch = code.match(maxWRegex);
    
    if (contentStartMatch) {
         code = code.replace(
            contentStartMatch[0],
            `<EnterprisePageShell
                title="${title}"
                description="${description}"
                ${actionsHtml ? `actions={${actionsHtml}}` : ''}
            >
                <div className="space-y-6">`
        );
        
        // Remove old header block
        const headerRegex = /<div className="border-b border-slate-200 dark:border-white\/10 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">[\s\S]*?<\/div>\s*<\/div>/;
        const fallbackRegex = /<div className="border-b border-slate-200 dark:border-white\/10 pb-6">[\s\S]*?<\/div>/;
        code = code.replace(headerRegex, "").replace(fallbackRegex, "");
        
        // replace end tags
        code = code.replace(
            /<\/div>\s*<\/div>\s*\)\;/m,
            '</div>\n            </EnterprisePageShell>\n        </div>\n    );'
        );
    }

    fs.writeFileSync(filePath, code);
    console.log("Upgraded", filePath);
}

wrapWithEnterpriseShell(
    'src/app/(app)/admin/payments-escrow/audit/page.tsx',
    'Escrow Finansal Denetim',
    'Tüm B2B ağında gerçekleşen ve escrow havuzunda bekleyen ödemeleri denetleyin.'
);

wrapWithEnterpriseShell(
    'src/app/(app)/admin/payments-escrow/commissions/page.tsx',
    'Platform Komisyon Gelirleri',
    'Tüm platform operasyonlarından kesilen komisyonları ve gerçekleşen hasılatları inceleyin.'
);

wrapWithEnterpriseShell(
    'src/app/(app)/admin/payments-escrow/policies/page.tsx',
    'Escrow Güvenlik Politikaları',
    'Tolerans süreleri, blokaj kuralları ve anlaşmazlık durumlarındaki para tutma (hold) politikalarını yönetin.'
);

wrapWithEnterpriseShell(
    'src/app/(app)/admin/payments-escrow/providers/page.tsx',
    'Ödeme Sağlayıcıları ve Dağıtım',
    'Iyzico, PayTR vb. ödeme geçitlerindeki (gateways) cüzdan bakiyelerini, hesapları ve sub-merchant IBAN dağıtımlarını izleyin.'
);

wrapWithEnterpriseShell(
    'src/app/(app)/admin/disputes/page.tsx',
    'Anlaşmazlık Yargı Merkezi',
    'Alıcı ve satıcı arasındaki B2B ticaret itirazlarını, delillerini inceleyip çözüme kavuşturun.'
);

wrapWithEnterpriseShell(
    'src/app/(app)/admin/audit-logs/page.tsx',
    'Sistem Denetim Günlükleri (Audit Log)',
    'Sistemdeki tüm yönetici ve kullanıcı aktivitelerini izleyin.'
);

wrapWithEnterpriseShell(
    'src/app/(app)/admin/security/page.tsx',
    'Güvenlik ve İzin Yönetimi',
    'Platform güvenlik ayarlarını, RBAC politikalarını ve erişim kısıtlamalarını yönetin.'
);

wrapWithEnterpriseShell(
    'src/app/(app)/admin/logs/page.tsx',
    'Hata ve Sistem Logları',
    'Kritik sistem altyapısı logları, entegrasyon hataları ve webhooks yanıtlarını izleyin.'
);

