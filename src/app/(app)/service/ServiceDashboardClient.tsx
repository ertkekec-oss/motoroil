"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/contexts/AppContext';
import { Wrench, Check, Circle, Activity, CreditCard, PenTool, LayoutDashboard, Calendar, Download, MoreHorizontal, AlertCircle, CheckCircle2, Navigation, FileText } from 'lucide-react';

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

    const waitingApproval = (stats.recentOrders || []).filter((o:any) => o.status === 'WAITING_APPROVAL').slice(0, 5);
    const recentActivities = (stats.recentOrders || []).slice(0, 6); // Just as a mockup for the timeline

    const renderStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING':
                return <span className="px-3 py-1 rounded-full text-[12px] font-bold bg-slate-100 text-slate-600">Bekliyor</span>;
            case 'WAITING_APPROVAL':
                return <span className="px-3 py-1 rounded-full text-[12px] font-bold bg-amber-500 text-white">Onayda</span>;
            case 'IN_PROGRESS':
                return <span className="px-3 py-1 rounded-full text-[12px] font-bold bg-blue-500 text-white">İşlemde</span>;
            case 'COMPLETED':
                return <span className="px-3 py-1 rounded-full text-[12px] font-bold bg-emerald-500 text-white">Tamamlandı</span>;
            default:
                return <span className="px-3 py-1 rounded-full text-[12px] font-bold bg-slate-100 text-slate-600">{status}</span>;
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#F8FAFC] dark:bg-[#0B1220] p-4 sm:p-6 lg:p-8 w-full max-w-[1600px] mx-auto gap-6 lg:gap-8 font-sans">
            
            {/* Minimal Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Servis İş Emirleri</h1>
                    <p className="text-[13px] text-slate-500 mt-1 font-medium">Toplam {stats.recentOrders?.length || 0} aktif operasyon yürütülüyor.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[13px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors shadow-sm">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        Bu Hafta
                    </button>
                    <Link href="/service/new" className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-xl text-[13px] font-bold hover:bg-blue-700 transition-colors shadow-sm">
                        + Yeni Kayıt
                    </Link>
                </div>
            </div>

            {/* Top Widget Row (Matching Image 1) */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                
                {/* 1. Finance / Big Sparkline Box (Col Span 1) */}
                <div className="bg-white dark:bg-slate-900 rounded-[24px] p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-white/5 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                            <div>
                                <h3 className="text-[15px] font-bold text-slate-900 dark:text-white leading-none">Finansal Özet</h3>
                                <p className="text-[11px] text-slate-500 font-medium tracking-wide mt-1">GÜNCEL DURUM</p>
                            </div>
                        </div>
                    </div>
                    
                    {/* Inner pastel card */}
                    <div className="bg-[#FFF8E6] dark:bg-amber-500/10 rounded-2xl p-5 mt-2 flex-1 flex flex-col justify-end relative overflow-hidden">
                        {/* Mock bezier curve SVG imitating the reference */}
                        <svg className="absolute inset-0 w-full h-full opacity-30" preserveAspectRatio="none" viewBox="0 0 100 100">
                            <path d="M0,50 Q25,80 50,40 T100,50 L100,100 L0,100 Z" fill="none" stroke="#F59E0B" strokeWidth="2" />
                            <path d="M0,50 Q25,80 50,40 T100,50" fill="none" stroke="#F59E0B" strokeWidth="3" />
                        </svg>

                        <div className="relative z-10 pt-16">
                            <h4 className="text-[14px] font-bold text-amber-900 dark:text-amber-500 mb-1">Onaylanan Tutar</h4>
                            <div className="flex items-end gap-2">
                                <span className="text-3xl font-black text-amber-600 dark:text-amber-400">₺{loading ? '...' : (stats.totalRevenue).toLocaleString('tr-TR')}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Stacked Mini-Stats (Col Span 1) */}
                <div className="flex flex-col gap-4">
                    {/* Pink Card */}
                    <div className="bg-[#FFEBEF] dark:bg-rose-500/10 rounded-[20px] p-5 flex flex-col justify-center flex-1">
                        <h4 className="text-[14px] font-bold text-slate-800 dark:text-rose-200 mb-4">Onay Bekleyenler</h4>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-white/60 dark:bg-rose-500/20 flex items-center justify-center shrink-0">
                                <FileText className="w-6 h-6 text-rose-500" />
                            </div>
                            <div>
                                <div className="text-2xl font-black text-slate-900 dark:text-rose-400 leading-none">{stats.pending} Adet</div>
                            </div>
                        </div>
                    </div>
                    {/* Indigo/Purple Card */}
                    <div className="bg-[#EBEFFF] dark:bg-indigo-500/10 rounded-[20px] p-5 flex flex-col justify-center flex-1">
                        <h4 className="text-[14px] font-bold text-slate-800 dark:text-indigo-200 mb-4">İşlemde Olanlar</h4>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-white/60 dark:bg-indigo-500/20 flex items-center justify-center shrink-0">
                                <PenTool className="w-6 h-6 text-indigo-500" />
                            </div>
                            <div>
                                <div className="text-2xl font-black text-slate-900 dark:text-indigo-400 leading-none">{stats.inProgress} Adet</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Recent Activities (Timeline) (Col Span 1) */}
                <div className="bg-white dark:bg-slate-900 rounded-[24px] p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-white/5 flex flex-col h-full overflow-hidden">
                    <div className="flex items-center gap-2 mb-6">
                        <Activity className="w-5 h-5 text-amber-500" />
                        <div>
                            <h3 className="text-[15px] font-bold text-slate-900 dark:text-white leading-none">Son İşlemler</h3>
                        </div>
                    </div>
                    
                    <div className="relative flex-1 px-2">
                        {/* Vertical line */}
                        <div className="absolute left-[5.5px] top-2 bottom-0 w-[2px] bg-slate-100 dark:bg-slate-800"></div>
                        
                        <div className="space-y-5 relative z-10">
                            {recentActivities.map((o:any, i:number) => {
                                const colors = ['border-purple-400', 'border-emerald-400', 'border-amber-400', 'border-blue-400', 'border-rose-400'];
                                const dotColor = colors[i % colors.length];
                                
                                return (
                                    <div key={i} className="flex gap-4 items-start pt-1">
                                        <div className={`w-3 h-3 rounded-full bg-white dark:bg-slate-900 border-[2.5px] ${dotColor} mt-1 shrink-0`}></div>
                                        <div>
                                            <p className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 leading-snug">
                                                {o.asset?.primaryIdentifier} kaydı açıldı. Müşteri: <span className="font-bold">{o.customer?.name}</span>
                                            </p>
                                            <p className="text-[10px] text-slate-400 font-medium mt-1">{new Date(o.createdAt).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}</p>
                                        </div>
                                    </div>
                                )
                            })}
                            {!loading && recentActivities.length === 0 && (
                                <p className="text-[12px] text-slate-400">Henüz işlem yok.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* 4. Task Checkboxes (John's Issue style) (Col Span 1) */}
                <div className="bg-white dark:bg-slate-900 rounded-[24px] p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-white/5 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-rose-500" />
                            <div>
                                <h3 className="text-[15px] font-bold text-slate-900 dark:text-white leading-none">Onay Bekleyenler</h3>
                            </div>
                        </div>
                        <button className="px-3 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg text-[11px] font-bold">+ Yeni</button>
                    </div>

                    <div className="space-y-4 flex-1 overflow-y-auto pr-1">
                        {waitingApproval.map((o:any, i:number) => (
                            <div key={i} className="flex justify-between items-center bg-white dark:bg-slate-900 group">
                                <div className="flex items-start gap-3">
                                    <div className="w-0.5 h-6 rounded-full bg-indigo-500 shrink-0 mt-0.5"></div>
                                    <div className="w-4 h-4 rounded border-2 border-slate-300 dark:border-slate-600 mt-1 shrink-0"></div>
                                    <div className="flex flex-col">
                                        <span className="text-[13px] font-bold text-slate-700 dark:text-slate-300 line-clamp-1">{o.asset?.brand || 'Model Belirtilmemiş'}</span>
                                        <span className="text-[11px] text-slate-400 font-medium">{o.asset?.primaryIdentifier}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2 items-center">
                                    <span className="text-[10px] font-bold text-indigo-500 uppercase">Onaylat</span>
                                    <button className="w-6 h-6 rounded-md bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">
                                        <MoreHorizontal className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        ))}
                         {!loading && waitingApproval.length === 0 && (
                            <p className="text-[12px] text-slate-400 text-center py-4">Tüm onaylar tamam.</p>
                        )}
                    </div>
                </div>

            </div>


            {/* Table Section (Matching Image 2) */}
            <div className="bg-white dark:bg-slate-900 rounded-[28px] p-6 sm:p-8 shadow-[0_2px_15px_-4px_rgba(0,0,0,0.03)] border border-slate-100 dark:border-white/5">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-3">
                        <LayoutDashboard className="w-6 h-6 text-blue-600 dark:text-blue-500" />
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Aktif İş Emirleri</h2>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-[13px] font-bold text-blue-600 dark:text-blue-400 hover:bg-slate-100 transition-colors">
                        <Download className="w-4 h-4" /> Export
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[800px] border-separate border-spacing-y-3">
                        <thead>
                            <tr className="bg-slate-50/80 dark:bg-slate-800/50 rounded-xl overflow-hidden">
                                <th className="px-6 py-4 text-[13px] font-bold text-slate-800 dark:text-slate-300 first:rounded-l-xl last:rounded-r-xl w-16">#</th>
                                <th className="px-6 py-4 text-[13px] font-bold text-slate-800 dark:text-slate-300">Cihaz Bilgisi</th>
                                <th className="px-6 py-4 text-[13px] font-bold text-slate-800 dark:text-slate-300">Müşteri</th>
                                <th className="px-6 py-4 text-[13px] font-bold text-slate-800 dark:text-slate-300">Durum</th>
                                <th className="px-6 py-4 text-[13px] font-bold text-slate-800 dark:text-slate-300">Tarih</th>
                                <th className="px-6 py-4 text-[13px] font-bold text-slate-800 dark:text-slate-300 first:rounded-l-xl last:rounded-r-xl">Tutar</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="py-8 text-center text-sm font-medium text-slate-500">Yükleniyor...</td></tr>
                            ) : stats.recentOrders.length === 0 ? (
                                <tr><td colSpan={6} className="py-8 text-center text-sm font-medium text-slate-500">İş emri bulunamadı.</td></tr>
                            ) : (
                                stats.recentOrders.map((o:any, index:number) => {
                                    // Make alternate rows have the light gray background pill effect as requested
                                    const isAlternate = index % 2 === 1;
                                    const rowClass = isAlternate ? "bg-slate-50 dark:bg-slate-800/30" : "bg-white dark:bg-transparent";

                                    return (
                                        <tr key={o.id} onClick={() => router.push(`/service/${o.id}`)} className={`cursor-pointer group hover:opacity-80 transition-opacity ${rowClass}`}>
                                            <td className="px-6 py-4 rounded-l-2xl">
                                                <span className="text-[14px] font-black text-slate-900 dark:text-white">{index + 1}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                                        <Wrench className="w-5 h-5 text-indigo-500" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[14px] font-extrabold text-slate-900 dark:text-white leading-snug">{o.asset?.brand || 'Modelleme Yok'}</p>
                                                        <p className="text-[12px] text-slate-500 font-medium">{o.asset?.primaryIdentifier}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-[13px] font-semibold text-slate-600 dark:text-slate-400">
                                                {o.customer?.name}
                                            </td>
                                            <td className="px-6 py-4">
                                                {renderStatusBadge(o.status)}
                                            </td>
                                            <td className="px-6 py-4 text-[13px] font-semibold text-slate-500">
                                                {new Date(o.createdAt).toLocaleDateString('tr-TR')}
                                            </td>
                                            <td className="px-6 py-4 rounded-r-2xl">
                                                <span className="text-[14px] font-bold text-slate-900 dark:text-white">{Number(o.totalAmount || 0).toLocaleString('tr-TR')} ₺</span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination mockup */}
                {!loading && stats.recentOrders.length > 0 && (
                    <div className="flex justify-between items-center mt-8 border-t border-slate-100 dark:border-white/5 pt-6">
                        <span className="text-[13px] font-medium text-slate-500">Öğeler görüntüleniyor: {stats.recentOrders.length}</span>
                        <div className="flex gap-1 items-center">
                            <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">&lt;</button>
                            <button className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-600 text-white font-bold text-[13px]">1</button>
                            <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 font-bold text-[13px] hover:bg-slate-100 transition-colors">2</button>
                            <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">&gt;</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
