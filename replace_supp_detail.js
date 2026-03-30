const fs = require('fs');
let code = fs.readFileSync('src/app/(app)/suppliers/[id]/SupplierDetailClient.tsx', 'utf8');

// Ensure React is imported
if (!code.includes("import React,")) {
    code = code.replace("import { useState, useEffect } from 'react';", "import React, { useState, useEffect } from 'react';");
}

// Replace grouped navigation
code = code.replace(
    /\{\/\* GROUPED NAVIGATION \*\/\}[\s\S]*?\{\/\* CONTENT AREA \*\/\}/,
    `{/* Enterprise Level 10 Oval Tabs Navigation */}
                <div className="flex flex-wrap items-center gap-1 mb-2 mt-4 relative z-10 w-full bg-white dark:bg-[#0f172a] p-2 rounded-full border border-slate-200 dark:border-white/5 shadow-sm overflow-x-auto no-scrollbar">
                    {[
                        { id: 'all', label: 'Tüm Hareketler', group: 1 },
                        { id: 'checks', label: 'Çek & Senetler', group: 1 }
                    ].map((tab, idx, arr) => {
                        const isActive = activeTab === tab.id;
                        const showDivider = idx > 0 && tab.group !== arr[idx - 1].group;
                        return (
                            <React.Fragment key={tab.id}>
                                {showDivider && <div className="w-px h-5 bg-slate-200 dark:bg-slate-800/60 flex-shrink-0 mx-1"></div>}
                                <button
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={\`h-[38px] px-5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap \${isActive ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-300'}\`}
                                >
                                    {tab.label}
                                </button>
                            </React.Fragment>
                        );
                    })}
                </div>

                {/* CONTENT AREA */}`
);

fs.writeFileSync('src/app/(app)/suppliers/[id]/SupplierDetailClient.tsx', code);
console.log('done supplier detail');
