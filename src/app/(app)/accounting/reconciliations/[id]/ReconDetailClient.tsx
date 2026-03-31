"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useModal } from "@/contexts/ModalContext";
import { resendReconAction, voidReconAction, exportReconEvidenceAction, openReconDisputeAction, updateDisputeStatusAction, addDisputeInternalNoteAction } from "@/services/finance/reconciliation/actions";
import { useRouter } from "next/navigation";
import { EnterpriseCard } from "@/components/ui/enterprise";

export default function ReconDetailClient({ reconciliation: r }: { reconciliation: any }) {
    const { showSuccess, showError, showConfirm } = useModal();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'ITEMS' | 'DISPUTES' | 'AUDIT'>('ITEMS');
    const [processing, setProcessing] = useState<string | null>(null);
    const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});

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
        showConfirm("İtiraz / Dispute", "Bir itiraz başlatmak istediğinize emin misiniz?", async () => {
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
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-[#07090e] pb-12">
            {/* Extended Sticky Header with Glassmorphism */}
            <div className="sticky top-0 z-40 bg-white/80 dark:bg-[#0b101a]/80 backdrop-blur-xl border-b border-light dark:border-white/5 pt-8 pb-6 px-4 md:px-8 xl:px-12 transition-all">
                <div className="max-w-[1400px] mx-auto w-full flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                        <Link 
                            href="/accounting/reconciliations" 
                            className="group flex items-center gap-2 text-sm font-black tracking-wide text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors uppercase"
                        >
                            <span className="text-lg group-hover:-translate-x-1 transition-transform">←</span>
                            MUTABAKATLARA DÖN
                        </Link>
                        
                        <div className="flex flex-wrap gap-2">
                            {!['SIGNED', 'VOID'].includes(r.status) && (
                                <>
                                    <button 
                                        onClick={handleResend} 
                                        disabled={!!processing} 
                                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-black rounded-xl hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all border border-blue-200 dark:border-blue-500/20 disabled:opacity-50"
                                    >
                                        {processing === 'RESEND' ? '...' : '📩 Yeniden Gönder'}
                                    </button>
                                    <button 
                                        onClick={handleVoid} 
                                        disabled={!!processing} 
                                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-black rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-all border border-red-200 dark:border-red-500/20 disabled:opacity-50"
                                    >
                                        🚨 İptal Et (VOID)
                                    </button>
                                </>
                            )}
                            <button 
                                onClick={handleExport} 
                                disabled={!!processing} 
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white text-xs font-black rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 transition-all border border-slate-200 dark:border-white/10 disabled:opacity-50"
                            >
                                ⬇️ Tamamını Dışa Aktar
                            </button>
                            <button 
                                onClick={handleDispute} 
                                disabled={!!processing} 
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 text-xs font-black rounded-xl hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-all border border-amber-200 dark:border-amber-500/20 disabled:opacity-50"
                            >
                                ⚠️ İtiraz Aç
                            </button>
                            <button 
                                onClick={() => showSuccess("Bilgi", 'Future-ready: İmzaya Gönder V1 Katmanı')} 
                                disabled={!!processing} 
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all border border-emerald-200 dark:border-emerald-500/20 disabled:opacity-50"
                            >
                                ✍️ İmzaya Gönder
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-6 md:items-end justify-between">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                                Mutabakat Zarfı 
                                <span className="text-xl font-bold text-slate-400 dark:text-slate-600">#{r.id.substring(r.id.length - 8).toUpperCase()}</span>
                            </h1>
                            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm font-bold text-slate-500 dark:text-slate-400">
                                <span className="flex items-center gap-1.5"><span className="opacity-70">🏢</span> {r.customer?.name} (VN: {r.customer?.taxNumber})</span>
                                <span className="flex items-center gap-1.5"><span className="opacity-70">📅</span> Dönem: {new Date(r.periodStart).toLocaleDateString()} - {new Date(r.periodEnd).toLocaleDateString()}</span>
                            </div>
                        </div>

                        <div className="text-right">
                            <div className="text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase mb-1">Durum</div>
                            <div className={`text-lg font-black ${r.status === 'SIGNED' ? 'text-emerald-500 dark:text-emerald-400' : r.status === 'DISPUTED' ? 'text-amber-500 dark:text-amber-400' : r.status === 'VOID' ? 'text-slate-500 dark:text-slate-400' : 'text-blue-500 dark:text-blue-400'}`}>
                                🟢 {r.status}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-[1400px] w-full mx-auto px-4 md:px-8 xl:px-12 mt-8 flex flex-col gap-8">
                
                {/* SNAPSHOT & CONTRACT ROW */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Snapshot Card */}
                    <EnterpriseCard className="p-8 relative overflow-hidden group">
                        <div className="absolute top-6 right-6 text-6xl opacity-[0.03] dark:opacity-[0.02] grayscale group-hover:scale-110 transition-transform">🔐</div>
                        <h2 className="text-[12px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-6">Mali Özet (Snapshot)</h2>

                        <div className="grid grid-cols-2 gap-6 mb-6">
                            <div>
                                <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Toplam Borç Kayıtları</div>
                                <div className="text-xl font-black text-red-500 dark:text-red-400">
                                    {Number(r.snapshot?.totalDebit || 0).toLocaleString()} <span className="text-sm font-bold opacity-80">₺</span>
                                </div>
                            </div>
                            <div>
                                <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Toplam Alacak Kayıtları</div>
                                <div className="text-xl font-black text-emerald-500 dark:text-emerald-400">
                                    {Number(r.snapshot?.totalCredit || 0).toLocaleString()} <span className="text-sm font-bold opacity-80">₺</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 dark:bg-white/[0.02] rounded-2xl border border-slate-200 dark:border-white/5">
                            <div className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-2">Net Bakiye:</div>
                            <div className={`text-4xl font-black tracking-tight flex flex-wrap items-center gap-4 ${Number(r.balance) > 0 ? 'text-red-500 dark:text-red-400' : 'text-emerald-500 dark:text-emerald-400'}`}>
                                <div>{Math.abs(Number(r.balance)).toLocaleString()} <span className="text-2xl font-bold opacity-80">₺</span></div>
                                <span className="px-3 py-1.5 bg-slate-200 dark:bg-[#0f172a] rounded-lg text-xs font-black tracking-widest text-slate-700 dark:text-slate-300 uppercase shrink-0">
                                    {Number(r.balance) > 0 ? 'BORÇLU (AÇIK RİSK)' : Number(r.balance) < 0 ? 'ALACAKLI' : 'DENGELİ'}
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 p-4 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5 break-all">
                            <div className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Immutable Hash (SHA-256):</div>
                            <div className="text-xs font-mono text-slate-600 dark:text-slate-300">{r.snapshot?.hashSha256 || "Yükleniyor..."}</div>
                        </div>
                    </EnterpriseCard>

                    {/* Contracts Card */}
                    <EnterpriseCard className="p-8 flex flex-col relative overflow-hidden group">
                        <div className="absolute top-6 right-6 text-6xl opacity-[0.03] dark:opacity-[0.02] grayscale group-hover:scale-110 transition-transform">⚙️</div>
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-[12px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest m-0">Entegrasyon & İmza</h2>
                            <div className="px-3 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-black uppercase tracking-widest">e-İmza & Otomasyon</div>
                        </div>

                        <div className="flex-1 flex flex-col gap-4 relative z-10">
                            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-white/5">
                                <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Gönderim Yöntemi</span>
                                <span className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wide bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-lg">{r.deliveryMethod}</span>
                            </div>
                            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-white/5">
                                <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Yetkilendirme (Auth)</span>
                                <span className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wide bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-lg">{r.authMethod} Method</span>
                            </div>

                            {r.linkedEnvelopeId ? (
                                <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-emerald-500/20">
                                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Zarf ID (Signature Engine)</span>
                                    <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Aktif Zarf: {r.linkedEnvelopeId}</span>
                                </div>
                            ) : (
                                <div className="p-4 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-200 dark:border-amber-500/20 text-sm font-bold text-amber-700 dark:text-amber-500">
                                    ⚠️ Orijinal sözleşme motoruna henüz linklenmemiş e-imza kanıtı beklemede.
                                </div>
                            )}
                        </div>
                    </EnterpriseCard>
                </div>

                {/* DOCUMENTS PANEL */}
                <EnterpriseCard className="p-6 md:p-8 flex flex-col mt-4">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 mb-6 md:mb-8">
                        <div>
                            <h2 className="text-[12px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest m-0">Mutabakat Ekleri</h2>
                            <p className="text-sm font-bold text-slate-400 dark:text-slate-500 mt-2">Manuel yüklenen referans veya ek belgeleri yönetin.</p>
                        </div>
                        <label className={`inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all border border-emerald-200 dark:border-emerald-500/20 ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                            {isUploading ? 'Yükleniyor...' : '+ Ek Yükle'}
                            <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx" onChange={handleFileUpload} />
                        </label>
                    </div>

                    <div className="flex flex-col gap-3">
                        {documents.length === 0 ? (
                            <div className="text-sm font-bold text-slate-400 dark:text-slate-500 italic p-6 bg-slate-50 dark:bg-white/[0.02] rounded-xl border border-slate-200 dark:border-white/5 text-center">Henüz eklenen bir belge yok.</div>
                        ) : (
                            documents.map(doc => (
                                <div key={doc.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-slate-50 dark:bg-white/[0.02] rounded-xl border border-slate-200 dark:border-white/5 gap-4">
                                    <div className="overflow-hidden w-full md:pr-4">
                                        <div className="text-sm font-black text-slate-800 dark:text-white truncate" title={doc.fileName}>{doc.name || doc.fileName}</div>
                                        <div className="text-[10px] font-black text-slate-500 tracking-widest uppercase mt-1.5 flex items-center gap-2">
                                            <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                                            <span>{(doc.size / 1024).toFixed(0)} KB</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 w-full md:w-auto shrink-0 justify-end mt-2 md:mt-0">
                                        <button onClick={() => handleDownloadDocument(doc.id, doc.fileName)} className="p-2 text-slate-500 dark:text-slate-400 bg-transparent hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors border border-transparent hover:border-blue-200 dark:hover:border-blue-500/20" title="İndir">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                        </button>
                                        <button onClick={() => handleDeleteDocument(doc.id)} className="p-2 text-slate-500 dark:text-slate-400 bg-transparent hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-500/20" title="Sil">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </EnterpriseCard>

                {/* TABS HEADER */}
                <div className="flex overflow-x-auto gap-8 border-b border-light dark:border-white/5 mt-4 no-scrollbar">
                    {[
                        { id: 'ITEMS', label: 'Hareket Detayları', count: r.items?.length || 0 },
                        { id: 'DISPUTES', label: 'Aktif İtirazlar', count: r.disputes?.length || 0 },
                        { id: 'AUDIT', label: 'Erişim ve Audit Log', count: r.auditEvents?.length || 0 }
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => setActiveTab(t.id as any)}
                            className={`px-2 py-4 whitespace-nowrap text-[12px] font-black uppercase tracking-widest relative transition-colors ${activeTab === t.id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
                        >
                            {t.label} 
                            <span className="ml-2 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-[10px]">{t.count}</span>
                            {activeTab === t.id && <div className="absolute bottom-[-1px] left-0 right-0 height-px bg-blue-600 dark:bg-blue-400 h-0.5 rounded-t-full" />}
                        </button>
                    ))}
                </div>

                {/* TAB CONTENTS */}
                <EnterpriseCard className="p-0 overflow-hidden shadow-lg border-slate-200 dark:border-white/5 min-h-[400px]">
                    {activeTab === 'ITEMS' && (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[800px] text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/5">
                                        <th className="py-4 px-6 text-[11px] font-black text-slate-500 dark:text-slate-400 tracking-widest uppercase">Tarih</th>
                                        <th className="py-4 px-6 text-[11px] font-black text-slate-500 dark:text-slate-400 tracking-widest uppercase">Açıklama / Fatura Belge</th>
                                        <th className="py-4 px-6 text-[11px] font-black text-slate-500 dark:text-slate-400 tracking-widest uppercase text-right">Borç (Size)</th>
                                        <th className="py-4 px-6 text-[11px] font-black text-slate-500 dark:text-slate-400 tracking-widest uppercase text-right">Alacak (Müşteriye)</th>
                                        <th className="py-4 px-6 text-[11px] font-black text-slate-500 dark:text-slate-400 tracking-widest uppercase">Source / Hash</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {r.items?.length === 0 ? (
                                        <tr><td colSpan={5} className="py-8 px-6 text-center text-sm font-bold text-slate-400 dark:text-slate-500 italic">Mevcut kalem yok.</td></tr>
                                    ) : r.items?.map((item: any) => (
                                        <tr key={item.id} className="border-b border-light dark:border-white/5 hover:bg-slate-50/50 dark:hover:bg-white/[0.015]">
                                            <td className="py-4 px-6 text-xs font-black text-slate-600 dark:text-slate-400">{new Date(item.date).toLocaleString()}</td>
                                            <td className="py-4 px-6 text-sm font-black text-slate-800 dark:text-white">{item.description}</td>
                                            <td className="py-4 px-6 text-sm font-black text-red-500 dark:text-red-400 text-right">{Number(item.debit) > 0 ? Number(item.debit).toLocaleString() : ''}</td>
                                            <td className="py-4 px-6 text-sm font-black text-emerald-500 dark:text-emerald-400 text-right">{Number(item.credit) > 0 ? Number(item.credit).toLocaleString() : ''}</td>
                                            <td className="py-4 px-6 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{item.sourceType}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'DISPUTES' && (
                        <div className="p-6 md:p-8 flex flex-col gap-6">
                            {r.disputes?.length === 0 ? (
                                <div className="py-12 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 text-center gap-3">
                                    <div className="text-5xl opacity-50 grayscale">🕊️</div>
                                    <div className="text-sm font-bold max-w-sm">Açılmış itiraz kaydı yok. Müşteri belgeyi imzalama sürecinde veya ret işleminde bulunmamış.</div>
                                </div>
                            ) : (
                                r.disputes.map((d: any) => (
                                    <div key={d.id} className="p-6 bg-amber-50/50 dark:bg-amber-500/[0.02] border border-amber-200 dark:border-amber-500/20 rounded-2xl flex flex-col">
                                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4 pb-4 border-b border-amber-200/50 dark:border-amber-500/10">
                                            <div className="font-black text-amber-700 dark:text-amber-500 flex items-center gap-2">
                                                <span className="text-xl">⚖️</span>
                                                [#{d.id.substring(d.id.length - 6).toUpperCase()}] İtiraz Formu
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                {d.status === 'OPEN' && (
                                                    <>
                                                        <button onClick={() => handleUpdateDisputeStatus(d.id, 'RESOLVED')} disabled={!!processing} className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors border border-emerald-200 dark:border-emerald-500/20 disabled:opacity-50">✔ Çözüldü İşaretle</button>
                                                        <button onClick={() => handleUpdateDisputeStatus(d.id, 'REJECTED')} disabled={!!processing} className="px-3 py-1.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors border border-red-200 dark:border-red-500/20 disabled:opacity-50">✖ İtirazı Reddet</button>
                                                    </>
                                                )}
                                                <div className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest ${d.status === 'OPEN' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30' : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white border border-slate-200 dark:border-white/10'}`}>Durum: {d.status}</div>
                                            </div>
                                        </div>
                                        <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 leading-relaxed max-w-4xl whitespace-pre-wrap">
                                            {d.message || 'Detay girilmedi.'}
                                        </div>

                                        {d.internalNotes && (
                                            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-500/10 border-l-4 border-blue-500 rounded-r-xl text-sm font-semibold text-blue-800 dark:text-blue-300">
                                                <span className="block text-xs font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-2">İç Not (Opsiyonel):</span>
                                                {d.internalNotes}
                                            </div>
                                        )}

                                        {d.status === 'OPEN' && !d.internalNotes && (
                                            <div className="mt-6 flex flex-col sm:flex-row gap-3">
                                                <input
                                                    type="text"
                                                    placeholder="Sadece iç ekibin görebileceği not ekleyiniz..."
                                                    value={noteInputs[d.id] || ''}
                                                    onChange={e => setNoteInputs({ ...noteInputs, [d.id]: e.target.value })}
                                                    className="flex-1 w-full h-11 px-4 bg-white dark:bg-[#0b101a] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold focus:border-blue-500 dark:focus:border-blue-500 transition-colors outline-none"
                                                />
                                                <button onClick={() => handleSaveNote(d.id)} disabled={!noteInputs[d.id] || !!processing} className="h-11 px-6 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50 transition-colors">Kaydet</button>
                                            </div>
                                        )}

                                        <div className="mt-6 flex flex-wrap justify-between items-center gap-4 text-[11px] font-black tracking-widest uppercase text-slate-500 dark:text-slate-400">
                                            <span>Portal (Dış Müşteri) • {new Date(d.createdAt).toLocaleDateString()}{d.assigneeId ? ` • Sorumlu: ${d.assigneeId}` : ''}</span>
                                            {d.attachmentKey && (
                                                <button onClick={() => handleDownloadDisputeAttachment(d.id)} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-lg transition-colors border border-slate-200 dark:border-white/5">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                                    Ek Dosya (İndir)
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === 'AUDIT' && (
                        <div className="p-6 md:p-12">
                            <div className="border-l-2 border-slate-200 dark:border-white/10 pl-6 md:pl-8 flex flex-col gap-10">
                                {r.auditEvents?.map((ev: any, idx: number) => (
                                    <div key={ev.id} className="relative">
                                        <div className={`absolute -left-[27px] md:-left-[35px] top-0 w-3 h-3 md:w-4 md:h-4 rounded-full border-[3px] border-white dark:border-[#0f172a] ${idx === 0 ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1 flex items-center gap-2">
                                            {new Date(ev.createdAt).toLocaleString()} <span className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full"></span> <span className="text-blue-500 dark:text-blue-400">{ev.actorType}</span>
                                        </div>
                                        <div className={`text-sm font-black ${idx === 0 ? 'text-slate-800 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>{ev.action}</div>
                                        
                                        {ev.metaJson && Object.keys(ev.metaJson).length > 0 && (
                                            <div className="mt-3 p-4 bg-slate-50 dark:bg-[#0b101a]/50 border border-slate-200 dark:border-white/5 rounded-xl inline-block max-w-full overflow-x-auto shadow-inner">
                                                <pre className="m-0 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                                                    {JSON.stringify(ev.metaJson, null, 2)}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </EnterpriseCard>
            </div>
        </div>
    );
}
