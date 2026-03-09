"use client";

import React, { useEffect, useState } from 'react';
import { EnterprisePageShell, EnterpriseCard, EnterpriseSectionHeader, EnterpriseButton } from '@/components/ui/enterprise';
import { Compass, Smartphone, UserPlus, Zap, TrendingUp, Navigation2, CheckCircle, ShieldCheck } from 'lucide-react';

export default function FieldMobileIntelligence() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        fetch('/api/salesx/intelligence')
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

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
                <Smartphone className="w-16 h-16 text-indigo-400 animate-pulse mb-6" />
                <h2 className="text-xl font-black text-slate-800 dark:text-white">Field Mobile</h2>
                <p className="text-slate-500 font-medium">SalesX Intelligence yükleniyor...</p>
            </div>
        );
    }

    if (!data || data.visits.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
                <ShieldCheck className="w-16 h-16 text-slate-400 mb-6" />
                <h2 className="text-xl font-black text-slate-800 dark:text-white">SalesX Hazırlanıyor</h2>
                <p className="text-slate-500 font-medium">Satış rotanız analiz ediliyor, lütfen sayfayı yenileyiniz.</p>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 dark:bg-[#0f172a] min-h-screen">
            {/* Header: Designed for Mobile/Field Worker Feel */}
            <div className="bg-gradient-to-br from-indigo-700 to-slate-900 border-b border-indigo-900 text-white p-6 pt-10 sticky top-0 z-10 shadow-xl">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight">SalesX Akıllı Asistan</h1>
                        <p className="text-indigo-200 text-sm font-medium mt-1">Bugünün Akıllı Önerileri & Rota</p>
                    </div>
                    <div className="w-12 h-12 bg-white/10 flex items-center justify-center rounded-xl backdrop-blur-md">
                        <Compass className="w-6 h-6 text-emerald-400" />
                    </div>
                </div>
            </div>

            <div className="p-4 space-y-6 max-w-lg mx-auto pb-24">

                {/* AI TARGET INSIGHTS (OPPORTUNITIES) */}
                <EnterpriseCard className="border-l-4 border-l-amber-500">
                    <EnterpriseSectionHeader title="Aktif Satış Fırsatları" subtitle="Müşteri portföyünüzdeki çapraz satış ve reaktivasyon önerileri" icon={<Zap className="text-amber-500" />} />

                    <div className="space-y-4 mt-4">
                        {data.opportunities.map((opp: any) => (
                            <div key={opp.id} className="p-4 rounded-xl border border-amber-100 bg-amber-50/40 dark:border-amber-900/40 dark:bg-amber-900/10">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">{opp.title}</h4>
                                    <span className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400 px-2 py-0.5 rounded font-bold uppercase">{opp.opportunityType}</span>
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">{opp.description}</p>

                                <div className="flex justify-between items-center mt-3 pt-3 border-t border-amber-200/50 dark:border-amber-800/30">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase">Müşteri: {opp.customer.name}</span>
                                    <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">Potansiyel: {formatCurr(opp.potentialValue)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </EnterpriseCard>

                {/* PREDICTIVE VISIT PLANNING */}
                <EnterpriseCard className="border-t-4 border-t-indigo-500">
                    <EnterpriseSectionHeader title="Akıllı Rota & Ziyaret Önerileri" subtitle="Predictive Visit Planning: Gitmeniz durumunda kazanma olasılığı en yüksek noktalar." icon={<Navigation2 className="text-indigo-500" />} />

                    {data.route && (
                        <div className="mb-5 p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30 rounded-lg flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-widest">Tahmini Rota Değeri</span>
                                <span className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{formatCurr(data.route.estimatedValue)}</span>
                            </div>
                            <EnterpriseButton className="bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/30 px-4">
                                Rotaya Başla
                            </EnterpriseButton>
                        </div>
                    )}

                    <div className="space-y-3">
                        {data.visits.map((sv: any, idx: number) => (
                            <div key={sv.id} className="relative p-4 pl-10 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900/50 flex flex-col gap-2 shadow-sm">
                                {/* Route Timeline Line */}
                                <div className="absolute left-4 top-5 w-5 h-5 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center text-[10px] font-black text-indigo-700 dark:text-indigo-400">
                                    {idx + 1}
                                </div>
                                {idx !== data.visits.length - 1 && <div className="absolute left-[25px] top-10 w-0.5 h-[calc(100%-10px)] bg-slate-200 dark:bg-slate-800"></div>}

                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white pr-2">{sv.customer.name}</p>
                                        <p className="text-xs text-slate-500 flex gap-2 mt-1">
                                            <span>📍 {sv.customer.city || 'Belirtilmedi'}</span>
                                            <span className="font-medium text-emerald-600">Skor: {sv.priorityScore}/100</span>
                                        </p>
                                    </div>
                                    {sv.priorityScore >= 80 && (
                                        <span className="px-2 py-0.5 bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 text-[9px] font-black uppercase rounded shrink-0">Yüksek Öncelik</span>
                                    )}
                                </div>
                                <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800/50 p-2 rounded">
                                    💡 {sv.reason}
                                </div>
                                <div className="flex pb-1 mt-2">
                                    <button className="flex-1 border py-1.5 text-xs font-bold text-slate-700 rounded-l-md hover:bg-slate-100">Ziyareti Pas Geç</button>
                                    <button className="flex-1 border-y border-r border-l-0 bg-indigo-50 text-indigo-700 py-1.5 text-xs font-bold rounded-r-md hover:bg-indigo-100">Check-in Yap</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </EnterpriseCard>

            </div>
        </div>
    );
}
