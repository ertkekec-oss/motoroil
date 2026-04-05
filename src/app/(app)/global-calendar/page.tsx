"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/contexts/AppContext";
import { 
    EnterpriseSectionHeader, 
    EnterpriseButton, 
    EnterpriseCard 
} from "@/components/ui/enterprise";
import { 
    IconCalendar, 
    IconPlus, 
    IconActivity,
    IconTrendingUp,
    IconTrendingDown,
    IconFileText,
    IconWrench
} from "@/components/icons/PremiumIcons";

export default function GlobalCalendarPage() {
    const { activeTenantId, activeBranchName } = useApp();
    const [view, setView] = useState<'MONTH' | 'WEEK' | 'DAY'>('MONTH');
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/calendar/global', {
                headers: { 
                    'x-tenant-id': activeTenantId || '',
                    'x-active-branch': activeBranchName || 'Tümü'
                }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setEvents(data.events || []);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Run on mount and when branch or tenant changes
        fetchEvents();
    }, [activeTenantId, activeBranchName]);

    // Calendar Generation
    const getDaysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date: Date) => {
        const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
        return day === 0 ? 6 : day - 1; // Assuming Monday is first day
    };

    const monthDays: Date[] = [];
    const numDays = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);

    for (let i = 0; i < firstDay; i++) {
        monthDays.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), -firstDay + i + 1));
    }
    for (let i = 1; i <= numDays; i++) {
        monthDays.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
    }
    const remainingDays = 42 - monthDays.length; // 6 rows max
    for (let i = 1; i <= remainingDays; i++) {
        monthDays.push(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i));
    }

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const getTypeDetails = (type: string) => {
        switch (type) {
            case 'RECEIVABLE': return { color: 'bg-emerald-50 border-emerald-200 text-emerald-700', icon: <IconTrendingUp className="w-3 h-3" />, label: 'ALACAK' };
            case 'PAYABLE': return { color: 'bg-rose-50 border-rose-200 text-rose-700', icon: <IconTrendingDown className="w-3 h-3" />, label: 'BORÇ' };
            case 'CHECK_IN': return { color: 'bg-teal-50 border-teal-200 text-teal-700', icon: <IconFileText className="w-3 h-3" />, label: 'ÇEK (M)' };
            case 'CHECK_OUT': return { color: 'bg-orange-50 border-orange-200 text-orange-700', icon: <IconFileText className="w-3 h-3" />, label: 'ÇEK (T)' };
            case 'SERVICE': return { color: 'bg-indigo-50 border-indigo-200 text-indigo-700', icon: <IconWrench className="w-3 h-3" />, label: 'SERVİS' };
            default: return { color: 'bg-sky-50 border-sky-200 text-sky-700', icon: <IconActivity className="w-3 h-3" />, label: 'GÖREV' };
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
    };

    const handleCreateEvent = async () => {
        // Modal can be implemented similar to service/calendar/page.tsx
        alert('Hızlı Ekleme Menüsü Yakında Eklenecek');
    };

    return (
        <div className="max-w-[1600px] mx-auto pt-8 px-4 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-700 pb-40">
            <EnterpriseSectionHeader 
                title="GLOBAL TAKVİM" 
                subtitle="Tüm Alacak, Verecek, Görev, Randevu, Hatırlatma ve Kurumsal İşlemler Merkezi Planlayıcısı"
                icon={<IconCalendar />}
                rightElement={
                    <div className="flex gap-3 relative z-20 items-center">
                        <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm mr-4">
                            <button onClick={prevMonth} className="p-1 hover:bg-slate-100 rounded-md text-slate-500 font-bold">&lsaquo;</button>
                            <span className="text-xs font-bold text-slate-800 uppercase tracking-widest w-28 text-center">
                                {currentDate.toLocaleString('tr-TR', { month: 'long', year: 'numeric' })}
                            </span>
                            <button onClick={nextMonth} className="p-1 hover:bg-slate-100 rounded-md text-slate-500 font-bold">&rsaquo;</button>
                        </div>
                        <div className="flex bg-white shadow-sm ring-1 ring-slate-200 rounded-xl p-1 overflow-hidden shrink-0">
                            {['MONTH', 'WEEK'].map(v => (
                                <button key={v} onClick={() => setView(v as any)} className={`px-4 py-1.5 rounded-lg text-[10px] uppercase font-bold transition-all ${view === v ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                                    {v === 'MONTH' ? 'AYLIK' : 'HAFTALIK'}
                                </button>
                            ))}
                        </div>
                        <EnterpriseButton variant="primary" className="flex items-center gap-2 bg-slate-900 border-none rounded-xl" onClick={handleCreateEvent}>
                            <IconPlus className="w-4 h-4" /> YENİ EKLE
                        </EnterpriseButton>
                    </div>
                } 
            />

            {loading ? (
                <div className="py-20 text-center text-slate-500 font-medium">Takvim Yükleniyor...</div>
            ) : (
                <div className="bg-white dark:bg-[#1e293b] rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-slate-200/60 dark:border-white/5 overflow-hidden font-sans">
                    {/* Grid Header */}
                    <div className="grid grid-cols-7 border-b border-slate-200 dark:border-white/5 bg-slate-50/80 dark:bg-slate-900/50">
                        {['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'].map((day, i) => (
                            <div key={i} className="py-3 text-center border-r border-slate-200/50 dark:border-white/5 last:border-r-0">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{day}</span>
                            </div>
                        ))}
                    </div>

                    {/* Grid Days */}
                    <div className="grid grid-cols-7 bg-slate-100/50 dark:bg-slate-900/50">
                        {monthDays.map((date, idx) => {
                            const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                            const isToday = date.toDateString() === new Date().toDateString();
                            
                            const dayEvents = events.filter(e => {
                                if (!e.date) return false;
                                const eDate = new Date(e.date);
                                return eDate.getFullYear() === date.getFullYear() && 
                                       eDate.getMonth() === date.getMonth() && 
                                       eDate.getDate() === date.getDate();
                            });

                            return (
                                <div 
                                    key={idx} 
                                    className={`min-h-[140px] border-r border-b border-slate-200/50 dark:border-white/5 p-2 transition-colors relative
                                        ${!isCurrentMonth ? 'bg-slate-50/50 dark:bg-slate-800/20 opacity-60' : 'bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800'}
                                    `}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-[13px] font-bold w-7 h-7 flex items-center justify-center rounded-full
                                            ${isToday ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-700 dark:text-slate-300'}
                                        `}>
                                            {date.getDate()}
                                        </span>
                                        {dayEvents.length > 0 && (
                                            <span className="text-[9px] font-black text-slate-400 mt-1">{dayEvents.length} Kayıt</span>
                                        )}
                                    </div>

                                    <div className="space-y-1.5 overflow-y-auto max-h-[100px] custom-scrollbar pr-1 pb-1">
                                        {dayEvents.map(ev => {
                                            const details = getTypeDetails(ev.type);
                                            return (
                                                <div 
                                                    key={ev.id} 
                                                    title={ev.title}
                                                    className={`px-2 py-1.5 rounded-lg border text-[10px] hover:shadow-md cursor-pointer transition-all flex flex-col gap-1 ${details.color}`}
                                                >
                                                    <div className="flex justify-between items-center opacity-80">
                                                        <span className="font-bold flex items-center gap-1">
                                                            {details.icon} 
                                                            {details.label}
                                                        </span>
                                                        {ev.amount ? <span className="font-bold tracking-tight">{formatCurrency(ev.amount)}</span> : null}
                                                    </div>
                                                    <p className="font-semibold leading-tight line-clamp-1 opacity-90">{ev.title}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
