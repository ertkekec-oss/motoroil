"use client";
import React, { useState, useEffect } from "react";

export default function AdminGrowthAuditTrail() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    useEffect(() => { fetchLogs(filter); }, [filter]);

    const fetchLogs = async (actionFilter: string) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (actionFilter) params.append('actionType', actionFilter);

            const res = await fetch(`/api/admin/growth/audit?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setLogs(data.items || []);
            }
        } finally { setLoading(false); }
    };

    return (
        <div className="space-y-6 max-w-7xl pb-10">
            <div className="flex justify-between items-center border-b pb-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Growth Sistem Denetimi (Audit)</h1>
                    <p className="text-sm text-slate-500 mt-2">Sisteme atılan boost kuralları, poliçe değişimleri ve manuel çalıştırılan billing aksiyonları.</p>
                </div>

                <div className="flex gap-2">
                    <select value={filter} onChange={e => setFilter(e.target.value)} className="px-3 py-1.5 text-xs font-bold rounded shadow-sm border bg-white text-slate-600">
                        <option value="">Tüm Aksiyonlar</option>
                        <option value="CREATE_BOOST_RULE">Boost Kuralı (CREATE)</option>
                        <option value="DISABLE_BOOST_RULE">Boost Kuralı (DISABLE)</option>
                        <option value="EXPIRE_BOOST_RULE">Boost Kuralı (EXPIRE)</option>
                        <option value="UPDATE_BOOST_POLICY">Boost İlkesi (UPDATE)</option>
                        <option value="RUN_COLLECTION_GUARD">Guard Motoru (MANUAL_TRIGGER)</option>
                        <option value="CREATE_BILLING_SNAPSHOT">Snapshot (MANUAL_TRIGGER)</option>
                        <option value="UNBLOCK_SUBSCRIPTION">Abonelik Kilidi (UNBLOCK)</option>
                    </select>
                </div>
            </div>

            {loading ? <div className="p-8 text-center text-slate-500">Yükleniyor...</div> : (
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <table className="w-full text-left font-inter table-auto">
                        <thead className="bg-slate-50 border-b text-xs uppercase text-slate-500 font-bold">
                            <tr>
                                <th className="p-4">Aksiyon Tipi</th>
                                <th className="p-4">Aktör ID</th>
                                <th className="p-4">Tarih</th>
                                <th className="p-4 w-1/2">Log / Açıklama (Json Payload)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-sm">
                            {logs.map(log => (
                                <tr key={log.id} className="hover:bg-slate-50">
                                    <td className="p-4">
                                        <div className="px-2 py-1 bg-slate-100 text-slate-800 font-bold rounded text-[10px] uppercase w-max tracking-wide">
                                            {log.action}
                                        </div>
                                    </td>
                                    <td className="p-4 text-xs font-mono text-slate-600">{log.actor}</td>
                                    <td className="p-4 text-xs text-slate-500 font-mono">
                                        {new Date(log.createdAt).toLocaleString()}
                                    </td>
                                    <td className="p-4 text-xs">
                                        <div className="bg-slate-900 text-green-400 p-3 rounded overflow-x-auto whitespace-pre font-mono text-[10px] leading-relaxed">
                                            {JSON.stringify(log.payloadJson, null, 2)}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {logs.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-slate-500">Denetim bandında kayıt bulunamadı.</td></tr>}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
