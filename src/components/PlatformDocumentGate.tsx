"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface PendingDocument {
    id: string;
    documentNo: string;
    title: string;
    contentType: 'PDF' | 'TEXT';
    fileKey: string | null;
    textContent: string | null;
    version: number;
    approvalMethod: 'CHECKBOX' | 'OTP';
    category: string;
}

interface PlatformDocumentGateProps {
    module: string;
    children: React.ReactNode;
}

export function PlatformDocumentGate({ module, children }: PlatformDocumentGateProps) {
    const [loading, setLoading] = useState(true);
    const [pendingDocs, setPendingDocs] = useState<PendingDocument[]>([]);
    const [currentDocIndex, setCurrentDocIndex] = useState(0);

    const [checked, setChecked] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [otpCode, setOtpCode] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const checkDocuments = async () => {
            try {
                const res = await fetch(`/api/platform-documents/pending?module=${module}`);
                if (!res.ok) {
                    setLoading(false);
                    return;
                }
                const data = await res.json();
                if (data.pending && data.pending.length > 0) {
                    setPendingDocs(data.pending);
                }
            } catch (e) {
                console.error("Failed to check platform documents", e);
            } finally {
                setLoading(false);
            }
        };

        checkDocuments();
    }, [module]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#0f172a]">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (pendingDocs.length === 0) {
        return <>{children}</>;
    }

    const currentDoc = pendingDocs[currentDocIndex];

    const handleSendOTP = () => {
        // In real app, call a real send-otp API. For now, simulate.
        toast.info("123456 sms kodu gönderildi (Simülasyon)");
        setOtpSent(true);
    };

    const handleApprove = async () => {
        if (currentDoc.approvalMethod === 'CHECKBOX' && !checked) {
            toast.error("İşleme devam etmek için onay kutucuğunu işaretlemelisiniz.");
            return;
        }

        if (currentDoc.approvalMethod === 'OTP' && otpCode.length !== 6) {
            toast.error("Lütfen geçerli bir 6 haneli OTP kodu girin (Simülasyon kodu: 123456).");
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch('/api/platform-documents/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    documentId: currentDoc.id,
                    version: currentDoc.version,
                    methodUsed: currentDoc.approvalMethod,
                    otpCode: currentDoc.approvalMethod === 'OTP' ? otpCode : undefined
                })
            });

            if (res.ok) {
                toast.success(`${currentDoc.documentNo} onaylandı.`);

                // Move to next doc or clear
                if (currentDocIndex + 1 < pendingDocs.length) {
                    setCurrentDocIndex(currentDocIndex + 1);
                    setChecked(false);
                    setOtpSent(false);
                    setOtpCode("");
                } else {
                    setPendingDocs([]);
                }
            } else {
                toast.error(await res.text());
            }
        } catch (e: any) {
            toast.error("Onay sırasında bir hata oluştu.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[99999] bg-[#0f172a] overflow-hidden flex flex-col">
            <div className="flex-none p-4 sm:p-6 border-b border-slate-700 bg-slate-900 flex justify-between items-center shadow-lg w-full">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-3">
                        <span className="bg-blue-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">
                            {currentDocIndex + 1}
                        </span>
                        Zorunlu Sözleşme / Form Onayı
                    </h2>
                    <p className="text-slate-400 text-sm mt-1 sm:ml-11">
                        Devam edebilmek için aşağıdaki yasal dokümanların yeni versiyonlarını inceleyip onaylamanız gerekmektedir.
                        ({pendingDocs.length} doküman kaldı)
                    </p>
                </div>
                <div className="text-right hidden sm:block">
                    <div className="text-xs text-slate-500 uppercase font-semibold">{currentDoc.documentNo} • Sürüm v{currentDoc.version}</div>
                    <div className="text-sm text-slate-300 font-bold max-w-xs truncate">{currentDoc.title}</div>
                </div>
            </div>

            <div className="flex-1 overflow-hidden p-4 sm:p-8 flex flex-col bg-[#1e293b]">
                <div className="flex-1 rounded-xl overflow-hidden border border-slate-700 bg-white flex flex-col items-center justify-center relative shadow-2xl">
                    {currentDoc.contentType === 'PDF' && currentDoc.fileKey ? (
                        <iframe
                            src={`https://periodya.s3.eu-central-1.amazonaws.com/${currentDoc.fileKey}#toolbar=0`}
                            className="w-full h-full border-none"
                            title="document-viewer"
                        />
                    ) : (
                        <div className="w-full h-full bg-slate-50 text-slate-900 p-8 overflow-y-auto font-sans leading-relaxed whitespace-pre-wrap">
                            <h3 className="text-2xl font-bold mb-6 text-center">{currentDoc.title}</h3>
                            {currentDoc.textContent}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-none bg-slate-900 p-6 border-t border-slate-700 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-10 w-full relative">
                <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex-1 w-full relative">
                        {currentDoc.approvalMethod === 'CHECKBOX' ? (
                            <label className="flex items-start gap-4 cursor-pointer group">
                                <div className="mt-1">
                                    <input
                                        type="checkbox"
                                        className="w-6 h-6 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        checked={checked}
                                        onChange={(e) => setChecked(e.target.checked)}
                                    />
                                </div>
                                <div className="text-sm">
                                    <span className="font-bold text-slate-200 block group-hover:text-blue-400 transition-colors">Yasal Uyarı ve Onay Beyanı</span>
                                    <span className="text-slate-400 mt-1 block leading-relaxed">Yukarıda gösterilen <strong>{currentDoc.title}</strong> (Sürüm {currentDoc.version}) dokümanını okuduğumu, içeriğini anladığımı ve sistem üzerinden kaydedilecek log kayıtları ile birlikte onayladığımı kabul, beyan ve taahhüt ederim.</span>
                                </div>
                            </label>
                        ) : (
                            <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-start p-4 bg-[#0f172a] rounded-xl border border-slate-700">
                                <div className="text-sm text-slate-300 flex-1">
                                    <span className="font-bold text-blue-400 block mb-1">Güvenlik Doğrulaması (SMS OTP) Gerekli</span>
                                    Yüksek güvenlik politikaları gereği SMS onayına ihtiyacımız var.
                                </div>
                                {!otpSent ? (
                                    <button
                                        onClick={handleSendOTP}
                                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg text-sm transition-colors border border-slate-600 shrink-0 shadow-md"
                                    >
                                        SMS Kodu Gönder
                                    </button>
                                ) : (
                                    <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                                        <input
                                            type="text"
                                            value={otpCode}
                                            onChange={(e) => setOtpCode(e.target.value)}
                                            placeholder="6 Haneli Kod"
                                            maxLength={6}
                                            className="w-32 px-3 py-2 bg-[#1e293b] border border-slate-600 rounded-lg text-white font-mono text-center tracking-widest text-lg focus:outline-none focus:border-blue-500"
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="shrink-0 flex items-center gap-4 w-full sm:w-auto">
                        <button
                            disabled={
                                submitting ||
                                (currentDoc.approvalMethod === 'CHECKBOX' && !checked) ||
                                (currentDoc.approvalMethod === 'OTP' && otpCode.length !== 6)
                            }
                            onClick={handleApprove}
                            className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-base transition-all shadow-xl
                                ${submitting ||
                                    (currentDoc.approvalMethod === 'CHECKBOX' && !checked) ||
                                    (currentDoc.approvalMethod === 'OTP' && otpCode.length !== 6)
                                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white hover:shadow-blue-500/25 border border-blue-500/30'
                                }
                            `}
                        >
                            {submitting ? 'Onaylanıyor...' : 'Kabul Ediyorum, Onayla'}
                        </button>
                    </div>
                </div>
            </div>
            {/* Download Button floating */}
            <a
                href={currentDoc.contentType === 'PDF' && currentDoc.fileKey ? `/api/admin/documents/${currentDoc.id}/download` : '#'}
                onClick={(e) => {
                    if (currentDoc.contentType !== 'PDF') {
                        e.preventDefault();
                        toast.info("Metin tabanlı dokümanlar sadece ekrandan incelenebilir.");
                    }
                }}
                target="_blank"
                rel="noreferrer"
                className="absolute top-6 right-6 lg:top-24 lg:right-12 z-50 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 font-medium py-2 px-4 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.5)] transition-all flex items-center gap-2 group"
                title="Şimdi Görüntüle / İndir"
            >
                <svg className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                <span className="text-xs hidden md:block">Belgenin Kopyasını İndir</span>
            </a>
        </div>
    );
}
