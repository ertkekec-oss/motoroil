const fs = require('fs');

function upgradeDashboard() {
    let code = fs.readFileSync('src/app/(app)/admin/dashboard/page.tsx', 'utf8');
    if (code.includes('EnterprisePageShell')) return;
    
    code = code.replace(
        'import { useModal } from "@/contexts/ModalContext";',
        'import { useModal } from "@/contexts/ModalContext";\nimport { EnterprisePageShell, EnterpriseCard } from "@/components/ui/enterprise";'
    );
    
    // Replace header 
    const headerRegex = /<div className="border-b border-slate-200 dark:border-white\/10 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">([\s\S]*?)<\/div>\n\n\s*\{loading && !data &&/m;
    const headerMatch = code.match(headerRegex);

    if (headerMatch) {
        code = code.replace(
            /<div className="min-h-screen bg-slate-50 dark:bg-\[#0f172a\] text-slate-900 dark:text-slate-100 p-4 md:p-6 font-sans w-full pb-16 focus:outline-none">\s*<div className="max-w-\[1600px\] mx-auto space-y-6 animate-in fade-in duration-300">/,
            `<EnterprisePageShell
            title="Enterprise Command Center"
            description="Platform Kontrol Merkezi, Finansal Bütünlük ve Risk Telemetrisi"
            actions={
                <div className="flex bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden p-1 shrink-0">
                    <button onClick={() => setRange('today')} className={\`px-4 py-1.5 text-[11px] uppercase tracking-widest font-black rounded-lg transition-colors \${range === 'today' ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-sm' : 'bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'}\`}>Bugün</button>
                    <button onClick={() => setRange('7d')} className={\`px-4 py-1.5 text-[11px] uppercase tracking-widest font-black rounded-lg transition-colors \${range === '7d' ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-sm' : 'bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'}\`}>7 Gün</button>
                    <button onClick={() => setRange('30d')} className={\`px-4 py-1.5 text-[11px] uppercase tracking-widest font-black rounded-lg transition-colors \${range === '30d' ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-sm' : 'bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'}\`}>30 Gün</button>
                </div>
            }
        >
            <div className="space-y-6">`
        );
        code = code.replace(headerMatch[0], '{loading && !data &&'); 
    }
    
    // Replace the end tags
    code = code.replace(
        /<\/div>\s*<\/div>\s*<\/div>\s*\)\;/m,
        '</div>\n            </EnterprisePageShell>\n    );'
    );
    
    fs.writeFileSync('src/app/(app)/admin/dashboard/page.tsx', code);
    console.log("Upgraded dashboard");
}

function upgradeTenants() {
    let code = fs.readFileSync('src/app/(app)/admin/tenants/page.tsx', 'utf8');
    if (code.includes('EnterprisePageShell')) return;
    
    code = code.replace(
        "import { Users, Plus, Search, Filter, Cpu, Play, Trash2, ArrowRight, Zap, RefreshCw, Layers, ShieldAlert, BarChart3, Database, AlertCircle } from 'lucide-react';",
        "import { Users, Plus, Search, Filter, Cpu, Play, Trash2, ArrowRight, Zap, RefreshCw, Layers, ShieldAlert, BarChart3, Database, AlertCircle } from 'lucide-react';\nimport { EnterprisePageShell, EnterpriseCard } from '@/components/ui/enterprise';"
    );
    
    code = code.replace(
        /<div className="bg-slate-50 dark:bg-\[#0f172a\] min-h-screen w-full font-sans pb-16">\s*<div className="max-w-\[1600px\] mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-300">/,
        `<EnterprisePageShell
            title="Müşteri Yönetimi (Tenants)"
            description="Platformdaki tüm müşteri hesaplarını (Tenant), lisans paketlerini ve risk durumlarını yönetin."
            actions={
                <div className="flex items-center gap-3">
                    <button onClick={() => setShowAutomationPanel(!showAutomationPanel)} className={\`p-2.5 rounded-xl transition-all shadow-sm border \${showAutomationPanel ? 'bg-amber-100 border-amber-200 text-amber-700 dark:bg-amber-900/40 dark:border-amber-500/30 dark:text-amber-400' : 'bg-white border-slate-200 text-slate-500 hover:text-amber-600 hover:border-amber-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:text-amber-400 dark:hover:border-amber-500/50'}\`} title="Otomasyon & Growth Konsolu">
                        <Cpu className="w-5 h-5" />
                    </button>
                    <button onClick={() => fetchTenants(pagination.page)} className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-xl hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-sm">
                        <RefreshCw className="w-5 h-5" />
                    </button>
                    <Link href="/admin/tenants/new" className="bg-slate-900 dark:bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 dark:hover:bg-indigo-700 transition shadow-sm flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Manuel Ekle
                    </Link>
                </div>
            }
        >`
    );
    
    const headerRegex = /<!-- Header -->/; // Not using HTML comments, it's JSX comments.
    const headerBlock = /{?\/\* Header \*\/}?[\s\S]*?<div className="flex items-center gap-3">[\s\S]*?<\/div>\s*<\/div>/;
    code = code.replace(headerBlock, "");

    code = code.replace(
        /<\/div>\s*<\/div>\s*\)\;/m,
        '</EnterprisePageShell>\n    );'
    );
    
    fs.writeFileSync('src/app/(app)/admin/tenants/page.tsx', code);
    console.log("Upgraded tenants");
}

upgradeDashboard();
upgradeTenants();
