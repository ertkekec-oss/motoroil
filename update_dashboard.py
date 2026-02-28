import sys

file_path = r'c:\Users\ertke\OneDrive\Masaüstü\periodya\muhasebeapp\motoroil\src\app\(app)\test-desktop\ClientDashboard.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = lines[:516]

widget_grid_code = """                    {/* WIDGET GRID */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">

                        {/* 1. NAKİT AKIŞI & LİKİDİTE */}
                        <div className="group relative flex flex-col rounded-[18px] border border-[#0F172A]/[0.06] dark:border-white/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.85))] dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.75),rgba(15,23,42,0.55))] p-6 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-5px_rgba(0,0,0,0.08)] dark:shadow-none hover:border-[#0F172A]/[0.1] dark:hover:border-white/[0.1] transition-all duration-160">
                            <div className="absolute left-0 top-6 bottom-6 w-[3px] rounded-r-[3px] bg-slate-300 dark:bg-slate-700 shadow-[0_0_8px_rgba(148,163,184,0.3)] group-hover:shadow-[0_0_12px_rgba(148,163,184,0.4)] transition-all duration-160"></div>
                            
                            <div className="flex justify-between items-center mb-6 pl-2">
                                <div className="flex items-center gap-3">
                                    <Wallet className="w-[18px] h-[18px] text-slate-500" strokeWidth={2.5} />
                                    <h3 className="text-[14px] font-semibold text-slate-900 dark:text-white">Finans & Likidite</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 dark:bg-blue-500/10 rounded-md">Ledger SoT</span>
                                    <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                                    </button>
                                </div>
                            </div>
                            
                            <div className="pl-2 mb-6">
                                <p className="text-[11px] uppercase tracking-[0.08em] font-semibold text-slate-500 mb-1.5">Net Likidite</p>
                                <div className="text-[32px] font-[600] tracking-tight text-slate-900 dark:text-slate-100 leading-none">
                                    {loading ? "..." : formatter.format(d?.escrowPending || 0)}
                                </div>
                            </div>
                            
                            <div className="pl-2 flex gap-6 mb-6">
                                <div>
                                    <p className="text-[11px] uppercase tracking-[0.08em] font-[600] text-slate-500 mb-1">Tahsilat</p>
                                    <div className="text-[15px] font-[500] text-slate-700 dark:text-slate-300">
                                        {loading ? "..." : formatter.format(d?.collectedThisMonth || 0)}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[11px] uppercase tracking-[0.08em] font-[600] text-slate-500 mb-1">Ödeme</p>
                                    <div className="text-[15px] font-[500] text-slate-700 dark:text-slate-300">
                                        {loading ? "..." : formatter.format((d?.escrowPending || 0) * 0.4)}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="pl-2 mt-auto">
                                <div className="bg-white/50 dark:bg-slate-800/30 border border-slate-200/50 dark:border-white/5 rounded-xl p-3 backdrop-blur-sm">
                                    <div className="flex justify-between items-center mb-1.5">
                                        <span className="text-[11px] uppercase tracking-[0.08em] font-semibold text-slate-500">Kasa Durumu</span>
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[13px] font-[500] text-slate-600 dark:text-slate-400">Nakit / Havale</span>
                                            <span className="text-[13px] font-[500] text-slate-800 dark:text-slate-200">{loading ? "..." : formatter.format((d?.cashDetails?.cash || 0) + (d?.cashDetails?.wire || 0))}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[13px] font-[500] text-slate-600 dark:text-slate-400">Kredi Kartı</span>
                                            <span className="text-[13px] font-[500] text-slate-800 dark:text-slate-200">{loading ? "..." : formatter.format(d?.cashDetails?.creditCard || 0)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 h-6 w-full opacity-60">
                                    <svg viewBox="0 0 100 24" preserveAspectRatio="none" className="w-full h-full stroke-blue-500 dark:stroke-blue-400 fill-none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M0,20 L10,18 L20,22 L30,12 L40,16 L50,8 L60,10 L70,4 L80,6 L90,2 L100,5" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* 2. STOK & DEPO SAĞLIĞI */}
                        <div className="group relative flex flex-col rounded-[18px] border border-[#0F172A]/[0.06] dark:border-white/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.85))] dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.75),rgba(15,23,42,0.55))] p-6 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-5px_rgba(0,0,0,0.08)] dark:shadow-none hover:border-[#0F172A]/[0.1] dark:hover:border-white/[0.1] transition-all duration-160">
                            <div className={`absolute left-0 top-6 bottom-6 w-[3px] rounded-r-[3px] transition-all duration-160 ${(d?.stockHealth?.lowStock || 0) > 0 ? 'bg-amber-500 dark:bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.3)] group-hover:shadow-[0_0_12px_rgba(245,158,11,0.4)]' : 'bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)] group-hover:shadow-[0_0_12px_rgba(16,185,129,0.4)]'}`}></div>
                            
                            <div className="flex justify-between items-center mb-6 pl-2">
                                <div className="flex items-center gap-3">
                                    <PackageSearch className="w-[18px] h-[18px] text-slate-500" strokeWidth={2.5} />
                                    <h3 className="text-[14px] font-semibold text-slate-900 dark:text-white">Depo & Stok Sağlığı</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md ${(d?.stockHealth?.lowStock || 0) > 0 ? 'text-amber-600 bg-amber-50 dark:bg-amber-500/10' : 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10'}`}>
                                        {(d?.stockHealth?.lowStock || 0) > 0 ? 'Riskli' : 'Sağlıklı'}
                                    </span>
                                    <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                                    </button>
                                </div>
                            </div>
                            
                            <div className="pl-2 mb-6">
                                <p className="text-[11px] uppercase tracking-[0.08em] font-semibold text-slate-500 mb-1.5">Aktif SKU</p>
                                <div className="text-[32px] font-[600] tracking-tight text-slate-900 dark:text-slate-100 leading-none">
                                    {loading ? "..." : d?.stockHealth?.totalSku || 0}
                                </div>
                            </div>
                            
                            <div className="pl-2 flex gap-4 mb-6 flex-wrap">
                                <div className="mr-2">
                                    <p className="text-[11px] uppercase tracking-[0.08em] font-[600] text-slate-500 mb-1">Kritik Stok</p>
                                    <div className={`text-[15px] font-[500] ${(d?.stockHealth?.lowStock || 0) > 0 ? 'text-red-500 dark:text-red-400 font-semibold' : 'text-slate-700 dark:text-slate-300'}`}>
                                        {loading ? "..." : d?.stockHealth?.lowStock || 0}
                                    </div>
                                </div>
                                <div className="mr-2">
                                    <p className="text-[11px] uppercase tracking-[0.08em] font-[600] text-slate-500 mb-1">Fazla</p>
                                    <div className="text-[15px] font-[500] text-slate-700 dark:text-slate-300">
                                        {loading ? "..." : d?.stockHealth?.overStock || 0}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[11px] uppercase tracking-[0.08em] font-[600] text-slate-500 mb-1">Sevkiyat</p>
                                    <div className="text-[15px] font-[500] text-blue-600 dark:text-blue-400">
                                        {loading ? "..." : d?.stockHealth?.inShipment || 0}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="pl-2 mt-auto">
                                <div className="flex justify-between text-[11px] uppercase tracking-[0.08em] font-semibold text-slate-500 mb-1.5">
                                    <span>Health Score</span>
                                    <span>%84</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full w-[84%]"></div>
                                </div>
                            </div>
                        </div>

                        {/* 3. VARDİYA & PDKS */}
                        {(isAuthorized(["SUPER_ADMIN", "ADMIN", "HR", "RISK"])) && (
                        <div className="group relative flex flex-col rounded-[18px] border border-[#0F172A]/[0.06] dark:border-white/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.85))] dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.75),rgba(15,23,42,0.55))] p-6 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-5px_rgba(0,0,0,0.08)] dark:shadow-none hover:border-[#0F172A]/[0.1] dark:hover:border-white/[0.1] transition-all duration-160">
                            <div className="absolute left-0 top-6 bottom-6 w-[3px] rounded-r-[3px] bg-slate-300 dark:bg-slate-700 shadow-[0_0_8px_rgba(148,163,184,0.3)] group-hover:shadow-[0_0_12px_rgba(148,163,184,0.4)] transition-all duration-160"></div>
                            
                            <div className="flex justify-between items-center mb-6 pl-2">
                                <div className="flex items-center gap-3">
                                    <Fingerprint className="w-[18px] h-[18px] text-slate-500" strokeWidth={2.5} />
                                    <h3 className="text-[14px] font-semibold text-slate-900 dark:text-white">Vardiya & PDKS</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-md">LIVE</span>
                                    <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                                    </button>
                                </div>
                            </div>
                            
                            <div className="pl-2 mb-6">
                                <p className="text-[11px] uppercase tracking-[0.08em] font-semibold text-slate-500 mb-1.5">Aktif Personel</p>
                                <div className="text-[32px] font-[600] tracking-tight text-slate-900 dark:text-slate-100 leading-none">
                                    {loading ? "..." : d?.pdksRules?.currentStaffCount || 0}
                                </div>
                            </div>
                            
                            <div className="pl-2 flex gap-4 mb-6 flex-wrap">
                                <div className="mr-2">
                                    <p className="text-[11px] uppercase tracking-[0.08em] font-[600] text-slate-500 mb-1">Giriş Yapan</p>
                                    <div className="text-[15px] font-[500] text-emerald-600 dark:text-emerald-400">
                                        {loading ? "..." : d?.pdksRules?.checkedInCount || 0}
                                    </div>
                                </div>
                                <div className="mr-2">
                                    <p className="text-[11px] uppercase tracking-[0.08em] font-[600] text-slate-500 mb-1">İzinli/Yok</p>
                                    <div className="text-[15px] font-[500] text-slate-700 dark:text-slate-300">
                                        {loading ? "..." : d?.pdksRules?.notCheckedInCount || 0}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[11px] uppercase tracking-[0.08em] font-[600] text-slate-500 mb-1">Geç Kalan</p>
                                    <div className={`text-[15px] font-[500] ${(d?.pdksRules?.lateCount || 0) > 0 ? 'text-amber-500 dark:text-amber-400 font-semibold' : 'text-slate-700 dark:text-slate-300'}`}>
                                        {loading ? "..." : d?.pdksRules?.lateCount || 0}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="pl-2 mt-auto">
                                <div className="mt-4 flex items-end gap-1 h-6 w-full opacity-70">
                                    {[40, 70, 45, 90, 65, 85, 100].map((h, i) => (
                                        <div key={i} className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-[2px]" style={{ height: `${h}%` }}></div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        )}

                        {/* 4. SERVİS & BAKIM */}
                        {(isAuthorized(["SUPER_ADMIN", "ADMIN", "STAFF", "SELLER"])) && (
                        <div className="group relative flex flex-col rounded-[18px] border border-[#0F172A]/[0.06] dark:border-white/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.85))] dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.75),rgba(15,23,42,0.55))] p-6 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-5px_rgba(0,0,0,0.08)] dark:shadow-none hover:border-[#0F172A]/[0.1] dark:hover:border-white/[0.1] transition-all duration-160">
                            <div className="absolute left-0 top-6 bottom-6 w-[3px] rounded-r-[3px] bg-slate-300 dark:bg-slate-700 shadow-[0_0_8px_rgba(148,163,184,0.3)] group-hover:shadow-[0_0_12px_rgba(148,163,184,0.4)] transition-all duration-160"></div>
                            
                            <div className="flex justify-between items-center mb-6 pl-2">
                                <div className="flex items-center gap-3">
                                    <HeadphonesIcon className="w-[18px] h-[18px] text-slate-500" strokeWidth={2.5} />
                                    <h3 className="text-[14px] font-semibold text-slate-900 dark:text-white">Servis & Bakım Ağı</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-md">UPDATED</span>
                                    <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                                    </button>
                                </div>
                            </div>
                            
                            <div className="pl-2 mb-6">
                                <p className="text-[11px] uppercase tracking-[0.08em] font-semibold text-slate-500 mb-1.5">Şu an Serviste Olan</p>
                                <div className="text-[32px] font-[600] tracking-tight text-slate-900 dark:text-slate-100 leading-none">
                                    {loading ? "..." : d?.serviceDesk?.currentlyInService || 0}
                                </div>
                            </div>
                            
                            <div className="pl-2 flex gap-6 mb-6">
                                <div>
                                    <p className="text-[11px] uppercase tracking-[0.08em] font-[600] text-slate-500 mb-1">Yeni Kayıt</p>
                                    <div className="text-[15px] font-[500] text-slate-700 dark:text-slate-300">
                                        +{loading ? "..." : d?.serviceDesk?.enteredToday || 0}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[11px] uppercase tracking-[0.08em] font-[600] text-slate-500 mb-1">Bekleyen</p>
                                    <div className="text-[15px] font-[500] text-slate-700 dark:text-slate-300">
                                        14
                                    </div>
                                </div>
                            </div>
                            
                            <div className="pl-2 mt-auto">
                                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                     <div className="h-full bg-blue-500 w-[60%] rounded-full"></div>
                                </div>
                                <div className="flex justify-between text-[10px] mt-1.5 font-semibold text-slate-400 uppercase tracking-widest">
                                    <span>Kapasite</span>
                                    <span>%60</span>
                                </div>
                            </div>
                        </div>
                        )}

                        {/* 5. E-BELGE */}
                        {(isAuthorized(["SUPER_ADMIN", "ADMIN", "FINANCE", "RISK"])) && (
                        <div className="group relative flex flex-col rounded-[18px] border border-[#0F172A]/[0.06] dark:border-white/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.85))] dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.75),rgba(15,23,42,0.55))] p-6 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-5px_rgba(0,0,0,0.08)] dark:shadow-none hover:border-[#0F172A]/[0.1] dark:hover:border-white/[0.1] transition-all duration-160">
                            <div className="absolute left-0 top-6 bottom-6 w-[3px] rounded-r-[3px] bg-slate-300 dark:bg-slate-700 shadow-[0_0_8px_rgba(148,163,184,0.3)] group-hover:shadow-[0_0_12px_rgba(148,163,184,0.4)] transition-all duration-160"></div>
                            
                            <div className="flex justify-between items-center mb-6 pl-2">
                                <div className="flex items-center gap-3">
                                    <FileText className="w-[18px] h-[18px] text-slate-500" strokeWidth={2.5} />
                                    <h3 className="text-[14px] font-semibold text-slate-900 dark:text-white">E-Belge İşlemleri</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-md">SYNCING</span>
                                    <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                                    </button>
                                </div>
                            </div>
                            
                            <div className="pl-2 mb-6">
                                <p className="text-[11px] uppercase tracking-[0.08em] font-semibold text-slate-500 mb-1.5">Onay Bekleyen</p>
                                <div className="text-[32px] font-[600] tracking-tight text-slate-900 dark:text-slate-100 leading-none">
                                    {loading ? "..." : d?.invoiceStatus?.pending || 0}
                                </div>
                            </div>
                            
                            <div className="pl-2 flex gap-6 mb-6">
                                <div>
                                    <p className="text-[11px] uppercase tracking-[0.08em] font-[600] text-slate-500 mb-1">Gelen (Hafta)</p>
                                    <div className="text-[15px] font-[500] text-slate-700 dark:text-slate-300">
                                        {loading ? "..." : d?.invoiceStatus?.incoming || 0}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[11px] uppercase tracking-[0.08em] font-[600] text-slate-500 mb-1">Giden (Hafta)</p>
                                    <div className="text-[15px] font-[500] text-slate-700 dark:text-slate-300">
                                        {loading ? "..." : d?.invoiceStatus?.outgoing || 0}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="pl-2 mt-auto">
                                <div className="flex items-center gap-1.5 pt-2">
                                    {[...Array(12)].map((_, i) => (
                                        <div key={i} className={`h-1.5 rounded-full flex-1 ${i < 8 ? 'bg-slate-300 dark:bg-slate-600' : 'bg-slate-100 dark:bg-slate-800'}`}></div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        )}

                        {/* 6. OTONOM FİYATLANDIRMA */}
                        {(isAuthorized(["SUPER_ADMIN", "ADMIN", "FINANCE", "RISK"])) && (
                        <div className="group relative flex flex-col rounded-[18px] border border-[#0F172A]/[0.06] dark:border-white/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.85))] dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.75),rgba(15,23,42,0.55))] p-6 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-5px_rgba(0,0,0,0.08)] dark:shadow-none hover:border-[#0F172A]/[0.1] dark:hover:border-white/[0.1] transition-all duration-160">
                            <div className="absolute left-0 top-6 bottom-6 w-[3px] rounded-r-[3px] bg-blue-600 dark:bg-blue-500 shadow-[0_0_8px_rgba(37,99,235,0.3)] group-hover:shadow-[0_0_12px_rgba(37,99,235,0.4)] transition-all duration-160"></div>
                            
                            <div className="flex justify-between items-center mb-6 pl-2">
                                <div className="flex items-center gap-3">
                                    <Activity className="w-[18px] h-[18px] text-slate-500" strokeWidth={2.5} />
                                    <h3 className="text-[14px] font-semibold text-slate-900 dark:text-white">Otonom Fiyatlandırma</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 dark:bg-blue-500/10 rounded-md">AUTOPILOT</span>
                                    <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                                    </button>
                                </div>
                            </div>
                            
                            <div className="pl-2 mb-6">
                                <p className="text-[11px] uppercase tracking-[0.08em] font-semibold text-slate-500 mb-1.5">Güncellenen SKU</p>
                                <div className="text-[32px] font-[600] tracking-tight text-slate-900 dark:text-slate-100 leading-none">
                                    {loading ? "..." : d?.autonomous?.updatedProducts || 0}
                                </div>
                            </div>
                            
                            <div className="pl-2 flex gap-6 mb-6 flex-wrap">
                                <div>
                                    <p className="text-[11px] uppercase tracking-[0.08em] font-[600] text-slate-500 mb-1">Marj Etkisi</p>
                                    <div className="text-[15px] font-[500] text-emerald-600 dark:text-emerald-400">
                                        +{loading ? "..." : d?.autonomous?.avgMarginChange || 0}%
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[11px] uppercase tracking-[0.08em] font-[600] text-slate-500 mb-1">Riskli Sapma</p>
                                    <div className={`text-[15px] font-[500] ${(d?.autonomous?.riskyDeviation || 0) > 0 ? 'text-amber-500 dark:text-amber-400 font-semibold' : 'text-slate-700 dark:text-slate-300'}`}>
                                        {loading ? "..." : d?.autonomous?.riskyDeviation || 0} Ürün
                                    </div>
                                </div>
                            </div>
                            
                            <div className="pl-2 mt-auto">
                                <div className="h-6 w-full opacity-60">
                                    <svg viewBox="0 0 100 24" preserveAspectRatio="none" className="w-full h-full stroke-slate-400 dark:stroke-slate-500 fill-none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M0,12 L15,14 L30,8 L45,16 L60,6 L75,10 L90,2 L100,5" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                        )}

                        {/* 7. ONAYLAR & ALARMLAR */}
                        <div className="col-span-1 lg:col-span-2 2xl:col-span-3 group relative flex flex-col rounded-[18px] border border-[#0F172A]/[0.06] dark:border-white/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.85))] dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.75),rgba(15,23,42,0.55))] p-6 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-5px_rgba(0,0,0,0.08)] dark:shadow-none hover:border-[#0F172A]/[0.1] dark:hover:border-white/[0.1] transition-all duration-160">
                            <div className={`absolute left-0 top-6 bottom-6 w-[3px] rounded-r-[3px] transition-all duration-160 ${(d?.notificationsApp?.criticalAlerts || 0) > 0 ? 'bg-red-500 dark:bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.3)] group-hover:shadow-[0_0_12px_rgba(239,68,68,0.4)]' : 'bg-slate-300 dark:bg-slate-700 shadow-[0_0_8px_rgba(148,163,184,0.3)] group-hover:shadow-[0_0_12px_rgba(148,163,184,0.4)]'}`}></div>
                            
                            <div className="flex justify-between items-center mb-6 pl-2">
                                <div className="flex items-center gap-3">
                                    <Bell className="w-[18px] h-[18px] text-slate-500" strokeWidth={2.5} />
                                    <h3 className="text-[14px] font-semibold text-slate-900 dark:text-white">Onaylar & Alarmlar</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    {(d?.notificationsApp?.criticalAlerts || 0) > 0 ? (
                                        <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-red-600 bg-red-50 dark:bg-red-500/10 rounded-md flex items-center gap-1.5">İKAZ</span>
                                    ) : (
                                        <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-md">NORMAL</span>
                                    )}
                                    <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                                    </button>
                                </div>
                            </div>
                            
                            <div className="pl-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <p className="text-[11px] uppercase tracking-[0.08em] font-[600] text-slate-500 mb-1">Bekleyen Onaylar</p>
                                    <div className="text-[32px] font-[600] tracking-tight text-slate-900 dark:text-slate-100 leading-none mb-2">
                                        {loading ? "..." : d?.notificationsApp?.pendingApprovals || 0}
                                    </div>
                                    <p className="text-[13px] font-[500] text-slate-500 dark:text-slate-400">Fatura, Escrow ve Sözleşme işlemleri onayınızı bekliyor.</p>
                                </div>
                                
                                <div>
                                    <p className="text-[11px] uppercase tracking-[0.08em] font-[600] text-slate-500 mb-1">Okunmamış Bildirim</p>
                                    <div className="text-[32px] font-[600] tracking-tight text-blue-600 dark:text-blue-400 leading-none mb-2">
                                        {loading ? "..." : d?.notificationsApp?.newNotifications || 0}
                                    </div>
                                    <p className="text-[13px] font-[500] text-slate-500 dark:text-slate-400">Sistem güncellemeleri ve teknik bülten uyarıları.</p>
                                </div>
                                
                                <div>
                                    <p className="text-[11px] uppercase tracking-[0.08em] font-[600] text-slate-500 mb-1">Riskli / Kaçak İşlem</p>
                                    <div className={`text-[32px] font-[600] tracking-tight leading-none mb-2 ${(d?.notificationsApp?.criticalAlerts || 0) > 0 ? 'text-red-500 dark:text-red-400' : 'text-slate-900 dark:text-slate-100'}`}>
                                        {loading ? "..." : d?.notificationsApp?.criticalAlerts || 0}
                                    </div>
                                    <p className="text-[13px] font-[500] text-slate-500 dark:text-slate-400">Sistem dışı tespit edilen veya güvenlik kuralına takılanlar.</p>
                                </div>
                            </div>
                        </div>
"""

end_lines = lines[781:] # from 782 onwards (0-indexed)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
    f.write(widget_grid_code + '\n')
    f.writelines(end_lines)
