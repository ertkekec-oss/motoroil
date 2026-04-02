"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/contexts/AppContext';
import { useCRM } from '@/contexts/CRMContext';
import { useModal } from '@/contexts/ModalContext';
import { useSettings } from '@/contexts/SettingsContext';
import { ChevronLeft, Check, Shield, Search, User, FileText, Plus, X } from 'lucide-react';
import Link from 'next/link';

function NewWorkOrderContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { activeBranchName, activeTenantId } = useApp();
    const { customers } = useCRM();
    const { showSuccess, showError } = useModal();
    const { appSettings } = useSettings();

    const initialCustomerId = searchParams.get('customerId');
    const initialCustomerName = searchParams.get('customerName');

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
    const [selectedAssetType, setSelectedAssetType] = useState<string>('');
    const [dynamicFields, setDynamicFields] = useState<Record<string, string>>({});
    
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
            
            if (selected.metadata) {
                const { type, currentKm, ...rest } = selected.metadata;
                if (type) setSelectedAssetType(type);
                setDynamicFields(rest || {});
            }
            if (selected.brand) {
                setAssetBrand(selected.brand);
            }
        } else {
            setCurrentKm(''); setProductionYear(''); setChassisNo('');
        }
    }, [assetId, assets]);


    const handleCreateAsset = async () => {
        const idToSave = primaryIdentifier || Object.values(dynamicFields)[0];
        if (!idToSave) return showError("Eksik", "Tanıtıcı kod veya ilgili cihaz karnesi girilmelidir.");
        try {
            const res = await fetch(`/api/customers/${customerId}/assets`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    primaryIdentifier: idToSave, 
                    brand: assetBrand || selectedAssetType, 
                    metadata: { type: selectedAssetType, ...dynamicFields }
                })
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
            metadata: { sourceId: item.id, sourceType: type, type: selectedAssetType }
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
                setAssetTab('registered');
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
            const finalDynamic = Object.keys(dynamicFields).length > 0 ? dynamicFields : undefined;
            const payload = {
                customerId,
                assetId: assetId || undefined,
                complaint,
                branch: activeBranchName,
                status: 'PENDING',
                currentKm,
                chassisNo,
                productionYear,
                dynamicMetadata: finalDynamic,
                selectedAssetType
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
        <div className="bg-slate-50 min-h-screen pb-16 w-full font-sans dark:bg-[#0f172a]">
            {/* HER YERDE GEÇERLİ EN ÜST STRATEJİ / BAŞLIK BANDI */}
            <div className="max-w-[1600px] mx-auto pt-8 px-4 sm:px-6 lg:px-8">
                <div className="flex-shrink-0 bg-transparent z-10 sticky top-0 mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <Link href="/service" className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm shrink-0">
                            <ChevronLeft className="w-5 h-5" />
                        </Link>
                        <div className="flex flex-col min-w-0">
                            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-none truncate">
                                Yeni İş Emri Kaydı
                            </h1>
                            <span className="text-[11px] sm:text-[12px] font-bold tracking-widest uppercase text-slate-500 mt-1.5 truncate">
                                Tek Ekranda Hızlı Servis Kabul Formu
                            </span>
                        </div>
                    </div>
                    <button 
                        disabled={submitting || !complaint || !customerId}
                        onClick={handleSubmit}
                        className="h-10 px-8 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-[10px] font-bold text-[12px] uppercase tracking-widest transition-all shadow-sm flex items-center gap-2"
                    >
                        {submitting ? (
                            <span className="animate-pulse">KAYDEDİLİYOR...</span>
                        ) : (
                            <>
                                <Check className="w-4 h-4" /> KAYDI TAMAMLA
                            </>
                        )}
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-500">
                    
                    {/* SOL KOLON: MÜŞTERİ VE CİHAZ (col-span-5) */}
                    <div className="lg:col-span-5 space-y-6">
                        
                        {/* KART: Müşteri Seçimi */}
                        <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-[20px] shadow-sm p-6">
                            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-500 flex items-center justify-center text-lg">1️⃣</div>
                                <div>
                                    <h3 className="text-[15px] font-black text-slate-900 dark:text-white leading-none">Müşteri Seçimi</h3>
                                    <p className="text-[11px] font-bold text-slate-500 mt-1 tracking-widest uppercase">Kimi misafir ediyoruz?</p>
                                </div>
                            </div>

                            {customerId ? (
                                <div className="flex items-center justify-between p-4 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black shadow-inner text-lg">
                                            {customerName.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-900 dark:text-white text-[15px]">{customerName}</div>
                                            <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mt-1">Seçili Müşteri</div>
                                        </div>
                                    </div>
                                    {!initialCustomerId && (
                                        <button onClick={() => { setCustomerId(''); setCustomerName(''); setAssetId(''); }} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all font-bold" title="Değiştir">
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ) : showNewCustomerForm ? (
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl border border-slate-200 dark:border-white/10 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-[13px] font-bold text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2"><Plus className="w-4 h-4"/> Hızlı Kayıt</h4>
                                        <button onClick={() => setShowNewCustomerForm(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-4 h-4"/></button>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5 tracking-wider">Ad Soyad / Unvan *</label>
                                        <input type="text" value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)} className="w-full h-11 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[10px] text-[13px] font-bold focus:border-blue-500 outline-none transition-all shadow-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5 tracking-wider">Telefon Numarası</label>
                                        <input type="text" value={newCustomerPhone} onChange={e => setNewCustomerPhone(e.target.value)} className="w-full h-11 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[10px] text-[13px] font-bold focus:border-blue-500 outline-none transition-all shadow-sm" />
                                    </div>
                                    <button onClick={handleCreateCustomer} disabled={submitting || !newCustomerName} className="w-full h-11 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[10px] font-bold text-[12px] uppercase tracking-widest disabled:opacity-50 transition-colors shadow-sm mt-2">
                                        {submitting ? 'KAYDEDİLİYOR...' : 'KAYDET VE SEÇ'}
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 relative">
                                    <div className="flex-1 relative">
                                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input 
                                            type="text" 
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            placeholder="Ara... (Tel, İsim, Cari)" 
                                            className="w-full h-11 pl-9 pr-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-[10px] text-[13px] font-bold focus:border-blue-500 outline-none transition-all shadow-sm text-slate-900 dark:text-white" 
                                        />
                                        
                                        {/* Autocomplete */}
                                        {searchQuery.length > 1 && (
                                            <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden">
                                                {filteredCustomers.length > 0 ? (
                                                    <div className="max-h-60 overflow-y-auto custom-scroll">
                                                        {filteredCustomers.map((c: any) => (
                                                            <button 
                                                                key={c.id} 
                                                                onClick={() => { setCustomerId(c.id); setCustomerName(c.name); setSearchQuery(''); }}
                                                                className="w-full text-left p-4 border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex items-center justify-between"
                                                            >
                                                                <div>
                                                                    <div className="font-bold text-slate-900 dark:text-white text-[13px]">{c.name}</div>
                                                                    {c.phone && <div className="text-[11px] font-medium text-slate-500 mt-0.5">{c.phone}</div>}
                                                                </div>
                                                                <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs uppercase opacity-0 group-hover:opacity-100 transition-opacity">Seç</div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="px-4 py-6 text-center">
                                                        <p className="text-[12px] font-bold text-slate-500 mb-3 uppercase tracking-wider">KAYIT BULUNAMADI</p>
                                                        <button onClick={() => { setShowNewCustomerForm(true); setNewCustomerName(searchQuery); }} className="h-10 px-4 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-[10px] text-[11px] font-bold uppercase tracking-widest transition-colors w-full">
                                                            + YENİ MÜŞTERİ EKLE
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <button onClick={() => setShowNewCustomerForm(true)} className="h-11 px-5 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-[10px] font-bold text-[11px] uppercase tracking-widest shrink-0 hover:bg-slate-50 transition-all shadow-sm shrink-0">
                                        + YENİ
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* KART: Cihaz Seçimi */}
                        <div className={`bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-[20px] shadow-sm flex flex-col overflow-hidden transition-all duration-500 ${!customerId ? 'opacity-50 pointer-events-none grayscale-[50%]' : ''}`}>
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-lg">2️⃣</div>
                                    <div>
                                        <h3 className="text-[15px] font-black text-slate-900 dark:text-white leading-none">Cihaz / Varlık Seçimi</h3>
                                        <p className="text-[11px] font-bold text-slate-500 mt-1 tracking-widest uppercase">Hangi cihaza işlem yapılacak?</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50 dark:bg-[#0f172a] flex items-center overflow-x-auto custom-scroll border-b border-slate-200 dark:border-white/5">
                                {[
                                    { id: 'registered', label: 'Kayıtlı Cihazlar' },
                                    { id: 'warranties', label: 'Garantili Ürünler' },
                                    { id: 'purchases', label: 'Faturalar' },
                                    { id: 'external', label: 'Dış Ürün Ekle' }
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setAssetTab(tab.id as any)}
                                        className={`px-4 py-3 text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-b-2
                                            ${assetTab === tab.id 
                                                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-[#1e293b]' 
                                                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-white/5'
                                            }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            <div className="p-6 bg-white dark:bg-[#1e293b]">
                                {assetTab === 'registered' && (
                                    <>
                                        {loadingAssets ? (
                                            <div className="text-[12px] font-bold text-slate-500 uppercase tracking-widest text-center py-6">YÜKLENİYOR...</div>
                                        ) : assets.length === 0 ? (
                                            <div className="text-[12px] font-bold text-slate-500 text-center py-6 flex flex-col items-center gap-3">
                                                CİHAZ BULUNAMADI
                                                <button onClick={() => setAssetTab('external')} className="px-4 py-2 text-[10px] uppercase tracking-widest font-black text-white bg-slate-900 dark:bg-slate-700 rounded-lg">ŞİMDİ EKLE</button>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 gap-3">
                                                {assets.map(a => (
                                                    <div 
                                                        key={a.id} 
                                                        onClick={() => setAssetId(a.id)}
                                                        className={`cursor-pointer p-4 rounded-[12px] border transition-all ${assetId === a.id ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 shadow-sm' : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                                                    >
                                                        <div className="flex justify-between items-center gap-4">
                                                            <div className="min-w-0">
                                                                <div className="font-black text-slate-900 dark:text-white text-[14px] truncate">
                                                                    {a.primaryIdentifier}
                                                                </div>
                                                                <div className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                                                                    {a.brand || 'Model Bilinmiyor'}
                                                                </div>
                                                            </div>
                                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors ${assetId === a.id ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 dark:border-slate-600 text-transparent'}`}>
                                                                <Check className="w-3.5 h-3.5" strokeWidth={4} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5">
                                            <div 
                                                onClick={() => setAssetId('')}
                                                className={`cursor-pointer max-w-sm p-3.5 rounded-[12px] border transition-all ${assetId === '' ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10' : 'border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                                            >
                                                <div className="flex justify-between items-center h-full gap-4">
                                                    <div className={`font-black text-[12px] uppercase tracking-widest flex items-center gap-2 ${assetId==='' ? 'text-amber-700 dark:text-amber-400' : 'text-slate-500'}`}>
                                                        ⚪ Cihaz Belirtilmeyecek (Manuel)
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {assetTab === 'external' && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[11px] font-bold text-slate-500 tracking-widest uppercase mb-1.5 block">Cihaz Türü</label>
                                            <select value={selectedAssetType} onChange={e => { setSelectedAssetType(e.target.value); setDynamicFields({}); }} className="w-full h-11 px-3 rounded-[10px] border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0f172a] text-[13px] font-bold focus:ring-2 focus:ring-emerald-500/50 outline-none">
                                                <option value="">Seçiniz...</option>
                                                {(appSettings?.asset_types_schema || []).map((t:any) => (
                                                    <option key={t.id} value={t.name}>{t.name}</option>
                                                ))}
                                                <option value="VEHICLE">Kayıtsız (Genel)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold text-slate-500 tracking-widest uppercase mb-1.5 block">Marka / Cihaz Adı</label>
                                            <input type="text" value={assetBrand} onChange={e => setAssetBrand(e.target.value)} placeholder="Örn: Beko..." className="w-full h-11 px-3 rounded-[10px] border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0f172a] text-[13px] font-bold focus:ring-2 focus:ring-emerald-500/50 outline-none" />
                                        </div>
                                        {(() => {
                                            const schema = appSettings?.asset_types_schema?.find((t:any) => t.name === selectedAssetType || t.id === selectedAssetType);
                                            if (schema && schema.fields && schema.fields.length > 0) {
                                                return schema.fields.map((f:any) => (
                                                    <div key={f.id}>
                                                        <label className="text-[11px] font-bold text-slate-500 tracking-widest uppercase mb-1.5 block">
                                                            {f.label}
                                                        </label>
                                                        <input 
                                                            type="text" 
                                                            value={dynamicFields[f.id] || ''} 
                                                            onChange={e => setDynamicFields({...dynamicFields, [f.id]: e.target.value})} 
                                                            className="w-full h-11 px-3 rounded-[10px] border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0f172a] text-[13px] font-bold focus:ring-2 focus:ring-emerald-500/50 outline-none" 
                                                        />
                                                    </div>
                                                ));
                                            } else if (selectedAssetType) {
                                                return (
                                                    <div>
                                                        <label className="text-[11px] font-bold text-slate-500 tracking-widest uppercase mb-1.5 block">Seri No / Tanıtıcı</label>
                                                        <input type="text" value={primaryIdentifier} onChange={e => setPrimaryIdentifier(e.target.value)} className="w-full h-11 px-3 rounded-[10px] border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0f172a] text-[13px] font-bold focus:ring-2 focus:ring-emerald-500/50 outline-none" />
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })()}
                                        <button onClick={handleCreateAsset} disabled={!(primaryIdentifier || Object.keys(dynamicFields).length > 0) || !assetBrand} className="w-full h-11 rounded-[10px] font-black text-[11px] uppercase tracking-widest bg-emerald-600 disabled:opacity-50 text-white hover:bg-emerald-700 shadow-sm transition-colors mt-2">
                                            SİCİL OLUŞTUR VE SEÇ
                                        </button>
                                    </div>
                                )}

                                {/* Purchases & Warranties similar tight designs */}
                                {assetTab === 'warranties' && (
                                    <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scroll">
                                        {loadingExtra ? (
                                            <div className="text-[12px] font-bold text-slate-500 uppercase tracking-widest text-center py-6">YÜKLENİYOR...</div>
                                        ) : warranties.length === 0 ? (
                                            <div className="text-[12px] font-bold text-slate-500 text-center py-6">KAYIT BULUNAMADI.</div>
                                        ) : (
                                            warranties.filter((w:any) => w.status === 'Active').map((w:any) => (
                                                <div key={w.id} className="flex justify-between items-center p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50">
                                                    <div>
                                                        <div className="font-bold text-slate-900 dark:text-white text-[13px] truncate">{w.productName}</div>
                                                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">SN: {w.serialNo}</div>
                                                    </div>
                                                    <button onClick={() => handleAutoCreateAndSelectAsset(w, 'warranty')} className="px-3 py-1.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 font-bold text-[10px] uppercase tracking-widest rounded-lg">Seç</button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}

                                {assetTab === 'purchases' && (
                                    <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scroll">
                                        {loadingExtra ? (
                                            <div className="text-[12px] font-bold text-slate-500 uppercase tracking-widest text-center py-6">YÜKLENİYOR...</div>
                                        ) : purchases.length === 0 ? (
                                            <div className="text-[12px] font-bold text-slate-500 text-center py-6">KAYIT BULUNAMADI.</div>
                                        ) : (
                                            purchases.map((p:any, idx: number) => (
                                                <div key={`${p.sourceId}-${idx}`} className="flex justify-between items-center p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50">
                                                    <div>
                                                        <div className="font-bold text-slate-900 dark:text-white text-[13px] truncate">{p.productName}</div>
                                                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{p.invoiceNo}</div>
                                                    </div>
                                                    <button onClick={() => handleAutoCreateAndSelectAsset(p, 'purchase')} className="px-3 py-1.5 bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 font-bold text-[10px] uppercase tracking-widest rounded-lg">Seç</button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* SAĞ KOLON: ŞİKAYET VE YÖNETİM (col-span-7) */}
                    <div className="lg:col-span-7 h-full">
                        <div className={`bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-[20px] shadow-sm flex flex-col h-full overflow-hidden transition-all duration-500 ${!customerId ? 'opacity-30 pointer-events-none grayscale' : ''}`}>
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#0f172a]/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-lg">3️⃣</div>
                                    <div>
                                        <h3 className="text-[15px] font-black text-slate-900 dark:text-white leading-none">Şikayet ve Detaylar</h3>
                                        <p className="text-[11px] font-bold text-slate-500 mt-1 tracking-widest uppercase">Teknisyenlere ipucu bırakın.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 flex-1 flex flex-col">
                                <div className="mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                                    <label className="text-[11px] font-bold tracking-widest uppercase text-slate-500 mb-2 block">Cihaz / Varlık Türü (Karne Şablonu)</label>
                                    <select 
                                        value={selectedAssetType} 
                                        onChange={e => { 
                                            setSelectedAssetType(e.target.value); 
                                            // Only reset fields if we are changing type manually
                                            setDynamicFields({}); 
                                        }} 
                                        className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[10px] text-[13px] font-bold focus:border-indigo-500 outline-none shadow-sm"
                                    >
                                        <option value="">Standart (Genel Cihaz / Taşıt)</option>
                                        {(appSettings?.asset_types_schema || []).map((t:any) => (
                                            <option key={t.id} value={t.name}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
                                    {(() => {
                                        const schema = appSettings?.asset_types_schema?.find((t:any) => t.name === selectedAssetType || t.id === selectedAssetType);
                                        
                                        if (schema && schema.fields && schema.fields.length > 0) {
                                            return schema.fields.map((f:any) => (
                                                <div key={f.id}>
                                                    <label className="text-[11px] font-bold tracking-widest uppercase text-slate-500 mb-2 block">{f.label}</label>
                                                    <input 
                                                        type="text" 
                                                        value={dynamicFields[f.id] || ''} 
                                                        onChange={e => setDynamicFields({...dynamicFields, [f.id]: e.target.value})} 
                                                        className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[10px] text-[13px] font-bold focus:border-indigo-500 outline-none transition-colors shadow-sm" 
                                                    />
                                                </div>
                                            ));
                                        } else {
                                            return (
                                                <>
                                                    <div>
                                                        <label className="text-[11px] font-bold tracking-widest uppercase text-slate-500 mb-2 block">Geliş KM / Tüketim</label>
                                                        <input type="number" value={currentKm} onChange={e => setCurrentKm(e.target.value)} className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[10px] text-[13px] font-bold focus:border-indigo-500 outline-none transition-colors shadow-sm" />
                                                    </div>
                                                    <div>
                                                        <label className="text-[11px] font-bold tracking-widest uppercase text-slate-500 mb-2 block">Şase / Özel Kod</label>
                                                        <input type="text" value={chassisNo} onChange={e => setChassisNo(e.target.value)} className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[10px] text-[13px] font-bold focus:border-indigo-500 outline-none transition-colors shadow-sm" />
                                                    </div>
                                                </>
                                            );
                                        }
                                    })()}
                                </div>

                                <div className="flex-1 flex flex-col min-h-[300px]">
                                    <label className="text-[11px] font-bold tracking-widest uppercase text-slate-500 mb-2 block flex gap-2">Müşteri Şikayeti / Talep <span className="text-rose-500">*</span></label>
                                    <textarea
                                        value={complaint}
                                        onChange={e => setComplaint(e.target.value)}
                                        placeholder="Araçta / üründe ne gibi bir problem var? Belirtilen talepleri ve ekstra notlarınızı detaylıca ekleyin..."
                                        className="w-full flex-1 p-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl text-[14px] font-medium focus:border-indigo-500 outline-none resize-none transition-colors shadow-sm text-slate-900 dark:text-white"
                                    ></textarea>
                                </div>
                            </div>
                        </div>
                    </div>

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
