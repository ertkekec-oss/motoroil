"use client";

import React, { useState } from 'react';
import GlobalReportHeader from '@/components/reports/GlobalReportHeader';
import { Briefcase, AlertCircle, FileCheck, FileX } from 'lucide-react';

const RECON_DATA = [
    { id: '1', customer: 'Otomativ Yedek Parça A.Ş', reconType: 'BA/BS', sentDate: '2026-04-01', balance: 450000, status: 'APPROVED', agent: 'Ahmet Yılmaz', delay: 2 },
    { id: '2', customer: 'Yıldız Nakliyat Hizm.', reconType: 'BA/BS', sentDate: '2026-04-02', balance: 1250000, status: 'DISPUTED', agent: 'Elif Kaya', delay: 10 },
    { id: '3', customer: 'Küçük Sanayi Oto', reconType: 'CARİ MUTABAKAT', sentDate: '2026-04-08', balance: 85000, status: 'PENDING', agent: 'Can Korkmaz', delay: 4 },
    { id: '4', customer: 'Marmara Lojistik', reconType: 'CARİ MUTABAKAT', sentDate: '2026-04-09', balance: 45000, status: 'APPROVED', agent: 'Elif Kaya', delay: 1 },
];

export default function ReconciliationReportPage() {
    const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);

    const handleRequestExport = async () => {
        setIsGeneratingExcel(true);
        try {
            await fetch('/api/exports/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reportType: 'FINANCE_RECONCILIATION',
                    name: 'Mutabakat & Evrak Uyum Raporu',
                    filters: {}
                })
            });
            alert('Mutabakat Raporu arka planda hazırlanıyor.');
        } catch (e) {
            alert('Hata oluştu.');
        } finally {
            setIsGeneratingExcel(false);
        }
    };

    const disputedCount = RECON_DATA.filter(r => r.status === 'DISPUTED').length;
    const approvalRate = ((RECON_DATA.filter(r => r.status === 'APPROVED').length / RECON_DATA.length) * 100).toFixed(1);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0B1220] p-4 sm:p-6 lg:p-10 pb-24 animate-in fade-in duration-300">
            <GlobalReportHeader 
                title="Mutabakat Uyumluluk Analizi" 
                description="BA/BS ile Cari Mutabakat evraklarının karşı taraflarca onaylanma durumu, ihtilaf (dispute) riskleri." 
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] p-6 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-3 text-slate-500 mb-3">
                        <Briefcase className="w-5 h-5" />
                        <div className="text-[10px] font-bold uppercase tracking-widest">TOPLAM BA/BS DOSYASI</div>
                    </div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white">450 Adet</div>
                    <div className="text-xs font-semibold text-slate-400 mt-2 block">Dönem içi gönderilen</div>
                </div>

                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] p-6 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-3 text-emerald-500 mb-3">
                        <FileCheck className="w-5 h-5" />
                        <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-500">ONAYLANMA ORANI</div>
                    </div>
                    <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">%{approvalRate}</div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 mt-4 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full bg-emerald-500`} style={{ width: `${approvalRate}%` }}></div>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] p-6 shadow-sm flex flex-col justify-between relative ">
                    <div className="flex items-center gap-3 text-red-500 mb-3">
                        <FileX className="w-5 h-5" />
                        <div className="text-[10px] font-bold uppercase tracking-widest text-red-600/70 dark:text-red-400">İHTİLAFLI (RED) EVRAK</div>
                    </div>
                    <div className="text-3xl font-black text-red-600 dark:text-red-400">{disputedCount} Adet</div>
                    <div className="text-xs font-semibold text-red-500/70 mt-2">Bakiye eşleşmezliği yaşandı</div>
                </div>

                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] p-6 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-3 text-amber-500 mb-3">
                        <AlertCircle className="w-5 h-5" />
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">ORT. DÖNÜŞ GECİKMESİ</div>
                    </div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white">4.2 Gün</div>
                    <div className="text-xs font-semibold text-slate-400 mt-2 block">Karşı firmanın yanıtlama hızı</div>
                </div>
            </div>

            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] overflow-hidden shadow-sm flex flex-col">
                <div className="p-6 border-b border-slate-100 dark:border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h3 className="text-base font-black text-slate-900 dark:text-white">Açık Mutabakat İzleme Paneli</h3>
                    <button onClick={handleRequestExport} disabled={isGeneratingExcel} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition-colors disabled:opacity-50">
                        {isGeneratingExcel ? 'Analiz Çıkarılıyor...' : 'Raporu Dışa Aktar (BullMQ)'}
                    </button>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-white/5">
                                <th className="p-5 whitespace-nowrap">Karşı Firma</th>
                                <th className="p-5 whitespace-nowrap">Mutabakat Türü</th>
                                <th className="p-5 whitespace-nowrap text-right">Eşleşen Bakiye</th>
                                <th className="p-5 whitespace-nowrap text-center">Statü</th>
                                <th className="p-5 whitespace-nowrap text-right">Geçen Süre</th>
                                <th className="p-5 whitespace-nowrap text-right">Temsilci</th>
                            </tr>
                        </thead>
                        <tbody>
                            {RECON_DATA.map((row) => (
                                <tr key={row.id} className="border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                                    <td className="p-5 font-bold text-sm text-slate-900 dark:text-white">{row.customer}</td>
                                    <td className="p-5 text-xs font-semibold text-slate-500">{row.reconType}</td>
                                    <td className="p-5 text-right font-black text-slate-900 dark:text-white">₺{row.balance.toLocaleString()}</td>
                                    <td className="p-5 text-center">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${row.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' : row.status === 'DISPUTED' ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400'}`}>
                                            {row.status === 'APPROVED' ? 'ONAYLI' : row.status === 'DISPUTED' ? 'İHTİLAFLI' : 'BEKLEYEN'}
                                        </span>
                                    </td>
                                    <td className="p-5 text-right font-bold text-slate-500">{row.delay} Gün</td>
                                    <td className="p-5 text-right font-semibold text-sm text-slate-700 dark:text-slate-300">{row.agent}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
