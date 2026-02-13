"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
    Loader2,
    CheckCircle2,
    Clock,
    RefreshCw,
    Activity,
    BarChart3,
    Skull,
    History,
    ShieldAlert,
    Lightbulb,
    FileText,
    HeartPulse,
    ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

// Runbook / Troubleshooting Mapping
const RUNBOOK: Record<string, { steps: string[], priority: 'low' | 'high' | 'critical' }> = {
    "E_PROVIDER_AUTH": {
        steps: ["Marketplace API anahtarlarını kontrol edin.", "Token süresini Marketplace panelinden yenileyin.", "Config'i güncelledikten sonra Replay yapın."],
        priority: 'high'
    },
    "E_CONFIG_MISSING": {
        steps: ["Firma detaylarından Marketplace entegrasyonu var mı bakın.", "Eksikse 'Bağlantı Ayarları' sekmesinden ekleyin.", "Oluşturduktan sonra Replay tetikleyin."],
        priority: 'high'
    },
    "E_RATE_LIMIT": {
        steps: ["İşlemi 1-2 dakika kendi haline bırakın (Backoff).", "Sık sık hata alıyorsanız Concurrency ayarını düşürün.", "Gerekirse Marketplace ile limit artışı görüşün."],
        priority: 'low'
    },
    "E_VALIDATION": {
        steps: ["Hata mesajındaki detaylı veriyi (Payload) inceleyin.", "Müşteri adresi, vergi no veya ürün kodunu kontrol edin.", "Veriyi asıl kaynaktan düzelttikten sonra Replay yapın."],
        priority: 'low'
    }
};

