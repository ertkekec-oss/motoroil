const fs = require('fs');

const code = `"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/contexts/AppContext';

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
    const [activeTab, setActiveTab] = useState('ALL'); 
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        fetchDashboardData();
    }, [activeBranchName, activeTenantId]);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const res = await fetch(\`/api/services/dashboard?branch=\${activeBranchName}&tenantId=\${activeTenantId || ''}\`);
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

    const expectedRevenue = (stats.recentOrders || [])
        .filter((o:any) => o.status === 'WAITING_APPROVAL')
        .reduce((sum: number, o:any) => sum + (Number(o.totalAmount) || 0), 0);

    const filteredOrders = useMemo(() => {
        return (stats.recentOrders || []).filter((o: any) => {
            const matchesTab = activeTab === 'ALL' ? true : o.status === activeTab;
            const matchesStatusFilter = statusFilter === '' ? true : o.status === statusFilter;
            const searchTermLower = searchTerm.toLowerCase();
            const matchesSearch = searchTerm === '' || 
                (o.asset?.primaryIdentifier || '').toLowerCase().includes(searchTermLower) ||
                (o.customer?.name || '').toLowerCase().includes(searchTermLower) || 
                (o.asset?.brand || '').toLowerCase().includes(searchTermLower) ||
                (o.id || '').toLowerCase().includes(searchTermLower);
            
            return matchesTab && matchesStatusFilter && matchesSearch;
        });
    }, [stats.recentOrders, activeTab, searchTerm, statusFilter]);

    const renderStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING':
                return (
                    <div className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                        <div className="w-1 h-1 rounded-full mr-1.5 bg-slate-500"></div> Bekliyor
                    </div>
                );
            case 'WAITING_APPROVAL':
                return (
                    <div className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">
                        <div className="w-1 h-1 rounded-full mr-1.5 bg-amber-500"></div> Onayda
                    </div>
                );
            case 'IN_PROGRESS':
                return (
                    <div className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20">
                        <div className="w-1 h-1 rounded-full mr-1.5 bg-blue-500 animate-pulse"></div> İşlemde
                    </div>
                );
            case 'COMPLETED':
                return (
                    <div className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
                        <div className="w-1 h-1 rounded-full mr-1.5 bg-emerald-500"></div> Tamamlandı
                    </div>
                );
            default:
                return (
                    <div className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                        {status}
                    </div>
                );
        }
    };

    return (
        <div className="bg-slate-50 min-h-screen pb-16 w-full font-sans dark:bg-[#0f172a]">
            {/* Same wrapper style as Staff HR page */}
            <div className="max-w-[1600px] mx-auto pt-8 px-4 sm:px-6 lg:px-8">
                <div className="animate-fade-in relative">
                
                    {/* --- HEADER (STICKY) --- */}
                    <div className="sticky top-0 z-40 bg-slate-50/95 dark:bg-[#0f172a]/95 backdrop-blur-md pb-4 pt-4 mb-6 border-b border-slate-200 dark:border-white/5 space-y-4">
                        
                        {/* TOP ACTIONS & COMPACT METRICS */}
                        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                            {/* Compact Metrics */}
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 px-4 py-2 rounded-[10px] flex items-center gap-3 shadow-sm">
                                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-500 flex items-center justify-center text-[14px]">🔧</div>
                                    <div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aktif İşler</div>
                                        <div className="text-[16px] font-black leading-none text-slate-900 dark:text-white mt-0.5">{stats.pending + stats.inProgress}</div>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 px-4 py-2 rounded-[10px] flex items-center gap-3 shadow-sm">
                                    <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-500 flex items-center justify-center text-[14px]">📄</div>
                                    <div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Müşteri Onayı</div>
                                        <div className="text-[16px] font-black leading-none text-amber-600 dark:text-amber-400 mt-0.5">
                                            {stats.recentOrders.filter((o:any)=>o.status === 'WAITING_APPROVAL').length}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 px-4 py-2 rounded-[10px] flex items-center gap-3 shadow-sm">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-[14px]">💰</div>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kapanan Tutar</div>
                                                <div className="text-[14px] font-black leading-none text-emerald-600 dark:text-emerald-400 mt-0.5">{Number(stats.totalRevenue).toLocaleString('tr-TR')}₺</div>
                                            </div>
                                            <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>
                                            <div className="hidden sm:block">
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bekleyen Tutar</div>
                                                <div className="text-[14px] font-black leading-none text-amber-600 dark:text-amber-400 mt-0.5">{expectedRevenue.toLocaleString('tr-TR')}₺</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="flex items-center gap-2">
                                <Link href="/service/new" className="h-[36px] px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-[8px] font-bold text-[12px] flex items-center justify-center gap-1.5 transition-colors shadow-sm whitespace-nowrap">
                                    <span>+</span> Kayıt Aç
                                </Link>
                                <button className="h-[36px] px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 rounded-[8px] font-bold text-[12px] flex items-center justify-center gap-1.5 transition-colors shadow-sm">
                                    Dışa Aktar
                                </button>
                            </div>
                        </div>

                        {/* GROUPED NAVIGATION & FILTERS */}
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mt-2">
                            <div className="flex w-full lg:w-max whitespace-nowrap overflow-x-auto items-center gap-6 px-1 custom-scroll pb-1">
                                {[
                                    { group: 'SERVİS', items: [
                                        { id: 'ALL', label: 'Tüm Servis Listesi' }
                                    ]},
                                    { group: 'BEKLEYENLER', items: [
                                        { id: 'PENDING', label: 'Yeni Triyaj' }, 
                                        { id: 'WAITING_APPROVAL', label: 'Onay Bekleyenler' }
                                    ]},
                                    { group: 'OPERASYON', items: [
                                        { id: 'IN_PROGRESS', label: 'İşlemde Olanlar' }
                                    ]},
                                ].map((grp, i) => (
                                    <div key={grp.group} className="flex items-center gap-3">
                                        {i !== 0 && <div className="w-[1px] h-4 bg-slate-200 dark:bg-white/10 hidden sm:block"></div>}
                                        <div className="flex items-center gap-1 bg-slate-100/50 dark:bg-slate-800/30 p-1 rounded-lg border border-slate-200/50 dark:border-white/5">
                                            {grp.items.map(tab => (
                                                <button
                                                    key={tab.id}
                                                    onClick={() => setActiveTab(tab.id)}
                                                    className={activeTab === tab.id
                                                        ? "px-3 py-1.5 text-[12px] font-bold text-slate-900 dark:text-white bg-white dark:bg-[#0f172a] shadow-sm border border-slate-200/50 dark:border-white/10 rounded-[6px]"
                                                        : "px-3 py-1.5 text-[12px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-all rounded-[6px]"
                                                    }
                                                >
                                                    {tab.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Quick Search & Filters */}
                            <div className="flex items-center gap-2 border-t sm:border-0 border-slate-200 dark:border-white/5 pt-3 sm:pt-0">
                                <div className="relative w-full sm:w-[220px]">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="Cihaz, No veya Müşteri..."
                                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-[8px] h-[36px] pl-9 pr-3 text-[12px] font-semibold outline-none focus:border-blue-500 shadow-sm transition-all text-slate-900 dark:text-white"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <select
                                    className="h-[36px] px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-bold rounded-[8px] text-[12px] outline-none focus:border-blue-500 shadow-sm transition-colors w-max"
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    value={statusFilter}
                                >
                                    <option value="">Tüm Gelişmiş Filtreler</option>
                                    <option value="COMPLETED">Sadece Tamamlananlar</option>
                                    <option value="CANCELLED">İptal Edilenler</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* --- LIST TAB (OPERASYON TABLOSU) --- */}
                    <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] shadow-sm overflow-hidden flex flex-col">
                        <div className="overflow-auto min-h-[500px] custom-scroll">
                            <table className="w-full text-left border-collapse min-w-[900px]">
                                <thead className="bg-slate-50 dark:bg-[#1e293b] text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest sticky top-0 z-20">
                                    <tr>
                                        <th className="px-4 py-3 pl-6 font-bold w-[40px] border-b border-slate-200 dark:border-white/5">
                                            <input type="checkbox" className="w-4 h-4 rounded appearance-none border border-slate-300 dark:border-white/10 checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer" />
                                        </th>
                                        <th className="px-4 py-3 font-bold border-b border-slate-200 dark:border-white/5">Kayıt No</th>
                                        <th className="px-4 py-3 font-bold border-b border-slate-200 dark:border-white/5">Müşteri & Cihaz</th>
                                        <th className="px-4 py-3 font-bold border-b border-slate-200 dark:border-white/5">Durum</th>
                                        <th className="px-4 py-3 font-bold border-b border-slate-200 dark:border-white/5 text-right">Tutar</th>
                                        <th className="px-4 py-3 font-bold border-b border-slate-200 dark:border-white/5 text-right pr-6">İşlem</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} className="p-16 text-center">
                                                <div className="flex flex-col items-center justify-center gap-4">
                                                    <div className="w-16 h-16 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center animate-pulse"></div>
                                                    <div className="text-slate-500 font-medium">Veriler yükleniyor...</div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredOrders.length > 0 ? filteredOrders.map((o:any) => (
                                        <tr key={o.id} onClick={() => router.push(\`/service/\${o.id}\`)} className="hover:bg-slate-50 dark:hover:bg-[#1e293b]/80 transition-colors h-[48px] group cursor-pointer">
                                            <td className="px-4 py-2 pl-6 align-middle" onClick={e => e.stopPropagation()}>
                                                <input type="checkbox" className="w-4 h-4 rounded appearance-none border border-slate-300 dark:border-white/10 checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer opacity-50 group-hover:opacity-100" />
                                            </td>
                                            <td className="px-4 py-2 align-middle">
                                                <div className="flex flex-col gap-1 items-start">
                                                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#334155]/50 text-[10px] font-bold tracking-wider text-slate-600 dark:text-slate-400 uppercase border border-slate-200 dark:border-white/5 whitespace-nowrap">
                                                        #{o.id.substring(o.id.length - 6).toUpperCase()}
                                                    </span>
                                                    <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase whitespace-nowrap">
                                                        {new Date(o.createdAt).toLocaleDateString('tr-TR')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2 align-middle">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#334155]/50 border border-slate-200 dark:border-white/5 flex items-center justify-center text-[12px] font-black text-blue-600 dark:text-blue-400">
                                                        🔧
                                                    </div>
                                                    <div>
                                                        <div className="text-[13px] font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                                                            {o.customer?.name || 'Bilinmiyor'}
                                                        </div>
                                                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                                            {o.asset?.brand || 'Modelleme Yok'} • {o.asset?.primaryIdentifier}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2 align-middle">
                                                {renderStatusBadge(o.status)}
                                            </td>
                                            <td className="px-4 py-2 align-middle text-right">
                                                <div className="text-[13px] font-black text-slate-900 dark:text-white">
                                                    {Number(o.totalAmount || 0).toLocaleString('tr-TR')} ₺
                                                </div>
                                            </td>
                                            <td className="px-4 py-2 pr-6 align-middle text-right">
                                                <div className="flex items-center justify-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={(e) => { e.stopPropagation(); router.push(\`/service/\${o.id}\`); }} className="w-7 h-7 rounded-md text-slate-500 dark:text-slate-400 hover:bg-blue-50 border hover:border-blue-200 border-transparent hover:text-blue-600 transition-all flex items-center justify-center font-bold" title="Detay">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={6} className="p-16 text-center">
                                                <div className="flex flex-col items-center justify-center gap-4">
                                                    <div className="w-16 h-16 bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-full flex items-center justify-center text-2xl text-slate-400">📄</div>
                                                    <div className="text-slate-500 dark:text-slate-400 font-medium">Bu kriterlere uygun iş emri bulunamadı.</div>
                                                    <Link href="/service/new" className="px-5 py-2.5 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300 font-bold rounded-[12px] text-[13px] hover:bg-slate-50 transition-colors shadow-sm">
                                                        + Yeni Kayıt Aç
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
`;

fs.writeFileSync('c:/Users/ertke/OneDrive/Masaüstü/periodya/muhasebeapp/motoroil/src/app/(app)/service/ServiceDashboardClient.tsx', code, 'utf8');
