
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useModal } from '@/contexts/ModalContext';
import { useSearchParams } from 'next/navigation';

function BillingContent() {
    const [overview, setOverview] = useState<any>(null);
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [checkoutHtml, setCheckoutHtml] = useState<string | null>(null);
    const { showError, showSuccess } = useModal();
    const searchParams = useSearchParams();

    useEffect(() => {
        // Success/Error check from URL
        const success = searchParams.get('success');
        const error = searchParams.get('error');
        const msg = searchParams.get('msg');

        if (success) {
            showSuccess('Başarılı', 'Ödemeniz alındı ve aboneliğiniz güncellendi. Teşekkürler!');
        } else if (error) {
            showError('Hata', msg || 'Ödeme işlemi sırasında bir sorun oluştu.');
        }

        const fetchData = async () => {
            try {
                const [ovRes, plansRes] = await Promise.all([
                    fetch('/api/billing/overview'),
                    fetch('/api/billing/plans')
                ]);
                const ovData = await ovRes.json();
                const plansData = await plansRes.json();

                if (ovData.error) throw new Error(ovData.error);

                setOverview(ovData);
                setPlans(Array.isArray(plansData) ? plansData : (plansData.plans || []));
            } catch (err: any) {
                showError('Hata', 'Bilgiler yüklenemedi: ' + err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handlePlanSelect = async (planId: string) => {
        setIsProcessing(true);
        setCheckoutHtml(null);
        try {
            const res = await fetch('/api/billing/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId })
            });
            const data = await res.json();

            if (data.success && data.checkoutFormContent) {
                setCheckoutHtml(data.checkoutFormContent);
                // Iyzico scriptini çalıştırmak için script taglerini manuel execute etmemiz gerekebilir
                // veya dangerouslySetInnerHTML yeterli olabilir.
                // Iyzico content'i genelde bir <script> ve bir <div> içerir.
            } else {
                showError('Ödeme Hatası', data.error || 'Ödeme formu başlatılamadı.');
            }
        } catch (err: any) {
            console.error('Plan selection error:', err);
            showError('Hata', 'Sistem hatası: ' + err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    // Scriptleri execute etmek için bir useEffect
    useEffect(() => {
        if (checkoutHtml) {
            const container = document.getElementById('iyzico-form-container');
            if (container) {
                const range = document.createRange();
                const documentFragment = range.createContextualFragment(checkoutHtml);
                container.innerHTML = '';
                container.appendChild(documentFragment);
            }
        }
    }, [checkoutHtml]);

    if (loading) return <div className="p-8 text-center">Yükleniyor...</div>;
    if (!overview) return <div className="p-8 text-center text-red-500 font-bold">Abonelik bilgileri yüklenemedi. Lütfen yönetici ile iletişime geçin.</div>;

    const currentPlanId = plans.find(p => p.name === overview?.planName)?.id;

    return (
        <div className="p-8 max-w-6xl mx-auto font-sans bg-slate-50 min-h-screen">
            <div className="mb-10 text-center">
                <h1 className="text-4xl font-black text-slate-900 mb-2">Abonelik ve Plan Yönetimi</h1>
                <p className="text-slate-500">Hesabınızı büyütün, limitlerinizi artırın.</p>
            </div>

            {/* Current Status */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-10 flex flex-wrap items-center justify-between gap-6">
                <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Mevcut Planınız</div>
                    <div className="flex items-center gap-3">
                        <span className="text-2xl font-black text-slate-900">{overview?.planName}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${overview?.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                            overview?.status === 'TRIAL' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                            }`}>
                            {overview?.status === 'ACTIVE' ? 'Aktif' : overview?.status === 'TRIAL' ? 'Deneme Süresi' : 'Ödeme Gerekli'}
                        </span>
                    </div>
                </div>

                <div className="h-12 w-px bg-slate-100 hidden md:block" />

                <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Kalan Süre</div>
                    <div className="text-lg font-bold text-slate-700">
                        {new Date(overview?.endDate).toLocaleDateString('tr-TR')} tarihinde sona eriyor
                    </div>
                </div>

                <div className="h-12 w-px bg-slate-100 hidden md:block" />

                <div className="flex-1 min-w-[200px]">
                    <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                        <span>Aylık Fatura Kotası</span>
                        <span>{overview?.limits?.monthly_documents?.used} / {overview?.limits?.monthly_documents?.limit === -1 ? '∞' : overview?.limits?.monthly_documents?.limit}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-500 ${overview?.limits?.monthly_documents?.percent > 90 ? 'bg-red-500' : 'bg-orange-500'}`}
                            style={{ width: `${Math.min(overview?.limits?.monthly_documents?.percent, 100)}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Iyzico Form Modal (if active) */}
            {checkoutHtml && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative overflow-hidden">
                        <button
                            onClick={() => setCheckoutHtml(null)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2"
                        >
                            ✕
                        </button>
                        <h2 className="text-2xl font-black text-slate-900 mb-6 text-center">Güvenli Ödeme</h2>
                        <div id="iyzico-form-container" className="min-h-[400px]">
                            {/* Iyzico Form will be injected here */}
                        </div>
                    </div>
                </div>
            )}

            {/* Plans Card Row */}
            <div className="grid md:grid-cols-3 gap-8">
                {plans.map((plan: any) => {
                    const isRecommended = plan.id === overview?.recommendedPlanId;
                    const isCurrent = plan.id === currentPlanId;

                    return (
                        <div
                            key={plan.id}
                            className={`bg-white rounded-3xl p-8 border-2 transition-all duration-300 flex flex-col relative ${isCurrent ? 'border-orange-500 ring-4 ring-orange-500/10' :
                                isRecommended ? 'border-blue-500 ring-4 ring-blue-500/10 scale-[1.02]' : 'border-transparent hover:border-slate-200'
                                } shadow-lg`}
                        >
                            {isRecommended && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-xs font-black shadow-lg animate-bounce">
                                    🚀 SİZİN İÇİN ÖNERİLEN
                                </div>
                            )}

                            <div className="mb-6">
                                <h3 className="text-xl font-black text-slate-900 mb-2">{plan.name}</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-black text-slate-900">{plan.price}</span>
                                    <span className="text-slate-500 font-bold">{plan.currency} / {plan.interval === 'MONTHLY' ? 'ay' : 'yıl'}</span>
                                </div>
                            </div>

                            <ul className="space-y-4 mb-8 flex-1">
                                {plan.features.map((f: any) => (
                                    <li key={f.key} className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                                        <span className="text-green-500 text-lg">✓</span>
                                        {f.name}
                                    </li>
                                ))}
                                {plan.limits.map((l: any) => (
                                    <li key={l.resource} className="flex items-center gap-3 text-sm text-slate-800 font-bold">
                                        <span className="text-orange-500 text-lg">⚡</span>
                                        {l.resource === 'monthly_documents' ? `${l.limit === -1 ? 'Sınırsız' : l.limit} Fatura / Ay` :
                                            l.resource === 'companies' ? `${l.limit} Firma` :
                                                l.resource === 'users' ? `${l.limit} Kullanıcı` : `${l.limit} ${l.resource}`}
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => handlePlanSelect(plan.id)}
                                disabled={isCurrent || isProcessing || overview?.planName === 'PLATFORM ADMIN'}
                                className={`w-full py-4 rounded-2xl font-black text-lg transition-all ${isCurrent || overview?.planName === 'PLATFORM ADMIN'
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    : isRecommended ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-xl active:scale-95'
                                        : 'bg-slate-900 text-white hover:bg-black hover:shadow-xl active:scale-95'
                                    }`}
                            >
                                {overview?.planName === 'PLATFORM ADMIN' ? 'Sınırsız Erişim' : (isCurrent ? 'Mevcut Paketiniz' : (isProcessing ? 'Hazırlanıyor...' : (isRecommended ? 'Hemen Yükselt' : 'Seç')))}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function BillingPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center">Yükleniyor...</div>}>
            <BillingContent />
        </Suspense>
    );
}
