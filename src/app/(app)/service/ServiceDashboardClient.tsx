"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/contexts/AppContext';
import { Wrench, ShieldCheck, HardHat, FileText, ChevronRight, Activity, Search, MapPin, Sparkles, Zap, Clock, Power, CheckCircle2 } from 'lucide-react';

export default function ServiceDashboardClient() {
    const router = useRouter();
    const { activeBranchName, activeTenantId, hasPermission } = useApp();

    const [stats, setStats] = useState<any>({
        pending: 0,
        inProgress: 0,
        completed: 0,
        totalRevenue: 0,
        recentOrders: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
        // Set up real-time pulse simulation
        const interval = setInterval(() => {
            fetchDashboardData(true);
        }, 15000);
        return () => clearInterval(interval);
    }, [activeBranchName, activeTenantId]);

    const fetchDashboardData = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await fetch(`/api/services/dashboard?branch=${activeBranchName}&tenantId=${activeTenantId || ''}`);
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Failed to fetch dashboard data', error);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const getStatusIndex = (status: string) => {
        if (status === 'PENDING') return 1;
        if (status === 'WAITING_APPROVAL') return 2;
        if (status === 'IN_PROGRESS') return 3;
        if (status === 'COMPLETED') return 4;
        return 0; // Cancelled or other
    };

    const renderSubwayPipeline = (status: string) => {
        const currentIdx = getStatusIndex(status);
        const nodes = [
            { id: 1, label: 'Kabul' },
            { id: 2, label: 'Onay' },
            { id: 3, label: 'Atölye' },
            { id: 4, label: 'Hazır' },
        ];

        return (
            <div className="flex items-center w-full max-w-sm ml-auto">
                {nodes.map((node, index) => {
                    const isActive = currentIdx === node.id;
                    const isPast = currentIdx > node.id;
                    const isFuture = currentIdx < node.id;
                    const isCancelled = currentIdx === 0;

                    let dotColor = 'bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700';
                    let labelColor = 'text-slate-400 dark:text-slate-600';
                    
                    if (isCancelled) {
                        dotColor = 'bg-rose-500/20 border-rose-500';
                        labelColor = 'text-rose-500/50';
                    } else if (isActive) {
                        if (node.id === 1) dotColor = 'bg-blue-500 border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.6)]';
                        if (node.id === 2) dotColor = 'bg-amber-500 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.6)] animate-pulse';
                        if (node.id === 3) dotColor = 'bg-indigo-500 border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.6)]';
                        if (node.id === 4) dotColor = 'bg-emerald-500 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.7)]';
                        labelColor = 'text-slate-900 dark:text-white font-bold';
                    } else if (isPast) {
                        dotColor = 'bg-emerald-400 border-emerald-500';
                        labelColor = 'text-slate-500 dark:text-slate-400';
                    }

                    return (
                        <React.Fragment key={node.id}>
                            <div className="relative flex flex-col items-center justify-center flex-1">
                                <div className={`w-3.5 h-3.5 rounded-full border-[2px] z-10 transition-all duration-500 ${dotColor}`} />
                                <span className={`absolute top-5 text-[10px] uppercase tracking-widest transition-colors duration-300 ${labelColor} whitespace-nowrap`}>{node.label}</span>
                            </div>
                            {index < nodes.length - 1 && (
                                <div className={`flex-1 h-0.5 -mx-4 z-0 transition-colors duration-500 ${isPast && !isCancelled ? 'bg-emerald-500/30' : 'bg-slate-200 dark:bg-slate-800'}`} />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        );
    };

    const activeTotalCount = stats.pending + stats.inProgress;

    return (
        <div className="flex flex-col min-h-screen bg-[#F8FAFC] dark:bg-[#06090F] selection:bg-indigo-500/20">
            {/* Minimal Borderless Header Area (Bento Style Edge) */}
            <div className="flex-shrink-0 border-b border-slate-200/50 dark:border-white/[0.03] bg-white/50 dark:bg-[#06090F]/80 backdrop-blur-3xl z-10 sticky top-0">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 px-4 sm:px-6 lg:px-10 py-4 lg:py-0 lg:h-20 max-w-[1600px] mx-auto">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-[18px] bg-gradient-to-br from-[#0F172A] to-[#1E293B] shadow-lg shadow-black/10 flex items-center justify-center border border-white/[0.05] shrink-0 overflow-hidden relative">
                            <div className="absolute inset-0 bg-indigo-500/10 blur-xl"></div>
                            <HardHat className="w-6 h-6 text-indigo-400 relative z-10" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white leading-none truncate flex items-center gap-3">
                                Operation Center & AI
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> LIVE</span>
                            </h1>
                            <span className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 mt-1.5 truncate">
                                Gelişmiş Atölye ve Verimlilik Paneli
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full lg:w-auto">
                        <Link href="/service/new"
                            className="h-10 px-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[14px] font-bold text-[13px] flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-lg w-full sm:w-auto shrink-0"
                        >
                            <Zap className="w-4 h-4" />
                            Yeni Servis Kaydı
                        </Link>
                    </div>
                </div>
            </div>

            {/* Bento Grid Content */}
            <div className="p-4 sm:p-6 lg:p-10 space-y-6 sm:space-y-8 flex-1 w-full max-w-[1600px] mx-auto">
                
                {/* 1. Bento Top Heroes */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Hero Widget: Command AI */}
                    <div className="lg:col-span-2 rounded-[28px] bg-gradient-to-br from-slate-900 via-[#111827] to-[#1e1b4b] border border-white/10 p-8 sm:p-10 relative overflow-hidden flex flex-col justify-between shadow-2xl shadow-indigo-900/20 group">
                        {/* Glows */}
                        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3"></div>
                        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[60px] translate-y-1/3 -translate-x-1/4"></div>
                        
                        <div className="relative z-10 flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md">
                                <Sparkles className="w-5 h-5 text-indigo-300" />
                            </div>
                            <span className="text-[12px] font-black text-indigo-300 uppercase tracking-[0.2em]">Artificial Intelligence Summary</span>
                        </div>
                        
                        <div className="relative z-10 max-w-2xl">
                            {loading ? (
                                <h2 className="text-3xl sm:text-4xl font-extrabold text-white/50 tracking-tight leading-tight">Yapay zeka verileri analiz ediyor...</h2>
                            ) : (
                                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                                    Şu an atölyenizde <span className="text-indigo-400">{activeTotalCount} aktif cihaz</span> bulunuyor. 
                                    {stats.pending > 0 && <span> <b className="text-amber-400">{stats.pending} cihaz</b> için müşteri onayı bekleniyor.</span>}
                                    {stats.inProgress > 0 && <span> Ustaların masasında <b className="text-emerald-400">{stats.inProgress} iş</b> devam ediyor.</span>}
                                </h2>
                            )}
                            <p className="text-slate-400 text-base sm:text-lg font-medium mt-6 line-clamp-2">
                                Operayonel yoğunluk normal seviyelerde. Onay bekleyen işlemleri hızlandırmak için WhatsApp üzerinden müşterilere dijital onay formunu tekrar iletebilirsiniz.
                            </p>
                        </div>
                    </div>

                    {/* Financial Widget */}
                    <div className="rounded-[28px] bg-white dark:bg-[#0B1220] border border-slate-200 dark:border-white/[0.05] p-8 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-blue-500/30 transition-colors">
                        <div className="absolute -right-6 -top-6 w-32 h-32 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors"></div>
                        <div>
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest"><Activity className="w-4 h-4 inline-block mr-1 -mt-0.5 text-emerald-500" /> Tahmini Bekleyen Ciro</span>
                            </div>
                            <div className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tighter mt-4">
                                {loading ? '...' : (Number(stats.totalRevenue) / 1000).toFixed(1)}<span className="text-2xl text-slate-400 ml-1">K ₺</span>
                            </div>
                        </div>

                        <div className="mt-8">
                            <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-2">
                                <span>Kapanan (+{stats.completed})</span>
                                <span>İşlemde ({stats.inProgress})</span>
                            </div>
                            <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                                <div className="h-full bg-emerald-500" style={{ width: `${(stats.completed / (activeTotalCount + stats.completed || 1)) * 100}%` }}></div>
                                <div className="h-full bg-indigo-500" style={{ width: `${(stats.inProgress / (activeTotalCount + stats.completed || 1)) * 100}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Metro Pipeline Section (Non-Classic Table) */}
                <div className="mt-8 sm:mt-12">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                            <Power className="w-5 h-5 text-indigo-500" /> Canlı Operasyon Hattı
                        </h3>
                        <Link href="/service/work-orders" className="h-9 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-[12px] font-bold text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Tümünü İncele</Link>
                    </div>

                    <div className="space-y-4">
                        {loading && (
                            <div className="h-32 rounded-[24px] bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-white/[0.05] animate-pulse"></div>
                        )}
                        {!loading && stats.recentOrders.length === 0 && (
                            <div className="h-40 rounded-[28px] border-2 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center text-slate-500 gap-3">
                                <Clock className="w-8 h-8 opacity-50" />
                                <span className="text-sm font-bold tracking-wide">Aktif servis işlemi bulunmuyor.</span>
                            </div>
                        )}
                        {!loading && stats.recentOrders.map((o:any) => (
                            <div key={o.id} onClick={() => router.push(`/service/${o.id}`)} className="group bg-white dark:bg-[#0B1220] border border-slate-200 dark:border-white/[0.05] rounded-[24px] p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-8 cursor-pointer hover:shadow-[0_15px_40px_-10px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_15px_40px_-10px_rgba(0,0,0,0.5)] hover:border-indigo-500/20 hover:scale-[1.005] transition-all duration-300 relative overflow-hidden">
                                
                                {/* Background Highlight on hover */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/[0.01] to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>

                                {/* Asset Info Side */}
                                <div className="flex items-center gap-5 relative z-10 min-w-0">
                                    <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 flex items-center justify-center shrink-0">
                                        <Wrench className="w-6 h-6 text-indigo-400" />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight truncate pb-1">
                                            {o.asset?.primaryIdentifier || 'Kayıtsız Ürün'} {o.asset?.brand ? `• ${o.asset.brand}` : ''}
                                        </h4>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[12px] font-bold text-slate-500 dark:text-slate-400 truncate">{o.customer?.name}</span>
                                            <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                                            <span className="text-[12px] font-bold text-indigo-500">{Number(o.totalAmount || 0).toLocaleString('tr-TR')} ₺</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Pipeline Subway Side */}
                                <div className="w-full lg:w-2/5 shrink-0 relative z-10 pt-4 lg:pt-0 border-t border-slate-100 dark:border-white/5 lg:border-0">
                                    {renderSubwayPipeline(o.status)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
