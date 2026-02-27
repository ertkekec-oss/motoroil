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

    if (loading && !data) return <div className="p-8">Yükleniyor...</div>;

    return (
        <div className="space-y-6 max-w-7xl pb-10">
            <div className="flex justify-between items-center border-b pb-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Platform Growth Finansalları</h1>
                    <p className="text-sm text-slate-500 mt-2">B2B ağındaki Discovery Engine / Boost geliri ve "Take Rate" istatistikleri.</p>
                </div>
            </div>

            {data && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white p-6 items-center justify-between border rounded shadow-sm flex flex-col items-start">
                            <div className="text-xs font-bold text-slate-400 uppercase w-full">Toplam Boost (Ek Hizmet) Geliri</div>
                            <div className="text-3xl font-bold mt-2 max-w-full text-emerald-600 self-start">
                                {Number(data.totalBoostRev).toLocaleString('tr-TR')} TRY
                            </div>
                        </div>
                        <div className="bg-emerald-900 text-white p-6 border rounded shadow-sm">
                            <div className="text-xs font-bold text-emerald-400 uppercase">Ortalama Take Rate (GMV Oranı)</div>
                            <div className="text-3xl font-bold mt-2">{data.takeRate}</div>
                            <div className="text-[10px] mt-1 text-emerald-300">Boost / GMV Gross oranlaması (Son 30 Gün)</div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border p-6">
                        <h2 className="text-sm font-bold text-slate-700 mb-4 uppercase">Gösterim (Impression) ve Hasılata Etki Eğilimi (Mock)</h2>
                        <div className="w-full h-48 bg-slate-50 border rounded flex items-end px-2 space-x-2 pb-0 overflow-hidden">
                            {data.chartData && data.chartData.map((pt: any, i: number) => (
                                <div key={i} className="flex-1 flex flex-col justify-end group relative h-full">
                                    <div className="w-full bg-blue-100 absolute bottom-0 z-0" style={{ height: `${(pt.impressions / 30000) * 100}%` }}></div>
                                    <div className="w-full bg-blue-600 transition-all z-10" style={{ height: `${Math.max((pt.revenue / (data.totalBoostRev || 1)) * 100, 5)}%` }}></div>

                                    <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 bg-slate-900 text-white text-[10px] p-2 rounded whitespace-nowrap shadow-xl z-20 transition-opacity pointers-events-none">
                                        <div className="font-bold border-b border-slate-700 pb-1 mb-1">{pt.date}</div>
                                        <div className="text-blue-300">Gösterim Payı: {pt.impressions.toLocaleString()}</div>
                                        <div className="text-emerald-400">Boost Ciro: {pt.revenue.toFixed(2)} TRY</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between w-full text-[10px] text-slate-400 mt-2 px-2 font-mono uppercase">
                            {data.chartData?.map((pt: any, i: number) => <div key={i}>{pt.date}</div>)}
                        </div>
                        <div className="flex gap-4 mt-6 text-xs text-slate-500 font-medium">
                            <span className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-600 rounded-full"></div> Gerçekleşen Boost Cirosu</span>
                            <span className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-100 rounded-full"></div> Suni Yaratılan B2B Gösterim</span>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
