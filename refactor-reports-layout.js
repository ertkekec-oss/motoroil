const fs = require('fs');

let content = fs.readFileSync('src/app/(app)/reports/page.tsx', 'utf8');

// Add icons to imports
content = content.replace(
    /import \{[\s\S]*?\} from 'recharts';/,
    `$&
import { BarChart3, PieChart, LineChart, Target, Building2, Store, Users, FileText, Factory, Presentation, Package, FileDown, Briefcase, Activity } from 'lucide-react';`
);

// Define REPORT_CATEGORIES right above the component export
const categoriesDefinition = `
const REPORT_CATEGORIES = [
    {
        id: 'finance',
        label: 'Finans & İş Zekası',
        reports: [
            { id: 'overview', label: 'Genel Kurumsal Özet', icon: <Presentation className="w-4 h-4" /> },
            { id: 'finance', label: 'Detaylı Finansal Durum', icon: <BarChart3 className="w-4 h-4" /> },
            { id: 'cashflow', label: 'Nakit Akış Analizi', icon: <Activity className="w-4 h-4" /> },
        ]
    },
    {
        id: 'operations',
        label: 'Saha & Operasyon',
        reports: [
            { id: 'daily', label: 'Gün Sonu & Kasa Ana Ekranı', icon: <Store className="w-4 h-4" /> },
            { id: 'sales', label: 'Satış İşlemleri', icon: <LineChart className="w-4 h-4" /> },
            { id: 'customers', label: 'Müşteri Skor & Performans', icon: <Users className="w-4 h-4" /> },
        ]
    },
    {
        id: 'mrp',
        label: 'Üretim (MRP) & Envanter',
        reports: [
            { id: 'manufacturing', label: 'Üretim & İstasyon Verimi', icon: <Factory className="w-4 h-4" /> },
            { id: 'inventory', label: 'Stok Devir & Atıl Yük', icon: <Package className="w-4 h-4" /> },
            { id: 'suppliers', label: 'Tedarikçi Ağı Performansı', icon: <Briefcase className="w-4 h-4" /> },
        ]
    },
    {
        id: 'system',
        label: 'Sistem & Dışa Aktarımlar',
        reports: [
            { id: 'exports', label: 'Arşiv ve Excel/PDF Çıktıları', icon: <FileDown className="w-4 h-4" /> },
        ]
    }
];

export default function ReportsPage() {`;

content = content.replace("export default function ReportsPage() {", categoriesDefinition);

// The current layout from "return (" down to "<div className=\"animate-fade-in\">""
const oldLayoutRegex = /return \(\s*<div className="min-h-screen[\s\S]*?(?=<div className="animate-fade-in">)/;

const newLayout = `return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0B1220] p-4 sm:p-6 lg:p-8 pb-24 animate-in fade-in duration-300 flex flex-col xl:flex-row gap-8 items-start">
            
            {/* Left Sidebar - Report Studio Index */}
            <aside className="w-full xl:w-72 shrink-0 space-y-8 sticky top-8">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        Rapor Stüdyosu
                    </h1>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                        Tüm işletme zekası ve anlık veriler
                    </p>
                </div>

                <div className="space-y-6">
                    {REPORT_CATEGORIES.map(category => (
                        <div key={category.id}>
                            <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-3 mb-2">{category.label}</div>
                            <div className="space-y-1">
                                {category.reports.map(report => (
                                    <button
                                        key={report.id}
                                        onClick={() => setActiveTab(report.id as any)}
                                        className={\`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all \${activeTab === report.id ? 'bg-white shadow border border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-white/5 border border-transparent'}\`}
                                    >
                                        <span className={activeTab === report.id ? 'text-blue-500' : 'text-slate-400'}>{report.icon}</span>
                                        {report.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </aside>

            {/* Right Main Content */}
            <main className="flex-1 min-w-0 w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 shadow-sm rounded-3xl p-6 lg:p-8">
                
                {/* Context & Filters Bar */}
                <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-white/5 mb-8">
                    
                    {/* Scope Title */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                            <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-sm font-black text-slate-900 dark:text-white">
                                {REPORT_CATEGORIES.flatMap(c => c.reports).find(r => r.id === activeTab)?.label}
                            </div>
                            <div className="text-xs font-semibold text-slate-500">
                                {reportScope === 'all' ? 'Tüm Organizasyon Verisi' : \`\${selectedBranch} Şubesi Verisi\`}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                        {/* Scope Selector (if admin) */}
                        {canViewAll && (
                            <div className="flex items-center gap-1 bg-white dark:bg-[#0f172a] p-1 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm">
                                <button
                                    onClick={() => setReportScope('all')}
                                    className={\`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors \${reportScope === 'all' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'}\`}
                                >
                                    Tüm Organizasyon
                                </button>
                                <button
                                    onClick={() => setReportScope('single')}
                                    className={\`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors \${reportScope === 'single' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'}\`}
                                >
                                    Şube Bazlı
                                </button>
                                
                                {reportScope === 'single' && (
                                    <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
                                )}
                                
                                {reportScope === 'single' && (
                                    <select
                                        value={selectedBranch}
                                        onChange={(e) => setSelectedBranch(e.target.value)}
                                        className="bg-transparent text-slate-900 dark:text-white text-xs font-bold outline-none cursor-pointer pr-4 pl-1"
                                    >
                                        {availableBranches.map(branch => (
                                            <option key={branch} value={branch} className="text-slate-900">{branch}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        )}

                        {/* Date Range Picker */}
                        <div className="flex items-center gap-2 bg-white dark:bg-[#0f172a] px-3 py-2 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm shrink-0">
                            <input
                                type="date"
                                value={localDateRange.start}
                                onChange={e => setLocalDateRange({ ...localDateRange, start: e.target.value })}
                                className="bg-transparent border-none text-slate-900 dark:text-white text-xs font-bold outline-none cursor-pointer"
                            />
                            <span className="text-slate-300 dark:text-slate-600 font-bold">→</span>
                            <input
                                type="date"
                                value={localDateRange.end}
                                onChange={e => setLocalDateRange({ ...localDateRange, end: e.target.value })}
                                className="bg-transparent border-none text-slate-900 dark:text-white text-xs font-bold outline-none cursor-pointer"
                            />
                        </div>
                    </div>
                </header>

`;

content = content.replace(oldLayoutRegex, newLayout);
// finally, make sure we close the main and flex box properly
content = content.replace(/<\/div>\s*<\/div>\s*<\/div>\s*\);\s*\}\s*$/g, "</div></main></div>);}");

fs.writeFileSync('src/app/(app)/reports/page.tsx', content);
console.log('Layout replaced');
