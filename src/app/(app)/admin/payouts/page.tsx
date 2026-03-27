"use client";
import React, { useState, useEffect } from "react";
import { useModal } from "@/contexts/ModalContext";
import { ArrowRightLeft, RefreshCw, CheckCircle, XCircle, AlertCircle, Clock, Wallet } from "lucide-react";
import { EnterprisePageShell, EnterpriseCard, EnterpriseTable, EnterpriseEmptyState, EnterpriseButton } from "@/components/ui/enterprise";

export default function PayoutsPage() {
    const { showSuccess, showError, showWarning, showConfirm, showPrompt } = useModal();
    const [reqs, setReqs] = useState<any[]>([]);
    const [kpis, setKpis] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');
    const [actioning, setActioning] = useState<string | null>(null);

    useEffect(() => { fetchReqs(filter); }, [filter]);

    const fetchReqs = async (status: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/payouts/queue?status=${status}`);
            if (res.ok) {
                const data = await res.json();
                setReqs(data.items || []);
                setKpis(data.kpis);
            }
        } finally { setLoading(false); }
    };

    const handleAction = (id: string, action: 'approve' | 'reject') => {
        if (action === 'reject') {
            showPrompt(
                "Reddetme Gerekçesi",
                "Lütfen bu ödeme talebini reddetme veya iptal etme sebebinizi giriniz (Min 5 karakter):",
                async (reason) => {
                    if (!reason || reason.length < 5) {
                        showWarning("Uyarı", "Lütfen geçerli bir sebep giriniz (En az 5 karakter).");
                        return;
                    }
                    await executeAction(id, action, reason);
                }
            );
        } else {
            showConfirm(
                "Transfer Onayı",
                "Tutar transferi IYZICO banka hesaplarına iletilecektir. Emin misiniz?",
                async () => {
                    await executeAction(id, action, "Otomatik Onay");
                }
            );
        }
    };

    const executeAction = async (id: string, action: string, reason: string) => {
        setActioning(id);
        try {
            const res = await fetch(`/api/admin/payouts/queue/${id}/${action}`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-idempotency-key": crypto.randomUUID() },
                body: JSON.stringify({ reason })
            });

            if (res.ok) {
                showSuccess("Bilgi", `İşlem Başarılı: ${action === 'approve' ? 'Onaylandı' : 'Reddedildi'}`);
                fetchReqs(filter);
            } else {
                const err = await res.json();
                showError("Hata", `Hata: ${err.error || 'İşlem başarısız oldu.'}`);
            }
        } finally { setActioning(null); }
    };

    return (
        <EnterprisePageShell
            title="Payout (Satıcı Hakediş) Kontrolü"
            description="B2B ağındaki satıcıların (Tenant) kazançlarının platform cüzdanlarından dış banka (IBAN) hesaplarına çıkış onayı ve sırası."
            actions={
                <EnterpriseButton variant="secondary" onClick={() => fetchReqs(filter)} disabled={loading}>
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Listeyi Yenile
                </EnterpriseButton>
            }
        >
            {kpis && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <EnterpriseCard className="relative overflow-hidden group">
                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <h3 className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                Onay Bekleyenler (REQUESTED)
                            </h3>
                            <Clock className="w-5 h-5 text-amber-500" />
                        </div>
                        <p className="text-3xl font-black text-slate-900 dark:text-white relative z-10 transition-transform group-hover:scale-[1.02]">
                            {kpis.requested} <span className="text-sm font-bold text-slate-500">İşlem</span>
                        </p>
                    </EnterpriseCard>

                    <EnterpriseCard className="relative overflow-hidden group border-blue-200 dark:border-blue-500/20">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-2xl -translate-y-8 translate-x-8"></div>
                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <h3 className="text-[11px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                                İşleniyor (PROCESSING)
                            </h3>
                            <RefreshCw className="w-5 h-5 text-blue-500" />
                        </div>
                        <p className="text-3xl font-black text-slate-900 dark:text-white relative z-10 transition-transform group-hover:scale-[1.02]">
                            {kpis.processing} <span className="text-sm font-bold text-slate-500">İşlem</span>
                        </p>
                    </EnterpriseCard>

                    <EnterpriseCard className="relative overflow-hidden group border-emerald-500/30 bg-gradient-to-br from-white to-emerald-50 dark:from-[#1e293b] dark:to-emerald-900/20">
                        <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -translate-x-8 translate-y-8"></div>
                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <h3 className="text-[11px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">
                                Başarılı Transfer Tutarı
                            </h3>
                            <CheckCircle className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                        </div>
                        <p className="text-3xl font-mono font-black text-slate-900 dark:text-white relative z-10 transition-transform group-hover:scale-[1.02]">
                            {Number(kpis.processedToday).toLocaleString('tr-TR')} <span className="text-lg">₺</span>
                        </p>
                    </EnterpriseCard>

                    <EnterpriseCard className="relative overflow-hidden group">
                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <h3 className="text-[11px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest">
                                Bloklanan/Hatalı (FAILED)
                            </h3>
                            <XCircle className="w-5 h-5 text-rose-500" />
                        </div>
                        <p className="text-3xl font-black text-slate-900 dark:text-white relative z-10 transition-transform group-hover:scale-[1.02]">
                            {kpis.failed} <span className="text-sm font-bold text-slate-500">İşlem</span>
                        </p>
                    </EnterpriseCard>
                </div>
            )}

            <div className="flex flex-wrap gap-2 mb-6">
                {['ALL', 'REQUESTED', 'APPROVED', 'PROCESSING', 'PAID_INTERNAL', 'FAILED', 'REJECTED']?.map(f => (
                    <button 
                        key={f} 
                        onClick={() => setFilter(f)} 
                        className={`px-4 py-2.5 text-[10px] font-black tracking-widest rounded-xl uppercase transition-all shadow-sm ${filter === f ? 'bg-indigo-600 dark:bg-indigo-500 text-white border-transparent scale-[1.02]' : 'bg-white dark:bg-[#1e293b] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-white/5'}`}
                    >
                        {f === 'ALL' ? 'TÜMÜ' : f}
                    </button>
                ))}
            </div>

            <EnterpriseCard noPadding>
                {loading && reqs.length === 0 ? (
                    <div className="py-24 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                        <RefreshCw className="w-8 h-8 opacity-50 mb-4 animate-spin" />
                        <span className="text-sm font-bold tracking-widest uppercase">Veriler Yükleniyor</span>
                    </div>
                ) : !loading && reqs.length === 0 ? (
                    <EnterpriseEmptyState 
                        icon={<Wallet className="w-10 h-10" />}
                        title="Ödeme Talebi Bulunamadı"
                        description={`${filter === 'ALL' ? 'Sistemde henüz bir ödeme (payout) talebi oluşturulmamış.' : 'Seçili duruma uygun ödeme talebi bulunmuyor.'}`}
                    />
                ) : (
                    <EnterpriseTable headers={['Talep Zamanı / ID', 'Firma (Seller ID)', 'Hedef (IBAN/Wallet)', 'Tutar', 'Statü', 'Aksiyon']}>
                        {reqs?.map(r => (
                            <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer group">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-slate-900 dark:text-white text-xs">{new Date(r.requestedAt).toLocaleString('tr-TR')}</div>
                                    <div className="font-mono text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase">ID: {r.id.split('-')[0]}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="font-mono font-bold text-[11px] text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                                        {r.sellerTenantId}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {r.destination ? (
                                        <div className="text-slate-700 dark:text-slate-300 text-xs">
                                            <span className="font-bold">{r.destination.type}</span> 
                                            {r.destination.ibanHash && <span className="text-slate-400 dark:text-slate-500 font-mono text-[10px] ml-1.5">(***{r.destination.ibanHash.slice(-4)})</span>}
                                        </div>
                                    ) : (
                                        <span className="text-slate-400 dark:text-slate-500 italic text-xs font-medium">Varsayılan Cüzdan</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                                        {Number(r.amount).toLocaleString('tr-TR')} {r.currency}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 rounded-md text-[9px] uppercase tracking-widest font-black ${
                                        r.status === 'REQUESTED' ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20' :
                                        r.status === 'APPROVED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20' :
                                        r.status === 'PAID_INTERNAL' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20' :
                                        r.status === 'FAILED' ? 'bg-rose-100 text-rose-800 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20' :
                                        r.status === 'REJECTED' ? 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700' :
                                        'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400 border border-slate-200 dark:border-white/10'
                                    }`}>
                                        {r.status}
                                    </span>
                                    {r.failureMessage && (
                                        <div className="text-[10px] font-medium text-rose-500 mt-1.5 max-w-[200px] truncate underline decoration-rose-500/30 cursor-help" title={r.failureMessage}>
                                            {r.failureMessage}
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {r.status === 'REQUESTED' && (
                                        <div className="flex justify-end gap-2">
                                            <button 
                                                disabled={actioning === r.id} 
                                                onClick={() => handleAction(r.id, 'reject')} 
                                                className="px-3 py-1.5 bg-white dark:bg-[#1e293b] text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg text-[10px] font-black uppercase tracking-widest border border-rose-200 dark:border-rose-500/30 transition-colors shadow-sm disabled:opacity-50"
                                            >
                                                RED
                                            </button>
                                            <button 
                                                disabled={actioning === r.id} 
                                                onClick={() => handleAction(r.id, 'approve')} 
                                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                                            >
                                                <CheckCircle className="w-3.5 h-3.5" /> ONAYLA
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </EnterpriseTable>
                )}
            </EnterpriseCard>
        </EnterprisePageShell>
    );
}
