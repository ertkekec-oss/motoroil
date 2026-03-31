const fs = require('fs');

const file = 'src/app/(app)/suppliers/[id]/SupplierDetailClient.tsx';
let data = fs.readFileSync(file, 'utf8');

// 1. Rewrite the Top Area (Header)
const headerRegex = /\{\/\* EXECUTIVE HEADER STRIP \*\/\}\s*<div style=\{\{([\s\S]*?)\}\}>\s*<div style=\{\{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' \}\}>\s*\{\/\* Top Row: Back link & Title \*\/\}\s*<div className="flex justify-between items-center">[\s\S]*?\{\/\* PREMIUM ACTION BAR \*\/\}/;

const newHeaderAndActions = `{/* EXECUTIVE HEADER STRIP */}
            <div className="bg-white dark:bg-[#0f172a] border-b border-slate-200 dark:border-white/5 p-6 sticky top-0 z-40 w-full shadow-sm">
                <div className="max-w-[1400px] mx-auto flex flex-col xl:flex-row gap-6 items-start xl:items-center justify-between">
                    
                    {/* Left: Avatar & Details */}
                    <div className="flex gap-5 items-center">
                        <div className="w-[64px] h-[64px] rounded-[16px] flex items-center justify-center text-[24px] font-bold text-white shadow-sm shrink-0" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)' }}>
                            {val(supplier.name, '?').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-3">
                                <Link href="/suppliers" className="text-slate-400 hover:text-blue-500 transition-colors" title="Tedarikçilere Dön">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                                </Link>
                                <h1 className="text-[20px] font-black tracking-tight text-slate-800 dark:text-white m-0">
                                    {val(supplier.name)}
                                </h1>
                                <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-[6px] text-[11px] font-bold uppercase tracking-wider border border-slate-200 dark:border-white/5">
                                    {val(supplier.category, 'Genel Tedarikçi')}
                                </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-[12px] font-semibold text-slate-500">
                                <span className="flex items-center gap-1.5"><span className="opacity-50">📍</span>
                                    {(() => {
                                        if (supplier.city || supplier.district) {
                                            return \`\${supplier.district ? supplier.district + ' / ' : ''}\${supplier.city || ''}\`;
                                        }
                                        return supplier.address || 'Adres Yok';
                                    })()}
                                </span>
                                {supplier.phone && <span className="flex items-center gap-1.5"><span className="opacity-50">📱</span> {supplier.phone}</span>}
                                {supplier.email && <span className="flex items-center gap-1.5"><span className="opacity-50">📧</span> {supplier.email}</span>}
                            </div>
                        </div>
                    </div>

                    {/* Right: Actions & Balance on SAME ROW */}
                    <div className="flex flex-wrap items-center justify-end gap-4 flex-1 w-full xl:w-auto mt-2 xl:mt-0 xl:ml-auto">
                        
                        {/* Quick Actions */}
                        <div className="flex flex-wrap items-center gap-2">
                             <button
                                onClick={() => router.push(\`/suppliers?edit=\${supplier.id}\`)}
                                className="h-[36px] px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded-[8px] font-bold text-[12px] flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                                title="Düzenle"
                            >
                                ✏️ Detay
                            </button>
                            <button
                                onClick={() => setIsAdjustModalOpen(true)}
                                className="h-[36px] px-4 bg-orange-50 hover:bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:hover:bg-orange-500/20 dark:text-orange-400 border border-orange-200 dark:border-orange-500/10 rounded-[8px] font-bold text-[12px] flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                            >
                                ⚖️ Bakiye Düzelt
                            </button>
                            <button
                                onClick={() => { setStatementType('detailed'); setStatementOpen(true); }}
                                className="h-[36px] px-4 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-white rounded-[8px] font-bold text-[12px] flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                            >
                                📑 Ekstre
                            </button>
                            <button
                                onClick={() => setIsUploadModalOpen(true)}
                                className="h-[36px] px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[8px] font-bold text-[12px] flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                            >
                                🚀 Akıllı Fatura
                            </button>
                            <button
                                onClick={() => setIsPurchaseModalOpen(true)}
                                className="h-[36px] px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-[8px] font-bold text-[12px] flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                            >
                                🛒 Manuel Alış
                            </button>
                            <Link 
                                href={\`/payment?type=payment&title=Ödeme-\${encodeURIComponent(val(supplier.name))}&ref=SUP-\${supplier.id}&amount=\${Math.abs(supplier.balance)}\`}
                                className="h-[36px] px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[8px] font-bold text-[12px] flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                            >
                                💸 Ödeme Yap
                            </Link>
                        </div>

                        {/* Balance Badge (Rightmost) */}
                        <div className="flex items-center gap-3 bg-slate-50 dark:bg-[#1e293b] py-2 px-4 rounded-[12px] border border-slate-200 dark:border-white/5 shadow-sm">
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-black tracking-widest uppercase text-slate-400">DENGELİ BAKİYESİ</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-[18px] font-black font-mono tracking-tight" style={{ color: balance < 0 ? '#ef4444' : balance > 0 ? '#10b981' : 'var(--text-main, #333)' }}>
                                        {Math.abs(balance).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                    </span>
                                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-[4px] tracking-wider" style={{
                                        background: balance < 0 ? 'rgba(239, 68, 68, 0.1)' : balance > 0 ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-card, rgba(255,255,255,0.05))',
                                        color: balance < 0 ? '#ef4444' : balance > 0 ? '#10b981' : 'var(--text-main, #333)'
                                    }}>
                                        {balance < 0 ? 'BORÇLUYUZ' : balance > 0 ? 'ALACAKLIYIZ' : 'DENGELİ'}
                                    </span>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="max-w-[1400px] mx-auto w-full p-6 md:p-10 flex flex-col gap-8">
                {/* PREMIUM ACTION BAR */}`;

data = data.replace(headerRegex, newHeaderAndActions);

// 2. Remove the PREMIUM ACTION BAR div completely since we moved actions to header.
data = data.replace(/<div style=\{\{ display: 'grid', gridTemplateColumns: 'repeat\(3, 1fr\)', gap: '16px' \}\}>[\s\S]*?<\/div>\s*\{\/\* Enterprise Level 10 Oval Tabs Navigation Container \*\/\}/, `{/* Tabs Navigation Container */}`);

// 3. Fix the activeTabs borderless UI wrapper container
data = data.replace(/<div style=\{\{\s*background: 'var\(--bg-panel, rgba\(15, 23, 42, 0\.4\)\)',\s*borderRadius: '20px',\s*border: '1px solid var\(--border-color, rgba\(255,255,255,0\.05\)\)',\s*overflow: 'hidden',\s*boxShadow: '0 4px 24px rgba\(0,0,0,0\.2\)'\s*\}\}\>/, 
    `<div className="w-full">`
);

// 4. Tab 1: All Operations Table Rewrite
data = data.replace(/<table style=\{\{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' \}\}>/g,
'<div className="overflow-auto max-h-[calc(100vh-270px)] custom-scroll bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] shadow-sm flex flex-col mb-4"><table className="w-full text-left border-collapse">'
);
data = data.replace(/<tr style=\{\{ color: 'var\(--text-muted, #888\)', fontSize: '11px', textTransform: 'uppercase', textAlign: 'left', borderBottom: '1px solid var\(--border-color, rgba\(255,255,255,0\.1\)\)', fontWeight: '800', letterSpacing: '0\.5px' \}\}>/g,
`<tr className="text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-widest font-bold border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#1e293b]">`
);

data = data.replace(/<tbody\s*>/g, `<tbody className="divide-y divide-slate-100 dark:divide-white/5">`);

data = data.replace(/<tr key=\{idx\} style=\{\{ borderBottom: '1px solid var\(--border-color, rgba\(255,255,255,0\.03\)\)', transition: 'background 0\.2s' \}\} className="hover:bg-white\/5">/g, 
    `<tr key={idx} className="hover:bg-slate-50 dark:hover:bg-[#1e293b]/80 transition-colors h-[48px] group border-b border-slate-100 dark:border-white/5">`
);

data = data.replace(/<th style=\{\{ padding: '20px' \}\}>TARİH \& TÜR<\/th>/, `<th className="px-5 py-4 font-bold whitespace-nowrap">TARİH & TÜR</th>`);
data = data.replace(/<th style=\{\{ padding: '20px' \}\}>AÇIKLAMA \/ REFERANS<\/th>/, `<th className="px-5 py-4 font-bold whitespace-nowrap">AÇIKLAMA / REFERANS</th>`);
data = data.replace(/<th style=\{\{ padding: '20px', textAlign: 'right' \}\}>TUTAR<\/th>/, `<th className="px-5 py-4 font-bold text-right whitespace-nowrap">TUTAR</th>`);
data = data.replace(/<th style=\{\{ padding: '20px', textAlign: 'center' \}\}>İŞLEM<\/th>/, `<th className="px-5 py-4 font-bold text-center whitespace-nowrap">İŞLEM</th>`);


data = data.replace(/<td style=\{\{ padding: '20px' \}\}>/g, `<td className="px-5 py-3 align-middle text-[12px] font-semibold text-slate-600 dark:text-slate-400">`);
data = data.replace(/<td style=\{\{ padding: '20px', fontSize: '14px', color: 'var\(--text-main, #eee\)' \}\}>/g, `<td className="px-5 py-3 align-middle text-[12px] font-semibold text-slate-600 dark:text-slate-400">`);
data = data.replace(/<td style=\{\{ padding: '20px', textAlign: 'right', fontWeight: '800', color: \(item\.amount < 0 && item\.type !== 'Ödeme'\) \? '#ef4444' : '#10b981', fontSize: '16px' \}\}>/g, `<td className="px-5 py-3 align-middle text-right text-[14px] font-extrabold" style={{ color: (item.amount < 0 && item.type !== 'Ödeme') ? '#ef4444' : '#10b981' }}>`);
data = data.replace(/<td style=\{\{ padding: '20px', textAlign: 'center' \}\}>/g, `<td className="px-5 py-3 align-middle">`);


data = data.replace(/\{paginatedList\.length === 0 && \([\s\S]*?<tr><td colSpan=\{4\} style=\{\{ textAlign: 'center', padding: '60px', color: 'var\(--text-muted, #888\)' \}\}>Henüz bir işlem kaydı bulunmuyor\.<\/td><\/tr>[\s\S]*?}\)/g, 
    `{paginatedList.length === 0 && (<tr><td colSpan={4} className="px-6 py-10 text-center text-slate-500 dark:text-slate-400 font-semibold text-[14px]">Henüz bir işlem kaydı bulunmuyor.</td></tr>)}`
);

// 5. Tab 2: Checks
data = data.replace(/<th style=\{\{ padding: '20px' \}\}>VADE VE BANKA<\/th>/, `<th className="px-5 py-4 font-bold whitespace-nowrap">VADE VE BANKA</th>`);
data = data.replace(/<th style=\{\{ padding: '20px' \}\}>DURUM \& TÜR<\/th>/, `<th className="px-5 py-4 font-bold whitespace-nowrap">DURUM & TÜR</th>`);

data = data.replace(/<tr key=\{c\.id\} style=\{\{ borderBottom: '1px solid var\(--border-color, rgba\(255,255,255,0\.03\)\)', transition: 'background 0\.2s' \}\} className="hover:bg-white\/5">/g, 
    `<tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-[#1e293b]/80 transition-colors h-[48px] group border-b border-slate-100 dark:border-white/5">`
);

data = data.replace(/<td style=\{\{ padding: '20px', textAlign: 'right', fontWeight: '800', color: '#3b82f6', fontSize: '16px' \}\}>/g, `<td className="px-5 py-3 align-middle text-right text-[14px] font-extrabold text-blue-600 dark:text-blue-400">`);
data = data.replace(/style=\{\{ fontSize: '11px', padding: '8px 16px', background: '#3b82f6', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: '800', boxShadow: '0 4px 10px rgba\(59, 130, 246, 0\.2\)' \}\}/g, 
        `className="px-4 h-[32px] bg-blue-600 hover:bg-blue-700 text-white rounded-[6px] font-bold text-[11px] transition-colors shadow-sm"`
);

data = data.replace(/<tr><td colSpan=\{4\} style=\{\{ textAlign: 'center', padding: '60px', color: 'var\(--text-muted, #888\)' \}\}>Kayıtlı evrak bulunmuyor\.<\/td><\/tr>/g, 
    `<tr><td colSpan={4} className="px-6 py-10 text-center text-slate-500 dark:text-slate-400 font-semibold text-[14px]">Kayıtlı evrak bulunmuyor.</td></tr>`
);


// Final step, replace the table end tags to close the overflow div.
data = data.replace(/<\/tbody>\s*<\/table>\s*<div style=\{\{ padding: '20px', borderTop: '1px solid var\(--border-color, rgba\(255,255,255,0\.05\)\)' \}\}>\s*<Pagination currentPage=\{currentPage\} totalPages=\{totalPages\} onPageChange=\{setCurrentPage\} \/>\s*<\/div>/g, 
    `</tbody>\n</table>\n</div>\n<div className="flex justify-center mt-4">\n<Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />\n</div>`
);


data = data.replace(/<div style=\{\{ overflowX: 'auto' \}\}>([\s\S]*?)<\/div>/, '$1');
data = data.replace(/<div className="flex flex-col min-h-screen" style=\{\{ background: 'var\(--bg-main\)', color: 'var\(--text-main\)' \}\}>/, `<div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900 font-sans">`);

// Replace action buttons
data = data.replace(/style=\{\{ fontSize: '11px', padding: '6px 12px', background: 'var\(--bg-card, rgba\(255,255,255,0\.05\)\)', border: '1px solid var\(--border-color, rgba\(255,255,255,0\.1\)\)', color: 'var\(--text-main, #fff\)', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' \}\}/g, 
        `className="px-3 py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:border-white/10 dark:hover:bg-slate-700 text-slate-700 dark:text-white rounded-[6px] text-[11px] font-bold transition-colors"`
);
data = data.replace(/style=\{\{\s*fontSize: '11px',\s*padding: '6px 12px',\s*background: 'rgba\(59, 130, 246, 0\.1\)',\s*border: '1px solid rgba\(59, 130, 246, 0\.3\)',\s*color: '#3b82f6',\s*borderRadius: '8px',\s*cursor: 'pointer',\s*fontWeight: '700'\s*\}\}/g, 
        `className="px-3 py-1.5 bg-blue-50 border border-blue-200 hover:bg-blue-100 dark:bg-blue-500/10 dark:border-blue-500/30 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-[6px] text-[11px] font-bold transition-colors"`
);

// One tiny fix: the `(() => { if (...) return (...)})()` can cause overflow issues if not handled, but we matched the `overflowX` regex correctly using `[\s\S]*?` wait no, `overflowX` replacement used `(.*?)` which might not match multiline!
data = data.replace(/<div style=\{\{ overflowX: 'auto' \}\}>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>\s*\{\/\* MODALS \*\/\}/, `$1</div>\n</div>\n{/* MODALS */}`);

fs.writeFileSync(file, data);
console.log('Supplier detail fixed safely');
