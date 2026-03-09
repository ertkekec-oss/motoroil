"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function SignClient({ token, envelope, recipient, allRecipients }: { token: string; envelope: any; recipient: any; allRecipients: any[] }) {
    const [submitting, setSubmitting] = useState(false);
    const [showError, setShowError] = useState('');
    const [docUrl, setDocUrl] = useState('');
    const [loadingDoc, setLoadingDoc] = useState(false);
    const [hasViewed, setHasViewed] = useState(false);
    const [confirmModal, setConfirmModal] = useState<'SIGNED' | 'REJECTED' | 'REVISION_REQUESTED' | null>(null);
    const [revisionMessage, setRevisionMessage] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    // OTP State
    const [otpStep, setOtpStep] = useState(envelope.otpRequired ? 'PHONE' : 'VERIFIED'); // 'PHONE' -> 'CODE' -> 'VERIFIED'
    const [phone, setPhone] = useState(recipient.phone || '');
    const [code, setCode] = useState('');
    const [otpVerifiedToken, setOtpVerifiedToken] = useState('');
    const [otpLoading, setOtpLoading] = useState(false);

    const router = useRouter();

    useEffect(() => {
        const fetchDoc = async () => {
            setLoadingDoc(true);
            try {
                const res = await fetch(`/api/portal/signatures/document?token=${token}`);
                const data = await res.json();
                if (data.success && data.url) {
                    setDocUrl(data.url);
                } else {
                    setShowError(data.error || 'Belge yüklenemedi.');
                }
            } catch (err) {
                setShowError('Belge yüklenirken bağlantı hatası oluştu.');
            } finally {
                setLoadingDoc(false);
                setHasViewed(true); // Treat attempting to load as viewed
            }
        };

        if (token) fetchDoc();
    }, [token]);

    const executeAction = async (action: 'SIGNED' | 'REJECTED' | 'REVISION_REQUESTED') => {
        if (action === 'REVISION_REQUESTED' && !revisionMessage.trim()) {
            toast.error('Lütfen revize talebinizi yazınız.');
            return;
        }
        setConfirmModal(null);
        setSubmitting(true);
        try {
            const res = await fetch('/api/portal/signatures/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, action, otpVerifiedToken, message: action === 'REVISION_REQUESTED' ? revisionMessage : undefined })
            });
            const data = await res.json();
            if (data.success) {
                setIsSuccess(true);
                toast.success(action === 'SIGNED' ? 'Belge başarıyla imzalandı!' : action === 'REJECTED' ? 'Belge reddedildi.' : 'Revize talebiniz iletildi.', { duration: 3000 });
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                toast.error(data.error || 'Bilinmeyen bir hata oluştu');
            }
        } catch (error) {
            setShowError('Sunucu bağlantı hatası');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSendOtp = async () => {
        if (!phone) return setShowError('Lütfen telefon numaranızı giriniz.');
        setOtpLoading(true);
        setShowError('');
        try {
            const res = await fetch('/api/portal/signatures/otp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, phone })
            });
            const data = await res.json();
            if (data.success) {
                setOtpStep('CODE');
            } else {
                setShowError(data.error || 'OTP gönderilemedi.');
            }
        } catch (e) {
            setShowError('OTP iletişim hatası.');
        } finally {
            setOtpLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!code) return setShowError('Lütfen doğrulama kodunu giriniz.');
        setOtpLoading(true);
        setShowError('');
        try {
            const res = await fetch('/api/portal/signatures/otp/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, phone, code })
            });
            const data = await res.json();
            if (data.success) {
                setOtpVerifiedToken(data.verifiedToken);
                setOtpStep('VERIFIED');
            } else {
                setShowError(data.error || 'Doğrulama başarısız.');
            }
        } catch (e) {
            setShowError('OTP iletişim hatası.');
        } finally {
            setOtpLoading(false);
        }
    };

    // Serial signing constraint implementation
    const isCurrentSigner = () => {
        // Find if there are ANY pending signers with a LOWER order index than me.
        const pendingPrevious = allRecipients.find(r => r.orderIndex < recipient.orderIndex && r.status === 'PENDING');
        if (pendingPrevious) return false;

        // Find if ANY previous signers REJECTED. (If rejected, entire chain halts)
        const previousRejected = allRecipients.find(r => r.orderIndex < recipient.orderIndex && r.status === 'REJECTED');
        if (previousRejected) return false;

        return true;
    };

    const isActionable = recipient.status === 'PENDING' && envelope.status !== 'REJECTED' && envelope.status !== 'COMPLETED';
    const serialWait = !isCurrentSigner();

    return (
        <div className="bg-[#1e293b] shadow-2xl overflow-hidden sm:rounded-2xl border border-slate-700">
            <div className="px-5 py-5 sm:px-6 flex justify-between items-center bg-[#0f172a] border-b border-slate-700">
                <div>
                    <h3 className="text-xl leading-6 font-bold text-slate-100">Belge Özeti</h3>
                    <p className="mt-1 max-w-2xl text-sm text-slate-400">Bu alan Periodya Güvenli Doküman Ağı tarafından korunmaktadır.</p>
                </div>
                <div className="px-3 py-1 bg-blue-900/40 text-blue-400 font-bold rounded-lg text-sm border border-blue-800/50">
                    Sizin Rolünüz: {recipient.role}
                </div>
            </div>

            <div className="border-t border-slate-700 px-4 py-5 sm:p-0">
                <dl className="sm:divide-y sm:divide-slate-700">
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 bg-[#162032]">
                        <dt className="text-sm font-medium text-slate-400">Zarf Durumu</dt>
                        <dd className="mt-1 text-sm text-slate-100 sm:mt-0 sm:col-span-2 font-bold tracking-wide">
                            {envelope.status}
                        </dd>
                    </div>
                </dl>
            </div>

            <div className="p-6 bg-[#1e293b]">
                <h4 className="text-md font-bold mb-4 text-slate-200 uppercase tracking-wider text-xs">Onay / İmza Zinciri</h4>
                <div className="space-y-3">
                    {allRecipients.map((r, i) => (
                        <div key={r.id} className={`flex justify-between items-center p-4 border rounded-xl ${r.id === recipient.id ? 'border-blue-500/50 bg-blue-900/20' : 'border-slate-700 bg-[#0f172a]/50'}`}>
                            <div>
                                <div className="font-bold text-sm text-slate-200">
                                    {r.orderIndex}. {r.name} {r.id === recipient.id && <span className="text-blue-400"> (Siz)</span>}
                                </div>
                                <div className="text-xs text-slate-400 mt-1 font-medium">{r.role}</div>
                            </div>
                            <div className={`px-2 py-1 rounded text-xs font-bold ${r.status === 'SIGNED' ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-800/50' : r.status === 'REJECTED' ? 'bg-red-900/50 text-red-400 border border-red-800/50' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                                {r.status}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-[#0f172a] h-128 m-6 rounded-xl border border-slate-700 shadow-inner flex items-center justify-center flex-col overflow-hidden relative">
                {loadingDoc ? (
                    <div className="flex flex-col items-center justify-center p-12">
                        <div className="w-8 h-8 rounded-full border-4 border-t-blue-500 border-r-transparent border-b-blue-900 border-l-transparent animate-spin mb-4"></div>
                        <p className="text-slate-400 font-semibold mb-4 text-sm">Belge güvenli bağlantıdan çekiliyor...</p>
                    </div>
                ) : docUrl ? (
                    <iframe
                        src={`${docUrl}#toolbar=0`}
                        className="w-full h-[600px] border-none"
                        title="Document Preview"
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center p-12 text-center">
                        <div className="text-6xl mb-4 opacity-50">❌</div>
                        <p className="text-slate-400 font-semibold mb-4 text-sm">Önizleme başlatılamadı.</p>
                    </div>
                )}
            </div>

            {showError && (
                <div className="p-4 mx-6 mb-4 bg-red-900/30 border border-red-500/50 text-red-400 text-sm rounded-xl text-center font-bold">
                    {showError}
                </div>
            )}

            <div className="px-5 py-6 sm:px-6 bg-[#0f172a] border-t border-slate-700 text-center flex flex-col items-center rounded-b-2xl">
                {!isActionable ? (
                    <div className="text-emerald-400 font-bold p-4 bg-emerald-900/20 border border-emerald-800/50 rounded-xl w-full">
                        İşleminiz veya zarfın genel durumu tamamlandığından şu an aksiyon alınamıyor (Son Durumunuz: {recipient.status})
                    </div>
                ) : serialWait ? (
                    <div className="text-amber-400 font-bold p-4 bg-amber-900/20 shadow-sm border border-amber-800/50 rounded-xl w-full">
                        ⏳ Sıralı imza zincirinde bulunuyorsunuz. Sizden önceki imzacılar işlemlerini tamamlamadan onay veremezsiniz. Lütfen bekleyiniz.
                    </div>
                ) : isSuccess ? (
                    <div className="text-blue-400 font-bold p-4 bg-blue-900/20 shadow-sm border border-blue-800/50 rounded-xl w-full animate-pulse">
                        İşleminiz kaydediliyor, sayfa yenileniyor...
                    </div>
                ) : otpStep === 'PHONE' ? (
                    <div className="w-full flex flex-col items-center gap-4 max-w-sm mx-auto p-6 bg-[#1e293b] border border-slate-700 shadow-xl rounded-xl">
                        <div className="text-slate-100 font-bold mb-2">Cep Telefonu Doğrulaması</div>
                        <input
                            type="text"
                            className="w-full bg-[#0f172a] border border-slate-600 rounded-lg p-3 text-sm text-slate-100 focus:border-blue-500 focus:outline-none"
                            placeholder="Telefon (Örn: 905XXXXXXXXX)"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />
                        <button
                            disabled={otpLoading || !hasViewed}
                            onClick={handleSendOtp}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-lg w-full disabled:opacity-50 transition-colors"
                        >
                            {otpLoading ? 'Gönderiliyor...' : 'SMS Kodu Gönder'}
                        </button>
                    </div>
                ) : otpStep === 'CODE' ? (
                    <div className="w-full flex flex-col items-center gap-4 max-w-sm mx-auto p-6 bg-[#1e293b] border border-slate-700 shadow-xl rounded-xl">
                        <div className="text-slate-100 font-bold mb-2">Doğrulama Kodunu Giriniz</div>
                        <input
                            type="text"
                            className="w-full bg-[#0f172a] border border-slate-600 text-slate-100 rounded-lg p-3 text-center text-xl tracking-widest font-mono focus:border-blue-500 focus:outline-none placeholder-slate-600"
                            placeholder="••••••"
                            maxLength={6}
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                        />
                        <button
                            disabled={otpLoading}
                            onClick={handleVerifyOtp}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-lg w-full disabled:opacity-50 transition-colors"
                        >
                            {otpLoading ? 'Doğrulanıyor...' : 'Kodu Onayla'}
                        </button>
                    </div>
                ) : (
                    <div className="w-full flex justify-center gap-3">
                        <button
                            disabled={submitting || !hasViewed}
                            onClick={() => setConfirmModal('REJECTED')}
                            className="bg-[#1e293b] hover:bg-slate-800 text-red-500 font-semibold py-3 px-6 border border-slate-600 rounded-xl shadow-md disabled:opacity-50 transition-colors"
                        >
                            İptal / Reddet
                        </button>
                        <button
                            disabled={submitting || !hasViewed}
                            onClick={() => setConfirmModal('REVISION_REQUESTED')}
                            className="bg-[#1e293b] hover:bg-slate-800 text-amber-500 font-semibold py-3 px-6 border border-slate-600 rounded-xl shadow-md disabled:opacity-50 transition-colors"
                        >
                            Revize İste
                        </button>
                        <button
                            disabled={submitting || !hasViewed}
                            onClick={() => setConfirmModal('SIGNED')}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-10 rounded-xl shadow-md disabled:opacity-50 border border-blue-500 transition-colors"
                        >
                            {submitting ? 'İşleniyor...' : 'Kabul Et ve İmzala'}
                        </button>
                    </div>
                )}
            </div>

            {confirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-[#1e293b] border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                        <div className={`p-6 text-center ${confirmModal === 'SIGNED' ? 'bg-blue-900/20' : confirmModal === 'REJECTED' ? 'bg-red-900/20' : 'bg-amber-900/20'}`}>
                            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center shadow-inner mb-4 ${confirmModal === 'SIGNED' ? 'bg-blue-900/40 text-blue-400 border border-blue-800/50' : confirmModal === 'REJECTED' ? 'bg-red-900/40 text-red-400 border border-red-800/50' : 'bg-amber-900/40 text-amber-500 border border-amber-800/50'}`}>
                                <span className="text-3xl">{confirmModal === 'SIGNED' ? '✍️' : confirmModal === 'REJECTED' ? '❌' : '📝'}</span>
                            </div>
                            <h3 className="text-xl font-black text-slate-100 mb-2">
                                {confirmModal === 'SIGNED' ? 'Belgeyi İmzalıyorsunuz' : confirmModal === 'REJECTED' ? 'Belgeyi Reddediyorsunuz' : 'Revize İstiyorsunuz'}
                            </h3>
                            <p className="text-sm text-slate-400 font-medium tracking-tight">
                                {confirmModal === 'SIGNED'
                                    ? 'Bu işlem yasal olarak bağlayıcıdır ve elektronik imzanız yerine geçer.'
                                    : confirmModal === 'REJECTED' ? 'Reddedilen belgelerin imza zinciri tamamen iptal edilir.' : 'Belge üzerinde yapılmasını istediğiniz değişiklikleri aşağıda belirtebilirsiniz.'}
                            </p>
                        </div>
                        <div className="p-6 bg-[#0f172a] border-t border-slate-700">
                            {confirmModal === 'REVISION_REQUESTED' && (
                                <textarea
                                    className="w-full bg-[#1e293b] border border-slate-600 rounded-lg p-3 text-sm text-slate-100 mb-4 focus:border-amber-500 focus:outline-none placeholder-slate-500"
                                    rows={4}
                                    placeholder="Lütfen revize talebinizi detaylıca yazınız..."
                                    value={revisionMessage}
                                    onChange={e => setRevisionMessage(e.target.value)}
                                ></textarea>
                            )}
                            <p className="text-slate-400 mb-6 text-sm text-center font-semibold">
                                Devam etmek istediğinize emin misiniz?
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setConfirmModal(null)}
                                    className="flex-1 py-3 px-4 bg-[#1e293b] hover:bg-slate-700 border border-slate-600 text-slate-300 font-bold rounded-xl transition-colors"
                                    disabled={submitting}
                                >
                                    Vazgeç
                                </button>
                                <button
                                    onClick={() => executeAction(confirmModal)}
                                    className={`flex-1 py-3 px-4 text-white font-bold rounded-xl transition-colors ${confirmModal === 'SIGNED' ? 'bg-blue-600 hover:bg-blue-500 border border-blue-500' : 'bg-red-600 hover:bg-red-500 border border-red-500'}`}
                                    disabled={submitting}
                                >
                                    {submitting ? 'İşleniyor...' : 'Evet, Onaylıyorum'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
