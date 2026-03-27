"use client";
import React, { useState, useEffect } from "react";
import { useModal } from "@/contexts/ModalContext";
import { Activity, Camera, Shield, FileText, Lock, AlertTriangle, AlertCircle, RefreshCw, Layers, ShieldCheck } from "lucide-react";
import { EnterprisePageShell, EnterpriseCard } from "@/components/ui/enterprise";

export default function AdminGrowthBillingHealth() {
    const { showSuccess, showError, showWarning, showConfirm, showPrompt } = useModal();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [saving, setSaving] = useState(false);

    useEffect(() => { fetchHealth(filter); }, [filter]);

    const fetchHealth = async (bucket: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/growth/billing-health?bucket=${bucket}`);
            if (res.ok) {
                setData(await res.json());
            }
        } finally { setLoading(false); }
    };

    const handleAction = (action: 'run-collection-guard' | 'snapshot') => {
        const confirmMsg = action === 'run-collection-guard'
            ? 'Bu iÅŸlem Collection Guard (Tahsilat Koruyucu) altyapÄ±sÄ±nÄ± manuel Ã§alÄ±ÅŸtÄ±rÄ±r (gecikmiÅŸleri kilitleyebilir).'
            : 'Mali tabloyu (Outstanding AR) BUGÃœN itibarÄ±yla finans denetimi iÃ§in dondur (Snapshot)';
        
        showConfirm("Ä°ÅŸlem OnayÄ±", `${confirmMsg}\n\nDevam etmek istediÄŸinize emin misiniz?`, () => {
            showPrompt(
                "Ä°ÅŸlem Sebebi",
                "LÃ¼tfen bu iÅŸlem iÃ§in bir gerekÃ§e giriniz (Audit Log iÃ§in zorunlu, Min 5 karakter):",
                (reason) => {
                    if (!reason || reason.length < 5) {
                        showWarning("UyarÄ±", "LÃ¼tfen en az 5 karakterlik bir sebep giriniz.");
                        return;
                    }
                    executeAction(action, reason);
                }
            );
        });
    };

    const executeAction = async (action: string, reason: string) => {
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/growth/billing-health/${action}`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-idempotency-key": crypto.randomUUID() },
                body: JSON.stringify({ reason })
            });
            if (res.ok) {
                const out = await res.json();
                showSuccess("Bilgi", `Ä°ÅŸlem BaÅŸarÄ±lÄ±. OpsLog'a kaydedildi.\n\nSonuÃ§: ${JSON.stringify(out.result)}`);
                fetchHealth(filter);
            } else {
                const err = await res.json();
                showError("Hata", `Ä°ÅŸlem BaÅŸarÄ±sÄ±z: ${err.error}`);
            }
        } catch (err) {
            showError("Hata", "Sunucu hatasÄ± oluÅŸtu.");
        } finally {
            setSaving(false);
        }
    };

    const actions = (
        <div className="flex gap-3">
            <button 
                disabled={saving} 
                onClick={() => handleAction('snapshot')} 
                className="h-10 px-5 bg-white dark:bg-[#1e293b] hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
                <Camera className="w-4 h-4 text-indigo-500" /> Snapshot Al
            </button>
            <button 
                disabled={saving} 
                onClick={() => handleAction('run-collection-guard')} 
                className="h-10 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
                <Shield className="w-4 h-4" /> Guard Motorunu Ã‡alÄ±ÅŸtÄ±r
            </button>
        </div>
    );

    return (
        <EnterprisePageShell
            title="Mali AR & Billing Health"
            description="Boost Hub aboneliklerinin pÃ¼rÃ¼zsÃ¼z finansal akÄ±ÅŸÄ± (Alacaklar / Tahsilat / Gecikme / Koleksiyon Riski)."
            actions={actions}
            className="min-h-screen bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 font-sans w-full pb-16 focus:outline-none"
            titleIcon={<Activity className="w-6 h-6 text-emerald-600 dark:text-emerald-500" />}
        >
            {loading && !data ? (
                <div className="p-16 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/5 rounded-2xl bg-white dark:bg-[#1e293b] shadow-sm">
                    <RefreshCw className="w-8 h-8 animate-spin text-emerald-500 mb-4" />
                    <span className="text-[11px] font-black tracking-widest uppercase">Finansal Veriler Ã‡ekiliyor...</span>
                </div>
            ) : data ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                        <div className="bg-slate-900 dark:bg-black/40 border border-slate-800 dark:border-white/5 rounded-2xl p-6 shadow-sm flex flex-col justify-between group overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:bg-emerald-500/20 transition-all duration-500"></div>
                            <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest relative z-10 w-full mb-4 flex items-center justify-between">
                                <span>AskÄ±daki Tahsilat ToplamÄ± (AR)</span>
                                <Layers className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div className="relative z-10">
                                <div className="text-[32px] font-black text-emerald-400 tracking-tighter self-start flex items-baseline gap-1">
                                    <span className="text-[20px] text-emerald-500/50 font-medium tracking-normal">â‚º</span>
                                    {Number(data.kpis.outstandingArTotal).toLocaleString('tr-TR')}
                                </div>
                                <div className="text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded inline-flex mt-2 uppercase tracking-widest shadow-sm">Tahsil edilmeyi bekliyor</div>
                            </div>
                        </div>
                        
                        <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm flex flex-col justify-between group overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:bg-blue-500/20 transition-all duration-500"></div>
                            <div className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 flex items-center justify-between relative z-10">
                                <span>AÃ§Ä±k Fatura</span>
                                <FileText className="w-5 h-5 text-blue-500" />
                            </div>
                            <div className="relative z-10">
                                <div className="text-[32px] font-black text-slate-900 dark:text-white tracking-tighter">{data.kpis.currentCount}</div>
                                <div className="text-[10px] font-black text-emerald-500 mt-2 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-2 py-1 rounded shadow-sm inline-flex">Normal AkÄ±ÅŸ</div>
                            </div>
                        </div>
                        
                        <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm flex flex-col justify-between group overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 dark:bg-amber-500/10 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:bg-amber-500/20 transition-all duration-500"></div>
                            <div className="text-[11px] font-black text-amber-500 dark:text-amber-500 uppercase tracking-widest mb-4 flex items-center justify-between relative z-10">
                                <span>Ekstra Tolere (Grace)</span>
                                <AlertCircle className="w-5 h-5 text-amber-500" />
                            </div>
                            <div className="relative z-10">
                                <div className="text-[32px] font-black text-amber-600 dark:text-amber-500 tracking-tighter">{data.kpis.graceCount}</div>
                                <div className="text-[10px] font-black text-amber-700 dark:text-amber-400 mt-2 uppercase tracking-widest bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-2 py-1 rounded shadow-sm inline-flex">GÃ¼ven sÃ¼resi</div>
                            </div>
                        </div>
                        
                        <div className="bg-white dark:bg-[#1e293b] border border-rose-200 dark:border-rose-900/40 rounded-2xl p-6 shadow-sm flex flex-col justify-between group overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 dark:bg-rose-500/10 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:bg-rose-500/20 transition-all duration-500"></div>
                            <div className="text-[11px] font-black text-rose-600 dark:text-rose-500 uppercase tracking-widest mb-4 flex items-center justify-between relative z-10">
                                <span>GecikmiÅŸ (Overdue)</span>
                                <AlertTriangle className="w-5 h-5 text-rose-500" />
                            </div>
                            <div className="relative z-10">
                                <div className="text-[32px] font-black text-rose-600 dark:text-rose-400 tracking-tighter">{data.kpis.overdueCount}</div>
                                <div className="text-[10px] font-black text-rose-700 dark:text-rose-400 mt-2 uppercase tracking-widest bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 px-2 py-1 rounded shadow-sm inline-flex">Tahsilat Riski YÃ¼ksek</div>
                            </div>
                        </div>
                        
                        <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-2xl p-6 shadow-sm flex flex-col justify-between group overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 dark:bg-rose-500/10 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:bg-rose-500/20 transition-all duration-500"></div>
                            <div className="text-[11px] font-black text-rose-800 dark:text-rose-400 uppercase tracking-widest mb-4 flex items-center justify-between relative z-10">
                                <span>Blokeli Abonelikler</span>
                                <Lock className="w-5 h-5 text-rose-600 dark:text-rose-500" />
                            </div>
                            <div className="relative z-10">
                                <div className="text-[32px] font-black text-rose-800 dark:text-rose-300 tracking-tighter">{data.kpis.blockedSubscriptionsCount}</div>
                                <div className="text-[10px] font-black text-rose-700 dark:text-rose-400 mt-2 uppercase tracking-widest bg-rose-100 dark:bg-rose-500/20 border border-rose-200 dark:border-rose-500/30 px-2 py-1 rounded shadow-sm inline-flex">Suspended Status</div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2 my-6 overflow-x-auto pb-2">
                        {[
                            { label: 'TÃœMÃœ', val: 'all' },
                            { label: 'GÃœNCEL (CURRENT)', val: 'current' },
                            { label: 'TOLERANS (GRACE)', val: 'grace' },
                            { label: 'GECÄ°KMÄ°Å (OVERDUE)', val: 'overdue' },
                            { label: 'AÃ‡ILMAYI BEKLEYEN (BLOCKED)', val: 'blocked' }
                        ]?.map(f => (
                            <button key={f.val} onClick={() => setFilter(f.val)} 
                                className={`px-5 h-10 text-[10px] uppercase tracking-widest font-black rounded-xl shadow-sm border transition-all whitespace-nowrap inline-flex items-center justify-center
                                    ${filter === f.val ? 'bg-slate-900 dark:bg-emerald-600 text-white dark:text-white border-slate-900 dark:border-emerald-600' : 
                                    'bg-white dark:bg-[#1e293b] text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 border-slate-200 dark:border-white/5'}`}>
                                {f.label}
                            </button>
                        ))}
                    </div>

                    <EnterpriseCard padding="none">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left font-sans table-auto border-collapse whitespace-nowrap">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-white/5 text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 font-black">
                                    <tr>
                                        <th className="px-6 py-4">Tenant & Fatura ID</th>
                                        <th className="px-6 py-4 text-right">Fatura TutarÄ±</th>
                                        <th className="px-6 py-4">Durum (Collection)</th>
                                        <th className="px-6 py-4">Son Ã–deme ZamanÄ±</th>
                                        <th className="px-6 py-4 pr-6">Bloke Riski & UyarÄ±</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                    {data?.tenants?.map((t: any) => (
                                        <tr key={t.invoiceId} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors group">
                                            <td className="px-6 py-4 align-middle">
                                                <div className="font-black text-[11px] uppercase tracking-wide text-slate-900 dark:text-white flex items-center gap-1.5 mb-1">{t.tenantId}</div>
                                                <div className="font-mono text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-widest flex items-center gap-1.5">
                                                    <FileText className="w-3 h-3 opacity-50" />
                                                    INV-{t.invoiceId.substring(0, 8).toUpperCase()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 align-middle font-black tracking-wide text-[12px] text-slate-900 dark:text-white text-right">
                                                {Number(t.amount).toLocaleString('tr-TR')} TRY
                                            </td>
                                            <td className="px-6 py-4 align-middle">
                                                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest
                                                        ${t.status === 'COLLECTION_BLOCKED' ? 'bg-slate-800 text-white dark:bg-slate-600 border border-slate-900 dark:border-slate-500' :
                                                            t.status === 'OVERDUE' ? 'bg-rose-100/50 text-rose-800 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30' :
                                                                t.status === 'GRACE' ? 'bg-amber-100/50 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30' :
                                                                    'bg-emerald-100/50 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                                                        }`}>
                                                    {t.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 align-middle text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">
                                                {t.overdueSince ? new Date(t.overdueSince).toLocaleString('tr-TR') : <span className="text-emerald-500 flex items-center gap-1.5"><ShieldCheck className="w-4 h-4" /> Belirsiz</span>}
                                            </td>
                                            <td className="px-6 py-4 align-middle text-[10px] font-black uppercase tracking-widest pr-6">
                                                {t.billingBlocked ? (
                                                    <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1.5 bg-rose-50 dark:bg-rose-500/10 px-2.5 py-1 rounded-lg w-max border border-rose-200 dark:border-rose-500/20">
                                                        <Lock className="w-3.5 h-3.5" /> TAHAKKUK BLOKELÄ°
                                                    </span>
                                                ) : (
                                                    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg w-max border ${t.status === 'OVERDUE' ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20' : 'text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-white/5'}`}>
                                                        {t.status === 'OVERDUE' ? <><AlertTriangle className="w-3.5 h-3.5" /> Otonom Risk (SLA {'>'} 15G)</> : <><ShieldCheck className="w-3.5 h-3.5 opacity-50" /> GÃ¼vende</>}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {data?.tenants?.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="p-16 text-center">
                                                <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 space-y-3">
                                                    <AlertCircle className="w-10 h-10 opacity-20" />
                                                    <p className="text-[11px] font-black tracking-widest uppercase">KayÄ±tlÄ± Fatura Bekleniyor</p>
                                                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Uygulanan filtrelere uygun finansal/faturalÄ± bir aÃ§Ä±k kayÄ±t bulunmuyor.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-200 dark:border-white/5 text-[10px] text-slate-500 uppercase font-black tracking-widest flex justify-between bg-slate-50/50 dark:bg-slate-800/10">
                            <span>Toplam KayÄ±t: {data?.tenants?.length || 0}</span>
                        </div>
                    </EnterpriseCard>
                </>
            ) : null}
        </EnterprisePageShell>
    );
}

