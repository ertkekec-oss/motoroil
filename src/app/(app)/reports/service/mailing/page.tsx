"use client";

import React, { useState } from 'react';
import GlobalReportHeader from '@/components/reports/GlobalReportHeader';
import { Mail, Send, Eye, MousePointerClick } from 'lucide-react';

const MAILING_DATA = [
    { id: '1', title: 'Q1 Müşteri Memnuniyeti Anketi', type: 'E-MAIL', sent: 15400, opened: 6200, clicked: 1200, bounce: 45 },
    { id: '2', title: 'Bahar Kampanyası Kuponları', type: 'SMS', sent: 8500, opened: 8200, clicked: 4100, bounce: 120 },
    { id: '3', title: 'Yeni Yıl Kutlama', type: 'E-MAIL', sent: 45000, opened: 25000, clicked: 500, bounce: 600 },
    { id: '4', title: 'Ağır Vasıta Parça İndirimleri', type: 'SMS', sent: 2100, opened: 1950, clicked: 850, bounce: 12 },
];

export default function MailingReportPage() {
    const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);

    const handleRequestExport = async () => {
        setIsGeneratingExcel(true);
        try {
            await fetch('/api/exports/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reportType: 'SERVICE_MAILING',
                    name: 'Toplu İletişim & Mailing Raporu',
                    filters: {}
                })
            });
            alert('Mailing raporu oluşturuluyor.');
        } catch (e) {
            alert('Hata oluştu.');
        } finally {
            setIsGeneratingExcel(false);
        }
    };

    const totalSent = MAILING_DATA.reduce((acc, c) => acc + c.sent, 0);
    const totalOpened = MAILING_DATA.reduce((acc, c) => acc + c.opened, 0);
    const avgOpenRate = ((totalOpened / totalSent) * 100).toFixed(1);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0B1220] p-4 sm:p-6 lg:p-10 pb-24 animate-in fade-in duration-300">
            <GlobalReportHeader 
                title="Toplu İletişim (SMS/E-Mail) Analizi" 
                description="Müşterilere yollanan pazarlama mesajları, e-posta açılma oranları (Open Rate) ve link tıklama dönüşümleri." 
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] p-6 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-3 text-slate-500 mb-3">
                        <Send className="w-5 h-5" />
                        <div className="text-[10px] font-bold uppercase tracking-widest">TOPLAM GÖNDERİM</div>
                    </div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white">{(totalSent / 1000).toFixed(1)}k</div>
                    <div className="text-xs font-semibold text-slate-400 mt-2 block">Başarıyla sunucuya iletilen</div>
                </div>

                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] p-6 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-3 text-blue-500 mb-3">
                        <Eye className="w-5 h-5" />
                        <div className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-500">AÇILMA ORANI (OPEN RATE)</div>
                    </div>
                    <div className="text-3xl font-black text-blue-600 dark:text-blue-400">%{avgOpenRate}</div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 mt-4 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full bg-blue-500`} style={{ width: `${avgOpenRate}%` }}></div>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] p-6 shadow-sm flex flex-col justify-between relative ">
                    <div className="flex items-center gap-3 text-emerald-500 mb-3">
                        <MousePointerClick className="w-5 h-5" />
                        <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-500">TIKLAMA (CTR)</div>
                    </div>
                    <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">%9.3</div>
                    <div className="text-xs font-semibold text-emerald-500/70 mt-2">Bağlantılara dokunma oranı</div>
                </div>

                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] p-6 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-3 text-amber-500 mb-3">
                        <Mail className="w-5 h-5" />
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">KAMPANYA GİDERİ</div>
                    </div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white">₺12,450</div>
                    <div className="text-xs font-semibold text-slate-400 mt-2 block">SMS ve E-Mail operasyon bedeli</div>
                </div>
            </div>

            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] overflow-hidden shadow-sm flex flex-col">
                <div className="p-6 border-b border-slate-100 dark:border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h3 className="text-base font-black text-slate-900 dark:text-white">Toplu Gönderim Logları</h3>
                    <button onClick={handleRequestExport} disabled={isGeneratingExcel} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition-colors disabled:opacity-50">
                        {isGeneratingExcel ? 'Analiz Çıkarılıyor...' : 'Raporu Dışa Aktar (BullMQ)'}
                    </button>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-white/5">
                                <th className="p-5 whitespace-nowrap">Gönderim Başlığı</th>
                                <th className="p-5 whitespace-nowrap">Kanal</th>
                                <th className="p-5 whitespace-nowrap text-right">Hedef Kitle (Gönderilen)</th>
                                <th className="p-5 whitespace-nowrap text-center">Açılma Oranı</th>
                                <th className="p-5 whitespace-nowrap text-center">Tıklama</th>
                                <th className="p-5 whitespace-nowrap text-center text-red-500">Hatalı (Bounce)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {MAILING_DATA.map((row) => {
                                const openRate = ((row.opened / row.sent) * 100).toFixed(1);
                                const clickRate = ((row.clicked / row.opened) * 100).toFixed(1);

                                return (
                                    <tr key={row.id} className="border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                                        <td className="p-5 font-bold text-sm text-slate-900 dark:text-white">{row.title}</td>
                                        <td className="p-5 text-center">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${row.type === 'SMS' ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'}`}>
                                                {row.type}
                                            </span>
                                        </td>
                                        <td className="p-5 text-right font-black text-slate-800 dark:text-slate-200">{row.sent.toLocaleString()}</td>
                                        <td className="p-5 text-center font-bold text-blue-600 dark:text-blue-400">%{openRate}</td>
                                        <td className="p-5 text-center font-bold text-emerald-600 dark:text-emerald-400">%{clickRate}</td>
                                        <td className="p-5 text-center font-semibold text-red-600/80 dark:text-red-400/80">{row.bounce}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
