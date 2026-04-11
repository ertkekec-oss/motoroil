"use client";

import React, { useEffect, useState } from 'react';
import GlobalReportHeader from '@/components/reports/GlobalReportHeader';

// Mock veri (Normalde bu veri API'den ?range=&branch= filtrelerine göre gelecektir)
const PROFITABILITY_DATA = [
    { id: '1', item: 'Toptan Motor Yağı Satışı', revenue: 450000, cogs: 310000, margin: 31.1, branch: 'Merkez' },
    { id: '2', item: 'Filtre Yedek Parça', revenue: 120000, cogs: 85000, margin: 29.1, branch: 'Marmara' },
    { id: '3', item: 'Sarf Malzemesi (Koli)', revenue: 45000, cogs: 32000, margin: 28.8, branch: 'Merkez' },
    { id: '4', item: 'Periyodik Bakım Hizmeti', revenue: 210000, cogs: 60000, margin: 71.4, branch: 'Tümü' },
];

export default function ProfitabilityReportPage() {
    const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);

    const handleRequestExport = async () => {
        setIsGeneratingExcel(true);
        try {
            await fetch('/api/exports/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reportType: 'PROFITABILITY',
                    name: 'Şirket Kârlılık ve Büyüme Analizi',
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

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0B1220] p-4 sm:p-6 lg:p-10 pb-24 animate-in fade-in duration-300">
            
            {/* 1. Universal Enterprise Filter Header */}
            <GlobalReportHeader 
                title="Şirket Kârlılık ve Büyüme Analizi" 
                description="Seçili periyot ve organizasyon şubesine ait ürün/hizmet maliyeti (COGS) ve brüt kârlılık verileri." 
            />

            {/* 2. Executive Summaries */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">TOPLAM CİRO</div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white">₺825,000</div>
                    <div className="text-xs font-semibold text-emerald-500 mt-2 block">+14% geçen periyoda göre</div>
                </div>
                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">SATILAN MALİYET (COGS)</div>
                    <div className="text-3xl font-black text-red-600 dark:text-red-400">₺487,000</div>
                    <div className="text-xs font-semibold text-red-500 mt-2 block">+5% geçen periyoda göre</div>
                </div>
                <div className="bg-white dark:bg-[#0f172a] border border-emerald-500/20 dark:border-emerald-500/10 rounded-3xl p-6 shadow-sm relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent z-0"></div>
                    <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2 relative z-10">BRÜT KAR (Gross Profit)</div>
                    <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 relative z-10">₺338,000</div>
                    <div className="text-xs font-black text-emerald-500 mt-2 block border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded inline-block relative z-10">
                        Marj: %40.9
                    </div>
                </div>
            </div>

            {/* 3. The Enterprise Data Grid Array */}
            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm flex flex-col">
                <div className="p-6 border-b border-slate-100 dark:border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h3 className="text-base font-black text-slate-900 dark:text-white">Gelir Kalemleri ve COGS Tablosu</h3>
                    
                    <button 
                        onClick={handleRequestExport}
                        disabled={isGeneratingExcel}
                        className="px-4 py-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                    >
                        {isGeneratingExcel ? 'Tablo İsteği Gönderiliyor...' : 'Excel (CSV) Olarak Arka Planda Oluştur'}
                    </button>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-white/5">
                                <th className="p-5 whitespace-nowrap">Kalem / Satış Kümesi</th>
                                <th className="p-5 whitespace-nowrap w-32">Şube</th>
                                <th className="p-5 whitespace-nowrap text-right">Ciro (Gelir)</th>
                                <th className="p-5 whitespace-nowrap text-right">Maliyet (COGS)</th>
                                <th className="p-5 whitespace-nowrap text-right">Kâr Marjı</th>
                                <th className="p-5 whitespace-nowrap text-right">Brüt Kâr</th>
                            </tr>
                        </thead>
                        <tbody>
                            {PROFITABILITY_DATA.map((row) => {
                                const grossProfit = row.revenue - row.cogs;
                                return (
                                    <tr key={row.id} className="border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                                        <td className="p-5 text-sm font-bold text-slate-900 dark:text-white">{row.item}</td>
                                        <td className="p-5">
                                            <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-bold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/5">
                                                {row.branch}
                                            </span>
                                        </td>
                                        <td className="p-5 text-right text-sm font-black text-slate-700 dark:text-slate-300">₺{row.revenue.toLocaleString()}</td>
                                        <td className="p-5 text-right text-sm font-bold text-red-600/70 dark:text-red-400/70">-₺{row.cogs.toLocaleString()}</td>
                                        <td className="p-5 text-right">
                                            <span className={`text-xs font-black ${row.margin > 40 ? 'text-emerald-500' : 'text-amber-500'}`}>%{row.margin}</span>
                                        </td>
                                        <td className="p-5 text-right text-base font-black text-emerald-600 dark:text-emerald-400">₺{grossProfit.toLocaleString()}</td>
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
