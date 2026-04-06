const fs = require('fs');

let code = fs.readFileSync('src/app/(app)/admin/website/page.tsx', 'utf8');

// Add imports
if (!code.includes('EnterprisePageShell')) {
    code = code.replace(
        "import { useModal } from '@/contexts/ModalContext';",
        "import { useModal } from '@/contexts/ModalContext';\nimport { EnterprisePageShell, EnterpriseCard, EnterpriseButton, EnterpriseSectionHeader } from '@/components/ui/enterprise';\nimport { LayoutGrid, Search, PenTool, LayoutDashboard, Settings2, Webhook, Brush, Plus, Zap, Copy, PlusCircle } from 'lucide-react';"
    );
}

// Replace outer wrapper
const outerWrapperSearch = `<div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Website Yönetimi (CMS)</h1>
                    <p className="text-sm text-slate-500">Landing page ve kurumsal sayfaları dinamik olarak yönetin.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => activeTab === 'general' ? saveSettings() : savePage()}
                        disabled={saving}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50 shadow-sm shadow-blue-200"
                    >
                        {saving ? 'KAYDEDİLİYOR...' : 'DEĞİŞİKLİKLERİ KAYDET'}
                    </button>
                    <a href="/" target="_blank" className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-200 transition text-sm font-bold flex items-center">
                        Önizle ↗
                    </a>
                </div>
            </div>`;

const outerWrapperReplace = `<EnterprisePageShell
            title="Sistem & İçerik Yöneticisi (CMS)"
            description="Tüm B2B Landing page, dinamik kampanya bölümleri ve Footer metinlerini buradan kontrol edin."
            actions={
                <div className="flex items-center gap-3">
                    <a href="/" target="_blank" className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-xl font-bold text-sm tracking-tight transition-all">
                        <Webhook className="w-4 h-4" /> Önizle
                    </a>
                    <EnterpriseButton variant="primary" onClick={() => activeTab === 'general' ? saveSettings() : savePage()} disabled={saving}>
                        {saving ? 'İŞLENİYOR...' : 'DEĞİŞİKLİKLERİ YAYINLA'}
                    </EnterpriseButton>
                </div>
            }
        >`;

if (code.includes(outerWrapperSearch)) {
    code = code.replace(outerWrapperSearch, outerWrapperReplace);
}

// Replace the Tabs
const tabsSearch = `{/* Tabs */}
            <div className="flex border-b border-slate-200">
                {[
                    { id: 'general', label: 'Genel Ayarlar', icon: '⚙️' },
                    { id: 'pages', label: 'Sayfa Üreticisi', icon: '📄' },
                    { id: 'menus', label: 'Menü Yönetimi', icon: '🍔' }
                ]?.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={\`px-8 py-4 font-bold text-sm transition-all flex items-center gap-2 \${activeTab === tab.id ? 'border-b-4 border-blue-600 text-blue-600 bg-blue-50/50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}\`}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">`;

const tabsReplace = `            {/* Content Area */}
            <EnterpriseCard className="p-0 overflow-hidden border-0">
                <div className="flex p-2 gap-2 bg-slate-50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5 overflow-x-auto no-scrollbar">
                    {[
                        { id: 'general', label: 'Tema Konsolu', icon: <Settings2 className="w-4 h-4" /> },
                        { id: 'pages', label: 'B2B Builder', icon: <LayoutDashboard className="w-4 h-4" /> },
                        { id: 'menus', label: 'Ağaç (Menü)', icon: <LayoutGrid className="w-4 h-4" /> }
                    ]?.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={\`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap \${
                                activeTab === tab.id 
                                ? 'bg-white dark:bg-[#1e293b] text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-white/10' 
                                : 'text-slate-500 hover:bg-slate-200/50 dark:hover:bg-white/5 hover:text-slate-700 dark:hover:text-slate-300'
                            }\`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>
                <div className="p-6">`;

if (code.includes(tabsSearch)) {
    code = code.replace(tabsSearch, tabsReplace);
}

// Replace ending tags
const endingSearch = `            </div>
        </div>
    );
}`;
const endingReplace = `                </div>
            </EnterpriseCard>
        </EnterprisePageShell>
    );
}`;

if (code.includes(endingSearch)) {
    code = code.replace(endingSearch, endingReplace);
}

// Replace inner containers
code = code.replace(/<div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">/g, '<div className="">');

fs.writeFileSync('src/app/(app)/admin/website/page.tsx', code, 'utf8');
console.log("Upgraded CMS code wrapper");
