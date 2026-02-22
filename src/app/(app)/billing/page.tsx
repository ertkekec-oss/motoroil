'use client';

import { useState, useEffect, Suspense } from 'react';
import { useModal } from '@/contexts/ModalContext';
import { useSearchParams } from 'next/navigation';
import {
    IconShield,
    IconZap,
    IconTrendingUp,
    IconCheck,
    IconClock,
    IconCreditCard,
    IconActivity,
    IconRefresh
} from '@/components/icons/PremiumIcons';

// UI Helper Components
const StatCard = ({ label, value, icon: Icon, color = "indigo" }: any) => {
    const colorClasses: any = {
        indigo: "bg-indigo-50 text-indigo-500",
        emerald: "bg-emerald-50 text-emerald-500",
        amber: "bg-amber-50 text-amber-500"
    };
    const activeColor = colorClasses[color] || colorClasses.indigo;

    return (
        <div className="bg-white border border-slate-100 p-5 rounded-2xl flex items-center gap-4 transition-all hover:shadow-lg hover:shadow-indigo-500/5 group shadow-sm">
            <div className={`w-12 h-12 rounded-xl ${activeColor.split(' ')[0]} flex items-center justify-center`}>
                <Icon className={`w-6 h-6 ${activeColor.split(' ')[1]} transition-transform group-hover:scale-110`} />
            </div>
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
                <p className="text-sm font-black text-slate-800">{value}</p>
            </div>
        </div>
    );
};

