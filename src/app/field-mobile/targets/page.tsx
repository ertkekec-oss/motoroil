
"use client";

import { useEffect, useState } from 'react';

export default function MobileTargetsPage() {
    const [targets, setTargets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTargets = async () => {
            try {
                const res = await fetch('/api/staff/targets?mine=true');
                if (res.ok) {
                    const data = await res.json();
                    setTargets(data || []);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchTargets();
    }, []);

    return (
        <div className="flex flex-col min-h-full bg-[#0f111a] p-6">
            <h1 className="text-2xl font-black mb-8">Hedeflerim</h1>

            <div className="space-y-6">
                {loading ? (
                    <div className="text-center py-12 opacity-50">Yükleniyor...</div>
                ) : targets.length > 0 ? (
                    targets.map((t) => (
                        <div key={t.id} className="bg-[#161b22] border border-white/5 p-6 rounded-[2rem] relative overflow-hidden">
                            {/* Background decoration */}
                            <div className="absolute -right-4 -top-4 text-6xl opacity-[0.03] rotate-12 pointer-events-none">
                                {t.type === 'TURNOVER' ? '💰' : '📍'}
                            </div>

                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">
                                        {t.type === 'TURNOVER' ? 'Satış Hedefi' : 'Ziyaret Hedefi'}
                                    </div>
                                    <div className="text-xs text-gray-500 font-bold uppercase tracking-tighter">
                                        {new Date(t.startDate).toLocaleDateString('tr-TR')} - {new Date(t.endDate).toLocaleDateString('tr-TR')}
                                    </div>
                                </div>
                                <div className="text-2xl font-black text-blue-400">%{Math.round(t.progressPercent)}</div>
                            </div>

                            <div className="flex justify-between items-end mb-4">
                                <div className="text-3xl font-black">
                                    {t.type === 'TURNOVER' ? `₺${t.currentValue.toLocaleString()}` : t.currentValue}
                                </div>
                                <div className="text-gray-500 font-bold text-xs">
                                    Hedef: {t.type === 'TURNOVER' ? `₺${Number(t.targetValue).toLocaleString()}` : t.targetValue}
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="h-3 bg-white/5 rounded-full overflow-hidden mb-6">
                                <div
                                    className={`h-full rounded-full transition-all duration-1000 ${t.progressPercent >= 100 ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'bg-blue-500'}`}
                                    style={{ width: `${Math.min(t.progressPercent, 100)}%` }}
                                />
                            </div>

                            {/* Reward Details */}
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                                <div>
                                    <div className="text-[9px] font-black text-gray-600 uppercase mb-1">Beklenen Prim</div>
                                    <div className="text-sm font-black text-green-400">₺{t.estimatedBonus?.toLocaleString()}</div>
                                </div>
                                <div>
                                    <div className="text-[9px] font-black text-gray-600 uppercase mb-1">Periyot</div>
                                    <div className="text-sm font-black text-gray-400">{t.period === 'MONTHLY' ? 'Aylık' : 'Haftalık'}</div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 opacity-30 border border-dashed border-white/10 rounded-3xl">
                        Atanmış aktif hedefiniz bulunmuyor.
                    </div>
                )}
            </div>
        </div>
    );
}
