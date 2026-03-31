const fs = require('fs');
const file = 'src/app/(app)/customers/[id]/CustomerDetailClient.tsx';
let data = fs.readFileSync(file, 'utf8');

const tStart = '{/* EXECUTIVE HEADER STRIP */}';
const tEnd = '{/* CONTENT AREA */}';

const idxStart = data.indexOf(tStart);
const idxEnd = data.indexOf(tEnd);

if (idxStart === -1 || idxEnd === -1) {
    console.log('Not found');
    process.exit(1);
}

const newHeader = `{/* --- CARI COMMAND CENTER (STICKY) --- */}
            <div className="sticky top-0 z-40 bg-slate-50/95 dark:bg-[#0f172a]/95 backdrop-blur-md pb-4 pt-4 mb-6 border-b border-slate-200 dark:border-white/5 space-y-4 w-full">
                
                {/* PROFILE & COMPACT METRICS & ACTIONS */}
                <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mt-2 flex flex-col xl:flex-row xl:items-start justify-between gap-6">
                    
                    {/* Left: Avatar & Info */}
                    <div className="flex flex-col gap-4">
                        <Link href="/customers" className="text-slate-500 hover:text-blue-600 dark:text-slate-400 font-semibold text-[13px] flex items-center gap-2 transition-colors">
                            <span className="text-[16px]">←</span> Müşteri Merkezi
                        </Link>
                        <div className="flex gap-4 items-center">
                            <div className="w-14 h-14 rounded-[14px] bg-gradient-to-br from-blue-900 to-blue-500 flex items-center justify-center text-[24px] font-black text-white shadow-sm border border-white/10 shrink-0">
                                {val(customer.name, '?').charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h1 className="text-[20px] font-black m-0 text-slate-900 dark:text-white leading-tight">
                                        {val(customer.name)}
                                    </h1>
                                    {services.length > 0 && services[0].plate && (
                                        <button
                                            onClick={() => setQrPlate(services[0].plate)}
                                            className="px-2.5 py-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 rounded-[6px] text-[10px] font-bold shadow-sm hover:border-blue-500 transition-colors flex items-center gap-1.5"
                                        >
                                            📱 Karne (QR)
                                        </button>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-[12px] font-semibold text-slate-500 dark:text-slate-400">
                                    <span className="flex items-center gap-1.5"><span className="opacity-60">🏷️</span> {val(customer.category?.name, 'Genel Müşteri')}</span>
                                    <span className="flex items-center gap-1.5"><span className="opacity-60">📱</span> {val(customer.phone, 'Telefon Yok')}</span>
                                    <span className="flex items-center gap-1.5"><span className="opacity-60">📧</span> {val(customer.email, 'E-posta Yok')}</span>
                                    <span className="flex items-center gap-1.5"><span className="opacity-60">📍</span>
                                        {(() => {
                                            let addr = customer.address;
                                            if (customer.city || customer.district) {
                                                return \`\${customer.district ? customer.district + ' / ' : ''}\${customer.city || ''}\`;
                                            }
                                            try {
                                                if (addr && typeof addr === 'string' && addr.trim().startsWith('{')) {
                                                    const parsed = JSON.parse(addr);
                                                    return \`\${parsed.district ? parsed.district : ''} \${parsed.city ? '/' + parsed.city : ''}\`;
                                                }
                                            } catch (e) { }
                                            return 'Adres Yok';
                                        })()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Compact Metrics & Actions */}
                    <div className="flex flex-col items-end gap-3 flex-1">
                        
                        {/* Quick Actions */}
                        <div className="flex flex-wrap items-center gap-2">
                            <Link href={\`/payment?amount=\${Math.abs(balance)}&title=Tahsilat-\${encodeURIComponent(val(customer.name))}&ref=CUST-\${customer.id}&type=collection\`}
                                className="h-[36px] px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-[8px] font-bold text-[12px] flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                            >
                                <span>+</span> Tahsilat Al
                            </Link>
                            <Link href={\`/payment?type=payment&title=Ödeme-\${encodeURIComponent(val(customer.name))}&ref=CUST-\${customer.id}\`}
                                className="h-[36px] px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 rounded-[8px] font-bold text-[12px] flex items-center justify-center gap-1.5 transition-colors shadow-sm hidden sm:flex"
                            >
                                Ödeme Yap
                            </Link>
                            <Link href={\`/?selectedCustomer=\${encodeURIComponent(val(customer.name, ''))}\`}
                                className="h-[36px] px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 rounded-[8px] font-bold text-[12px] flex items-center justify-center gap-1.5 transition-colors shadow-sm hidden md:flex"
                            >
                                Satış Yap (POS)
                            </Link>
                            <button
                                onClick={() => setReconWizardOpen(true)}
                                className="h-[36px] px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 rounded-[8px] font-bold text-[12px] flex items-center justify-center gap-1.5 transition-colors shadow-sm hidden lg:flex"
                            >
                                🤝 Mutabakat
                            </button>
                            <button
                                onClick={() => { setStatementType('summary'); setStatementOpen(true); }}
                                className="h-[36px] px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 rounded-[8px] font-bold text-[12px] flex items-center justify-center gap-1.5 transition-colors shadow-sm hidden lg:flex"
                            >
                                📄 Özet Ekstre
                            </button>
                            <button
                                onClick={() => router.push(\`/customers?edit=\${customer.id}\`)}
                                className="w-[36px] h-[36px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-500 rounded-[8px] flex items-center justify-center transition-colors shadow-sm hover:text-blue-600 hover:border-blue-200"
                                title="Düzenle"
                            >
                                ✏️
                            </button>
                        </div>

                        {/* Metrics */}
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 px-4 py-2 rounded-[10px] flex items-center gap-3 shadow-sm">
                                <div className={\`w-8 h-8 rounded-lg flex items-center justify-center text-[14px] \${balance > 0 ? 'bg-red-50 dark:bg-red-500/10 text-red-500' : balance < 0 ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500' : 'bg-slate-50 dark:bg-slate-700 text-slate-500'}\`}>💰</div>
                                <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{\`\${balance > 0 ? 'Borç' : balance < 0 ? 'Alacak' : 'Dengeli'}\`} Bakiyesi</div>
                                    <div className={\`text-[16px] font-black leading-none mt-0.5 \${balance > 0 ? 'text-red-600 dark:text-red-400' : balance < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}\`}>{Math.abs(balance).toLocaleString()} ₺</div>
                                </div>
                            </div>

                            {overdueInstallments.length > 0 && (
                                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 px-4 py-2 rounded-[10px] flex items-center gap-3 shadow-sm">
                                    <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-500 flex items-center justify-center text-[14px]">⏳</div>
                                    <div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vadesi Geçen</div>
                                        <div className="text-[16px] font-black leading-none text-red-600 dark:text-red-400 mt-0.5">{overdueAmount.toLocaleString()} ₺</div>
                                    </div>
                                </div>
                            )}

                             {portfolioChecks > 0 && (
                                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 px-4 py-2 rounded-[10px] flex items-center gap-3 shadow-sm">
                                    <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-500 flex items-center justify-center text-[14px]">🧾</div>
                                    <div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Açık Çek/Senet</div>
                                        <div className="text-[16px] font-black leading-none text-amber-600 dark:text-amber-400 mt-0.5">{portfolioChecks.toLocaleString()} ₺</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* GROUPED NAVIGATION & FILTERS */}
                <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mt-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex w-full lg:w-max whitespace-nowrap overflow-x-auto items-center gap-6 px-1 custom-scroll select-none pb-1">
                        {[
                            { group: 'İŞLEMLER', items: [{ id: 'all', label: 'Tümü' }, { id: 'sales', label: 'Satış/Fatura' }, { id: 'payments', label: 'Finans' }] },
                            { group: 'RİSK & ONAY', items: [{ id: 'checks', label: 'Vadeler' }, { id: 'reconciliations', label: 'Mutabakat' }, { id: 'offers', label: 'Teklifler' }] },
                            { group: 'SERVİS', items: [{ id: 'warranties', label: 'Garantiler' }, { id: 'services', label: 'Servis' }, { id: 'documents', label: 'Dosyalar' }] }
                        ].map((grp, i) => (
                            <div key={grp.group} className="flex items-center gap-3">
                                {i !== 0 && <div className="w-[1px] h-4 bg-slate-200 dark:bg-white/10 hidden sm:block"></div>}
                                <div className="flex items-center gap-1 bg-slate-100/50 dark:bg-slate-800/30 p-1 rounded-lg border border-slate-200/50 dark:border-white/5">
                                    {grp.items.map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => { 
                                                setActiveTab(tab.id as any); 
                                                if (tab.id === 'documents') fetchDocuments(); 
                                                if (tab.id === 'services') fetchServices(); 
                                            }}
                                            className={activeTab === tab.id
                                                ? "px-4 py-1.5 text-[12px] font-bold text-slate-900 dark:text-white bg-white dark:bg-[#0f172a] shadow-sm border border-slate-200/50 dark:border-white/10 rounded-[6px]"
                                                : "px-4 py-1.5 text-[12px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-all rounded-[6px]"
                                            }
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative w-full lg:w-[260px]">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                            </span>
                            <input
                                type="text"
                                placeholder="Satır ve işlemlerde ara..."
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-[8px] h-[36px] pl-9 pr-3 text-[12px] font-semibold outline-none focus:border-blue-500 shadow-sm transition-all text-slate-900 dark:text-white"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 mt-2">\n`;

data = data.substring(0, idxStart) + newHeader + data.substring(idxEnd);
fs.writeFileSync(file, data);
console.log('Done refactoring top header.');
