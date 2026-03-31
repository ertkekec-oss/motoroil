"use client";
import React, { useState, useEffect } from "react";
import { Activity, ShieldCheck, Filter, Terminal, User, Clock, Code } from "lucide-react";
import { EnterprisePageShell, EnterpriseCard } from "@/components/ui/enterprise";

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

    const actions = (
        <div className="flex gap-2">
            <div className="relative group min-w-[220px]">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Filter className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                </div>
                <select 
                    value={filter} 
                    onChange={e => setFilter(e.target.value)} 
                    className="pl-10 pr-10 h-10 w-full text-[11px] font-black uppercase tracking-widest rounded-xl shadow-sm border border-slate-200 dark:border-white/5 bg-white dark:bg-[#1e293b] text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all appearance-none cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                    <option value="">TÃ¼m Aksiyonlar</option>
                    <option value="CREATE_BOOST_RULE">Boost KuralÄ± (CREATE)</option>
                    <option value="DISABLE_BOOST_RULE">Boost KuralÄ± (DISABLE)</option>
                    <option value="EXPIRE_BOOST_RULE">Boost KuralÄ± (EXPIRE)</option>
                    <option value="UPDATE_BOOST_POLICY">Boost Ä°lkesi (UPDATE)</option>
                    <option value="RUN_COLLECTION_GUARD">Guard Motoru (MANUAL_TRIGGER)</option>
                    <option value="CREATE_BILLING_SNAPSHOT">Snapshot (MANUAL_TRIGGER)</option>
                    <option value="UNBLOCK_SUBSCRIPTION">Abonelik Kilidi (UNBLOCK)</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="h-4 w-4 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>
        </div>
    );

    return (
        <EnterprisePageShell
            title="Growth Sistem Denetimi"
            description="AÄŸa etki eden tÃ¼m finansal, promosyonel ve yÃ¶netimsel aksiyonlarÄ±n (Boost/Policy/Guard) kayÄ±t altÄ±na alÄ±ndÄ±ÄŸÄ± gÃ¼venli defter."
            actions={actions}
            className="min-h-screen bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 font-sans w-full pb-16 focus:outline-none"
            
        >
            <EnterpriseCard >
                <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#1e293b] flex items-center justify-between">
                    <h2 className="text-[13px] font-black text-slate-900 dark:text-slate-100 flex items-center gap-2 uppercase tracking-widest">
                        <Terminal className="w-4 h-4 text-slate-400" />
                        Aksiyon GeÃ§miÅŸi & Payload
                    </h2>
                </div>

                {loading ? (
                    <div className="p-16 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
                        <Activity className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
                        <span className="text-[11px] font-black tracking-widest uppercase">Denetim KayÄ±tlarÄ± TaranÄ±yor...</span>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left font-sans table-auto border-collapse">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-white/5 text-[10px] uppercase tracking-widest font-black text-slate-500 dark:text-slate-400">
                                <tr>
                                    <th className="px-6 py-4">Aksiyon Tipi</th>
                                    <th className="px-6 py-4">AktÃ¶r (YÃ¶netici)</th>
                                    <th className="px-6 py-4">Zaman DamgasÄ± (Timestamp)</th>
                                    <th className="px-6 py-4 w-[45%] pr-6">ÅifrelenmiÅŸ Payload (JSON)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-sm">
                                {logs?.map(log => (
                                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors group">
                                        <td className="px-6 py-4 align-top">
                                            <div className="px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-black rounded-lg text-[10px] uppercase tracking-widest border border-indigo-200 dark:border-indigo-500/20 shadow-[0_1px_2px_rgba(0,0,0,0.05)] inline-flex items-center gap-1.5">
                                                <Activity className="w-3.5 h-3.5" />
                                                {log.action}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 align-top">
                                            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-white/5 w-max shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                                                <User className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                                                <span className="text-[11px] font-mono text-slate-700 dark:text-slate-300 font-bold tracking-wider">{log.actor}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 align-top">
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                                                <span className="text-[11px] text-slate-600 dark:text-slate-400 font-mono font-bold tracking-wider">
                                                    {new Date(log.createdAt).toLocaleString('tr-TR')}
                                                </span>
                                            </div>
                                            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-1.5 opacity-60 ml-5 tracking-widest">
                                                UTC {new Date(log.createdAt).toISOString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 pr-6 align-top">
                                            <div className="bg-[#0f172a] dark:bg-black/50 border border-slate-800 dark:border-white/10 text-emerald-400 p-4 rounded-xl overflow-x-auto whitespace-pre font-mono text-[10px] leading-relaxed shadow-[inset_0_1px_4px_rgba(0,0,0,0.5)] max-h-[160px] custom-scrollbar">
                                                {JSON.stringify(log.payloadJson, null, 2)}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {logs.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-16">
                                            <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 space-y-3">
                                                <ShieldCheck className="w-10 h-10 opacity-20" />
                                                <p className="text-[13px] font-black tracking-widest uppercase text-slate-900 dark:text-white">GÃ¼venli Defter Bekliyor</p>
                                                <p className="text-[11px] font-bold uppercase tracking-widest opacity-60">Uygulanan veri filtresine uygun herhangi bir aksiyon veya denetim logu bulunamadÄ±.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </EnterpriseCard>
        </EnterprisePageShell>
    );
}

