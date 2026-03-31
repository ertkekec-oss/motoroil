const fs = require('fs');
const file = 'src/app/(app)/customers/page.tsx';
let data = fs.readFileSync(file, 'utf8');

// 1. Add classFilter state
if (!data.includes('const [classFilter, setClassFilter]')) {
    data = data.replace(
        "const [activeTab, setActiveTab] = useState('all');",
        "const [activeTab, setActiveTab] = useState('all');\n    const [classFilter, setClassFilter] = useState('all');"
    );
}

// 2. Change the filteredCustomers logic to use classFilter instead of activeTab for classes
data = data.replace(
    /if \(activeTab !== 'all' && activeTab !== 'borclular' && activeTab !== 'alacaklilar'\) \{\s*if \(cust\.customerClass !== activeTab && cust\.category !== activeTab\) return false;\s*\}/,
    `if (classFilter !== 'all') {\n            if (cust.customerClass !== classFilter && cust.category !== classFilter) return false;\n        }`
);

// 3. Remove custClasses from the tabs array
data = data.replace(
    /const tabs = \[\s*\{\s*id:\s*'all',\s*label:\s*'Tümü'\s*\},\s*\{\s*id:\s*'borclular',\s*label:\s*'Borçlular'\s*\},\s*\{\s*id:\s*'alacaklilar',\s*label:\s*'Alacaklılar'\s*\},\s*\.\.\.custClasses\.map\(c => \(\{\s*id:\s*c,\s*label:\s*c\s*\}\)\)\s*\];/,
    `const tabs = [\n        { id: 'all', label: 'Tümü' },\n        { id: 'borclular', label: 'Borçlular' },\n        { id: 'alacaklilar', label: 'Alacaklılar' }\n    ];`
);

// 4. Transform the Enterprise Oval Tabs Block into the Staff "Grouped Navigation" style block
const ovalTabsRegex = /\{\/\* Enterprise Oval Tabs & Header Replacement \*\/\}\s*<div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-\[#0f172a\] p-2 rounded-\[20px\] mb-6 border border-slate-200 dark:border-white\/5 shadow-sm relative z-10 w-full">[\s\S]*?<\/div>\s*<\/div>/;

const staffTabsHtml = `{/* Staff-Style Top Tabs */}
            <div className="mb-6 flex w-full lg:w-max whitespace-nowrap overflow-x-auto items-center gap-6 px-1 custom-scroll select-none pb-1">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-slate-100/50 dark:bg-slate-800/30 p-1 rounded-lg border border-slate-200/50 dark:border-white/5">
                        {tabs.map(tab => {
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabChange(tab.id)}
                                    className={isActive
                                        ? "px-6 py-2.5 text-[12px] font-bold text-slate-900 dark:text-white bg-white dark:bg-[#0f172a] shadow-sm border border-slate-200/50 dark:border-white/10 rounded-[6px] transition-all"
                                        : "px-6 py-2.5 text-[12px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-all rounded-[6px]"
                                    }
                                >
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>`;

data = data.replace(ovalTabsRegex, staffTabsHtml);

// 5. Restructure the Search box line to include the Class dropdown and + Yeni Müşteri button
const searchRowRegex = /<div className="relative w-full md:w-\[320px\]">\s*<Search className="absolute left-3 top-1\/2 -translate-y-1\/2 w-4 h-4 text-slate-400" \/>\s*<input[\s\S]*?\/>\s*<\/div>/;

const newSearchRowHtml = `<div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
                        <select
                            value={classFilter}
                            onChange={(e) => setClassFilter(e.target.value)}
                            className="h-[38px] bg-white dark:bg-[#0f172a] border border-slate-200/50 dark:border-white/10 text-slate-700 dark:text-slate-200 rounded-[8px] text-[12px] font-bold px-3 outline-none focus:border-indigo-500 transition-all cursor-pointer shadow-sm w-full md:w-[130px]"
                        >
                            <option value="all">Tüm Sınıflar</option>
                            {custClasses.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <div className="relative w-full md:w-[260px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                placeholder="Müşteri, VKN, Telefon..."
                                className="w-full pl-9 pr-4 h-[38px] bg-white dark:bg-black/20 rounded-[8px] border border-slate-200 dark:border-white/10 text-[12px] font-bold outline-none transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-800 dark:text-white"
                            />
                        </div>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="px-6 h-[38px] bg-indigo-600 hover:bg-indigo-700 text-white rounded-[8px] text-[11px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2 shrink-0 w-full md:w-auto"
                        >
                            <Plus className="w-4 h-4" />
                            YENİ MÜŞTERİ
                        </button>
                    </div>`;

data = data.replace(searchRowRegex, newSearchRowHtml);

fs.writeFileSync(file, data);
console.log('Done refactoring pagin.');
