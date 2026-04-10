"use client";

import React, { useState, useEffect } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { useModal } from '@/contexts/ModalContext';

function ERPInput(props: any) {
    return (
        <input
            {...props}
            className={`h-10 px-3 bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-white/20 rounded-lg text-[14px] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm disabled:opacity-50 ${props.className || ''}`}
        />
    );
}

export default function ServiceSettingsPanel() {
    const { serviceSettings, updateServiceSettings, appSettings, updateAppSetting } = useSettings();
    const { showSuccess, showError, showConfirm } = useModal();

    // 1. DYNAMIC SERVICE RATES STATE
    const [rates, setRates] = useState<any[]>([]);

    // 2. DYNAMIC ASSET TYPES (TAŞIT TÜRLERİ & KUTULAR) STATE
    const [assetTypes, setAssetTypes] = useState<any[]>([]);

    // Load Data
    useEffect(() => {
        // Load Rates
        if (serviceSettings && Object.keys(serviceSettings).length > 0) {
            const arr = Object.entries(serviceSettings).map(([name, price]) => ({
                id: Math.random().toString(36).substr(2, 9),
                name,
                price: Number(price) || 0
            }));
            setRates(arr);
        } else {
            setRates([{ id: 'r1', name: 'Motosiklet Periyodik Bakım', price: 0 }]);
        }

        // Load Asset Types from AppSettings 
        if (appSettings?.asset_types_schema) {
            setAssetTypes(appSettings.asset_types_schema);
        } else {
            // Default seed based on what user requested
            setAssetTypes([
                { 
                    id: 't1', 
                    name: 'Motosiklet', 
                    fields: [
                        { id: 'f1', label: 'KM' },
                        { id: 'f2', label: 'Plaka' }
                    ] 
                },
                { 
                    id: 't2', 
                    name: 'Beyaz Eşya', 
                    fields: [
                        { id: 'f3', label: 'Seri No' }
                    ] 
                }
            ]);
        }
    }, [serviceSettings, appSettings]);

    const handleSave = async () => {
        try {
            // 1. Rebuild Service Rates Object
            const ratesObj: Record<string, number> = {};
            rates.forEach(r => {
                if (r.name.trim()) ratesObj[r.name.trim()] = r.price;
            });

            // 2. Filter empty asset types
            const finalAssetTypes = assetTypes.filter(t => t.name.trim() !== '');

            // 3. Save to Global Contexts & DB
            await updateServiceSettings(ratesObj);
            await updateAppSetting('asset_types_schema', finalAssetTypes);

            showSuccess('Başarılı', 'Servis tarifeleri ve taşıt (cihaz) türü alanları kaydedildi.');
        } catch (e) {
            showError('Hata', 'Ayarlar kaydedilemedi.');
        }
    };

    // --- RATES HANDLERS ---
    const addRate = () => setRates([...rates, { id: Math.random().toString(36).substr(2,9), name: '', price: 0 }]);
    const removeRate = (id: string) => setRates(rates.filter(r => r.id !== id));
    const updateRate = (id: string, key: string, val: any) => {
        setRates(rates.map(r => r.id === id ? { ...r, [key]: val } : r));
    };

    // --- ASSET TYPES HANDLERS ---
    const addAssetType = () => {
        setAssetTypes([...assetTypes, { id: Math.random().toString(36).substr(2,9), name: '', fields: [] }]);
    };
    const removeAssetType = (typeId: string) => {
        showConfirm('Tür Silinecek', 'Bu tür silinirse altındaki tüm ek (kutu) alanları da silinecektir. Onaylıyor musunuz?', () => {
            setAssetTypes(assetTypes.filter(t => t.id !== typeId));
        });
    };
    const updateAssetTypeName = (typeId: string, name: string) => {
        setAssetTypes(assetTypes.map(t => t.id === typeId ? { ...t, name } : t));
    };

    // --- ASSET FIELDS HANDLERS ---
    const addField = (typeId: string) => {
        setAssetTypes(assetTypes.map(t => {
            if (t.id === typeId) {
                return { ...t, fields: [...t.fields, { id: Math.random().toString(36).substr(2,9), label: '' }] };
            }
            return t;
        }));
    };
    const removeField = (typeId: string, fieldId: string) => {
        setAssetTypes(assetTypes.map(t => {
            if (t.id === typeId) {
                return { ...t, fields: t.fields.filter((f: any) => f.id !== fieldId) };
            }
            return t;
        }));
    };
    const updateFieldLabel = (typeId: string, fieldId: string, label: string) => {
        setAssetTypes(assetTypes.map(t => {
            if (t.id === typeId) {
                return { 
                    ...t, 
                    fields: t.fields.map((f: any) => f.id === fieldId ? { ...f, label } : f) 
                };
            }
            return t;
        }));
    };

    return (
        <div className="max-w-7xl mx-auto w-full p-8 pt-10 animate-in fade-in duration-300 font-sans">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-[24px] font-bold text-slate-900 dark:text-white tracking-tight">Servis & Cihaz Ayarları</h2>
                    <p className="text-[14px] text-slate-500 dark:text-slate-400 mt-1">Servis tarifelerini (fiyatları) ve dinamik cihaz (taşıt) karnesi alanlarını buradan yönetin.</p>
                </div>

                <div className="shrink-0">
                    <button
                        onClick={handleSave}
                        className="h-10 px-6 bg-blue-600 border-none rounded shadow-sm text-white text-[14px] font-semibold hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 flex items-center gap-2"
                    >
                        ✓ Ayarları Kaydet
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                
                {/* SOL KOLON: SABİT SERVİS VE İŞÇİLİK TARİFELERİ */}
                <div>
                    <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
                        <div className="px-5 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="text-[16px] font-bold text-slate-800 dark:text-white">Servis & İşçilik Tarifeleri</h3>
                                <p className="text-xs font-medium text-slate-500 mt-1">Sistemdeki tüm şubelerde geçerli olan onarım, işçilik fiksleri.</p>
                            </div>
                            <button onClick={addRate} className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded">
                                + Tarife Ekle
                            </button>
                        </div>

                        <div className="p-5 flex-1 overflow-y-auto w-full bg-slate-50">
                            <div className="space-y-3">
                                {rates.length === 0 ? (
                                    <div className="text-sm font-medium text-slate-400 text-center py-10 bg-white rounded border border-dashed border-slate-200">Kayıtlı tarife bulunmuyor.</div>
                                ) : rates.map((r, i) => (
                                    <div key={r.id} className="flex items-center gap-3 bg-white p-3 border border-slate-200 rounded shadow-sm hover:border-blue-300 transition-colors w-full group">
                                        <div className="font-bold text-slate-400 w-6 text-center text-xs">{i+1}.</div>
                                        <div className="flex-1 min-w-0">
                                            <ERPInput 
                                                type="text" 
                                                placeholder="İşlem Adı (Örn: Motor İndirme)" 
                                                value={r.name}
                                                onChange={(e: any) => updateRate(r.id, 'name', e.target.value)}
                                                className="w-full font-semibold border-slate-200"
                                            />
                                        </div>
                                        <div className="w-32 relative shrink-0">
                                            <ERPInput 
                                                type="number" 
                                                placeholder="0.00"
                                                value={r.price}
                                                onChange={(e: any) => updateRate(r.id, 'price', Number(e.target.value))}
                                                className="w-full text-right font-mono font-bold pr-8"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[14px] font-bold text-slate-400">₺</span>
                                        </div>
                                        <button 
                                            onClick={() => removeRate(r.id)} 
                                            className="w-8 h-8 rounded flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                                            title="Tarifeyi Sil"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* SAĞ KOLON: TAŞIT / CİHAZ TÜRLERİ VE KUTULAR */}
                <div>
                    <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-xl shadow-sm overflow-hidden flex flex-col h-full ring-1 ring-blue-500/10">
                        <div className="px-5 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-blue-50/50">
                            <div>
                                <h3 className="text-[16px] font-bold text-slate-800 dark:text-white">Dinamik Cihaz/Taşıt Karneleri</h3>
                                <p className="text-xs font-medium text-slate-500 mt-1">İstediğiniz türü ekleyin ve altına ona özel giriş kutuları (alanlar) yaratın.</p>
                            </div>
                            <button onClick={addAssetType} className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors bg-white shadow-sm border border-blue-200 hover:bg-blue-50 px-3 py-1.5 rounded">
                                + Yeni Cihaz/Taşıt Türü
                            </button>
                        </div>

                        <div className="p-5 flex-1 overflow-y-auto bg-slate-50/50">
                            <div className="space-y-6">
                                {assetTypes.length === 0 ? (
                                    <div className="text-sm font-medium text-slate-400 text-center py-10 bg-white rounded border border-dashed border-slate-200">Kayıtlı cihaz türü (taşıt) bulunamadı.</div>
                                ) : assetTypes.map((type, idx) => (
                                    <div key={type.id} className="bg-white border border-slate-200 shadow-sm rounded-lg overflow-hidden group/type transition-all hover:border-blue-400">
                                        {/* Tür Başlığı (Ana Kategori) */}
                                        <div className="bg-slate-50 border-b border-slate-200 p-3 flex flex-wrap items-center gap-3">
                                            <div className="w-8 h-8 rounded border border-slate-200 bg-white flex items-center justify-center text-xs font-black text-slate-400">
                                                T{idx+1}
                                            </div>
                                            <div className="flex-1 min-w-[200px]">
                                                <input
                                                    type="text"
                                                    value={type.name}
                                                    onChange={(e) => updateAssetTypeName(type.id, e.target.value)}
                                                    placeholder="Türü (Örn: Motosiklet, Beyaz Eşya)"
                                                    className="w-full bg-white border border-slate-300 rounded h-9 px-3 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => addField(type.id)} className="text-xs font-bold text-slate-600 bg-slate-200 hover:bg-slate-300 transition-colors px-3 py-1.5 rounded flex items-center gap-1">
                                                    + Kutu (Alan) Ekle
                                                </button>
                                                <button onClick={() => removeAssetType(type.id)} className="text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors px-3 py-1.5 rounded border border-red-100">
                                                    Türü Sil
                                                </button>
                                            </div>
                                        </div>

                                        {/* Alt Kutular (Dinamik Alanlar) */}
                                        <div className="p-3 bg-white">
                                            {type.fields.length === 0 ? (
                                                <p className="text-xs font-semibold text-slate-400 italic pl-2">Henüz bu türe özgü kutu (alan) eklenmemiş.</p>
                                            ) : (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {type.fields.map((f: any, fIdx: number) => (
                                                        <div key={f.id} className="flex justify-between items-center rounded border border-slate-200 bg-slate-50 pl-3 pr-1 py-1 group/field focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
                                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">KUTU {fIdx+1}</span>
                                                                <input
                                                                    type="text"
                                                                    placeholder="İsim (Örn: KM, Seri No, Plaka)"
                                                                    value={f.label}
                                                                    onChange={(e) => updateFieldLabel(type.id, f.id, e.target.value)}
                                                                    className="w-full bg-transparent border-none text-sm font-semibold text-slate-700 placeholder:font-medium placeholder:text-slate-400 focus:outline-none focus:ring-0"
                                                                />
                                                            </div>
                                                            <button 
                                                                onClick={() => removeField(type.id, f.id)} 
                                                                className="text-slate-400 hover:text-red-500 w-6 h-6 rounded flex items-center justify-center transition-colors shrink-0"
                                                                title="Alanı Sil"
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                                <p className="text-xs font-semibold text-blue-700 flex items-start gap-2">
                                    <span className="text-blue-500 mt-[-1px]">ℹ️</span>
                                    Bu alanda tanımladığınız &quot;Cihaz / Taşıt Türleri&quot;, yeni servis açılış ekranında kullanılacaktır. Açılış esnasında buradan eklediğiniz alt kutular (örn. KM veya Seri No) otomatik olarak talep edilecektir.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