export function MarketplaceOpsPanel() {
    const [data, setData] = useState<any>(null);
    const [health, setHealth] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'runbook'>('dashboard');
    const [processingId, setProcessingId] = useState<string | null>(null);

    const [filters, setFilters] = useState({ marketplace: "", status: "" });
    const pollingRef = useRef<NodeJS.Timeout | null>(null);

    const fetchData = useCallback(async () => {
        if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;

        try {
            const query = new URLSearchParams(filters as any).toString();
            // Fetch Status and Health in parallel
            const [statusRes, healthRes] = await Promise.all([
                fetch(`/api/admin/marketplace/queue/status?${query}`, { cache: 'no-store' }),
                fetch(`/api/admin/marketplace/queue/health`, {
                    cache: 'no-store',
                    headers: { 'x-health-key': process.env.NEXT_PUBLIC_HEALTHCHECK_KEY || 'dev-key' }
                })
            ]);

            if (statusRes.status === 401 || statusRes.status === 403) {
                setError("YETKİSİZ ERİŞİM: Panel erişimi için oturumunuzun aktif ve Admin yetkili olması gerekir.");
                return;
            }

            const [statusJson, healthJson] = await Promise.all([statusRes.json(), healthRes.json()]);

            // Handle standardized format { ok, code, requestId, ...data }
            setData(statusJson);
            setHealth(healthJson);
            setError(null);
        } catch (err: any) {
            setError(err.message || "Bağlantı hatası.");
        } finally {
            setLoading(false);
        }
    }, [filters]);


    useEffect(() => {
        fetchData();
        const start = () => { pollingRef.current = setInterval(fetchData, 10000); };
        const stop = () => { if (pollingRef.current) clearInterval(pollingRef.current); };
        start();
        const handleVis = () => document.visibilityState === 'visible' ? (fetchData(), start()) : stop();
        document.addEventListener("visibilitychange", handleVis);
        return () => { stop(); document.removeEventListener("visibilitychange", handleVis); };
    }, [fetchData]);

    const handleAction = async (auditIdOrJobId: string, action: "RETRY" | "UNLOCK" | "REPLAY_DLQ") => {
        let reason = "";
        if (action === "REPLAY_DLQ") {
            const userInput = window.prompt("REPLAY SEBEBİ (Mecburi):\nNeden bu işlemi tekrar çalıştırıyorsunuz? (Min 5 karakter)");
            if (!userInput || userInput.length < 5) return toast.error("Geçerli bir sebep girilmedi.");
            if (!window.confirm("Bu işlem mükerrer kayda yol açabilir. Emin misiniz?")) return;
            reason = userInput;
        }

        setProcessingId(auditIdOrJobId);
        try {
            const endpoint = action === "REPLAY_DLQ" ? "/api/admin/marketplace/queue/replay" : "/api/admin/marketplace/ops";
            const res = await fetch(endpoint, {
                method: "POST",
                body: JSON.stringify({
                    auditId: action !== "REPLAY_DLQ" ? auditIdOrJobId : undefined,
                    dlqJobId: action === "REPLAY_DLQ" ? auditIdOrJobId : undefined,
                    action,
                    reason
                })
            });
            const resData = await res.json();
            if (resData.success) {
                toast.success(resData.message);
                fetchData();
            } else throw new Error(resData.error || "İşlem başarısız.");
        } catch (err: any) { toast.error(err.message); }
        finally { setProcessingId(null); }
    };

    if (error) return (
        <div className="flex flex-col items-center justify-center min-h-[500px] p-8">
            <ShieldAlert className="h-16 w-16 text-rose-500 mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Erişim Engellendi</h2>
            <p className="text-slate-500 mb-6 max-w-sm text-center">{error}</p>
            <Button variant="outline" onClick={fetchData}>Tekrar Dene</Button>
        </div>
    );

    if (loading && !data) return (
        <div className="flex flex-col items-center justify-center min-h-[500px] gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
            <p className="text-xs uppercase font-black text-slate-400 tracking-widest">Warping to Control Tower...</p>
        </div>
    );

    return (
        <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500 pb-20 px-6">
            {/* Header / Nav */}
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col lg:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${health?.status === 'HEALTHY' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {health?.status === 'HEALTHY' ? <ShieldCheck className="h-6 w-6" /> : <ShieldAlert className="h-6 w-6 animate-pulse" />}
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 leading-none">Marketplace Control Tower</h1>
                        <p className="text-[10px] text-slate-400 font-mono tracking-tighter mt-1 uppercase">v2 Security Hardened • RID: {data?.rid?.slice(0, 8)}</p>
                    </div>
                </div>

                <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl gap-2">
                    <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'dashboard' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
                        <Activity className="h-3.5 w-3.5 inline-block mr-2" /> Dashboard
                    </button>
                    <button onClick={() => setActiveTab('runbook')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'runbook' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
                        <FileText className="h-3.5 w-3.5 inline-block mr-2" /> Runbook & SLO
                    </button>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex gap-4 border-r border-slate-100 pr-6 mr-2">
                        <div className="text-center">
                            <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">DB</p>
                            <div className="h-1.5 w-6 bg-emerald-500 rounded-full mx-auto shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">BANK</p>
                            <div className={`h-1.5 w-6 rounded-full mx-auto ${health?.metrics?.recentBankFailures > 0 ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`}></div>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">QUEUE</p>
                            <div className={`h-1.5 w-6 rounded-full mx-auto ${data?.counts?.dlq > 10 ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`}></div>
                        </div>
                    </div>

                    <div className="text-right">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">System Status</p>
                        <p className={`text-xs font-black flex items-center gap-1 ${health?.status === 'HEALTHY' ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {health?.status || 'UNKNOWN'}
                        </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={fetchData} className="rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100">
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>

            </div>

            {activeTab === 'dashboard' ? (
                <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {[
                            { label: "Queued", value: data?.counts?.waiting ?? 0, icon: Clock, color: "blue" },
                            { label: "Processing", value: data?.counts?.active ?? 0, icon: Activity, color: "amber" },
                            { label: "Completed", value: data?.counts?.completed ?? 0, icon: CheckCircle2, color: "emerald" },
                            { label: "Retrying", value: data?.counts?.failed ?? 0, icon: RefreshCw, color: "orange" },
                            { label: "Killed (DLQ)", value: data?.counts?.dlq ?? 0, icon: Skull, color: "rose" },
                        ].map((s, i) => (
                            <div key={i} className="bg-white p-5 rounded-3xl border border-slate-100 hover:shadow-md transition-all group overflow-hidden relative">
                                <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity`}>
                                    <s.icon className={`h-12 w-12 text-${s.color}-600`} />
                                </div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
                                <p className={`text-4xl font-black text-${s.color}-600 tracking-tighter`}>{s.value}</p>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                        {/* Audit Trail */}
                        <div className="xl:col-span-2 space-y-4">
                            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                                <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                                    <h2 className="font-black text-slate-700 text-lg flex items-center gap-2">
                                        <History className="h-5 w-5 text-indigo-500" /> Audit Pipeline
                                    </h2>
                                    <div className="flex gap-2">
                                        <select value={filters.marketplace} onChange={(e) => setFilters(p => ({ ...p, marketplace: e.target.value }))} className="text-[10px] font-bold bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none">
                                            <option value="">MARKETPLACE</option>
                                            <option value="TRENDYOL">TRENDYOL</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="overflow-x-auto max-h-[700px] overflow-y-auto custom-scrollbar">
                                    <table className="w-full text-left text-sm">
                                        <thead className="sticky top-0 bg-white/95 backdrop-blur z-10 border-b border-slate-100">
                                            <tr className="text-slate-400 text-[10px] font-black uppercase tracking-tight">
                                                <th className="px-8 py-4">Time</th>
                                                <th className="px-8 py-4">Channel</th>
                                                <th className="px-8 py-4">Action</th>
                                                <th className="px-8 py-4">Status</th>
                                                <th className="px-8 py-4 text-right">Ops</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {data?.audits?.map((a: any) => (
                                                <tr key={a.id} className="hover:bg-indigo-50/10 transition-colors group">
                                                    <td className="px-8 py-5 whitespace-nowrap">
                                                        <div className="font-black text-slate-900 text-sm">{new Date(a.createdAt).toLocaleTimeString("tr-TR")}</div>
                                                        <div className="text-[10px] text-slate-500 font-mono tracking-tighter uppercase">{new Date(a.createdAt).toLocaleDateString("tr-TR")}</div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <span className="px-2 py-0.5 bg-slate-900 text-white rounded text-[9px] font-black uppercase leading-none">{a.marketplace}</span>
                                                    </td>
                                                    <td className="px-8 py-5 font-bold text-slate-700 tracking-tight">{a.actionKey}</td>
                                                    <td className="px-8 py-5">
                                                        <div className={`text-[10px] font-black px-2.5 py-1 rounded-lg w-fit ${a.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                                            {a.status}
                                                        </div>
                                                        {a.errorCode && <div className="text-[9px] font-mono text-rose-400 mt-1 uppercase tracking-tighter truncate max-w-[120px]" title={a.errorCode}>{a.errorCode}</div>}
                                                    </td>
                                                    <td className="px-8 py-5 text-right">
                                                        <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button size="sm" variant="outline" onClick={() => handleAction(a.id, a.status === 'PENDING' ? 'UNLOCK' : 'RETRY')} className="h-8 text-[10px] font-black border-slate-200 rounded-xl">
                                                                {a.status === 'PENDING' ? 'UNLOCK' : <RefreshCw className={`h-3 w-3 ${processingId === a.id ? 'animate-spin' : ''}`} />}
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Laboratory Sidebar */}
                        <div className="space-y-6">
                            <div className="bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-800 p-8 space-y-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-10"><Skull className="h-24 w-24 text-rose-500" /></div>
                                <div className="flex items-center gap-3 border-b border-white/10 pb-5 relative z-10">
                                    <Lightbulb className="h-6 w-6 text-amber-400" />
                                    <h2 className="font-black text-white text-xl tracking-tight uppercase">Triage Laboratory</h2>
                                </div>
                                <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-3 relative z-10">
                                    {(!data?.forensics || data.forensics.length === 0) && <div className="py-20 text-center text-slate-600 font-mono italic text-sm">No forensic evidence found. Radar clear.</div>}
                                    {data?.forensics.map((f: any) => (
                                        <div key={f.id} className="bg-white/5 border border-white/5 rounded-3xl p-5 space-y-3 hover:bg-white/10 transition-all border-l-4 border-l-rose-500/50 hover:border-l-rose-500">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest leading-none block mb-1">{f.errorCode || 'FATAL'}</span>
                                                    <h3 className="text-white font-black text-base tracking-tighter">{f.action}</h3>
                                                </div>
                                                <span className="text-[10px] text-slate-500 font-mono italic">#{f.id.slice(0, 8)}</span>
                                            </div>
                                            <p className="text-[11px] text-slate-400 italic line-clamp-2 leading-relaxed">"{f.errorMessage}"</p>
                                            <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Try {f.attempts} • {new Date(f.failedAt).toLocaleTimeString()}</div>
                                                <Button size="sm" onClick={() => handleAction(f.id, "REPLAY_DLQ")} className="bg-rose-600 hover:bg-rose-500 text-white font-black text-[10px] h-8 px-4 rounded-xl shadow-lg shadow-rose-900/40">REPLAY</Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="pt-6 border-t border-white/10 text-[10px] text-slate-500 leading-tight italic px-2">
                                    Note: Every Replay action undergoes security hashing and is logged with operator ID for compliance.
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4">
                    {/* SLO Section */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
                        <div className="flex items-center gap-3 border-b pb-6 border-slate-50">
                            <HeartPulse className="h-6 w-6 text-indigo-600" />
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">SLO Performance (Real-time)</h2>
                        </div>
                        <div className="space-y-6">
                            {[
                                { label: "Availability / Success Rate", value: health?.metrics?.successRate || '0%', threshold: "> 95%", status: parseFloat(health?.metrics?.successRate || '0') > 95 ? 'pass' : 'fail' },
                                { label: "DLQ Saturation (10m)", value: health?.metrics?.recentDlqCount ?? 0, threshold: "< 5", status: (health?.metrics?.recentDlqCount ?? 0) < 5 ? 'pass' : 'fail' },
                                { label: "Auth Integrity", value: (health?.metrics?.recentAuthFailures ?? 0) + " Fails", threshold: "0", status: (health?.metrics?.recentAuthFailures ?? 0) === 0 ? 'pass' : 'fail' },
                                { label: "In-Flight Concurrency", value: data?.counts?.active ?? 0, threshold: "< 20", status: (data?.counts?.active ?? 0) < 20 ? 'pass' : 'fail' },
                            ].map((m, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{m.label}</p>
                                        <p className="text-xl font-black text-slate-900">{m.value}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Threshold: {m.threshold}</p>
                                        <p className={`text-[10px] font-black uppercase ${m.status === 'pass' ? 'text-emerald-500' : 'text-rose-500'}`}>{m.status === 'pass' ? 'Healthy' : 'Action Required'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Runbook Section */}
                    <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl space-y-8">
                        <div className="flex items-center gap-3 border-b pb-6 border-white/5">
                            <FileText className="h-6 w-6 text-amber-500" />
                            <h2 className="text-xl font-black text-white tracking-tight uppercase">Operational Runbook</h2>
                        </div>
                        <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-3">
                            {Object.entries(RUNBOOK).map(([code, p]) => (
                                <div key={code} className="p-6 bg-white/5 border border-white/5 rounded-3xl space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">{code}</span>
                                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${p.priority === 'high' ? 'bg-rose-500 text-white' : 'bg-blue-500 text-white'}`}>{p.priority} priority</span>
                                    </div>
                                    <div className="space-y-2">
                                        {p.steps.map((step, idx) => (
                                            <div key={idx} className="flex gap-3 items-start group">
                                                <div className="h-4 w-4 rounded-full bg-white/10 flex items-center justify-center text-[9px] font-black text-slate-400 mt-0.5 group-hover:bg-amber-500 group-hover:text-black transition-colors">{idx + 1}</div>
                                                <p className="text-sm text-slate-300 leading-snug">{step}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <p className="text-[10px] text-slate-500 italic text-center px-6 leading-tight">If none of the above fixes the issue, escalate to Platform SRE immediately. Hardware or Global Network issues might be present.</p>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
            `}</style>
        </div>
    );
}
