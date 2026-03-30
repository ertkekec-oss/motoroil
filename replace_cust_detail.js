const fs = require('fs');
let code = fs.readFileSync('src/app/(app)/customers/[id]/CustomerDetailClient.tsx', 'utf8');

// Replace grouped navigation
code = code.replace(
    /\{\/\* GROUPED NAVIGATION & FILTERS - OLD STYLE V2 \*\/\}[\s\S]*?\{\/\* CONTENT AREA \*\/\}/,
    `{/* Enterprise Level 10 Oval Tabs Navigation */}
                <div className="flex flex-wrap items-center gap-1 mb-2 mt-4 relative z-10 w-full bg-white dark:bg-[#0f172a] p-2 rounded-full border border-slate-200 dark:border-white/5 shadow-sm overflow-x-auto no-scrollbar">
                    {[
                        { id: 'all', label: 'Tüm Hareketler', group: 1 },
                        { id: 'sales', label: 'Satışlar & Faturalar', group: 1 },
                        { id: 'payments', label: 'Finansal İşlemler', group: 1 },
                        { id: 'offers', label: 'Teklifler', group: 1 },
                        { id: 'documents', label: 'Dosyalar', group: 2 },
                        { id: 'warranties', label: 'Garantiler', group: 2 },
                        { id: 'services', label: 'Servis', group: 3 },
                        { id: 'checks', label: 'Vadeler', group: 4 },
                        { id: 'reconciliation', label: 'Mutabakat', group: 4 }
                    ].map((tab, idx, arr) => {
                        const isActive = activeTab === tab.id;
                        const showDivider = idx > 0 && tab.group !== arr[idx - 1].group;
                        return (
                            <React.Fragment key={tab.id}>
                                {showDivider && <div className="w-px h-5 bg-slate-200 dark:bg-slate-800/60 flex-shrink-0 mx-1"></div>}
                                <button
                                    onClick={() => { 
                                        setActiveTab(tab.id as any); 
                                        if (tab.id === 'documents') fetchDocuments(); 
                                        if (tab.id === 'services') fetchServices(); 
                                    }}
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

fs.writeFileSync('src/app/(app)/customers/[id]/CustomerDetailClient.tsx', code);
console.log('done customer detail');
