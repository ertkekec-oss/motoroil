"use client";

import { useState } from "react";
import Link from "next/link";
import { useModal } from "@/contexts/ModalContext";
import { resendReconAction, voidReconAction, exportReconEvidenceAction, openReconDisputeAction } from "@/services/finance/reconciliation/actions";
import { useRouter } from "next/navigation";

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
            case 'DRAFT': return <span className="badge badge-gray">Taslak</span>;
            case 'GENERATED': return <span className="badge badge-gray">Oluşturuldu</span>;
            case 'SENT': return <span className="badge badge-blue">Gönderildi</span>;
            case 'VIEWED': return <span className="badge badge-blue">Görüldü</span>;
            case 'SIGNING': return <span className="badge badge-amber">İmza Bekliyor</span>;
            case 'SIGNED': return <span className="badge badge-emerald">İmzalandı</span>;
            case 'REJECTED': return <span className="badge badge-red">Reddedildi</span>;
            case 'DISPUTED': return <span className="badge badge-amber">İtirazlı</span>;
            case 'EXPIRED': return <span className="badge badge-gray">Süresi Doldu</span>;
            case 'VOID': return <span className="badge badge-gray">İptal Edildi</span>;
            default: return <span className="badge badge-gray">{status}</span>;
        }
    };

    return (
        <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg-main)', color: 'var(--text-main)' }}>
            {/* Header */}
            <div style={{ padding: '32px 40px', background: 'var(--bg-panel)', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                    <div className="flex-between">
                        <Link href="/accounting" style={{ color: 'var(--text-muted, #888)', textDecoration: 'none', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }} className="hover:text-blue-500">
                            <span style={{ fontSize: '16px' }}>←</span> Finans Merkezi
                        </Link>
                    </div>

                    <div style={{ marginTop: '24px', display: 'flex', gap: '32px', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <h1 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>B2B Cari Mutabakatlar</h1>
                            <div style={{ color: 'var(--text-muted, #888)', fontSize: '14px' }}>Cari mutabakatları gönderin, e-imza süreçlerini takip edin ve dispute yönetimini yapın.</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div style={{ padding: '32px 40px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '32px' }}>
                    <div style={{ background: 'var(--bg-card, rgba(255,255,255,0.03))', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', padding: '24px', borderRadius: '16px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Taslak / Üretilen</div>
                        <div style={{ fontSize: '32px', fontWeight: '900', color: 'white' }}>{stats.totalDraft}</div>
                    </div>
                    <div style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '24px', borderRadius: '16px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '800', color: '#3b82f6', marginBottom: '8px', textTransform: 'uppercase' }}>İmza Bekleyen</div>
                        <div style={{ fontSize: '32px', fontWeight: '900', color: '#60a5fa' }}>{stats.pendingSignature}</div>
                    </div>
                    <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '24px', borderRadius: '16px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '800', color: '#10b981', marginBottom: '8px', textTransform: 'uppercase' }}>İmzalandı</div>
                        <div style={{ fontSize: '32px', fontWeight: '900', color: '#34d399' }}>{stats.signed}</div>
                    </div>
                    <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '24px', borderRadius: '16px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '800', color: '#ef4444', marginBottom: '8px', textTransform: 'uppercase' }}>Geciken (Overdue)</div>
                        <div style={{ fontSize: '32px', fontWeight: '900', color: '#f87171' }}>{stats.overdue}</div>
                    </div>
                    <div style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '24px', borderRadius: '16px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '800', color: '#f59e0b', marginBottom: '8px', textTransform: 'uppercase' }}>İtirazlı (Disputed)</div>
                        <div style={{ fontSize: '32px', fontWeight: '900', color: '#fbbf24' }}>{stats.disputed}</div>
                    </div>
                </div>

                {/* Table Area */}
                <div style={{ background: 'var(--bg-panel, rgba(15, 23, 42, 0.4))', borderRadius: '20px', border: '1px solid var(--border-color, rgba(255,255,255,0.05))', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
                        <thead>
                            <tr style={{ background: 'var(--bg-card, rgba(255,255,255,0.03))', borderBottom: '1px solid var(--border-color)' }}>
                                <th style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase' }}>Dönem</th>
                                <th style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase' }}>Müşteri / Cari</th>
                                <th style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase' }}>Bakiye & Para Birimi</th>
                                <th style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase' }}>Durum</th>
                                <th style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase' }}>Teslimat & Auth</th>
                                <th style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase' }}>Son Hareket</th>
                                <th style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase', textAlign: 'right' }}>Aksiyonlar</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reconciliations.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ padding: '60px 40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>🤝</div>
                                        <div style={{ fontSize: '16px', fontWeight: '600' }}>Henüz kayıtlı mutabakat yok</div>
                                        <div style={{ fontSize: '13px', marginTop: '8px' }}>Müşteri detay sayfasından ilk mutabakatınızı oluşturabilirsiniz.</div>
                                    </td>
                                </tr>
                            ) : reconciliations.map((r: any) => (
                                <tr key={r.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }} className="hover:bg-white/5">
                                    <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '600' }}>
                                        {new Date(r.periodStart).toLocaleDateString()} - {new Date(r.periodEnd).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '16px 24px' }}>
                                        <div style={{ fontWeight: '700' }}>{r.customer?.name}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>VN: {r.customer?.taxNumber || '-'}</div>
                                    </td>
                                    <td style={{ padding: '16px 24px' }}>
                                        <div style={{ fontSize: '16px', fontWeight: '900', color: Number(r.balance) > 0 ? '#ef4444' : '#10b981' }}>
                                            {Math.abs(Number(r.balance)).toLocaleString()} <span style={{ fontSize: '12px', opacity: 0.8 }}>{r.currency}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 24px' }}>
                                        {renderStatusBadge(r.status)}
                                    </td>
                                    <td style={{ padding: '16px 24px', fontSize: '13px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ opacity: 0.6 }}>🚀 {r.deliveryMethod}</span>
                                            <span style={{ opacity: 0.6 }}>| 🔐 {r.authMethod}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-muted)' }}>
                                        {r.auditEvents && r.auditEvents.length > 0 ? (
                                            <>
                                                <div>{r.auditEvents[0].action}</div>
                                                <div style={{ fontSize: '11px' }}>{new Date(r.auditEvents[0].createdAt).toLocaleString()}</div>
                                            </>
                                        ) : '-'}
                                    </td>
                                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                            <Link href={`/accounting/reconciliations/${r.id}`} className="btn btn-outline" style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'white' }}>
                                                Görüntüle
                                            </Link>

                                            {!['SIGNED', 'VOID'].includes(r.status) && (
                                                <button onClick={() => handleResend(r.id)} disabled={processing === r.id} className="btn" style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(59,130,246,0.3)', background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                                                    Tekrar Gönder
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Placeholder */}
                {pagination.totalPages > 1 && (
                    <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>
                        <div>Toplam {pagination.totalCount} kayıt, Sayfa {pagination.currentPage} / {pagination.totalPages}</div>
                        {/* Add a pagination strip here if needed */}
                    </div>
                )}
            </div>
        </div>
    );
}

// Global styles for badges (these might be needed if not in globals.css)
// You can add this to the same file or standard generic styles.
// .badge { padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; }
// .badge-blue { background: rgba(59,130,246,0.1); color: #3b82f6; border: 1px solid rgba(59,130,246,0.2); }
// .badge-emerald { background: rgba(16,185,129,0.1); color: #10b981; border: 1px solid rgba(16,185,129,0.2); }
// .badge-amber { background: rgba(245,158,11,0.1); color: #f59e0b; border: 1px solid rgba(245,158,11,0.2); }
// .badge-red { background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.2); }
// .badge-gray { background: rgba(255,255,255,0.05); color: #fff; border: 1px solid rgba(255,255,255,0.1); }
