"use client";

import React, { useState } from 'react';
import GlobalReportHeader from '@/components/reports/GlobalReportHeader';
import { ShieldAlert, AlertOctagon, Fingerprint, Activity } from 'lucide-react';

const ANOMALY_DATA = [
    { id: '1', date: '2026-04-12 14:05', user: 'Ahmet Yılmaz', type: 'EXCESS_DISCOUNT', description: '%45 İskonto uygulandı (Limit: %15)', severity: 'HIGH', status: 'UNRESOLVED' },
    { id: '2', date: '2026-04-11 23:30', user: 'SYSTEM_API', type: 'OUT_OF_HOURS', description: 'Mesai dışı fatura iptal işlemi', severity: 'CRITICAL', status: 'INVESTIGATING' },
    { id: '3', date: '2026-04-11 10:15', user: 'Elif Kaya', type: 'DATA_MODIFICATION', description: 'Geçmiş tarihli cari fiş düzenlemesi', severity: 'MEDIUM', status: 'RESOLVED' },
    { id: '4', date: '2026-04-10 09:00', user: 'Can Korkmaz', type: 'UNAUTHORIZED_LOGIN', description: 'Yetkisiz menü (Ayarlar) erişim denemesi', severity: 'LOW', status: 'IGNORED' },
];

export default function AnomaliesReportPage() {
    const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);

    const handleRequestExport = async () => {
        setIsGeneratingExcel(true);
        try {
            await fetch('/api/exports/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reportType: 'FINANCE_ANOMALIES',
                    name: 'Sistem Anomalileri Raporu',
                    filters: {}
                })
            });
            alert('Gecikme Tespiti / Anomali raporu hazırlanıyor (BullMQ).');
        } catch (e) {
            alert('Hata oluştu.');
        } finally {
            setIsGeneratingExcel(false);
        }
    };

    const criticalCount = ANOMALY_DATA.filter(a => a.severity === 'CRITICAL' || a.severity === 'HIGH').length;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0B1220] p-4 sm:p-6 lg:p-10 pb-24 animate-in fade-in duration-300">
            
            <GlobalReportHeader 
                title="Sistem Anomalileri & Zafiyet Raporu" 
                description="Kritik finansal sınırların aşılması, silinen tahsilatlar ve AI destekli alışılmadık personel hareketlerinin tespiti." 
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] p-6 shadow-sm flex flex-col justify-between ">
                    <div className="absolute inset-0 z-0"></div>
                    <div className="flex items-center gap-3 text-red-500 mb-3">
                        <ShieldAlert className="w-5 h-5" />
                        <div className="text-[10px] font-bold uppercase tracking-widest text-red-600/70 dark:text-red-400">YÜKSEK RİSKLİ ŞÜPHE</div>
                    </div>
                    <div className="text-3xl font-black text-red-600 dark:text-red-400">{criticalCount} Tespit</div>
                    <div className="text-xs font-semibold text-red-500/70 mt-2">İncelenmesi gereken kritik olay</div>
                </div>

                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] p-6 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-3 text-amber-500 mb-3">
                        <AlertOctagon className="w-5 h-5" />
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">KURAL İHLALİ (İSKONTO)</div>
                    </div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white">12 Adet</div>
                    <div className="text-xs font-semibold text-slate-400 mt-2 block">Yetki dışı fiyat/indirim değişikliği</div>
                </div>

                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] p-6 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-3 text-blue-500 mb-3">
                        <Activity className="w-5 h-5" />
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">MESAİ DIŞI AKTİVİTE</div>
                    </div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white">4 İşlem</div>
                    <div className="text-xs font-semibold text-slate-400 mt-2 block">Gece 22:00 - 06:00 arası girişler</div>
                </div>

                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] p-6 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-3 text-emerald-500 mb-3">
                        <Fingerprint className="w-5 h-5" />
                        <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-500">SİSTEM SAĞLIK SKORU</div>
                    </div>
                    <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">82/100</div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 mt-4 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full bg-emerald-500`} style={{ width: `82%` }}></div>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] overflow-hidden shadow-sm flex flex-col">
                <div className="p-6 border-b border-slate-100 dark:border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h3 className="text-base font-black text-slate-900 dark:text-white">AI Log Alarm Kayıtları</h3>
                    
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
                                <th className="p-5 whitespace-nowrap">Tarih & Saat</th>
                                <th className="p-5 whitespace-nowrap">Aktör (Kullanıcı)</th>
                                <th className="p-5 whitespace-nowrap">Anomali Tipi & Detay</th>
                                <th className="p-5 whitespace-nowrap text-center">Tehlike Skoru</th>
                                <th className="p-5 whitespace-nowrap text-right">Aksiyon Statüsü</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ANOMALY_DATA.map((row) => {
                                let badge;
                                if (row.severity === 'CRITICAL') badge = <span className="text-red-600 dark:text-red-400 font-black">🔴 KRİTİK</span>;
                                else if (row.severity === 'HIGH') badge = <span className="text-orange-500 font-bold">🟠 YÜKSEK</span>;
                                else if (row.severity === 'MEDIUM') badge = <span className="text-blue-500 font-semibold">🔵 ORTA</span>;
                                else badge = <span className="text-slate-500 font-semibold">⚪ DÜŞÜK</span>;

                                return (
                                    <tr key={row.id} className="border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                                        <td className="p-5 text-sm font-bold text-slate-600 dark:text-slate-400">
                                            {row.date}
                                        </td>
                                        <td className="p-5 font-bold text-sm text-slate-900 dark:text-white">
                                            {row.user}
                                        </td>
                                        <td className="p-5">
                                            <div className="text-sm font-bold text-slate-900 dark:text-white">{row.description}</div>
                                            <div className="text-[10px] text-slate-400 font-semibold mt-0.5">{row.type}</div>
                                        </td>
                                        <td className="p-5 text-center text-sm">
                                            {badge}
                                        </td>
                                        <td className="p-5 text-right">
                                            <span className={`px-2 py-1 rounded border text-[10px] font-bold uppercase ${row.status === 'UNRESOLVED' || row.status === 'INVESTIGATING' ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:border-slate-200' : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:border-white/5'}`}>
                                                {row.status}
                                            </span>
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
