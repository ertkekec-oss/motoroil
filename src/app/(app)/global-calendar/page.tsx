"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/contexts/AppContext";
import { useModal } from "@/contexts/ModalContext";
import { useTheme } from "@/contexts/ThemeContext";
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
    const { activeTenantId, activeBranchName, staff } = useApp();
    const { showSuccess, showError } = useModal();
    const { theme } = useTheme();
    const isLight = theme === 'light';

    const [view, setView] = useState<'MONTH' | 'WEEK' | 'DAY'>('MONTH');
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());

    // Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [newEvent, setNewEvent] = useState({
        title: "",
        type: "TASK",
        priority: "MEDIUM",
        assigneeId: "",
        dueDate: new Date().toISOString().split('T')[0],
        description: ""
    });

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
        fetchEvents();
    }, [activeTenantId, activeBranchName]);

    // Calendar Generation
    const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const getFirstDayOfMonth = (date: Date) => {
        const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
        return day === 0 ? 6 : day - 1; 
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
    const remainingDays = 42 - monthDays.length;
    for (let i = 1; i <= remainingDays; i++) {
        monthDays.push(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i));
    }

    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

    const getTypeDetails = (type: string) => {
        switch (type) {
            case 'RECEIVABLE': return { color: isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400', icon: <IconTrendingUp className="w-3 h-3" />, label: 'ALACAK' };
            case 'PAYABLE': return { color: isLight ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-rose-500/10 border-rose-500/20 text-rose-400', icon: <IconTrendingDown className="w-3 h-3" />, label: 'BORÇ' };
            case 'CHECK_IN': return { color: isLight ? 'bg-teal-50 border-teal-200 text-teal-800' : 'bg-teal-500/10 border-teal-500/20 text-teal-400', icon: <IconFileText className="w-3 h-3" />, label: 'ÇEK (M)' };
            case 'CHECK_OUT': return { color: isLight ? 'bg-orange-50 border-orange-200 text-orange-800' : 'bg-orange-500/10 border-orange-500/20 text-orange-400', icon: <IconFileText className="w-3 h-3" />, label: 'ÇEK (T)' };
            case 'SERVICE': return { color: isLight ? 'bg-purple-50 border-purple-200 text-purple-800' : 'bg-purple-500/10 border-purple-500/20 text-purple-400', icon: <IconWrench className="w-3 h-3" />, label: 'SERVİS' };
            default: return { color: isLight ? 'bg-indigo-50 border-indigo-200 text-indigo-800' : 'bg-blue-500/10 border-blue-500/20 text-blue-400', icon: <IconActivity className="w-3 h-3" />, label: 'GÖREV' };
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(amount);
    };

    const handleSaveEvent = async () => {
        if (!newEvent.title || !newEvent.dueDate) {
            showError("Hata", "Lütfen etkinlik başlığı ve tarihi girin.");
            return;
        }

        setIsProcessing(true);
        try {
            const res = await fetch('/api/calendar/global', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newEvent.title,
                    type: newEvent.type,
                    priority: newEvent.priority,
                    assigneeId: newEvent.assigneeId || null,
                    dueDate: new Date(newEvent.dueDate).toISOString(),
                    startTime: new Date(newEvent.dueDate).toISOString(),
                    isAllDay: true,
                    description: newEvent.description
                })
            });

            const data = await res.json();
            if (data.success) {
                showSuccess("Başarılı", "Yeni etkinlik takvime işlendi.");
                setIsAddModalOpen(false);
                setNewEvent({ title: "", type: "TASK", priority: "MEDIUM", assigneeId: "", dueDate: new Date().toISOString().split('T')[0], description: "" });
                fetchEvents();
            } else {
                showError("Kayıt Başarısız", data.error || "Beklenmeyen bir hata oluştu.");
            }
        } catch (error) {
            showError("Hata", "Sistem ile bağlantı kurulamadı.");
        } finally {
            setIsProcessing(false);
        }
    };

    const textValueClass = isLight ? "text-slate-900" : "text-white";
    const textLabelClass = isLight ? "text-slate-500" : "text-slate-400";
    const bgContainer = isLight ? "bg-white" : "bg-[#0f172a]";

    return (
        <div data-pos-theme={theme} className={`w-full min-h-[100vh] px-8 py-8 space-y-6 transition-colors duration-300 font-sans ${isLight ? 'bg-[#FAFAFA]' : ''}`}>
            
            {/* Enterprise Header Section */}
            <div className={`p-6 rounded-[24px] border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'} shadow-sm flex flex-wrap gap-4 items-center justify-between`}>
                <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 bg-blue-600 rounded-[12px] flex items-center justify-center shadow-lg shadow-blue-600/20 text-white">
                        <IconCalendar className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className={`text-[20px] font-bold ${textValueClass}`}>Global Takvim Kapısı</h2>
                        <p className={`text-[12px] mt-0.5 ${textLabelClass}`}>Şirkete ve şubeye özel tüm operasyonel, finansal ve zimmet aktiviteleri</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className={`flex items-center gap-3 px-3 py-1.5 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200 shadow-inner' : 'bg-black/20 border-white/5'}`}>
                        <button onClick={prevMonth} className={`p-1.5 rounded-lg transition-colors ${isLight ? 'hover:bg-white' : 'hover:bg-slate-800'}`}>&lsaquo;</button>
                        <span className={`text-[12px] font-black uppercase tracking-widest w-32 justify-center flex ${textValueClass}`}>
                            {currentDate.toLocaleString('tr-TR', { month: 'long', year: 'numeric' })}
                        </span>
                        <button onClick={nextMonth} className={`p-1.5 rounded-lg transition-colors ${isLight ? 'hover:bg-white' : 'hover:bg-slate-800'}`}>&rsaquo;</button>
                    </div>
                    
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="h-[44px] px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-[12px] font-bold text-[13px] flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20"
                    >
                        <IconPlus className="w-4 h-4" /> YENİ GÖREV EKLE
                    </button>
                </div>
            </div>

            {loading ? (
                <div className={`py-32 flex flex-col items-center justify-center rounded-[24px] border ${isLight ? 'bg-white border-slate-200' : 'bg-[#0f172a] border-white/5'}`}>
                    <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                    <span className="mt-4 font-bold text-slate-500 text-[13px] uppercase tracking-widest">Takvim Çekiliyor...</span>
                </div>
            ) : (
                <div className={`rounded-[24px] shadow-sm border overflow-hidden ${isLight ? 'bg-white border-slate-200' : 'bg-[#0f172a] border-white/5'}`}>
                    
                    {/* Calendar Head */}
                    <div className={`grid grid-cols-7 border-b ${isLight ? 'border-slate-200 bg-slate-50' : 'border-white/5 bg-[#1e293b]'}`}>
                        {['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'].map((day, i) => (
                            <div key={i} className={`py-4 text-center border-r last:border-r-0 ${isLight ? 'border-slate-200' : 'border-white/5'}`}>
                                <span className={`text-[11px] font-black uppercase tracking-widest ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>{day}</span>
                            </div>
                        ))}
                    </div>

                    {/* Calendar Body */}
                    <div className={`grid grid-cols-7 ${isLight ? 'bg-white' : 'bg-[#0f172a]'}`}>
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
                                    className={`min-h-[150px] border-r border-b p-2 flex flex-col transition-colors group
                                        ${isLight ? 'border-slate-100 hover:bg-slate-50' : 'border-white/5 hover:bg-slate-900/50'}
                                        ${!isCurrentMonth ? (isLight ? 'bg-slate-50/50 opacity-50' : 'opacity-40') : ''}
                                    `}
                                >
                                    {/* Day Number Header */}
                                    <div className="flex justify-between items-start mb-2 px-1 pt-1">
                                        <span className={`text-[12px] font-black w-8 h-8 flex items-center justify-center rounded-full transition-transform
                                            ${isToday ? 'bg-blue-600 text-white shadow-xl scale-110 shadow-blue-600/30' : (isLight ? 'text-slate-600 group-hover:bg-slate-200' : 'text-slate-300 group-hover:bg-slate-800')}
                                        `}>
                                            {date.getDate()}
                                        </span>
                                    </div>

                                    {/* Events List */}
                                    <div className="flex-1 space-y-1.5 overflow-y-auto max-h-[110px] custom-scrollbar pr-1 pb-1">
                                        {dayEvents.map(ev => {
                                            const details = getTypeDetails(ev.type);
                                            return (
                                                <div 
                                                    key={ev.id} 
                                                    title={ev.title}
                                                    className={`px-2.5 py-2 rounded-[8px] border text-[11px] shadow-sm hover:shadow-md cursor-pointer transition-all flex flex-col gap-1.5 ${details.color}`}
                                                >
                                                    <div className="flex justify-between items-center opacity-90">
                                                        <span className="font-bold flex items-center gap-1.5 text-[9px] tracking-widest">
                                                            {details.icon} 
                                                            {details.label}
                                                        </span>
                                                        {ev.amount ? <span className="font-extrabold tracking-tight">{formatCurrency(ev.amount)}</span> : null}
                                                    </div>
                                                    <p className="font-bold leading-snug line-clamp-2 opacity-100 text-[11px]">{ev.title}</p>
                                                    {ev.assignee && ev.assignee !== 'Atanmamış' && (
                                                        <div className="text-[9px] opacity-70 font-semibold truncate pt-1 border-t border-inherit/20 mt-0.5">
                                                            Kişi: {ev.assignee}
                                                        </div>
                                                    )}
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

            {/* ADD EVENT MODAL */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm z-[9999]">
                    <div className={`w-full max-w-[500px] rounded-[24px] shadow-2xl animate-in fade-in zoom-in-95 ${isLight ? 'bg-white' : 'bg-slate-900 border border-slate-800'}`}>
                        <div className={`p-6 border-b flex justify-between items-center ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                            <h3 className={`text-[18px] font-bold ${textValueClass}`}>Yeni Görev / Ajanda Kaydı</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className={`text-[20px] ${textLabelClass}`}>&times;</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className={`block text-[11px] font-bold uppercase tracking-widest mb-1.5 ${textLabelClass}`}>Görev Başlığı</label>
                                <input 
                                    type="text" 
                                    value={newEvent.title} 
                                    onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                                    placeholder="Örn: Araç Muayenesi / Finansal Kontrol"
                                    className={`w-full px-3 py-3 rounded-[12px] text-[13px] font-bold border outline-none ${isLight ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500' : 'bg-black/20 border-white/10 text-white focus:border-blue-500'}`}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={`block text-[11px] font-bold uppercase tracking-widest mb-1.5 ${textLabelClass}`}>Kategori</label>
                                    <select 
                                        value={newEvent.type} 
                                        onChange={e => setNewEvent({...newEvent, type: e.target.value})}
                                        className={`w-full px-3 py-3 rounded-[12px] text-[13px] font-bold border outline-none ${isLight ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500' : 'bg-black/20 border-white/10 text-white focus:border-blue-500'}`}
                                    >
                                        <option value="TASK">Genel Görev</option>
                                        <option value="MEETING">Toplantı</option>
                                        <option value="CALL">Görüşme / Çağrı</option>
                                        <option value="SERVICE_APPOINTMENT">Servis Randevusu</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={`block text-[11px] font-bold uppercase tracking-widest mb-1.5 ${textLabelClass}`}>Tarih</label>
                                    <input 
                                        type="date" 
                                        value={newEvent.dueDate} 
                                        onChange={e => setNewEvent({...newEvent, dueDate: e.target.value})}
                                        className={`w-full px-3 py-3 rounded-[12px] text-[13px] font-bold border outline-none ${isLight ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500' : 'bg-black/20 border-white/10 text-white focus:border-blue-500'}`}
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className={`block text-[11px] font-bold uppercase tracking-widest mb-1.5 ${textLabelClass}`}>Personel Atama (Zimmetle)</label>
                                <select 
                                    value={newEvent.assigneeId} 
                                    onChange={e => setNewEvent({...newEvent, assigneeId: e.target.value})}
                                    className={`w-full px-3 py-3 rounded-[12px] text-[13px] font-bold border outline-none ${isLight ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500' : 'bg-black/20 border-white/10 text-white focus:border-blue-500'}`}
                                >
                                    <option value="">-- Herkese Açık / Atanmamış --</option>
                                    {staff?.map(s => (
                                        <option key={s.id} value={s.id}>{s.name} - {s.role}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className={`block text-[11px] font-bold uppercase tracking-widest mb-1.5 ${textLabelClass}`}>
                                    Kısa Açıklama & Notlar
                                </label>
                                <textarea 
                                    rows={3}
                                    placeholder="Bağlantı linki, fatura numarası veya diğer detayları kaydedin..."
                                    value={newEvent.description} 
                                    onChange={e => setNewEvent({...newEvent, description: e.target.value})}
                                    className={`w-full px-3 py-3 rounded-[12px] text-[13px] border outline-none resize-none ${isLight ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500' : 'bg-black/20 border-white/10 text-white focus:border-blue-500'}`}
                                />
                            </div>
                            
                            <button 
                                onClick={handleSaveEvent} 
                                disabled={isProcessing} 
                                className={`w-full mt-4 py-3.5 rounded-[12px] text-[14px] font-black tracking-widest text-white transition-all bg-blue-600 hover:bg-blue-700 shadow-md ${isProcessing ? 'opacity-70' : ''}`}
                            >
                                {isProcessing ? 'KAYDEDİLİYOR...' : 'TAKVİME GEÇİR'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
