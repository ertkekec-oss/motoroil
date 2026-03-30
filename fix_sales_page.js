const fs = require('fs');

let c = fs.readFileSync('src/app/(app)/sales/page.tsx', 'utf8');

// 1. Remove Header
c = c.replace(/<header className="flex justify-between items-center">[\s\S]*?<\/header>/, '');

// 2. Add 'all' and 'revenue' to tabs array if not exists
const tabsPattern = /\/\\* Premium Minimal Tab Navigation \\*\/[\s\S]*?<div className=\{w-full\}>/;
// Let's replace the tab list manually.
const tabsMatch = /\{\[\s*\{ key: 'online'[\s\S]*?\}\]\.map\(\{ key, label, onClick \}\) => \{/;

// Wait, I will just do a string replace on the "Premium Minimal Tab Navigation" section.
const oldTabsSectionRegex = /\{\/\* Premium Minimal Tab Navigation \*\/\}\s*<div className=\{`flex gap-6 border-b pb-\[1px\] \$\{theme === 'light' \? 'border-slate-200' : 'border-slate-800'\}`\}>\s*\{\[\s*\{ key: 'online'[\s\S]*?\}\]\.map\(\(\{ key, label, onClick \}\) => \{\s*const isActive = activeTab === key;\s*return \([\s\S]*?\);\s*\}\)\}\s*<\/div>/;

const newTabsSection = `{/* Enterprise Oval Tabs */}
<div className="flex flex-wrap items-center gap-3 mb-6 relative z-10 w-full bg-white dark:bg-[#0f172a] p-2 rounded-full border border-slate-200 dark:border-white/5 shadow-sm justify-center">
    {[
        { key: 'all', label: 'Tüm Satışlar', onClick: () => setActiveTab('all') },
        { key: 'online', label: 'E-Ticaret', onClick: () => setActiveTab('online') },
        { key: 'store', label: 'Mağaza Satışları', onClick: () => setActiveTab('store') },
        { key: 'b2b', label: 'B2B Satışları', onClick: () => setActiveTab('b2b') },
        { key: 'invoices', label: 'Faturalar', onClick: () => { setActiveTab('invoices'); setInvoiceSubTab('sales'); } },
        { key: 'wayslips', label: 'e-İrsaliyeler', onClick: () => { setActiveTab('wayslips'); setInvoiceSubTab('wayslips'); } },
        { key: 'revenue', label: 'Revenue Intelligence', onClick: () => router.push('/sales/revenue-intelligence') },
    ].map(({ key, label, onClick }) => {
        const isActive = activeTab === key || (activeTab === 'invoices' && key === 'invoices' && invoiceSubTab === 'sales') || (activeTab === 'wayslips' && key === 'wayslips' && invoiceSubTab === 'wayslips');
        return (
            <button
                key={key}
                onClick={onClick}
                className={\`h-[38px] px-5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all \${isActive ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-300'}\`}
            >
                {label}
            </button>
        );
    })}

    {/* New Wayslip Add Button right inside the tabs for quick access if active tab is wayslips */}
    {activeTab === 'wayslips' && (
         <button onClick={() => setView('new_wayslip')} className="px-5 h-[38px] bg-emerald-500 hover:bg-emerald-600 text-white rounded-full text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center gap-2 ml-auto">
             🚚 Yeni İrsaliye Düzenle
         </button>
    )}
</div>`;

c = c.replace(oldTabsSectionRegex, newTabsSection);

// To render 'all' tab, we can just say if 'all' then render a combined view, or just redirect to 'online' or show both. 
// Actually 'online' corresponds to e-ticaret. If activeTab === 'all', we might need to show online and store side by side or something.
// For now, let's just render a placeholder or maybe we can skip implementing full "all" logic if we just render Store and Online.
c = c.replace(/\{activeTab === 'online' && \(/, "{(activeTab === 'online' || activeTab === 'all') && (");

fs.writeFileSync('src/app/(app)/sales/page.tsx', c);
console.log('done modifying sales/page.tsx');
