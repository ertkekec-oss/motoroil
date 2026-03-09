"use client";

import React, { useState } from 'react';
import { Staff } from '@/contexts/AppContext';

interface HrTasksTabProps {
    staff: Staff[];
    setSelectedStaff: (staff: Staff) => void;
    setShowTaskModal: (show: boolean) => void;
}

export default function HrTasksTab({ staff, setSelectedStaff, setShowTaskModal }: HrTasksTabProps) {
    const [searchTerm, setSearchTerm] = useState('');

    // Yalnızca devam eden/aktif işi (currentJob) olan çalışanları listele, 
    // ama tüm personeller de aranabilsin.
    const tasks = staff.filter(s => !!s.currentJob &&
        (s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.currentJob.toLowerCase().includes(searchTerm.toLowerCase())));

    return (
        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] shadow-sm overflow-hidden animate-fade-in relative min-h-[500px]">
            {/* Tab Header & Search */}
            <div className="p-6 border-b border-slate-100 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 dark:bg-[#1e293b]">
                <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <span>⚡</span> Devam Eden Görevler
                    </h3>
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium mt-1">Personellere atanan anlık görevlerin takibi</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative min-w-[280px]">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                        <input
                            type="text"
                            placeholder="Personel veya görev ara..."
                            className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[12px] h-[40px] pl-10 pr-4 text-[13px] font-semibold outline-none focus:border-blue-500 transition-all placeholder:font-medium placeholder:text-slate-400 text-slate-900 dark:text-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Task List */}
            <div className="overflow-x-auto p-4 max-h-[600px] overflow-y-auto">
                <table className="w-full text-left">
                    <thead className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest sticky top-0 bg-white dark:bg-[#0f172a] z-10 border-b border-slate-100 dark:border-white/5">
                        <tr>
                            <th className="p-4 pl-6 font-bold w-[250px]">Atanan Kişi</th>
                            <th className="p-4 font-bold">Görev/İş Tanımı</th>
                            <th className="p-4 font-bold w-[120px]">Durum</th>
                            <th className="p-4 font-bold text-right pr-6 w-[120px]">İşlem</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {tasks.length > 0 ? (
                            tasks.map(person => (
                                <tr key={person.id} className="hover:bg-slate-50 dark:hover:bg-[#1e293b]/70 transition-colors h-[70px] group">
                                    <td className="p-4 pl-6 align-middle">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#334155]/50 border border-slate-200 dark:border-white/5 flex items-center justify-center text-[13px] font-black text-slate-600 dark:text-slate-400 shrink-0">
                                                {person.name.charAt(0)}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <div className="text-[14px] font-bold text-slate-900 dark:text-white truncate">{person.name}</div>
                                                <div className="text-[11px] text-slate-500 font-medium tracking-wider uppercase truncate">{person.role}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 align-middle">
                                        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 px-4 py-2 rounded-xl text-[13px] font-semibold line-clamp-2">
                                            {person.currentJob}
                                        </div>
                                    </td>
                                    <td className="p-4 align-middle">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded-full text-[11px] font-bold uppercase tracking-widest border border-amber-200 dark:border-amber-500/20 whitespace-nowrap">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse animate-duration-1000"></span>
                                            MEŞGUL
                                        </span>
                                    </td>
                                    <td className="p-4 align-middle text-right pr-6">
                                        <button
                                            onClick={() => {
                                                setSelectedStaff(person);
                                                setShowTaskModal(true); // Açıldığında mevcudu görüp düzenleyecek
                                            }}
                                            className="h-8 px-4 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 hover:border-blue-500 hover:text-blue-600 text-slate-600 dark:text-slate-300 text-[12px] font-bold transition-all shadow-sm opacity-60 group-hover:opacity-100"
                                        >
                                            Düzenle
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="p-16 text-center">
                                    <div className="flex flex-col items-center justify-center gap-3">
                                        <div className="text-4xl">🌤️</div>
                                        <h4 className="text-[15px] font-bold text-slate-700 dark:text-slate-300">Şu An Bekleyen Görev Yok</h4>
                                        <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">Aktif olan personel için yeni görev atayabilirsiniz.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Bottom Actions if tasks empty */}
            {tasks.length === 0 && (
                <div className="absolute bottom-6 inset-x-0 flex justify-center">
                    <button
                        onClick={() => {
                            if (staff.length > 0) {
                                setSelectedStaff(staff[0]);
                                setShowTaskModal(true);
                            }
                        }}
                        className="h-12 px-6 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-[14px] flex items-center justify-center gap-2 transition-all shadow-md hover:-translate-y-0.5"
                    >
                        <span>⚡</span> İLK GÖREVİ ATA
                    </button>
                </div>
            )}
        </div>
    );
}
