"use client";

import { useState } from "react";
import Link from "next/link";
import { useModal } from "@/contexts/ModalContext";
import { resendReconAction, voidReconAction, exportReconEvidenceAction } from "@/services/finance/reconciliation/actions";
import { useRouter } from "next/navigation";
import { EnterpriseCard } from "@/components/ui/EnterpriseCard";

export default function ReconciliationsClient({ reconciliations, stats, pagination }: { reconciliations: any[], stats: any, pagination: any }) {
    const { showSuccess, showError, showConfirm } = useModal();
    const router = useRouter();

    const [processing, setProcessing] = useState<string | null>(null);

    const handleResend = async (id: string) => {
        setProcessing(id);
        const res = await resendReconAction(id);
        if (res.success) {
            showSuccess("Başarılı", "Mutabakat tekrar gönderildi.");
            router.refresh();
        } else {
            showError("Hata", res.error);
        }
        setProcessing(null);
    };

    const handleVoid = async (id: string) => {
        showConfirm("Mutabakatı İptal Et", "Bu mutabakatı iptal etmek (VOID) istediğinize emin misiniz?", async () => {
            setProcessing(id);
            const res = await voidReconAction(id, "User requested void from listing");
            if (res.success) {
                showSuccess("Başarılı", "Mutabakat iptal edildi.");
                router.refresh();
            } else {
                showError("Hata", res.error);
            }
            setProcessing(null);
        });
    };

    const handleExport = async (id: string) => {
        setProcessing(id);
        const res = await exportReconEvidenceAction(id);
        if (res.success) {
            showSuccess("Başarılı", "Dışa aktarma işlemi kuyruğa eklendi.");
        } else {
            showError("Hata", res.error);
        }
        setProcessing(null);
    };

    const renderStatusBadge = (status: string) => {
        switch (status) {
            case 'DRAFT': return <span className="px-3 py-1 bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-white border border-slate-200 dark:border-white/10 rounded-full text-[11px] font-black tracking-wide uppercase">Taslak</span>;
            case 'GENERATED': return <span className="px-3 py-1 bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-white border border-slate-200 dark:border-white/10 rounded-full text-[11px] font-black tracking-wide uppercase">Oluşturuldu</span>;
            case 'SENT': return <span className="px-3 py-1 bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 rounded-full text-[11px] font-black tracking-wide uppercase">Gönderildi</span>;
            case 'VIEWED': return <span className="px-3 py-1 bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 rounded-full text-[11px] font-black tracking-wide uppercase">Görüldü</span>;
            case 'SIGNING': return <span className="px-3 py-1 bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-500 border border-amber-200 dark:border-amber-500/20 rounded-full text-[11px] font-black tracking-wide uppercase">İmza Bekliyor</span>;
            case 'SIGNED': return <span className="px-3 py-1 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 rounded-full text-[11px] font-black tracking-wide uppercase">İmzalandı</span>;
            case 'REJECTED': return <span className="px-3 py-1 bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-500/20 rounded-full text-[11px] font-black tracking-wide uppercase">Reddedildi</span>;
            case 'DISPUTED': return <span className="px-3 py-1 bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-500 border border-amber-200 dark:border-amber-500/20 rounded-full text-[11px] font-black tracking-wide uppercase">İtirazlı</span>;
            case 'EXPIRED': return <span className="px-3 py-1 bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400 border border-slate-200 dark:border-white/10 rounded-full text-[11px] font-black tracking-wide uppercase">Süresi Doldu</span>;
            case 'VOID': return <span className="px-3 py-1 bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400 border border-slate-200 dark:border-white/10 rounded-full text-[11px] font-black tracking-wide uppercase">İptal Edildi</span>;
            default: return <span className="px-3 py-1 bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-white border border-slate-200 dark:border-white/10 rounded-full text-[11px] font-black tracking-wide uppercase">{status}</span>;
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-[#07090e] pb-12">
            {/* Extended Sticky Header with Glassmorphism */}
            <div className="sticky top-0 z-40 bg-white/80 dark:bg-[#0b101a]/80 backdrop-blur-xl border-b border-light dark:border-white/5 pt-8 pb-6 px-4 md:px-8 xl:px-12 transition-all">
                <div className="max-w-[1400px] mx-auto w-full flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <Link 
                            href="/accounting" 
                            className="group flex items-center gap-2 text-sm font-black tracking-wide text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors uppercase"
                        >
                            <span className="text-lg group-hover:-translate-x-1 transition-transform">←</span>
                            FİNANS MERKEZİ
                        </Link>
                    </div>

                    <div className="flex flex-col md:flex-row gap-6 md:items-end md:justify-between">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-blue-500/20 dark:from-indigo-500/10 dark:to-blue-500/10 flex items-center justify-center text-3xl shadow-inner border border-white/50 dark:border-white/5">
                                🤝
                            </div>
                            <div className="flex flex-col gap-1">
                                <h1 className="text-[32px] md:text-[40px] font-black text-slate-900 dark:text-white leading-tight tracking-tight">
                                    B2B Mutabakatlar
                                </h1>
                                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 max-w-xl">
                                    Cari mutabakatları gönderin, e-imza süreçlerini takip edin ve dispute yönetimini kontrol altına alın.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-[1400px] w-full mx-auto px-4 md:px-8 xl:px-12 mt-8 flex flex-col gap-8">
                
                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <EnterpriseCard className="p-5 flex flex-col gap-2 relative overflow-hidden group">
                        <div className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest z-10 relative">Taslak / Üretilen</div>
                        <div className="text-3xl font-black text-slate-800 dark:text-white z-10 relative flex items-baseline gap-2">
                            {stats.totalDraft}
                        </div>
                        <div className="absolute -right-4 -top-4 text-7xl opacity-[0.03] dark:opacity-[0.02] grayscale group-hover:scale-110 transition-transform">📄</div>
                    </EnterpriseCard>

                    <EnterpriseCard className="p-5 flex flex-col gap-2 relative overflow-hidden group border-blue-200 dark:border-blue-500/20 bg-blue-50/50 dark:bg-blue-500/5">
                        <div className="text-[11px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest z-10 relative">İmza Bekleyen</div>
                        <div className="text-3xl font-black text-blue-700 dark:text-blue-300 z-10 relative flex items-baseline gap-2">
                            {stats.pendingSignature}
                        </div>
                        <div className="absolute -right-4 -top-4 text-7xl opacity-[0.06] dark:opacity-[0.04] grayscale group-hover:scale-110 transition-transform">✍️</div>
                    </EnterpriseCard>

                    <EnterpriseCard className="p-5 flex flex-col gap-2 relative overflow-hidden group border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/5">
                        <div className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest z-10 relative">İmzalandı</div>
                        <div className="text-3xl font-black text-emerald-700 dark:text-emerald-300 z-10 relative flex items-baseline gap-2">
                            {stats.signed}
                        </div>
                        <div className="absolute -right-4 -top-4 text-7xl opacity-[0.06] dark:opacity-[0.04] grayscale group-hover:scale-110 transition-transform">✅</div>
                    </EnterpriseCard>

                    <EnterpriseCard className="p-5 flex flex-col gap-2 relative overflow-hidden group border-red-200 dark:border-red-500/20 bg-red-50/50 dark:bg-red-500/5">
                        <div className="text-[11px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest z-10 relative">Geciken</div>
                        <div className="text-3xl font-black text-red-700 dark:text-red-300 z-10 relative flex items-baseline gap-2">
                            {stats.overdue}
                        </div>
                        <div className="absolute -right-4 -top-4 text-7xl opacity-[0.06] dark:opacity-[0.04] grayscale group-hover:scale-110 transition-transform">⏰</div>
                    </EnterpriseCard>

                    <EnterpriseCard className="p-5 flex flex-col gap-2 relative overflow-hidden group border-amber-200 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-500/5">
                        <div className="text-[11px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest z-10 relative">İtirazlı (Disputed)</div>
                        <div className="text-3xl font-black text-amber-700 dark:text-amber-400 z-10 relative flex items-baseline gap-2">
                            {stats.disputed}
                        </div>
                        <div className="absolute -right-4 -top-4 text-7xl opacity-[0.08] dark:opacity-[0.04] grayscale group-hover:scale-110 transition-transform">⚠️</div>
                    </EnterpriseCard>
                </div>

                {/* Main Table */}
                <EnterpriseCard className="p-0 overflow-hidden shadow-lg border-slate-200 dark:border-white/5">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1000px] text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/5">
                                    <th className="py-5 px-6 text-[11px] font-black text-slate-500 dark:text-slate-400 tracking-widest uppercase items-center">Dönem</th>
                                    <th className="py-5 px-6 text-[11px] font-black text-slate-500 dark:text-slate-400 tracking-widest uppercase">Müşteri / Cari</th>
                                    <th className="py-5 px-6 text-[11px] font-black text-slate-500 dark:text-slate-400 tracking-widest uppercase">Bakiye & Para Birimi</th>
                                    <th className="py-5 px-6 text-[11px] font-black text-slate-500 dark:text-slate-400 tracking-widest uppercase">Durum</th>
                                    <th className="py-5 px-6 text-[11px] font-black text-slate-500 dark:text-slate-400 tracking-widest uppercase">Teslimat & Auth</th>
                                    <th className="py-5 px-6 text-[11px] font-black text-slate-500 dark:text-slate-400 tracking-widest uppercase">Son Hareket</th>
                                    <th className="py-5 px-6 text-right"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {reconciliations.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-16 px-8 text-center bg-white dark:bg-[#0f172a]">
                                            <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                                                <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center text-4xl mb-4">🤝</div>
                                                <span className="text-base font-black text-slate-800 dark:text-white mb-1">Henüz kayıtlı mutabakat yok</span>
                                                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Müşteri detay sayfasından ilk mutabakatınızı oluşturabilirsiniz.</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : reconciliations.map((r: any) => (
                                    <tr key={r.id} className="border-b border-light dark:border-white/5 hover:bg-slate-50/50 dark:hover:bg-white/[0.015] transition-colors bg-white dark:bg-transparent">
                                        <td className="py-5 px-6 align-middle">
                                            <div className="text-[13px] font-black text-slate-700 dark:text-white whitespace-nowrap">
                                                {new Date(r.periodStart).toLocaleDateString()} - {new Date(r.periodEnd).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="py-5 px-6 align-middle">
                                            <div className="flex flex-col gap-0.5">
                                                <div className="text-[14px] font-black text-slate-800 dark:text-white">{r.customer?.name}</div>
                                                <div className="text-[12px] font-bold text-slate-500 dark:text-slate-400">VN: {r.customer?.taxNumber || '-'}</div>
                                            </div>
                                        </td>
                                        <td className="py-5 px-6 align-middle">
                                            <div className={"text-lg font-black " + (Number(r.balance) > 0 ? "text-red-500 dark:text-red-400" : "text-emerald-500 dark:text-emerald-400")}>
                                                {Math.abs(Number(r.balance)).toLocaleString()} <span className="text-xs font-bold opacity-80">{r.currency}</span>
                                            </div>
                                        </td>
                                        <td className="py-5 px-6 align-middle">
                                            {renderStatusBadge(r.status)}
                                        </td>
                                        <td className="py-5 px-6 align-middle">
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-white/5 rounded-md text-[11px] font-black text-slate-600 dark:text-slate-300">
                                                    <span className="opacity-70">🚀</span> {r.deliveryMethod}
                                                </div>
                                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-white/5 rounded-md text-[11px] font-black text-slate-600 dark:text-slate-300">
                                                    <span className="opacity-70">🔐</span> {r.authMethod}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-5 px-6 align-middle">
                                            {r.auditEvents && r.auditEvents.length > 0 ? (
                                                <div className="flex flex-col gap-0.5 max-w-[180px] break-words">
                                                    <div className="text-[12px] font-bold text-slate-700 dark:text-slate-300 leading-tight">{r.auditEvents[0].action}</div>
                                                    <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{new Date(r.auditEvents[0].createdAt).toLocaleString()}</div>
                                                </div>
                                            ) : <span className="text-slate-400">-</span>}
                                        </td>
                                        <td className="py-5 px-6 align-middle text-right">
                                            <div className="flex items-center justify-end gap-3 flex-nowrap whitespace-nowrap">
                                                <Link 
                                                    href={"/accounting/reconciliations/" + r.id} 
                                                    className="inline-flex items-center justify-center px-4 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-white text-[12px] font-black rounded-xl transition-all border border-slate-200 dark:border-white/10"
                                                >
                                                    Görüntüle
                                                </Link>

                                                {!['SIGNED', 'VOID'].includes(r.status) && (
                                                    <button 
                                                        onClick={() => handleResend(r.id)} 
                                                        disabled={processing === r.id} 
                                                        className="inline-flex items-center justify-center px-4 py-2.5 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 disabled:opacity-50 text-blue-600 dark:text-blue-400 text-[12px] font-black rounded-xl transition-all border border-blue-200 dark:border-blue-500/20"
                                                    >
                                                        {processing === r.id ? 'İşleniyor...' : 'Tekrar Gönder'}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </EnterpriseCard>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between bg-white dark:bg-[#0f172a] px-6 py-4 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
                        <div className="text-[13px] font-bold text-slate-500 dark:text-slate-400">
                            Toplam <strong className="text-slate-800 dark:text-white">{pagination.totalCount}</strong> kayıt, Sayfa <strong className="text-slate-800 dark:text-white">{pagination.currentPage} / {pagination.totalPages}</strong>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
