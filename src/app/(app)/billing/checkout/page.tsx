"use client";

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { EnterprisePageShell, EnterpriseCard, EnterpriseSectionHeader, EnterpriseButton, EnterpriseField, EnterpriseInput } from "@/components/ui/enterprise";
import { CreditCard, ShieldCheck, Lock, Verified } from 'lucide-react';

export default function CheckoutSimulationPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams?.get('token');
    const gateway = searchParams?.get('gateway') || 'IYZICO';

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [cardNo, setCardNo] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (!token) {
            router.push('/billing');
        }
    }, [token, router]);

    const handleSimulationPay = async () => {
        if (!cardNo || !expiry || !cvv || !name) {
            setError('Lütfen tüm kart bilgilerini doldurun (simülasyon).');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/billing/checkout/finalize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, provider: gateway })
            });
            const data = await res.json();
            if (data.success) {
                setSuccess(true);
                setTimeout(() => {
                    router.push('/billing');
                }, 3000);
            } else {
                setError(data.error || 'Ödeme tamamlanamadı.');
            }
        } catch (err: any) {
            setError('Sistem hatası: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <EnterprisePageShell>
                <div className="max-w-2xl mx-auto py-20 animate-slide-up flex flex-col items-center justify-center text-center">
                    <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-xl animate-scale-in">
                        <Verified className="w-12 h-12" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Ödeme Başarılı!</h1>
                    <p className="text-slate-500 text-lg">Paketleriniz ve kredileriniz hesabınıza tanımlandı. Yönlendiriliyorsunuz...</p>
                </div>
            </EnterprisePageShell>
        );
    }

    return (
        <EnterprisePageShell
            title="Güvenli Ödeme Ekranı"
            description="Lütfen ödemeyi tamamlamak için kredi kartı bilgilerinizi giriniz. Altyapı: 256-bit SSL Koruyuculu."
        >
            <div className="max-w-3xl mx-auto relative animate-fade-in pb-20 mt-4">

                <div className="flex gap-4 items-center bg-blue-50 dark:bg-blue-900/10 p-4 border border-blue-100 dark:border-blue-900/30 rounded-xl mb-8">
                    <ShieldCheck className="w-10 h-10 text-blue-600 dark:text-blue-500" />
                    <div>
                        <h4 className="font-bold text-blue-900 dark:text-blue-400">Güvenli {gateway} Simülasyonu</h4>
                        <p className="text-sm text-blue-700 dark:text-blue-500 opacity-80">
                            Bu ekran test modundadır ({token}). Lütfen rastgele asılsız kart bilgisi girerek "Bakiye Çek" butonuna basınız.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                    <div className="md:col-span-3 space-y-6">
                        <EnterpriseCard className="p-8">
                            <EnterpriseSectionHeader title="Kredi / Banka Kartı Bilgileri" icon={<CreditCard />} />

                            {error && (
                                <div className="bg-rose-50 text-rose-600 border border-rose-200 p-3 rounded-lg text-sm font-semibold mb-6">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-5">
                                <EnterpriseInput
                                    label="KART ÜZERİNDEKİ İSİM"
                                    placeholder="AD SOYAD"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                />
                                <EnterpriseInput
                                    label="KART NUMARASI"
                                    placeholder="0000 0000 0000 0000"
                                    value={cardNo}
                                    onChange={e => setCardNo(e.target.value)}
                                    maxLength={16}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <EnterpriseInput
                                        label="SON KULLANMA TARİHİ"
                                        placeholder="AA/YY"
                                        value={expiry}
                                        onChange={e => setExpiry(e.target.value)}
                                        maxLength={5}
                                    />
                                    <EnterpriseInput
                                        label="GÜVENLİK KODU (CVV)"
                                        type="password"
                                        placeholder="•••"
                                        value={cvv}
                                        onChange={e => setCvv(e.target.value)}
                                        maxLength={3}
                                    />
                                </div>

                                <div className="pt-6">
                                    <EnterpriseButton
                                        onClick={handleSimulationPay}
                                        className="w-full h-14 text-lg"
                                        disabled={loading}
                                    >
                                        <Lock className="w-5 h-5" />
                                        {loading ? 'İşleniyor, Lütfen Bekleyin...' : 'Güvenli Ödeme Çek & Tamamla'}
                                    </EnterpriseButton>
                                    <p className="text-center text-xs font-semibold text-slate-400 mt-4 tracking-wider flex items-center justify-center gap-1.5 uppercase">
                                        <Lock className="w-3 h-3" /> PCI-DSS Uyumlu Ödeme Altyapısı
                                    </p>
                                </div>
                            </div>
                        </EnterpriseCard>
                    </div>

                    <div className="md:col-span-2 space-y-6">
                        <EnterpriseCard className="p-6 bg-slate-50 dark:bg-slate-900 border-none relative overflow-hidden">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">Sipariş Özeti</h3>

                            <div className="flex border-b border-slate-200 dark:border-slate-800 pb-4 mb-4 items-center justify-between">
                                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Altyapı Gateway</span>
                                <span className="font-bold text-slate-900 dark:text-white uppercase">{gateway}</span>
                            </div>

                            <div className="flex border-b border-slate-200 dark:border-slate-800 pb-4 mb-4 items-center justify-between">
                                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Bağlantı Token</span>
                                <span className="text-xs font-mono text-slate-500 truncate max-w-[120px]">{token?.split('-')[1]}</span>
                            </div>

                            <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-4 rounded-xl mt-6 shadow-sm">
                                <div className="flex items-center justify-center gap-2 mb-2 text-emerald-600 text-[10px] font-bold uppercase tracking-wider">
                                    <Verified className="w-3 h-3" /> 256-Bit SSL Şifreleme Aktif
                                </div>
                                <p className="text-center text-xs text-slate-400">
                                    Tüm bilgileriniz bankanız ({gateway}) ve cihazınız arasında donanım tabanlı özel kriptografik şifreleme altındadır.
                                </p>
                            </div>
                        </EnterpriseCard>
                    </div>
                </div>
            </div>
        </EnterprisePageShell>
    );
}
