"use client";

import React, { useState } from 'react';
import GlobalReportHeader from '@/components/reports/GlobalReportHeader';
import { Factory, TrendingDown, TrendingUp, AlertOctagon } from 'lucide-react';

const BOM_DATA = [
    { id: '1', recipe: 'Sentetik Yağ 5W-30 Karışımı', status: 'ACTIVE', stdCost: 1450, actualCost: 1680, variance: 15.8, manufactured: 4500, risk: 'HIGH' },
    { id: '2', recipe: 'Endüstriyel Fren Hidroliği', status: 'ACTIVE', stdCost: 850, actualCost: 830, variance: -2.3, manufactured: 12000, risk: 'NONE' },
    { id: '3', recipe: 'Aerosol Kışlık Bakım Seti', status: 'ARCHIVED', stdCost: 210, actualCost: 290, variance: 38.0, manufactured: 0, risk: 'CRITICAL' },
    { id: '4', recipe: 'Ağır Vasıta Filtre Montajı', status: 'ACTIVE', stdCost: 550, actualCost: 565, variance: 2.7, manufactured: 850, risk: 'LOW' },
];

export default function BombVarianceReportPage() {
    const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);

    const handleRequestExport = async () => {
        setIsGeneratingExcel(true);
        try {
            await fetch('/api/exports/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reportType: 'RESOURCES_BOM',
                    name: 'BOM Üretim Maliyet Sapma Raporu',
                    filters: {}
                })
            });
            alert('Rapor arka planda hazırlanıyor (BullMQ).');
        } catch (e) {
            alert('Hata oluştu.');
        } finally {
            setIsGeneratingExcel(false);
        }
    };

    const avgVariance = (BOM_DATA.reduce((acc, b) => acc + b.variance, 0) / BOM_DATA.length).toFixed(1);
    const criticalCount = BOM_DATA.filter(b => b.variance > 10).length;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0B1220] p-4 sm:p-6 lg:p-10 pb-24 animate-in fade-in duration-300">
            
            <GlobalReportHeader 
                title="Ürün Reçetesi (BOM) Maliyet Sapma" 
                description="Üretim modülündeki planlanan standart maliyetler ile gerçekleşen hammadde alış maliyetleri arasındaki enflasyonist varyans analizi." 
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-3 text-slate-500 mb-3">
                        <Factory className="w-5 h-5" />
                        <div className="text-[10px] font-bold uppercase tracking-widest">AKTİF REÇETE SAYISI</div>
                    </div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white">356</div>
                    <div className="text-xs font-semibold text-slate-400 mt-2 block">Sistemde yürürlükte olan</div>
                </div>

                <div className="bg-white dark:bg-[#0f172a] border border-red-500/20 dark:border-red-500/10 rounded-3xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent z-0"></div>
                    <div className="flex items-center gap-3 text-red-500 mb-3 relative z-10">
                        <TrendingUp className="w-5 h-5" />
                        <div className="text-[10px] font-bold uppercase tracking-widest text-red-600/70 dark:text-red-400">ORTALAMA SAPMA (VARYANS)</div>
                    </div>
                    <div className="text-3xl font-black text-red-600 dark:text-red-400 relative z-10">%{avgVariance}</div>
                    <div className="text-xs font-semibold text-red-500/70 mt-2 relative z-10">Standart maliyet üzerine eklenen yük</div>
                </div>

                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-3 text-amber-500 mb-3">
                        <AlertOctagon className="w-5 h-5" />
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">KIRMIZI ALARM REÇETE</div>
                    </div>
                    <div className="text-3xl font-black text-amber-600 dark:text-amber-500">{criticalCount} Adet</div>
                    <div className="text-xs font-semibold text-amber-600/70 mt-2 block">%10 Üzeri sapma yaşayanlar</div>
                </div>

                <div className="bg-white dark:bg-[#0f172a] border border-emerald-500/20 dark:border-emerald-500/10 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-3 text-emerald-500 mb-3">
                        <TrendingDown className="w-5 h-5" />
                        <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-500">FİYAT DÜŞÜŞÜ (FAYDA)</div>
                    </div>
                    <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">14 Reçete</div>
                    <div className="text-xs font-semibold text-emerald-500/80 mt-2 block">Standarttan daha ucuza üretilenler</div>
                </div>
            </div>

            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm flex flex-col">
                <div className="p-6 border-b border-slate-100 dark:border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h3 className="text-base font-black text-slate-900 dark:text-white">BOM Gerçekleşen Maliyet Analizi</h3>
                    
                    <button 
                        onClick={handleRequestExport}
                        disabled={isGeneratingExcel}
                        className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                    >
                        {isGeneratingExcel ? 'Analiz Çıkarılıyor...' : 'Raporu Dışa Aktar (BullMQ)'}
                    </button>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-white/5">
                                <th className="p-5 whitespace-nowrap">Ürün Reçetesi Adı</th>
                                <th className="p-5 whitespace-nowrap text-right">Standart (Planlanan)</th>
                                <th className="p-5 whitespace-nowrap text-right">Gerçekleşen Mlyt.</th>
                                <th className="p-5 whitespace-nowrap text-center">Sapma (Varyans)</th>
                                <th className="p-5 whitespace-nowrap text-center">Statü</th>
                                <th className="p-5 whitespace-nowrap text-right">Periyot Üretimi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {BOM_DATA.map((row) => {
                                let badge;
                                if (row.variance > 20) badge = <span className="text-red-600 font-black">+%{row.variance} 🔴</span>;
                                else if (row.variance > 5) badge = <span className="text-amber-500 font-bold">+%{row.variance} 🟠</span>;
                                else if (row.variance > 0) badge = <span className="text-slate-500 font-semibold">+%{row.variance} ⚪</span>;
                                else badge = <span className="text-emerald-500 font-black">-%{Math.abs(row.variance)} 🟢</span>;

                                return (
                                    <tr key={row.id} className="border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                                        <td className="p-5">
                                            <div className="text-sm font-bold text-slate-900 dark:text-white">{row.recipe}</div>
                                            <div className="text-[10px] text-slate-400 font-semibold mt-0.5">{row.status}</div>
                                        </td>
                                        <td className="p-5 text-right text-sm font-semibold text-slate-500">
                                            ₺{row.stdCost.toLocaleString()}
                                        </td>
                                        <td className="p-5 text-right text-sm font-black text-slate-900 dark:text-white">
                                            ₺{row.actualCost.toLocaleString()}
                                        </td>
                                        <td className="p-5 text-center text-sm">
                                            {badge}
                                        </td>
                                        <td className="p-5 text-center">
                                            <span className={`px-2 py-1 rounded border text-[10px] font-bold uppercase ${row.risk === 'HIGH' || row.risk === 'CRITICAL' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                                {row.risk} RİSK
                                            </span>
                                        </td>
                                        <td className="p-5 text-right text-sm font-black text-blue-600 dark:text-blue-400">
                                            {row.manufactured} Br.
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}
