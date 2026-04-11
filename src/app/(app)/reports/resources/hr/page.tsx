"use client";

import React, { useState } from 'react';
import GlobalReportHeader from '@/components/reports/GlobalReportHeader';
import { Users, Clock, CalendarDays, AlertTriangle } from 'lucide-react';

const HR_DATA = [
    { id: '1', employee: 'Ahmet Yılmaz', department: 'Satış Şefliği', overTime: 12.5,  leaveDays: 2, status: 'NORMAL', attendanceScore: 98 },
    { id: '2', employee: 'Elif Kaya', department: 'Müşteri Hizmetleri', overTime: 32.0, leaveDays: 0, status: 'BURNOUT_RISK', attendanceScore: 100 },
    { id: '3', employee: 'Can Korkmaz', department: 'Depo Sorumlusu', overTime: 4.5, leaveDays: 14, status: 'WARNING', attendanceScore: 75 },
    { id: '4', employee: 'Ayşe Demir', department: 'İnsan Kaynakları', overTime: 0.0, leaveDays: 1, status: 'NORMAL', attendanceScore: 100 },
];

export default function HrScorecardReportPage() {
    const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);

    const handleRequestExport = async () => {
        setIsGeneratingExcel(true);
        try {
            await fetch('/api/exports/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reportType: 'RESOURCES_HR',
                    name: 'İK Puantaj ve Efor Raporu',
                    filters: {}
                })
            });
            alert('İK puantaj analizi çıkarılıyor (BullMQ).');
        } catch (e) {
            alert('Hata oluştu.');
        } finally {
            setIsGeneratingExcel(false);
        }
    };

    const totalOvertime = HR_DATA.reduce((acc, emp) => acc + emp.overTime, 0);
    const avgScore = (HR_DATA.reduce((acc, emp) => acc + emp.attendanceScore, 0) / HR_DATA.length).toFixed(1);
    const burnoutRisk = HR_DATA.filter(e => e.status === 'BURNOUT_RISK').length;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0B1220] p-4 sm:p-6 lg:p-10 pb-24 animate-in fade-in duration-300">
            
            <GlobalReportHeader 
                title="İnsan Kaynakları ve Mesai Puantajı" 
                description="Departman bazlı fazla mesai tahakkukları, devamsızlık skorları ve personel tükenmişlik (burnout) limit riskleri." 
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-3 text-slate-500 mb-3">
                        <Clock className="w-5 h-5" />
                        <div className="text-[10px] font-bold uppercase tracking-widest">TOPLAM FAZLA MESAİ</div>
                    </div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white">{totalOvertime} Saat</div>
                    <div className="text-xs font-semibold text-slate-400 mt-2 block">Şirket genel efor eklemesi</div>
                </div>

                <div className="bg-white dark:bg-[#0f172a] border border-red-500/20 dark:border-red-500/10 rounded-3xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-red-500/5 to-transparent">
                    <div className="absolute inset-0 z-0"></div>
                    <div className="flex items-center gap-3 text-red-500 mb-3 relative z-10">
                        <AlertTriangle className="w-5 h-5" />
                        <div className="text-[10px] font-bold uppercase tracking-widest text-red-600/70 dark:text-red-400">BURNOUT RİSKİ</div>
                    </div>
                    <div className="text-3xl font-black text-red-600 dark:text-red-400 relative z-10">{burnoutRisk} Personel</div>
                    <div className="text-xs font-semibold text-red-500/70 mt-2 relative z-10">Yasal mesai limitini dolduranlar</div>
                </div>

                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-3 text-emerald-500 mb-3">
                        <CalendarDays className="w-5 h-5" />
                        <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-500">KULLANILAN İZİN</div>
                    </div>
                    <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">17 Gün</div>
                    <div className="text-xs font-semibold text-slate-400 mt-2 block">Bu periyotta onaylananlar</div>
                </div>

                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-3 text-blue-500 mb-3">
                        <Users className="w-5 h-5" />
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">DEVAMSIZLIK SKORU</div>
                    </div>
                    <div className="text-3xl font-black text-blue-600 dark:text-blue-400">%{avgScore}</div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 mt-4 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full bg-blue-500`} style={{ width: `${avgScore}%` }}></div>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm flex flex-col">
                <div className="p-6 border-b border-slate-100 dark:border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h3 className="text-base font-black text-slate-900 dark:text-white">Personel Puantaj Matrisi</h3>
                    
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
                                <th className="p-5 whitespace-nowrap">Personel / Departman</th>
                                <th className="p-5 whitespace-nowrap text-right">Fazla Mesai (+Efor)</th>
                                <th className="p-5 whitespace-nowrap text-center">İzin Kullanımı</th>
                                <th className="p-5 whitespace-nowrap text-center">Katılım (Puantaj)</th>
                                <th className="p-5 whitespace-nowrap text-right">İş Sağlığı Statüsü</th>
                            </tr>
                        </thead>
                        <tbody>
                            {HR_DATA.map((row) => {
                                let badge;
                                if (row.status === 'BURNOUT_RISK') badge = <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400">TÜKENMİŞLİK (Risk)</span>;
                                else if (row.status === 'WARNING') badge = <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">DİKKAT (Gelmeyen)</span>;
                                else badge = <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">DÜZENLİ (Normal)</span>;

                                return (
                                    <tr key={row.id} className="border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                                        <td className="p-5">
                                            <div className="text-sm font-bold text-slate-900 dark:text-white">{row.employee}</div>
                                            <div className="text-[10px] text-slate-400 font-semibold mt-0.5">{row.department}</div>
                                        </td>
                                        <td className="p-5 text-right text-sm font-black text-slate-900 dark:text-white">
                                            {row.overTime > 0 ? `+${row.overTime} Saat` : '-'}
                                        </td>
                                        <td className="p-5 text-center text-sm font-semibold text-slate-600 dark:text-slate-400">
                                            {row.leaveDays > 0 ? `${row.leaveDays} Gün` : '-'}
                                        </td>
                                        <td className="p-5 text-center">
                                            <span className={`text-xs font-black ${row.attendanceScore >= 95 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                %{row.attendanceScore}
                                            </span>
                                        </td>
                                        <td className="p-5 text-right">
                                            {badge}
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
