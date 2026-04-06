const fs = require('fs');

function upgradeLedgers() {
    let code = fs.readFileSync('src/app/(app)/admin/ops/ledgers/page.tsx', 'utf8');
    if (code.includes('EnterprisePageShell')) return;
    
    code = code.replace(
        "import { Search, Filter, HardDrive, ReceiptText, Banknote, ShieldAlert, BadgeInfo } from 'lucide-react';",
        "import { Search, Filter, HardDrive, ReceiptText, Banknote, ShieldAlert, BadgeInfo } from 'lucide-react';\nimport { EnterprisePageShell } from '@/components/ui/enterprise';"
    );
    
    code = code.replace(
        /<div className="min-h-screen bg-slate-50 dark:bg-\[#0f172a\] text-slate-900 dark:text-slate-100 p-4 font-sans focus:outline-none w-full pb-16">/,
        `<div className="w-full">`
    );
    
    code = code.replace(
        /<div className="max-w-\[1600px\] mx-auto space-y-6 animate-in fade-in duration-300">/,
        `<EnterprisePageShell
            title="Sistem Defteri (Finans & Ledger Denetimi)"
            description="Ledger, Komisyon ve Escrow Payout Matrisi"
        >
            <div className="space-y-6">`
    );
    
    const headerRegex = /<div className="border-b border-slate-200 dark:border-white\/10 pb-6">[\s\S]*?<\/div>/;
    code = code.replace(headerRegex, "");

    code = code.replace(
        /<\/div>\s*<\/div>\s*\)\;/m,
        '</div>\n            </EnterprisePageShell>\n        </div>\n    );'
    );
    
    fs.writeFileSync('src/app/(app)/admin/ops/ledgers/page.tsx', code);
    console.log("Upgraded ops/ledgers");
}

function upgradePlatformFinance() {
    const path = 'src/app/(app)/admin/platform-finance/page.tsx';
    if (!fs.existsSync(path)) return;
    let code = fs.readFileSync(path, 'utf8');
    if (code.includes('EnterprisePageShell')) return;
    
    code = code.replace(
        "import { CreditCard, Download, ExternalLink, LineChart, PieChart, TrendingUp, Wallet, ArrowUpRight, ArrowDownRight, Search, Activity, RefreshCw } from 'lucide-react';",
        "import { CreditCard, Download, ExternalLink, LineChart, PieChart, TrendingUp, Wallet, ArrowUpRight, ArrowDownRight, Search, Activity, RefreshCw } from 'lucide-react';\nimport { EnterprisePageShell, EnterpriseCard } from '@/components/ui/enterprise';"
    );
    
    code = code.replace(
        /<div className="min-h-screen bg-slate-50 font-sans pb-16">/,
        `<div className="w-full">`
    );
    
    code = code.replace(
        /<div className="max-w-\[1600px\] mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-in fade-in duration-300">/,
        `<EnterprisePageShell
            title="Tüm Finans Yönetimi (Hub)"
            description="Platformun genel finansal sağlık durumunu ve nakit akışını yönetin."
        >
            <div className="space-y-6">`
    );
    
    const headerRegex = /<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-6">[\s\S]*?<\/div>/;
    const actionsRegex = /<div className="flex items-center gap-3">([\s\S]*?)<\/div>\s*<\/div>/;
    const match = code.match(headerRegex);
    if(match) {
        const actionMatch = match[0].match(actionsRegex);
        if(actionMatch) {
             code = code.replace(
                `<EnterprisePageShell
            title="Tüm Finans Yönetimi (Hub)"
            description="Platformun genel finansal sağlık durumunu ve nakit akışını yönetin."
        >`,
                `<EnterprisePageShell
            title="Tüm Finans Yönetimi (Hub)"
            description="Platformun genel finansal sağlık durumunu ve nakit akışını yönetin."
            actions={<div className="flex items-center gap-3">${actionMatch[1]}</div>}
        >`
            );
        }
        code = code.replace(match[0], "");
    }

    code = code.replace(
        /<\/div>\s*<\/div>\s*\)\;/m,
        '</div>\n            </EnterprisePageShell>\n        </div>\n    );'
    );
    
    fs.writeFileSync(path, code);
    console.log("Upgraded platform-finance");
}

upgradeLedgers();
upgradePlatformFinance();
