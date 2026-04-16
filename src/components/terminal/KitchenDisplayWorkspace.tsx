"use client";

import React, { useState, useEffect } from 'react';
import { Clock, Play, CheckCircle2, BellRing, ChefHat, Maximize, AlertCircle, UtensilsCrossed } from 'lucide-react';
import { useModal } from '@/contexts/ModalContext';
import { useLanguage } from '@/contexts/LanguageContext';

type TicketStatus = 'pending' | 'preparing' | 'ready';

interface TicketItem {
    id: string;
    name: string;
    quantity: number;
    notes?: string;
}

interface Ticket {
    id: string;
    table: string;
    server: string;
    orderTime: Date;
    status: TicketStatus;
    items: TicketItem[];
}

export default function KitchenDisplayWorkspace() {
    const { showSuccess } = useModal();
    const { t } = useLanguage();
    const [currentTime, setCurrentTime] = useState(new Date());

    // Mock initial tickets
    const [tickets, setTickets] = useState<Ticket[]>([
        {
            id: 'T-1049',
            table: 'Bahçe 3',
            server: 'Ayşe Yıldız',
            orderTime: new Date(Date.now() - 12 * 60000), // 12 mins ago
            status: 'pending',
            items: [
                { id: '1', name: 'Karışık IzgaraTabağı', quantity: 2, notes: 'Acısız, Az pişmiş' },
                { id: '2', name: 'Gavurdağı Salatası', quantity: 1 }
            ]
        },
        {
            id: 'T-1050',
            table: 'Salon 1',
            server: 'Ali Kaya',
            orderTime: new Date(Date.now() - 3 * 60000), // 3 mins ago
            status: 'pending',
            items: [
                { id: '3', name: 'Fırın Sütlaç', quantity: 3 }
            ]
        },
        {
            id: 'T-1045',
            table: 'VIP 2',
            server: 'Kasiyer',
            orderTime: new Date(Date.now() - 25 * 60000), // 25 mins ago
            status: 'preparing',
            items: [
                { id: '4', name: 'Kuzu İncik', quantity: 2, notes: 'Ekstra püre' },
                { id: '5', name: 'Süzme Mercimek', quantity: 2 }
            ]
        }
    ]);

    // Update real-time clocks
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const updateStatus = (ticketId: string, newStatus: TicketStatus) => {
        setTickets(tickets.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
        if (newStatus === 'ready') {
            showSuccess(t('kitchen.successTitle'), `\$\{ticketId\} ${t('kitchen.successMsgPart2')}`);
            
            // Remove 'ready' tickets after 5 seconds to keep screen clean
            setTimeout(() => {
                setTickets(prev => prev.filter(t => t.id !== ticketId));
            }, 5000);
        }
    };

    const getElapsedMinutes = (date: Date) => Math.floor((currentTime.getTime() - date.getTime()) / 60000);

    const pendingTickets = tickets.filter(t => t.status === 'pending');
    const preparingTickets = tickets.filter(t => t.status === 'preparing');
    const readyTickets = tickets.filter(t => t.status === 'ready');

    return (
        <div className="flex flex-col h-full w-full bg-[#0B1220] text-slate-200 overflow-hidden font-sans">
            
            {/* KDS HEADER */}
            <div className="flex justify-between items-center px-6 py-4 bg-slate-900 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/50">
                        <ChefHat size={24} className="text-white" strokeWidth={2.5}/>
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight leading-none mb-1">{t('kitchen.systemTitle')} <span className="text-blue-400 font-bold text-lg opacity-80">(KDS)</span></h1>
                        <p className="text-slate-400 text-xs font-bold tracking-widest uppercase">{t('kitchen.systemSubtitle')}</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3 bg-slate-800/80 px-4 py-2 rounded-xl border border-white/5">
                        <div className="flex items-center gap-2 text-rose-400">
                            <span className="relative flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                            </span>
                            <span className="text-sm font-black tracking-widest">{pendingTickets.length} {t('kitchen.waiting')}</span>
                        </div>
                    </div>
                    
                    <div className="flex flex-col items-end">
                        <span className="text-3xl font-black text-white leading-none tracking-tighter">
                            {currentTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                            <span className="text-lg text-slate-500 ml-1">{currentTime.getSeconds().toString().padStart(2, '0')}</span>
                        </span>
                    </div>
                    
                    <button className="w-12 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors border border-white/5">
                        <Maximize size={20} />
                    </button>
                </div>
            </div>

            {/* KDS COLUMNS */}
            <div className="flex-1 flex overflow-hidden p-6 gap-6">
                
                {/* COLUMN 1: YENİ SİPARİŞLER (BEKLEYEN) */}
                <div className="flex-1 flex flex-col min-w-0 bg-slate-900/40 rounded-2xl border border-rose-500/20 overflow-hidden relative">
                    <div className="px-5 py-4 border-b border-rose-500/20 bg-rose-500/10 flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-2 text-rose-400">
                            <BellRing size={20} strokeWidth={2.5}/>
                            <h2 className="text-lg font-black tracking-widest uppercase">{t('kitchen.waitingNew')}</h2>
                        </div>
                        <span className="bg-rose-500 text-white font-black px-3 py-1 rounded-lg text-sm">{pendingTickets.length}</span>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                        {pendingTickets.map(ticket => {
                            const minutes = getElapsedMinutes(ticket.orderTime);
                            const isLate = minutes >= 10;
                            
                            return (
                                <div key={ticket.id} className={`bg-slate-800 rounded-xl overflow-hidden border-2 transition-all ${isLate ? 'border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)] animate-pulse-slow' : 'border-slate-700'}`}>
                                    {/* Ticket Header */}
                                    <div className={`px-4 py-3 flex justify-between items-center ${isLate ? 'bg-rose-500/20' : 'bg-slate-800'}`}>
                                        <div>
                                            <span className="block text-2xl font-black text-white">{ticket.table}</span>
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{ticket.server}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-2xl font-black ${isLate ? 'text-rose-400' : 'text-slate-300'}`}>{minutes}'</span>
                                            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{t('kitchen.ago')}</span>
                                        </div>
                                    </div>
                                    
                                    {/* Items */}
                                    <div className="px-4 py-3 bg-slate-800 border-y border-white/5 space-y-3">
                                        {ticket.items.map(item => (
                                            <div key={item.id} className="flex flex-col">
                                                <div className="flex gap-3 items-start">
                                                    <span className="text-xl font-black text-rose-400 mt-1">{item.quantity}</span>
                                                    <div>
                                                        <span className="text-lg font-bold text-white leading-tight">{item.name}</span>
                                                        {item.notes && (
                                                            <div className="text-amber-400 text-sm font-bold flex items-center gap-1 mt-1 bg-amber-400/10 px-2 py-1 rounded">
                                                                <AlertCircle size={14}/> {item.notes}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    {/* Action */}
                                    <button 
                                        onClick={() => updateStatus(ticket.id, 'preparing')}
                                        className="w-full py-4 bg-slate-700 hover:bg-amber-600 text-white font-black text-lg transition-colors flex items-center justify-center gap-2 group"
                                    >
                                        <Play size={20} className="fill-current group-hover:scale-110 transition-transform"/> TEZGAHA AL (BAŞLA)
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* COLUMN 2: HAZIRLANIYOR */}
                <div className="flex-1 flex flex-col min-w-0 bg-slate-900/40 rounded-2xl border border-amber-500/20 overflow-hidden">
                    <div className="px-5 py-4 border-b border-amber-500/20 bg-amber-500/10 flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-2 text-amber-400">
                            <UtensilsCrossed size={20} strokeWidth={2.5}/>
                            <h2 className="text-lg font-black tracking-widest uppercase">{t('kitchen.preparing')}</h2>
                        </div>
                        <span className="bg-amber-500 text-white font-black px-3 py-1 rounded-lg text-sm">{preparingTickets.length}</span>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                        {preparingTickets.map(ticket => {
                            const minutes = getElapsedMinutes(ticket.orderTime);
                            
                            return (
                                <div key={ticket.id} className="bg-slate-800 rounded-xl overflow-hidden border border-amber-500/50 shadow-lg">
                                    <div className="px-4 py-3 flex justify-between items-center bg-amber-500/10">
                                        <div>
                                            <span className="block text-2xl font-black text-white">{ticket.table}</span>
                                            <span className="text-xs font-bold text-amber-500/70 uppercase tracking-wider">{ticket.server}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-amber-400">
                                           <Clock size={24} strokeWidth={2.5} className="animate-spin-slow"/>
                                           <span className="text-2xl font-black">{minutes}'</span>
                                        </div>
                                    </div>
                                    
                                    <div className="px-4 py-3 bg-slate-800 border-y border-white/5 space-y-3">
                                        {ticket.items.map(item => (
                                            <div key={item.id} className="flex gap-3 items-start opacity-90">
                                                <span className="text-xl font-black text-amber-400 mt-1">{item.quantity}</span>
                                                <div>
                                                    <span className="text-lg font-bold text-white leading-tight">{item.name}</span>
                                                    {item.notes && <p className="text-amber-400/80 text-sm font-semibold mt-0.5">{item.notes}</p>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    <button 
                                        onClick={() => updateStatus(ticket.id, 'ready')}
                                        className="w-full py-4 bg-amber-600 hover:bg-emerald-600 text-white font-black text-lg transition-colors flex items-center justify-center gap-2 group"
                                    >
                                        <CheckCircle2 size={24} className="group-hover:scale-110 transition-transform"/> BİTTİ (SERVİSE HAZIR)
                                    </button>
                                </div>
                            )
                        })}
                        {preparingTickets.length === 0 && (
                            <div className="flex h-full items-center justify-center text-slate-600 font-bold uppercase tracking-widest text-sm">
                                {t('kitchen.noOrderPrep')}
                            </div>
                        )}
                    </div>
                </div>

                {/* COLUMN 3: SERVİSE HAZIR (BİTENLER) */}
                <div className="flex-1 flex flex-col min-w-0 bg-slate-900/40 rounded-2xl border border-emerald-500/20 overflow-hidden">
                    <div className="px-5 py-4 border-b border-emerald-500/20 bg-emerald-500/10 flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-2 text-emerald-400">
                            <CheckCircle2 size={20} strokeWidth={2.5}/>
                            <h2 className="text-lg font-black tracking-widest uppercase">{t('kitchen.readyWaiting')}</h2>
                        </div>
                        <span className="bg-emerald-500 text-white font-black px-3 py-1 rounded-lg text-sm">{readyTickets.length}</span>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                        {readyTickets.map(ticket => (
                            <div key={ticket.id} className="bg-emerald-900/20 rounded-xl overflow-hidden border border-emerald-500 opacity-80 scale-95 origin-top transition-all">
                                <div className="px-4 py-3 flex justify-between items-center bg-emerald-500/20">
                                    <span className="block text-xl font-black text-emerald-400">{ticket.table}</span>
                                    <span className="text-xs font-bold text-emerald-400/80 uppercase tracking-widest">{t('kitchen.notified')}</span>
                                </div>
                                <div className="px-4 py-2 bg-transparent space-y-1">
                                    {ticket.items.map(item => (
                                        <div key={item.id} className="text-sm font-semibold text-emerald-100 flex gap-2">
                                            <span className="text-emerald-400">{item.quantity}x</span> {item.name}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {readyTickets.length === 0 && (
                            <div className="flex h-full items-center justify-center text-slate-600 font-bold uppercase tracking-widest text-sm text-center px-8">
                                {t('kitchen.allDelivered').split('\\n').map((line, i) => <React.Fragment key={i}>{line}{i === 0 && <br/>}</React.Fragment>)}
                            </div>
                        )}
                    </div>
                </div>

            </div>
            
            <style jsx>{`
                .animate-pulse-slow {
                    animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
                @keyframes pulse-slow {
                    0%, 100% { opacity: 1; border-color: rgba(244,63,94, 0.8); }
                    50% { opacity: .9; border-color: rgba(244,63,94, 0.3); }
                }
                .animate-spin-slow {
                    animation: spin 3s linear infinite;
                }
            `}</style>
        </div>
    );
}
