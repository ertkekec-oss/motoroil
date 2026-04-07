"use client";

import React, { useState, useEffect } from "react";
import Link from 'next/link';
import { Scale, AlertCircle, Package, Truck, Filter, ShieldAlert, ArrowRight } from "lucide-react";
import { EnterprisePageShell } from "@/components/ui/enterprise";

export default function DisputeQueuePage() {
    const [disputes, setDisputes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');

    useEffect(() => {
        const fetchQueue = async (statusFilter: string) => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                if (statusFilter !== 'ALL') params.append('status', statusFilter);

                const res = await fetch(`/api/admin/disputes?${params.toString()}`);
                if (res.ok) {
                    const data = await res.json();
                    setDisputes(data.items);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchQueue(filter);
    }, [filter]);

    const getSeverityBadge = (severity: string) => {
        switch (severity) {
            case 'CRITICAL': return <span className="inline-flex px-2 py-1 bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:border-red-500/30 dark:text-red-400 text-[10px] font-black uppercase tracking-widest rounded shadow-sm">KRİTİK</span>;
            case 'HIGH': return <span className="inline-flex px-2 py-1 bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/30 dark:border-orange-500/30 dark:text-orange-400 text-[10px] font-black uppercase tracking-widest rounded shadow-sm">YÜKSEK</span>;
            case 'MEDIUM': return <span className="inline-flex px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:border-amber-500/30 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest rounded shadow-sm">ORTA</span>;
            case 'LOW': return <span className="inline-flex px-2 py-1 bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest rounded shadow-sm">DÜŞÜK</span>;
            default: return null;
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'RESOLVED': return 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-500/30 dark:text-emerald-400 shadow-sm';
            case 'OPEN': return 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:border-blue-500/30 dark:text-blue-400 shadow-sm animate-pulse';
            case 'NEEDS_INFO': return 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:border-amber-500/30 dark:text-amber-400 shadow-sm';
            case 'IN_REVIEW': return 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/30 dark:border-purple-500/30 dark:text-purple-400 shadow-sm';
            default: return 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 shadow-sm';
        }
    };

    const StatusLabel: Record<string, string> = {
        'ALL': 'Tümü',
        'OPEN': 'Açık Tahkimler',
        'NEEDS_INFO': 'Bilgi Bekliyor',
        'IN_REVIEW': 'İnceleniyor',
        'RESOLVED': 'Çözülmüş (Arşiv)'
    };

    return (
        <EnterprisePageShell
            title="Uyuşmazlık Çözüm Merkezi (Disputes)"
            description="B2B işlemlerindeki finansal riskleri, emanet iadelerini ve yasal tahkim süreçlerini (Escrow Arbitration) değerlendirin."
            actions={
                <>
                    <div className="flex bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden p-1 shrink-0 h-10 items-center">
                        <Filter className="w-4 h-4 text-slate-400 ml-2 mr-1" />
                        {['ALL', 'OPEN', 'NEEDS_INFO', 'IN_REVIEW', 'RESOLVED']?.map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${filter === f ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-sm' : 'bg-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                            >
                                {StatusLabel[f] || f}
                            </button>
                        ))}
                    </div>
                </>
            }
        >
            <div className="animate-in fade-in duration-300 space-y-6">
                {/* Main Content Container */}
                <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden min-h-[500px] flex flex-col relative">
                    {/* Background Graphic */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

                    <div className="px-6 py-5 border-b border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-[#111827]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                        <div>
                            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                Aktif Tahkim Dosyaları
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Öncelik sırasına göre bekleyen işlem matrisi.</p>
                        </div>
                        {!loading && (
                            <div className="shrink-0 flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Toplam Dosya</span>
                                <span className="inline-flex items-center justify-center min-w-8 h-8 px-2 bg-indigo-50 dark:bg-indigo-900/30 text-xs font-black text-indigo-700 dark:text-indigo-400 rounded-lg border border-indigo-200 dark:border-indigo-500/30 shadow-sm">
                                    {disputes.length}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 relative z-10">
                        {loading ? (
                            <div className="h-full min-h-[400px] flex flex-col items-center justify-center">
                                <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 dark:border-indigo-900 dark:border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">VERİTABANI TARANIYOR...</span>
                            </div>
                        ) : disputes.length === 0 ? (
                            <div className="h-full min-h-[400px] flex flex-col items-center justify-center px-6">
                                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center border border-slate-100 dark:border-white/5 shadow-sm mb-6">
                                    <ShieldAlert className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                                </div>
                                <p className="text-lg font-bold text-slate-900 dark:text-white text-center">Açık uyuşmazlık dosyası bulunamadı.</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-2 text-center">
                                    Seçili filtrelemeye uygun, beklemede olan veya acil işlem gerektiren bir tahkim kaydı yok.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left font-sans table-auto min-w-[900px]">
                                    <thead className="bg-white dark:bg-[#1e293b] border-b border-slate-200 dark:border-white/5 text-[11px] uppercase text-slate-500 dark:text-slate-400 font-bold tracking-widest sticky top-0">
                                        <tr>
                                            <th className="px-6 py-4">Ticket ID</th>
                                            <th className="px-6 py-4">Durum / Evre</th>
                                            <th className="px-6 py-4">Risk Faktörü</th>
                                            <th className="px-6 py-4">Referans (Sipariş/Kargo)</th>
                                            <th className="px-6 py-4">Zaman (SLA)</th>
                                            <th className="px-6 py-4">Tarih</th>
                                            <th className="px-6 py-4 text-right">Aksiyon</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-[13px] bg-white dark:bg-transparent">
                                        {disputes?.map(d => (
                                            <tr key={d.ticketId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group cursor-default">
                                                <td className="px-6 py-4 align-top">
                                                    <div className="font-mono font-bold text-slate-900 dark:text-white uppercase">#{d.ticketId.substring(0, 8)}...</div>
                                                    <div className="text-[10px] text-slate-400 font-mono mt-1 invisible group-hover:visible transition-all">{d.ticketId}</div>
                                                </td>
                                                <td className="px-6 py-4 align-top">
                                                    <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${getStatusStyle(d.status)}`}>
                                                        {StatusLabel[d.status] || d.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 align-top">
                                                    {getSeverityBadge(d.severity)}
                                                </td>
                                                <td className="px-6 py-4 align-top">
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex items-center gap-2 font-mono text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 w-max shadow-sm">
                                                            <Package className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                                            {d.referencedOrderId || 'Sipariş Yok'}
                                                        </div>
                                                        <div className="flex items-center gap-2 font-mono text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/50 px-2 py-1 rounded w-max">
                                                            <Truck className="w-3.5 h-3.5 shrink-0" />
                                                            {d.referencedShipmentId || 'Kargo Yok'}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 align-top">
                                                    {d.isSlaBreached ? (
                                                        <span className="text-red-600 dark:text-red-400 font-bold flex items-center gap-1.5 text-xs bg-red-50 dark:bg-red-900/10 px-2 py-1 rounded w-max border border-red-100 dark:border-red-900/30">
                                                            <AlertCircle className="w-3.5 h-3.5 animate-pulse" /> SÜRE AŞIMI
                                                        </span>
                                                    ) : (
                                                        <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5 text-xs">
                                                            Standart Döngü
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 align-top">
                                                    <div className="font-bold text-slate-700 dark:text-slate-300">
                                                        {new Date(d.updatedAt).toLocaleDateString('tr-TR')}
                                                    </div>
                                                    <div className="text-[11px] text-slate-400 mt-0.5">
                                                        {new Date(d.updatedAt).toLocaleTimeString('tr-TR')}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right align-middle">
                                                    <Link
                                                        href={`/admin/disputes/${d.ticketId}`}
                                                        className="inline-flex h-9 items-center gap-2 px-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm opacity-0 group-hover:opacity-100 focus:opacity-100 focus:ring-2 focus:ring-indigo-500/50"
                                                    >
                                                        Dosyayı İncele <ArrowRight className="w-3.5 h-3.5" />
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                            </div>
            </div>
        </EnterprisePageShell>
    );
}
