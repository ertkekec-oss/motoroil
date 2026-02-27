"use client";

import React, { useState, useEffect } from "react";

export default function AuditPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionFilter, setActionFilter] = useState('');

    useEffect(() => {
        fetchAudit();
    }, [actionFilter]);

    const fetchAudit = async () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (actionFilter) params.append('action', actionFilter);

        try {
            const res = await fetch(`/api/admin/payments-escrow/audit?${params.toString()}`);
            if (res.ok) setLogs((await res.json()).logs);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-7xl">
            <div className="border-b pb-4 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Governance Denetim İzi (Audit Trail)</h1>
                    <p className="text-sm text-slate-500 mt-2">Platform seviyesindeki politikaların (Komisyon / Escrow) izlenebilirliği.</p>
                </div>

                <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} className="p-2 border rounded-md shadow-sm text-sm font-medium focus:ring">
                    <option value="">Tüm İşlemler</option>
                    <option value="ESCROW_POLICY_UPDATE">Escrow Seçenekleri Değişimi</option>
                    <option value="COMMISSION_PLAN_CREATE">Yeni Plan Oluşturma</option>
                    <option value="COMMISSION_PLAN_UPDATE">Plan Güncellemesi</option>
                    <option value="COMMISSION_PLAN_ARCHIVE">Plan Arşivleme</option>
                    <option value="PROVIDER_RECONCILE_TRIGGER">Mutabakat Tetiklemesi</option>
                    <option value="KILL_SWITCH_TOGGLE">Kill Switch / Acil Durdurma</option>
                </select>
            </div>

            {loading ? (
                <div className="p-8 text-center text-slate-500">Kayıtlar aranıyor...</div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <table className="w-full text-left font-inter table-auto">
                        <thead className="bg-slate-50 border-b text-xs uppercase text-slate-500 font-bold sticky top-0">
                            <tr>
                                <th className="p-4">Tarih</th>
                                <th className="p-4">Aksiyon</th>
                                <th className="p-4">Nesne (Entity)</th>
                                <th className="p-4">Firma (Tenant)</th>
                                <th className="p-4 w-1/3">Sebep / Payload Özeti</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-sm">
                            {logs.map(log => (
                                <tr key={log.id} className="hover:bg-slate-50">
                                    <td className="p-4 font-medium text-slate-600 space-y-1">
                                        <div>{new Date(log.createdAt).toLocaleDateString()}</div>
                                        <div className="text-xs text-slate-400">{new Date(log.createdAt).toLocaleTimeString()}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 flex max-w-min rounded font-bold text-xs ring-1 ring-inset ${log.action.includes('KILL_SWITCH') ? 'bg-red-50 text-red-700 ring-red-200' :
                                                log.action.includes('UPDATE') ? 'bg-amber-50 text-amber-700 ring-amber-200' :
                                                    log.action.includes('ARCHIVE') ? 'bg-slate-100 text-slate-600 ring-slate-200' :
                                                        log.action.includes('RECONCILE') ? 'bg-blue-50 text-blue-700 ring-blue-200' :
                                                            'bg-emerald-50 text-emerald-700 ring-emerald-200'
                                            }`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-600 font-mono text-xs">{log.entityType} <br /> <span className="text-slate-400">{log.entityId}</span></td>
                                    <td className="p-4 font-semibold text-slate-800">{log.tenantId}</td>
                                    <td className="p-4">
                                        <div className="font-semibold text-slate-800 text-sm">{log.payloadJson?.reason || 'Sebep Yok'}</div>
                                        <pre className="mt-2 p-2 bg-slate-100 rounded text-xs text-slate-600 max-h-32 overflow-y-auto whitespace-pre-wrap">
                                            {JSON.stringify(log.payloadJson, null, 2)}
                                        </pre>
                                    </td>
                                </tr>
                            ))}
                            {logs.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-500">Seçili kriterde denetim kaydı bulunamadı.</td></tr>}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
