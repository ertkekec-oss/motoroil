"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/contexts/AppContext';
import { useCRM } from '@/contexts/CRMContext';
import { useModal } from '@/contexts/ModalContext';
import { ChevronLeft, Check, Shield, Search, User, FileText, Wrench, Plus, X } from 'lucide-react';
import Link from 'next/link';

function NewWorkOrderContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { activeBranchName, activeTenantId } = useApp();
    const { customers } = useCRM();
    const { showSuccess, showError } = useModal();

    const initialCustomerId = searchParams.get('customerId');
    const initialCustomerName = searchParams.get('customerName');

    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [customerId, setCustomerId] = useState<string>(initialCustomerId || '');
    const [customerName, setCustomerName] = useState<string>(initialCustomerName || '');
    const [searchQuery, setSearchQuery] = useState('');
    const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
    const [newCustomerName, setNewCustomerName] = useState('');
    const [newCustomerPhone, setNewCustomerPhone] = useState('');
    
    const [assetId, setAssetId] = useState<string>('');
    const [complaint, setComplaint] = useState<string>('');
    const [assetBrand, setAssetBrand] = useState('Diğer');
    const [primaryIdentifier, setPrimaryIdentifier] = useState(''); // e.g. Plate or Serial No
    const [currentKm, setCurrentKm] = useState<string>('');
    const [productionYear, setProductionYear] = useState<string>('');
    const [chassisNo, setChassisNo] = useState<string>('');
    
    // Remote data
    const [assets, setAssets] = useState<any[]>([]);
    const [warranties, setWarranties] = useState<any[]>([]);
    const [purchases, setPurchases] = useState<any[]>([]);
    const [loadingAssets, setLoadingAssets] = useState(false);
    const [loadingExtra, setLoadingExtra] = useState(false);
    
    // Asset UI Tabs
    const [assetTab, setAssetTab] = useState<'registered' | 'warranties' | 'purchases' | 'external'>('registered');


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

    const fetchExtraData = async (type: 'warranties' | 'purchases') => {
        setLoadingExtra(true);
        try {
            const res = await fetch(`/api/customers/${customerId}/${type === 'warranties' ? 'warranties' : 'purchased-products'}`);
            if (res.ok) {
                const data = await res.json();
                if (type === 'warranties') setWarranties(data);
                else setPurchases(data);
            }
        } catch(e) {
            console.error(e);
        } finally {
            setLoadingExtra(false);
        }
    };

    useEffect(() => {
        if (!customerId) return;
        if (assetTab === 'warranties' && warranties.length === 0) fetchExtraData('warranties');
        if (assetTab === 'purchases' && purchases.length === 0) fetchExtraData('purchases');
    }, [assetTab, customerId]);

    useEffect(() => {
        const selected = assets.find(a => a.id === assetId);
        if (selected) {
            setCurrentKm(selected.metadata?.currentKm?.toString() || '');
            setProductionYear(selected.productionYear?.toString() || '');
            setChassisNo(selected.secondaryIdentifier || '');
        } else {
            setCurrentKm(''); setProductionYear(''); setChassisNo('');
        }
    }, [assetId, assets]);


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
                setAssetTab('registered');
            }
        } catch (e) {
            console.error(e);
            showError("Hata", "Cihaz kaydedilemedi.");
        }
    };

    const handleCreateCustomer = async () => {
        if (!newCustomerName) return;
        setSubmitting(true);
        try {
            const res = await fetch('/api/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newCustomerName, phone: newCustomerPhone, branch: activeBranchName })
            });
            const data = await res.json();
            if (data.success && data.customer) { 
                const id = data.customer.id || data.id;
                if (id) {
                    setCustomerId(id);
                    setCustomerName(newCustomerName);
                    setShowNewCustomerForm(false);
                    setAssetTab('registered');
                    showSuccess("Başarılı", "Müşteri oluşturuldu.");
                }
            } else {
                showError("Hata", data.error || "Müşteri oluşturulamadı.");
            }
        } catch (e) {
            console.error(e);
            showError("Hata", "Müşteri oluşturulamadı.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleAutoCreateAndSelectAsset = async (item: any, type: 'warranty' | 'purchase') => {
        const payload = {
            primaryIdentifier: type === 'warranty' ? item.serialNo : `Fatura: ${item.invoiceNo}`,
            secondaryIdentifier: type === 'warranty' ? item.invoiceNo : null,
            brand: type === 'warranty' ? item.productName : item.productName,
            model: 'Otomatik Kayıt',
            metadata: { sourceId: item.id, sourceType: type }
        };

        setSubmitting(true);
        try {
            const res = await fetch(`/api/customers/${customerId}/assets`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                const newAsset = await res.json();
                setAssets(prev => [newAsset, ...prev]);
                setAssetId(newAsset.id);
                showSuccess("Seçildi", "Cihaz sicili otomatik oluşturuldu ve servis kartına bağlandı.");
                setAssetTab('registered'); // Go back to registered tab automatically
            } else {
                showError("Hata", "Otomatik cihaz kaydı başarısız oldu.");
            }
        } catch (e) {
            console.error(e);
            showError("Hata", "Otomatik cihaz kaydı başarısız oldu.");
        } finally {
            setSubmitting(false);
        }
    };

    const filteredCustomers = searchQuery.length > 1 
        ? customers.filter((c: any) => 
            (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
            (c.phone || '').includes(searchQuery)
          ).slice(0, 5)
        : [];

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
                status: 'PENDING',
                currentKm,
                chassisNo,
                productionYear
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
            <div className="flex-shrink-0 border-b border-slate-200 dark:border-white/5 bg-white dark:bg-[#0B1220] z-10 sticky top-0 px-4 sm:px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3 sm:gap-4">
                    <Link href="/service" className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <div className="flex flex-col min-w-0">
                        <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-none truncate">
                            Yeni Servis İş Emri
                        </h1>
                        <span className="text-[11px] sm:text-[13px] font-medium text-slate-500 mt-1 truncate">
                            Adım {step}: {step === 1 ? 'Müşteri & Cihaz Seçimi' : 'Servis Detayları'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex-1 p-4 sm:p-6 lg:p-10 max-w-[1400px] mx-auto w-full">
                <div className="space-y-8">
                    {step === 1 && (
                        <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div>
                                <h3 className="text-[13px] sm:text-[14px] font-bold text-slate-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
                                    <User className="w-4 h-4 text-blue-500" /> Müşteri Bilgileri
                                </h3>
                                {customerId ? (
                                    <div className="flex items-start sm:items-center justify-between p-3 sm:p-4 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
                                                {customerName.charAt(0)}
                                            </div>
                                            <div className="font-bold text-slate-900 dark:text-white text-[14px] sm:text-base">{customerName}</div>
                                        </div>
                                        {!initialCustomerId && (
                                            <button onClick={() => { setCustomerId(''); setCustomerName(''); setAssetId(''); }} className="text-[11px] sm:text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline mt-1 sm:mt-0 px-2">
                                                Değiştir
                                            </button>
                                        )}
                                    </div>
                                ) : showNewCustomerForm ? (
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-white/10 space-y-4 animate-in fade-in slide-in-from-top-2">
                                        <div className="flex justify-between items-center bg-transparent">
                                            <h4 className="text-[13px] font-bold text-slate-900 dark:text-white flex items-center gap-2"><Plus className="w-4 h-4"/>Hızlı Müşteri Ekle</h4>
                                            <button onClick={() => setShowNewCustomerForm(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-transparent"><X className="w-4 h-4"/></button>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">Ad Soyad / Unvan *</label>
                                                <input type="text" value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)} className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500/50 outline-none" />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">Telefon Numarası</label>
                                                <input type="text" value={newCustomerPhone} onChange={e => setNewCustomerPhone(e.target.value)} className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500/50 outline-none" />
                                            </div>
                                        </div>
                                        <div className="flex justify-end pt-2">
                                            <button onClick={handleCreateCustomer} disabled={submitting || !newCustomerName} className="h-10 px-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-bold text-[12px] flex items-center justify-center transition-colors">
                                                {submitting ? 'Kaydediliyor...' : 'Kaydet ve Seç'}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-3 sm:gap-4 relative">
                                        <div className="flex-1 relative">
                                            <div className="relative">
                                                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input 
                                                    type="text" 
                                                    value={searchQuery}
                                                    onChange={e => setSearchQuery(e.target.value)}
                                                    placeholder="Müşteri Ara... (Telefon, İsim, Cari Kodu)" 
                                                    className="w-full h-12 pl-10 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-[13px] sm:text-sm font-medium focus:ring-2 focus:ring-blue-500/50 outline-none" 
                                                />
                                            </div>
                                            
                                            {/* Autocomplete Dropdown */}
                                            {searchQuery.length > 1 && (
                                                <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                                                    {filteredCustomers.length > 0 ? (
                                                        <div className="max-h-60 overflow-y-auto">
                                                            {filteredCustomers.map((c: any) => (
                                                                <button 
                                                                    key={c.id} 
                                                                    onClick={() => { setCustomerId(c.id); setCustomerName(c.name); setSearchQuery(''); }}
                                                                    className="w-full text-left px-4 py-3 border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                                                                >
                                                                    <div className="font-bold text-slate-900 dark:text-white text-[13px]">{c.name}</div>
                                                                    {c.phone && <div className="text-[11px] font-medium text-slate-500 mt-0.5">{c.phone}</div>}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="px-4 py-6 text-center">
															<p className="text-[12px] font-medium text-slate-500 mb-3">&quot;{searchQuery}&quot; aramasına uygun müşteri bulunamadı.</p>
                                                            <button onClick={() => { setShowNewCustomerForm(true); setNewCustomerName(searchQuery); }} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg text-[12px] font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                                                                Yeni Müşteri Olarak Ekle
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <button onClick={() => setShowNewCustomerForm(true)} className="h-12 px-6 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-xl font-bold text-[13px] flex items-center justify-center shrink-0 hover:bg-slate-800 dark:hover:bg-white transition-colors">Yeni Müşteri</button>
                                    </div>
                                )}
                            </div>

                            {customerId && (
                                <div className="pt-4 sm:pt-6 border-t border-slate-100 dark:border-white/5 animate-in fade-in slide-in-from-bottom-2">
                                    <div className="flex flex-col mb-4 gap-3">
                                        <h3 className="text-[13px] sm:text-[14px] font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                            <Shield className="w-4 h-4 text-emerald-500" /> Müşteriye Ait Varlıklar & Cihazlar
                                        </h3>
                                        {/* Tabs */}
                                        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                            {[
                                                { id: 'registered', label: 'Kayıtlı Cihazlar' },
                                                { id: 'warranties', label: 'Garantili Ürünler' },
                                                { id: 'purchases', label: 'Faturadan Seç' },
                                                { id: 'external', label: 'Dış Ürün Ekle' }
                                            ].map(tab => (
                                                <button
                                                    key={tab.id}
                                                    onClick={() => setAssetTab(tab.id as any)}
                                                    className={`px-4 py-2 rounded-xl text-[12px] font-bold whitespace-nowrap transition-colors flex items-center gap-2
                                                        ${assetTab === tab.id 
                                                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 shadow-sm' 
                                                            : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                                        }`}
                                                >
                                                    {tab.id === 'registered' && '📱'}
                                                    {tab.id === 'warranties' && '🛡️'}
                                                    {tab.id === 'purchases' && '🧾'}
                                                    {tab.id === 'external' && '➕'}
                                                    {tab.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {assetTab === 'external' && (
                                        <div className="mb-6 p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">Marka/Model / Ürün Adı</label>
                                                    <input type="text" value={assetBrand} onChange={e => setAssetBrand(e.target.value)} placeholder="Örn: Beko, Kuba, Honda..." className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none" />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">Seri No / Plaka / Şase No</label>
                                                    <input type="text" value={primaryIdentifier} onChange={e => setPrimaryIdentifier(e.target.value)} placeholder="Zorunlu identifier..." className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none" />
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-3 pt-2">
                                                <button onClick={() => setAssetTab('registered')} className="px-4 py-2 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700">İptal</button>
                                                <button onClick={handleCreateAsset} disabled={!primaryIdentifier || !assetBrand} className="px-5 py-2 rounded-lg text-xs font-bold bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white hover:bg-emerald-600 shadow-sm transition-colors">Cihaz Sicili Oluştur & Seç</button>
                                            </div>
                                        </div>
                                    )}

                                    {assetTab === 'warranties' && (
                                        <div className="mb-6 space-y-3 animate-in fade-in slide-in-from-bottom-2">
                                            {loadingExtra ? (
                                                <div className="text-[13px] sm:text-sm font-medium text-slate-500 p-4 border border-slate-200 dark:border-white/10 rounded-xl bg-slate-50 dark:bg-slate-900 text-center">Yükleniyor...</div>
                                            ) : warranties.length === 0 ? (
                                                <div className="text-[13px] sm:text-sm font-medium text-slate-500 p-4 border border-slate-200 dark:border-white/10 rounded-xl bg-slate-50 dark:bg-slate-900 text-center">Bu müşteriye ait garantisi devam eden ürün bulunamadı.</div>
                                            ) : (
                                                <div className="grid grid-cols-1 gap-3">
                                                    {warranties.filter((w:any) => w.status === 'Active').map((w:any) => (
                                                        <div key={w.id} className="flex flex-col sm:flex-row justify-between sm:items-center p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 hover:border-emerald-500/30 transition-all gap-3">
                                                            <div className="min-w-0">
                                                                <div className="font-bold text-slate-900 dark:text-white text-[13px] sm:text-[14px] truncate flex items-center gap-2">
                                                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></div> {w.productName}
                                                                </div>
                                                                <div className="text-[11px] sm:text-[12px] text-slate-500 font-medium mt-1">
                                                                    Seri No: <span className="text-slate-700 dark:text-slate-300 mr-2">{w.serialNo}</span> 
                                                                    Fatura: <span className="text-slate-700 dark:text-slate-300">{w.invoiceNo || '-'}</span>
                                                                </div>
                                                            </div>
                                                            <button onClick={() => handleAutoCreateAndSelectAsset(w, 'warranty')} disabled={submitting} className="w-full sm:w-auto px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-[12px] rounded-lg transition-colors shrink-0 disabled:opacity-50">
                                                                {submitting ? 'İşleniyor...' : 'Seç & Sicil Aç'}
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {assetTab === 'purchases' && (
                                        <div className="mb-6 space-y-3 animate-in fade-in slide-in-from-bottom-2">
                                            {loadingExtra ? (
                                                <div className="text-[13px] sm:text-sm font-medium text-slate-500 p-4 border border-slate-200 dark:border-white/10 rounded-xl bg-slate-50 dark:bg-slate-900 text-center">Faturalar yükleniyor...</div>
                                            ) : purchases.length === 0 ? (
                                                <div className="text-[13px] sm:text-sm font-medium text-slate-500 p-4 border border-slate-200 dark:border-white/10 rounded-xl bg-slate-50 dark:bg-slate-900 text-center">Müşteriye ait satış faturası kaydı bulunamadı.</div>
                                            ) : (
                                                <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto custom-scroll pr-2">
                                                    {purchases.map((p:any, idx: number) => (
                                                        <div key={`${p.sourceId}-${idx}`} className="flex flex-col sm:flex-row justify-between sm:items-center p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 hover:border-emerald-500/30 transition-all gap-3">
                                                            <div className="min-w-0">
                                                                <div className="font-bold text-slate-900 dark:text-white text-[13px] sm:text-[14px] truncate flex items-center gap-2">
                                                                    <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></div> {p.productName}
                                                                </div>
                                                                <div className="text-[11px] sm:text-[12px] text-slate-500 font-medium mt-1">
                                                                    Tarih: <span className="text-slate-700 dark:text-slate-300 mr-2">{new Date(p.date).toLocaleDateString('tr-TR')}</span>
                                                                    {p.type === 'Invoice' ? 'Fatura' : 'İrsaliye'}: <span className="text-slate-700 dark:text-slate-300">{p.invoiceNo}</span>
                                                                </div>
                                                            </div>
                                                            <button onClick={() => handleAutoCreateAndSelectAsset(p, 'purchase')} disabled={submitting} className="w-full sm:w-auto px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-[12px] rounded-lg transition-colors shrink-0 disabled:opacity-50">
                                                                {submitting ? 'İşleniyor...' : 'Seç & Servis Aç'}
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {assetTab === 'registered' && (
                                        <div className="animate-in fade-in slide-in-from-bottom-2">
                                            {loadingAssets ? (
                                                <div className="text-[13px] sm:text-sm font-medium text-slate-500 p-4 border border-slate-200 dark:border-white/10 rounded-xl bg-slate-50 dark:bg-slate-900 text-center">Cihazlar yükleniyor...</div>
                                            ) : assets.length === 0 ? (
                                                <div className="text-[13px] sm:text-sm font-medium text-slate-500 p-4 border border-slate-200 dark:border-white/10 rounded-xl bg-slate-50 dark:bg-slate-900 text-center flex flex-col items-center gap-3">
                                                    Kayıtlı cihaz sicili bulunmuyor.
                                                    <button onClick={() => setAssetTab('external')} className="px-4 py-2 text-xs font-bold text-white bg-slate-800 dark:bg-slate-700 rounded-lg">Yeni Cihaz Sicili Ekle</button>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                                                    {assets.map(a => (
                                                        <div 
                                                            key={a.id} 
                                                            onClick={() => setAssetId(a.id)}
                                                            className={`cursor-pointer p-3 sm:p-4 rounded-xl border transition-all ${assetId === a.id ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 shadow-sm' : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                                        >
                                                            <div className="flex justify-between items-start gap-4">
                                                                <div className="min-w-0">
                                                                    <div className="font-bold text-slate-900 dark:text-white text-[13px] sm:text-[14px] truncate flex items-center gap-2">
                                                                        📱 {a.primaryIdentifier}
                                                                    </div>
                                                                    <div className="text-[11px] sm:text-xs text-slate-500 font-medium truncate mt-1">
                                                                        {a.brand || 'Diğer Marka'} {a.model ? ` - ${a.model}` : ''}
                                                                    </div>
                                                                </div>
                                                                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition-colors ${assetId === a.id ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 dark:border-slate-600 text-transparent'}`}>
                                                                    <Check className="w-3 h-3" strokeWidth={3} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Always show Belirtmek İstemiyorum as an independent option at the bottom */}
                                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5 disabled:opacity-50">
                                        <div 
                                            onClick={() => setAssetId('')}
                                            className={`cursor-pointer max-w-sm p-3 rounded-xl border transition-all ${assetId === '' ? 'border-slate-400 bg-slate-50 dark:bg-slate-800/50' : 'border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                        >
                                            <div className="flex justify-between items-center h-full gap-4">
                                                <div className="font-bold text-slate-600 dark:text-slate-400 text-[12px] sm:text-[13px] flex items-center gap-2">
                                                    ⚪ Cihaz Belirtilmeyecek (Sadece Servis / Tamir)
                                                </div>
                                                {assetId === '' && <Check className="w-4 h-4 text-slate-500 shrink-0" />}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="pt-6 sm:pt-8 flex justify-end">
                                <button 
                                    disabled={!customerId}
                                    onClick={() => setStep(2)}
                                    className="w-full sm:w-auto h-12 px-8 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-[13px] sm:text-sm tracking-wide transition-colors"
                                >
                                    İleri: Servis Detayları
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div>
                                <h3 className="text-[13px] sm:text-[14px] font-bold text-slate-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-blue-500" /> Servis Ön Bilgileri & Şikayet
                                </h3>
                                
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">Servise Geliş KM</label>
                                    <input type="number" value={currentKm} onChange={e => setCurrentKm(e.target.value)} placeholder="Araç KM'si..." className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/50 outline-none" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">Şase No (VIN)</label>
                                    <input type="text" value={chassisNo} onChange={e => setChassisNo(e.target.value)} placeholder="Şase numarası..." className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/50 outline-none" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">Model Yılı</label>
                                    <input type="number" value={productionYear} onChange={e => setProductionYear(e.target.value)} placeholder="Örn: 2021" className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/50 outline-none" />
                                </div>
                            </div>

                                <textarea
                                    value={complaint}
                                    onChange={e => setComplaint(e.target.value)}
                                    placeholder="Müşterinin şikayeti veya yapılacak servis işleminin detayı..."
                                    className="w-full h-32 p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-[13px] sm:text-sm font-medium focus:ring-2 focus:ring-blue-500/50 outline-none resize-none sm:resize-y"
                                ></textarea>
                            </div>

                            <div className="pt-6 sm:pt-8 flex flex-col sm:flex-row justify-between gap-3 sm:gap-4">
                                <button 
                                    onClick={() => setStep(1)}
                                    className="w-full sm:w-auto h-12 px-6 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-[13px] sm:text-sm tracking-wide transition-colors"
                                >
                                    Geri Dön
                                </button>
                                <button 
                                    disabled={submitting || !complaint}
                                    onClick={handleSubmit}
                                    className="w-full sm:w-auto h-12 px-10 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold text-[13px] sm:text-sm tracking-wide transition-all shadow-lg shadow-emerald-500/20"
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
