"use client";

import React, { useState } from 'react';
import GlobalReportHeader from '@/components/reports/GlobalReportHeader';
import { Laptop, TrendingDown, Wrench, Settings } from 'lucide-react';

const ASSETS_DATA = [
    { id: '1', assetName: 'Ford Transit Panelvan 2022', category: 'ARAÇ', assignedTo: 'Ahmet Yılmaz', purchasePrice: 450000, currentValue: 380000, condition: 'GOOD', depreciation: 15.5 },
    { id: '2', assetName: 'Apple MacBook Pro M2', category: 'BİLİŞİM', assignedTo: 'Araştırma Geliştirme', purchasePrice: 45000, currentValue: 22000, condition: 'FAIR', depreciation: 51.1 },
    { id: '3', assetName: 'Sanayi Tipi Jeneratör 50KVA', category: 'DEMİRBAŞ', assignedTo: 'Marmara Depo', purchasePrice: 125000, currentValue: 110000, condition: 'EXCELLENT', depreciation: 12.0 },
    { id: '4', assetName: 'Saha Servis Tableti (iPad)', category: 'BİLİŞİM', assignedTo: 'Can Korkmaz', purchasePrice: 15000, currentValue: 2000, condition: 'POOR', depreciation: 86.6 },
];

export default function AssetsReportPage() {
    const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);

    const handleRequestExport = async () => {
        setIsGeneratingExcel(true);
        try {
            await fetch('/api/exports/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reportType: 'RESOURCES_ASSETS',
                    name: 'Varlık ve Demirbaş Panosu',
                    filters: {}
                })
            });
            alert('Varlık ve Amortisman raporu arka planda oluşturuluyor.');
        } catch (e) {
            alert('Hata oluştu.');
        } finally {
            setIsGeneratingExcel(false);
        }
    };

    const totalValue = ASSETS_DATA.reduce((acc, a) => acc + a.currentValue, 0);
    const avgDepreciation = (ASSETS_DATA.reduce((acc, a) => acc + a.depreciation, 0) / ASSETS_DATA.length).toFixed(1);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0B1220] p-4 sm:p-6 lg:p-10 pb-24 animate-in fade-in duration-300">
            <GlobalReportHeader 
                title="Varlık, Amortisman ve Demirbaşlar" 
                description="Zimmetli donanımların ve araçların güncel piyasa/defter değerleri, amortisman erime hızları." 
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] p-6 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-3 text-emerald-500 mb-3">
                        <Laptop className="w-5 h-5" />
                        <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-500">GÜNCEL DEFTER DEĞERİ</div>
                    </div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white">₺{(totalValue / 1000).toLocaleString()}k</div>
                    <div className="text-xs font-semibold text-slate-400 mt-2 block">Net bilanço katkısı</div>
                </div>

                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] p-6 shadow-sm flex flex-col justify-between relative ">
                    <div className="flex items-center gap-3 text-red-500 mb-3">
                        <TrendingDown className="w-5 h-5" />
                        <div className="text-[10px] font-bold uppercase tracking-widest text-red-600/70 dark:text-red-400">ORTALAMA AMORTİSMAN</div>
                    </div>
                    <div className="text-3xl font-black text-red-600 dark:text-red-400">%{avgDepreciation}</div>
                    <div className="text-xs font-semibold text-red-500/70 mt-2">Değer kaybı erime hızı</div>
                </div>

                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] p-6 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-3 text-blue-500 mb-3">
                        <Wrench className="w-5 h-5" />
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">BAKIMDAKİ VARLIKLAR</div>
                    </div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white">4 Adet</div>
                    <div className="text-xs font-semibold text-slate-400 mt-2 block">Tamir/Servis aşamasında</div>
                </div>

                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] p-6 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-3 text-amber-500 mb-3">
                        <Settings className="w-5 h-5" />
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">ZİMMET DURUMU</div>
                    </div>
                    <div className="text-3xl font-black text-amber-600 dark:text-amber-500">%94.5</div>
                    <div className="text-xs font-semibold text-slate-400 mt-2 block">Aktif çalışanlara atanan</div>
                </div>
            </div>

            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] overflow-hidden shadow-sm flex flex-col">
                <div className="p-6 border-b border-slate-100 dark:border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h3 className="text-base font-black text-slate-900 dark:text-white">Demirbaş Envanter Listesi</h3>
                    <button onClick={handleRequestExport} disabled={isGeneratingExcel} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition-colors disabled:opacity-50">
                        {isGeneratingExcel ? 'Analiz Çıkarılıyor...' : 'Raporu Dışa Aktar (BullMQ)'}
                    </button>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-white/5">
                                <th className="p-5 whitespace-nowrap">Varlık Adı</th>
                                <th className="p-5 whitespace-nowrap text-center">Tür</th>
                                <th className="p-5 whitespace-nowrap">Zimmet Sahibi / Lokasyon</th>
                                <th className="p-5 whitespace-nowrap text-right">Alış Değeri</th>
                                <th className="p-5 whitespace-nowrap text-right">Güncel Değer</th>
                                <th className="p-5 whitespace-nowrap text-center text-red-500">Değer Kaybı</th>
                                <th className="p-5 whitespace-nowrap text-center">Fiziki Durum</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ASSETS_DATA.map((row) => (
                                <tr key={row.id} className="border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                                    <td className="p-5 font-bold text-sm text-slate-900 dark:text-white">{row.assetName}</td>
                                    <td className="p-5 text-center">
                                        <span className="px-2 py-1 rounded border text-[10px] font-bold uppercase bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:border-white/5 dark:text-slate-300">
                                            {row.category}
                                        </span>
                                    </td>
                                    <td className="p-5 font-semibold text-sm text-slate-600 dark:text-slate-400">{row.assignedTo}</td>
                                    <td className="p-5 text-right font-medium text-slate-400">₺{row.purchasePrice.toLocaleString()}</td>
                                    <td className="p-5 text-right font-black text-slate-900 dark:text-white">₺{row.currentValue.toLocaleString()}</td>
                                    <td className="p-5 text-center font-bold text-red-600/70 dark:text-red-400/70">-%{row.depreciation}</td>
                                    <td className="p-5 text-center">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${row.condition === 'EXCELLENT' ? 'text-emerald-500' : row.condition === 'GOOD' ? 'text-blue-500' : row.condition === 'FAIR' ? 'text-amber-500' : 'text-red-500'}`}>
                                            {row.condition === 'EXCELLENT' ? 'KUSURSUZ' : row.condition === 'GOOD' ? 'YENİ GİBİ' : row.condition === 'FAIR' ? 'YIPRANMIŞ' : 'ARIZALI'}
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
