"use client";

import React, { useState } from 'react';
import GlobalReportHeader from '@/components/reports/GlobalReportHeader';
import { PhoneCall, Headset, PhoneOff, PhoneForwarded } from 'lucide-react';

const CALLS_DATA = [
    { id: '1', date: '2026-04-12', agent: 'Müşteri Hizmetleri Ekip 1', totalCalls: 145, answered: 130, missed: 15, avgDuration: '3m 45s', acd: '4m 10s' },
    { id: '2', date: '2026-04-12', agent: 'Teknik Destek Ekip A', totalCalls: 85, answered: 85, missed: 0, avgDuration: '12m 20s', acd: '11m 30s' },
    { id: '3', date: '2026-04-11', agent: 'Santral OTO-YANIT', totalCalls: 450, answered: 400, missed: 50, avgDuration: '45s', acd: '1m 20s' },
    { id: '4', date: '2026-04-11', agent: 'Müşteri Hizmetleri Ekip 1', totalCalls: 120, answered: 105, missed: 15, avgDuration: '4m 15s', acd: '3m 50s' },
];

export default function CallStatsReportPage() {
    const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);

    const handleRequestExport = async () => {
        setIsGeneratingExcel(true);
        try {
            await fetch('/api/exports/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reportType: 'SERVICE_CALLS',
                    name: 'Santral & Çağrı İstatistikleri',
                    filters: {}
                })
            });
            alert('Çağrı analiz raporu BullMQ havuzuna eklendi.');
        } catch (e) {
            alert('Hata oluştu.');
        } finally {
            setIsGeneratingExcel(false);
        }
    };

    const totalCalls = CALLS_DATA.reduce((acc, c) => acc + c.totalCalls, 0);
    const missedCalls = CALLS_DATA.reduce((acc, c) => acc + c.missed, 0);
    const answerRate = (((totalCalls - missedCalls) / totalCalls) * 100).toFixed(1);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0B1220] p-4 sm:p-6 lg:p-10 pb-24 animate-in fade-in duration-300">
            <GlobalReportHeader 
                title="Santral & Çağrı İstatistikleri" 
                description="Müşteri hizmetleri telefon trafiği, kaçan çağrılar (Missed) ve görüşme süreleri (ACD) analizi." 
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-3 text-slate-500 mb-3">
                        <PhoneCall className="w-5 h-5" />
                        <div className="text-[10px] font-bold uppercase tracking-widest">TOPLAM GELEN ÇAĞRI</div>
                    </div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white">{totalCalls}</div>
                    <div className="text-xs font-semibold text-slate-400 mt-2 block">Dönem içi switchboard yükü</div>
                </div>

                <div className="bg-white dark:bg-[#0f172a] border border-red-500/20 dark:border-red-500/10 rounded-3xl p-6 shadow-sm flex flex-col justify-between relative bg-gradient-to-br from-red-500/5 to-transparent">
                    <div className="flex items-center gap-3 text-red-500 mb-3">
                        <PhoneOff className="w-5 h-5" />
                        <div className="text-[10px] font-bold uppercase tracking-widest text-red-600/70 dark:text-red-400">KAÇAN ÇAĞRILAR (MISSED)</div>
                    </div>
                    <div className="text-3xl font-black text-red-600 dark:text-red-400">{missedCalls} Çağrı</div>
                    <div className="text-xs font-semibold text-red-500/70 mt-2">Cevapsız kalarak düşenler</div>
                </div>

                <div className="bg-white dark:bg-[#0f172a] border border-emerald-500/20 dark:border-emerald-500/10 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-3 text-emerald-500 mb-3">
                        <Headset className="w-5 h-5" />
                        <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-500">ÇAĞRI KARŞILAMA (SLA)</div>
                    </div>
                    <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">%{answerRate}</div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 mt-4 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full bg-emerald-500`} style={{ width: `${answerRate}%` }}></div>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-3 text-blue-500 mb-3">
                        <PhoneForwarded className="w-5 h-5" />
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">ORTALAMA ACD</div>
                    </div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white">4m 12s</div>
                    <div className="text-xs font-semibold text-slate-400 mt-2 block">Agent Call Duration (Görüşme Süresi)</div>
                </div>
            </div>

            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm flex flex-col">
                <div className="p-6 border-b border-slate-100 dark:border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h3 className="text-base font-black text-slate-900 dark:text-white">Ekip & Kuyruk (Queue) Detayları</h3>
                    <button onClick={handleRequestExport} disabled={isGeneratingExcel} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition-colors disabled:opacity-50">
                        {isGeneratingExcel ? 'Analiz Çıkarılıyor...' : 'Raporu Dışa Aktar (BullMQ)'}
                    </button>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-white/5">
                                <th className="p-5 whitespace-nowrap">Tarih</th>
                                <th className="p-5 whitespace-nowrap">Ekip / Kuyruk</th>
                                <th className="p-5 whitespace-nowrap text-center">Gelen</th>
                                <th className="p-5 whitespace-nowrap text-center">Cevaplanan</th>
                                <th className="p-5 whitespace-nowrap text-center text-red-500">Kaçan</th>
                                <th className="p-5 whitespace-nowrap text-right">Performans Skoru</th>
                            </tr>
                        </thead>
                        <tbody>
                            {CALLS_DATA.map((row) => (
                                <tr key={row.id} className="border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                                    <td className="p-5 font-bold text-sm text-slate-600 dark:text-slate-400">{row.date}</td>
                                    <td className="p-5 font-black text-sm text-slate-900 dark:text-white">{row.agent}</td>
                                    <td className="p-5 text-center font-semibold text-slate-500">{row.totalCalls}</td>
                                    <td className="p-5 text-center font-bold text-emerald-600 dark:text-emerald-400">{row.answered}</td>
                                    <td className="p-5 text-center font-black text-red-600 dark:text-red-400">{row.missed}</td>
                                    <td className="p-5 text-right font-semibold text-xs text-slate-500">ACD: {row.acd}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
