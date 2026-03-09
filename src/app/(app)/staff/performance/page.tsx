"use client";

import React, { useEffect, useState } from 'react';
import { EnterprisePageShell, EnterpriseCard, EnterpriseSectionHeader } from '@/components/ui/enterprise';
import { Target, TrendingUp, Award, Zap, Trophy, TrendingDown, Info, ShieldCheck } from 'lucide-react';

export default function StaffPerformanceDashboard() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        // Fetch current staff's theoretical performance data 
        fetch('/api/hr/performance/dashboard')
            .then(res => res.json())
            .then(res => {
                if (res.success) {
                    setData(res.data);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    if (loading) return <div className="p-10 text-center text-slate-500 font-medium">Performans verileri yükleniyor...</div>;

    // Fallback static structure if no real assignments
    const fallbackData = {
        stats: {
            target: "1.000.000,00 ₺",
            actual: "1.150.000,00 ₺",
            achievement: "%115",
            bonus: "45.000,00 ₺"
        },
        leaderboard: { rank: 2, totalScores: 7800 },
        achievements: ["FIRST_SALE", "CONSISTENCY", "TARGET_CRUSHER"],
        aiSuggested: { safe: "1.200.000 ₺", balanced: "1.450.000 ₺", aggressive: "1.800.000 ₺" }
    };

    const displayData = data && data.assignments.length > 0 ? data : fallbackData;

    return (
        <EnterprisePageShell
            title="Sales Performance Engine"
            description="Dönemsel hedefleriniz, bonus kazanımınız ve gamification durumunuz."
            actions={<button className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-sm font-medium">Hedef İtiraz / Revize</button>}
        >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-fade-in">

                {/* KPI Cards */}
                <EnterpriseCard className="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/40 dark:to-slate-900 border-indigo-100 dark:border-indigo-900/40">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg">
                            <Target className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">DÖNEM HEDEFİ</span>
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white mt-4">{displayData.stats.target}</div>
                </EnterpriseCard>

                <EnterpriseCard className="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/40 dark:to-slate-900 border-emerald-100 dark:border-emerald-900/40">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-lg">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">GERÇEKLEŞEN</span>
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white mt-4">{displayData.stats.actual}</div>
                </EnterpriseCard>

                <EnterpriseCard className="bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/40 dark:to-slate-900 border-amber-100 dark:border-amber-900/40">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 rounded-lg">
                            <Zap className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">BAŞARI ORANI (ACH.)</span>
                    </div>
                    <div className="text-2xl font-black text-amber-600 dark:text-amber-500 mt-4">{displayData.stats.achievement}</div>
                    <p className="text-xs text-amber-500 font-medium mt-1">100% üzeri +1.2x Accelerator!</p>
                </EnterpriseCard>

                <EnterpriseCard className="bg-gradient-to-br from-violet-50 to-white dark:from-violet-950/40 dark:to-slate-900 border-violet-100 dark:border-violet-900/40">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400 rounded-lg">
                            <Award className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">KAZANILAN BONUS</span>
                    </div>
                    <div className="text-2xl font-black text-violet-700 dark:text-violet-400 mt-4">{displayData.stats.bonus}</div>
                </EnterpriseCard>

                {/* Gamification Area */}
                <div className="md:col-span-2 space-y-6">
                    <EnterpriseCard>
                        <EnterpriseSectionHeader title="Gamification & Rozetler" subtitle="Oyunlaştırma profiliniz." icon={<Trophy />} />
                        <div className="flex flex-wrap gap-4 mt-4">
                            {displayData.achievements.map((badge: string, idx: number) => (
                                <div key={idx} className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-32 text-center shadow-sm">
                                    <ShieldCheck className="w-8 h-8 text-indigo-500 mb-2" />
                                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">{badge.replace('_', ' ')}</span>
                                </div>
                            ))}
                        </div>
                    </EnterpriseCard>

                    <EnterpriseCard>
                        <EnterpriseSectionHeader title="Sıralama (Leaderboard)" subtitle="Şirket içi mevcut durumunuz." />
                        <div className="flex items-center justify-between p-4 bg-slate-900 text-white rounded-xl">
                            <div>
                                <p className="text-xs text-slate-400 uppercase font-bold tracking-widest">Global Sıra</p>
                                <p className="text-3xl font-black mt-1">#{displayData.leaderboard.rank}</p>
                            </div>
                            <Trophy className="w-12 h-12 text-amber-400" />
                        </div>
                    </EnterpriseCard>
                </div>

                {/* AI Targets Area */}
                <div className="md:col-span-2">
                    <EnterpriseCard className="h-full">
                        <EnterpriseSectionHeader title="Periodya AI Hedef Önerileri" subtitle="Geçmiş büyüme frekansınıza göre hesaplanan simülasyon hedefleri." icon={<Info />} />

                        <div className="space-y-4">
                            <div className="p-4 border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-xl flex justify-between items-center">
                                <div>
                                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase">SAFE (GÜVENLİ)</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">%5 Doğal Büyüme</p>
                                </div>
                                <span className="text-lg font-bold text-slate-900 dark:text-white">{displayData.aiSuggested.safe}</span>
                            </div>

                            <div className="p-4 border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl flex justify-between items-center">
                                <div>
                                    <p className="text-xs font-bold text-blue-600 dark:text-blue-500 uppercase">BALANCED (DENGELİ)</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">%12 Dengeli Büyüme</p>
                                </div>
                                <span className="text-lg font-bold text-slate-900 dark:text-white">{displayData.aiSuggested.balanced}</span>
                            </div>

                            <div className="p-4 border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-900/10 rounded-xl border-l-4 border-l-rose-500 flex justify-between items-center">
                                <div>
                                    <p className="text-xs font-bold text-rose-600 dark:text-rose-500 uppercase flex items-center gap-1">
                                        <Zap className="w-3 h-3" /> AGGRESSIVE (YIKICI)
                                    </p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">%25 Yüksek Perf.</p>
                                </div>
                                <span className="text-lg font-bold text-slate-900 dark:text-white">{displayData.aiSuggested.aggressive}</span>
                            </div>
                        </div>
                    </EnterpriseCard>
                </div>

            </div>
        </EnterprisePageShell>
    );
}
