
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';

export default function CEODashboardPage() {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
            return;
        }

        const fetchData = async () => {
            try {
                const res = await fetch('/api/reports/ceo-metrics');
                const json = await res.json();
                setData(json);
            } catch (error) {
                console.error("CEO Metrics Error", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [isLoading, isAuthenticated, router]);

    if (isLoading || loading) {
        return (
            <div className="min-h-screen bg-[#0f111a] flex items-center justify-center text-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <div className="animate-pulse">İş Zekası Yükleniyor...</div>
                </div>
            </div>
        );
    }

    if (!data) return <div className="text-white p-10">Veri alınamadı.</div>;

    const { metrics, briefing } = data;
    const { issues, warnings } = briefing || { issues: [], warnings: [] };

    return (
        <div className="min-h-screen bg-[#0f111a] text-white p-6 md:p-10 font-sans">

            {/* COMPACT MENU NAV */}
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400 mb-1">
                        CEO / İŞ ZEKASI KOKPİTİ
                    </h1>
                    <p className="text-sm opacity-50">Şirketinizin anlık finansal sağlık durumu ve risk analizi.</p>
                </div>
                <button onClick={() => router.back()} className="bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg text-xs font-bold transition-all">
                    ← GERİ DÖN
                </button>
            </div>

            {/* DAILY BRIEFING: BUGÜN NE YANLIŞ GİDİYOR? */}
            <div className="mb-8">
                <h2 className="text-xs font-bold opacity-50 mb-4 tracking-widest">GÜNLÜK ÖZET & RİSKLER</h2>

                {issues.length === 0 && warnings.length === 0 ? (
                    <div className="bg-gradient-to-r from-emerald-900/40 to-emerald-800/20 border border-emerald-500/30 p-6 rounded-2xl flex items-center gap-4">
                        <div className="text-4xl">✅</div>
                        <div>
                            <div className="font-bold text-emerald-400 text-lg">Her Şey Yolunda Görünüyor</div>
                            <div className="opacity-70 text-sm">Bugün için kritik bir risk, stok problemi veya finansal anomali tespit edilmedi.</div>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {issues.map((issue: any, idx: number) => (
                            <div key={idx} className="bg-gradient-to-r from-red-900/40 to-red-800/20 border border-red-500/30 p-6 rounded-2xl flex items-center gap-4 animate-pulse">
                                <div className="text-4xl">⚠️</div>
                                <div>
                                    <div className="font-bold text-red-400 text-lg">{issue.title}</div>
                                    <div className="opacity-80 text-sm">{issue.message}</div>
                                </div>
                            </div>
                        ))}
                        {warnings.map((warn: string, idx: number) => (
                            <div key={idx} className="bg-amber-900/20 border border-amber-500/20 p-4 rounded-xl flex items-center gap-3">
                                <span className="text-amber-500 font-bold">!</span>
                                <span className="text-sm opacity-80">{warn}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* METRICS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

                {/* 1. EN KARLI ÜRÜN */}
                <div className="bg-[#161b22] border border-white/5 p-6 rounded-2xl relative overflow-hidden group hover:border-indigo-500/30 transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl font-black group-hover:scale-110 transition-transform">💎</div>
                    <div className="text-[10px] font-bold text-indigo-400 mb-2 uppercase">EN KÂRLI ÜRÜN</div>
                    {metrics.mostProfitable ? (
                        <>
                            <div className="text-xl font-bold mb-1 truncate" title={metrics.mostProfitable.name}>{metrics.mostProfitable.name}</div>
                            <div className="flex items-end gap-2">
                                <span className="text-3xl font-black text-white">+{Math.round(metrics.mostProfitable.roi)}%</span>
                                <span className="text-xs text-green-400 mb-1.5 font-bold">ROI</span>
                            </div>
                            <div className="mt-4 text-xs opacity-50 bg-white/5 p-2 rounded inline-block">
                                Parça Başı Kâr: <span className="text-white font-bold">₺{metrics.mostProfitable.margin.toLocaleString()}</span>
                            </div>
                        </>
                    ) : (
                        <div className="opacity-30 py-4">Veri yok</div>
                    )}
                </div>

                {/* 2. STOKTA YATAN PARA */}
                <div className="bg-[#161b22] border border-white/5 p-6 rounded-2xl relative overflow-hidden group hover:border-blue-500/30 transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl font-black group-hover:scale-110 transition-transform">📦</div>
                    <div className="text-[10px] font-bold text-blue-400 mb-2 uppercase">STOK DEĞERİ (MALİYET)</div>
                    <div className="text-3xl font-black text-white">₺{metrics.inventoryValue?.toLocaleString()}</div>
                    <div className="mt-2 text-xs opacity-50">
                        Potansiyel Ciro: <span className="text-green-400 font-bold">₺{metrics.potentialRevenue?.toLocaleString()}</span>
                    </div>
                    <div className="mt-4 w-full bg-white/10 h-1 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full" style={{ width: '60%' }}></div>
                    </div>
                </div>

                {/* 3. SERVİSTE BEKLEYEN CİHAZ (WIP) */}
                <div className="bg-[#161b22] border border-white/5 p-6 rounded-2xl relative overflow-hidden group hover:border-amber-500/30 transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl font-black group-hover:scale-110 transition-transform">🛠️</div>
                    <div className="text-[10px] font-bold text-amber-500 mb-2 uppercase">SERVİSTE BEKLEYEN (WIP)</div>
                    <div className="text-3xl font-black text-white">₺{metrics.wipValue?.toLocaleString()}</div>
                    <div className="mt-2 text-xs opacity-50">
                        Henüz faturalanmamış, işlem gören cihazların toplam servis bedeli.
                    </div>
                </div>

                {/* 4. PERSONEL VERİMİ */}
                <div className="bg-[#161b22] border border-white/5 p-6 rounded-2xl relative overflow-hidden group hover:border-pink-500/30 transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl font-black group-hover:scale-110 transition-transform">👥</div>
                    <div className="text-[10px] font-bold text-pink-400 mb-2 uppercase">PERSONEL BAŞI CİRO (BUGÜN)</div>
                    <div className="text-3xl font-black text-white">₺{Math.round(metrics.revenuePerEmployee || 0).toLocaleString()}</div>
                    <div className="mt-2 text-xs opacity-50">
                        Aktif Personel Sayısı: <span className="text-white font-bold">{metrics.activeStaff || 0}</span>
                    </div>
                </div>

                {/* 5. MVP MÜŞTERİ */}
                <div className="md:col-span-2 bg-gradient-to-br from-purple-900/20 to-[#161b22] border border-purple-500/20 p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between">
                    <div>
                        <div className="text-[10px] font-bold text-purple-400 mb-2 uppercase">EN DEĞERLİ MÜŞTERİ (MVP)</div>
                        {metrics.mvpCustomer ? (
                            <div className="flex justify-between items-end">
                                <div>
                                    <div className="text-2xl font-bold">{metrics.mvpCustomer.name}</div>
                                    <div className="text-xs opacity-50 mt-1">Toplam Harcama Lideri</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-4xl font-black text-white">₺{metrics.mvpCustomer.total?.toLocaleString()}</div>
                                </div>
                            </div>
                        ) : (
                            <div className="opacity-30">Henüz satış verisi yok.</div>
                        )}
                    </div>
                    <div className="mt-6 flex gap-2">
                        <button className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded text-xs font-bold transition-colors">Profili İncele</button>
                        <button className="bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 px-3 py-1 rounded text-xs font-bold transition-colors">Özel İndirim Tanımla</button>
                    </div>
                </div>

            </div>

        </div>
    );
}
