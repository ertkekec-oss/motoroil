"use client";

import React, { useState } from "react";
import { 
    EnterpriseSectionHeader, 
    EnterpriseButton, 
    EnterpriseCard 
} from "@/components/ui/enterprise";
import { 
    IconCalendar, 
    IconPlus, 
    IconActivity, 
    IconCreditCard, 
    IconWrench,
    IconUsers
} from "@/components/icons/PremiumIcons";

export default function UnifiedCalendarPage() {
    const [view, setView] = useState<'MONTH' | 'WEEK' | 'DAY'>('WEEK');

    const tasks = [
        { id: 1, title: '34ABC12 Yağ Bakımı', type: 'SERVICE', time: '10:00 - 12:00', assignee: 'Ahmet Usta', color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
        { id: 2, title: 'X Firması Çek Vadesi', type: 'FINANCE', time: '14:00', assignee: 'Finans', color: 'bg-rose-50 border-rose-200 text-rose-700' },
        { id: 3, title: 'Ali Veli - Ödeme Teyidi', type: 'CRM', time: '16:30', assignee: 'Çağrı Merkezi', color: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
        { id: 4, title: '06XYZ99 Şanzıman', type: 'SERVICE', time: 'Tüm Gün', assignee: 'Yalçın Usta', color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
    ];

    const days = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'SERVICE': return <IconWrench className="w-3 h-3" />;
            case 'FINANCE': return <IconCreditCard className="w-3 h-3" />;
            case 'CRM': return <IconUsers className="w-3 h-3" />;
            default: return <IconActivity className="w-3 h-3" />;
        }
    };

    return (
        <div className="max-w-[1600px] mx-auto pt-8 px-4 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-700 pb-40">
            <EnterpriseSectionHeader 
                title="GLOBAL TAKVİM & GÖREV KULESİ" 
                subtitle="Finans, Servis, CRM ve Personel Görev Merkezi • Rol Bazlı Otonom Takvim"
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
                        <EnterpriseButton variant="primary" className="flex items-center gap-2 bg-slate-900 border-none rounded-xl">
                            <IconPlus className="w-4 h-4" /> YENİ GÖREV / RANDEVU
                        </EnterpriseButton>
                    </div>
                } 
            />

            <div className="flex gap-6">
                {/* Sol Filtre Paneli */}
                <div className="w-64 shrink-0 space-y-6">
                    <EnterpriseCard className="p-5 font-sans">
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4">Takvimler (Roller)</h3>
                        <div className="space-y-3">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500" />
                                <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900">Teknik Servis (Randevular)</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500" />
                                <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900">Finans (Çek, Borç, Vade)</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500" />
                                <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900">CRM / Müşteri Görüşmesi</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500" />
                                <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900">IK / İzin & Mesai</span>
                            </label>
                        </div>
                    </EnterpriseCard>

                    <EnterpriseCard className="p-5 font-sans">
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4">MİNİ TAKVİM</h3>
                        <div className="text-center text-sm font-bold text-slate-500 py-10 bg-slate-50 rounded-xl ring-1 ring-slate-100">
                            Nisan 2026<br/>
                            <span className="text-[10px]">React-Calendar Eklentisi Gelecek</span>
                        </div>
                    </EnterpriseCard>
                </div>

                {/* Ana Takvim Alanı (Mock Weekly View) */}
                <div className="flex-1 bg-white dark:bg-[#1e293b] rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] ring-1 ring-slate-200/80 p-0 overflow-hidden font-sans flex flex-col h-[800px]">
                    <div className="grid grid-cols-6 border-b border-slate-200 bg-slate-50/50">
                        {days.map((d, i) => (
                            <div key={d} className="py-4 text-center border-r border-slate-200/60 last:border-r-0">
                                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest block mb-1">{d}</span>
                                <span className={`text-xl font-black ${i === 2 ? 'text-indigo-600 bg-indigo-50 w-8 h-8 rounded-full inline-flex items-center justify-center' : 'text-slate-700'}`}>{13 + i}</span>
                            </div>
                        ))}
                    </div>
                    
                    {/* Saat Alanları */}
                    <div className="flex-1 overflow-y-auto custom-scroll relative bg-slate-50/20">
                        {/* Background grid lines */}
                        <div className="absolute inset-0 grid grid-cols-6 pointer-events-none">
                            {[0,1,2,3,4,5].map(i => (
                                <div key={i} className="border-r border-slate-200/50 h-full" />
                            ))}
                        </div>

                        {/* Event Blocks (Mocked Absolute Positioning for visual effect) */}
                        <div className="relative p-2 grid grid-cols-6 gap-2">
                            {/* Pazartesi */}
                            <div className="col-start-1 space-y-2">
                                <div className={`p-3 rounded-xl border border-dashed text-xs cursor-pointer hover:shadow-md transition-all ${tasks[3].color}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        {getTypeIcon(tasks[3].type)}
                                        <span className="font-bold text-[9px] uppercase tracking-wider bg-white/50 px-1.5 rounded">{tasks[3].time}</span>
                                    </div>
                                    <p className="font-black mb-1">{tasks[3].title}</p>
                                    <p className="text-[10px] font-bold opacity-80">{tasks[3].assignee}</p>
                                </div>
                            </div>
                            
                            {/* Salı */}
                            <div className="col-start-2 pt-20">
                                <div className={`p-3 rounded-xl border text-xs cursor-pointer hover:shadow-md transition-all ${tasks[0].color}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        {getTypeIcon(tasks[0].type)}
                                        <span className="font-bold text-[9px] uppercase tracking-wider bg-white/50 px-1.5 rounded">{tasks[0].time}</span>
                                    </div>
                                    <p className="font-black mb-1">{tasks[0].title}</p>
                                    <p className="text-[10px] font-bold opacity-80">{tasks[0].assignee}</p>
                                </div>
                            </div>

                            {/* Çarşamba */}
                            <div className="col-start-3 pt-60 space-y-4">
                                <div className={`p-3 rounded-xl border text-xs cursor-pointer hover:shadow-md transition-all ${tasks[1].color}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        {getTypeIcon(tasks[1].type)}
                                        <span className="font-bold text-[9px] uppercase tracking-wider bg-white/50 px-1.5 rounded">{tasks[1].time}</span>
                                    </div>
                                    <p className="font-black mb-1">{tasks[1].title}</p>
                                    <p className="text-[10px] font-bold opacity-80">{tasks[1].assignee}</p>
                                </div>
                                <div className={`p-3 rounded-xl border text-xs cursor-pointer hover:shadow-md transition-all ${tasks[2].color}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        {getTypeIcon(tasks[2].type)}
                                        <span className="font-bold text-[9px] uppercase tracking-wider bg-white/50 px-1.5 rounded">{tasks[2].time}</span>
                                    </div>
                                    <p className="font-black mb-1">{tasks[2].title}</p>
                                    <p className="text-[10px] font-bold opacity-80">{tasks[2].assignee}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
