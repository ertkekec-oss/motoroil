"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useModal } from "@/contexts/ModalContext";

export default function EnvelopeDetailClient({ envelope, currentUserEmail }: { envelope: any, currentUserEmail?: string }) {
    const { showSuccess, showError, showWarning } = useModal();
    const [docUrl, setDocUrl] = useState('');
    const [loadingDoc, setLoadingDoc] = useState(false);
    const [signing, setSigning] = useState(false);

    const isMyTurn = envelope.recipients?.find((r: any) => r.email === currentUserEmail && ['PENDING', 'VIEWED'].includes(r.status));

    const handleSign = async () => {
        if (!confirm('Bu belgeyi dijital olarak imzalamayı onaylıyor musunuz?')) return;
        setSigning(true);
        try {
            const res = await fetch(`/api/signatures/envelopes/${envelope.id}/sign`, { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                showSuccess("Bilgi", 'Belge başarıyla imzalandı!');
                window.location.reload();
            } else {
                showError("Uyarı", data.error || 'İmzalama başarısız oldu.');
            }
        } catch (e) {
            showError("Uyarı", 'Bağlantı hatası.');
        } finally {
            setSigning(false);
        }
    };

    const handleViewDocument = async () => {
        if (docUrl) return; // already loaded
        setLoadingDoc(true);
        try {
            const res = await fetch(`/api/signatures/envelopes/${envelope.id}/document`);
            const data = await res.json();
            if (data.success && data.url) {
                setDocUrl(data.url);
            } else {
                showError("Uyarı", data.error || 'Belge yüklenemedi.');
            }
        } catch (e) {
            showError("Uyarı", 'Belge yüklenirken bağlantı hatası oluştu.');
        } finally {
            setLoadingDoc(false);
        }
    };

    const handleViewFinalDocument = async () => {
        setLoadingDoc(true);
        try {
            // Reusing the same endpoint, but we could add a `?final=true` param if we abstracted it
            // Assuming the endpoint serves the `signedDocumentKey` if COMPLETED
            const res = await fetch(`/api/signatures/envelopes/${envelope.id}/document?final=true`);
            const data = await res.json();
            if (data.success && data.url) {
                // Open raw URL in new tab directly for download
                window.open(data.url, '_blank');
            } else {
                showError("Uyarı", data.error || 'Final belge yüklenemedi.');
            }
        } catch (e) {
            showError("Uyarı", 'Belge yüklenirken bağlantı hatası oluştu.');
        } finally {
            setLoadingDoc(false);
        }
    };

    const handleCancel = async () => {
        if (!confirm('Bu zarfı iptal etmek (geri çekmek) istediğinize emin misiniz?')) return;
        try {
            const res = await fetch(`/api/signatures/envelopes/${envelope.id}/cancel`, { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                showSuccess("Bilgi", 'Zarf başarıyla iptal edildi.');
                window.location.reload();
            } else {
                showError("Uyarı", data.error || 'İptal işlemi başarısız.');
            }
        } catch (e) {
            showError("Uyarı", 'Ağ hatası oluştu, işlem yapılamadı.');
        }
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <Link href="/signatures/envelopes" style={{ color: '#888', textDecoration: 'none', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', marginBottom: '12px' }} className="hover:text-blue-500">
                        <span style={{ fontSize: '16px' }}>←</span> Zarf Listesine Dön
                    </Link>
                    <h1 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
                        Zarf Özeti <span style={{ opacity: 0.5, fontSize: '20px' }}>#{envelope.id.substring(envelope.id.length - 8).toUpperCase()}</span>
                    </h1>
                    <div style={{ display: 'flex', gap: '16px', color: 'var(--text-muted)', fontSize: '13px', fontWeight: '500' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ opacity: 0.6 }}>📄</span> Başlık: {envelope.title}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ opacity: 0.6 }}>📅</span> Oluşturulma: {new Date(envelope.createdAt).toLocaleString()}</span>
                    </div>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                        <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>DURUM</div>
                        <div style={{ fontSize: '18px', fontWeight: '900', color: envelope.status === 'COMPLETED' ? '#10b981' : envelope.status === 'REJECTED' ? '#ef4444' : envelope.status === 'REVISION_REQUESTED' ? '#f59e0b' : '#3b82f6' }}>
                            {envelope.status === 'COMPLETED' ? '🟢' : envelope.status === 'REJECTED' ? '🔴' : envelope.status === 'REVISION_REQUESTED' ? '🟠' : '🔵'} {envelope.status}
                        </div>
                    </div>
                    {['DRAFT', 'PENDING', 'IN_PROGRESS'].includes(envelope.status) && (
                        <button onClick={handleCancel} style={{ padding: '8px 16px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }} className="hover:bg-red-500/20">
                            İptal Et (Cancel)
                        </button>
                    )}
                    {isMyTurn && (
                        <button disabled={signing} onClick={handleSign} style={{ padding: '8px 16px', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }} className="hover:bg-blue-500/20 disabled:opacity-50">
                            <span>✍️</span> {signing ? 'İmzalanıyor...' : 'Belgeyi İmzala'}
                        </button>
                    )}
                    {envelope.status === 'REVISION_REQUESTED' && (
                        <button disabled={signing} onClick={async () => {
                            setSigning(true);
                            await fetch(`/api/signatures/envelopes/${envelope.id}/reject-revision`, { method: 'POST' });
                            window.location.reload();
                        }} style={{ padding: '8px 16px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }} className="hover:bg-amber-500/20 disabled:opacity-50">
                            <span>↪️</span> {signing ? 'İşleniyor...' : 'Revizeyi Reddet ve İmzaya Çıkar'}
                        </button>
                    )}
                    {envelope.status === 'COMPLETED' && envelope.signedDocumentKey && (
                        <button disabled={loadingDoc} onClick={handleViewFinalDocument} style={{ padding: '8px 16px', background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }} className="hover:bg-green-500/20 disabled:opacity-50">
                            <span>📄</span> {loadingDoc ? '...' : 'Tamamlanmış Belgeyi İndir'}
                        </button>
                    )}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '32px' }}>

                {/* Left Column - Recipients & Document */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

                    {/* Revision Requests Card */}
                    {envelope.auditEvents.filter((a: any) => a.action === 'RECIPIENT_REVISION_REQUESTED').length > 0 && (
                        <div style={{ background: 'rgba(245,158,11,0.05)', borderRadius: '20px', padding: '32px', border: '1px solid rgba(245,158,11,0.2)' }}>
                            <h2 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '24px', letterSpacing: '0.5px', textTransform: 'uppercase', color: '#f59e0b' }}>Revize Talepleri</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {envelope.auditEvents.filter((a: any) => a.action === 'RECIPIENT_REVISION_REQUESTED').map((a: any) => (
                                    <div key={a.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>{new Date(a.createdAt).toLocaleString()}</div>
                                        <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-color)' }}>
                                            {a.metaJson?.revisionMessage || 'Mesaj belirtilmemiş.'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Recipients Card */}
                    <div style={{ background: 'var(--bg-card, rgba(255,255,255,0.02))', borderRadius: '20px', padding: '32px', border: '1px solid var(--border-color)', position: 'relative' }}>
                        <h2 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '24px', letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>İmzacı Listesi (Sıralı)</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {envelope.recipients.map((r: any) => (
                                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '14px' }}>
                                            {r.orderIndex}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '700', fontSize: '14px' }}>{r.name}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{r.email} • Rol: {r.role}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                        <div style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', background: r.status === 'SIGNED' ? 'rgba(16,185,129,0.1)' : r.status === 'REJECTED' ? 'rgba(239,68,68,0.1)' : r.status === 'REVISION_REQUESTED' ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.05)', color: r.status === 'SIGNED' ? '#10b981' : r.status === 'REJECTED' ? '#ef4444' : r.status === 'REVISION_REQUESTED' ? '#f59e0b' : 'var(--text-muted)' }}>
                                            {r.status}
                                        </div>
                                        {r.signedAt && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(r.signedAt).toLocaleString()}</div>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Document View Card */}
                    <div style={{ background: 'var(--bg-card, rgba(255,255,255,0.02))', borderRadius: '20px', padding: '32px', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '16px', fontWeight: '800', letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0 }}>Belge Önizlemesi</h2>
                            {!docUrl && (
                                <button disabled={loadingDoc} onClick={handleViewDocument} style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
                                    {loadingDoc ? 'Yükleniyor...' : 'Belgeyi Görüntüle / İndir'}
                                </button>
                            )}
                        </div>

                        {docUrl && (
                            <div style={{ background: 'rgba(0,0,0,0.1)', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '4px', overflow: 'hidden' }}>
                                <iframe src={`${docUrl}#toolbar=0`} style={{ width: '100%', height: '600px', border: 'none', borderRadius: '8px' }} />
                                <div style={{ textAlign: 'center', marginTop: '12px', marginBottom: '8px' }}>
                                    <a href={docUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', fontSize: '12px', fontWeight: 'bold', textDecoration: 'none' }} className="hover:underline">
                                        Eğer önizleme desteklenmiyorsa, orijinal dosyayı indirmek için tıklayın.
                                    </a>
                                </div>
                            </div>
                        )}
                        {!docUrl && !loadingDoc && (
                            <div style={{ padding: '64px', textAlign: 'center', border: '2px dashed var(--border-color)', borderRadius: '12px', color: 'var(--text-muted)' }}>
                                <div style={{ fontSize: '48px', opacity: 0.5, marginBottom: '16px' }}>📄</div>
                                <div style={{ fontSize: '14px', fontWeight: '600' }}>Gizliliği Korumak Adına Belge Otomatik Açılmaz.</div>
                                <div style={{ fontSize: '12px', marginTop: '4px' }}>Görüntülemek için yukarıdaki butona tıklayınız.</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column - Audit Trail */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    <div style={{ background: 'var(--bg-card, rgba(255,255,255,0.02))', borderRadius: '20px', padding: '32px', border: '1px solid var(--border-color)' }}>
                        <h2 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '24px', letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Sistem İz Haritası</h2>
                        {envelope.auditEvents.length === 0 ? (
                            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>Henüz kayıt yok.</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                {envelope.auditEvents.map((a: any, i: number) => (
                                    <div key={a.id} style={{ display: 'flex', gap: '12px', position: 'relative' }}>
                                        {i !== envelope.auditEvents.length - 1 && (
                                            <div style={{ position: 'absolute', left: '15px', top: '30px', bottom: '-24px', width: '2px', background: 'var(--border-color)' }}></div>
                                        )}
                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', zIndex: 1 }}>
                                            {a.action.includes('VIEWED') ? '👁️' : a.action.includes('SIGNED') ? '✅' : a.action.includes('REJECTED') ? '❌' : '📝'}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '13px', fontWeight: '700' }}>{a.action}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{new Date(a.createdAt).toLocaleString()}</div>
                                            {a.metaJson && a.metaJson.ip && (
                                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '8px', fontFamily: 'monospace' }}>
                                                    {a.metaJson.ip} • {a.metaJson.userAgent?.substring(0, 30)}...
                                                </div>
                                            )}
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
