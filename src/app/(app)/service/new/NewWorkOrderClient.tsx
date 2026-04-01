"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/contexts/AppContext';
import { useModal } from '@/contexts/ModalContext';
import { ChevronLeft, Check, Shield, Search, User, FileText, Wrench } from 'lucide-react';
import Link from 'next/link';

function NewWorkOrderContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { activeBranchName, activeTenantId } = useApp();
    const { showSuccess, showError } = useModal();

    const initialCustomerId = searchParams.get('customerId');
    const initialCustomerName = searchParams.get('customerName');

    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [customerId, setCustomerId] = useState<string>(initialCustomerId || '');
    const [customerName, setCustomerName] = useState<string>(initialCustomerName || '');
    const [assetId, setAssetId] = useState<string>('');
    const [complaint, setComplaint] = useState<string>('');
    const [assetBrand, setAssetBrand] = useState('Diğer');
    const [primaryIdentifier, setPrimaryIdentifier] = useState(''); // e.g. Plate or Serial No
    
    // Remote data
    const [assets, setAssets] = useState<any[]>([]);
    const [loadingAssets, setLoadingAssets] = useState(false);
    const [showNewAssetForm, setShowNewAssetForm] = useState(false);

    useEffect(() => {
        if (customerId) {
            fetchAssets(customerId);
        }
    }, [customerId]);

    const fetchAssets = async (id: string) => {
        setLoadingAssets(true);
        try {
            const res = await fetch(`/api/customers/${id}/assets`);
            if (res.ok) {
                const data = await res.json();
                setAssets(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingAssets(false);
        }
    };

    const handleCreateAsset = async () => {
        if (!primaryIdentifier) return;
        try {
            const res = await fetch(`/api/customers/${customerId}/assets`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ primaryIdentifier, brand: assetBrand })
            });
            if (res.ok) {
                const newAsset = await res.json();
                setAssets([newAsset, ...assets]);
                setAssetId(newAsset.id);
                setShowNewAssetForm(false);
            }
        } catch (e) {
            console.error(e);
            showError("Hata", "Cihaz kaydedilemedi.");
        }
    };

    const handleSubmit = async () => {
        if (!customerId || !complaint) {
            showError("Uyarı", "Lütfen müşteri ve şikayet alanlarını doldurun.");
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                customerId,
                assetId: assetId || undefined,
                complaint,
                branch: activeBranchName,
                status: 'PENDING'
            };

            const res = await fetch('/api/services/work-orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const data = await res.json();
                showSuccess("Başarılı", "İş emri başarıyla oluşturuldu.");
                router.push(`/service/${data.id}`);
            } else {
                const err = await res.json();
                showError("Hata", err.error || "İş emri kaydedilemedi.");
            }
        } catch (e) {
            showError("Hata", "Bağlantı hatası.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#F8FAFC] dark:bg-[#0B1220]">
            <div className="flex-shrink-0 border-b border-slate-200 dark:border-white/5 bg-white dark:bg-[#0B1220] z-10 sticky top-0 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/service" className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <div className="flex flex-col">
                        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                            Yeni Servis İş Emri
                        </h1>
                        <span className="text-[13px] font-medium text-slate-500 mt-1">
                            Adım {step}: {step === 1 ? 'Müşteri & Cihaz Seçimi' : 'Servis Detayları'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex-1 p-6 lg:p-10 max-w-[1000px] mx-auto w-full">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[24px] shadow-sm p-8">
                    {step === 1 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div>
                                <h3 className="text-[14px] font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <User className="w-4 h-4 text-blue-500" /> Müşteri Bilgileri
                                </h3>
                                {customerId ? (
                                    <div className="flex items-center justify-between p-4 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                                                {customerName.charAt(0)}
                                            </div>
                                            <div className="font-bold text-slate-900 dark:text-white">{customerName}</div>
                                        </div>
                                        {!initialCustomerId && (
                                            <button onClick={() => { setCustomerId(''); setCustomerName(''); setAssetId(''); }} className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
                                                Değiştir
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1 relative">
                                            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input type="text" placeholder="Müşteri Ara... (Telefon, İsim, Cari Kodu)" className="w-full h-12 pl-10 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/50 outline-none" />
                                        </div>
                                        <Link href="/customers/new" className="h-12 px-6 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-xl font-bold text-[13px] flex items-center justify-center">Yeni Müşteri</Link>
                                    </div>
                                )}
                            </div>

                            {customerId && (
                                <div className="pt-6 border-t border-slate-100 dark:border-white/5">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-[14px] font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                            <Shield className="w-4 h-4 text-emerald-500" /> Müşteriye Ait Varlıklar & Cihazlar
                                        </h3>
                                        {!showNewAssetForm && (
                                            <button onClick={() => setShowNewAssetForm(true)} className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-500/20">
                                                + Yeni Cihaz Sicili Ekle
                                            </button>
                                        )}
                                    </div>

                                    {showNewAssetForm && (
                                        <div className="mb-6 p-5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">Marka/Model</label>
                                                    <input type="text" value={assetBrand} onChange={e => setAssetBrand(e.target.value)} placeholder="Örn: Beko, Kuba, Honda..." className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none" />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">Seri No / Plaka / Şase No</label>
                                                    <input type="text" value={primaryIdentifier} onChange={e => setPrimaryIdentifier(e.target.value)} placeholder="Zorunlu identifier..." className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none" />
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-3">
                                                <button onClick={() => setShowNewAssetForm(false)} className="px-4 py-2 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700">İptal</button>
                                                <button onClick={handleCreateAsset} className="px-5 py-2 rounded-lg text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm">Kaydet & Seç</button>
                                            </div>
                                        </div>
                                    )}

                                    {loadingAssets ? (
                                        <div className="text-sm font-medium text-slate-500">Cihazlar yükleniyor...</div>
                                    ) : assets.length === 0 && !showNewAssetForm ? (
                                        <div className="text-sm font-medium text-slate-500 pb-4">Kayıtlı cihaz sicili bulunmuyor. Yeni iş emri oluştururken kayıt edebilirsiniz.</div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {assets.map(a => (
                                                <div 
                                                    key={a.id} 
                                                    onClick={() => setAssetId(a.id)}
                                                    className={`cursor-pointer p-4 rounded-xl border transition-all ${assetId === a.id ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <div className="font-bold text-slate-900 dark:text-white text-[14px]">{a.primaryIdentifier}</div>
                                                            <div className="text-xs text-slate-500 font-medium">{a.brand || 'Diğer Marka'} {a.model ? ` - ${a.model}` : ''}</div>
                                                        </div>
                                                        {assetId === a.id && <Check className="w-5 h-5 text-emerald-500" />}
                                                    </div>
                                                </div>
                                            ))}
                                            {/* Belirtmek İstemiyorum Seçeneği */}
                                            <div 
                                                onClick={() => setAssetId('')}
                                                className={`cursor-pointer p-4 rounded-xl border transition-all ${assetId === '' ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10' : 'border-slate-200 dark:border-white/10 hover:border-slate-300 hover:bg-slate-50'}`}
                                            >
                                                <div className="flex justify-between items-center h-full">
                                                    <div className="font-bold text-slate-700 dark:text-slate-300 text-[13px]">Cihaz Belirtme (Sadece Servis)</div>
                                                    {assetId === '' && <Check className="w-5 h-5 text-blue-500" />}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="pt-8 flex justify-end">
                                <button 
                                    disabled={!customerId}
                                    onClick={() => setStep(2)}
                                    className="h-12 px-8 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm tracking-wide transition-colors"
                                >
                                    İleri: Servis Detayları
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div>
                                <h3 className="text-[14px] font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-blue-500" /> Servis Ön Bilgileri & Şikayet
                                </h3>
                                <textarea
                                    value={complaint}
                                    onChange={e => setComplaint(e.target.value)}
                                    placeholder="Müşterinin şikayeti veya yapılacak servis işleminin detayı..."
                                    className="w-full h-32 p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/50 outline-none resize-y"
                                ></textarea>
                            </div>

                            <div className="pt-8 flex justify-between">
                                <button 
                                    onClick={() => setStep(1)}
                                    className="h-12 px-6 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm tracking-wide transition-colors"
                                >
                                    Geri Dön
                                </button>
                                <button 
                                    disabled={submitting || !complaint}
                                    onClick={handleSubmit}
                                    className="h-12 px-10 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm tracking-wide transition-all shadow-lg shadow-emerald-500/20"
                                >
                                    {submitting ? 'Oluşturuluyor...' : 'İş Emrini Başlat'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function NewWorkOrderClient() {
    return (
        <Suspense fallback={<div>Yükleniyor...</div>}>
            <NewWorkOrderContent />
        </Suspense>
    );
}
