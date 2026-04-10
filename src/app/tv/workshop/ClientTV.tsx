"use client";

import React, { useState, useEffect } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { useApp } from '@/contexts/AppContext';
import { Wrench, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

export default function ClientTV() {
    const { appSettings } = useSettings();
    const { activeBranchName, activeTenantId } = useApp();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [orders, setOrders] = useState<any[]>([]);

    // 1. Clock Polling
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // 2. Data Polling (every 10 seconds)
    useEffect(() => {
        fetchDashboardData();
        const poller = setInterval(fetchDashboardData, 10000);
        return () => clearInterval(poller);
    }, [activeBranchName, activeTenantId]);

    const fetchDashboardData = async () => {
        try {
            const res = await fetch(`/api/services/dashboard?branch=${activeBranchName}&tenantId=${activeTenantId || ''}`);
            if (res.ok) {
                const data = await res.json();
                setOrders(data.recentOrders || []);
            }
        } catch (error) {
            console.error('TV Board fetch error', error);
        }
    };

    const lifts = appSettings?.service_lifts || [];

    // Utility: Mask plate/serial securely for public TV (e.g., 34 ABC 123 -> 34 AB* ***)
    const maskIdentifier = (id: string) => {
        if (!id) return 'BİLİNMİYOR';
        const str = id.trim();
        if (str.length <= 4) return str;
        // Keep first 4 chars, mask the rest except last 1
        const first = str.substring(0, 4);
        const last = str.substring(str.length - 1);
        const masked = '*'.repeat(str.length - 5);
        return `${first}${masked}${last}`;
    };

    const getStatusUI = (status: string) => {
        switch (status) {
            case 'PENDING':
                return { text: 'Sırada Bekliyor', color: 'text-slate-400', bg: 'bg-slate-800/50', border: 'border-slate-700', icon: <Clock className="w-8 h-8" /> };
            case 'WAITING_APPROVAL':
                return { text: 'Müşteri Onayı Bekleniyor', color: 'text-amber-400', bg: 'bg-amber-900/20', border: 'border-amber-500/30', icon: <AlertTriangle className="w-8 h-8 animate-pulse" /> };
            case 'IN_PROGRESS':
                return { text: 'İşlem Devam Ediyor', color: 'text-blue-400', bg: 'bg-blue-900/20', border: 'border-blue-500/30', icon: <Wrench className="w-8 h-8 animate-bounce" /> };
            case 'COMPLETED':
            case 'READY':
                return { text: 'Teslimata Hazır', color: 'text-emerald-400', bg: 'bg-emerald-900/20', border: 'border-emerald-500/30', icon: <CheckCircle className="w-8 h-8" /> };
            default:
                return { text: status, color: 'text-slate-500', bg: 'bg-slate-800/30', border: 'border-slate-700', icon: <Clock className="w-8 h-8" /> };
        }
    };

    // Calculate Grid Columns automatically for TV
    const gridCols = lifts.length <= 2 ? 'grid-cols-1 md:grid-cols-2' : lifts.length <= 4 ? 'grid-cols-2' : lifts.length <= 6 ? 'grid-cols-3' : 'grid-cols-4';

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col p-6 selection:bg-transparent cursor-none relative overflow-hidden">
            {/* Background Ambient Glows */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-900/10 blur-[120px] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-indigo-900/10 blur-[120px] rounded-full pointer-events-none"></div>

            {/* HEADER */}
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/10 z-10">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Wrench className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black tracking-tight text-white uppercase">Atölye Canlı Takip</h1>
                        <p className="text-xl font-semibold text-slate-400 tracking-widest mt-1">Araç Durum Bilgi Ekranı</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-5xl font-black font-mono tracking-tighter text-blue-400">
                        {currentTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        <span className="text-2xl text-blue-400/50 ml-1">{currentTime.getSeconds().toString().padStart(2, '0')}</span>
                    </div>
                    <div className="text-lg font-bold text-slate-500 uppercase tracking-widest mt-1">
                        {currentTime.toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                </div>
            </div>

            {/* MAIN GRID */}
            <div className={`flex-1 grid ${gridCols} gap-6 z-10`}>
                {lifts.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center text-slate-500 h-full">
                        <AlertTriangle className="w-20 h-20 mb-6 opacity-20" />
                        <h2 className="text-3xl font-black tracking-widest uppercase">Atölye Lifti Tanımlanmamış</h2>
                    </div>
                ) : (
                    lifts.map((liftName: string) => {
                        const occupyingOrder = orders.find((o: any) => o.bayName === liftName && o.status !== 'CANCELLED');
                        const isOccupied = !!occupyingOrder;

                        if (isOccupied) {
                            const uiConfig = getStatusUI(occupyingOrder.status);
                            
                            return (
                                <div key={liftName} className={`relative rounded-3xl border-2 ${uiConfig.border} ${uiConfig.bg} backdrop-blur-sm flex flex-col overflow-hidden transition-all duration-700 animate-in zoom-in-95`}>
                                    <div className={`h-2 w-full absolute top-0 left-0 bg-gradient-to-r from-transparent via-current to-transparent ${uiConfig.color} opacity-50`}></div>
                                    
                                    <div className="p-8 flex-1 flex flex-col">
                                        <div className="flex items-center justify-between mb-8">
                                            <span className="text-2xl font-black text-slate-300 uppercase tracking-widest bg-black/40 px-4 py-2 rounded-xl border border-white/5">
                                                {liftName}
                                            </span>
                                            <div className={`${uiConfig.color}`}>
                                                {uiConfig.icon}
                                            </div>
                                        </div>

                                        <div className="flex-1 flex flex-col justify-center">
                                            <h3 className="text-[3rem] font-black leading-none uppercase tracking-tighter mb-2 text-white drop-shadow-lg">
                                                {maskIdentifier(occupyingOrder.asset?.primaryIdentifier)}
                                            </h3>
                                            <p className="text-2xl font-bold text-slate-400 uppercase tracking-wider mb-8">
                                                {occupyingOrder.asset?.brand || 'ARAÇ'} {occupyingOrder.asset?.model || ''}
                                            </p>
                                            
                                            <div className="mt-auto">
                                                <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">Güncel Durum</div>
                                                <div className={`text-3xl font-black uppercase tracking-tight ${uiConfig.color}`}>
                                                    {uiConfig.text}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        }

                        // EMPTY LIFT
                        return (
                            <div key={liftName} className="rounded-3xl border-2 border-slate-800/50 bg-[#0a0a0a] flex flex-col items-center justify-center p-8 opacity-60">
                                <span className="text-3xl font-black text-slate-700 uppercase tracking-widest mb-6">
                                    {liftName}
                                </span>
                                <div className="w-24 h-24 rounded-full border-4 border-slate-800 flex items-center justify-center mb-6">
                                    <CheckCircle className="w-10 h-10 text-slate-700" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-600 uppercase tracking-widest text-center">
                                    Müsait <br/> (Kullanıma Hazır)
                                </h3>
                            </div>
                        );
                    })
                )}
            </div>

            {/* BRANDING FOOTER */}
            <div className="mt-8 flex items-center justify-between z-10 opacity-50">
                <div className="text-slate-500 font-bold tracking-widest text-sm uppercase">
                    PERIODYA ENTERPRISE • WORKSHOP OS
                </div>
                <div className="text-slate-600 font-bold tracking-widest text-sm uppercase">
                    OTOMATİK GÜNCELLENİR
                </div>
            </div>
        </div>
    );
}
