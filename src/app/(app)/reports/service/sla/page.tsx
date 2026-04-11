"use client";

import React, { useState } from 'react';
import GlobalReportHeader from '@/components/reports/GlobalReportHeader';
import { Clock, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';

const SLA_DATA = [
    { id: '1', ticketId: 'SRV-8902', customer: 'Bostancı Lojistik', issueType: 'Motor Yağı Sevkiyat İadesi', status: 'OVERDUE', timeElapsed: '48s 12d', agent: 'Ahmet Yılmaz' },
    { id: '2', ticketId: 'SRV-8903', customer: 'Otomativ Yedek Parça A.Ş', issueType: 'Faturalandırma Hatası', status: 'IN_PROGRESS', timeElapsed: '2s 45d', agent: 'Elif Kaya' },
    { id: '3', ticketId: 'SRV-8904', customer: 'Küçük Sanayi Oto Bakım', issueType: 'Teknik Destek (Eksik Ürün)', status: 'RESOLVED', timeElapsed: '14s 00d', agent: 'Can Korkmaz' },
    { id: '4', ticketId: 'SRV-8905', customer: 'Yıldız Nakliyat', issueType: 'Hasarlı Ürün İhbarı', status: 'WARNING', timeElapsed: '23s 50d', agent: 'Ayşe Demir' },
];

export default function ServiceSlaReportPage() {
    const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);

    const handleRequestExport = async () => {
        setIsGeneratingExcel(true);
        try {
            await fetch('/api/exports/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reportType: 'SERVICE_SLA',
                    name: 'Servis Masası SLA Raporu',
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
                title="Servis Masası & SLA Panosu" 
                description="Müşteri destek hızları, aşan SLA hedefleri ve personel müdahale performansları." 
            />

            {/* 2. Executive Summaries */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-3 text-slate-500 mb-3">
                        <Clock className="w-5 h-5" />
                        <div className="text-[10px] font-bold uppercase tracking-widest">ORTALAMA ÇÖZÜM SÜRESİ</div>
                    </div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white">14s 20d</div>
                    <div className="text-xs font-semibold text-emerald-500 mt-2 block">-2 saat iyileşme var</div>
                </div>

                <div className="bg-white dark:bg-[#0f172a] border border-red-500/20 dark:border-red-500/10 rounded-3xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent z-0"></div>
                    <div className="flex items-center gap-3 text-red-500 mb-3 relative z-10">
                        <AlertTriangle className="w-5 h-5" />
                        <div className="text-[10px] font-bold uppercase tracking-widest text-red-600/70 dark:text-red-400">SLA İHLALİ (OVERDUE)</div>
                    </div>
                    <div className="text-3xl font-black text-red-600 dark:text-red-400 relative z-10">4 Bilet</div>
                    <div className="text-xs font-semibold text-red-500/70 mt-2 relative z-10">%12 oranında SLA ihlali</div>
                </div>

                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-3 text-emerald-500 mb-3">
                        <CheckCircle2 className="w-5 h-5" />
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">ÇÖZÜLEN TALEP</div>
                    </div>
                    <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">142</div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 mt-4 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full w-[88%] rounded-full"></div>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#0f172a] border border-amber-500/20 dark:border-amber-500/10 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-3 text-amber-500 mb-3">
                        <ShieldAlert className="w-5 h-5" />
                        <div className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-500">AÇIK & BEKLEYEN</div>
                    </div>
                    <div className="text-3xl font-black text-amber-600 dark:text-amber-500">18</div>
                    <div className="text-xs font-semibold text-slate-400 mt-2 block">Şu an işlemde</div>
                </div>
            </div>

            {/* 3. The Enterprise Data Grid Array */}
            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm flex flex-col">
                <div className="p-6 border-b border-slate-100 dark:border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h3 className="text-base font-black text-slate-900 dark:text-white">Açık Servis Biletleri ve SLA Durumları</h3>
                    
                    <button 
                        onClick={handleRequestExport}
                        disabled={isGeneratingExcel}
                        className="px-4 py-2 bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-100 dark:hover:bg-cyan-500/20 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                    >
                        {isGeneratingExcel ? 'Analiz Çıkarılıyor...' : 'Raporu Dışa Aktar (BullMQ)'}
                    </button>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-white/5">
                                <th className="p-5 whitespace-nowrap">Bilet ID / Müşteri</th>
                                <th className="p-5 whitespace-nowrap">Konu (Tip)</th>
                                <th className="p-5 whitespace-nowrap">Geçen Süre</th>
                                <th className="p-5 whitespace-nowrap text-center">SLA Statüsü</th>
                                <th className="p-5 whitespace-nowrap text-right">Sorumlu</th>
                            </tr>
                        </thead>
                        <tbody>
                            {SLA_DATA.map((row) => {
                                let statusBadge;
                                if (row.status === 'OVERDUE') statusBadge = <span className="px-2 py-1 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 text-[10px] font-bold uppercase rounded border border-red-200 dark:border-red-500/20">AŞIM (OVERDUE)</span>;
                                else if (row.status === 'WARNING') statusBadge = <span className="px-2 py-1 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase rounded border border-amber-200 dark:border-amber-500/20">AŞMAK ÜZERE</span>;
                                else if (row.status === 'RESOLVED') statusBadge = <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase rounded border border-emerald-200 dark:border-emerald-500/20">ÇÖZÜLDÜ</span>;
                                else statusBadge = <span className="px-2 py-1 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase rounded border border-blue-200 dark:border-blue-500/20">İŞLEMDE</span>;

                                return (
                                    <tr key={row.id} className="border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                                        <td className="p-5">
                                            <div className="text-sm font-black text-blue-600 dark:text-blue-400">{row.ticketId}</div>
                                            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">{row.customer}</div>
                                        </td>
                                        <td className="p-5 text-sm font-bold text-slate-900 dark:text-white">{row.issueType}</td>
                                        <td className="p-5 text-sm font-black text-slate-700 dark:text-slate-300">{row.timeElapsed}</td>
                                        <td className="p-5 text-center">
                                            {statusBadge}
                                        </td>
                                        <td className="p-5 text-right text-sm font-bold text-slate-600 dark:text-slate-400">
                                            {row.agent}
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
