"use client";
import React, { useState, useEffect } from "react";
import { useModal } from "@/contexts/ModalContext";
import { Layers, RefreshCw, ShieldAlert, CheckCircle, Lock, Key, AlertTriangle, Activity, CreditCard } from "lucide-react";
import { EnterprisePageShell, EnterpriseCard } from "@/components/ui/enterprise";

export default function AdminGrowthSubscriptions() {
    const { showSuccess, showError, showWarning, showConfirm, showPrompt } = useModal();
    const [subs, setSubs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => { fetchSubs(); }, []);

    const fetchSubs = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/growth/subscriptions`);
            if (res.ok) {
                const data = await res.json();
                setSubs(data.items || []);
            }
        } finally { setLoading(false); }
    };

    const handleAction = (id: string, action: string) => {
        const confirmMsg = `Bu iÅŸlem YAPILACAKTIR: Abonelik ${action} (Mali Denetime Bildirilecektir). Devam edilsin mi?`;
        
        showConfirm("Abonelik Ä°ÅŸlemi", confirmMsg, () => {
            showPrompt(
                "Ä°ÅŸlem GerekÃ§esi",
                "Ä°ptal / AskÄ± / Kilit AÃ§ma sebebi (Audit Log iÃ§in zorunlu, Min 5 karakter):",
                (reason) => {
                    if (!reason || reason.length < 5) {
                        showWarning("UyarÄ±", "LÃ¼tfen en az 5 karakterlik bir sebep giriniz.");
                        return;
                    }
                    executeAction(id, action, reason);
                }
            );
        });
    };

    const executeAction = async (id: string, action: string, reason: string) => {
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/growth/subscriptions/${id}/${action}`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-idempotency-key": crypto.randomUUID() },
                body: JSON.stringify({ reason })
            });
            if (res.ok) {
                showSuccess("Bilgi", "Ä°ÅŸlem baÅŸarÄ±yla tamamlandÄ±.");
                fetchSubs();
            } else {
                const err = await res.json();
                showError("Hata", `Hata: ${err.error}`);
            }
        } catch (err) {
            showError("Hata", "Sunucu hatasÄ± oluÅŸtu.");
        } finally {
            setSaving(false);
        }
    };

    const actions = (
        <div className="flex items-center gap-3 shrink-0">
            <button 
                onClick={fetchSubs} 
                disabled={loading || saving}
                className="h-10 px-5 inline-flex items-center justify-center rounded-xl text-[11px] uppercase tracking-widest font-black bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-sm disabled:opacity-50 gap-2 border border-slate-200 dark:border-white/5"
            >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> 
                Senkronize Et
            </button>
        </div>
    );

    return (
        <EnterprisePageShell
            title="Boost Hub Abonelikleri"
            description="Hub network Ã¼zerindeki finansal dondurma (billingBlocked) durumlarÄ± ve kota limit tahsislerinin yÃ¶netimi."
            actions={actions}
            className="min-h-screen bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 font-sans w-full pb-16 focus:outline-none"
            titleIcon={<Layers className="w-6 h-6 text-indigo-600 dark:text-indigo-500" />}
        >
            <EnterpriseCard>
                <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#1e293b] flex items-center justify-between">
                    <h2 className="text-[13px] font-black text-slate-900 dark:text-slate-100 flex items-center gap-2 uppercase tracking-widest">
                        <CreditCard className="w-4 h-4 text-slate-400" />
                        Abonelik & Tahsilat Ä°stihbaratÄ±
                    </h2>
                </div>
                
                {loading ? (
                    <div className="p-16 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
                        <RefreshCw className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
                        <span className="text-[11px] font-black tracking-widest uppercase">Abonelik AÄŸÄ± YÃ¼kleniyor...</span>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse whitespace-nowrap">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-white/5">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-slate-500 dark:text-slate-400">Firma (Tenant) & Sub ID</th>
                                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-slate-500 dark:text-slate-400">GÃ¼ven Skoru (Trust Tier)</th>
                                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-slate-500 dark:text-slate-400 min-w-[200px]">TÃ¼ketim Limitleri</th>
                                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-slate-500 dark:text-slate-400">Billing Durumu</th>
                                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-slate-500 dark:text-slate-400">Son Fatura Durumu</th>
                                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-slate-500 dark:text-slate-400 text-right">MÃ¼dahale AksiyonlarÄ±</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-sm">
                                {subs?.map(s => (
                                    <tr key={s.subscriptionId} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-[13px] text-slate-900 dark:text-slate-100 mb-1">{s.tenantId}</div>
                                            <div className="font-mono text-[10px] tracking-widest font-black text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                                <Key className="w-3 h-3 opacity-50" />
                                                S-{s.subscriptionId.substring(0, 8).toUpperCase()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border
                                                ${s.trustTier === 'TIER_1' ? 'bg-emerald-100/50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30' :
                                                s.trustTier === 'TIER_2' ? 'bg-blue-100/50 text-blue-800 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-500/30' : 
                                                s.trustTier === 'TIER_3' ? 'bg-indigo-100/50 text-indigo-800 dark:bg-indigo-500/10 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30' : 
                                                'bg-slate-100 text-slate-700 dark:bg-slate-800/50 border-slate-200 dark:border-white/5 dark:text-slate-400'}`}>
                                                {s.trustTier || 'STANDART'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="w-full bg-slate-100 dark:bg-[#0f172a] rounded-full h-1.5 mb-2 overflow-hidden border border-slate-200 dark:border-white/5">
                                                <div 
                                                    className={`h-full rounded-full transition-all duration-500 shadow-[inset_0_1px_4px_rgba(0,0,0,0.1)] ${
                                                        ((s.quotaUsed / s.quotaTotal) * 100) > 90 ? 'bg-rose-500' : 
                                                        ((s.quotaUsed / s.quotaTotal) * 100) > 75 ? 'bg-amber-500' : 'bg-indigo-500'
                                                    }`} 
                                                    style={{ width: `${Math.min((s.quotaUsed / s.quotaTotal) * 100, 100)}%` }}
                                                ></div>
                                            </div>
                                            <div className="flex justify-between items-center text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                                <span>{s.quotaUsed} TÃ¼ketildi</span>
                                                <span>{s.quotaTotal} Hak GÃ¶sterildi</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {s.billingBlocked ? (
                                                <span className="bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 font-black px-2.5 py-1 rounded-lg text-[10px] flex items-center gap-1.5 w-max tracking-widest uppercase">
                                                    <Lock className="w-3.5 h-3.5" /> FÄ°NANSDAN KÄ°LÄ°TLÄ°
                                                </span>
                                            ) : (
                                                <span className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 font-black px-2.5 py-1 rounded-lg text-[10px] flex items-center gap-1.5 w-max tracking-widest uppercase">
                                                    <CheckCircle className="w-3.5 h-3.5" /> AÃ‡IK & AKTÄ°F
                                                </span>
                                            )}
                                            <div className="text-[10px] font-mono tracking-widest font-bold text-slate-400 dark:text-slate-500 mt-2 flex items-center gap-1 uppercase">
                                                <Activity className="w-3 h-3" /> 
                                                Plan Durumu: <span className="text-slate-700 dark:text-slate-300 ml-1">{s.status}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-[10px] uppercase tracking-widest">
                                            <span className={`font-black px-2.5 py-1 rounded-lg border
                                                ${s.lastInvoiceStatus === 'OVERDUE' ? 'bg-rose-100/50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-500/30' :
                                                s.lastInvoiceStatus === 'COLLECTION_BLOCKED' ? 'bg-slate-200/50 text-slate-800 dark:bg-slate-700/50 dark:text-slate-300 border-slate-300 dark:border-white/10' :
                                                s.lastInvoiceStatus === 'GRACE' ? 'bg-amber-100/50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/30' : 
                                                s.lastInvoiceStatus === 'PAID' ? 'bg-emerald-100/50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30' : 
                                                'text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-800/50'
                                            }`}>
                                                {s.lastInvoiceStatus || 'FATURA YOK'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {s.billingBlocked && (
                                                <button 
                                                    disabled={saving} 
                                                    onClick={() => handleAction(s.subscriptionId, 'unblock')} 
                                                    className="h-8 px-3 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 font-black tracking-widest uppercase text-[10px] rounded-lg border border-amber-200 dark:border-amber-500/30 disabled:opacity-50 transition-colors inline-flex items-center justify-center gap-1.5 ml-auto shadow-sm"
                                                >
                                                    <ShieldAlert className="w-3.5 h-3.5" /> Kilidi KaldÄ±r
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {subs.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-16">
                                            <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 space-y-3">
                                                <AlertTriangle className="w-10 h-10 opacity-20" />
                                                <p className="text-[13px] font-black tracking-widest uppercase text-slate-900 dark:text-white">KayÄ±tlÄ± Abonelik Bekleniyor</p>
                                                <p className="text-[11px] font-bold uppercase tracking-widest">Sistemde henÃ¼z aktif bir fatura dÃ¶ngÃ¼sÃ¼ veya abonelik bulunamadÄ±.</p>
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

