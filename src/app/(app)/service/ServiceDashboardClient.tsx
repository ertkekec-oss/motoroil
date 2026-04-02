"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/contexts/AppContext';
import { Wrench, Search, Clock, FileText, CheckCircle2, ChevronRight, Activity, Filter, Settings2 } from 'lucide-react';

export default function ServiceDashboardClient() {
    const router = useRouter();
    const { activeBranchName, activeTenantId } = useApp();

    const [stats, setStats] = useState<any>({
        pending: 0,
        inProgress: 0,
        completed: 0,
        totalRevenue: 0,
        recentOrders: []
    });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    useEffect(() => {
        fetchDashboardData();
    }, [activeBranchName, activeTenantId]);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/services/dashboard?branch=${activeBranchName}&tenantId=${activeTenantId || ''}`);
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Failed to fetch dashboard data', error);
        } finally {
            setLoading(false);
        }
    };

    // Filter Logic
    const filteredOrders = (stats.recentOrders || []).filter((o: any) => {
        const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
        const matchesSearch = searchTerm === '' || 
            (o.asset?.primaryIdentifier || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (o.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
            (o.asset?.brand || '').toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING':
                return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 whitespace-nowrap"><Clock className="w-3 h-3" /> Triyaj / Bekliyor</span>;
            case 'WAITING_APPROVAL':
                return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-500 border border-amber-200 dark:border-amber-500/20 whitespace-nowrap"><FileText className="w-3 h-3" /> Onay Bekleniyor</span>;
            case 'IN_PROGRESS':
                return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-500 border border-blue-200 dark:border-blue-500/20 whitespace-nowrap"><Wrench className="w-3 h-3" /> İşlemde</span>;
            case 'COMPLETED':
                return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-500 border border-emerald-200 dark:border-emerald-500/20 whitespace-nowrap"><CheckCircle2 className="w-3 h-3" /> Tamamlandı</span>;
            default:
                return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 whitespace-nowrap">{status}</span>;
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-950">
            {/* Extremely Compact Header */}
            <div className="sticky top-0 z-20 bg-white/80 dark:bg-[#0B1220]/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/5">
                <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 max-w-[1600px] mx-auto">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
                            <Wrench className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h1 className="text-[16px] font-black tracking-tight text-slate-900 dark:text-white leading-none flex items-center gap-2">
                                Servis Masası
                                <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] uppercase font-bold tracking-wider border border-blue-500/20">Pro</span>
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative w-full sm:w-[260px]">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Cihaz, Plaka veya Müşteri Ara..." 
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full h-9 pl-9 pr-3 rounded-lg bg-slate-100 dark:bg-slate-900 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 text-[13px] font-medium transition-all outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
                            />
                        </div>
                        <Link href="/service/new" className="h-9 px-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[13px] font-bold rounded-lg flex items-center gap-2 hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shrink-0 shadow-sm">
                            <span>+</span>
                            <span className="hidden sm:inline">Yeni Servis</span>
                        </Link>
                    </div>
                </div>
            </div>

            <div className="p-4 sm:p-6 w-full max-w-[1600px] mx-auto space-y-6">
                
                {/* Ultra Compact Stat Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-[#0B1220] rounded-xl border border-slate-200 dark:border-white/5 p-4 flex flex-col justify-between shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <span className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Açık Kapasite</span>
                        </div>
                        <div className="text-2xl font-black text-slate-900 dark:text-white leading-none">{stats.pending} <span className="text-[13px] font-semibold text-slate-400 ml-1">Kayıt</span></div>
                    </div>
                    <div className="bg-white dark:bg-[#0B1220] rounded-xl border border-slate-200 dark:border-white/5 p-4 flex flex-col justify-between shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <Wrench className="w-4 h-4 text-blue-500" />
                            <span className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Aktif İşlemde</span>
                        </div>
                        <div className="text-2xl font-black text-blue-600 dark:text-blue-400 leading-none">{stats.inProgress} <span className="text-[13px] font-semibold text-blue-400/60 ml-1">Cihaz</span></div>
                    </div>
                    <div className="bg-white dark:bg-[#0B1220] rounded-xl border border-slate-200 dark:border-white/5 p-4 flex flex-col justify-between shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tamamlanan</span>
                        </div>
                        <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 leading-none">{stats.completed} <span className="text-[13px] font-semibold text-emerald-400/60 ml-1">işlem</span></div>
                    </div>
                    <div className="bg-white dark:bg-[#0B1220] rounded-xl border border-slate-200 dark:border-white/5 p-4 flex flex-col justify-between shadow-sm relative overflow-hidden">
                        <div className="absolute right-0 bottom-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl translate-x-1/3 translate-y-1/3"></div>
                        <div className="flex items-center gap-2 mb-3 relative z-10">
                            <Activity className="w-4 h-4 text-slate-400" />
                            <span className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Toplam Limit</span>
                        </div>
                        <div className="text-2xl font-black text-slate-900 dark:text-white leading-none relative z-10">
                            {Number(stats.totalRevenue).toLocaleString('tr-TR')} <span className="text-[16px] text-slate-400">₺</span>
                        </div>
                    </div>
                </div>

                {/* Filter & Data Grid Wrapper */}
                <div className="bg-white dark:bg-[#0B1220] border border-slate-200 dark:border-white/5 rounded-xl shadow-sm flex flex-col">
                    {/* Toolbar */}
                    <div className="border-b border-slate-100 dark:border-white/5 p-3 flex items-center justify-between gap-4 overflow-x-auto">
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-slate-400" />
                            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-900/50 rounded-lg">
                                {['ALL', 'PENDING', 'WAITING_APPROVAL', 'IN_PROGRESS', 'COMPLETED'].map(status => (
                                    <button 
                                        key={status}
                                        onClick={() => setStatusFilter(status)}
                                        className={`px-3 py-1.5 rounded-md text-[12px] font-bold transition-all whitespace-nowrap ${statusFilter === status ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                    >
                                        {status === 'ALL' ? 'Tümü' : 
                                         status === 'PENDING' ? 'Bekliyor' : 
                                         status === 'WAITING_APPROVAL' ? 'Onayda' : 
                                         status === 'IN_PROGRESS' ? 'İşlemde' : 'Biten'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <button className="h-8 px-3 rounded-lg border border-slate-200 dark:border-white/10 text-[12px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                <Settings2 className="w-3.5 h-3.5" /> Görünüm
                            </button>
                        </div>
                    </div>

                    {/* Dense Data Table (Highest Efficiency) */}
                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/20">
                                    <th className="px-4 py-3 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Kayıt No</th>
                                    <th className="px-4 py-3 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Cihaz / Taşıt</th>
                                    <th className="px-4 py-3 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Müşteri</th>
                                    <th className="px-4 py-3 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Tarih</th>
                                    <th className="px-4 py-3 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center">Statü</th>
                                    <th className="px-4 py-3 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right">Tutar</th>
                                    <th className="px-4 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {loading && [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-4 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16"></div></td>
                                        <td className="px-4 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-32 mb-1"></div><div className="h-3 bg-slate-100 dark:bg-slate-800/50 rounded w-20"></div></td>
                                        <td className="px-4 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24"></div></td>
                                        <td className="px-4 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24"></div></td>
                                        <td className="px-4 py-4"><div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-md w-24 mx-auto"></div></td>
                                        <td className="px-4 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16 ml-auto"></div></td>
                                        <td className="px-4 py-4"><div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-8 ml-auto"></div></td>
                                    </tr>
                                ))}
                                {!loading && filteredOrders.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                                                <Search className="w-8 h-8 opacity-50" />
                                                <span className="text-[13px] font-medium">Bu kriterlere uygun kayıt bulunamadı.</span>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                {!loading && filteredOrders.map((o: any) => (
                                    <tr 
                                        key={o.id} 
                                        onClick={() => router.push(`/service/${o.id}`)}
                                        className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
                                    >
                                        <td className="px-4 py-3">
                                            <span className="text-[13px] font-bold text-slate-500 dark:text-slate-400">#{o.id.substring(o.id.length - 6).toUpperCase()}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                                    <Wrench className="w-4 h-4 text-slate-500" />
                                                </div>
                                                <div className="flex flex-col min-w-0 max-w-[200px] sm:max-w-[300px]">
                                                    <span className="text-[13px] font-black text-slate-900 dark:text-white truncate">{o.asset?.primaryIdentifier || 'Kayıtsız'}</span>
                                                    <span className="text-[11px] font-bold text-slate-500 truncate">{o.asset?.brand || 'Model Girtilmemiş'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-[13px] font-bold text-slate-700 dark:text-slate-300 truncate block max-w-[150px]">{o.customer?.name}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-[12px] font-semibold text-slate-500">{new Date(o.createdAt).toLocaleDateString('tr-TR')}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {getStatusBadge(o.status)}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <span className="text-[13px] font-black text-slate-900 dark:text-white">{Number(o.totalAmount || 0).toLocaleString('tr-TR')} ₺</span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ml-auto opacity-0 group-hover:opacity-100">
                                                <ChevronRight className="w-4 h-4 text-slate-500" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}
