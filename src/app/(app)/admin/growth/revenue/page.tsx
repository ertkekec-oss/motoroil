"use client";
import React, { useState, useEffect } from "react";

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

    if (loading && !data) return (
        <div className="bg-slate-50 min-h-screen flex items-center justify-center p-12 w-full font-sans">
            <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center items-center">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin mb-4"></div>
                <span className="text-sm font-medium text-slate-500 uppercase tracking-widest">FİNANSAL METRİKLER YÜKLENİYOR...</span>
            </div>
        </div>
    );

    return (
        <div className="bg-slate-50 min-h-screen pb-16 w-full font-sans">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 mb-8">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight mb-1">
                            Platform Büyüme (Growth) Analitiği
                        </h1>
                        <p className="text-sm text-slate-600">
                            B2B ağındaki Discovery Engine / Boost görünürlük hizmet geliri ve global "Take Rate" istatistikleri.
                        </p>
                    </div>

                    <div className="flex bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden p-1 shrink-0">
                        <button className="px-4 py-1.5 text-[13px] font-semibold rounded-md transition-colors bg-slate-900 text-white shadow-sm">
                            Genel Bakış
                        </button>
                        <button className="px-4 py-1.5 text-[13px] font-semibold rounded-md transition-colors bg-transparent text-slate-700 hover:text-slate-900 hover:bg-slate-50">
                            Raporlamalar
                        </button>
                    </div>
                </div>

                {data && (
                    <>
                        {/* High-Level Overview Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden flex flex-col items-start justify-center h-32">
                                <p className="text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-2">TOPLAM BOOST (EK HİZMET) GELİRİ</p>
                                <div className="text-[32px] font-bold text-slate-900 flex items-baseline gap-2">
                                    {Number(data.totalBoostRev).toLocaleString('tr-TR')} <span className="text-[16px] text-slate-500 font-medium">TRY</span>
                                </div>
                            </div>

                            <div className="bg-emerald-900 border border-emerald-950 rounded-2xl p-6 shadow-sm relative overflow-hidden flex flex-col items-start justify-center h-32 text-white">
                                <div className="absolute top-0 right-0 p-4 opacity-20">
                                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                                </div>
                                <p className="text-[12px] font-bold text-emerald-400 uppercase tracking-widest mb-2 relative z-10">ORTALAMA TAKE RATE (GMV ORANI)</p>
                                <div className="text-[32px] font-bold text-white relative z-10">
                                    {data.takeRate}
                                </div>
                                <p className="text-[11px] font-medium text-emerald-300 mt-1 relative z-10">Ağ İçi Boost Ciro / GMV Gross Endeksi (Son 30 Günlük Dilim)</p>
                            </div>
                        </div>

                        {/* Grafik Alanı */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                                <div>
                                    <h2 className="text-base font-semibold text-slate-900">Gösterim (Impression) ve Hasılata Etki Eğilimi</h2>
                                    <p className="text-[13px] text-slate-500 mt-1">Platform içi satıcı sponsorluklarının zaman/gelir dönüşüm grafiği kurgusu.</p>
                                </div>
                                <div className="flex gap-4 text-[12px] text-slate-600 font-semibold bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
                                    <span className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-slate-900 rounded-sm"></div> Gerçekleşen Boost Cirosu
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-slate-200 rounded-sm"></div> Suni Yaratılan Gösterim
                                    </span>
                                </div>
                            </div>

                            {/* Dummy/Mock Chart Structure Container */}
                            <div className="w-full h-80 bg-white border border-slate-100 rounded-xl flex items-end px-4 pt-10 space-x-3 pb-0 overflow-hidden relative">
                                {/* Grid Lines Behind Chart */}
                                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none p-4 pb-0 opacity-40">
                                    {[...Array(5)]?.map((_, i) => (
                                        <div key={i} className="w-full border-b border-dashed border-slate-300 h-0 flex-1"></div>
                                    ))}
                                </div>

                                {data.chartData && data.chartData?.map((pt: any, i: number) => {
                                    // Calculate responsive heights
                                    const rawRevenueHeight = Math.max((pt.revenue / (data.totalBoostRev || 1)) * 100, 5);
                                    // Scale up revenue visualization so it's not all tiny
                                    const revenueHeight = Math.min(rawRevenueHeight * 3, 100);

                                    return (
                                        <div key={i} className="flex-1 flex flex-col justify-end group relative h-full z-10 hover:bg-slate-50/50 transition-colors rounded-t-sm">
                                            {/* Impression Bar (Background effect) */}
                                            <div className="w-full bg-slate-100 absolute bottom-0 z-0 rounded-t-sm transition-all duration-500" style={{ height: `${Math.min((pt.impressions / 25000) * 100, 100)}%` }}></div>

                                            {/* Revenue Bar */}
                                            <div className="w-full bg-slate-900 transition-all duration-500 z-10 rounded-t-sm relative shadow-sm" style={{ height: `${revenueHeight}%` }}>
                                                {/* Hover Highlight top edge */}
                                                <div className="absolute top-0 left-0 right-0 h-1 bg-white/20"></div>
                                            </div>

                                            {/* Tooltip */}
                                            <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[11px] p-3 rounded-xl shadow-xl z-30 transition-all duration-200 pointer-events-none min-w-[150px] transform group-hover:-translate-y-1">
                                                <div className="font-bold border-b border-slate-700/50 pb-2 mb-2 uppercase tracking-wide text-slate-300">{pt.date}</div>
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-slate-400">Gösterim:</span>
                                                    <span className="font-mono font-bold text-white">{pt.impressions.toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between items-center bg-slate-800/50 -mx-1 px-1 py-0.5 rounded">
                                                    <span className="text-emerald-400 font-bold">Ciro:</span>
                                                    <span className="font-mono font-bold text-emerald-400">{pt.revenue.toFixed(2)} ₺</span>
                                                </div>

                                                {/* Tooltip arrow */}
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-solid border-4 border-transparent border-t-slate-900"></div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            {/* X-Axis Labels */}
                            <div className="flex justify-between w-full text-[11px] font-bold text-slate-400 mt-4 px-4 uppercase tracking-widest border-t border-slate-100 pt-4">
                                {data.chartData?.map((pt: any, i: number) => (
                                    <div key={i} className="text-center flex-1">{pt.date.split(' ').slice(0, 2).join(' ')}</div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
