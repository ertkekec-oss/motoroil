"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useModal } from "@/contexts/ModalContext";
import { resendReconAction, voidReconAction, exportReconEvidenceAction, openReconDisputeAction, updateDisputeStatusAction, addDisputeInternalNoteAction, assignDisputeAction } from "@/services/finance/reconciliation/actions";
import { useRouter } from "next/navigation";

export default function ReconDetailClient({ reconciliation: r }: { reconciliation: any }) {
    const { showSuccess, showError, showConfirm } = useModal();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'ITEMS' | 'DISPUTES' | 'AUDIT'>('ITEMS');
    const [processing, setProcessing] = useState<string | null>(null);
    const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});

    // --- DOC STATE & HANDLERS ---
    const [documents, setDocuments] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    const fetchDocuments = async () => {
        try {
            const res = await fetch(`/api/reconciliation/${r.id}/documents`);
            if (res.ok) {
                const data = await res.json();
                setDocuments(data.documents || []);
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, [r.id]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            showError("Hata", "Dosya boyutu 10MB'dan küçük olmalıdır.");
            return;
        }

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('title', file.name);

            const res = await fetch(`/api/reconciliation/${r.id}/documents/upload`, {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                await fetchDocuments();
                showSuccess("Başarılı", "Belge başarıyla yüklendi.");
            } else {
                const err = await res.json();
                showError("Hata", err.error || "Dosya yüklenemedi.");
            }
        } catch (e) {
            console.error(e);
            showError("Hata", "Dosya yüklenirken bir sorun oluştu.");
        } finally {
            setIsUploading(false);
            e.target.value = '';
        }
    };

    const handleDownloadDocument = async (docId: string, fileName: string) => {
        try {
            const res = await fetch(`/api/reconciliation/documents/${docId}/download`);
            const data = await res.json();

            if (data.success && data.url) {
                const link = document.createElement('a');
                link.href = data.url;
                link.setAttribute('download', fileName);
                document.body.appendChild(link);
                link.click();
                link.parentNode?.removeChild(link);
            } else {
                showError("Hata", data.error || "İndirme bağlantısı alınamadı");
            }
        } catch (e) {
            console.error(e);
            showError("Hata", "İndirme sırasında bir hata oluştu");
        }
    };

    const handleDeleteDocument = async (docId: string) => {
        showConfirm("Belgeyi Sil", "Mutabakat ekini silmek istediğinize emin misiniz?", async () => {
            try {
                const res = await fetch(`/api/reconciliation/documents/${docId}`, { method: 'DELETE' });
                if (res.ok) {
                    await fetchDocuments();
                } else {
                    showError("Hata", "Belge silinemedi.");
                }
            } catch (e) {
                console.error(e);
                showError("Hata", "Silme sırasında bir hata oluştu.");
            }
        });
    };

    const handleResend = async () => {
        setProcessing('RESEND');
        const res = await resendReconAction(r.id);
        if (res.success) { showSuccess("Başarılı", "Mutabakat tekrar gönderildi."); router.refresh(); }
        else { showError("Hata", res.error); }
        setProcessing(null);
    };

    const handleDownloadDisputeAttachment = async (disputeId: string) => {
        try {
            showSuccess("İndiriliyor", "İtiraz dosyası hazırlanıyor...");
            const res = await fetch(`/api/reconciliation/${r.id}/disputes/download?disputeId=${disputeId}`);
            const data = await res.json();

            if (data.success && data.url) {
                const link = document.createElement('a');
                link.href = data.url;
                link.setAttribute('target', '_blank');
                document.body.appendChild(link);
                link.click();
                link.parentNode?.removeChild(link);
            } else {
                showError("Hata", data.error || "İndirme bağlantısı alınamadı");
            }
        } catch (e) {
            console.error(e);
            showError("Hata", "İndirme sırasında bir hata oluştu");
        }
    };

    const handleUpdateDisputeStatus = async (disputeId: string, status: 'OPEN' | 'RESOLVED' | 'REJECTED') => {
        setProcessing(`STATUS_${disputeId}`);
        const res = await updateDisputeStatusAction(disputeId, status);
        if (res.success) { showSuccess("Başarılı", "İtiraz durumu güncellendi."); router.refresh(); }
        else { showError("Hata", res.error); }
        setProcessing(null);
    };

    const handleSaveNote = async (disputeId: string) => {
        const note = noteInputs[disputeId];
        if (!note) return;
        setProcessing(`NOTE_${disputeId}`);
        const res = await addDisputeInternalNoteAction(disputeId, note);
        if (res.success) { showSuccess("Başarılı", "İç not eklendi."); router.refresh(); }
        else { showError("Hata", res.error); }
        setProcessing(null);
    };

    const handleVoid = async () => {
        showConfirm("Mutabakatı İptal Et", "Bu mutabakatı iptal etmek (VOID) istediğinize emin misiniz?", async () => {
            setProcessing('VOID');
            const res = await voidReconAction(r.id, "User VOID request from Detail UI");
            if (res.success) { showSuccess("Başarılı", "Mutabakat iptal edildi."); router.refresh(); }
            else { showError("Hata", res.error); }
            setProcessing(null);
        });
    };

    const handleDispute = async () => {
        showConfirm("İtiraz / Dispute", "Bir itiraz başlatmak istediğinize emin misiniz? Karşı tarafın mutabakata red yanıtı vermesi otomatik Dispute açabilir.", async () => {
            setProcessing('DISPUTE');
            const res = await openReconDisputeAction(r.id, "OTHER", "Manuel Dispute from Admin interface.");
            if (res.success) { showSuccess("Başarılı", "Dispute talebi açıldı."); router.refresh(); }
            else { showError("Hata", res.error); }
            setProcessing(null);
        });
    };

    const handleExport = async () => {
        setProcessing('EXPORT');
        const res = await exportReconEvidenceAction(r.id);
        if (res.success) { showSuccess("Export Sıraya Alındı", "Arka planda hazırlanıp dosya oluşturulacak."); }
        else { showError("Hata", res.error); }
        setProcessing(null);
    };

    return (
        <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg-main)', color: 'var(--text-main)', paddingBottom: '100px' }}>
            {/* Header Strip */}
            <div style={{ background: 'var(--bg-panel)', borderBottom: '1px solid var(--border-color)', padding: '24px 40px', position: 'sticky', top: 0, zIndex: 40 }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="flex-between">
                        <Link href="/accounting/reconciliations" style={{ color: 'var(--text-muted, #888)', textDecoration: 'none', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }} className="hover:text-blue-500">
                            <span style={{ fontSize: '16px' }}>←</span> Mutabakatlara Dön
                        </Link>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {!['SIGNED', 'VOID'].includes(r.status) && (
                                <>
                                    <button onClick={handleResend} disabled={!!processing} className="btn" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', color: '#3b82f6', padding: '10px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: '600' }}>
                                        {processing === 'RESEND' ? '...' : '📩 Yeniden Gönder'}
                                    </button>
                                    <button onClick={handleVoid} disabled={!!processing} className="btn" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '10px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: '600' }}>
                                        🚨 İptal Et (VOID)
                                    </button>
                                </>
                            )}
                            <button onClick={handleExport} disabled={!!processing} className="btn" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'white', padding: '10px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: '600' }}>
                                ⬇️ Tamamını Dışa Aktar (Export)
                            </button>
                            <button onClick={handleDispute} disabled={!!processing} className="btn" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b', padding: '10px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: '600' }}>
                                ⚠️ İtiraz (Dispute) Aç
                            </button>
                            <button onClick={() => showSuccess("Bilgi", 'Future-ready: İmzaya Gönder V1 Katmanı')} disabled={!!processing} className="btn hover:bg-emerald-500/20" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', padding: '10px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: 'bold' }}>
                                ✍️ İmzaya Gönder
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h1 style={{ fontSize: '26px', fontWeight: '800', margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>
                                Mutabakat Zarfı <span style={{ opacity: 0.5, fontSize: '20px' }}>#{r.id.substring(r.id.length - 8).toUpperCase()}</span>
                            </h1>
                            <div style={{ display: 'flex', gap: '16px', color: 'var(--text-muted)', fontSize: '13px', fontWeight: '500' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ opacity: 0.6 }}>🏢</span> {r.customer?.name} (VN: {r.customer?.taxNumber})</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ opacity: 0.6 }}>📅</span> Dönem: {new Date(r.periodStart).toLocaleDateString()} - {new Date(r.periodEnd).toLocaleDateString()}</span>
                            </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>DURUM</div>
                            <div style={{ fontSize: '18px', fontWeight: '900', color: r.status === 'SIGNED' ? '#10b981' : r.status === 'DISPUTED' ? '#f59e0b' : r.status === 'VOID' ? '#64748b' : '#3b82f6' }}>
                                🟢 {r.status}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%', padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: '32px' }}>

                {/* SNAPSHOT CARD AND CONTRACT CARD ROW */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                    {/* Snapshot Card */}
                    <div style={{ background: 'var(--bg-card, rgba(255,255,255,0.02))', borderRadius: '20px', padding: '32px', border: '1px solid var(--border-color)', position: 'relative' }}>
                        <div style={{ position: 'absolute', top: '16px', right: '16px', opacity: 0.4, fontSize: '48px' }}>🔐</div>
                        <h2 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '24px', letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Mali Özet (Snapshot)</h2>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                            <div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Toplam Borç Kayıtları</div>
                                <div style={{ fontSize: '18px', fontWeight: '800', color: '#ef4444' }}>{Number(r.snapshot?.totalDebit || 0).toLocaleString()} <span style={{ fontSize: '12px', opacity: 0.8 }}>₺</span></div>
                            </div>
                            <div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Toplam Alacak Kayıtları</div>
                                <div style={{ fontSize: '18px', fontWeight: '800', color: '#10b981' }}>{Number(r.snapshot?.totalCredit || 0).toLocaleString()} <span style={{ fontSize: '12px', opacity: 0.8 }}>₺</span></div>
                            </div>
                        </div>

                        <div style={{ padding: '24px', background: 'rgba(0,0,0,0.2)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>Net Bakiye:</div>
                            <div style={{ fontSize: '36px', fontWeight: '900', color: Number(r.balance) > 0 ? '#ef4444' : '#10b981', letterSpacing: '-1px' }}>
                                {Math.abs(Number(r.balance)).toLocaleString()} <span style={{ fontSize: '24px', opacity: 0.8 }}>₺</span>
                                <span style={{ fontSize: '14px', marginLeft: '12px', padding: '4px 8px', borderRadius: '6px', background: 'var(--bg-panel)', textTransform: 'uppercase' }}>
                                    {Number(r.balance) > 0 ? 'BORÇLU (AÇIK RİSK)' : Number(r.balance) < 0 ? 'ALACAKLI' : 'DENGELİ'}
                                </span>
                            </div>
                        </div>

                        <div style={{ marginTop: '24px', fontSize: '11px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', wordBreak: 'break-all' }}>
                            <b>Immutable Digital Signature Hash (SHA-256):</b><br />
                            {r.snapshot?.hashSha256 || "Yükleniyor..."}
                        </div>
                    </div>

                    {/* Contracts Card */}
                    <div style={{ background: 'var(--bg-card, rgba(255,255,255,0.02))', borderRadius: '20px', padding: '32px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '16px', fontWeight: '800', letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0 }}>Entegrasyon & İmza</h2>
                            <div style={{ padding: '4px 12px', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', borderRadius: '20px', fontSize: '12px', fontWeight: '800' }}>e-İmza & Otomasyon</div>
                        </div>

                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Gönderim Yöntemi</span>
                                <span style={{ fontWeight: '700' }}>{r.deliveryMethod}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Yetkilendirme (Auth)</span>
                                <span style={{ fontWeight: '700' }}>{r.authMethod} Method</span>
                            </div>

                            {r.linkedEnvelopeId ? (
                                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Zarf ID (Signature Engine)</span>
                                    <span style={{ fontWeight: '700', color: '#10b981' }}>Aktif Zarf: {r.linkedEnvelopeId}</span>
                                </div>
                            ) : (
                                <div style={{ fontSize: '12px', color: '#f59e0b', padding: '12px', background: 'rgba(245,158,11,0.05)', borderRadius: '8px' }}>
                                    ⚠️ Orijinal sözleşme motoruna henüz linklenmemiş e-imza kanıtı beklemede.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* DOCUMENTS PANEL */}
                <div style={{ background: 'var(--bg-card, rgba(255,255,255,0.02))', borderRadius: '20px', padding: '32px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                        <div>
                            <h2 style={{ fontSize: '16px', fontWeight: '800', letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0 }}>Mutabakat Ekleri</h2>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Manuel yüklenen referans veya ek belgeleri buradan yönetebilirsiniz.</p>
                        </div>
                        <label style={{ padding: '8px 16px', background: 'rgba(16,185,129,0.1)', color: '#10b981', borderRadius: '8px', fontSize: '12px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s', opacity: isUploading ? 0.5 : 1, pointerEvents: isUploading ? 'none' : 'auto' }} className="hover:bg-[rgba(16,185,129,0.2)]">
                            {isUploading ? 'Yükleniyor...' : '+ Ek Yükle'}
                            <input type="file" style={{ display: 'none' }} accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx" onChange={handleFileUpload} />
                        </label>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {documents.length === 0 ? (
                            <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>Henüz eklenen bir belge yok.</p>
                        ) : (
                            documents.map(doc => (
                                <div key={doc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(0,0,0,0.1)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ overflow: 'hidden', paddingRight: '16px' }}>
                                        <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={doc.fileName}>{doc.name || doc.fileName}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '4px' }}>
                                            {new Date(doc.createdAt).toLocaleDateString()} • {(doc.size / 1024).toFixed(0)} KB
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                                        <button onClick={() => handleDownloadDocument(doc.id, doc.fileName)} style={{ padding: '6px', color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '6px' }} title="İndir" className="hover:text-blue-500 hover:bg-blue-500/10">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                        </button>
                                        <button onClick={() => handleDeleteDocument(doc.id)} style={{ padding: '6px', color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '6px' }} title="Sil" className="hover:text-red-500 hover:bg-red-500/10">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* TABS FOR DETAILS */}
                <div style={{ display: 'flex', gap: '32px', borderBottom: '1px solid var(--border-color)', marginTop: '24px' }}>
                    {[
                        { id: 'ITEMS', label: 'Hareket Detayları', count: r.items?.length || 0 },
                        { id: 'DISPUTES', label: 'Aktif İtirazlar', count: r.disputes?.length || 0 },
                        { id: 'AUDIT', label: 'Erişim ve Audit Log', count: r.auditEvents?.length || 0 }
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => setActiveTab(t.id as any)}
                            style={{
                                padding: '16px 4px', background: 'transparent', border: 'none',
                                color: activeTab === t.id ? '#3b82f6' : 'var(--text-muted)',
                                fontWeight: activeTab === t.id ? '800' : '600',
                                fontSize: '13px', textTransform: 'uppercase', cursor: 'pointer',
                                position: 'relative'
                            }}
                        >
                            {t.label} ({t.count})
                            {activeTab === t.id && <div style={{ position: 'absolute', bottom: '-1px', left: 0, right: 0, height: '2px', background: '#3b82f6' }} />}
                        </button>
                    ))}
                </div>

                {/* TAB CONTENTS */}
                <div style={{ background: 'var(--bg-card, rgba(255,255,255,0.02))', borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                    {activeTab === 'ITEMS' && (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--border-color)' }}>
                                        <th style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-muted)' }}>Tarih</th>
                                        <th style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-muted)' }}>Açıklama / Fatura Belge</th>
                                        <th style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'right' }}>Borç (Size)</th>
                                        <th style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'right' }}>Alacak (Müşteriye)</th>
                                        <th style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-muted)' }}>Source / Hash</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {r.items?.length === 0 ? (
                                        <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>Mevcut kalem yok.</td></tr>
                                    ) : r.items?.map((item: any) => (
                                        <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            <td style={{ padding: '12px 24px', fontSize: '13px' }}>{new Date(item.date).toLocaleString()}</td>
                                            <td style={{ padding: '12px 24px', fontSize: '13px', fontWeight: '600' }}>{item.description}</td>
                                            <td style={{ padding: '12px 24px', fontSize: '13px', color: '#ef4444', textAlign: 'right', fontWeight: '700' }}>{Number(item.debit) > 0 ? Number(item.debit).toLocaleString() : ''}</td>
                                            <td style={{ padding: '12px 24px', fontSize: '13px', color: '#10b981', textAlign: 'right', fontWeight: '700' }}>{Number(item.credit) > 0 ? Number(item.credit).toLocaleString() : ''}</td>
                                            <td style={{ padding: '12px 24px', fontSize: '12px', color: 'var(--text-muted)' }}>{item.sourceType}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'DISPUTES' && (
                        <div style={{ padding: '32px' }}>
                            {r.disputes?.length === 0 ? (
                                <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Açılmış itiraz kaydı yok. Müşteri belgeyi imzalama sürecinde veya ret işleminde bulunmamış.</div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {r.disputes.map((d: any) => (
                                        <div key={d.id} style={{ padding: '24px', border: '1px solid rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.05)', borderRadius: '16px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                                <div style={{ fontWeight: '800', fontSize: '16px', color: '#f59e0b' }}>[#{d.id.substring(d.id.length - 6).toUpperCase()}] İtiraz Formu</div>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    {d.status === 'OPEN' && (
                                                        <>
                                                            <button onClick={() => handleUpdateDisputeStatus(d.id, 'RESOLVED')} disabled={!!processing} style={{ padding: '4px 12px', background: 'rgba(16,185,129,0.1)', color: '#10b981', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }} className="hover:bg-emerald-500/20">✔ Çözüldü İşaretle</button>
                                                            <button onClick={() => handleUpdateDisputeStatus(d.id, 'REJECTED')} disabled={!!processing} style={{ padding: '4px 12px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }} className="hover:bg-red-500/20">✖ İtirazı Reddet</button>
                                                        </>
                                                    )}
                                                    <div style={{ padding: '4px 12px', background: d.status === 'OPEN' ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.1)', borderRadius: '6px', fontSize: '12px', color: d.status === 'OPEN' ? '#f59e0b' : 'white' }}>Durum: {d.status}</div>
                                                </div>
                                            </div>
                                            <div style={{ fontSize: '14px', color: 'white', lineHeight: '1.6', marginBottom: '16px' }}>
                                                {d.message || 'Detay girilmedi.'}
                                            </div>

                                            {d.internalNotes && (
                                                <div style={{ padding: '12px', background: 'rgba(59,130,246,0.1)', borderLeft: '2px solid #3b82f6', marginBottom: '16px', fontSize: '13px', color: '#e2e8f0', borderRadius: '4px' }}>
                                                    <span style={{ fontWeight: 'bold', color: '#3b82f6', display: 'block', marginBottom: '4px' }}>İç Not (Ops):</span>
                                                    {d.internalNotes}
                                                </div>
                                            )}

                                            {d.status === 'OPEN' && !d.internalNotes && (
                                                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                                                    <input
                                                        type="text"
                                                        placeholder="Sadece iç ekibin görebileceği not ekle..."
                                                        value={noteInputs[d.id] || ''}
                                                        onChange={e => setNoteInputs({ ...noteInputs, [d.id]: e.target.value })}
                                                        style={{ flex: 1, padding: '8px 12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '13px' }}
                                                    />
                                                    <button onClick={() => handleSaveNote(d.id)} disabled={!noteInputs[d.id] || !!processing} style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: noteInputs[d.id] ? 'pointer' : 'not-allowed', opacity: noteInputs[d.id] ? 1 : 0.5 }}>Kaydet</button>
                                                </div>
                                            )}

                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span>Açan: Portal (Dış Müşteri) • Tarih: {new Date(d.createdAt).toLocaleString()}{d.assigneeId ? ` • Sorumlu: ${d.assigneeId}` : ''}</span>
                                                {d.attachmentKey && (
                                                    <button onClick={() => handleDownloadDisputeAttachment(d.id)} className="btn hover:text-blue-500" style={{ padding: '6px 16px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', color: '#3b82f6', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                                        Ek Dosya (İndir)
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'AUDIT' && (
                        <div style={{ padding: '32px' }}>
                            <div style={{ borderLeft: '2px solid var(--border-color)', paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                {r.auditEvents?.map((ev: any, idx: number) => (
                                    <div key={ev.id} style={{ position: 'relative' }}>
                                        <div style={{ position: 'absolute', left: '-31px', top: '0', width: '12px', height: '12px', borderRadius: '50%', background: idx === 0 ? '#3b82f6' : 'var(--text-muted)', border: '2px solid var(--bg-panel)' }} />
                                        <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '4px' }}>{new Date(ev.createdAt).toLocaleString()} • {ev.actorType}</div>
                                        <div style={{ fontSize: '15px', fontWeight: '700', color: idx === 0 ? 'white' : 'var(--text-muted)' }}>{ev.action}</div>
                                        {ev.metaJson && Object.keys(ev.metaJson).length > 0 && (
                                            <div style={{ marginTop: '8px', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-muted)', display: 'inline-block' }}>
                                                <pre style={{ margin: 0, fontFamily: 'monospace' }}>{JSON.stringify(ev.metaJson, null, 2)}</pre>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
