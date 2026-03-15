"use client";

import { useState } from "react";
import Link from "next/link";
import { updateDisputeStatusAction } from "@/services/finance/reconciliation/actions";
import { useRouter } from "next/navigation";
import { useModal } from "@/contexts/ModalContext";

export default function DisputesClient({ disputes }: { disputes: any[] }) {
    const { showSuccess, showError, showWarning } = useModal();
    const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'RESOLVED' | 'REJECTED'>('ALL');
    const [refreshTrigger, setRefreshTrigger] = useState(0);

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
        if (status !== 'OPEN') return null;

        const diffMs = Date.now() - new Date(createdAt).getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays >= 7) return <span style={{ padding: '2px 6px', background: 'rgba(239,68,68,0.2)', color: '#ef4444', borderRadius: '4px', fontSize: '10px', marginLeft: '6px', fontWeight: 'bold' }}>{diffDays} Gün Gecikti</span>;
        if (diffDays >= 3) return <span style={{ padding: '2px 6px', background: 'rgba(245,158,11,0.2)', color: '#f59e0b', borderRadius: '4px', fontSize: '10px', marginLeft: '6px', fontWeight: 'bold' }}>{diffDays} Gün Açık</span>;
        return <span style={{ padding: '2px 6px', background: 'rgba(16,185,129,0.2)', color: '#10b981', borderRadius: '4px', fontSize: '10px', marginLeft: '6px', fontWeight: 'bold' }}>Yeni ({diffDays} Gün)</span>;
    };

    return (
        <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg-main)', color: 'var(--text-main)' }}>
            <div style={{ background: 'var(--bg-panel)', borderBottom: '1px solid var(--border-color)', padding: '24px 40px', position: 'sticky', top: 0, zIndex: 40 }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <Link href="/accounting/reconciliations" style={{ color: '#888', textDecoration: 'none', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', marginBottom: '12px' }} className="hover:text-blue-500">
                            <span style={{ fontSize: '16px' }}>←</span> Mutabakatlara Dön
                        </Link>
                        <h1 style={{ fontSize: '26px', fontWeight: '800', margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>
                            Mutabakat İtirazları (Disputes)
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>Müşteriler tarafından "Mutabık Değiliz" olarak işaretlenip ek dosya/mesaj yollanan kayıtlar.</p>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-card)', padding: '6px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                        {['ALL', 'OPEN', 'RESOLVED', 'REJECTED'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f as any)}
                                style={{
                                    padding: '8px 16px', background: filter === f ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none',
                                    color: filter === f ? 'white' : 'var(--text-muted)', fontWeight: '700', fontSize: '12px', borderRadius: '8px', cursor: 'pointer'
                                }}
                            >
                                {f === 'ALL' ? 'Tümü' : f === 'OPEN' ? 'Açık' : f === 'RESOLVED' ? 'Çözüldü' : 'Reddedildi'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%', padding: '32px 40px' }}>
                <div style={{ background: 'var(--bg-card, rgba(255,255,255,0.02))', borderRadius: '20px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--border-color)' }}>
                                    <th style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>İtiraz Tarihi</th>
                                    <th style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Mutabakat (Cari)</th>
                                    <th style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Açıklama / Mesaj</th>
                                    <th style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Durum & SLA</th>
                                    <th style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Aksiyonlar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>Mevcut itiraz bulunmuyor.</td>
                                    </tr>
                                ) : filtered.map(d => (
                                    <tr key={d.id} className="hover:bg-slate-800/20" style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '16px 24px', fontSize: '13px' }}>
                                            {new Date(d.createdAt).toLocaleString()}
                                        </td>
                                        <td style={{ padding: '16px 24px', fontSize: '13px' }}>
                                            <div style={{ fontWeight: '700', color: 'white' }}>{d.reconciliation.customer?.name || 'Bilinmeyen'}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: '4px' }}>
                                                Zarf: {d.reconciliationId.substring(d.reconciliationId.length - 8).toUpperCase()}
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 24px', fontSize: '13px', maxWidth: '300px' }}>
                                            <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={d.message}>
                                                {d.message}
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <span style={{
                                                    padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800',
                                                    background: d.status === 'OPEN' ? 'rgba(245,158,11,0.1)' : d.status === 'RESOLVED' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                                    color: d.status === 'OPEN' ? '#f59e0b' : d.status === 'RESOLVED' ? '#10b981' : '#ef4444'
                                                }}>
                                                    {d.status}
                                                </span>
                                                {getAgingBadge(d.createdAt, d.status)}
                                            </div>
                                            {d.assigneeId && (
                                                <div style={{ marginTop: '6px', fontSize: '11px', color: '#3b82f6', fontWeight: '600' }}>
                                                    Sorumlu: {d.assigneeId}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '16px 24px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                            <Link href={`/accounting/reconciliations/${d.reconciliationId}`} style={{ display: 'inline-flex', padding: '6px 16px', background: 'rgba(255,255,255,0.05)', color: 'white', borderRadius: '8px', textDecoration: 'none', fontSize: '12px', fontWeight: '600' }} className="hover:bg-white/10 hide-mobile">
                                                Görüntüle
                                            </Link>

                                            {d.attachmentKey && (
                                                <button onClick={() => handleDownload(d.id, d.reconciliationId)} style={{ padding: '6px 16px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', color: '#3b82f6', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }} className="hover:bg-blue-500/20">
                                                    Ek İndir
                                                </button>
                                            )}

                                            {d.status === 'OPEN' && (
                                                <>
                                                    <button onClick={() => handleStatusUpdate(d.id, 'RESOLVED')} style={{ padding: '6px 16px', background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }} className="hover:bg-emerald-500/20">
                                                        Çözüldü
                                                    </button>
                                                    <button onClick={() => handleStatusUpdate(d.id, 'REJECTED')} style={{ padding: '6px 16px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }} className="hover:bg-red-500/20">
                                                        Reddet
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
