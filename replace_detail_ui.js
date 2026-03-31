const fs = require('fs');
const file = 'src/app/(app)/customers/[id]/CustomerDetailClient.tsx';
let data = fs.readFileSync(file, 'utf8');

// Replace standard action bar
const oldActionBarRegex = /\{\/\* PREMIUM ACTION BAR \*\/\}\r?\n\s+<div style=\{\{ display: 'grid', gridTemplateColumns: 'repeat\(3, 1fr\)', gap: '16px' \}\}>[\s\S]+?\{\/\* Enterprise Level 10 Oval Tabs Navigation Container \*\/\}/;

const newActionBar = `{/* ENTERPRISE ACTION BAR */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                    <Link href={\`/payment?amount=\${Math.abs(balance)}&title=Tahsilat-\${encodeURIComponent(val(customer.name))}&ref=CUST-\${customer.id}&type=collection\`}
                        className="group flex flex-col justify-center items-center gap-3 bg-white dark:bg-[#0f172a] p-6 rounded-[24px] transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-slate-200 dark:border-white/5 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-[0.03] dark:opacity-5">
                            <span className="text-[64px] leading-none select-none">💰</span>
                        </div>
                        <div className="w-12 h-12 rounded-[16px] bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-[24px] shadow-sm z-10 transition-transform group-hover:scale-110">
                            💰
                        </div>
                        <div className="text-center z-10">
                            <div className="font-black text-[14px] tracking-widest mb-1 text-slate-800 dark:text-white uppercase">Tahsilat Al</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">Cari hesaptan nakit / kk ile ödeme al</div>
                        </div>
                    </Link>

                    <Link href={\`/payment?type=payment&title=Ödeme-\${encodeURIComponent(val(customer.name))}&ref=CUST-\${customer.id}\`}
                        className="group flex flex-col justify-center items-center gap-3 bg-white dark:bg-[#0f172a] p-6 rounded-[24px] transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-slate-200 dark:border-white/5 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-[0.03] dark:opacity-5">
                            <span className="text-[64px] leading-none select-none">💸</span>
                        </div>
                        <div className="w-12 h-12 rounded-[16px] bg-red-50 dark:bg-red-500/10 text-red-500 flex items-center justify-center text-[24px] shadow-sm z-10 transition-transform group-hover:scale-110">
                            💸
                        </div>
                        <div className="text-center z-10">
                            <div className="font-black text-[14px] tracking-widest mb-1 text-slate-800 dark:text-white uppercase">Ödeme Yap</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">Firmadan nakit / kk ile ödeme çıkışı yap</div>
                        </div>
                    </Link>

                    <Link href={\`/?selectedCustomer=\${encodeURIComponent(val(customer.name, ''))}\`}
                        className="group flex flex-col justify-center items-center gap-3 bg-white dark:bg-[#0f172a] p-6 rounded-[24px] transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-slate-200 dark:border-white/5 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-[0.03] dark:opacity-5">
                            <span className="text-[64px] leading-none select-none">🛒</span>
                        </div>
                        <div className="w-12 h-12 rounded-[16px] bg-blue-50 dark:bg-blue-500/10 text-blue-500 flex items-center justify-center text-[24px] shadow-sm z-10 transition-transform group-hover:scale-110">
                            🛒
                        </div>
                        <div className="text-center z-10">
                            <div className="font-black text-[14px] tracking-widest mb-1 text-slate-800 dark:text-white uppercase">Satış Yap (POS)</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">Bu müşteriye terminalde yeni satış başlat</div>
                        </div>
                    </Link>
                </div>

                {/* FILTERS (ENTERPRISE STANDARD) */}`;

data = data.replace(oldActionBarRegex, newActionBar);

// Replace Tabs
const oldTabsRegex = /<div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-\[#0f172a\] p-2 rounded-\[20px\] mb-6 mt-4 border border-slate-200 dark:border-white\/5 shadow-sm relative z-10 w-full">[\s\S]+?<\/div>\r?\n\s+<\/div>/;

const newTabs = `<div className="flex flex-wrap items-center gap-2 mb-6 mt-4 relative z-10 w-full">
                    {[
                        { id: 'all', label: 'TÜMÜ' },
                        { id: 'sales', label: 'SATIŞ/FATURA' },
                        { id: 'payments', label: 'FİNANS' },
                        { id: 'offers', label: 'TEKLİFLER' },
                        { id: 'documents', label: 'DOSYALAR' },
                        { id: 'warranties', label: 'GARANTİLER' },
                        { id: 'services', label: 'SERVİS' },
                        { id: 'checks', label: 'VADELER' },
                        { id: 'reconciliations', label: 'MUTABAKAT' }
                    ].map(tab => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => { 
                                    setActiveTab(tab.id as any); 
                                    if (tab.id === 'documents') fetchDocuments(); 
                                    if (tab.id === 'services') fetchServices(); 
                                }}
                                className={\`h-[36px] px-5 rounded-full text-[11px] font-black uppercase tracking-widest border transition-all whitespace-nowrap outline-none \${isActive ? 'bg-blue-50/50 border-blue-600 text-blue-700 shadow-sm dark:bg-blue-500/10 dark:border-blue-500/50 dark:text-blue-400' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-700/50 dark:text-slate-400 dark:hover:text-slate-300 dark:hover:bg-slate-800'}\`}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>`;

data = data.replace(oldTabsRegex, newTabs);

fs.writeFileSync(file, data);
console.log('Action bar and Tabs replaced.');
