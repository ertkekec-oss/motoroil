"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { updateDisputeStatusAction } from "@/services/finance/reconciliation/actions";
import { useRouter } from "next/navigation";
import { useModal } from "@/contexts/ModalContext";
import { EnterpriseCard } from "@/components/ui/enterprise";

export default function DisputesClient({ disputes }: { disputes: any[] }) {
    const { showSuccess, showError, showWarning } = useModal();
    const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'RESOLVED' | 'REJECTED'>('ALL');
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [currentTime, setCurrentTime] = useState<number | null>(null);

    useEffect(() => {
        setCurrentTime(Date.now());
    }, []);

    const filtered = disputes.filter(d => filter === 'ALL' || d.status === filter);

    const handleDownload = async (disputeId: string, reconId: string) => {
        try {
            const res = await fetch(`/api/reconciliation/${reconId}/disputes/download?disputeId=${disputeId}`);
            const data = await res.json();

            if (data.success && data.url) {
                const link = document.createElement('a');
                link.href = data.url;
                link.setAttribute('target', '_blank');
                document.body.appendChild(link);
                link.click();
                link.parentNode?.removeChild(link);
            } else {
                showError("Uyarı", data.error || "İndirme bağlantısı alınamadı");
            }
        } catch (e) {
            console.error(e);
            showError("Uyarı", "İndirme sırasında bir hata oluştu");
        }
    };

    const router = useRouter();

    const handleStatusUpdate = async (disputeId: string, newStatus: 'OPEN' | 'RESOLVED' | 'REJECTED') => {
        try {
            const res = await updateDisputeStatusAction(disputeId, newStatus);
            if (res.success) {
                setRefreshTrigger(prev => prev + 1);
                router.refresh();
            } else {
                showError("Uyarı", res.error || "Durum güncellenemedi.");
            }
        } catch (e) {
            console.error(e);
        }
    };

    const getAgingBadge = (createdAt: string, status: string) => {
        if (status !== 'OPEN' || !currentTime) return null;

        const diffMs = currentTime - new Date(createdAt).getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays >= 7) return <span className="ml-2 px-2 py-0.5 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded text-[10px] font-black uppercase tracking-widest">{diffDays} Gün Gecikti</span>;
        if (diffDays >= 3) return <span className="ml-2 px-2 py-0.5 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded text-[10px] font-black uppercase tracking-widest">{diffDays} Gün Açık</span>;
        return <span className="ml-2 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded text-[10px] font-black uppercase tracking-widest">Yeni ({diffDays} Gün)</span>;
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-[#07090e] pb-12">
            {/* Extended Sticky Header with Glassmorphism */}
            <div className="sticky top-0 z-40 bg-white/80 dark:bg-[#0b101a]/80 backdrop-blur-xl border-b border-light dark:border-white/5 pt-8 pb-6 px-4 md:px-8 xl:px-12 transition-all">
                <div className="max-w-[1400px] mx-auto w-full flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <Link 
                            href="/accounting/reconciliations" 
                            className="group flex items-center gap-2 text-sm font-black tracking-wide text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors uppercase"
                        >
                            <span className="text-lg group-hover:-translate-x-1 transition-transform">←</span>
                            MUTABAKATLARA DÖN
                        </Link>
                    </div>

                    <div className="flex flex-col md:flex-row gap-6 md:items-end md:justify-between">
                        <div className="flex items-center gap-5">
                            <div className="flex flex-col gap-1">
                                <h1 className="text-[28px] md:text-[36px] font-black text-slate-900 dark:text-white leading-tight tracking-tight">
                                    Mutabakat İtirazları (Disputes)
                                </h1>
                                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 max-w-2xl">
                                    Müşteriler tarafından "Mutabık Değiliz" olarak işaretlenip ek dosya/mesaj yollanan kayıtlar. Müşteri memnuniyeti ve hesap tutarlılığı için öncelikle bu listeyi temizlemeniz tavsiye edilir.
                                </p>
                            </div>
                        </div>

                        <div className="flex bg-slate-100 dark:bg-[#0f172a] p-1.5 rounded-xl border border-slate-200 dark:border-white/5">
                            {['ALL', 'OPEN', 'RESOLVED', 'REJECTED'].map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f as any)}
                                    className={`px-4 py-2 text-[11px] font-black uppercase tracking-widest rounded-lg transition-all ${filter === f ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                >
                                    {f === 'ALL' ? 'Tümü' : f === 'OPEN' ? 'Açık' : f === 'RESOLVED' ? 'Çözüldü' : 'Reddedildi'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-[1400px] w-full mx-auto px-4 md:px-8 xl:px-12 mt-8">
                <EnterpriseCard className="p-0 overflow-hidden shadow-lg border-slate-200 dark:border-white/5">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1000px] text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-white/[0.02] border-b border-light dark:border-white/5">
                                    <th className="py-5 px-6 text-[11px] font-black text-slate-500 dark:text-slate-400 tracking-widest uppercase">İtiraz Tarihi</th>
                                    <th className="py-5 px-6 text-[11px] font-black text-slate-500 dark:text-slate-400 tracking-widest uppercase">Mutabakat (Cari)</th>
                                    <th className="py-5 px-6 text-[11px] font-black text-slate-500 dark:text-slate-400 tracking-widest uppercase">Açıklama / Mesaj</th>
                                    <th className="py-5 px-6 text-[11px] font-black text-slate-500 dark:text-slate-400 tracking-widest uppercase">Durum & SLA</th>
                                    <th className="py-5 px-6 text-[11px] font-black text-slate-500 dark:text-slate-400 tracking-widest uppercase text-right">Aksiyonlar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-16 px-8 text-center bg-white dark:bg-[#0f172a]">
                                            <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                                                <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center text-4xl mb-4 grayscale">✨</div>
                                                <span className="text-base font-black text-slate-800 dark:text-white mb-1">Mevcut itiraz bulunmuyor.</span>
                                                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">"{filter === 'ALL' ? 'Tüm' : filter}" filtre kriterine uyan aktif bir dispute kaydı yok.</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filtered.map(d => (
                                    <tr key={d.id} className="border-b border-light dark:border-white/5 hover:bg-slate-50/50 dark:hover:bg-white/[0.015] transition-colors bg-white dark:bg-transparent">
                                        <td className="py-5 px-6 align-top">
                                            <div className="text-[13px] font-black text-slate-700 dark:text-white whitespace-nowrap">
                                                {new Date(d.createdAt).toLocaleDateString()}
                                            </div>
                                            <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">
                                                {new Date(d.createdAt).toLocaleTimeString()}
                                            </div>
                                        </td>
                                        <td className="py-5 px-6 align-top">
                                            <div className="flex flex-col gap-0.5">
                                                <div className="text-[14px] font-black text-slate-800 dark:text-white">{d.reconciliation.customer?.name || 'Bilinmeyen'}</div>
                                                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono p-1 bg-slate-100 dark:bg-white/5 rounded-md inline-block w-fit mt-1">
                                                    Zarf: {d.reconciliationId.substring(d.reconciliationId.length - 8).toUpperCase()}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-5 px-6 align-top">
                                            <div className="text-sm font-semibold text-slate-600 dark:text-slate-300 leading-relaxed max-w-sm line-clamp-3" title={d.message}>
                                                {d.message}
                                            </div>
                                        </td>
                                        <td className="py-5 px-6 align-top">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className={`px-3 py-1.5 rounded-lg text-[11px] font-black tracking-widest uppercase ${d.status === 'OPEN' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30' : d.status === 'RESOLVED' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30' : 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-500/30'}`}>
                                                    {d.status}
                                                </span>
                                                {getAgingBadge(d.createdAt, d.status)}
                                            </div>
                                            {d.assigneeId && (
                                                <div className="mt-2 text-[11px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                                                    Sorumlu: {d.assigneeId}
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-5 px-6 align-top text-right">
                                            <div className="flex flex-wrap items-center justify-end gap-2">
                                                <Link 
                                                    href={`/accounting/reconciliations/${d.reconciliationId}`} 
                                                    className="inline-flex items-center justify-center px-4 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-white text-[11px] font-black tracking-widest uppercase rounded-xl transition-all border border-slate-200 dark:border-white/10"
                                                >
                                                    İncele
                                                </Link>

                                                {d.attachmentKey && (
                                                    <button 
                                                        onClick={() => handleDownload(d.id, d.reconciliationId)} 
                                                        className="inline-flex items-center justify-center px-4 py-2.5 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[11px] font-black tracking-widest uppercase rounded-xl transition-all border border-blue-200 dark:border-blue-500/20 whitespace-nowrap"
                                                    >
                                                        Ek İndir
                                                    </button>
                                                )}

                                                {d.status === 'OPEN' && (
                                                    <>
                                                        <button 
                                                            onClick={() => handleStatusUpdate(d.id, 'RESOLVED')} 
                                                            className="inline-flex items-center justify-center px-4 py-2.5 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-black tracking-widest uppercase rounded-xl transition-all border border-emerald-200 dark:border-emerald-500/20"
                                                        >
                                                            Çözüldü
                                                        </button>
                                                        <button 
                                                            onClick={() => handleStatusUpdate(d.id, 'REJECTED')} 
                                                            className="inline-flex items-center justify-center px-4 py-2.5 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 text-[11px] font-black tracking-widest uppercase rounded-xl transition-all border border-red-200 dark:border-red-500/20"
                                                        >
                                                            Reddet
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </EnterpriseCard>
            </div>
        </div>
    );
}
