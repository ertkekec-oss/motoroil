const fs = require('fs');

let code = fs.readFileSync('src/app/(app)/suppliers/page.tsx', 'utf8');

// Replace Header with Oval Tabs
code = code.replace(
    /      \{\/\* HEADER \*\/\}[\s\S]*?      \{\/\* KPI Banner \*\/\}/,
    `      {/* HEADER & OVAL TABS */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 relative z-10 w-full bg-white dark:bg-[#0f172a] p-2 rounded-full border border-slate-200 dark:border-white/5 shadow-sm">
        <div className="flex flex-wrap items-center gap-1 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={\`h-[38px] px-5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all \${isActive
                    ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 shadow-sm"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-300"
                  }\`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="h-[38px] px-6 flex flex-row items-center gap-2 rounded-full text-[11px] font-black uppercase tracking-widest transition-all bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Yeni Tedarikçi
          </button>
        </div>
      </div>

      {/* KPI Banner */}`
);

// Remove "Görünüm" tabs from filters
code = code.replace(
    /            <div>\s*<div className=\{`text-\[11px\] font-semibold uppercase tracking-wide mb-3 \$\{textLabelClass\}`\}>\s*Görünüm\s*<\/div>\s*<div className="flex flex-wrap gap-2">[\s\S]*?<\/div>\s*<\/div>\s*<div className="flex-1 min-w-\[200px\] max-w-\[300px\]">/,
    '            <div className="flex-1 min-w-[200px] max-w-[300px]">'
);

// Update Modal Standard (Background and Rounded corners)
code = code.replace(
    /className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900\/50 "/g,
    'className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm z-[9999]"'
);

code = code.replace(
    /className=\{`w-\[600px\] max-w-full rounded-\[16px\] overflow-hidden flex flex-col max-h-\[90vh\] \$\{modalClass\} animate-in zoom-in-95 duration-200`\}/g,
    'className={`w-[600px] max-w-full rounded-[24px] overflow-hidden flex flex-col max-h-[90vh] bg-white dark:bg-[#0f172a] shadow-2xl animate-in zoom-in-95 duration-200 border-0`}'
);

// Form padding changes inside modals
code = code.replace(
    /className=\{`flex justify-between items-center px-6 py-4 border-b \$\{isLight \? "border-slate-100" : "border-slate-800"\}`\}/g,
    'className={`flex justify-between items-center px-6 py-5 border-b sticky top-0 bg-inherit z-10 ${isLight ? "border-slate-100" : "border-slate-800/50"}`}'
);
code = code.replace(
    /<h2 className=\{`text-\[16px\] font-semibold \$\{textValueClass\}`\}>Yeni Tedarikçi Ekle<\/h2>/,
    '<h2 className={`text-[16px] font-black tracking-tight ${textValueClass}`}>YENİ TEDARİKÇİ EKLE</h2>'
);
code = code.replace(
    /<h2 className=\{`text-\[16px\] font-semibold \$\{textValueClass\}`\}>Tedarikçi Düzenle<\/h2>/,
    '<h2 className={`text-[16px] font-black tracking-tight ${textValueClass}`}>TEDARİKÇİ DÜZENLE</h2>'
);

// Update Modal Butons below
code = code.replace(
    /className=\{`w-full h-\[44px\] rounded-\[10px\] text-\[14px\] font-semibold text-white transition-all \$\{isLight \? "bg-blue-600 hover:bg-blue-700" : "bg-blue-600 hover:bg-blue-500"\} \$\{isProcessing \? 'opacity-50' : ''\}`\}/g,
    'className={`w-full h-[48px] rounded-full text-[13px] tracking-widest font-black uppercase text-white transition-all bg-indigo-600 hover:bg-indigo-500 shadow-lg active:scale-[0.98] ${isProcessing ? "opacity-50" : ""}`}'
);

fs.writeFileSync('src/app/(app)/suppliers/page.tsx', code);
console.log('done.');
