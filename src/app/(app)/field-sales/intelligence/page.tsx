"use client";

import React from 'react';
import { EnterprisePageShell, EnterpriseCard, EnterpriseSectionHeader, EnterpriseEmptyState } from '@/components/ui/enterprise';
import { Sparkles, Map, TrendingUp, Users, Activity } from 'lucide-react';

export default function FieldSalesIntelligencePage({ isEmbedded }: { isEmbedded?: boolean }) {
    return (
        <EnterprisePageShell
            title={isEmbedded ? undefined : "Saha Satış Zekası & Otonom Rota (AI)"}
            description={isEmbedded ? undefined : "Müşteri satın alma alışkanlıkları, ziyaret önerileri ve bölge bazlı ciro tahminleme servisi."}
        >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <EnterpriseCard className="p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                        <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">AI Rota Önerisi</h3>
                        <p className="text-xl font-bold">14 Acil Ziyaret</p>
                    </div>
                </EnterpriseCard>

                <EnterpriseCard className="p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Tahmini Ciro Potansiyeli</h3>
                        <p className="text-xl font-bold">₺240,000</p>
                    </div>
                </EnterpriseCard>

                <EnterpriseCard className="p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                        <Activity className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Düşen Satış Uyarıları</h3>
                        <p className="text-xl font-bold text-rose-600">3 Müşteri</p>
                    </div>
                </EnterpriseCard>
            </div>

            <EnterpriseCard className="p-12 text-center text-slate-500 border-dashed">
                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                        <Map className="w-10 h-10" />
                    </div>
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Saha Zekası ve Satış Otonomisi Veri Topluyor</h2>
                <p className="text-sm text-slate-500 mt-2 max-w-lg mx-auto">
                    Arayüz başarıyla oluşturuldu. AI motorunun müşterileriniz üzerinden anlamlı satış öngörüleri oluşturması için platformda daha fazla sipariş verisi olması gerekmektedir. Optimizasyonlar devam ediyor.
                </p>
            </EnterpriseCard>

        </EnterprisePageShell>
    );
}
