"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/contexts/AppContext';
import { ChevronLeft, Search, Plus, Filter, Wrench } from 'lucide-react';

function WorkOrdersContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { activeBranchName, activeTenantId } = useApp();

    const initialStatus = searchParams.get('status') || 'ALL';

    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState(initialStatus);

    useEffect(() => {
        fetchOrders();
    }, [activeBranchName, activeTenantId]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/services/dashboard?branch=${activeBranchName}&tenantId=${activeTenantId || ''}`);
            if (res.ok) {
                const data = await res.json();
                setOrders(data.recentOrders || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        let colors = 'bg-slate-100 text-slate-600 border-slate-200';
        if (status === 'COMPLETED') colors = 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
        if (status === 'IN_PROGRESS') colors = 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20';
        if (status === 'PENDING') colors = 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';

        return (
            <span className={`px-2.5 py-1 rounded-[6px] text-[10px] font-black tracking-wider uppercase border ${colors}`}>
                {status}
            </span>
        );
    };

    const filteredOrders = statusFilter === 'ALL' ? orders : orders.filter(o => o.status === statusFilter);

    return (
        <div className="flex flex-col min-h-screen bg-[#F8FAFC] dark:bg-[#0B1220]">
            <div className="flex-shrink-0 border-b border-slate-200 dark:border-white/5 bg-white dark:bg-[#0B1220] z-10 sticky top-0 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/service" className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <div className="flex flex-col">
                        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                            Tüm İş Emirleri
                        </h1>
                        <span className="text-[13px] font-medium text-slate-500 mt-1">
                            Açık, devam eden ve tamamlanan servis kayıtları
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                        {['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED'].map(status => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === status ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                {status === 'ALL' ? 'Tümü' : status}
                            </button>
                        ))}
                    </div>
                    <Link href="/service/new" className="h-10 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-[10px] font-bold text-[13px] flex items-center justify-center gap-2 transition-all shadow-[0_4px_14px_0_rgba(37,99,235,0.39)]">
                        <Plus className="w-4 h-4" /> Yeni Kayıt
                    </Link>
                </div>
            </div>

            <div className="flex-1 p-6 lg:p-10 max-w-[1400px] mx-auto w-full">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[24px] shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 dark:border-white/5 flex gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="text" placeholder="Müşteri, cari, veya cihaz ara..." className="w-full h-10 pl-9 pr-4 bg-slate-50 dark:bg-slate-800 rounded-lg text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto custom-scroll p-4">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                                <tr className="text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-widest font-bold border-b border-slate-100 dark:border-white/5">
                                    <th className="pb-3 px-4 font-bold whitespace-nowrap">ID / Tarih</th>
                                    <th className="pb-3 px-4 font-bold whitespace-nowrap">Müşteri</th>
                                    <th className="pb-3 px-4 font-bold whitespace-nowrap">Cihaz / Varlık</th>
                                    <th className="pb-3 px-4 font-bold whitespace-nowrap text-right">Tutar</th>
                                    <th className="pb-3 px-4 font-bold whitespace-nowrap">Durum</th>
                                    <th className="pb-3 px-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {loading ? (
                                    <tr><td colSpan={6} className="py-8 text-center text-sm font-medium text-slate-500">Yükleniyor...</td></tr>
                                ) : filteredOrders.length === 0 ? (
                                    <tr><td colSpan={6} className="py-8 text-center text-sm font-medium text-slate-500">Bu kritere uyan iş emri bulunamadı.</td></tr>
                                ) : (
                                    filteredOrders.map(o => (
                                        <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="py-4 px-4 align-top">
                                                <div className="text-[13px] font-bold text-slate-900 dark:text-white line-clamp-1">{o.id.slice(-6).toUpperCase()}</div>
                                                <div className="text-[12px] text-slate-500 font-medium">{new Date(o.createdAt).toLocaleDateString('tr-TR')}</div>
                                            </td>
                                            <td className="py-4 px-4 align-top">
                                                <div className="text-[13px] font-bold text-slate-900 dark:text-white">{o.customer?.name}</div>
                                            </td>
                                            <td className="py-4 px-4 align-top">
                                                <div className="text-[13px] font-bold text-slate-900 dark:text-white">{o.asset?.primaryIdentifier || 'Belirtilmedi'}</div>
                                                <div className="text-[12px] text-slate-500 font-medium">{o.asset?.brand || 'Model Yok'}</div>
                                            </td>
                                            <td className="py-4 px-4 align-top text-right">
                                                <div className="text-[13px] font-black text-slate-900 dark:text-white">{Number(o.totalAmount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</div>
                                            </td>
                                            <td className="py-4 px-4 align-top">
                                                <StatusBadge status={o.status} />
                                            </td>
                                            <td className="py-4 px-4 align-top text-right">
                                                <Link href={`/service/${o.id}`} className="px-3 py-1.5 rounded-[8px] bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors inline-block">
                                                    İncele
                                                </Link>
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
                .custom-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
                .custom-scroll::-webkit-scrollbar-track { background: transparent; }
                .custom-scroll::-webkit-scrollbar-thumb { background: rgba(100,116,139,0.2); border-radius: 10px; }
            `}</style>
        </div>
    );
}

export default function WorkOrdersClient() {
    return (
        <Suspense fallback={<div>Yükleniyor...</div>}>
            <WorkOrdersContent />
        </Suspense>
    );
}
