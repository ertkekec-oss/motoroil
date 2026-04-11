"use client";

import React, { useState } from 'react';
import GlobalReportHeader from '@/components/reports/GlobalReportHeader';
import { Trophy, TrendingUp, Target, Users } from 'lucide-react';

// Mock veri: Personel bazlı satış performansı
const PERSONNEL_DATA = [
    { id: '1', name: 'Ahmet Yılmaz', role: 'Saha Satış Temsilcisi', totalSales: 425000, target: 500000, conversionRate: 64, activeMeetings: 12 },
    { id: '2', name: 'Ayşe Demir', role: 'Kurumsal Görevli', totalSales: 850000, target: 800000, conversionRate: 78, activeMeetings: 8 },
    { id: '3', name: 'Can Korkmaz', role: 'Şube Müdürü', totalSales: 310000, target: 400000, conversionRate: 45, activeMeetings: 24 },
    { id: '4', name: 'Elif Kaya', role: 'Dijital Satış', totalSales: 155000, target: 150000, conversionRate: 82, activeMeetings: 0 },
];

export default function PersonnelPerformanceReportPage() {
    const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);

    const handleRequestExport = async () => {
        setIsGeneratingExcel(true);
        try {
            await fetch('/api/exports/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reportType: 'PERSONNEL_PERFORMANCE',
                    name: 'Personel Satış Performansı Raporu',
                    filters: {}
                })
            });
            alert('Rapor arka planda hazırlanıyor (BullMQ). Tamamlanınca size bildirim gelecek ve Rapor Arşivi modülünden indirebileceksiniz.');
        } catch (e) {
            alert('Hata oluştu.');
        } finally {
            setIsGeneratingExcel(false);
        }
    };

    const totalSalesVol = PERSONNEL_DATA.reduce((acc, p) => acc + p.totalSales, 0);
    const topPerformer = PERSONNEL_DATA.reduce((prev, curr) => (prev.totalSales > curr.totalSales) ? prev : curr);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0B1220] p-4 sm:p-6 lg:p-10 pb-24 animate-in fade-in duration-300">
            
            {/* 1. Universal Enterprise Filter Header */}
            <GlobalReportHeader 
                title="Personel Satış Performansı" 
                description="Seçilen periyotta satış personelinizin anlık performansları, kotaları ve efor oranları." 
            />

            {/* 2. Executive Summaries */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] p-6 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-3 text-slate-500 mb-3">
                        <TrendingUp className="w-5 h-5" />
                        <div className="text-[10px] font-bold uppercase tracking-widest">TOPLAM CİRO BÜYÜKLÜĞÜ</div>
                    </div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white">₺{(totalSalesVol / 1000).toFixed(1)}k</div>
                </div>

                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] p-6 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-3 text-emerald-500 mb-3">
                        <Trophy className="w-5 h-5" />
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">AYIN YILDIZI</div>
                    </div>
                    <div>
                        <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">{topPerformer.name}</div>
                        <div className="text-xs font-semibold text-emerald-500/70 mt-1">₺{(topPerformer.totalSales / 1000).toFixed(1)}k Katkı</div>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] p-6 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-3 text-blue-500 mb-3">
                        <Target className="w-5 h-5" />
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">EKİP HEDEF TUTTURMA</div>
                    </div>
                    <div className="text-3xl font-black text-blue-600 dark:text-blue-400">%81</div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 mt-4 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full w-[81%] rounded-full"></div>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] p-6 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-3 text-amber-500 mb-3">
                        <Users className="w-5 h-5" />
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">EFOR (AKTİF GÖRÜŞME)</div>
                    </div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white">44</div>
                    <div className="text-xs font-semibold text-slate-400 mt-2 block">Sahada açık talep</div>
                </div>
            </div>

            {/* 3. The Enterprise Data Grid Array */}
            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] overflow-hidden shadow-sm flex flex-col">
                <div className="p-6 border-b border-slate-100 dark:border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h3 className="text-base font-black text-slate-900 dark:text-white">Personel Performans Dökümü</h3>
                    
                    <button 
                        onClick={handleRequestExport}
                        disabled={isGeneratingExcel}
                        className="px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                    >
                        {isGeneratingExcel ? 'Analiz Çıkarılıyor...' : 'Raporu Dışa Aktar (BullMQ)'}
                    </button>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-white/5">
                                <th className="p-5 whitespace-nowrap">Personel / Unvan</th>
                                <th className="p-5 whitespace-nowrap text-right">Gerçekleşen Satış</th>
                                <th className="p-5 whitespace-nowrap text-right">Hedef / Kota</th>
                                <th className="p-5 whitespace-nowrap text-center">Başarı Oranı</th>
                                <th className="p-5 whitespace-nowrap text-center">Teklif Dönüşüm</th>
                                <th className="p-5 whitespace-nowrap text-right">Aktif Görüşme</th>
                            </tr>
                        </thead>
                        <tbody>
                            {PERSONNEL_DATA.map((row) => {
                                const targetRatio = (row.totalSales / row.target) * 100;
                                const isSuccess = targetRatio >= 100;
                                
                                return (
                                    <tr key={row.id} className="border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                                        <td className="p-5">
                                            <div className="text-sm font-bold text-slate-900 dark:text-white">{row.name}</div>
                                            <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-0.5">{row.role}</div>
                                        </td>
                                        <td className="p-5 text-right text-sm font-black text-slate-900 dark:text-white">₺{row.totalSales.toLocaleString()}</td>
                                        <td className="p-5 text-right text-sm font-bold text-slate-400">₺{row.target.toLocaleString()}</td>
                                        <td className="p-5 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <span className={`text-xs font-black ${isSuccess ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                    %{targetRatio.toFixed(1)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-5 text-center text-sm font-bold text-blue-600 dark:text-blue-400">
                                            %{row.conversionRate}
                                        </td>
                                        <td className="p-5 text-right text-sm font-black text-slate-700 dark:text-slate-300">
                                            {row.activeMeetings}
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
