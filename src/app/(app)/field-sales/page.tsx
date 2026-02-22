
"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function FieldSalesAgentDashboard() {
    const { user } = useAuth();
    const router = useRouter();
    const [targets, setTargets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/staff/targets?mine=true');
                if (res.ok) {
                    const data = await res.json();
                    setTargets(Array.isArray(data) ? data : []);
                }
            } catch (err) {
                console.error('Fetch targets error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="p-8 text-white">Yükleniyor...</div>;

    return (
        <div className="p-6 md:p-12 min-h-screen bg-[#0f111a] text-white">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-12">
                    <div>
                        <h1 className="text-4xl font-black tracking-tight mb-2">Saha Satış Paneli</h1>
                        <p className="text-gray-400">Hoş geldin. Bugünün hedefleri ve rotan aşağıda.</p>
                    </div>
                    <button
                        onClick={() => router.push('/field-mobile/routes')}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-blue-900/20 flex items-center gap-2"
                    >
                        <span>📱</span> MOBİL GÖRÜNÜME GEÇ
                    </button>
                </div>

                {/* Targets Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {targets.map((t: any) => {
                        const progress = t.targetValue > 0 ? Math.round((t.currentValue / t.targetValue) * 100) : 0;
                        return (
                            <div key={t.id} className="bg-[#161b22] border border-white/5 p-6 rounded-3xl relative overflow-hidden">
                                <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">
                                    {t.type === 'TURNOVER' ? '💰 Satış Hedefi' : '📍 Ziyaret Hedefi'}
                                </div>
                                <div className="flex justify-between items-end mb-4">
                                    <div className="text-3xl font-black">
                                        {t.type === 'TURNOVER' ? `₺${t.currentValue.toLocaleString()}` : `${t.currentValue} / ${t.targetValue}`}
                                    </div>
                                    <div className="text-blue-400 font-bold text-lg">%{progress}</div>
                                </div>
                                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ${progress >= 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                                        style={{ width: `${Math.min(progress, 100)}%` }}
                                    />
                                </div>
                                {t.type === 'TURNOVER' && (
                                    <div className="mt-3 text-[10px] text-gray-500 font-bold">Hedef: ₺{t.targetValue.toLocaleString()}</div>
                                )}
                            </div>
                        );
                    })}
                    {targets.length === 0 && (
                        <div className="col-span-3 bg-white/5 border border-dashed border-white/10 p-12 rounded-3xl text-center text-gray-500">
                            Henüz atanmış bir hedefiniz bulunmuyor.
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    <div
                        onClick={() => router.push('/field-mobile/routes')}
                        className="bg-gradient-to-br from-blue-600 to-blue-700 p-8 rounded-3xl shadow-xl shadow-blue-900/20 cursor-pointer hover:scale-[1.02] transition-all group"
                    >
                        <div className="text-4xl mb-4 group-hover:animate-bounce">🏁</div>
                        <h2 className="text-2xl font-black mb-1">Rotalarım</h2>
                        <p className="text-blue-100/70 text-sm">Aktif rotalar ve ziyaretler.</p>
                        <div className="mt-6 flex items-center gap-2 font-bold text-sm">GİT ➔</div>
                    </div>

                    <div
                        onClick={() => router.push('/field-mobile/customers')}
                        className="bg-[#161b22] border border-white/5 p-8 rounded-3xl cursor-pointer hover:border-white/20 transition-all group"
                    >
                        <div className="text-4xl mb-4 group-hover:rotate-12 transition-transform">👥</div>
                        <h2 className="text-2xl font-black mb-1">Müşterilerim</h2>
                        <p className="text-gray-400 text-sm">Portföyünüz ve hesap ekstresi.</p>
                        <div className="mt-6 flex items-center gap-2 font-bold text-sm text-blue-400">GÖR ➔</div>
                    </div>

                    <div
                        onClick={() => router.push('/field-mobile/reports')}
                        className="bg-[#161b22] border border-white/5 p-8 rounded-3xl cursor-pointer hover:border-white/20 transition-all group"
                    >
                        <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">📊</div>
                        <h2 className="text-2xl font-black mb-1">Raporlarım</h2>
                        <p className="text-gray-400 text-sm">Satış ve performans analizi.</p>
                        <div className="mt-6 flex items-center gap-2 font-bold text-sm text-blue-400">İNCELE ➔</div>
                    </div>

                    <div
                        onClick={() => router.push('/field-mobile/expenses')}
                        className="bg-[#161b22] border border-white/5 p-8 rounded-3xl cursor-pointer hover:border-white/20 transition-all group"
                    >
                        <div className="text-4xl mb-4 group-hover:animate-pulse">💸</div>
                        <h2 className="text-2xl font-black mb-1">Masraflarım</h2>
                        <p className="text-gray-400 text-sm">Harcamaları girin ve yönetin.</p>
                        <div className="mt-6 flex items-center gap-2 font-bold text-sm text-blue-400">YÖNET ➔</div>
                    </div>

                    <div
                        onClick={() => router.push('/field-mobile/targets')}
                        className="bg-[#161b22] border border-white/5 p-8 rounded-3xl cursor-pointer hover:border-white/20 transition-all group"
                    >
                        <div className="text-4xl mb-4 group-hover:translate-x-1 transition-transform">🎯</div>
                        <h2 className="text-2xl font-black mb-1">Hedef Detayları</h2>
                        <p className="text-gray-400 text-sm">Primalar ve hedef ilerlemesi.</p>
                        <div className="mt-6 flex items-center gap-2 font-bold text-sm text-blue-400">DETAY ➔</div>
                    </div>

                    <div
                        onClick={() => router.push('/field-mobile/visits')}
                        className="bg-[#161b22] border border-white/5 p-8 rounded-3xl cursor-pointer hover:border-white/20 transition-all group"
                    >
                        <div className="text-4xl mb-4 group-hover:rotate-12 transition-transform">📝</div>
                        <h2 className="text-2xl font-black mb-1">Geçmiş</h2>
                        <p className="text-gray-400 text-sm">Geçmiş ziyaret kayıtları.</p>
                        <div className="mt-6 flex items-center gap-2 font-bold text-sm text-blue-400">LİSTELE ➔</div>
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <span className="text-2xl">📱</span>
                        <div>
                            <h3 className="font-bold text-lg">Mobil Uygulama Olarak Kullanın</h3>
                            <p className="text-xs text-gray-400">Saha çalışmalarınızda en iyi deneyim için telefonunuza yükleyin.</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-black/30 p-4 rounded-2xl border border-white/5">
                            <div className="text-[10px] font-black text-gray-500 uppercase mb-2">ADIM 1</div>
                            <div className="text-sm">Telefonunuzun tarayıcısından <b>periodya.com/field-mobile</b> adresine gidin.</div>
                        </div>
                        <div className="bg-black/30 p-4 rounded-2xl border border-white/5">
                            <div className="text-[10px] font-black text-gray-500 uppercase mb-2">ADIM 2</div>
                            <div className="text-sm">Tarayıcı menüsünden <b>"Ana Ekrana Ekle"</b> seçeneğine dokunun.</div>
                        </div>
                        <div className="bg-black/30 p-4 rounded-2xl border border-white/5">
                            <div className="text-[10px] font-black text-gray-500 uppercase mb-2">ADIM 3</div>
                            <div className="text-sm">Artık sistem telefonunuzda bir uygulama gibi çalışacaktır!</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
