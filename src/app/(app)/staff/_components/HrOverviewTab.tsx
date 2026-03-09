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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Toplam Personel */}
                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[16px] shadow-sm p-6 flex flex-col justify-between">
                    <div className="flex items-start justify-between mb-4">
                        <div className="text-slate-500 dark:text-slate-400 text-[12px] font-bold uppercase tracking-widest">TOPLAM PERSONEL</div>
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">👥</div>
                    </div>
                    <div className="text-[32px] font-black text-slate-900 dark:text-white leading-none">{staff.length} <span className="text-[14px] font-semibold text-slate-500 ml-1">Kişi</span></div>
                </div>

                {/* 2. Müsait Personel */}
                <div className="bg-white dark:bg-[#0f172a] border border-emerald-100 dark:border-emerald-500/20 rounded-[16px] shadow-sm p-6 flex flex-col justify-between">
                    <div className="flex items-start justify-between mb-4">
                        <div className="text-emerald-700 dark:text-emerald-400 text-[12px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div> AKTİF & MÜSAİT
                        </div>
                        <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500">✨</div>
                    </div>
                    <div className="text-[32px] font-black text-emerald-600 dark:text-emerald-400 leading-none">{activeStaffCount} <span className="text-[14px] font-semibold opacity-70 ml-1">Kişi</span></div>
                </div>

                {/* 3. Devam Eden Görev */}
                <div className="bg-white dark:bg-[#0f172a] border border-amber-100 dark:border-amber-500/20 rounded-[16px] shadow-sm p-6 flex flex-col justify-between">
                    <div className="flex items-start justify-between mb-4">
                        <div className="text-amber-700 dark:text-amber-400 text-[12px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-amber-500"></div> DEVAM EDEN İŞ
                        </div>
                        <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-500">⚒️</div>
                    </div>
                    <div className="text-[32px] font-black text-amber-600 dark:text-amber-400 leading-none">{busyStaffCount} <span className="text-[14px] font-semibold opacity-70 ml-1">Kişi</span></div>
                </div>

                {/* 4. Hedefler / Dosyalar */}
                <div className="bg-white dark:bg-[#0f172a] border border-blue-100 dark:border-blue-500/20 rounded-[16px] shadow-sm p-6 flex flex-col justify-between">
                    <div className="flex items-start justify-between mb-4">
                        <div className="text-blue-700 dark:text-blue-400 text-[12px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-blue-600"></div> AÇIK HEDEFLER
                        </div>
                        <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500">🎯</div>
                    </div>
                    <div className="text-[32px] font-black text-blue-600 dark:text-blue-400 leading-none">{openTargetsCount} <span className="text-[14px] font-semibold opacity-70 ml-1">Hedef</span></div>
                </div>
            </div>

            {/* Aksiyon Şeridi */}
            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[16px] p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">İnsan Kaynakları Aksiyon Merkezi</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Personel oluşturma, görev atama veya izin kayıtlarını hızlıca yönetin.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setShowAddStaffModal(true)} className="h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm flex items-center justify-center transition-all shadow-sm">
                        + YENİ PERSONEL EKLE
                    </button>
                    {/* Hızlı eylem menüsü (İsteğe bağlı) */}
                    <button onClick={() => {
                        const firstStaff = staff[0];
                        if (firstStaff) {
                            setSelectedStaff(firstStaff);
                            setShowTaskModal(true);
                        }
                    }} className="h-10 px-5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-sm flex items-center justify-center transition-all shadow-sm">
                        ⚡ GÖREV ATA
                    </button>
                </div>
            </div>

            {/* Alt Bölüm İçerik (Eklenebilir, şimdilik boş) */}
        </div>
    );
}
