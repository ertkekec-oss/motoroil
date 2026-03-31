const fs = require('fs');
const file = 'src/app/(app)/customers/[id]/CustomerDetailClient.tsx';
let data = fs.readFileSync(file, 'utf8');

// 1. Fixing Offers
data = data.replace(
    /\{\(!customer\.offers \|\| customer\.offers\.length === 0\) \? \([\s\S]*?Müşteriye henüz bir teklif oluşturulmamış\.[\s\S]*?<\/div>[\s\S]*?\) : \([\s\S]*?(<div className="overflow-auto[\s\S]*?<table className="w-full text-left border-collapse">\s*<thead>[\s\S]*?<\/thead>)\s*<tbody>/,
    `$1<tbody className="divide-y divide-slate-100 dark:divide-white/5">\n{(!customer.offers || customer.offers.length === 0) ? (<tr><td colSpan={5} className="px-6 py-10 text-center text-slate-500 dark:text-slate-400 font-semibold text-[14px]">Teklif Bulunamadı. Müşteriye henüz bir teklif oluşturulmamış.</td></tr>) : (`
);
// Fix the closing tags for offers
data = data.replace(
    /<\/tbody>\s*<\/table>\s*<\/div>\s*\}\s*<\/div>\s*\)\s*:\s*activeTab === 'warranties' \? \(/,
    `)}</tbody></table></div>\n</div>\n) : activeTab === 'warranties' ? (`
);


// 2. Fixing Reconciliations
data = data.replace(
    /\{\(!customer\.reconciliations \|\| customer\.reconciliations\.length === 0\) \? \([\s\S]*?Bu cariyle henüz mutabakat yapılmamış\.[\s\S]*?<\/div>\s*\) : \([\s\S]*?(<div className="overflow-auto[\s\S]*?<table className="w-full text-left border-collapse">\s*<thead>[\s\S]*?<\/thead>)\s*<tbody>/,
    `$1<tbody className="divide-y divide-slate-100 dark:divide-white/5">\n{(!customer.reconciliations || customer.reconciliations.length === 0) ? (<tr><td colSpan={4} className="px-6 py-10 text-center text-slate-500 dark:text-slate-400 font-semibold text-[14px]">Bu cariyle henüz mutabakat yapılmamış.</td></tr>) : (`
);
data = data.replace(
    /<\/tbody>\s*<\/table>\s*<\/div>\s*\}\s*<\/div>\s*\)\s*:\s*activeTab === 'services' \? \(/,
    `)}</tbody></table></div>\n</div>\n) : activeTab === 'services' ? (`
);

// 3. Fixing Checks
data = data.replace(
    /\{!customer\.checks \|\| customer\.checks\.length === 0 \? \([\s\S]*?Kayıtlı evrak bulunmuyor\.[\s\S]*?<\/div>\s*\) : \([\s\S]*?(<div className="overflow-auto[\s\S]*?<table className="w-full text-left border-collapse">\s*<thead>[\s\S]*?<\/thead>)\s*<tbody>/,
    `$1<tbody className="divide-y divide-slate-100 dark:divide-white/5">\n{(!customer.checks || customer.checks.length === 0) ? (<tr><td colSpan={2} className="px-6 py-10 text-center text-slate-500 dark:text-slate-400 font-semibold text-[14px]">Kayıtlı evrak bulunmuyor.</td></tr>) : (`
);

// 4. Fixing Payment Plans
data = data.replace(
    /\{!customer\.paymentPlans \|\| customer\.paymentPlans\.length === 0 \? \([\s\S]*?Aktif vadelendirme planı bulunmuyor\.[\s\S]*?<\/div>\s*\) : \([\s\S]*?(<div className="overflow-auto[\s\S]*?<table className="w-full text-left border-collapse">\s*<thead>[\s\S]*?<\/thead>)\s*<tbody>/,
    `$1<tbody className="divide-y divide-slate-100 dark:divide-white/5">\n{(!customer.paymentPlans || customer.paymentPlans.length === 0) ? (<tr><td colSpan={2} className="px-6 py-10 text-center text-slate-500 dark:text-slate-400 font-semibold text-[14px]">Aktif vadelendirme planı bulunmuyor.</td></tr>) : (`
);

// Fix the closing tags for checks and plans together since they are in the same tab:
data = data.replace(
    /<\/tbody>\s*<\/table>\s*<\/div>\s*\}\s*<\/div>\s*\{\/\* PLAN COLUMN \*\/\}/,
    `)}</tbody></table></div>\n</div>\n{/* PLAN COLUMN */}`
);
data = data.replace(
    /<\/tbody>\s*<\/table>\s*<\/div>\s*\}\s*<\/div>\s*<\/div>\s*<\/div>\s*\) : activeTab === 'reconciliations' \? \(/,
    `)}</tbody></table></div>\n</div>\n</div>\n</div>\n) : activeTab === 'reconciliations' ? (`
);


// Warranties Empty State is different because it uses cards, not tables:
data = data.replace(
    /\{warranties\.length === 0 \? \([\s\S]*?Henüz kayıtlı garanti karnesi bulunmuyor\.[\s\S]*?<\/div>\s*\) : \(/,
    `{warranties.length === 0 ? (
                                <div className="p-10 text-center text-slate-500 dark:text-slate-400 font-semibold text-[14px] bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] shadow-sm">
                                    Henüz kayıtlı garanti karnesi bulunmuyor.
                                </div>
                            ) : (`
);

// Documents Empty State
data = data.replace(
    /\{docsLoading \? \([\s\S]*?dosyası yüklenmemiş\.\s*\(Maks 5MB PDF, PNG, JPEG\)<\/div>\s*<\/div>\s*\) : \(/,
    `{docsLoading ? (
                                <div className="p-10 text-center text-slate-500 dark:text-slate-400 font-semibold text-[14px] bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] shadow-sm">
                                    Dosyalar getiriliyor...
                                </div>
                            ) : documents.length === 0 ? (
                                <div className="p-10 text-center text-slate-500 dark:text-slate-400 font-semibold text-[14px] bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] shadow-sm">
                                    Henüz dosyası yüklenmemiş. (Maks 5MB PDF, PNG, JPEG)
                                </div>
                            ) : (`
);

// Fix `.map((...` trailing parenthesises for all tabs:
data = data.replace(/\) : \(\s*\{customer\.offers\.map/g, ') : customer.offers.map');
data = data.replace(/\) : \(\s*\{customer\.checks\.map/g, ') : customer.checks.map');
data = data.replace(/\) : \(\s*\{customer\.paymentPlans\.map/g, ') : customer.paymentPlans.map');
data = data.replace(/\) : \(\s*\{customer\.reconciliations\.map/g, ') : customer.reconciliations.map');

// Change the huge buttons
data = data.replace(/className="btn btn-primary"\s*style=\{\{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px', background: 'linear-gradient\(135deg, #10b981 0%, #059669 100%\)', color: 'white', fontWeight: '800', border: 'none', boxShadow: '0 4px 12px rgba\(16, 185, 129, 0\.3\)' \}\}/g,
    `className="h-[36px] px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[8px] font-bold text-[12px] flex items-center justify-center gap-1.5 transition-colors shadow-sm"`
);

data = data.replace(/style=\{\{ padding: '10px 20px', borderRadius: '12px', background: 'linear-gradient\(135deg, #3b82f6 0%, #2563eb 100%\)', color: 'white', fontWeight: '800', textDecoration: 'none' \}\}/g,
    `className="h-[36px] px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-[8px] font-bold text-[12px] flex items-center justify-center gap-1.5 transition-colors shadow-sm"`
);

data = data.replace(/className="btn btn-primary"\s*style=\{\{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px', background: 'linear-gradient\(135deg, #3b82f6 0%, #2563eb 100%\)', color: 'white', fontWeight: '800', border: 'none', boxShadow: '0 4px 12px rgba\(59, 130, 246, 0\.3\)' \}\}/g,
    `className="h-[36px] px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[8px] font-bold text-[12px] flex items-center justify-center gap-1.5 transition-colors shadow-sm"`
);

data = data.replace(/className="btn btn-primary"\s*style=\{\{ cursor: uploading \? 'wait' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px', background: uploading \? 'var\(--bg-card\)' : 'linear-gradient\(135deg, #10b981 0%, #059669 100%\)', border: 'none', color: 'white', fontWeight: '800' \}\}/g,
    `className="h-[36px] px-4 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-white rounded-[8px] font-bold text-[12px] flex items-center justify-center gap-1.5 transition-colors shadow-sm"`
);

// 4. FIX THE EXPANDED ROW DARK MODE BUG
data = data.replace(/<tr style=\{\{ background: '#080a0f', borderBottom: '1px solid var\(--border-color, rgba\(255,255,255,0\.03\)\)' \}\}>/g,
    `<tr className="bg-slate-50 dark:bg-[#0f172a] border-b border-slate-200 dark:border-white/5">`
);

fs.writeFileSync(file, data);
console.log('Phase 2 Safe applied');
