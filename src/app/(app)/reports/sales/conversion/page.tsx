"use client";

import React, { useState } from 'react';
import GlobalReportHeader from '@/components/reports/GlobalReportHeader';
import { Target, TrendingUp, HandCoins, ThumbsDown } from 'lucide-react';

const CONVERSION_DATA = [
    { id: '1', representative: 'Ahmet Yılmaz', totalQuotes: 120, wonQuotes: 45, wonValue: 1250000, lostQuotes: 65, lostValue: 850000, targetConv: 40, actualConv: 37.5 },
    { id: '2', representative: 'Elif Kaya', totalQuotes: 85, wonQuotes: 60, wonValue: 980000, lostQuotes: 15, lostValue: 120000, targetConv: 50, actualConv: 70.5 },
    { id: '3', representative: 'Can Korkmaz', totalQuotes: 45, wonQuotes: 5, wonValue: 65000, lostQuotes: 38, lostValue: 450000, targetConv: 30, actualConv: 11.1 },
    { id: '4', representative: 'Ayşe Demir', totalQuotes: 200, wonQuotes: 90, wonValue: 2400000, lostQuotes: 80, lostValue: 1600000, targetConv: 45, actualConv: 45.0 },
];

export default function QuoteConversionReportPage() {
    const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);

    const handleRequestExport = async () => {
        setIsGeneratingExcel(true);
        try {
            await fetch('/api/exports/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reportType: 'SALES_CONVERSION',
                    name: 'Teklif Kazanma / Kaybetme Analizi',
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

    const totalWon = CONVERSION_DATA.reduce((acc, c) => acc + c.wonQuotes, 0);
    const totalLost = CONVERSION_DATA.reduce((acc, c) => acc + c.lostQuotes, 0);
    const totalQuotes = CONVERSION_DATA.reduce((acc, c) => acc + c.totalQuotes, 0);
    const avgConversion = totalQuotes > 0 ? ((totalWon / totalQuotes) * 100).toFixed(1) : '0';

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0B1220] p-4 sm:p-6 lg:p-10 pb-24 animate-in fade-in duration-300">
            
            <GlobalReportHeader 
                title="Teklif Dönüşüm (Conversion) Oranları" 
                description="Personel ve müşteri bazında tekliflerin faturaya dönüşme hızları ve kaybedilen teklif analizleri." 
            />

            <div className="flex flex-wrap items-center gap-4 mb-8">
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 px-4 py-2 rounded-[10px] flex items-center gap-3 shadow-sm min-w-[220px]">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-[14px]">🎯</div>
                    <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">KAZANILAN (WON)</div>
                        <div className="text-[16px] font-black leading-none text-slate-900 dark:text-white mt-0.5">{totalWon}</div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 px-4 py-2 rounded-[10px] flex items-center gap-3 shadow-sm min-w-[220px]">
                    <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-500 flex items-center justify-center text-[14px]">👎</div>
                    <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">KAYBEDİLEN (LOST)</div>
                        <div className="text-[16px] font-black leading-none text-red-600 dark:text-red-400 mt-0.5">{totalLost}</div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 px-4 py-2 rounded-[10px] flex items-center gap-3 shadow-sm min-w-[220px]">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-500 flex items-center justify-center text-[14px]">📈</div>
                    <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ŞİRKET ÇEVRİM ORANI</div>
                        <div className="text-[16px] font-black leading-none text-blue-600 dark:text-blue-400 mt-0.5">%{avgConversion}</div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 px-4 py-2 rounded-[10px] flex items-center gap-3 shadow-sm min-w-[220px]">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-500/10 text-orange-500 flex items-center justify-center text-[14px]">⚠️</div>
                    <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">KAYBOLAN CİRO RİSKİ</div>
                        <div className="text-[16px] font-black leading-none text-orange-600 dark:text-orange-400 mt-0.5">₺3.0M</div>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] overflow-hidden shadow-sm flex flex-col">
                <div className="p-6 border-b border-slate-100 dark:border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h3 className="text-base font-black text-slate-900 dark:text-white">Ekip Conversion Karşılaştırması</h3>
                    
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
                                <th className="p-5 whitespace-nowrap">Temsilci</th>
                                <th className="p-5 whitespace-nowrap text-center">Toplam Teklif</th>
                                <th className="p-5 whitespace-nowrap text-center text-emerald-600 dark:text-emerald-400">Kazanılan</th>
                                <th className="p-5 whitespace-nowrap text-center text-red-600/80 dark:text-red-400">Kaybedilen</th>
                                <th className="p-5 whitespace-nowrap text-right">Kazanılan Ciro Tutarı</th>
                                <th className="p-5 whitespace-nowrap text-center">Gerçekleşen Çevrim Oranı</th>
                            </tr>
                        </thead>
                        <tbody>
                            {CONVERSION_DATA.map((row) => {
                                const didMeetTarget = row.actualConv >= row.targetConv;
                                return (
                                    <tr key={row.id} className="border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                                        <td className="p-5 font-bold text-sm text-slate-900 dark:text-white">
                                            {row.representative}
                                        </td>
                                        <td className="p-5 text-center text-sm font-semibold text-slate-600 dark:text-slate-400">
                                            {row.totalQuotes}
                                        </td>
                                        <td className="p-5 text-center text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                            {row.wonQuotes}
                                        </td>
                                        <td className="p-5 text-center text-sm font-bold text-red-600/70 dark:text-red-400/70">
                                            {row.lostQuotes}
                                        </td>
                                        <td className="p-5 text-right text-sm font-black text-slate-900 dark:text-white">
                                            ₺{row.wonValue.toLocaleString()}
                                        </td>
                                        <td className="p-5 text-center">
                                            <span className={`px-3 py-1 rounded-full text-xs font-black ${didMeetTarget ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'}`}>
                                                %{row.actualConv}
                                            </span>
                                            <div className="text-[10px] text-slate-400 font-semibold mt-1">Hedef: %{row.targetConv}</div>
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
