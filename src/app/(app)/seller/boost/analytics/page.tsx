"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import FinanceStatusBanner from "@/components/FinanceStatusBanner";

export default function BoostAnalyticsPage() {
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState<any>({
        impressionsToday: 0,
        impressions7d: 0,
        impressions30d: 0,
        ctr: "2.4%",
        spend: 1500,
        topListings: [],
        series: []
    });

    useEffect(() => {
        setLoading(true);
        fetch("/api/seller/boost/analytics")
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data) {
                    setMetrics((prev: any) => ({
                        ...prev,
                        impressionsToday: data.kpis?.impressionsToday || 0,
                        impressions7d: data.kpis?.impressions7d || 0,
                        impressions30d: data.kpis?.impressions30d || 0,
                        topListings: (data.topListings || []).map((l: any, i: number) => ({
                            id: l.listingId || `list-${i}`,
                            name: l.title || "Ürün",
                            impressions: l.impressions || 0,
                            clicks: Math.floor((l.impressions || 0) * 0.024),
                            spendRatio: "15%" // Mocked visualization
                        })),
                        series: data.series || []
                    }));
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const formatMoney = (amount: number) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(amount);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">📈 Boost Performansı</h1>
                    <p className="text-sm text-slate-500 mt-1">Sponsorlu ürün gösterimleriniz ve etkileşim analiziniz</p>
                </div>
                <Link href="/seller/boost">
                    <button className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm">Geri Dön</button>
                </Link>
            </div>

            <FinanceStatusBanner />

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm col-span-1 md:col-span-2 grid grid-cols-3 divide-x divide-slate-100">
                    <div className="pr-4 py-2">
                        <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Bugün</p>
                        <p className="text-xl font-bold text-indigo-700">{metrics.impressionsToday.toLocaleString()}</p>
                    </div>
                    <div className="px-4 py-2">
                        <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">7 Gün</p>
                        <p className="text-2xl font-bold text-indigo-800">{metrics.impressions7d.toLocaleString()}</p>
                    </div>
                    <div className="pl-4 py-2">
                        <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">30 Gün</p>
                        <p className="text-3xl font-extrabold text-indigo-900">{metrics.impressions30d.toLocaleString()}</p>
                        <div className="text-[10px] text-slate-400 mt-2 font-medium break-words">Toplam Sponsorlu Gösterim</div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
                    <p className="text-sm font-semibold text-slate-500 mb-1">Tıklama Oranı (CTR)</p>
                    <p className="text-3xl font-bold text-slate-900">{metrics.ctr}</p>
                    <div className="text-xs text-green-600 mt-2 font-medium bg-green-50 inline-block px-2 py-1 rounded max-w-max">Sektör Avg: ~1.8%</div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
                    <p className="text-sm font-semibold text-slate-500 mb-1">Aylık Bütçe Harcaması</p>
                    <p className="text-3xl font-bold text-slate-900">{formatMoney(metrics.spend)}</p>
                    <div className="text-xs text-slate-500 mt-2 font-medium bg-slate-100 inline-block px-2 py-1 rounded max-w-max">Sabit Katman Faturası</div>
                </div>
            </div>

            {/* Chart + Table Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Chart Placeholder */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm p-6 flex flex-col items-center justify-center min-h-[350px]">
                    <div className="w-full mb-4 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-slate-800">Günlük Trend Analizi (30 Gün)</h2>
                        <div className="flex gap-2">
                            <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
                            <span className="text-xs text-slate-500 font-semibold">Gösterimler</span>
                        </div>
                    </div>
                    <div className="flex-1 w-full bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                        {loading ? 'Yükleniyor...' : 'Grafik Görünümü Hazırlanıyor... (Recharts / Chart.js entegrasyonu)'}
                    </div>
                </div>

                {/* Top Listings Table */}
                <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col text-sm">
                    <div className="px-5 py-4 border-b border-slate-200 bg-slate-50">
                        <h2 className="text-base font-bold text-slate-800">En Başarılı Ürünler</h2>
                        <p className="text-xs text-slate-500">Gösterim bazında (Son 30 gün)</p>
                    </div>
                    <div className="divide-y divide-slate-100 flex-1 overflow-y-auto max-h-[400px]">
                        {loading ? (
                            <div className="p-8 text-center text-slate-400">Yükleniyor...</div>
                        ) : (
                            metrics.topListings.map((listing: any, index: number) => (
                                <div key={listing.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center gap-3">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">{index + 1}</div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-800 truncate" title={listing.name}>{listing.name}</p>
                                        <div className="flex justify-between mt-1 text-xs">
                                            <span className="text-slate-500"><span className="font-semibold text-indigo-600">{listing.impressions.toLocaleString()}</span> Gös.</span>
                                            <span className="text-slate-400">{listing.clicks} Tık</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-1 mt-2">
                                            <div className="bg-indigo-400 h-1 rounded-full" style={{ width: listing.spendRatio }}></div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
