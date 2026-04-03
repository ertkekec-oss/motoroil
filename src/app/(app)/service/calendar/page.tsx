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
    IconWrench,
} from "@/components/icons/PremiumIcons";

export default function ServiceCalendarPage() {
    const { activeTenantId } = useApp();
    const [view, setView] = useState<'MONTH' | 'WEEK' | 'DAY'>('WEEK');
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewApptModal, setShowNewApptModal] = useState(false);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/calendar/events', {
                headers: { 'x-tenant-id': activeTenantId || '' }
            });
            if (res.ok) {
                const data = await res.json();
                // Filter specifically for service orders
                setEvents(data.filter((e: any) => e.type === 'SERVICE'));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTenantId) fetchEvents();
    }, [activeTenantId]);

    // Calculate Weekly View Dates (starting Monday of current week)
    const baseDate = new Date();
    const dayOfWeek = baseDate.getDay(); // 0 is Sunday
    const diff = baseDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const startOfWeek = new Date(baseDate.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);

    const weekDates = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(startOfWeek);
        d.setDate(d.getDate() + i);
        return d;
    });

    const days = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

    const getTypeColor = () => {
        return 'bg-emerald-50 border-emerald-200 text-emerald-700';
    };

    const getTypeIcon = () => {
        return <IconWrench className="w-3 h-3" />;
    };

    const handleDragStart = (e: React.DragEvent, id: string) => {
        e.dataTransfer.setData('text/plain', id);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.currentTarget.classList.add('bg-blue-50/50');
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.currentTarget.classList.remove('bg-blue-50/50');
    };

    const handleDrop = async (e: React.DragEvent, targetDate: Date) => {
        e.preventDefault();
        e.currentTarget.classList.remove('bg-blue-50/50');
        const id = e.dataTransfer.getData('text/plain');
        if (!id) return;

        // Perform optimistic update
        setEvents(prev => prev.map(ev => ev.id === id ? { ...ev, date: targetDate.toISOString() } : ev));

        try {
            await fetch('/api/calendar/events', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'x-tenant-id': activeTenantId || '' },
                body: JSON.stringify({ id, newDate: targetDate.toISOString() })
            });
            fetchEvents(); // Reload actual state
        } catch (error) {
            console.error(error);
            fetchEvents(); // rollback
        }
    };

    const unassignedEvents = events.filter(e => !e.date);
    const scheduledEvents = events.filter(e => !!e.date);

    return (
        <div className="max-w-[1600px] mx-auto pt-8 px-4 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-700 pb-40">
            <EnterpriseSectionHeader 
                title="SERVİS RANDEVULARI" 
                subtitle="Saha ve Atölye Servis İş Emirleri Planlaması • Sürükle-Bırak Takvim"
                icon={<IconCalendar />}
                rightElement={
                    <div className="flex gap-3 relative z-20">
                        <div className="flex bg-white shadow-sm ring-1 ring-slate-200 rounded-xl p-1 overflow-hidden shrink-0">
                            {['MONTH', 'WEEK', 'DAY'].map(v => (
                                <button key={v} onClick={() => setView(v as any)} className={`px-4 py-1.5 rounded-lg text-[10px] uppercase font-bold transition-all ${view === v ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                                    {v === 'MONTH' ? 'AYLIK' : v === 'WEEK' ? 'HAFTALIK' : 'GÜNLÜK'}
                                </button>
                            ))}
                        </div>
                        <EnterpriseButton variant="primary" className="flex items-center gap-2 bg-slate-900 border-none rounded-xl" onClick={() => setShowNewApptModal(true)}>
                            <IconPlus className="w-4 h-4" /> YENİ RANDEVU
                        </EnterpriseButton>
                    </div>
                } 
            />

            {loading ? (
                <div className="py-20 text-center text-slate-500 font-medium">Randevular Yükleniyor...</div>
            ) : (
                <div className="flex gap-6">
                    {/* Left Pane (Backlog) */}
                    <div className="w-72 shrink-0 space-y-6">
                        <EnterpriseCard className="p-5 font-sans flex flex-col h-[500px]">
                            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center justify-between">
                                Atama Bekleyenler
                                <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{unassignedEvents.length}</span>
                            </h3>
                            <div className="flex-1 overflow-y-auto custom-scroll -mr-2 pr-2 space-y-3">
                                {unassignedEvents.length === 0 ? (
                                    <div className="text-xs text-slate-400 font-medium text-center py-10">Tüm randevular planlanmış.</div>
                                ) : (
                                    unassignedEvents.map(ev => (
                                        <div 
                                            key={ev.id} 
                                            draggable 
                                            onDragStart={(e) => handleDragStart(e, ev.id)}
                                            className={`p-3 rounded-[14px] border border-dashed text-xs cursor-grab active:cursor-grabbing hover:shadow-md transition-all ${getTypeColor()}`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                {getTypeIcon()}
                                                <span className="font-bold text-[9px] uppercase tracking-wider bg-white/50 px-1.5 rounded text-inherit">PLANLA</span>
                                            </div>
                                            <p className="font-black mb-1 line-clamp-2">{ev.title}</p>
                                            <p className="text-[10px] font-bold opacity-80">{ev.assignee}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </EnterpriseCard>
                    </div>

                    {/* Main Calendar Area (Weekly View) */}
                    <div className="flex-1 bg-white dark:bg-[#1e293b] rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-200 dark:border-white/5 p-0 overflow-hidden font-sans flex flex-col h-[800px]">
                        <div className="grid grid-cols-6 border-b border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/50">
                            {weekDates.map((date, i) => {
                                const isToday = date.toDateString() === new Date().toDateString();
                                return (
                                    <div key={i} className="py-4 text-center border-r border-slate-200/60 dark:border-white/5 last:border-r-0">
                                        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest block mb-1">{days[i]}</span>
                                        <span className={`text-xl font-black ${isToday ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400 w-8 h-8 rounded-full inline-flex items-center justify-center -ml-4 -mr-4' : 'text-slate-700 dark:text-slate-300'}`}>
                                            {date.getDate()}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                        
                        <div className="flex-1 grid grid-cols-6 relative bg-slate-50/20 dark:bg-slate-900/20">
                            {weekDates.map((date, colIndex) => {
                                const dayEvents = scheduledEvents.filter(e => {
                                    const eDate = new Date(e.date);
                                    return eDate.getDate() === date.getDate() && eDate.getMonth() === date.getMonth();
                                });

                                return (
                                    <div 
                                        key={colIndex} 
                                        className="border-r border-slate-200/50 dark:border-white/5 h-full p-2 space-y-2 transition-colors relative"
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={(e) => handleDrop(e, date)}
                                    >
                                        <div className="absolute inset-0 pointer-events-none opacity-0 transition-opacity drop-zone-overlay bg-blue-50/20 border-2 border-blue-200 border-dashed rounded-[16px] m-1" />
                                        
                                        {dayEvents.map(ev => (
                                            <div 
                                                key={ev.id} 
                                                draggable 
                                                onDragStart={(e) => handleDragStart(e, ev.id)}
                                                className={`p-3 rounded-[14px] border text-xs cursor-grab hover:shadow-md transition-all ${getTypeColor()}`}
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    {getTypeIcon()}
                                                    <span className="font-bold text-[9px] uppercase tracking-wider bg-white/50 px-1.5 rounded">{new Date(ev.date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                                <p className="font-black mb-1 leading-tight line-clamp-2">{ev.title}</p>
                                                <p className="text-[10px] font-bold opacity-80">{ev.assignee}</p>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
            {showNewApptModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={() => setShowNewApptModal(false)}>
                    <div className="bg-white dark:bg-[#0f172a] rounded-[24px] shadow-2xl w-full max-w-[500px] p-6 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-black dark:text-white">Hızlı Servis Randevusu</h2>
                            <button onClick={() => setShowNewApptModal(false)} className="w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-slate-800 dark:hover:text-white">✕</button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Müşteri / Firma</label>
                                <input type="text" placeholder="Müşteri ara..." className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-[13px] font-bold outline-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Tarih</label>
                                    <input type="date" className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-[13px] font-bold outline-none" />
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Saat</label>
                                    <input type="time" className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-[13px] font-bold outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Şikayet / Talep</label>
                                <textarea placeholder="Örn: Yıllık Periyodik Bakım..." className="w-full h-24 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-[13px] font-bold outline-none resize-none"></textarea>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowNewApptModal(false)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-white rounded-xl font-bold">İptal</button>
                            <button onClick={() => { setShowNewApptModal(false); /* Fake save */ }} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold">Randevu Oluştur</button>
                        </div>
                    </div>
                </div>
            )}
            <style jsx global>{`
                .custom-scroll::-webkit-scrollbar { width: 6px; }
                .custom-scroll::-webkit-scrollbar-track { background: transparent; }
                .custom-scroll::-webkit-scrollbar-thumb { background: rgba(148,163,184,0.3); border-radius: 10px; }
            `}</style>
        </div>
    );
}
