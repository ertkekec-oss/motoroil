"use client";

import React, { useState, useEffect } from "react";
import Link from 'next/link';

export default function DisputeQueuePage() {
    const [disputes, setDisputes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');

    useEffect(() => {
        fetchQueue(filter);
    }, [filter]);

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

    const getSeverityBadge = (severity: string) => {
        switch (severity) {
            case 'CRITICAL': return <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded">KRİTİK</span>;
            case 'HIGH': return <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2 py-1 rounded">YÜKSEK</span>;
            case 'MEDIUM': return <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded">ORTA</span>;
            case 'LOW': return <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-1 rounded">DÜŞÜK</span>;
            default: return null;
        }
    };

    return (
        <div className="space-y-6 max-w-7xl">
            <div className="flex justify-between items-center border-b pb-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Uyuşmazlık Çözüm Merkezi (Disputes)</h1>
                    <p className="text-sm text-slate-500 mt-2">Kargo sorunları, eksik ürün, itiraz edilmiş emanetler (Escrow) için tahkim alanı.</p>
                </div>

                <div className="flex gap-2">
                    {['ALL', 'OPEN', 'NEEDS_INFO', 'IN_REVIEW', 'RESOLVED'].map(f => (
                        <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 text-xs font-bold rounded shadow-sm border ${filter === f ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
                            {f === 'ALL' ? 'Tümü' : f}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="p-8 text-center text-slate-500">Yükleniyor...</div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <table className="w-full text-left font-inter table-auto">
                        <thead className="bg-slate-50 border-b text-xs uppercase text-slate-500 font-bold">
                            <tr>
                                <th className="p-4">Ticket ID</th>
                                <th className="p-4">Durum (Status)</th>
                                <th className="p-4">Ciddiyet</th>
                                <th className="p-4">Sipariş/Kargo No</th>
                                <th className="p-4">SLA Durumu</th>
                                <th className="p-4">Tarih</th>
                                <th className="p-4 text-right">Aksiyon</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-sm">
                            {disputes.map(d => (
                                <tr key={d.ticketId} className="hover:bg-slate-50">
                                    <td className="p-4 font-mono text-xs text-slate-600">{d.ticketId.substring(0, 12)}...</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${d.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' :
                                                d.status === 'NEEDS_INFO' ? 'bg-amber-100 text-amber-800' :
                                                    d.status === 'OPEN' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-slate-100 text-slate-800'
                                            }`}>
                                            {d.status}
                                        </span>
                                    </td>
                                    <td className="p-4">{getSeverityBadge(d.severity)}</td>
                                    <td className="p-4 text-slate-600 font-mono text-xs">
                                        O: {d.referencedOrderId || '-'} <br /> S: {d.referencedShipmentId || '-'}
                                    </td>
                                    <td className="p-4">
                                        {d.isSlaBreached ? (
                                            <span className="text-red-600 font-bold flex items-center gap-1">⏰ İhlal</span>
                                        ) : (
                                            <span className="text-emerald-600">Güvende</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-slate-500">
                                        {new Date(d.updatedAt).toLocaleDateString()}
                                    </td>
                                    <td className="p-4 text-right">
                                        <Link href={`/admin/disputes/${d.ticketId}`} className="px-4 py-2 bg-blue-50 text-blue-700 font-semibold rounded hover:bg-blue-100">
                                            İncele (Review)
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {disputes.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-slate-500">Açık uyuşmazlık dosyası bulunamadı.</td></tr>}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
