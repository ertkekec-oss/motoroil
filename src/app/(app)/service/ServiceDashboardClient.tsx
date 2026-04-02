"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/contexts/AppContext';
import { Wrench, ShieldCheck, HardHat, FileText, ChevronRight, Activity, Search, MapPin } from 'lucide-react';

export default function ServiceDashboardClient() {
    const router = useRouter();
    const { activeBranchName, activeTenantId, hasPermission } = useApp();

    const [stats, setStats] = useState({
        pending: 0,
        inProgress: 0,
        completed: 0,
        totalRevenue: 0,
        recentOrders: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, [activeBranchName, activeTenantId]);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // we will create this api later
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

    return (
        <div className="flex flex-col min-h-screen">
            {/* Header Area */}
            <div className="flex-shrink-0 border-b border-slate-200 dark:border-white/5 bg-white dark:bg-[#0B1220] z-10 sticky top-0">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 px-4 sm:px-6 lg:px-10 py-4 lg:py-0 lg:h-20">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[12px] sm:rounded-[16px] bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center p-0.5 shadow-lg shadow-blue-500/20 shrink-0">
                            <div className="w-full h-full rounded-[10px] sm:rounded-[14px] bg-white/10 flex items-center justify-center border border-white/20 backdrop-blur-md">
                                <Wrench className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                            </div>
                        </div>
                        <div className="flex flex-col min-w-0">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-none truncate">
                                    Servis Masası İş Emri Motoru
                                </h1>
                                <span className="px-1.5 sm:px-2 py-0.5 rounded-[6px] bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-[9px] sm:text-[10px] font-black text-blue-600 dark:text-blue-400 tracking-wider">ENTERPRISE</span>
                            </div>
                            <span className="text-[11px] sm:text-[13px] font-medium text-slate-500 dark:text-slate-400 mt-1 sm:mt-1.5 flex items-center gap-1.5 truncate">
                                Teknik servis, garanti ve saha kurulum operasyonlarınız.
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                        <div className="relative w-full sm:w-auto">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="G. Belgesi, Cihaz, Plaka veya Müşteri"
                                className="w-full sm:w-[300px] h-10 pl-9 pr-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-[12px] text-[13px] font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder-slate-400"
                            />
                        </div>
                        <Link href="/service/new"
                            className="h-10 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-[12px] font-bold text-[13px] flex items-center justify-center gap-2 transition-all shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] hover:-translate-y-[1px] w-full sm:w-auto shrink-0"
                        >
                            <span>+</span>
                            Yeni İş Emri Başlat
                        </Link>
                    </div>
                </div>
            </div>

            
            {/* Dashboard Content */}
            <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 flex-1 w-full max-w-[1400px] mx-auto">
                {/* Thin, HR-Portal style top stats */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex items-center justify-between min-w-[220px] flex-1 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-500 border border-amber-100 dark:border-amber-500/20">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Açık İş Emirleri</div>
                                <div className="text-xl font-black text-slate-800 dark:text-white leading-none">{loading ? '...' : stats.pending}</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex items-center justify-between min-w-[220px] flex-1 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-500 border border-blue-100 dark:border-blue-500/20">
                                <Wrench className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">İşlemde Olanlar</div>
                                <div className="text-xl font-black text-slate-800 dark:text-white leading-none">{loading ? '...' : stats.inProgress}</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex items-center justify-between min-w-[220px] flex-1 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-500 border border-emerald-100 dark:border-emerald-500/20">
                                <Activity className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Servis Finans Özeti</div>
                                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 leading-none">{loading ? '...' : `${Number(stats.totalRevenue).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm relative overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                        <h3 className="text-[14px] font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <HardHat className="w-4 h-4 text-slate-400" /> Son İş Emirleri
                        </h3>
                        <Link href="/service/work-orders" className="text-[12px] font-bold text-blue-600 dark:text-blue-400 hover:underline">Tümünü Göster</Link>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[700px]">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-widest font-black border-b border-slate-100 dark:border-white/5">
                                    <th className="px-6 py-3 whitespace-nowrap">Cihaz / Müşteri</th>
                                    <th className="px-6 py-3 whitespace-nowrap text-center">Durum</th>
                                    <th className="px-6 py-3 whitespace-nowrap">Kayıt Tarihi</th>
                                    <th className="px-6 py-3 whitespace-nowrap text-right">Tutar</th>
                                    <th className="px-6 py-3 whitespace-nowrap"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {loading ? (
                                    <tr><td colSpan={5} className="py-8 text-center text-sm font-medium text-slate-500">Yükleniyor...</td></tr>
                                ) : stats.recentOrders.length === 0 ? (
                                    <tr><td colSpan={5} className="py-8 text-center text-sm font-medium text-slate-500">Henüz servis iş emri bulunmuyor.</td></tr>
                                ) : (
                                    stats.recentOrders.map((o: any) => (
                                        <tr key={o.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer" onClick={() => router.push(`/service/${o.id}`)}>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900 dark:text-white text-[13px]">{o.asset?.primaryIdentifier || 'Bilinmeyen Cihaz'} {o.asset?.brand ? `- ${o.asset.brand}` : ''}</span>
                                                    <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px] mt-0.5">{o.customer?.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="px-2.5 py-1 rounded-md text-[10px] font-black tracking-wider uppercase border" style={{
                                                    background: o.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.1)' : o.status === 'IN_PROGRESS' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                    color: o.status === 'COMPLETED' ? '#10b981' : o.status === 'IN_PROGRESS' ? '#3b82f6' : '#f59e0b',
                                                    borderColor: o.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.2)' : o.status === 'IN_PROGRESS' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(245, 158, 11, 0.2)'
                                                }}>
                                                    {o.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-[12px] font-semibold text-slate-600 dark:text-slate-400">
                                                {new Date(o.createdAt).toLocaleDateString('tr-TR')}
                                            </td>
                                            <td className="px-6 py-4 text-right text-[13px] font-bold text-slate-900 dark:text-white">
                                                {Number(o.totalAmount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-[11px] font-bold text-slate-600 dark:text-slate-300 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                                    İncele
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <style jsx global>{`
                .custom-scroll::-webkit-scrollbar {
                    width: 6px;
                    height: 6px;
                }
                .custom-scroll::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scroll::-webkit-scrollbar-thumb {
                    background: rgba(100,116,139,0.2);
                    border-radius: 10px;
                }
            `}</style>
        </div>
    );
}
