"use client";

import React, { useState } from 'react';
import GlobalReportHeader from '@/components/reports/GlobalReportHeader';
import { Presentation, Megaphone, Receipt, Gift } from 'lucide-react';

const CAMPAIGN_DATA = [
    { id: '1', campaign: 'Bahar Fırsatı - Motor Yağları', type: 'COUPON', budget: 15000, revenue: 145000, conversionRate: 14.5, roi: 866, status: 'ACTIVE' },
    { id: '2', campaign: 'Sanayi Toptan %10 İndirimi', type: 'DISCOUNT', budget: 50000, revenue: 850000, conversionRate: 22.0, roi: 1600, status: 'ACTIVE' },
    { id: '3', campaign: 'Akü Şenliği', type: 'GIFT_ITEM', budget: 10000, revenue: 12000, conversionRate: 4.2, roi: 20, status: 'EXPIRED' },
    { id: '4', campaign: 'Yeni Müşteri Hoşgeldin', type: 'COUPON', budget: 20000, revenue: 65000, conversionRate: 18.5, roi: 225, status: 'ACTIVE' },
];

export default function CampaignEffectivenessReportPage() {
    const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);

    const handleRequestExport = async () => {
        setIsGeneratingExcel(true);
        try {
            await fetch('/api/exports/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reportType: 'SALES_CAMPAIGNS',
                    name: 'Kupon ve Kampanya Etkililiği',
                    filters: {}
                })
            });
            alert('Kampanya Raporu arka planda hazırlanıyor.');
        } catch (e) {
            alert('Hata oluştu.');
        } finally {
            setIsGeneratingExcel(false);
        }
    };

    const totalRevenue = CAMPAIGN_DATA.reduce((acc, c) => acc + c.revenue, 0);
    const avgROI = (CAMPAIGN_DATA.reduce((acc, c) => acc + c.roi, 0) / CAMPAIGN_DATA.length).toFixed(0);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0B1220] p-4 sm:p-6 lg:p-10 pb-24 animate-in fade-in duration-300">
            <GlobalReportHeader 
                title="Kampanya Etkililiği Radarı" 
                description="Oluşturulan promosyon kuponlarının ve özel indirim matrislerinin şirkete getirdiği organik ciro hacmi." 
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                <div className="bg-white dark:bg-[#0f172a] border border-emerald-500/20 dark:border-emerald-500/10 rounded-3xl p-6 shadow-sm flex flex-col justify-between relative bg-gradient-to-br from-emerald-500/5 to-transparent">
                    <div className="flex items-center gap-3 text-emerald-500 mb-3">
                        <Receipt className="w-5 h-5" />
                        <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-500">EKSTRA KAMPANYA CİROSU</div>
                    </div>
                    <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">₺{(totalRevenue / 1000).toLocaleString()}k</div>
                    <div className="text-xs font-semibold text-emerald-500/80 mt-2">Sadece kampanyalardan elde edilen dönüşüm</div>
                </div>

                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-3 text-blue-500 mb-3">
                        <Presentation className="w-5 h-5" />
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">ORTALAMA ROI</div>
                    </div>
                    <div className="text-3xl font-black text-blue-600 dark:text-blue-400">%{avgROI}</div>
                    <div className="text-xs font-semibold text-slate-400 mt-2 block">Yatırım getirisi katlanma oranı</div>
                </div>

                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-3 text-pink-500 mb-3">
                        <Megaphone className="w-5 h-5" />
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">AKTİF PROMOSYON</div>
                    </div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white">3 Adet</div>
                    <div className="text-xs font-semibold text-slate-400 mt-2 block">Şu an kullanıma açık şablon</div>
                </div>

                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-3 text-amber-500 mb-3">
                        <Gift className="w-5 h-5" />
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">BEKLENEN KUO HEDEFİ</div>
                    </div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white">%12.4</div>
                    <div className="text-xs font-semibold text-slate-400 mt-2 block">Ciroya vurduğu iskonto yarası</div>
                </div>
            </div>

            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm flex flex-col">
                <div className="p-6 border-b border-slate-100 dark:border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h3 className="text-base font-black text-slate-900 dark:text-white">Kampanya Performans Matrisi</h3>
                    <button onClick={handleRequestExport} disabled={isGeneratingExcel} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition-colors disabled:opacity-50">
                        {isGeneratingExcel ? 'Analiz Çıkarılıyor...' : 'Raporu Dışa Aktar (BullMQ)'}
                    </button>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-white/5">
                                <th className="p-5 whitespace-nowrap">Kampanya / Kupon Adı</th>
                                <th className="p-5 whitespace-nowrap">Tür</th>
                                <th className="p-5 whitespace-nowrap text-right">Ayrılan Bütçe</th>
                                <th className="p-5 whitespace-nowrap text-right">Getirdiği Ciro (Net)</th>
                                <th className="p-5 whitespace-nowrap text-center">ROI Skoru</th>
                                <th className="p-5 whitespace-nowrap text-center">Durum</th>
                            </tr>
                        </thead>
                        <tbody>
                            {CAMPAIGN_DATA.map((row) => (
                                <tr key={row.id} className="border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                                    <td className="p-5 font-bold text-sm text-slate-900 dark:text-white">{row.campaign}</td>
                                    <td className="p-5 text-xs font-semibold text-slate-500">{row.type}</td>
                                    <td className="p-5 text-right font-semibold text-slate-500">₺{row.budget.toLocaleString()}</td>
                                    <td className="p-5 text-right font-black text-emerald-600 dark:text-emerald-400">₺{row.revenue.toLocaleString()}</td>
                                    <td className="p-5 text-center font-black text-blue-600 dark:text-blue-400">%{row.roi}</td>
                                    <td className="p-5 text-center">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${row.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                                            {row.status === 'ACTIVE' ? 'YAYINDA' : 'BİTTİ'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
