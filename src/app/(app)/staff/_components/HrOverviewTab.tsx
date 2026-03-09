"use client";

import React from 'react';
import { Staff } from '@/contexts/AppContext';

interface HrOverviewTabProps {
    staff: Staff[];
    targets: any[];
    documentsCount?: number;
    setShowAddStaffModal: (show: boolean) => void;
    setShowTaskModal: (show: boolean) => void;
    setSelectedStaff: (staff: Staff) => void;
}

export default function HrOverviewTab({ staff, targets, documentsCount, setShowAddStaffModal, setShowTaskModal, setSelectedStaff }: HrOverviewTabProps) {
    const activeStaffCount = staff.filter(s => s.status === 'Müsait' || s.status === 'Aktif' || s.status === 'Boşta' || !s.status).length;
    const busyStaffCount = staff.filter(s => s.status === 'Meşgul' || s.currentJob).length;
    const leaveStaffCount = staff.filter(s => s.status === 'İzinli').length;
    const openTargetsCount = targets.filter(t => t.currentValue < t.targetValue).length;

    return (
        <div className="space-y-6 animate-fade-in relative">
            {/* HR Overview Dashboard Kartları */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* 1. Toplam Personel */}
                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[12px] shadow-sm p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-3">
                        <div className="text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-widest pl-1">Toplam Personel</div>
                        <div className="w-6 h-6 rounded border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 flex items-center justify-center text-[12px] text-slate-500">👥</div>
                    </div>
                    <div className="text-[24px] font-black text-slate-900 dark:text-white leading-none pl-1">{staff.length}</div>
                </div>

                {/* 2. Müsait Personel */}
                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[12px] shadow-sm p-4 flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 rounded-l-[12px]"></div>
                    <div className="flex items-center justify-between mb-3 pl-2">
                        <div className="text-slate-600 dark:text-slate-300 text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                            AKTİF / MÜSAİT
                        </div>
                        <div className="w-6 h-6 rounded border border-emerald-100 bg-emerald-50 dark:bg-emerald-500/10 dark:border-emerald-500/20 flex items-center justify-center text-[12px] text-emerald-500">✨</div>
                    </div>
                    <div className="text-[24px] font-black text-emerald-600 dark:text-emerald-400 leading-none pl-2">{activeStaffCount}</div>
                </div>

                {/* 3. Devam Eden Görev */}
                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[12px] shadow-sm p-4 flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-amber-500 rounded-l-[12px]"></div>
                    <div className="flex items-center justify-between mb-3 pl-2">
                        <div className="text-slate-600 dark:text-slate-300 text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                            DEVAM EDEN İŞ
                        </div>
                        <div className="w-6 h-6 rounded border border-amber-100 bg-amber-50 dark:bg-amber-500/10 dark:border-amber-500/20 flex items-center justify-center text-[12px] text-amber-500">⚡</div>
                    </div>
                    <div className="text-[24px] font-black text-amber-600 dark:text-amber-400 leading-none pl-2">{busyStaffCount}</div>
                </div>

                {/* 4. Hedefler / Dosyalar */}
                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[12px] shadow-sm p-4 flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 rounded-l-[12px]"></div>
                    <div className="flex items-center justify-between mb-3 pl-2">
                        <div className="text-slate-600 dark:text-slate-300 text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                            AÇIK HEDEFLER
                        </div>
                        <div className="w-6 h-6 rounded border border-blue-100 bg-blue-50 dark:bg-blue-500/10 dark:border-blue-500/20 flex items-center justify-center text-[12px] text-blue-500">🎯</div>
                    </div>
                    <div className="text-[24px] font-black text-blue-600 dark:text-blue-400 leading-none pl-2">{openTargetsCount}</div>
                </div>
            </div>

            {/* Aksiyon Şeridi (Daha İnce & Düz) */}
            <div className="bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-[12px] p-4 flex flex-col lg:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-lg flex items-center justify-center text-[16px] shadow-sm">
                        🛠️
                    </div>
                    <div>
                        <h3 className="text-[14px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Aksiyon Merkezi</h3>
                        <p className="text-[12px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Personel kartı oluştur, görev ataması yap veya listeye göz at.</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowAddStaffModal(true)} className="h-9 px-4 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 text-slate-700 dark:text-slate-200 rounded-lg font-bold text-[11px] uppercase tracking-widest flex items-center justify-center transition-all shadow-sm">
                        + YENİ PERSONEL
                    </button>
                    {/* Hızlı eylem menüsü */}
                    <button onClick={() => {
                        const firstStaff = staff[0];
                        if (firstStaff) {
                            setSelectedStaff(firstStaff);
                            setShowTaskModal(true);
                        }
                    }} className="h-9 px-4 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400 text-slate-700 dark:text-slate-200 rounded-lg font-bold text-[11px] uppercase tracking-widest flex items-center justify-center transition-all shadow-sm">
                        ⚡ GÖREV ATA
                    </button>
                </div>
            </div>

            {/* Alt Bölüm İçerik (Eklenebilir, şimdilik boş) */}
        </div>
    );
}
