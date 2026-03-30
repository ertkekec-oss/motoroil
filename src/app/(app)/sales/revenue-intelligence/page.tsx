import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import { EnterpriseCard, EnterpriseSectionHeader, EnterpriseButton } from '@/components/ui/enterprise';
import { LineChart, Zap, Target, TrendingUp, AlertTriangle, Lightbulb, Compass, Award } from 'lucide-react';

export default function RevenueIntelligenceDashboard() {
    const router = useRouter();
    const { theme } = useTheme();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        if (theme === 'light') {
            document.body.style.background = '#F7F9FC';
            document.body.style.color = '#1A1F36';
        } else {
            document.body.style.background = 'var(--bg-deep)';
            document.body.style.color = 'var(--text-main)';
        }
        return () => {
            document.body.style.background = '';
            document.body.style.color = '';
        };
    }, [theme]);

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

    const activeTab = 'revenue';

    return (
        <div data-pos-theme={theme} className="w-full min-h-[100vh] px-8 py-8 space-y-6 transition-colors duration-300 font-sans">
            
            {/* Enterprise Oval Tabs container */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-[#0f172a] p-2 rounded-[20px] mb-6 border border-slate-200 dark:border-white/5 shadow-sm relative z-10 w-full">
                <div className="flex bg-slate-100 dark:bg-[#1e293b]/50 p-1.5 rounded-full w-full md:w-auto overflow-x-auto shadow-inner border border-slate-200/50 dark:border-white/5 custom-scroll">
                    {[
                        { key: 'all', label: 'Tüm Satışlar', onClick: () => router.push('/sales') },
                        { key: 'online', label: 'E-Ticaret', onClick: () => router.push('/sales') },
                        { key: 'store', label: 'Mağaza Satışları', onClick: () => router.push('/sales') },
                        { key: 'b2b', label: 'B2B Satışları', onClick: () => router.push('/sales') },
                        { key: 'invoices', label: 'Faturalar', onClick: () => router.push('/sales') },
                        { key: 'wayslips', label: 'e-İrsaliyeler', onClick: () => router.push('/sales') },
                        { key: 'revenue', label: 'Revenue Intelligence', onClick: () => {} },
                    ].map(({ key, label, onClick }) => {
                        const isActive = activeTab === key;
                        return (
                            <button
                                key={key}
                                onClick={onClick}
                                className={`flex-1 min-w-[120px] h-11 px-5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all outline-none ${isActive ? 'bg-white text-indigo-600 shadow-sm dark:bg-indigo-500/20 dark:text-indigo-400 border border-slate-200 dark:border-indigo-500/30' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 border border-transparent'}`}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="w-full">
                {loading ? (
                    <div className="p-16 text-center text-slate-500 font-medium">✨ AI Satış Analiz Motoru Çalışıyor...</div>
                ) : !data ? (
                    <div className="p-16 text-center text-slate-500 font-medium">Satış tahmini veya AI analizi için yeterli geçmiş veri bulunamadı.</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in relative pb-20">

                        {/* 1. SALES FORECAST (Tahminlemeler) (Col-span 3) */}
                        <div className="md:col-span-3">
                            <EnterpriseCard>
                                <EnterpriseSectionHeader title="Satış Tahminleme (AI Forecast)" subtitle="Geçmiş büyüme frekansları ve sezonluk indeksler kullanılarak hesaplanır." icon={<LineChart />} />
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                                    {data.forecasts.map((f: any) => (
                                        <div key={f.id} className="p-5 border border-slate-200 dark:border-white/5 rounded-xl bg-slate-50 dark:bg-[#0f172a] shadow-sm flex flex-col justify-between">
                                            <div className="flex justify-between items-start mb-4">
                                                <h4 className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{f.periodType.replace('_', ' ')}</h4>
                                                <span className="px-2 py-1 text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 rounded-md font-bold">% {f.confidenceScore} Güven Oranı</span>
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
                                <div className="space-y-4 mt-6">
                                    {data.insights.map((insight: any) => {
                                        let icon = <Lightbulb className="w-5 h-5 text-indigo-500" />;
                                        let bg = 'bg-indigo-50 dark:bg-indigo-500/10';

                                        if (insight.type === 'WARNING') {
                                            icon = <AlertTriangle className="w-5 h-5 text-rose-500" />;
                                            bg = 'bg-rose-50 dark:bg-rose-500/10';
                                        } else if (insight.type === 'OPPORTUNITY') {
                                            icon = <Zap className="w-5 h-5 text-amber-500" />;
                                            bg = 'bg-amber-50 dark:bg-amber-500/10';
                                        }

                                        return (
                                            <div key={insight.id} className={`p-4 rounded-xl border border-slate-100 dark:border-white/5 flex items-start gap-4 transition-colors ${bg}`}>
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
                                    <h4 className="text-[11px] font-black uppercase text-rose-500 tracking-widest mb-4 flex gap-2 items-center"><AlertTriangle className="w-4 h-4" /> Tespit Edilen Riskler</h4>
                                    <div className="space-y-4">
                                        {data.risks?.map((r: any) => (
                                            <div key={r.id} className="pb-4 border-b border-rose-100 dark:border-rose-500/20 last:border-0 last:pb-0">
                                                <p className="text-[13px] font-semibold text-slate-900 dark:text-white">{r.title}</p>
                                                <p className="text-[11px] text-slate-500 mt-1">{r.description}</p>
                                                <div className="mt-2 text-[10px] font-bold bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-md p-1.5 px-2 inline-block">Mevcut: {r.currentValue}</div>
                                            </div>
                                        ))}
                                    </div>
                                </EnterpriseCard>

                                <EnterpriseCard className="border-l-4 border-l-amber-500">
                                    <h4 className="text-[11px] font-black uppercase text-amber-500 tracking-widest mb-4 flex gap-2 items-center"><TrendingUp className="w-4 h-4" /> Büyüme Fırsatları</h4>
                                    <div className="space-y-4">
                                        {data.opportunities?.map((o: any) => (
                                            <div key={o.id} className="pb-4 border-b border-amber-100 dark:border-amber-500/20 last:border-0 last:pb-0">
                                                <p className="text-[13px] font-semibold text-slate-900 dark:text-white">{o.title}</p>
                                                <p className="text-[11px] text-slate-500 mt-1">{o.description}</p>
                                                <div className="mt-2 text-[10px] font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-md p-1.5 px-2 inline-block">Potansiyel: {formatCurr(o.potentialValue)}</div>
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
                                <div className="space-y-3 mt-6">
                                    {data.performanceScores.map((score: any) => (
                                        <div key={score.id} className="flex flex-col gap-1 p-3 bg-slate-50 dark:bg-[#0f172a]/50 rounded-xl border border-slate-100 dark:border-white/5">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-bold text-[13px] text-slate-900 dark:text-white truncate">{score.staff?.name || 'Temsilci'}</span>
                                                <span className="text-[13px] font-black text-indigo-600 dark:text-indigo-400">{score.totalScore}/100</span>
                                            </div>
                                            <div className="flex text-[10px] items-center text-slate-400 gap-2 font-black uppercase tracking-widest">
                                                <span>Hedef: {score.achievementScore}</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                                                <span>Büyüme: {score.growthScore}</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                                                <span>Süreklilik: {score.consistencyScore}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </EnterpriseCard>

                            <EnterpriseCard className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0 shadow-xl relative overflow-hidden">
                                <Target className="w-32 h-32 absolute -top-10 -right-10 opacity-5" />
                                <div className="flex justify-between items-start mb-6 relative z-10">
                                    <div>
                                        <h3 className="font-black text-[15px] tracking-tight">AI Smart Target</h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Önerilen Hedef Matrisi</p>
                                    </div>
                                </div>

                                <div className="space-y-3 relative z-10">
                                    <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Safe</span>
                                            <span className="text-[13px] font-black">1.250.000,00 ₺</span>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Balanced</span>
                                            <span className="text-[13px] font-black">1.450.000,00 ₺</span>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-400/30">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Aggressive</span>
                                            <span className="text-[14px] font-black text-white">1.825.000,00 ₺</span>
                                        </div>
                                    </div>
                                </div>

                                <button className="w-full mt-6 h-12 bg-white text-slate-900 hover:bg-slate-100 rounded-full font-black text-[11px] tracking-widest uppercase transition-all shadow-lg active:scale-95 relative z-10">
                                    Hedefleri Onayla & Dağıt
                                </button>
                            </EnterpriseCard>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
}
