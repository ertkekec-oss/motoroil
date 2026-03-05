import React, { useState, useEffect } from 'react';
import { PackageOpen, TrendingDown, ArrowUpRight, TrendingUp, AlertTriangle, CheckCircle2, Factory, Bot, LineChart, FileText, Activity } from 'lucide-react';

export function DailyBriefPanel({ onClose }: { onClose: () => void }) {
    return (
        <div className="bg-white dark:bg-[#0f172a] border-l-4 border-l-blue-600 border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm p-6 mb-6 animate-in slide-in-from-top-4">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Bot className="w-5 h-5 text-blue-600" />
                        Daily Inventory Brief
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Sistem tarafından analiz edilen günlük stratejik aksiyon özeti.</p>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg hover:bg-slate-50 dark:bg-[#1e293b] transition-colors border border-transparent hover:border-slate-200 dark:border-white/5">
                    Bugünlük Gizle
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 shadow-sm flex flex-col justify-between">
                    <span className="text-rose-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5"><AlertTriangle className="w-3 h-3" /> Kritik Stokta</span>
                    <div className="text-xl font-black text-slate-900 dark:text-white mt-2">0 Ürün</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 shadow-sm flex flex-col justify-between">
                    <span className="text-orange-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5"><TrendingUp className="w-3 h-3" /> Hızlı Tükenen</span>
                    <div className="text-xl font-black text-slate-900 dark:text-white mt-2">0 Ürün</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 shadow-sm flex flex-col justify-between">
                    <span className="text-amber-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5"><TrendingDown className="w-3 h-3" /> Marj Düşen</span>
                    <div className="text-xl font-black text-slate-900 dark:text-white mt-2">0 Ürün</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 shadow-sm flex flex-col justify-between">
                    <span className="text-emerald-600 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5"><LineChart className="w-3 h-3" /> Fazla Stok Değeri</span>
                    <div className="text-xl font-black text-slate-900 dark:text-white mt-2">₺0</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 shadow-sm flex flex-col justify-between">
                    <span className="text-indigo-600 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5"><PackageOpen className="w-3 h-3" /> Transfer Önerisi</span>
                    <div className="text-xl font-black text-slate-900 dark:text-white mt-2">0 Ürün</div>
                </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-white/5 flex justify-end">
                <button className="text-[13px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors">
                    Detaya Git <ArrowUpRight className="w-4 h-4 ml-1" />
                </button>
            </div>
        </div>
    );
}

export function WeeklyHealthReport({ onClose }: { onClose: () => void }) {
    return (
        <div className="fixed inset-y-0 right-0 w-full md:w-[480px] bg-white dark:bg-[#0f172a] border-l border-slate-200 dark:border-white/5 shadow-2xl z-[5000] flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-[#1e293b]/50">
                <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Activity className="w-5 h-5 text-emerald-600" />
                        Weekly Health Report
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Envanter sağlığı ve trend analizi</p>
                </div>
                <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-200/50 text-slate-500 dark:text-slate-400 transition-colors">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">

                {/* Main KPI */}
                <div className="flex flex-col items-center justify-center p-6 bg-slate-900 rounded-2xl text-white shadow-sm">
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Inventory Health Score</span>
                    <div className="text-5xl font-black mt-2 text-emerald-400">78<span className="text-xl text-slate-500 dark:text-slate-400">/100</span></div>
                    <div className="flex gap-4 mt-6 w-full px-4">
                        <div className="flex-1 text-center"><div className="text-[10px] text-slate-400 uppercase">Stok Riski</div><div className="font-bold text-emerald-400">65</div></div>
                        <div className="flex-1 text-center border-l border-slate-700"><div className="text-[10px] text-slate-400 uppercase">Marj Stabilite</div><div className="font-bold text-emerald-400">82</div></div>
                        <div className="flex-1 text-center border-l border-slate-700"><div className="text-[10px] text-slate-400 uppercase">Depo Denge</div><div className="font-bold text-amber-400">74</div></div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900 dark:text-white">Key Metrics</h3>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-xl p-4">
                            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Ortalama Stok Gün</div>
                            <div className="text-lg font-black text-slate-900 dark:text-white mt-1">42 Gün</div>
                        </div>
                        <div className="bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-xl p-4">
                            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Fazla Stok Oranı</div>
                            <div className="text-lg font-black text-slate-900 dark:text-white mt-1">%14.2</div>
                        </div>
                        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                            <div className="text-[11px] font-bold text-emerald-700 uppercase">Kritik Stok Trendi</div>
                            <div className="flex items-center gap-1 text-lg font-black text-emerald-700 mt-1"><TrendingDown className="w-5 h-5" /> %8 Azaldı</div>
                        </div>
                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                            <div className="text-[11px] font-bold text-amber-700 uppercase">Marj Değişimi</div>
                            <div className="flex items-center gap-1 text-lg font-black text-amber-700 mt-1"><TrendingDown className="w-5 h-5" /> -%1.2</div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900 dark:text-white">En Çok Satan 5 Ürün</h3>
                    <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-xl divide-y divide-slate-100 overflow-hidden">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="flex items-center justify-between p-3 text-sm">
                                <span className="font-medium text-slate-700 dark:text-slate-300">Premium Madeni Yağ 5W-30 {i}</span>
                                <span className="font-bold text-emerald-600">+142 Satış</span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
            <div className="p-4 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-[#1e293b]">
                <button className="w-full py-2.5 bg-slate-900 text-white rounded-xl font-semibold text-sm hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
                    <FileText className="w-4 h-4" /> Raporu İndir (PDF)
                </button>
            </div>
        </div>
    )
}

export function FocusQueueTab({ products }: { products: any[] }) {
    // Empty dummy data array to hide demo info
    const anomalies: any[] = [];

    return (
        <div className="space-y-4 animate-in fade-in">
            <div className="bg-white dark:bg-[#0f172a] p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm transition-all hover:shadow-md">
                <div className="mb-6 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-50 text-amber-600">
                                <AlertTriangle className="w-4 h-4" />
                            </span>
                            Otonom Müdahale Kuyruğu
                            <div className="group relative inline-flex items-center justify-center pointer-events-auto ml-1">
                                <span className="text-slate-400 group-hover:text-slate-600 dark:text-slate-400 w-3.5 h-3.5 inline-flex items-center justify-center border border-current rounded-full text-[9px] font-bold">?</span>
                                <div className="opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-xl shadow-md text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed z-[100] pointer-events-none font-normal text-center whitespace-normal">
                                    Bugün sistem tarafından analiz edilerek müdahale gerektiren ürünler.
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-[6px] border-transparent border-t-white z-10"></div>
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-[7px] border-transparent border-t-slate-200"></div>
                                </div>
                            </div>
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium ml-10">Algoritmik önceliklendirilmiş aksiyon listesi.</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-[#1e293b] border-b border-slate-200 dark:border-white/5">
                            <tr>
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Risk Tipi</th>
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ürün</th>
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tahmini Etkisi</th>
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Önerilen Aksiyon</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Operasyon</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {anomalies.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-400">
                                        Müdahale edilecek bir anomali bulunamadı.
                                    </td>
                                </tr>
                            )}
                            {anomalies.map((a, i) => (
                                <tr key={i} className="hover:bg-slate-50 dark:bg-[#1e293b] transition-colors group">
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${i === 0 ? 'bg-rose-50 text-rose-600 border border-rose-100' : i === 1 ? 'bg-amber-50 text-amber-600 border border-amber-100' : i === 2 ? 'bg-slate-50 text-slate-600 border border-slate-200' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'}`}>{a.type}</span>
                                    </td>
                                    <td className="px-4 py-3 text-[13px] font-bold text-slate-900 dark:text-white">{a.product}</td>
                                    <td className="px-4 py-3 text-[13px] font-bold text-slate-600 dark:text-slate-400">{a.impact}</td>
                                    <td className="px-4 py-3 text-[13px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                                            <Bot className="w-3 h-3" />
                                        </div>
                                        {a.action}
                                    </td>
                                    <td className="px-4 py-3 text-right whitespace-nowrap">
                                        <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm inline-flex items-center gap-1">
                                            Hemen Uygula
                                        </button>
                                        <button className="px-3 py-1.5 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-50 rounded-lg text-xs font-bold transition-colors shadow-sm ml-2">
                                            Detay
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-[#0f172a] border-l-4 border-l-amber-500 p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2"><Activity className="w-4 h-4 text-amber-500" /> Smart Simulation (What-If)</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Senaryo tabanlı stratejik karar motoru.</p>

                    <div className="space-y-3">
                        <div className="text-center text-xs text-slate-400 py-4">Tahmin modelleri için yeterli veri toplanması bekleniyor.</div>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#0f172a] border-l-4 border-l-emerald-500 p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Anomaly Tracker (Audit)</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Gerçek zamanlı sistem denetimi anomali kayıtları.</p>

                    <div className="space-y-3">
                        <div className="text-center text-xs text-slate-400 py-4">Sistem denetimleri şu anda beklemede. Herhangi bir risk tespit edilmedi.</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function ExecutiveSummaryMode({ products }: { products: any[] }) {
    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-6 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600">
                            <Activity className="w-3.5 h-3.5" />
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Stok Sağlık Skoru</span>
                    </div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white mt-2">0<span className="text-lg text-slate-400 font-bold">/100</span></div>
                    <div className="mt-4">
                        <div className="w-full bg-slate-100 dark:bg-[#334155]/50 rounded-full h-1.5">
                            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '0%' }}></div>
                        </div>
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-blue-50 text-blue-600">
                            <TrendingDown className="w-3.5 h-3.5" />
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Ortalama Devir Süresi</span>
                    </div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white mt-2">0 <span className="text-lg text-slate-400 font-bold">Gün</span></div>
                    <div className="mt-4 flex items-center text-[11px] font-bold text-emerald-600 gap-1 bg-transaparent w-max rounded-md">
                        Veri Bekleniyor
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600">
                            <PackageOpen className="w-3.5 h-3.5" />
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Atıl Stok Tutarı</span>
                    </div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white mt-2">₺0</div>
                    <div className="mt-4 flex items-center text-[11px] font-bold text-amber-600 gap-1 bg-transparent w-max rounded-md">
                        Veri Bekleniyor
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-rose-50 text-rose-600">
                            <AlertTriangle className="w-3.5 h-3.5" />
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Kritik SKU Sayısı</span>
                    </div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white mt-2">0</div>
                    <div className="mt-4 flex items-center text-[11px] font-bold text-rose-600 gap-1 bg-transparent w-max rounded-md">
                        Mevcut Risk Yok
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-[#0f172a] border-slate-200 dark:border-white/5 rounded-2xl shadow-sm p-6 border">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Stratejik Risk Dağılımı</h3>
                <div className="flex gap-4 items-end h-40 mt-8">
                    <div className="flex-1 flex flex-col justify-end items-center gap-2">
                        <div className="w-full bg-red-100 rounded-t-xl hover:bg-red-200 transition-colors" style={{ height: '30%' }}></div>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Fazla Stok</span>
                    </div>
                    <div className="flex-1 flex flex-col justify-end items-center gap-2">
                        <div className="w-full bg-blue-100 rounded-t-xl hover:bg-blue-200 transition-colors" style={{ height: '70%' }}></div>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Sağlıklı</span>
                    </div>
                    <div className="flex-1 flex flex-col justify-end items-center gap-2">
                        <div className="w-full bg-amber-100 rounded-t-xl hover:bg-amber-200 transition-colors" style={{ height: '20%' }}></div>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Kritik Sınır</span>
                    </div>
                    <div className="flex-1 flex flex-col justify-end items-center gap-2">
                        <div className="w-full bg-emerald-100 rounded-t-xl hover:bg-emerald-200 transition-colors" style={{ height: '80%' }}></div>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Optimum</span>
                    </div>
                    <div className="flex-1 flex flex-col justify-end items-center gap-2">
                        <div className="w-full bg-orange-100 rounded-t-xl hover:bg-orange-200 transition-colors" style={{ height: '15%' }}></div>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Marj Risk</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function RiskScoreIndicator({ score }: { score: number }) {
    let colorClass = 'text-slate-500 bg-slate-100';
    if (score >= 80) colorClass = 'text-red-700 bg-red-100';
    else if (score >= 50) colorClass = 'text-amber-700 bg-amber-100';

    return (
        <span className={`px-2 py-1 rounded text-[11px] font-bold uppercase tracking-wider ${colorClass}`}>
            Risk: {score}
        </span>
    );
}

export function ExcessStockB2BButton({ count }: { count: number }) {
    if (!count) return null;
    return (
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors shadow-sm">
            <Factory className="w-4 h-4" />
            <div className="text-left">
                <div className="text-[10px] font-bold uppercase tracking-wider">B2B Açılış Önerisi</div>
                <div className="text-xs font-semibold">{count} Ürünü Taslak Gönder</div>
            </div>
        </button>
    )
}