function BillingContent() {
    const [overview, setOverview] = useState<any>(null);
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [checkoutHtml, setCheckoutHtml] = useState<string | null>(null);
    const { showError, showSuccess } = useModal();
    const searchParams = useSearchParams();

    useEffect(() => {
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

    if (loading) return (
        <div className="p-12 space-y-8 animate-pulse bg-slate-50 min-h-screen">
            <div className="h-20 bg-white rounded-3xl w-full" />
            <div className="grid grid-cols-3 gap-8">
                <div className="h-96 bg-white rounded-3xl" />
                <div className="h-96 bg-white rounded-3xl" />
                <div className="h-96 bg-white rounded-3xl" />
            </div>
        </div>
    );

    if (!overview) return <div className="p-12 text-center text-red-500 font-bold">Abonelik bilgileri yüklenemedi.</div>;

    const currentPlanId = plans.find(p => p.name === overview?.planName)?.id;

    return (
        <div className="min-h-screen bg-[#f8fafc]">
            <div className="p-8 max-w-7xl mx-auto font-sans animate-in fade-in duration-1000">
                {/* Header section with refined light aesthetic */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6 bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-xl shadow-indigo-500/5">
                    <div>
                        <h1 className="text-4xl font-black text-slate-800 tracking-tighter mb-2">
                            Abonelik & <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-violet-500">Plan Yönetimi</span>
                        </h1>
                        <p className="text-slate-500 text-sm font-medium flex items-center gap-2">
                            <IconShield className="w-4 h-4 text-emerald-500" /> Kurumsal büyümeniz için optimize edilmiş esnek planlar.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="p-3 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
                            <IconRefresh className="w-5 h-5 text-slate-500" />
                        </button>
                        <div className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-lg shadow-indigo-500/20">
                            HIZLI YÜKSELT
                        </div>
                    </div>
                </div>

                {/* Status Grid - Light & Clean */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    <StatCard
                        label="Mevcut Paket"
                        value={overview?.planName}
                        icon={IconShield}
                        color="indigo"
                    />
                    <StatCard
                        label="Abonelik Durumu"
                        value={overview?.status === 'ACTIVE' ? 'Aktif' : 'Beklemede'}
                        icon={IconActivity}
                        color="emerald"
                    />
                    <StatCard
                        label="Yenileme Tarihi"
                        value={new Date(overview?.endDate).toLocaleDateString('tr-TR')}
                        icon={IconClock}
                        color="amber"
                    />
                    <div className="bg-white border border-slate-100 p-5 rounded-2xl flex flex-col justify-center gap-2 transition-all hover:shadow-lg hover:shadow-indigo-500/5 shadow-sm">
                        <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                            <span>Kota Kullanımı</span>
                            <span>%{overview?.limits?.monthly_documents?.percent || 0}</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                            <div
                                className={`h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-1000 ease-out`}
                                style={{ width: `${Math.min(overview?.limits?.monthly_documents?.percent || 0, 100)}%` }}
                            />
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 text-right uppercase">
                            {overview?.limits?.monthly_documents?.used} / {overview?.limits?.monthly_documents?.limit === -1 ? '∞' : overview?.limits?.monthly_documents?.limit} Fatura
                        </p>
                    </div>
                </div>

                {/* Iyzico Modal */}
                {checkoutHtml && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                        <div className="bg-white rounded-[3rem] p-10 max-w-xl w-full shadow-2xl relative overflow-hidden border border-white/20">
                            <button
                                onClick={() => setCheckoutHtml(null)}
                                className="absolute top-6 right-6 w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-all font-bold"
                            >
                                ✕
                            </button>
                            <div className="text-center mb-10">
                                <IconCreditCard className="w-12 h-12 text-indigo-500 mx-auto mb-4" />
                                <h2 className="text-3xl font-black text-slate-800">Güvenli Ödeme</h2>
                                <p className="text-slate-500 text-sm font-medium">Ödeme işleminiz Iyzico altyapısı ile güvendedir.</p>
                            </div>
                            <div id="iyzico-form-container" className="min-h-[450px]">
                                {/* Injected dynamically */}
                            </div>
                        </div>
                    </div>
                )}

                {/* Plans Section - Elevated Light Design */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {plans.map((plan: any) => {
                        const isRecommended = plan.id === overview?.recommendedPlanId;
                        const isCurrent = plan.id === currentPlanId;

                        return (
                            <div
                                key={plan.id}
                                className={`relative bg-white border-2 rounded-[3.5rem] p-10 transition-all duration-500 group flex flex-col ${isCurrent
                                    ? 'border-emerald-400 shadow-2xl shadow-emerald-500/5'
                                    : isRecommended
                                        ? 'border-indigo-400 shadow-2xl shadow-indigo-500/10 scale-[1.03]'
                                        : 'border-slate-100 hover:border-indigo-200 hover:shadow-2xl hover:shadow-slate-500/5'
                                    }`}
                            >
                                {isRecommended && (
                                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-6 py-2 bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-500/30">
                                        En Popüler Seçim 👑
                                    </div>
                                )}

                                {isCurrent && (
                                    <div className="absolute top-6 right-10 flex items-center gap-1 opacity-50">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Aktif Paket</span>
                                    </div>
                                )}

                                <div className="mb-10">
                                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-4">{plan.name}</h3>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-5xl font-black text-slate-800 tracking-tighter">₺{plan.price}</span>
                                        <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">/ {plan.interval === 'MONTHLY' ? 'ay' : 'yıl'}</span>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-12 flex-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Özellikler & Limitler</p>
                                    <ul className="space-y-4">
                                        {plan.features.map((f: any) => (
                                            <li key={f.key} className="flex items-center gap-3 text-sm text-slate-600 font-semibold group/item">
                                                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                                    <IconCheck className="w-3.5 h-3.5 text-emerald-600" />
                                                </div>
                                                <span className="group-hover/item:text-slate-800 transition-colors">{f.name}</span>
                                            </li>
                                        ))}
                                        {plan.limits.map((l: any) => (
                                            <li key={l.resource} className="flex items-center gap-3 text-sm text-slate-800 font-black">
                                                <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                                    <IconZap className="w-3.5 h-3.5 text-indigo-600" />
                                                </div>
                                                <span>
                                                    {l.resource === 'monthly_documents' ? `${l.limit === -1 ? 'Sınırsız' : l.limit} Fatura / Ay` :
                                                        l.resource === 'companies' ? `${l.limit} Firma Hizmeti` :
                                                            l.resource === 'users' ? `${l.limit} Ekip Üyesi` : `${l.limit} ${l.resource}`}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <button
                                    onClick={() => handlePlanSelect(plan.id)}
                                    disabled={isCurrent || isProcessing || overview?.planName === 'PLATFORM ADMIN'}
                                    className={`w-full py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest transition-all duration-300 ${isCurrent || overview?.planName === 'PLATFORM ADMIN'
                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                        : isRecommended
                                            ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 hover:-translate-y-1 active:scale-95'
                                            : 'bg-slate-800 text-white shadow-xl shadow-slate-900/10 hover:bg-slate-900 hover:-translate-y-1 active:scale-95'
                                        }`}
                                >
                                    {overview?.planName === 'PLATFORM ADMIN'
                                        ? 'Erişim Kısıtlanamaz'
                                        : (isCurrent
                                            ? 'Mevcut Paketiniz'
                                            : (isProcessing ? 'Sinyal Gönderiliyor...' : (isRecommended ? 'Hemen Yükselt' : 'Paketi Seç')))}
                                </button>
                            </div>
                        );
                    })}
                </div>

                {/* Footer FAQ placeholder / Support */}
                <div className="mt-24 text-center pb-12">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Daha fazla kapasiteye mi ihtiyacınız var?</p>
                    <button className="px-8 py-3 bg-white border border-slate-200 rounded-full text-[10px] font-black text-slate-700 hover:border-indigo-400 hover:text-indigo-600 transition-all uppercase tracking-widest">
                        Satış Ekibiyle Görüş (Kurumsal Çözümler)
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function BillingPage() {
    return (
        <Suspense fallback={<div className="p-12 text-center text-slate-400 font-bold animate-pulse">PERIODYA OS YÜKLENİYOR...</div>}>
            <BillingContent />
        </Suspense>
    );
}
