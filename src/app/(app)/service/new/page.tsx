"use client";

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useModal } from '@/contexts/ModalContext';
import { useApp } from '@/contexts/AppContext';
import { useInventory } from '@/contexts/InventoryContext';
import { useCRM } from '@/contexts/CRMContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useTheme } from '@/contexts/ThemeContext';
import { ArrowLeft, CheckCircle2, Info, Search, Shield, X, Package, Box, MapPin, Wrench, Check, AlertTriangle, Bike, Car, Truck, Clock } from 'lucide-react';

function ServiceAcceptanceContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { showSuccess, showError } = useModal();
    const { products } = useInventory();
    const { customers } = useCRM();
    const { serviceSettings, vehicleTypes } = useSettings();
    const { theme } = useTheme();
    const isLight = theme === 'light';

    const [vehicleType, setVehicleType] = useState('Motosiklet');

    useEffect(() => {
        if (vehicleTypes && vehicleTypes.length > 0 && !vehicleTypes.includes(vehicleType)) {
            if (vehicleTypes.includes('Motosiklet')) setVehicleType('Motosiklet');
            else setVehicleType(vehicleTypes[0]);
        }
    }, [vehicleTypes]);

    const isMotorized = (type: string) => {
        const t = type.toLowerCase();
        const automotiveKeywords = ['motor', 'moto', 'araç', 'otomobil', 'araba', 'kamyon', 'otobüs', 'atv', 'scooter'];
        const nonAutomotiveKeywords = ['bisiklet', 'bicycle', 'bike', 'beyaz eşya', 'elektronik', 'mobilya'];
        
        const isAuto = automotiveKeywords.some(kw => t.includes(kw));
        const isNonAuto = nonAutomotiveKeywords.some(kw => t.includes(kw));
        
        if (isNonAuto) return false;
        return isAuto || !isNonAuto;
    };

    const [selectedParts, setSelectedParts] = useState<{ id: string | number, name: string, price: number, quantity: number, originalId: string | number, isWarranty?: boolean }[]>([]);
    const [isLaborWarranty, setIsLaborWarranty] = useState(false);

    const [productSearchQuery, setProductSearchQuery] = useState('');
    const [showProductSuggestions, setShowProductSuggestions] = useState(false);

    const filteredProducts = useMemo(() => {
        if (!productSearchQuery) return [];
        const q = productSearchQuery.toLowerCase();
        return products.filter(p =>
            p.name.toLowerCase().includes(q) ||
            p.code.toLowerCase().includes(q) ||
            (p.barcode && p.barcode.toLowerCase().includes(q))
        ).slice(0, 10);
    }, [products, productSearchQuery]);

    const [formData, setFormData] = useState({
        customerId: '',
        plate: '',
        km: '',
        nextKm: '',
        nextDate: '',
        customerName: '',
        phone: '',
        notes: '',
        brand: '',
        serialNumber: '',
        appointmentDate: '',
        checklist: {} as Record<string, boolean>
    });

    const defaultChecklists: Record<string, string[]> = {
        'Motosiklet': ["Fren Hidroliği", "Zincir Gerginliği & Yağlama", "Lastik Basınçları", "Yağ Seviyesi", "Soğutma Suyu", "Aydınlatma Grubu"],
        'Bisiklet': ["Fren Papuçları / Balatalar", "Zincir Yağlama", "Vites Ayarları", "Lastik Basınçları", "Jant Akordu", "Gidon Sıkılığı"],
    };

    const currentChecklistItems = defaultChecklists[vehicleType] || ["Genel Kontrol", "Temizlik", "Fonksiyon Testi"];

    const toggleChecklistItem = (item: string) => {
        setFormData(prev => ({
            ...prev,
            checklist: { ...prev.checklist, [item]: !prev.checklist[item] }
        }));
    };

    const [searchQuery, setSearchQuery] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isNewCustomer, setIsNewCustomer] = useState(false);

    const [warrantyModalOpen, setWarrantyModalOpen] = useState(false);
    const [customerWarranties, setCustomerWarranties] = useState<any[]>([]);

    useEffect(() => {
        const cId = searchParams.get('customerId');
        const cName = searchParams.get('customerName');
        if (cId && cName) {
            setFormData(prev => ({ ...prev, customerId: cId, customerName: cName }));
            setSearchQuery(cName);
            const existing = customers.find(c => c.id.toString() === cId);
            if (existing) setFormData(prev => ({ ...prev, phone: existing.phone || '' }));
            checkCustomerWarranties(cId);
        }
    }, [searchParams, customers]);

    const filteredCustomers = useMemo(() => {
        if (!searchQuery) return [];
        const q = searchQuery.toLowerCase();
        return customers.filter(c =>
            c.name.toLowerCase().includes(q) ||
            (c.phone && c.phone.includes(q))
        ).slice(0, 8);
    }, [customers, searchQuery]);

    const handleSearchChange = (e: any) => {
        const val = e.target.value;
        setSearchQuery(val);
        setFormData(prev => ({ ...prev, customerName: val, customerId: '' }));
        if (val.length > 1) {
            setShowSuggestions(true);
            const exactMatch = customers.find(c => c.name.toLowerCase() === val.toLowerCase());
            setIsNewCustomer(!exactMatch);
        } else {
            setShowSuggestions(false);
            setIsNewCustomer(false);
        }
    };

    const checkCustomerWarranties = async (cId: string) => {
        if (!cId) return;
        try {
            const wRes = await fetch(`/api/warranties?customerId=${cId}`);
            const wData = await wRes.json();
            const sRes = await fetch(`/api/services?customerId=${cId}`);
            const sData = await sRes.json();
            let allWarrantyItems: any[] = [];
            if (wData.success && wData.warranties?.length > 0) allWarrantyItems = [...wData.warranties];
            if (sData.success && sData.services?.length > 0) {
                const serviceWarranties = sData.services.map((s: any) => ({
                    id: `SRV-${s.id}`,
                    productName: s.vehicleBrand || 'Geçmiş Servis Aracı',
                    serialNo: s.vehicleSerial || s.plate || '-',
                    endDate: new Date(new Date(s.createdAt).setFullYear(new Date(s.createdAt).getFullYear() + 2)).toISOString().split('T')[0],
                    status: 'Aktif'
                })).filter((s: any) => s.serialNo !== '-' && !allWarrantyItems.find(w => w.serialNo === s.serialNo));
                allWarrantyItems = [...allWarrantyItems, ...serviceWarranties];
            }
            if (allWarrantyItems.length > 0) {
                setCustomerWarranties(allWarrantyItems);
                setWarrantyModalOpen(true);
            }
        } catch (err) {
            console.error('Warranty check failed', err);
        }
    };

    const selectCustomer = (customer: any) => {
        setSearchQuery(customer.name);
        setFormData({ ...formData, customerId: customer.id, customerName: customer.name, phone: customer.phone || '', plate: '' });
        setIsNewCustomer(false);
        setShowSuggestions(false);
        checkCustomerWarranties(customer.id);
    };

    const handleWarrantySelect = (warranty: any) => {
        setFormData(prev => ({ ...prev, brand: warranty.productName, serialNumber: warranty.serialNo, plate: warranty.serialNo }));
        setVehicleType('Bisiklet');
        setWarrantyModalOpen(false);
        showSuccess('Ürün Seçildi', 'Garanti kapsamındaki ürün bilgileri dolduruldu.');
    };

    const addPart = (part: any) => {
        setSelectedParts([...selectedParts, { id: Date.now(), originalId: part.id, name: part.name, price: Number(part.price), quantity: 1, isWarranty: false }]);
        setProductSearchQuery('');
        setShowProductSuggestions(false);
    };

    const removePart = (id: string | number) => setSelectedParts(selectedParts.filter(p => p.id !== id));
    const togglePartWarranty = (id: string | number) => setSelectedParts(selectedParts.map(p => p.id === id ? { ...p, isWarranty: !p.isWarranty } : p));

    const totalParts = selectedParts.reduce((acc, curr) => acc + (curr.isWarranty ? 0 : curr.price * curr.quantity), 0);
    const laborCost = serviceSettings?.[vehicleType] || (isMotorized(vehicleType) ? 750 : 350);
    const activeLaborCost = isLaborWarranty ? 0 : laborCost;
    const totalCost = (totalParts + activeLaborCost) * 1.2;

    const handleSave = async (status: 'Beklemede' | 'İşlemde' | 'Tamamlandı') => {
        if (!formData.customerName) {
            showError('Hata', 'Lütfen müşteri adını giriniz.');
            return;
        }
        try {
            let finalCustomerId = formData.customerId;
            if (!finalCustomerId) {
                const cRes = await fetch('/api/customers', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: formData.customerName, phone: formData.phone, category: 'Bireysel' })
                });
                const cData = await cRes.json();
                if (cData.success) finalCustomerId = cData.customer.id;
                else throw new Error('Müşteri oluşturulamadı: ' + cData.error);
            }
            const subTotal = totalParts + activeLaborCost;
            const taxTotal = subTotal * 0.20;
            const sRes = await fetch('/api/services', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerId: finalCustomerId,
                    plate: isMotorized(vehicleType) ? formData.plate : formData.serialNumber,
                    vehicleBrand: formData.brand,
                    vehicleSerial: formData.serialNumber,
                    vehicleType,
                    checklist: formData.checklist,
                    km: formData.km,
                    nextKm: formData.nextKm,
                    nextDate: formData.nextDate,
                    notes: formData.notes,
                    items: selectedParts.map(p => ({ ...p, type: 'Part' })),
                    totalAmount: totalCost,
                    subTotal: subTotal,
                    taxTotal: taxTotal,
                    status: status,
                    appointmentDate: formData.appointmentDate || null
                })
            });
            const sData = await sRes.json();
            if (sData.success) {
                if (status === 'Tamamlandı') {
                    showSuccess('İş Emri Açıldı', 'Servis kaydı başarıyla oluşturuldu. Ödeme sayfasına yönlendiriliyorsunuz...');
                    setTimeout(() => {
                        const desc = `${formData.plate ? formData.plate + ' - ' : ''}Servis Hizmeti`;
                        router.push(`/payment?amount=${totalCost.toFixed(0)}&title=${encodeURIComponent(desc)}&ref=SRV-${sData.service.id}&customerId=${finalCustomerId}`);
                    }, 1500);
                } else {
                    showSuccess('Kayıt Başarılı', status === 'Beklemede' ? 'Randevu başarıyla oluşturuldu.' : 'Servis iş emri atölyeye alındı.');
                    setTimeout(() => router.push('/service'), 1000);
                }
            } else showError('Hata', 'Servis kaydı oluşturulamadı: ' + sData.error);
        } catch (error: any) {
            console.error(error);
            showError('Hata', error.message || 'Bir hata oluştu');
        }
    };

    const textMain = isLight ? 'text-slate-900' : 'text-white';
    const textMuted = isLight ? 'text-slate-500' : 'text-slate-400';
    const cardBg = isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#111827] border-white/5';
    const inputBg = isLight ? 'bg-slate-50 border-slate-200 focus:border-blue-500 hover:bg-white text-slate-900 placeholder:text-slate-400 shadow-sm' : 'bg-white/[0.02] border-white/10 focus:border-blue-500/50 hover:bg-white/[0.04] text-white placeholder:text-white/20 shadow-inner';
    const pageBg = isLight ? 'min-h-screen bg-[#f8fafc]' : 'min-h-screen bg-[#030712]';
    const dropdownBg = isLight ? 'bg-white border-slate-200 shadow-lg' : 'bg-[#1f2937] border-white/10 shadow-2xl';

    return (
        <div data-pos-theme={theme} className={`${pageBg} p-4 sm:p-8 font-sans transition-colors duration-300`}>
            {/* WARRANTY MODAL */}
            {warrantyModalOpen && (
                <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200 ${isLight ? 'bg-slate-900/40 backdrop-blur-sm' : 'bg-black/60 backdrop-blur-sm'}`}>
                    <div className={`w-full max-w-[500px] overflow-hidden rounded-3xl border shadow-2xl flex flex-col ${isLight ? 'bg-white border-slate-200' : 'bg-[#111827] border-white/10'}`}>
                        <div className={`p-6 border-b flex items-center gap-4 ${isLight ? 'border-slate-100' : 'border-white/5'}`}>
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm border ${isLight ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}><Shield size={24} /></div>
                            <div>
                                <h3 className={`text-[18px] font-black tracking-tight ${textMain}`}>Garanti Kaydı Tespit Edildi</h3>
                                <p className={`text-[12px] font-bold mt-0.5 uppercase tracking-wide opacity-50 ${textMuted}`}>Aktif koruma altındaki ürünler:</p>
                            </div>
                        </div>
                        <div className="p-4 space-y-2 max-h-[350px] overflow-y-auto custom-scrollbar">
                            {customerWarranties.map(w => (
                                <button key={w.id} onClick={() => handleWarrantySelect(w)} className={`w-full text-left p-4 rounded-2xl border transition-all flex justify-between items-center group ${isLight ? 'bg-slate-50 border-slate-100 hover:border-emerald-500 hover:bg-emerald-50' : 'bg-white/[0.02] border-white/5 hover:border-emerald-500/50 hover:bg-emerald-500/5'}`}>
                                    <div>
                                        <div className={`font-black text-[14px] ${textMain} group-hover:text-emerald-500 transition-colors`}>{w.productName}</div>
                                        <div className="flex items-center gap-3 mt-1.5">
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${textMuted} opacity-50`}>S/N: {w.serialNo}</span>
                                            <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
                                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Bitiş: {w.endDate}</span>
                                        </div>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity"><span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded-lg">SEÇ ↗</span></div>
                                </button>
                            ))}
                        </div>
                        <div className={`p-4 border-t ${isLight ? 'border-slate-100 bg-slate-50' : 'border-white/5 bg-white/[0.01]'}`}>
                            <button onClick={() => setWarrantyModalOpen(false)} className={`w-full py-3 rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all ${isLight ? 'text-slate-500 hover:text-slate-900' : 'text-white/40 hover:text-white'}`}>Kapat / Yeni Kayıt</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-[1400px] mx-auto space-y-8">
                {/* HEADER */}
                <header className="flex flex-col sm:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-5">
                        <button onClick={() => router.back()} className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${isLight ? 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'}`}><ArrowLeft size={20} /></button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className={`text-4xl font-black tracking-tighter ${textMain}`}>Servis Kabul</h1>
                                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] border ${isLight ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'}`}>TERM-01</span>
                            </div>
                            <p className={`text-[12px] font-bold uppercase tracking-[0.3em] mt-1 ${textMuted} opacity-40`}>Yeni İş Emri & Randevu Terminali</p>
                        </div>
                    </div>
                    <div className={`px-6 py-3 rounded-2xl border shadow-sm flex items-center gap-4 ${isLight ? 'bg-white border-slate-200' : 'bg-[#111827] border-white/5'}`}>
                        <div className="flex flex-col items-end">
                            <span className={`text-[13px] font-black tracking-wider ${textMain}`}>{new Date().toLocaleDateString('tr-TR')}</span>
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${textMuted}`}>{new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <Clock size={20} className="text-blue-500" />
                    </div>
                </header>

                <div className="flex flex-col xl:flex-row gap-8 items-start">
                    {/* LEFT CONTENT */}
                    <div className="w-full space-y-8 flex-1">
                        {/* CATEGORY & CUSTOMER */}
                        <section className={`rounded-3xl border p-8 relative overflow-hidden ${cardBg}`}>
                            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                                <div className="col-span-full mb-2">
                                    <label className={`text-[10px] font-black uppercase tracking-[0.2em] block mb-3 ${textMuted}`}>Hizmet Kategorisi Seçimi</label>
                                    <div className={`inline-flex p-1.5 rounded-2xl border ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-white/5 border-white/10'}`}>
                                        {(vehicleTypes?.length ? vehicleTypes : ['Motosiklet', 'Bisiklet']).map((t) => (
                                            <button key={t} onClick={() => setVehicleType(t)} className={`px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${vehicleType === t ? (isLight ? 'bg-white text-blue-600 shadow-md border border-slate-100' : 'bg-blue-600 text-white shadow-lg shadow-blue-600/20') : (isLight ? 'text-slate-400 hover:text-slate-600' : 'text-white/20 hover:text-white/60')}`}>
                                                <span className="text-lg">{t.toLowerCase().includes('moto') ? '🏍️' : t.toLowerCase().includes('bisiklet') ? '🚲' : t.toLowerCase().includes('beyaz') ? '🏠' : t.toLowerCase().includes('elektronik') ? '💻' : '🔧'}</span>
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="col-span-1 sm:col-span-2 space-y-2 relative">
                                    <label className={`text-[10px] font-black uppercase tracking-[0.2em] ml-1 ${textMuted}`}>Müşteri Seçimi / Ekleme</label>
                                    <div className="relative group">
                                        <input type="text" placeholder="Ad Soyad, Firma Ünvanı veya Telefon..." value={searchQuery} onChange={handleSearchChange} onFocus={() => searchQuery.length > 0 && setShowSuggestions(true)} onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} className={`w-full h-11 px-5 rounded-2xl border text-[13px] font-bold transition-all outline-none ${inputBg}`} />
                                        <Search size={16} className={`absolute right-4 top-1/2 -translate-y-1/2 ${textMuted} opacity-30`} />
                                        {isNewCustomer && searchQuery.length > 2 && <div className={`absolute right-12 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase bg-amber-500/20 text-amber-500 border border-amber-500/20`}>YENİ KAYIT</div>}
                                        {showSuggestions && filteredCustomers.length > 0 && (
                                            <div className={`absolute top-full left-0 right-0 mt-3 rounded-2xl overflow-hidden z-[50] ${dropdownBg} border shadow-2xl animate-in fade-in slide-in-from-top-2 duration-300`}>
                                                {filteredCustomers.map(c => (
                                                    <button key={c.id} onClick={() => selectCustomer(c)} className={`w-full p-4 flex justify-between items-center border-b last:border-0 transition-colors ${isLight ? 'hover:bg-slate-50 border-slate-100' : 'hover:bg-white/5 border-white/5'}`}>
                                                        <span className={`font-black text-[14px] tracking-tight ${textMain}`}>{c.name}</span>
                                                        <span className={`text-[11px] font-mono text-blue-500`}>{c.phone}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className={`text-[10px] font-black uppercase tracking-[0.2em] ml-1 ${textMuted}`}>İletişim Kanalları</label>
                                    <input type="text" placeholder="5xx xxx xx xx" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className={`w-full h-11 px-5 rounded-2xl border text-[13px] font-bold transition-all outline-none ${inputBg}`} />
                                </div>
                                {isMotorized(vehicleType) ? (
                                    <>
                                        <div className="space-y-2">
                                            <label className={`text-[10px] font-black uppercase tracking-[0.2em] ml-1 ${textMuted}`}>Araç Plakası</label>
                                            <input type="text" placeholder="34 Plaka..." value={formData.plate} onChange={e => setFormData({ ...formData, plate: e.target.value })} className={`w-full h-11 px-5 rounded-2xl border text-[15px] font-black uppercase tracking-widest transition-all outline-none ${inputBg}`} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className={`text-[10px] font-black uppercase tracking-[0.2em] ml-1 ${textMuted}`}>Kilometre</label>
                                            <input type="number" placeholder="KM" value={formData.km} onChange={e => setFormData({ ...formData, km: e.target.value })} className={`w-full h-11 px-5 rounded-2xl border text-[14px] font-black transition-all outline-none ${inputBg}`} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className={`text-[10px] font-black uppercase tracking-[0.2em] ml-1 ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>Bakım (Km)</label>
                                            <input type="number" placeholder="Hedef KM" value={formData.nextKm} onChange={e => setFormData({ ...formData, nextKm: e.target.value })} className={`w-full h-11 px-5 rounded-2xl border text-[14px] font-black transition-all outline-none ${isLight ? 'bg-blue-50/50 border-blue-100 text-blue-900' : 'bg-blue-500/5 border-blue-500/20 text-white'}`} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className={`text-[10px] font-black uppercase tracking-[0.2em] ml-1 ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>Bakım Tarihi</label>
                                            <input type="date" value={formData.nextDate} onChange={e => setFormData({ ...formData, nextDate: e.target.value })} className={`w-full h-11 px-5 rounded-2xl border text-[13px] font-black transition-all outline-none ${isLight ? 'bg-blue-50/50 border-blue-100 text-blue-900' : 'bg-blue-500/5 border-blue-500/20 text-white'}`} />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="col-span-1 sm:col-span-2 space-y-2">
                                            <label className={`text-[10px] font-black uppercase tracking-[0.2em] ml-1 ${textMuted}`}>Marka / Model Tanımı</label>
                                            <input type="text" placeholder="Cihaz detaylarını giriniz..." value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} className={`w-full h-11 px-5 rounded-2xl border text-[13px] font-bold transition-all outline-none ${inputBg}`} />
                                        </div>
                                        <div className="col-span-1 sm:col-span-2 space-y-2">
                                            <label className={`text-[10px] font-black uppercase tracking-[0.2em] ml-1 ${textMuted}`}>{vehicleType.toLowerCase().includes('bisiklet') ? 'Kadro No' : 'Seri Numarası'}</label>
                                            <input type="text" placeholder="S/N..." value={formData.serialNumber} onChange={e => setFormData({ ...formData, serialNumber: e.target.value })} className={`w-full h-11 px-5 rounded-2xl border text-[13px] font-bold transition-all outline-none ${inputBg}`} />
                                        </div>
                                    </>
                                )}
                                <div className="col-span-1 sm:col-span-2 space-y-2">
                                    <label className={`text-[10px] font-black uppercase tracking-[0.2em] ml-1 ${isLight ? 'text-amber-600' : 'text-amber-400'}`}>Randevu Takvimi</label>
                                    <div className="relative">
                                        <input type="datetime-local" value={formData.appointmentDate} onChange={e => setFormData({ ...formData, appointmentDate: e.target.value })} className={`w-full h-11 px-5 rounded-2xl border text-[13px] font-bold transition-all outline-none ${isLight ? 'bg-amber-50/50 border-amber-100 text-amber-900' : 'bg-amber-500/5 border-amber-500/20 text-white'}`} />
                                        <Clock size={16} className={`absolute right-4 top-1/2 -translate-y-1/2 ${isLight ? 'text-amber-500' : 'text-amber-400'} opacity-40`} />
                                    </div>
                                </div>
                                <div className="col-span-1 sm:col-span-2 flex items-center pt-6"><p className={`text-[11px] font-black italic uppercase leading-tight opacity-40 ${textMuted}`}>* Randevu girilen kayıtlar çalışan takvimine ve operasyon masasına otomotik işlenir.</p></div>
                            </div>
                        </section>

                        {/* CHECKLIST & PARTS GRID */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* CHECKLIST */}
                            <section className={`rounded-3xl border p-8 flex flex-col ${cardBg}`}>
                                <h2 className={`text-[12px] font-black uppercase tracking-[0.4em] mb-8 flex items-center gap-3 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`}><span className="w-10 h-1 rounded-full bg-current opacity-20"></span> Kontrol Listesi</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {currentChecklistItems.map((item, i) => (
                                        <button key={i} onClick={() => toggleChecklistItem(item)} className={`p-4 rounded-2xl border transition-all text-left flex items-center gap-4 group ${formData.checklist[item] ? (isLight ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-sm' : 'bg-emerald-500/10 border-emerald-500 text-emerald-400') : (isLight ? 'bg-white border-slate-100 text-slate-500 hover:border-slate-300' : 'bg-white/5 border-white/5 text-white/20 hover:text-white/40')}`}>
                                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all ${formData.checklist[item] ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-current opacity-20 group-hover:opacity-100'}`}>{formData.checklist[item] && <Check size={14} strokeWidth={4} />}</div>
                                            <span className="text-[13px] font-black tracking-tight">{item}</span>
                                        </button>
                                    ))}
                                </div>
                            </section>

                            {/* PARTS */}
                            <section className={`rounded-3xl border p-8 flex flex-col ${cardBg}`}>
                                <h2 className={`text-[12px] font-black uppercase tracking-[0.4em] mb-8 flex items-center gap-3 ${isLight ? 'text-blue-600' : 'text-blue-400'}`}><span className="w-10 h-1 rounded-full bg-current opacity-20"></span> Hızlı Parça Arama</h2>
                                <div className="relative mb-8">
                                    <input type="text" placeholder="Parça, Kod veya Barkod..." value={productSearchQuery} onChange={(e) => setProductSearchQuery(e.target.value)} onFocus={() => setShowProductSuggestions(true)} onBlur={() => setTimeout(() => setShowProductSuggestions(false), 200)} className={`w-full h-11 px-6 rounded-2xl border text-[13px] font-bold transition-all outline-none ${inputBg}`} />
                                    <Search size={18} className={`absolute right-4 top-1/2 -translate-y-1/2 ${textMuted} opacity-20`} />
                                    {showProductSuggestions && productSearchQuery.length > 0 && (
                                        <div className={`absolute top-full left-0 right-0 mt-3 rounded-2xl overflow-hidden z-[60] ${dropdownBg} border shadow-2xl animate-in fade-in slide-in-from-top-2 duration-300`}>
                                            {filteredProducts.length === 0 ? <div className="p-8 text-center text-xs font-black uppercase tracking-widest opacity-20">STOKTA BULUNAMADI</div> : filteredProducts.map(p => (
                                                <button key={p.id} onClick={() => addPart(p)} className={`w-full p-4 flex justify-between items-center border-b last:border-0 transition-colors ${isLight ? 'hover:bg-slate-50 border-slate-50' : 'hover:bg-white/5 border-white/5'}`}>
                                                    <div className="flex flex-col items-start gap-1"><span className={`font-black text-[14px] ${textMain}`}>{p.name}</span><span className={`text-[10px] font-black uppercase tracking-widest text-blue-500`}>{p.code} • {p.stock} STOK</span></div>
                                                    <span className={`font-black text-[14px] ${textMain}`}>₺{p.price.toLocaleString()}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 space-y-3">
                                    {selectedParts.map((part) => (
                                        <div key={part.id} className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all ${isLight ? 'bg-slate-50 border-slate-100 shadow-sm' : 'bg-white/[0.02] border-white/5 shadow-inner'}`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'}`}><Package size={18} /></div>
                                                <div><div className={`font-black text-[13px] ${textMain}`}>{part.name}</div>{part.isWarranty && <div className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-0.5">GARANTİ KAPSAMI</div>}</div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right"><div className={`font-black text-[14px] ${part.isWarranty ? 'opacity-30 line-through' : textMain}`}>₺{part.price.toLocaleString()}</div></div>
                                                <button onClick={() => removePart(part.id)} className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"><X size={14} /></button>
                                            </div>
                                        </div>
                                    ))}
                                    <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all ${isLight ? 'bg-blue-50 border-blue-100 shadow-sm' : 'bg-blue-500/10 border-blue-500/20 shadow-inner'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center"><Wrench size={18} /></div>
                                            <div><div className={`font-black text-[13px] ${isLight ? 'text-blue-900' : 'text-blue-100'}`}>Hizmet & İşçilik</div><div className="text-[9px] font-black text-blue-500 uppercase tracking-widest mt-0.5">{vehicleType} STANDART</div></div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`font-black text-[14px] ${isLaborWarranty ? 'opacity-30 line-through' : (isLight ? 'text-blue-900' : 'text-blue-400')}`}>₺{laborCost.toLocaleString()}</div>
                                            <button onClick={() => setIsLaborWarranty(!isLaborWarranty)} className={`text-[9px] font-black uppercase tracking-tighter ${isLaborWarranty ? 'text-emerald-500' : 'text-blue-400 hover:text-blue-200'}`}>{isLaborWarranty ? '[GARANTİLİ]' : 'GARANTİ KAPSAMI?'}</button>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>
                        <section className={`rounded-3xl border p-8 ${cardBg}`}>
                            <label className={`text-[10px] font-black uppercase tracking-[0.4em] block mb-4 ${textMuted}`}>Teknik Notlar & Müşteri Şikayeti</label>
                            <textarea rows={3} placeholder="Müşterinin belirttiği tüm teknik detayları buraya not alınız..." value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className={`w-full p-6 rounded-2xl border text-[13px] font-bold transition-all outline-none resize-none ${inputBg}`} />
                        </section>
                    </div>

                    {/* SUMMARY SIDEBAR */}
                    <div className="w-full xl:w-[400px] sticky top-8 space-y-6">
                        <div className={`rounded-[40px] border p-10 relative overflow-hidden flex flex-col ${isLight ? 'bg-white border-slate-200' : 'bg-[#111827] border-white/10 shadow-3xl'}`}>
                            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                            <h3 className={`text-[18px] font-black border-b pb-6 mb-8 uppercase tracking-widest ${textMain}`}>OPERASYON ÖZETİ</h3>
                            <div className="space-y-6">
                                <div className="flex justify-between items-center"><span className={`text-[12px] font-bold uppercase tracking-widest ${textMuted} opacity-50`}>PARÇA BEDELİ</span><span className={`text-[15px] font-black tracking-tight ${textMain}`}>₺{totalParts.toLocaleString()}</span></div>
                                <div className="flex justify-between items-center"><span className={`text-[12px] font-bold uppercase tracking-widest ${textMuted} opacity-50`}>HİZMET BEDELİ</span><span className={`text-[15px] font-black tracking-tight ${textMain}`}>₺{activeLaborCost.toLocaleString()}</span></div>
                                <div className="flex justify-between items-center pt-6 border-t border-dashed border-white/10">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">GENEL TOPLAM</span>
                                        <span className={`text-[42px] font-black tracking-tighter leading-none ${textMain}`}>₺{totalCost.toFixed(0).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-12 space-y-4">
                                <button onClick={() => handleSave('Tamamlandı')} className="w-full h-16 rounded-3xl bg-blue-600 text-white text-[13px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-600/40 hover:scale-[1.02] active:scale-95 transition-all">HEMEN BİTİR & ÖDE</button>
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => handleSave('İşlemde')} className={`h-12 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${isLight ? 'border-slate-200 text-slate-800 hover:bg-slate-50' : 'border-white/10 text-white/60 hover:bg-white/5'}`}>ATÖLYEYE AL</button>
                                    <button onClick={() => handleSave('Beklemede')} className={`h-12 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${isLight ? 'border-slate-200 text-slate-800 hover:bg-slate-50' : 'border-white/10 text-white/60 hover:bg-white/5'}`}>RANDEVU YAP</button>
                                </div>
                            </div>
                        </div>
                        <div className={`p-6 rounded-3xl border flex items-center gap-4 ${isLight ? 'bg-blue-50 border-blue-100' : 'bg-blue-500/10 border-blue-500/20'}`}>
                            <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center shrink-0"><Info size={18} /></div>
                            <p className="text-[11px] font-black uppercase leading-relaxed text-blue-400 opacity-80">Ödeme adımında taksitlendirme ve cari hesap işlemleri yapılabilir.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ServiceAcceptancePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center flex-col gap-6 bg-[#030712]">
                <div className="w-20 h-20 border-8 border-white/5 border-t-blue-600 rounded-full animate-spin"></div>
                <span className="text-[13px] font-black text-white/20 uppercase tracking-[1em]">YÜKLENİYOR</span>
            </div>
        }>
            <ServiceAcceptanceContent />
        </Suspense>
    );
}
