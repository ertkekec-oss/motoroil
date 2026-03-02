"use client";

import React, { useState, useEffect } from "react";
import Link from 'next/link';

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
            case 'CRITICAL': return <span className="inline-flex px-2 py-1 bg-red-100 text-red-700 text-[11px] font-bold uppercase tracking-widest rounded">KRİTİK</span>;
            case 'HIGH': return <span className="inline-flex px-2 py-1 bg-orange-100 text-orange-700 text-[11px] font-bold uppercase tracking-widest rounded">YÜKSEK</span>;
            case 'MEDIUM': return <span className="inline-flex px-2 py-1 bg-amber-100 text-amber-700 text-[11px] font-bold uppercase tracking-widest rounded">ORTA</span>;
            case 'LOW': return <span className="inline-flex px-2 py-1 bg-slate-100 text-slate-700 text-[11px] font-bold uppercase tracking-widest rounded">DÜŞÜK</span>;
            default: return null;
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'RESOLVED': return 'bg-emerald-100 text-emerald-700';
            case 'OPEN': return 'bg-red-100 text-red-700';
            case 'NEEDS_INFO': return 'bg-amber-100 text-amber-700';
            case 'IN_REVIEW': return 'bg-amber-100 text-amber-700';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    const StatusLabel: Record<string, string> = {
        'ALL': 'Tümü',
        'OPEN': 'Açık',
        'NEEDS_INFO': 'Bilgi Bekliyor',
        'IN_REVIEW': 'İnceleniyor',
        'RESOLVED': 'Çözüldü'
    };

    return (
        <div className="w-full bg-slate-50 min-h-screen pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
                {/* Header */}
                <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Uyuşmazlık Çözüm Merkezi</h1>
                        <p className="text-sm text-slate-600 mt-1">B2B işlemlerindeki finansal riskleri ve yasal bildirimleri (Escrow arbitration) değerlendirin.</p>
                    </div>

                    <div className="flex bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden p-1 shrink-0">
                        {['ALL', 'OPEN', 'NEEDS_INFO', 'IN_REVIEW', 'RESOLVED'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-1.5 text-[13px] font-semibold rounded-md transition-colors ${filter === f ? 'bg-slate-900 text-white shadow-sm' : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                            >
                                {StatusLabel[f] || f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content Container */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-base font-semibold text-slate-900">Aktif Tahkim Dosyaları</h2>
                            <p className="text-[13px] text-slate-500 mt-0.5">Öncelik sırasına göre bekleyen işlem matrisi.</p>
                        </div>
                        {!loading && (
                            <div className="shrink-0 flex items-center gap-2">
                                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">TOPLAM</span>
                                <span className="inline-flex items-center justify-center min-w-8 h-8 px-2 bg-slate-100 text-[13px] font-bold text-slate-900 rounded-lg border border-slate-200 shadow-sm">
                                    {disputes.length}
                                </span>
                            </div>
                        )}
                    </div>

                    {loading ? (
                        <div className="p-16 flex flex-col items-center justify-center">
                            <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin mb-4"></div>
                            <span className="text-sm font-medium text-slate-500 uppercase tracking-widest">VERİLER ÇEKİLİYOR...</span>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left font-inter table-auto min-w-[800px]">
                                <thead className="bg-white border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold tracking-wide">
                                    <tr>
                                        <th className="px-6 py-4">Ticket ID</th>
                                        <th className="px-6 py-4">Durum Konsensüsü</th>
                                        <th className="px-6 py-4">Ciddiyet Faktörü</th>
                                        <th className="px-6 py-4">Referans (Sipariş/Kargo)</th>
                                        <th className="px-6 py-4">SLA Statüsü</th>
                                        <th className="px-6 py-4">Tarih</th>
                                        <th className="px-6 py-4 text-right">Aksiyon</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-[14px]">
                                    {disputes.map(d => (
                                        <tr key={d.ticketId} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-6 py-4 font-mono text-[13px] text-slate-600 font-medium">#{d.ticketId.substring(0, 12)}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex px-2 py-1 rounded text-[11px] font-bold uppercase tracking-widest ${getStatusStyle(d.status)}`}>
                                                    {StatusLabel[d.status] || d.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">{getSeverityBadge(d.severity)}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-mono text-[12px] text-slate-600 font-medium bg-slate-50 px-2 py-0.5 rounded border border-slate-100 inline-block w-max">
                                                        📦 {d.referencedOrderId || '-'}
                                                    </span>
                                                    <span className="font-mono text-[12px] text-slate-500 font-medium bg-slate-50 px-2 py-0.5 rounded border border-slate-100 inline-block w-max">
                                                        🚚 {d.referencedShipmentId || '-'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {d.isSlaBreached ? (
                                                    <span className="text-red-700 font-bold flex items-center gap-1.5 text-[13px]">
                                                        <span className="animate-pulse">🔴</span> Zaman Aşımı
                                                    </span>
                                                ) : (
                                                    <span className="text-emerald-700 font-semibold flex items-center gap-1.5 text-[13px]">
                                                        🟢 Standart Döngü
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 font-medium">
                                                {new Date(d.updatedAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="px-6 py-4 text-right align-middle">
                                                <Link
                                                    href={`/admin/disputes/${d.ticketId}`}
                                                    className="inline-flex h-9 items-center px-4 bg-white border border-slate-300 text-slate-700 text-[13px] font-semibold rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm opacity-0 group-hover:opacity-100 focus:opacity-100"
                                                >
                                                    Dosyayı İncele
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                    {disputes.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-16 text-center">
                                                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 border border-slate-200 shadow-sm">
                                                    ⚖️
                                                </div>
                                                <p className="text-[15px] font-semibold text-slate-900">Açık uyuşmazlık dosyası bulunamadı.</p>
                                                <p className="text-[13px] text-slate-500 max-w-sm mx-auto mt-1">
                                                    Şu anda beklemede olan veya işlem gerektiren bir itiraz kaydı yok.
                                                </p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
