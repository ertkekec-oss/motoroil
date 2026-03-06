"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SignClient({ token, envelope, recipient, allRecipients }: { token: string; envelope: any; recipient: any; allRecipients: any[] }) {
    const [submitting, setSubmitting] = useState(false);
    const [showError, setShowError] = useState('');
    const [docUrl, setDocUrl] = useState('');
    const [loadingDoc, setLoadingDoc] = useState(false);
    const [hasViewed, setHasViewed] = useState(false);

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

    const handleAction = async (action: 'SIGNED' | 'REJECTED') => {
        if (!confirm(`Belgeyi ${action === 'SIGNED' ? 'imzalamak (onaylamak)' : 'reddetmek'} istediğinize emin misiniz?`)) return;

        setSubmitting(true);
        try {
            const res = await fetch('/api/portal/signatures/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, action, otpVerifiedToken })
            });
            const data = await res.json();
            if (data.success) {
                alert(`İşlem başarıyla alındı. Yeni Zarf Durumu: ${data.newStatus}`);
                router.refresh();
            } else {
                setShowError(data.error || 'Bilinmeyen bir hata oluştu');
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
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-200">
                <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Belge Özeti</h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">Bu alan Periodya Güvenli Doküman Ağı tarafından korunmaktadır.</p>
                </div>
                <div className="px-3 py-1 bg-blue-50 text-blue-700 font-bold rounded-lg text-sm border border-blue-200">
                    Sizin Rolünüz: {recipient.role}
                </div>
            </div>

            <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                <dl className="sm:divide-y sm:divide-gray-200">
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 bg-gray-50">
                        <dt className="text-sm font-medium text-gray-500">Zarf Durumu</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 font-semibold">
                            {envelope.status}
                        </dd>
                    </div>
                </dl>
            </div>

            <div className="p-6">
                <h4 className="text-md font-bold mb-4">Onay/İmza Zinciri</h4>
                <div className="space-y-4">
                    {allRecipients.map((r, i) => (
                        <div key={r.id} className={`flex justify-between items-center p-4 border rounded-xl ${r.id === recipient.id ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-white'}`}>
                            <div>
                                <div className="font-semibold text-sm">
                                    {r.orderIndex}. {r.name} {r.id === recipient.id && " (Siz)"}
                                </div>
                                <div className="text-xs text-gray-500">{r.role}</div>
                            </div>
                            <div className={`px-2 py-1 rounded text-xs font-bold ${r.status === 'SIGNED' ? 'bg-green-100 text-green-700' : r.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                                {r.status}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-gray-100 h-128 m-6 rounded-xl border border-gray-300 flex items-center justify-center flex-col overflow-hidden relative">
                {loadingDoc ? (
                    <div className="flex flex-col items-center justify-center p-12">
                        <div className="w-8 h-8 rounded-full border-4 border-t-blue-500 border-r-transparent border-b-blue-200 border-l-transparent animate-spin mb-4"></div>
                        <p className="text-gray-500 font-semibold mb-4 text-sm">Belge güvenli bağlantıdan çekiliyor...</p>
                    </div>
                ) : docUrl ? (
                    <iframe
                        src={`${docUrl}#toolbar=0`}
                        className="w-full h-[600px] border-none"
                        title="Document Preview"
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center p-12 text-center">
                        <div className="text-6xl mb-4">❌</div>
                        <p className="text-gray-500 font-semibold mb-4 text-sm">Önizleme başlatılamadı.</p>
                    </div>
                )}
            </div>

            {showError && (
                <div className="p-4 mx-6 mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg text-center font-bold">
                    {showError}
                </div>
            )}

            <div className="px-4 py-5 sm:px-6 bg-gray-50 border-t border-gray-200 text-center flex flex-col items-center">
                {!isActionable ? (
                    <div className="text-green-600 font-bold p-4 bg-white shadow-sm border rounded-xl w-full">
                        İşleminiz veya zarfın genel durumu tamamlandığından şu an aksiyon alınamıyor (Son Durumunuz: {recipient.status})
                    </div>
                ) : serialWait ? (
                    <div className="text-amber-600 font-bold p-4 bg-amber-50 shadow-sm border border-amber-200 rounded-xl w-full">
                        ⏳ Sıralı imza zincirinde bulunuyorsunuz. Sizden önceki imzacılar işlemlerini tamamlamadan onay veremezsiniz. Lütfen bekleyiniz.
                    </div>
                ) : otpStep === 'PHONE' ? (
                    <div className="w-full flex flex-col items-center gap-4 max-w-sm mx-auto p-6 bg-white border border-gray-200 shadow-sm rounded-xl">
                        <div className="text-gray-800 font-bold mb-2">Cep Telefonu Doğrulaması</div>
                        <input
                            type="text"
                            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:border-blue-500 focus:outline-none"
                            placeholder="Telefon (Örn: 905XXXXXXXXX)"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />
                        <button
                            disabled={otpLoading || !hasViewed}
                            onClick={handleSendOtp}
                            className="bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 px-6 rounded-lg w-full disabled:opacity-50"
                        >
                            {otpLoading ? 'Gönderiliyor...' : 'SMS Kodu Gönder'}
                        </button>
                    </div>
                ) : otpStep === 'CODE' ? (
                    <div className="w-full flex flex-col items-center gap-4 max-w-sm mx-auto p-6 bg-white border border-gray-200 shadow-sm rounded-xl">
                        <div className="text-gray-800 font-bold mb-2">Doğrulama Kodunu Giriniz</div>
                        <input
                            type="text"
                            className="w-full border border-gray-300 rounded-lg p-3 text-center text-xl tracking-widest font-mono focus:border-blue-500 focus:outline-none"
                            placeholder="••••••"
                            maxLength={6}
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                        />
                        <button
                            disabled={otpLoading}
                            onClick={handleVerifyOtp}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg w-full disabled:opacity-50"
                        >
                            {otpLoading ? 'Doğrulanıyor...' : 'Kodu Onayla'}
                        </button>
                    </div>
                ) : (
                    <div className="w-full flex justify-center gap-4">
                        <button
                            disabled={submitting || !hasViewed}
                            onClick={() => handleAction('REJECTED')}
                            className="bg-white hover:bg-red-50 text-red-600 font-semibold py-3 px-8 border border-red-200 rounded-xl shadow-sm disabled:opacity-50"
                        >
                            İptal / Reddet
                        </button>
                        <button
                            disabled={submitting || !hasViewed}
                            onClick={() => handleAction('SIGNED')}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-12 rounded-xl shadow-sm disabled:opacity-50"
                        >
                            {submitting ? 'İşleniyor...' : 'Kabul Et ve İmzala'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
