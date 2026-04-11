"use client";

import React, { useState } from 'react';
import GlobalReportHeader from '@/components/reports/GlobalReportHeader';
import { Map, MapPin, Route, Clock } from 'lucide-react';

const SALESX_DATA = [
    { id: '1', representative: 'Ahmet Yılmaz', region: 'Marmara (Güney)', visits: 24, checkinCompliance: 92, avgDuration: '45 Dk', deviations: 1 },
    { id: '2', representative: 'Can Korkmaz', region: 'İç Anadolu Lojistik', visits: 18, checkinCompliance: 85, avgDuration: '1s 10Dk', deviations: 4 },
    { id: '3', representative: 'Elif Kaya', region: 'Motor ve Filtre Ağı', visits: 32, checkinCompliance: 100, avgDuration: '30 Dk', deviations: 0 },
    { id: '4', representative: 'Ayşe Demir', region: 'Merkez Noktalar', visits: 8, checkinCompliance: 50, avgDuration: '2s 00Dk', deviations: 6 },
];

export default function SalesXReportPage() {
    const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);

    const handleRequestExport = async () => {
        setIsGeneratingExcel(true);
        try {
            await fetch('/api/exports/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reportType: 'SALESX_INTELLIGENCE',
                    name: 'SalesX Saha Zekası Raporu',
                    filters: {}
                })
            });
            alert('Saha rotasyon raporu (Excel) hazırlanıyor (BullMQ).');
        } catch (e) {
            alert('Hata oluştu.');
        } finally {
            setIsGeneratingExcel(false);
        }
    };

    const totalVisits = SALESX_DATA.reduce((acc, c) => acc + c.visits, 0);
    const avgCompliance = (SALESX_DATA.reduce((acc, c) => acc + c.checkinCompliance, 0) / SALESX_DATA.length).toFixed(1);
    const totalDeviations = SALESX_DATA.reduce((acc, c) => acc + c.deviations, 0);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0B1220] p-4 sm:p-6 lg:p-10 pb-24 animate-in fade-in duration-300">
            
            <GlobalReportHeader 
                title="SalesX Saha Zekası (Rota Performansı)" 
                description="Saha ekiplerinin planlanan rotalara uyumu, check-in doğruluk oranları ve müşteri ziyaret süreleri." 
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] p-6 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-3 text-blue-500 mb-3">
                        <Map className="w-5 h-5" />
                        <div className="text-[10px] font-bold uppercase tracking-widest text-blue-600/70 dark:text-blue-500">TAMAMLANAN ZİYARET</div>
                    </div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white">{totalVisits}</div>
                    <div className="text-xs font-semibold text-slate-500 mt-2 block">Başarılı konum bildirimi</div>
                </div>

                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] p-6 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-3 text-emerald-500 mb-3">
                        <MapPin className="w-5 h-5" />
                        <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-500">CHECK-IN DOĞRULUĞU</div>
                    </div>
                    <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">%{avgCompliance}</div>
                    <div className="text-xs font-semibold text-emerald-500/80 mt-2 block">Lokasyon sapma analizi ortalaması</div>
                </div>

                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] p-6 shadow-sm flex flex-col justify-between ">
                    <div className="absolute inset-0 z-0"></div>
                    <div className="flex items-center gap-3 text-red-500 mb-3">
                        <Route className="w-5 h-5" />
                        <div className="text-[10px] font-bold uppercase tracking-widest text-red-600/70 dark:text-red-400">ROTA İHLALİ (SAPMA)</div>
                    </div>
                    <div className="text-3xl font-black text-red-600 dark:text-red-400">{totalDeviations} İhlal</div>
                    <div className="text-xs font-semibold text-red-500/70 mt-2">Plana uymayan ziyaretler</div>
                </div>

                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] p-6 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-3 text-slate-500 mb-3">
                        <Clock className="w-5 h-5" />
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">ORTALAMA GÖRÜŞME</div>
                    </div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white">49 Dk</div>
                    <div className="text-xs font-semibold text-slate-400 mt-2 block">Genel saha hızı</div>
                </div>
            </div>

            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] overflow-hidden shadow-sm flex flex-col">
                <div className="p-6 border-b border-slate-100 dark:border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h3 className="text-base font-black text-slate-900 dark:text-white">Takım Rota Optimizasyon Matrisi</h3>
                    
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
                                <th className="p-5 whitespace-nowrap">Takım / Temsilci</th>
                                <th className="p-5 whitespace-nowrap">Bölge & Sektör</th>
                                <th className="p-5 whitespace-nowrap text-center">Toplam Ziyaret</th>
                                <th className="p-5 whitespace-nowrap text-center">Check-in Doğruluğu</th>
                                <th className="p-5 whitespace-nowrap text-center">Rota Sapması</th>
                                <th className="p-5 whitespace-nowrap text-right">Ort. Süre</th>
                            </tr>
                        </thead>
                        <tbody>
                            {SALESX_DATA.map((row) => {
                                let complianceBadge;
                                if (row.checkinCompliance >= 90) complianceBadge = <span className="text-emerald-600 dark:text-emerald-400 font-black">%{row.checkinCompliance}</span>;
                                else if (row.checkinCompliance >= 70) complianceBadge = <span className="text-amber-500 font-bold">%{row.checkinCompliance}</span>;
                                else complianceBadge = <span className="text-red-600 dark:text-red-400 font-bold">%{row.checkinCompliance}</span>;

                                return (
                                    <tr key={row.id} className="border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                                        <td className="p-5 font-bold text-sm text-slate-900 dark:text-white">
                                            {row.representative}
                                        </td>
                                        <td className="p-5 text-sm font-semibold text-slate-500 dark:text-slate-400">
                                            {row.region}
                                        </td>
                                        <td className="p-5 text-center text-sm font-black text-slate-900 dark:text-white">
                                            {row.visits}
                                        </td>
                                        <td className="p-5 text-center text-sm">
                                            {complianceBadge}
                                        </td>
                                        <td className="p-5 text-center">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold ${row.deviations > 2 ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                                                {row.deviations} İhlal
                                            </span>
                                        </td>
                                        <td className="p-5 text-right text-sm font-black text-blue-600 dark:text-blue-400">
                                            {row.avgDuration}
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
