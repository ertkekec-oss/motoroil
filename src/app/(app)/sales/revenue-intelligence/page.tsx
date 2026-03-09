"use client";

import React, { useEffect, useState } from 'react';
import { EnterprisePageShell, EnterpriseCard, EnterpriseSectionHeader, EnterpriseTable, EnterpriseButton } from '@/components/ui/enterprise';
import { LineChart, Zap, Target, TrendingUp, AlertTriangle, Lightbulb, Compass, Award } from 'lucide-react';

export default function RevenueIntelligenceDashboard() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        fetch('/api/sales/revenue-intelligence')
            .then(res => res.json())
            .then(res => {
                if (res.success && res.data) {
                    setData(res.data);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const formatCurr = (val: string | number) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(Number(val));
    };

    if (loading) return <div className="p-16 text-center text-slate-500 font-medium">✨ AI Satış Analiz Motoru Çalışıyor...</div>;

    if (!data || data.forecasts.length === 0) {
        return (
            <EnterprisePageShell title="Revenue Intelligence" description="Sales Forecast + Performance Coaching Motoru">
                <div className="p-16 text-center text-slate-500 font-medium">Veri bulunamadı. Lütfen sayfayı yenileyin.</div>
            </EnterprisePageShell>
        );
    }

    return (
        <EnterprisePageShell
            title="Revenue Intelligence Engine"
            description="AI Destekli Satış Tahmini, Risk Analizi ve Hızlandırılmış Hedef Önerileri."
        >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in relative pb-20">

                {/* 1. SALES FORECAST (Tahminlemeler) (Col-span 3) */}
                <div className="md:col-span-3">
                    <EnterpriseCard>
                        <EnterpriseSectionHeader title="Satış Tahminleme (AI Forecast)" subtitle="Geçmiş büyüme frekansları ve sezonluk indeksler kullanılarak hesaplanır." icon={<LineChart />} />
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {data.forecasts.map((f: any) => (
                                <div key={f.id} className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 shadow-sm flex flex-col justify-between">
                                    <div className="flex justify-between items-start mb-4">
                                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">{f.periodType.replace('_', ' ')}</h4>
                                        <span className="px-2 py-1 text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400 rounded-md font-bold">% {f.confidenceScore} Güven Oranı</span>
                                    </div>
                                    <div className="text-3xl font-black text-slate-900 dark:text-white truncate">
                                        {formatCurr(f.expectedSales)}
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-2 font-medium">Büyüme: %{((f.factors?.growthRate || 1.0) - 1.0) * 100} — Sezonluk İndeks: {f.factors?.seasonality || 1.0}x</p>
                                </div>
                            ))}
                        </div>
                    </EnterpriseCard>
                </div>

                {/* 2. SALES COACHING INSIGHTS */}
                <div className="md:col-span-2 space-y-6">
                    <EnterpriseCard>
                        <EnterpriseSectionHeader title="Satış Koçluğu & Aksiyon Önerileri (Insights)" icon={<Compass />} />
                        <div className="space-y-4">
                            {data.insights.map((insight: any) => {
                                let icon = <Lightbulb className="w-5 h-5 text-indigo-500" />;
                                let bg = 'bg-indigo-50 dark:bg-indigo-950/20';

                                if (insight.type === 'WARNING') {
                                    icon = <AlertTriangle className="w-5 h-5 text-rose-500" />;
                                    bg = 'bg-rose-50 dark:bg-rose-950/20';
                                } else if (insight.type === 'OPPORTUNITY') {
                                    icon = <Zap className="w-5 h-5 text-amber-500" />;
                                    bg = 'bg-amber-50 dark:bg-amber-950/20';
                                }

                                return (
                                    <div key={insight.id} className={`p-4 rounded-xl border border-slate-100 dark:border-slate-800/60 flex items-start gap-4 transition-colors ${bg}`}>
                                        <div className="mt-0.5 shrink-0">{icon}</div>
                                        <div>
                                            <h5 className="text-sm font-bold text-slate-900 dark:text-white capitalize">{insight.title}</h5>
                                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{insight.description}</p>
                                            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-3">{insight.category}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </EnterpriseCard>

                    {/* RISK AND OPPORTUNITIES */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <EnterpriseCard className="border-l-4 border-l-rose-500">
                            <h4 className="text-xs font-bold uppercase text-rose-500 tracking-wider mb-4 flex gap-2 items-center"><AlertTriangle className="w-4 h-4" /> Tespit Edilen Riskler</h4>
                            <div className="space-y-4">
                                {data.risks.map((r: any) => (
                                    <div key={r.id} className="pb-4 border-b border-rose-100 dark:border-rose-900/30 last:border-0 last:pb-0">
                                        <p className="text-theme-sm font-semibold text-slate-900 dark:text-white">{r.title}</p>
                                        <p className="text-xs text-slate-500 mt-1">{r.description}</p>
                                        <div className="mt-2 text-[10px] font-bold bg-rose-50 dark:bg-rose-900/10 text-rose-600 rounded p-1.5 px-2 inline-block">Mevcut: {r.currentValue}</div>
                                    </div>
                                ))}
                            </div>
                        </EnterpriseCard>

                        <EnterpriseCard className="border-l-4 border-l-amber-500">
                            <h4 className="text-xs font-bold uppercase text-amber-500 tracking-wider mb-4 flex gap-2 items-center"><TrendingUp className="w-4 h-4" /> Büyüme Fırsatları</h4>
                            <div className="space-y-4">
                                {data.opportunities.map((o: any) => (
                                    <div key={o.id} className="pb-4 border-b border-amber-100 dark:border-amber-900/30 last:border-0 last:pb-0">
                                        <p className="text-theme-sm font-semibold text-slate-900 dark:text-white">{o.title}</p>
                                        <p className="text-xs text-slate-500 mt-1">{o.description}</p>
                                        <div className="mt-2 text-[10px] font-bold bg-amber-50 dark:bg-amber-900/10 text-amber-600 rounded p-1.5 px-2 inline-block">Potansiyel: {formatCurr(o.potentialValue)}</div>
                                    </div>
                                ))}
                            </div>
                        </EnterpriseCard>
                    </div>
                </div>

                {/* 3. PERFORMANCE & TARGET RECOMMENDATIONS */}
                <div className="space-y-6">
                    <EnterpriseCard>
                        <EnterpriseSectionHeader title="Takım Performans Skoru" icon={<Award />} />
                        <div className="space-y-3">
                            {data.performanceScores.map((score: any) => (
                                <div key={score.id} className="flex flex-col gap-1 p-3 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-slate-100 dark:border-slate-800">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-sm text-slate-900 dark:text-white truncate">{score.staff?.name || 'Temsilci'}</span>
                                        <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">{score.totalScore}/100</span>
                                    </div>
                                    <div className="flex text-[10px] font-medium text-slate-400 gap-2">
                                        <span>Hedef: {score.achievementScore}</span>
                                        <span>| Büyüme: {score.growthScore}</span>
                                        <span>| Süreklilik: {score.consistencyScore}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </EnterpriseCard>

                    <EnterpriseCard className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0 shadow-lg">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="font-bold text-lg">AI Smart Target</h3>
                                <p className="text-xs text-slate-400 mt-1">Önerilen Hedef Matrisi</p>
                            </div>
                            <Target className="w-8 h-8 opacity-20" />
                        </div>

                        <div className="space-y-4">
                            <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                                <div className="flex justify-between">
                                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Safe</span>
                                    <span className="text-sm font-bold">1.250.000,00 ₺</span>
                                </div>
                            </div>
                            <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                                <div className="flex justify-between">
                                    <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Balanced</span>
                                    <span className="text-sm font-bold">1.450.000,00 ₺</span>
                                </div>
                            </div>
                            <div className="p-3 bg-white/10 rounded-lg border border-rose-400/30">
                                <div className="flex justify-between">
                                    <span className="text-xs font-bold text-rose-400 uppercase tracking-widest">Aggressive</span>
                                    <span className="text-sm font-black text-white">1.825.000,00 ₺</span>
                                </div>
                            </div>
                        </div>

                        <EnterpriseButton className="w-full mt-6 bg-white text-slate-900 hover:bg-slate-100">
                            Hedefleri Onayla & Dağıt
                        </EnterpriseButton>
                    </EnterpriseCard>
                </div>

            </div>
        </EnterprisePageShell>
    );
}
