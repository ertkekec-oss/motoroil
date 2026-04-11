"use client";

import React, { useState } from 'react';
import GlobalReportHeader from '@/components/reports/GlobalReportHeader';
import { Calculator, AlertTriangle, Building, CreditCard } from 'lucide-react';

const AGING_DATA = [
    { id: '1', customer: 'Otomativ Yedek Parça A.Ş', taxId: '7680012345', balance: 450000, current: 50000, over30: 100000, over60: 200000, over90: 100000, status: 'CRITICAL', riskScore: 85 },
    { id: '2', customer: 'Bostancı Lojistik', taxId: '3490056712', balance: 125000, current: 125000, over30: 0, over60: 0, over90: 0, status: 'HEALTHY', riskScore: 10 },
    { id: '3', customer: 'Küçük Sanayi Oto Bakım', taxId: '1234567890', balance: 85000, current: 40000, over30: 45000, over60: 0, over90: 0, status: 'WARNING', riskScore: 40 },
    { id: '4', customer: 'Yıldız Nakliyat A.Ş', taxId: '5647382910', balance: 650000, current: 0, over30: 0, over60: 150000, over90: 500000, status: 'LEGAL', riskScore: 98 },
];

export default function AgingReportPage() {
    const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);

    const handleRequestExport = async () => {
        setIsGeneratingExcel(true);
        try {
            await fetch('/api/exports/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reportType: 'FINANCE_AGING',
                    name: 'Cari Yaşlandırma ve Risk Raporu',
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

    const totalBalance = AGING_DATA.reduce((acc, c) => acc + c.balance, 0);
    const totalOver90 = AGING_DATA.reduce((acc, c) => acc + c.over90, 0);
    const criticalCount = AGING_DATA.filter(c => c.status === 'CRITICAL' || c.status === 'LEGAL').length;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0B1220] p-4 sm:p-6 lg:p-10 pb-24 animate-in fade-in duration-300">
            
            <GlobalReportHeader 
                title="Cari Yaşlandırma ve Risk" 
                description="Müşteri tahsilat gecikmeleri, bakiye vadeleri ve şirket sermayesine binen gecikmiş asimetrik risk yükü." 
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] p-6 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-3 text-slate-500 mb-3">
                        <Building className="w-5 h-5" />
                        <div className="text-[10px] font-bold uppercase tracking-widest">TOPLAM AÇIK BAKİYE</div>
                    </div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white">₺{(totalBalance / 1000).toLocaleString()}k</div>
                    <div className="text-xs font-semibold text-slate-400 mt-2 block">Piyasadaki alacak havuzu</div>
                </div>

                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] p-6 shadow-sm flex flex-col justify-between">
                    
                    <div className="flex items-center gap-3 text-red-500 mb-3">
                        <AlertTriangle className="w-5 h-5" />
                        <div className="text-[10px] font-bold uppercase tracking-widest text-red-600/70 dark:text-red-400">90+ GÜN GECİKEN TAH.</div>
                    </div>
                    <div className="text-3xl font-black text-red-600 dark:text-red-400">₺{(totalOver90 / 1000).toLocaleString()}k</div>
                    <div className="text-xs font-semibold text-red-500/70 mt-2">Çok yüksek riskli kapital</div>
                </div>

                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] p-6 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-3 text-amber-500 mb-3">
                        <Calculator className="w-5 h-5" />
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">KAYIP / RİSKLİ FİRMA</div>
                    </div>
                    <div className="text-3xl font-black text-amber-600 dark:text-amber-500">{criticalCount} Cari</div>
                    <div className="text-xs font-semibold text-slate-400 mt-2 block">Hukuki süreç ve risk grubu</div>
                </div>

                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] p-6 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-3 text-emerald-500 mb-3">
                        <CreditCard className="w-5 h-5" />
                        <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-500">ZAMANINDA ÖDEME</div>
                    </div>
                    <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">%24</div>
                    <div className="text-xs font-semibold text-emerald-500/80 mt-2 block">Cari ekstre uyuşma oranı</div>
                </div>
            </div>

            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] overflow-hidden shadow-sm flex flex-col">
                <div className="p-6 border-b border-slate-100 dark:border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h3 className="text-base font-black text-slate-900 dark:text-white">Firma Yaşlandırma Tablosu</h3>
                    
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
                                <th className="p-5 whitespace-nowrap">Müşteri Ünvanı / VKN</th>
                                <th className="p-5 whitespace-nowrap text-right text-slate-400">Vadesiz (Güncel)</th>
                                <th className="p-5 whitespace-nowrap text-right text-amber-500/70">1-30 Gün</th>
                                <th className="p-5 whitespace-nowrap text-right text-orange-500/80">31-60 Gün</th>
                                <th className="p-5 whitespace-nowrap text-right text-red-500">90+ Gün (Riskli)</th>
                                <th className="p-5 whitespace-nowrap text-right">Toplam Bakiye</th>
                                <th className="p-5 whitespace-nowrap text-center">Statü</th>
                            </tr>
                        </thead>
                        <tbody>
                            {AGING_DATA.map((row) => {
                                let statusBadge;
                                if (row.status === 'LEGAL') statusBadge = <span className="px-2 py-1 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 text-[10px] font-bold uppercase rounded border border-red-200 dark:border-slate-200">HUKUKİ SÜREÇ</span>;
                                else if (row.status === 'CRITICAL') statusBadge = <span className="px-2 py-1 bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 text-[10px] font-bold uppercase rounded border border-orange-200 dark:border-slate-200">KRİTİK RİSK</span>;
                                else if (row.status === 'WARNING') statusBadge = <span className="px-2 py-1 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase rounded border border-amber-200 dark:border-slate-200">GECİKMELİ</span>;
                                else statusBadge = <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase rounded border border-emerald-200 dark:border-slate-200">SAĞLIKLI</span>;

                                return (
                                    <tr key={row.id} className="border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                                        <td className="p-5">
                                            <div className="text-sm font-bold text-slate-900 dark:text-white">{row.customer}</div>
                                            <div className="text-xs font-semibold text-slate-400 mt-0.5">VKN: {row.taxId} &nbsp;&bull;&nbsp; Skor: {row.riskScore}/100</div>
                                        </td>
                                        <td className="p-5 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            {row.current > 0 ? `₺${row.current.toLocaleString()}` : '-'}
                                        </td>
                                        <td className="p-5 text-right text-sm font-semibold text-amber-600/70 dark:text-amber-500/70">
                                            {row.over30 > 0 ? `₺${row.over30.toLocaleString()}` : '-'}
                                        </td>
                                        <td className="p-5 text-right text-sm font-bold text-orange-600/80 dark:text-orange-400/80">
                                            {row.over60 > 0 ? `₺${row.over60.toLocaleString()}` : '-'}
                                        </td>
                                        <td className="p-5 text-right text-sm font-black text-red-600 dark:text-red-400">
                                            {row.over90 > 0 ? `₺${row.over90.toLocaleString()}` : '-'}
                                        </td>
                                        <td className="p-5 text-right text-sm font-black text-slate-900 dark:text-white">
                                            ₺{row.balance.toLocaleString()}
                                        </td>
                                        <td className="p-5 text-center">
                                            {statusBadge}
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
