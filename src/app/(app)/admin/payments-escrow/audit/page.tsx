"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, Filter, AlertCircle, FileText, Calendar, Database } from "lucide-react";
import { EnterprisePageShell } from "@/components/ui/enterprise";

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
        <EnterprisePageShell
            title="Yönetim"
            description="Sistem detaylarını yapılandırın"
        >
            <div className="animate-in fade-in duration-300">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                            <ShieldCheck className="w-6 h-6 text-indigo-500" />
                            Governance Denetim İzi (Audit Trail)
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                            Platform seviyesindeki finansal politikaların (Komisyon / Escrow) kim tarafından ve ne sebeple değiştirildiğinin izlenebilirliği.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <Filter className="w-4 h-4 text-slate-400 ml-2" />
                        <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} className="bg-transparent border-none text-sm font-bold text-slate-900 dark:text-white cursor-pointer outline-none focus:ring-0">
                            <option value="">Tümü (Global Görünüm)</option>
                            <option value="ESCROW_POLICY_UPDATE">Escrow Değişimi</option>
                            <option value="COMMISSION_PLAN_CREATE">Komisyon Planı (Yeni)</option>
                            <option value="COMMISSION_PLAN_UPDATE">Komisyon Planı (Güncelleme)</option>
                            <option value="COMMISSION_PLAN_ARCHIVE">Komisyon Planı (Arşiv)</option>
                            <option value="PROVIDER_RECONCILE_TRIGGER">Manuel Mutabakat</option>
                            <option value="KILL_SWITCH_TOGGLE">Acil Durumu (Kill Switch)</option>
                        </select>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-white/5 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left font-sans table-auto">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-white/5 text-[11px] uppercase text-slate-500 dark:text-slate-400 font-bold sticky top-0 z-10">
                                <tr>
                                    <th className="py-4 px-6 border-none whitespace-nowrap">Tarih / Zaman</th>
                                    <th className="py-4 px-6 border-none">Aksiyon Tipi</th>
                                    <th className="py-4 px-6 border-none">Hedef (Entity)</th>
                                    <th className="py-4 px-6 border-none">Firma / Acenta (Tenant)</th>
                                    <th className="py-4 px-6 border-none w-1/3">Sebep ve Veri (Payload)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-sm">
                                {loading ? (
                                    <tr><td colSpan={5} className="py-12 px-6 text-center text-slate-400 dark:text-slate-500 font-medium">Güvenlik kayıtları analize ediliyor...</td></tr>
                                ) : logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-12 px-6 text-center text-slate-400 dark:text-slate-500 font-medium flex-col items-center">
                                            <AlertCircle className="w-8 h-8 mx-auto mb-3 opacity-20" /> Seçi̇li̇ kri̇terde deneti̇m kaydi bulunamadi.
                                        </td>
                                    </tr>
                                ) : (
                                    logs?.map((log, index) => (
                                        <tr key={log.id || index} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="py-4 px-6 align-top">
                                                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                                                    <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                                                    {new Date(log.createdAt).toLocaleDateString('tr-TR')}
                                                </div>
                                                <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 uppercase pl-6">{new Date(log.createdAt).toLocaleTimeString('tr-TR')}</div>
                                            </td>
                                            <td className="py-4 px-6 align-top">
                                                <span className={`px-2.5 py-1 flex max-w-min rounded-md uppercase font-bold text-[10px] tracking-wider border ${
                                                    log.action.includes('KILL_SWITCH') ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-900/30 dark:border-rose-500/30 dark:text-rose-400' :
                                                    log.action.includes('UPDATE') ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/30 dark:border-amber-500/30 dark:text-amber-400' :
                                                    log.action.includes('ARCHIVE') ? 'bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400' :
                                                    log.action.includes('RECONCILE') ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-500/30 dark:text-blue-400' :
                                                    'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-500/30 dark:text-emerald-400'
                                                }`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-slate-600 dark:text-slate-300 font-mono text-xs align-top">
                                                <div className="flex items-center gap-1.5 font-bold mb-1">
                                                    <Database className="w-3.5 h-3.5 text-slate-400" />
                                                    {log.entityType}
                                                </div>
                                                <div className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800/50 p-1 px-1.5 rounded w-max border border-slate-200 dark:border-white/5 truncate max-w-[150px]" title={log.entityId}>{log.entityId}</div>
                                            </td>
                                            <td className="py-4 px-6 font-bold text-slate-800 dark:text-slate-300 font-mono text-xs align-top">
                                                {log.tenantId ? log.tenantId : <span className="text-slate-400 italic font-sans text-sm">Sistem</span>}
                                            </td>
                                            <td className="py-4 px-6 align-top">
                                                {log.payloadJson?.reason && (
                                                    <div className="font-bold text-slate-800 dark:text-white text-sm mb-2 flex gap-2">
                                                        <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                                        {log.payloadJson.reason}
                                                    </div>
                                                )}
                                                <div className="bg-slate-50 dark:bg-[#111c30] border border-slate-200 dark:border-white/5 rounded-lg p-3">
                                                    <pre className="text-[10px] text-slate-600 dark:text-slate-400 font-mono overflow-x-auto whitespace-pre-wrap max-h-32 hidden-scrollbar">
                                                        {JSON.stringify(log.payloadJson, null, 2)}
                                                    </pre>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </EnterprisePageShell>
    );
}