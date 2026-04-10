const fs = require('fs');

let content = fs.readFileSync('src/app/(app)/reports/page.tsx', 'utf8');

content = content.replace(/return \(\s*<div className="min-h-screen.*?(?=<div className="animate-fade-in">)/s, `return (
        <div className="min-h-screen bg-white dark:bg-[#0f172a] p-4 sm:p-6 lg:p-8 pb-24 animate-in fade-in duration-300">
            <div className="max-w-[1600px] mx-auto space-y-6">

                {/* Header */}
                <header className="flex flex-col gap-6 mb-2">
                    {/* Top Row: Title and Scope */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                                Detaylı Analiz Paneli
                            </h1>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                                {reportScope === 'all' ? 'Tüm Şirket (Konsolide)' : selectedBranch} • İşletme zekası ve anlık metrikler
                            </p>
                        </div>

                        {/* Date Range Picker */}
                        <div className="flex items-center gap-3 bg-white dark:bg-[#0f172a] px-4 py-2 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm">
                            <input
                                type="date"
                                value={localDateRange.start}
                                onChange={e => setLocalDateRange({ ...localDateRange, start: e.target.value })}
                                className="bg-transparent border-none text-slate-900 dark:text-white text-[13px] font-bold outline-none cursor-pointer"
                            />
                            <span className="text-slate-300 dark:text-slate-600 font-bold">→</span>
                            <input
                                type="date"
                                value={localDateRange.end}
                                onChange={e => setLocalDateRange({ ...localDateRange, end: e.target.value })}
                                className="bg-transparent border-none text-slate-900 dark:text-white text-[13px] font-bold outline-none cursor-pointer"
                            />
                        </div>
                    </div>

                    {/* Scope Selector (if admin) & Tabs */}
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                        
                        <div className="flex-1 overflow-x-auto custom-scrollbar pb-2 xl:pb-0">
                            <div className="bg-slate-100 dark:bg-slate-800/50 p-1 rounded-[14px] inline-flex items-center gap-1 border border-slate-200/50 dark:border-white/5">
                                {[
                                    { id: 'overview', label: 'Genel Bakış' },
                                    { id: 'daily', label: 'Gün Sonu Raporu' },
                                    { id: 'suppliers', label: 'Tedarikçi Raporları' },
                                    { id: 'manufacturing', label: 'Üretim Analizi' },
                                    { id: 'sales', label: 'Satışlar' },
                                    { id: 'finance', label: 'Finansal Durum' },
                                    { id: 'inventory', label: 'Envanter' },
                                    { id: 'customers', label: 'Müşteriler' },
                                    { id: 'cashflow', label: 'Nakit Akışı' },
                                    { id: 'exports', label: 'Dışa Aktarımlar' },
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={\`
                                            px-5 py-2.5 rounded-[10px] text-[13px] font-bold transition-all duration-300 whitespace-nowrap
                                            \${activeTab === tab.id
                                                ? 'bg-white dark:bg-[#0f172a] text-slate-900 dark:text-white shadow-sm border border-slate-200/50 dark:border-white/10'
                                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 border border-transparent'
                                            }
                                        \`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {canViewAll && (
                            <div className="flex items-center gap-2 bg-slate-100 dark:bg-[#0f172a] p-1.5 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm shrink-0">
                                <button
                                    onClick={() => setReportScope('all')}
                                    className={\`px-4 py-1.5 rounded-lg text-[13px] font-bold transition-colors \${reportScope === 'all' ? 'bg-white shadow border border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 block border border-transparent'}\`}
                                >
                                    Tüm Organizasyon
                                </button>
                                <button
                                    onClick={() => setReportScope('single')}
                                    className={\`px-4 py-1.5 rounded-lg text-[13px] font-bold transition-colors \${reportScope === 'single' ? 'bg-white shadow border border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 block border border-transparent'}\`}
                                >
                                    Tek Şube
                                </button>
                                
                                {reportScope === 'single' && (
                                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
                                )}
                                
                                {reportScope === 'single' && (
                                    <select
                                        value={selectedBranch}
                                        onChange={(e) => setSelectedBranch(e.target.value)}
                                        className="bg-transparent text-slate-900 dark:text-white text-[13px] font-bold outline-none cursor-pointer pr-4 pl-2"
                                    >
                                        {availableBranches.map(branch => (
                                            <option key={branch} value={branch} className="text-slate-900">{branch}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        )}
                    </div>
                </header>

`);

content = content.replace(/<div className="bg-white dark:bg-\[#0f172a\] border border-slate-200 dark:border-white\/5 shadow-sm-plus" style={{ padding: '24px', borderRadius: '16px', borderLeft: `4px solid \$\{COLORS.primary\}` }}>.*?(?=<div className="bg-white dark:bg-\[#0f172a\] border border-slate-200 dark:border-white\/5 shadow-sm-plus" style={{ padding: '24px', borderRadius: '16px', borderLeft: `4px solid \$\{COLORS.success\}` }})/s, `<div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 shadow-sm rounded-2xl p-6 flex flex-col justify-center transition-all hover:shadow-md relative overflow-hidden">
                                    <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 z-10 relative">Toplam Ciro</div>
                                    <div className="text-3xl font-black text-slate-900 dark:text-white mb-1 z-10 relative">₺{financialSummary.revenue.toLocaleString()}</div>
                                    <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 z-10 relative">{salesAnalytics.count} işlem hacmi</div>
                                    <div className="absolute top-0 right-0 p-4 opacity-5 text-4xl">📈</div>
                                </div>`);

content = content.replace(/<div className="bg-white dark:bg-\[#0f172a\] border border-slate-200 dark:border-white\/5 shadow-sm-plus" style={{ padding: '24px', borderRadius: '16px', borderLeft: `4px solid \$\{COLORS.success\}` }}>.*?(?=<div className="bg-white dark:bg-\[#0f172a\] border border-slate-200 dark:border-white\/5 shadow-sm-plus" style={{ padding: '24px', borderRadius: '16px', borderLeft: `4px solid \$\{COLORS.warning\}` }})/s, `<div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 shadow-sm rounded-2xl p-6 flex flex-col justify-center transition-all hover:shadow-md relative overflow-hidden">
                                    <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 z-10 relative">Net Kâr</div>
                                    <div className="text-3xl font-black text-emerald-600 mb-1 z-10 relative">₺{financialSummary.netProfit.toLocaleString()}</div>
                                    <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 z-10 relative">% {financialSummary.profitMargin.toFixed(1)} kâr marjı</div>
                                    <div className="absolute top-0 right-0 p-4 opacity-5 text-4xl">💰</div>
                                </div>`);

content = content.replace(/<div className="bg-white dark:bg-\[#0f172a\] border border-slate-200 dark:border-white\/5 shadow-sm-plus" style={{ padding: '24px', borderRadius: '16px', borderLeft: `4px solid \$\{COLORS.warning\}` }}>.*?(?=<div className="bg-white dark:bg-\[#0f172a\] border border-slate-200 dark:border-white\/5 shadow-sm-plus" style={{ padding: '24px', borderRadius: '16px', borderLeft: `4px solid \$\{COLORS.danger\}` }})/s, `<div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 shadow-sm rounded-2xl p-6 flex flex-col justify-center transition-all hover:shadow-md relative overflow-hidden">
                                    <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 z-10 relative">Ortalama Sepet</div>
                                    <div className="text-3xl font-black text-slate-900 dark:text-white mb-1 z-10 relative">₺{salesAnalytics.avgTicket.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                                    <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 z-10 relative">İşlem başına tutar</div>
                                    <div className="absolute top-0 right-0 p-4 opacity-5 text-4xl">💳</div>
                                </div>`);

content = content.replace(/<div className="bg-white dark:bg-\[#0f172a\] border border-slate-200 dark:border-white\/5 shadow-sm-plus" style={{ padding: '24px', borderRadius: '16px', borderLeft: `4px solid \$\{COLORS.danger\}` }}>.*?<\/div>\s*<\/div>\s*\{\/\* Charts Row \*\/\}/s, `<div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 shadow-sm rounded-2xl p-6 flex flex-col justify-center transition-all hover:shadow-md relative overflow-hidden">
                                    <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 z-10 relative">Toplam Gider</div>
                                    <div className="text-3xl font-black text-slate-900 dark:text-white mb-1 z-10 relative">₺{financialSummary.expenses.toLocaleString()}</div>
                                    <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 z-10 relative">Kayıtlı giderler toplamı</div>
                                    <div className="absolute top-0 right-0 p-4 opacity-5 text-4xl">📉</div>
                                </div>
                            </div>

                            {/* Charts Row */}`);

content = content.replace(/<div className="bg-white dark:bg-\[#0f172a\] border border-slate-200 dark:border-white\/5 shadow-sm card" style={{ padding: '24px', borderRadius: '16px' }}>/g, '<div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 shadow-sm rounded-2xl p-6">');
content = content.replace(/<div className="bg-white dark:bg-\[#0f172a\] border border-slate-200 dark:border-white\/5 shadow-sm-plus" style={{ padding: '32px', borderRadius: '20px', border: '1px solid rgba\(255,255,255,0.1\)' }}>/g, '<div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 shadow-sm rounded-2xl p-8">');
content = content.replace(/<h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '20px' }}>.*?<\/h3>/g, function(match) {
    const text = match.replace(/<[^>]+>/g, '').replace(/[^\x00-\x7F]/g, "").replace(/ /g, " ").trim().substring(2); // removing emojis and extra spaces
    // Wait, regex above for removing emojis might be flawed. Just replace it visually.
    return `<h3 className="text-base font-bold text-slate-900 dark:text-white mb-5 tracking-tight">${match.replace(/<[^>]+>/g, '').replace(/[\u1000-\uFFFF]/g, '').trim()}</h3>`;
});

// Since the regex replace for h3 above might leave some issues, let's just do it directly for the ones we know
content = content.replace(/<h3 className=".*?">.*?Satış Trendi<\/h3>/g, '<h3 className="text-base font-bold text-slate-900 dark:text-white mb-5 tracking-tight border-b border-slate-100 dark:border-white/5 pb-3">Satış Trendi</h3>');
content = content.replace(/<h3 className=".*?">.*?Gider Dağılımı<\/h3>/g, '<h3 className="text-base font-bold text-slate-900 dark:text-white mb-5 tracking-tight border-b border-slate-100 dark:border-white/5 pb-3">Gider Dağılımı</h3>');
content = content.replace(/<h3 className=".*?">.*?Son İşlemler<\/h3>/g, '<h3 className="text-base font-bold text-slate-900 dark:text-white mb-5 tracking-tight border-b border-slate-100 dark:border-white/5 pb-3">Son İşlemler</h3>');
content = content.replace(/<h3 className=".*?">.*?Günlük Satış Detayı<\/h3>/g, '<h3 className="text-base font-bold text-slate-900 dark:text-white mb-5 tracking-tight border-b border-slate-100 dark:border-white/5 pb-3">Günlük Satış Detayı</h3>');
content = content.replace(/<h3 style={{ fontSize: '20px', fontWeight: '900', marginBottom: '24px' }}>.*?Detaylı Finansal Tablo<\/h3>/g, '<h3 className="text-lg font-black text-slate-900 dark:text-white mb-6 tracking-tight border-b border-slate-100 dark:border-white/5 pb-4">Detaylı Finansal Tablo</h3>');
content = content.replace(/<h3 className=".*?">.*?En Yüksek Stok Değerine Sahip Ürünler<\/h3>/g, '<h3 className="text-base font-bold text-slate-900 dark:text-white mb-5 tracking-tight border-b border-slate-100 dark:border-white/5 pb-3">En Yüksek Stok Değerine Sahip Ürünler</h3>');
content = content.replace(/<h3 className=".*?">.*?Cari Bakiye Durumu<\/h3>/g, '<h3 className="text-base font-bold text-slate-900 dark:text-white mb-5 tracking-tight border-b border-slate-100 dark:border-white/5 pb-3">Cari Bakiye Durumu</h3>');
content = content.replace(/<h3 className=".*?">.*?Nakit Akış Analizi<\/h3>/g, '<h3 className="text-base font-bold text-slate-900 dark:text-white mb-5 tracking-tight border-b border-slate-100 dark:border-white/5 pb-3">Nakit Akış Analizi</h3>');


// Transactions
content = content.replace(/<div key=\{i\} className="bg-white dark:bg-\[#0f172a\] border border-slate-200 dark:border-white\/5 shadow-sm" style={{ padding: '16px', borderRadius: '12px', borderLeft: `3px solid \$\{tx.type === 'Sales' \? COLORS.success : COLORS.danger\}` }}>/g, 
`<div key={i} className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 shadow-sm rounded-xl p-4 flex flex-col justify-center">`);

// Inventory Tab Cleanup
content = content.replace(/<div className="bg-white dark:bg-\[#0f172a\] border border-slate-200 dark:border-white\/5 shadow-sm-plus" style={{ padding: '24px', borderRadius: '16px', borderLeft: `4px solid \$\{COLORS.primary\}` }}>/g, `<div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 shadow-sm rounded-2xl p-6 flex flex-col justify-center relative overflow-hidden">`);
content = content.replace(/<div className="bg-white dark:bg-\[#0f172a\] border border-slate-200 dark:border-white\/5 shadow-sm-plus" style={{ padding: '24px', borderRadius: '16px', borderLeft: `4px solid \$\{COLORS.warning\}` }}>/g, `<div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 shadow-sm rounded-2xl p-6 flex flex-col justify-center relative overflow-hidden">`);

// Inventory Top Products 
content = content.replace(/<div key=\{i\} className="bg-white dark:bg-\[#0f172a\] border border-slate-200 dark:border-white\/5 shadow-sm" style={{ padding: '20px', borderRadius: '12px', borderLeft: `4px solid \$\{COLORS.primary\}` }}>/g, `<div key={i} className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 shadow-sm rounded-xl p-5 flex flex-col justify-center">`);

// Financial detailed table subcards
content = content.replace(/<div className="bg-white dark:bg-\[#0f172a\] border border-slate-200 dark:border-white\/5 shadow-sm" style={{ padding: '24px', borderRadius: '16px' }}>/g, `<div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-xl p-5">`);
// Financial summary bottom
content = content.replace(/<div className="bg-white dark:bg-\[#0f172a\] border border-slate-200 dark:border-white\/5 shadow-sm-plus" style={{ padding: '24px', borderRadius: '16px', background: 'rgba\(16, 185, 129, 0.05\)', border: `1px solid \$\{COLORS.success\}55` }}>/g, `<div className="bg-white dark:bg-[#0f172a] border border-emerald-200 dark:border-emerald-900 shadow-sm rounded-2xl p-6 flex flex-col justify-center">`);
content = content.replace(/<div className="bg-white dark:bg-\[#0f172a\] border border-slate-200 dark:border-white\/5 shadow-sm-plus" style={{ padding: '24px', borderRadius: '16px', background: 'rgba\(239, 68, 68, 0.05\)', border: `1px solid \$\{COLORS.danger\}55` }}>/g, `<div className="bg-white dark:bg-[#0f172a] border border-red-200 dark:border-red-900 shadow-sm rounded-2xl p-6 flex flex-col justify-center">`);

// Hidden Costs
content = content.replace(/<div className="bg-white dark:bg-\[#0f172a\] border border-slate-200 dark:border-white\/5 shadow-sm card" style={{ padding: '24px', borderRadius: '16px', borderLeft: `4px solid \$\{COLORS.indigo\}` }}>/g, `<div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 shadow-sm rounded-2xl p-6 flex flex-col justify-center">`);
content = content.replace(/<div className="bg-white dark:bg-\[#0f172a\] border border-slate-200 dark:border-white\/5 shadow-sm card" style={{ padding: '24px', borderRadius: '16px', borderLeft: `4px solid \$\{COLORS.warning\}` }}>/g, `<div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 shadow-sm rounded-2xl p-6 flex flex-col justify-center">`);
content = content.replace(/<div className="bg-white dark:bg-\[#0f172a\] border border-slate-200 dark:border-white\/5 shadow-sm card" style={{ padding: '24px', borderRadius: '16px', borderLeft: `4px solid \$\{COLORS.pink\}` }}>/g, `<div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 shadow-sm rounded-2xl p-6 flex flex-col justify-center">`);
content = content.replace(/<div key=\{i\} className="bg-white dark:bg-\[#0f172a\] border border-slate-200 dark:border-white\/5 shadow-sm card" style={{ padding: '24px', borderRadius: '16px', borderLeft: `4px solid \$\{COLORS.cyan\}` }}>/g, `<div key={i} className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 shadow-sm rounded-2xl p-6 flex flex-col justify-center">`);
// Customers tab subcard
content = content.replace(/<div key=\{i\} className="bg-white dark:bg-\[#0f172a\] border border-slate-200 dark:border-white\/5 shadow-sm-plus" style={{ padding: '24px', borderRadius: '16px' }}>/g, `<div key={i} className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 shadow-sm rounded-xl p-5 flex flex-col justify-center">`);


fs.writeFileSync('src/app/(app)/reports/page.tsx', content);
