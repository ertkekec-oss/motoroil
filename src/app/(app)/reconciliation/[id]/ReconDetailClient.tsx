"use client";

import Link from 'next/link';
import { useModal } from "@/contexts/ModalContext";

export default function ReconDetailClient({ reconciliation: recon }: { reconciliation: any }) {
    const { showSuccess, showError, showWarning } = useModal();
    const isDisputed = recon.status === 'DISPUTED';
    const isOk = recon.status === 'SIGNED';

    const handleResend = async () => {
        if (!confirm('Mutabakat davetini tekrar göndermek istiyor musunuz?')) return;
        try {
            const res = await fetch(`/api/reconciliation/${recon.id}/resend`, { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                showSuccess("Bilgi", 'Davet başarıyla yeniden gönderildi.');
                window.location.reload();
            } else {
                showError("Uyarı", data.error || 'Gönderim başarısız oldu.');
            }
        } catch (e) {
            showError("Uyarı", 'Ağ hatası.');
        }
    };

    const handleResolveDispute = async (disputeId: string) => {
        const resolutionNote = prompt('Bu uyuşmazlığı çözümlemek için notunuz:');
        if (resolutionNote === null) return; // user cancelled

        try {
            const res = await fetch(`/api/reconciliation/${recon.id}/disputes/${disputeId}/resolve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resolutionNote })
            });
            const data = await res.json();
            if (data.success) {
                showSuccess("Bilgi", 'Uyuşmazlık çözüldü olarak işaretlendi.');
                window.location.reload();
            } else {
                showError("Uyarı", data.error || 'İşlem başarısız.');
            }
        } catch (e) {
            showError("Uyarı", 'Ağ hatası.');
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <Link href="/reconciliation/list" style={{ color: '#888', textDecoration: 'none', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', marginBottom: '12px' }} className="hover:text-blue-500">
                        <span style={{ fontSize: '16px' }}>←</span> Listeye Dön
                    </Link>
                    <h1 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
                        Mutabakat Detayı <span style={{ opacity: 0.5, fontSize: '20px' }}>#{recon.id.substring(recon.id.length - 8).toUpperCase()}</span>
                    </h1>
                    <div style={{ display: 'flex', gap: '16px', color: 'var(--text-muted)', fontSize: '13px', fontWeight: '500' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ opacity: 0.6 }}>🏢</span> Cari: {recon.customer?.name || 'Bilinmiyor'}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ opacity: 0.6 }}>📅</span> Dönem: {new Date(recon.periodEnd).toLocaleDateString()}</span>
                    </div>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                        <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>DURUM</div>
                        <div style={{ fontSize: '18px', fontWeight: '900', color: isOk ? '#10b981' : isDisputed ? '#ef4444' : '#3b82f6' }}>
                            {isOk ? '🟢' : isDisputed ? '🔴' : '🟡'} {recon.status}
                        </div>
                    </div>
                    {['DRAFT', 'GENERATED', 'SENT', 'VIEWED'].includes(recon.status) && (
                        <button onClick={handleResend} style={{ padding: '8px 16px', background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }} className="hover:bg-white/10">
                            Yeniden Davet Gönder
                        </button>
                    )}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '32px' }}>
                {/* Left Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

                    {/* Bakiye Özeti */}
                    <div style={{ background: 'var(--bg-card, rgba(255,255,255,0.02))', borderRadius: '20px', padding: '32px', border: '1px solid var(--border-color)' }}>
                        <h2 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '24px', letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Bakiye Özeti (Beyan Edilen)</h2>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px' }}>Toplam Borç (Satış vb.)</div>
                                <div style={{ fontSize: '24px', fontWeight: '900' }}>{((recon.metaJson as any)?.totalDebit) || 0} {recon.currency}</div>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px' }}>Toplam Alacak (Tahsilat vb.)</div>
                                <div style={{ fontSize: '24px', fontWeight: '900' }}>{((recon.metaJson as any)?.totalCredit) || 0} {recon.currency}</div>
                            </div>
                        </div>

                        <div style={{ padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', background: Number(recon.balance) < 0 ? 'rgba(239,68,68,0.05)' : 'rgba(16,185,129,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: '12px', color: Number(recon.balance) < 0 ? '#ef4444' : '#10b981', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px' }}>Net Bakiye Durumu (Tarafımızca)</div>
                                <div style={{ fontSize: '32px', fontWeight: '900', color: Number(recon.balance) < 0 ? '#ef4444' : '#10b981' }}>{Math.abs(Number(recon.balance))} {recon.currency}</div>
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: 'bold', color: Number(recon.balance) < 0 ? '#ef4444' : '#10b981', textAlign: 'right' }}>
                                {Number(recon.balance) < 0 ? 'Bize Borçludurlar (Alacaklıyız)' : Number(recon.balance) > 0 ? 'Kendilerine Borçluyuz' : 'BAKİYE SIFIR (KAPALI)'}
                            </div>
                        </div>
                    </div>

                    {/* Dispute / Uyuşmazlık Varsa */}
                    {recon.disputes.length > 0 && (
                        <div style={{ background: 'var(--bg-card, rgba(239,68,68,0.05))', borderRadius: '20px', padding: '32px', border: '1px solid rgba(239,68,68,0.3)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                                <div style={{ fontSize: '24px' }}>⚠️</div>
                                <h2 style={{ fontSize: '16px', fontWeight: '800', letterSpacing: '0.5px', textTransform: 'uppercase', color: '#ef4444', margin: 0 }}>Uyuşmazlık (Dispute) Kayıtları</h2>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {recon.disputes.map((d: any) => (
                                    <div key={d.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(239,68,68,0.4)', borderRadius: '12px', padding: '20px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                            <div style={{ fontWeight: 'bold', color: '#ef4444' }}>Sebep: {d.reason}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(d.createdAt).toLocaleString()}</div>
                                        </div>
                                        {d.customerNote && (
                                            <div style={{ fontSize: '13px', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', borderLeft: '3px solid #ef4444', fontStyle: 'italic', color: 'var(--text-muted)' }}>
                                                "{d.customerNote}"
                                            </div>
                                        )}
                                        <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
                                            <div style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '4px', background: d.status === 'RESOLVED' ? '#10b981' : '#ef4444', color: 'white', fontWeight: 'bold' }}>{d.status}</div>
                                            {d.status !== 'RESOLVED' && (
                                                <button onClick={() => handleResolveDispute(d.id)} style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '4px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 'bold' }}>İtirazı İncele (Çözümle)</button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>

                {/* Right Column - Audit Trail & Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    <div style={{ background: 'var(--bg-card, rgba(255,255,255,0.02))', borderRadius: '20px', padding: '32px', border: '1px solid var(--border-color)' }}>
                        <h2 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '24px', letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>İşlem İz Haritası</h2>
                        {recon.auditEvents.length === 0 ? (
                            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>Henüz kayıt yok.</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                {recon.auditEvents.map((a: any, i: number) => (
                                    <div key={a.id} style={{ display: 'flex', gap: '12px', position: 'relative' }}>
                                        {i !== recon.auditEvents.length - 1 && (
                                            <div style={{ position: 'absolute', left: '15px', top: '30px', bottom: '-24px', width: '2px', background: 'var(--border-color)' }}></div>
                                        )}
                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', zIndex: 1 }}>
                                            {a.action.includes('VIEWED') ? '👁️' : a.action.includes('SIGNED') ? '✅' : a.action.includes('REJECTED') || a.action.includes('DISPUTE') ? '⚠️' : '📝'}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '13px', fontWeight: '700', color: a.action.includes('DISPUTE') ? '#ef4444' : a.action.includes('SIGNED') ? '#10b981' : 'var(--text-main)' }}>{a.action}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{new Date(a.createdAt).toLocaleString()}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
