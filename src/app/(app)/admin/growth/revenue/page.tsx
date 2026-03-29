"use client";
import React, { useState, useEffect } from "react";
import { TrendingUp, BarChart3, PieChart, Activity, RefreshCw } from "lucide-react";
import { EnterprisePageShell, EnterpriseCard } from "@/components/ui/enterprise";

export default function AdminGrowthRevenue() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchRevenue(); }, []);

    const fetchRevenue = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/growth/revenue`);
            if (res.ok) {
                setData(await res.json());
            }
        } finally { setLoading(false); }
    };

    const actions = (
        <div className="flex bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden p-1 shrink-0">
            <button className="px-5 py-2 text-[10px] uppercase font-black tracking-widest rounded-lg transition-all bg-slate-900 dark:bg-emerald-600 text-white shadow-sm flex items-center gap-2">
                <Activity className="w-3.5 h-3.5" /> Genel Bakış
            </button>
            <button className="px-5 py-2 text-[10px] uppercase font-black tracking-widest rounded-lg transition-all bg-transparent text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2">
                <BarChart3 className="w-3.5 h-3.5 opacity-70" /> Raporlamalar
            </button>
        </div>
    );

    return (
        <EnterprisePageShell
            title="Platform Büyüme (Growth) Analitiği"
            description="B2B ağındaki Discovery Engine / Boost görünürlük hizmet geliri ve global &quot;Take Rate&quot; istatistikleri."
            actions={actions}
            className="min-h-screen bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 font-sans w-full pb-16 focus:outline-none"
        >
            {loading && !data ? (
                <div className="p-16 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 w-full rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#1e293b] shadow-sm">
                    <RefreshCw className="w-8 h-8 animate-spin text-emerald-500 mb-4" />
                    <span className="text-[11px] font-black tracking-widest uppercase mb-1">Finansal Metrikler Yükleniyor...</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Global GMV & Boost Hasılatı hesaplanıyor</span>
                </div>
            ) : data && (
                <>
                    {/* High-Level Overview Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm relative overflow-hidden flex flex-col items-start justify-center min-h-[140px] group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/3 pointer-events-none group-hover:bg-indigo-500/10 dark:group-hover:bg-indigo-500/20 transition-all duration-500"></div>
                            <div className="flex items-center justify-between w-full mb-3 relative z-10">
                                <p className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <PieChart className="w-5 h-5 text-indigo-500 dark:text-indigo-400" /> TOPLAM BOOST (EK HİZMET) GELİRİ
                                </p>
                            </div>
                            <div className="text-[32px] lg:text-[40px] font-black text-slate-900 dark:text-white flex items-baseline gap-2 tracking-tighter relative z-10">
                                {Number(data.totalBoostRev).toLocaleString('tr-TR')} 
                                <span className="text-[16px] text-slate-400 dark:text-slate-500 font-black tracking-widest uppercase">TRY</span>
                            </div>
                        </div>

                        <div className="bg-emerald-900 dark:bg-emerald-950 border border-emerald-800 dark:border-emerald-900/50 rounded-2xl p-6 shadow-sm relative overflow-hidden flex flex-col items-start justify-center min-h-[140px] text-white group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/3 pointer-events-none group-hover:bg-emerald-500/30 transition-all duration-500"></div>
                            <div className="absolute bottom-0 right-0 p-4 opacity-10 dark:opacity-5 text-emerald-100 transform translate-x-4 translate-y-4 group-hover:-translate-y-2 group-hover:-translate-x-2 transition-transform duration-700">
                                <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                            </div>
                            <p className="text-[11px] font-black text-emerald-300 dark:text-emerald-400/80 uppercase tracking-widest mb-3 relative z-10 flex items-center gap-2">
                                <Activity className="w-5 h-5" /> ORTALAMA TAKE RATE (GMV ORANI)
                            </p>
                            <div className="text-[32px] lg:text-[40px] font-black text-white tracking-tighter relative z-10">
                                {data.takeRate}
                            </div>
                            <p className="text-[10px] font-black text-emerald-500 mt-2 relative z-10 uppercase tracking-widest px-2 py-1 bg-emerald-900/50 border border-emerald-800 rounded inline-flex shadow-sm">Ağ İçi Boost Ciro / GMV Gross Endeksi (Son 30 Gün)</p>
                        </div>
                    </div>

                    {/* Grafik Alanı */}
                    <EnterpriseCard className="overflow-hidden relative p-8">
                        {/* Background ambient glow */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-indigo-500/5 dark:bg-emerald-500/5 rounded-[100%] blur-[100px] pointer-events-none"></div>

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 relative z-10">
                            <div>
                                <h2 className="text-[13px] font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-indigo-500 dark:text-emerald-500" />
                                    Gösterim (Impression) ve Hasılata Etki Eğilimi
                                </h2>
                                <p className="text-[11px] font-bold leading-relaxed opacity-90 text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">Platform içi satıcı sponsorluklarının zaman/gelir dönüşüm grafiği kurgusu.</p>
                            </div>
                            <div className="flex flex-wrap gap-4 text-[10px] uppercase text-slate-600 dark:text-slate-300 font-black tracking-widest bg-slate-50 dark:bg-slate-900/50 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/5 shadow-[inset_0_1px_4px_rgba(0,0,0,0.05)]">
                                <span className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-slate-900 dark:bg-emerald-500 rounded border border-slate-700 dark:border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]"></div> Gerçekleşen Boost Cirosu
                                </span>
                                <span className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-slate-200 dark:bg-slate-700/80 rounded border border-slate-300 dark:border-slate-600"></div> Suni Yaratılan Gösterim
                                </span>
                            </div>
                        </div>

                        {/* Chart Structure Container */}
                        <div className="w-full h-[350px] bg-transparent border-t border-b border-slate-100 dark:border-slate-800/60 flex items-end px-2 pt-10 space-x-2 pb-0 relative z-10">
                            {/* Grid Lines Behind Chart */}
                            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none p-4 pb-0 opacity-40 dark:opacity-20 z-0">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="w-full border-b border-dashed border-slate-300 dark:border-slate-500 h-0 flex-1 relative">
                                        {/* Y-axis mock labels */}
                                        {i % 2 === 0 && <span className="absolute -top-2 -left-3 text-[9px] font-mono font-black tracking-widest text-slate-400 dark:text-slate-600 -translate-x-full">
                                            {100 - i * 20}%
                                        </span>}
                                    </div>
                                ))}
                            </div>

                            {data.chartData && data.chartData.map((pt: any, i: number) => {
                                // Calculate height ratio based on data max values
                                const maxRev = Math.max(...data.chartData.map((d: any) => d.revenue));
                                const maxImp = Math.max(...data.chartData.map((d: any) => d.impressions));
                                
                                const revenueHeight = Math.max((pt.revenue / (maxRev || 1)) * 95, 5); // 95% max to leave breathing room
                                const impressionHeight = Math.max((pt.impressions / (maxImp || 1)) * 95, 5);

                                return (
                                    <div key={i} className="flex-1 flex flex-col justify-end group relative h-full z-10 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors rounded-t-xl px-0.5 md:px-1">
                                        
                                        {/* Impression Bar (Background) */}
                                        <div className="w-full bg-slate-100 dark:bg-slate-800/80 absolute bottom-0 z-0 rounded-t-md transition-all duration-700 border-x border-t border-transparent dark:border-slate-700/50" 
                                            style={{ height: `${impressionHeight}%` }}>
                                        </div>

                                        {/* Revenue Bar */}
                                        <div className="w-full bg-slate-900 dark:bg-gradient-to-t dark:from-emerald-600/80 dark:to-emerald-400 dark:shadow-[0_0_15px_rgba(52,211,153,0.15)] transition-all duration-700 z-10 rounded-t-lg relative flex items-end justify-center" 
                                            style={{ height: `${revenueHeight}%` }}>
                                            {/* Bar highlight top edge */}
                                            <div className="absolute top-0 left-0 right-0 h-1.5 bg-white/20 dark:bg-white/40 rounded-t-lg"></div>
                                            {/* Inner glow line for dark mode */}
                                            <div className="hidden dark:block absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[1px] bg-gradient-to-b from-white/30 to-transparent"></div>
                                        </div>

                                        {/* Advanced Tooltip */}
                                        <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-4 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-[#0f172a] border border-slate-800 dark:border-white/10 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] z-30 transition-all duration-200 pointer-events-none min-w-[180px] transform group-hover:-translate-y-2 rounded-xl overflow-hidden flex flex-col">
                                            <div className="bg-slate-800 dark:bg-slate-900/50 px-4 py-2 text-center border-b border-slate-700 dark:border-white/5">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">{pt.date}</span>
                                            </div>
                                            <div className="p-3 bg-slate-900 dark:bg-[#1e293b] space-y-2">
                                                <div className="flex justify-between items-center bg-slate-800/50 dark:bg-black/20 px-2 py-1.5 rounded-lg border border-slate-700/50 dark:border-white/5">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gösterim</span>
                                                    <span className="text-[11px] font-mono font-bold text-white tracking-widest">{pt.impressions.toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between items-center bg-emerald-900/40 dark:bg-emerald-500/10 px-2 py-1.5 rounded-lg border border-emerald-800/50 dark:border-emerald-500/20">
                                                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Ciro (TRY)</span>
                                                    <span className="text-[11px] font-mono font-black text-emerald-400 tracking-widest">{pt.revenue.toFixed(2)}</span>
                                                </div>
                                            </div>
                                            {/* Tooltip arrow */}
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-solid border-[6px] border-transparent border-t-slate-900 dark:border-t-slate-800"></div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* X-Axis Labels */}
                        <div className="flex justify-between w-full text-[10px] font-black text-slate-500 dark:text-slate-400 mt-2 px-2 uppercase tracking-widest pt-4 relative z-10">
                            {data.chartData?.map((pt: any, i: number) => (
                                <div key={i} className="text-center flex-1 overflow-hidden text-ellipsis whitespace-nowrap px-1 opacity-60 hover:opacity-100 transition-opacity">
                                    {pt.date.split(' ').slice(0, 2).join(' ')}
                                </div>
                            ))}
                        </div>
                    </EnterpriseCard>
                </>
            )}
        </EnterprisePageShell>
    );
}
