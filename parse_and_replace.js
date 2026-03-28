const fs = require('fs');
let content = fs.readFileSync('src/app/(app)/customers/[id]/CustomerDetailClient.tsx', 'utf8');

const startMarker = '{/* EXECUTIVE HEADER STRIP */}';
const endMarker = '{/* CONTENT AREA */}';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if(startIndex === -1 || endIndex === -1) {
    console.log("Markers not found");
    process.exit(1);
}

const newLayout = `            {/* EXECUTIVE HEADER STRIP (ENTERPRISE STANDARD) */}
            <div className="sticky top-0 z-40 bg-[#080a0f]/95 backdrop-blur-xl border-b border-white/5 pt-4 pb-6 px-4 md:px-8 shadow-2xl">
                <div className="max-w-7xl mx-auto flex flex-col gap-6">
                    
                    {/* Top Row: Back link & Title */}
                    <div className="flex justify-between items-center">
                        <Link href="/customers" className="text-slate-400 hover:text-blue-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-colors">
                            <span className="text-base leading-none">←</span> Müşteri Merkezi
                        </Link>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setReconWizardOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-[11px] font-black tracking-wide uppercase transition-colors"
                            >
                                🤝 Mutabakat
                            </button>
                            <button
                                onClick={() => { setStatementType('summary'); setStatementOpen(true); }}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white border border-white/10 rounded-lg text-[11px] font-black tracking-wide uppercase transition-colors"
                            >
                                📄 Özet Ekstre
                            </button>
                            <button
                                onClick={() => { setStatementType('detailed'); setStatementOpen(true); }}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white border border-white/10 rounded-lg text-[11px] font-black tracking-wide uppercase transition-colors"
                            >
                                📑 Detaylı Ekstre
                            </button>
                            <button
                                onClick={() => router.push(\`/customers?edit=\${customer.id}\`)}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-lg text-[11px] font-black tracking-wide uppercase transition-colors"
                            >
                                ✏️ Düzenle
                            </button>
                        </div>
                    </div>

                    {/* Business/Profile Row */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        {/* Left: Avatar + Details */}
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center text-2xl font-black text-white shadow-xl shadow-black/50 shrink-0">
                                {val(customer.name, '?').charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col gap-1">
                                <h1 className="text-[26px] font-black text-white tracking-tight m-0 leading-tight">
                                    {val(customer.name)}
                                </h1>
                                <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-400 mt-1">
                                    <span className="flex items-center gap-1.5"><span className="text-slate-500 opacity-60">🏷️</span> {val(customer.category?.name, 'Genel Müşteri')}</span>
                                    <span className="flex items-center gap-1.5"><span className="text-slate-500 opacity-60">📱</span> <span className="text-slate-300">{val(customer.phone, 'Telefon Yok')}</span></span>
                                    <span className="flex items-center gap-1.5"><span className="text-slate-500 opacity-60">📧</span> <span className="text-slate-300">{val(customer.email, 'E-posta Yok')}</span></span>
                                    <span className="flex items-center gap-1.5"><span className="text-slate-500 opacity-60">📍</span>
                                        <span className="text-slate-300">
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
                                    </span>
                                </div>
                                {services.length > 0 && services[0].plate && (
                                    <div className="flex items-center gap-2 mt-2">
                                        <button
                                            onClick={() => setQrPlate(services[0].plate)}
                                            className="text-[10px] font-black px-3 py-1.5 rounded bg-slate-800 border border-white/5 text-slate-300 hover:text-white uppercase transition-colors flex items-center gap-1.5"
                                        >
                                            <span className="text-sm">📱</span> Dijital Karne
                                        </button>
                                        <button
                                            onClick={() => {
                                                const plate = services[0].plate;
                                                const msg = \`Sayın \${customer.name}, \${plate} plakalı aracınızın servis işlemleri Periodya güvencesiyle kayıt altına alınmıştır. Dijital karnenize buradan ulaşabilirsiniz: https://www.periodya.com/vehicle/\${plate}\`;
                                                window.open(\`https://wa.me/\${customer.phone?.replace(/\\s/g, '').replace(/^0/, '90')}?text=\${encodeURIComponent(msg)}\`, '_blank');
                                            }}
                                            className="text-[10px] font-black px-3 py-1.5 rounded bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] hover:bg-[#25D366]/20 uppercase transition-colors flex items-center gap-1.5"
                                        >
                                            <span className="text-sm">💬</span> WhatsApp
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right: Balance & Financial Health */}
                        <div className="flex flex-col items-end justify-center">
                            <div className="text-[10px] font-black text-slate-500 tracking-widest uppercase mb-1">
                                FİNANSAL DURUM (NET BAKİYE)
                            </div>
                            <div className="flex items-baseline gap-3">
                                <div className={\`text-3xl font-black tracking-tighter \${balance > 0 ? 'text-red-500' : balance < 0 ? 'text-emerald-500' : 'text-slate-300'}\`}>
                                    {Math.abs(balance).toLocaleString('tr-TR')} <span className="text-2xl opacity-70">₺</span>
                                </div>
                                <div className={\`px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest \${balance > 0 ? 'bg-red-500/10 text-red-500 border border-red-500/20' : balance < 0 ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-slate-800 text-slate-400 border border-white/5'}\`}>
                                    {balance > 0 ? 'BORÇLU (RİSK)' : balance < 0 ? 'ALACAKLI' : 'DENGELİ'}
                                </div>
                            </div>

                            {/* DUE INSTALLMENTS SUMMARY */}
                            {(overdueInstallments.length > 0 || upcomingInstallments.length > 0) && (
                                <div className="mt-3 flex gap-2 items-center">
                                    {overdueInstallments.length > 0 && (
                                        <div className="flex items-center gap-2 bg-red-500/5 px-2 py-1 rounded border border-red-500/20">
                                            <span className="text-[9px] font-black text-red-500/80 uppercase tracking-widest">Gecikti</span>
                                            <span className="text-xs font-black text-red-500 tabular-nums">{overdueAmount.toLocaleString('tr-TR')} ₺</span>
                                        </div>
                                    )}
                                    {upcomingInstallments.length > 0 && (
                                        <div className="flex items-center gap-2 bg-blue-500/5 px-2 py-1 rounded border border-blue-500/20">
                                            <span className="text-[9px] font-black text-blue-500/80 uppercase tracking-widest">30 Gün (Vade)</span>
                                            <span className="text-xs font-black text-blue-500 tabular-nums">{upcomingAmount.toLocaleString('tr-TR')} ₺</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {portfolioChecks > 0 && (
                                <div className="text-[10px] font-bold text-amber-500/80 mt-2 flex items-center gap-1.5">
                                    <span>⚠️</span> Portföyde {portfolioChecks.toLocaleString('tr-TR')} ₺ aktif çek/senet
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="max-w-7xl mx-auto w-full px-4 md:px-8 py-8 flex flex-col gap-6">

                {/* PREMIUM ACTION BAR */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link href={\`/payment?amount=\${Math.abs(balance)}&title=Tahsilat-\${encodeURIComponent(val(customer.name))}&ref=CUST-\${customer.id}&type=collection\`}
                        className="group flex flex-col items-center justify-center p-6 bg-[#080a0f] border border-white/5 hover:border-emerald-500/30 rounded-2xl shadow-lg transition-all"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-white/5 group-hover:border-emerald-500/20 group-hover:bg-emerald-500/10 flex items-center justify-center text-2xl transition-colors mb-3">
                            <span className="group-hover:scale-110 transition-transform">💰</span>
                        </div>
                        <div className="text-center">
                            <div className="font-extrabold text-[13px] text-white tracking-widest uppercase mb-1 group-hover:text-emerald-400 transition-colors">TAHSİLAT AL</div>
                            <div className="text-[11px] text-slate-500 font-semibold px-4">Cari hesaptan ödeme al (Nakit, K.K, Kasa)</div>
                        </div>
                    </Link>

                    <Link href={\`/payment?type=payment&title=Ödeme-\${encodeURIComponent(val(customer.name))}&ref=CUST-\${customer.id}\`}
                        className="group flex flex-col items-center justify-center p-6 bg-[#080a0f] border border-white/5 hover:border-red-500/30 rounded-2xl shadow-lg transition-all"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-white/5 group-hover:border-red-500/20 group-hover:bg-red-500/10 flex items-center justify-center text-2xl transition-colors mb-3">
                            <span className="group-hover:scale-110 transition-transform">💸</span>
                        </div>
                        <div className="text-center">
                            <div className="font-extrabold text-[13px] text-white tracking-widest uppercase mb-1 group-hover:text-red-400 transition-colors">ÖDEME YAP</div>
                            <div className="text-[11px] text-slate-500 font-semibold px-4">Firmadan Müşteriye nakit çıkışı yap</div>
                        </div>
                    </Link>

                    <Link href={\`/?selectedCustomer=\${encodeURIComponent(val(customer.name, ''))}\`}
                        className="group flex flex-col items-center justify-center p-6 bg-[#080a0f] border border-white/5 hover:border-blue-500/30 rounded-2xl shadow-lg transition-all"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-white/5 group-hover:border-blue-500/20 group-hover:bg-blue-500/10 flex items-center justify-center text-2xl transition-colors mb-3">
                            <span className="group-hover:scale-110 transition-transform">🛒</span>
                        </div>
                        <div className="text-center">
                            <div className="font-extrabold text-[13px] text-white tracking-widest uppercase mb-1 group-hover:text-blue-400 transition-colors">SATIŞ YAP (POS)</div>
                            <div className="text-[11px] text-slate-500 font-semibold px-4">Terminalde cariyi seç ve işlem başlat</div>
                        </div>
                    </Link>
                </div>

                {/* GROUPED NAVIGATION & FILTERS (HR MODULE STYLE) */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mt-2">
                    <div className="flex w-full xl:w-max overflow-x-auto items-center gap-1.5 p-1.5 bg-[#080a0f] border border-white/5 rounded-xl scrollbar-hide select-none shadow-md">
                        {[
                            { id: 'all', label: 'Tüm Hareketler', icon: '📋' },
                            { id: 'sales', label: 'Satışlar & Faturalar', icon: '🛒' },
                            { id: 'payments', label: 'Finansal İşlemler', icon: '💵' },
                            { id: 'offers', label: 'Teklifler', icon: '📝' },
                            { id: 'documents', label: 'Dosyalar & Evraklar', icon: '📁' },
                            { id: 'warranties', label: 'Garantiler', icon: '🛡️' },
                            { id: 'services', label: 'Servis', icon: '🛠️' },
                            { id: 'checks', label: 'Vadeler', icon: '📅' },
                            { id: 'reconciliations', label: 'Mutabakat', icon: '🤝' },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActiveTab(tab.id as any);
                                    if (tab.id === 'documents') fetchDocuments();
                                    if (tab.id === 'services') fetchServices();
                                }}
                                className={activeTab === tab.id
                                    ? "px-4 py-2.5 text-[12px] font-black tracking-wide text-white bg-slate-800 shadow-md border border-white/10 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap uppercase"
                                    : "px-4 py-2.5 text-[12px] font-bold tracking-wide text-slate-500 hover:text-white hover:bg-slate-800/40 transition-all rounded-lg flex items-center gap-2 whitespace-nowrap uppercase"}
                            >
                                <span className={activeTab === tab.id ? "" : "opacity-60 grayscale"}>{tab.icon}</span> {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* CONTENT AREA */}`;

const newCode = content.substring(0, startIndex) + newLayout + content.substring(endIndex + endMarker.length);
fs.writeFileSync('src/app/(app)/customers/[id]/CustomerDetailClient.tsx', newCode);
console.log("Successfully replaced layout");
