
"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function LiveFieldTrackingPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshInterval, setRefreshInterval] = useState(30000); // 30s auto-refresh

    const fetchData = async () => {
        try {
            const res = await fetch('/api/field-sales/admin/live-status');
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, refreshInterval);
        return () => clearInterval(interval);
    }, [refreshInterval]);

    if (loading && !data) return <div className="p-12 text-white/50 animate-pulse">Sistem yükleniyor...</div>;

    return (
        <div className="p-8 max-w-[1600px] mx-auto min-h-screen">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-white mb-2">Canlı Saha Takibi</h1>
                    <p className="text-gray-500 font-medium">Saha operasyonlarının anlık durumunu buradan izleyebilirsiniz.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-ping"></div>
                        <span className="text-[10px] font-black text-white/70 uppercase tracking-widest">Canlı Yayın</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Active Visits Section */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <span>🛰️</span> Şu An Sahada Olanlar
                            <span className="bg-blue-600 text-[10px] px-2 py-0.5 rounded-full ml-2">
                                {data?.activeVisits?.length || 0} AKTİF
                            </span>
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {data?.activeVisits?.map((visit: any) => {
                            const duration = Math.floor((Date.now() - new Date(visit.checkInTime).getTime()) / (1000 * 60));
                            return (
                                <div key={visit.id} className="bg-[#161b22] border border-blue-500/20 p-6 rounded-3xl relative overflow-hidden group hover:border-blue-500/50 transition-all">
                                    <div className="absolute top-0 right-0 p-4">
                                        <div className="bg-green-500/10 text-green-400 text-[10px] font-black px-2 py-1 rounded-lg uppercase">
                                            {duration} DK. ÖNCE GİRDİ
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-blue-900/40">
                                            👤
                                        </div>
                                        <div>
                                            <div className="text-white font-black text-lg leading-tight">{visit.staff?.name}</div>
                                            <div className="text-gray-500 text-xs font-bold uppercase tracking-wider">{visit.staff?.phone || 'Telefon Yok'}</div>
                                        </div>
                                    </div>
                                    <div className="bg-black/30 p-4 rounded-2xl border border-white/5">
                                        <div className="text-[10px] font-black text-gray-500 uppercase mb-1">Müşteri & Konum</div>
                                        <div className="text-white font-bold">{visit.customer?.name}</div>
                                        <div className="text-gray-500 text-xs">{visit.customer?.district}, {visit.customer?.city}</div>
                                    </div>
                                </div>
                            );
                        })}
                        {data?.activeVisits?.length === 0 && (
                            <div className="col-span-2 bg-white/5 border border-dashed border-white/10 p-12 rounded-3xl text-center text-gray-500">
                                Şu an aktif bir ziyaret bulunmuyor.
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Activity Timeline */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <span>🕒</span> Son Hareketler
                    </h2>
                    <div className="bg-[#161b22] border border-white/5 rounded-3xl p-6 h-[calc(100vh-250px)] overflow-y-auto custom-scrollbar">
                        <div className="space-y-8">
                            {data?.recentVisits?.map((visit: any) => {
                                const orderTotal = visit.orders?.reduce((sum: number, o: any) => sum + Number(o.totalAmount), 0) || 0;
                                const collectionTotal = visit.transactions?.reduce((sum: number, t: any) => sum + Number(t.amount), 0) || 0;

                                return (
                                    <div key={visit.id} className="relative pl-8 border-l-2 border-white/5">
                                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-gray-800 border-2 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                                        <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">
                                            {new Date(visit.checkOutTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        <div className="text-white font-bold mb-1">{visit.staff?.name}</div>
                                        <div className="text-gray-500 text-sm mb-3">
                                            <span className="text-blue-400">{visit.customer?.name}</span> ziyareti tamamlandı.
                                        </div>
                                        {(orderTotal > 0 || collectionTotal > 0) && (
                                            <div className="flex gap-2">
                                                {orderTotal > 0 && (
                                                    <span className="bg-green-500/10 text-green-500 text-[9px] font-black px-2 py-1 rounded uppercase">
                                                        🛒 ₺{orderTotal.toLocaleString()}
                                                    </span>
                                                )}
                                                {collectionTotal > 0 && (
                                                    <span className="bg-amber-500/10 text-amber-500 text-[9px] font-black px-2 py-1 rounded uppercase">
                                                        💰 ₺{collectionTotal.toLocaleString()}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            {data?.recentVisits?.length === 0 && (
                                <div className="text-center text-gray-600 py-10 italic">Henüz bir hareket yok.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
            `}</style>
        </div>
    );
}
