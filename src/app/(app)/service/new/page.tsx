"use client";

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useModal } from '@/contexts/ModalContext';
import { useApp } from '@/contexts/AppContext';
import { useInventory } from '@/contexts/InventoryContext';
import { useCRM } from '@/contexts/CRMContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useTheme } from '@/contexts/ThemeContext';
import { ArrowLeft, CheckCircle2, Info, Search, Shield, X, Package, Box, MapPin, Tool, Check, AlertTriangle, Bike, Car, Truck } from 'lucide-react';

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
        return !t.includes('bisiklet') && !t.includes('bicycle') && !t.includes('bike');
    };

    const [selectedParts, setSelectedParts] = useState<{ id: string | number, name: string, price: number, quantity: number, originalId: string | number, isWarranty?: boolean }[]>([]);
    const [isLaborWarranty, setIsLaborWarranty] = useState(false);

    // Product Search State
    const [productSearchQuery, setProductSearchQuery] = useState('');
    const [showProductSuggestions, setShowProductSuggestions] = useState(false);

    // Filter products
    const filteredProducts = useMemo(() => {
        if (!productSearchQuery) return [];
        const q = productSearchQuery.toLowerCase();
        return products.filter(p =>
            p.name.toLowerCase().includes(q) ||
            p.code.toLowerCase().includes(q) ||
            (p.barcode && p.barcode.toLowerCase().includes(q))
        ).slice(0, 10);
    }, [products, productSearchQuery]);

    // Form State
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
        serialNumber: ''
    });

    const [searchQuery, setSearchQuery] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isNewCustomer, setIsNewCustomer] = useState(false);

    // Warranty Selection State
    const [warrantyModalOpen, setWarrantyModalOpen] = useState(false);
    const [customerWarranties, setCustomerWarranties] = useState<any[]>([]);

    // Initial Pre-fill
    useEffect(() => {
        const cId = searchParams.get('customerId');
        const cName = searchParams.get('customerName');
        if (cId && cName) {
            setFormData(prev => ({ ...prev, customerId: cId, customerName: cName }));
            setSearchQuery(cName);
            const existing = customers.find(c => c.id.toString() === cId);
            if (existing) {
                setFormData(prev => ({ ...prev, phone: existing.phone || '' }));
            }
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

            if (wData.success && wData.warranties?.length > 0) {
                allWarrantyItems = [...wData.warranties];
            }

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
        setFormData({
            ...formData,
            customerId: customer.id,
            customerName: customer.name,
            phone: customer.phone || '',
            plate: ''
        });
        setIsNewCustomer(false);
        setShowSuggestions(false);
        checkCustomerWarranties(customer.id);
    };

    const handleWarrantySelect = (warranty: any) => {
        setFormData(prev => ({
            ...prev,
            brand: warranty.productName,
            serialNumber: warranty.serialNo,
            plate: warranty.serialNo
        }));
        setVehicleType('Bisiklet');
        setWarrantyModalOpen(false);
        showSuccess('Ürün Seçildi', 'Garanti kapsamındaki ürün bilgileri dolduruldu.');
    };

    const addPart = (part: any) => {
        setSelectedParts([...selectedParts, {
            id: Date.now(),
            originalId: part.id,
            name: part.name,
            price: Number(part.price),
            quantity: 1,
            isWarranty: false
        }]);
        setProductSearchQuery('');
        setShowProductSuggestions(false);
    };

    const removePart = (id: string | number) => {
        setSelectedParts(selectedParts.filter(p => p.id !== id));
    };

    const togglePartWarranty = (id: string | number) => {
        setSelectedParts(selectedParts.map(p =>
            p.id === id ? { ...p, isWarranty: !p.isWarranty } : p
        ));
    };

    const totalParts = selectedParts.reduce((acc, curr) => acc + (curr.isWarranty ? 0 : curr.price * curr.quantity), 0);
    const laborCost = isMotorized(vehicleType) ? (serviceSettings?.motoMaintenancePrice || 750) : (serviceSettings?.bikeMaintenancePrice || 350);
    const activeLaborCost = isLaborWarranty ? 0 : laborCost;
    const totalCost = (totalParts + activeLaborCost) * 1.2;

    const handleSave = async () => {
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
                    body: JSON.stringify({
                        name: formData.customerName,
                        phone: formData.phone,
                        category: 'Bireysel'
                    })
                });
                const cData = await cRes.json();
                if (cData.success) {
                    finalCustomerId = cData.customer.id;
                } else {
                    throw new Error('Müşteri oluşturulamadı: ' + cData.error);
                }
            }

            const sRes = await fetch('/api/services', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerId: finalCustomerId,
                    plate: isMotorized(vehicleType) ? formData.plate : formData.serialNumber,
                    vehicleBrand: formData.brand,
                    vehicleSerial: formData.serialNumber,
                    vehicleType,
                    km: formData.km,
                    nextKm: formData.nextKm,
                    nextDate: formData.nextDate,
                    notes: formData.notes,
                    items: selectedParts.map(p => ({ ...p, type: 'Part' })),
                    totalAmount: totalCost
                })
            });
            const sData = await sRes.json();

            if (sData.success) {
                showSuccess('İş Emri Açıldı', 'Servis kaydı başarıyla oluşturuldu. Ödeme sayfasına yönlendiriliyorsunuz...');
                setTimeout(() => {
                    const desc = `${formData.plate ? formData.plate + ' - ' : ''}Servis Hizmeti`;
                    router.push(`/payment?amount=${totalCost.toFixed(0)}&title=${encodeURIComponent(desc)}&ref=SRV-${sData.service.id}&customerId=${finalCustomerId}`);
                }, 1500);
            } else {
                showError('Hata', 'Servis kaydı oluşturulamadı: ' + sData.error);
            }

        } catch (error: any) {
            console.error(error);
            showError('Hata', error.message || 'Bir hata oluştu');
        }
    };

    const textMain = isLight ? 'text-slate-900' : 'text-white';
    const textMuted = isLight ? 'text-slate-500' : 'text-slate-400';
    const cardBg = isLight ? 'bg-white border-slate-200' : 'bg-[#0f172a] border-white/5';
    const inputBg = isLight ? 'bg-slate-50 border-slate-200 focus:border-blue-500 hover:bg-white text-slate-900 placeholder:text-slate-400' : 'bg-white/[0.02] border-white/10 focus:border-blue-500/50 hover:bg-white/[0.04] text-white placeholder:text-white/20';
    const pageBg = isLight ? 'min-h-screen bg-[#fafafa]' : 'min-h-screen bg-[#020617] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/40 via-[#020617] to-[#020617]';
    const dropdownBg = isLight ? 'bg-white border-slate-200 shadow-lg' : 'bg-[#1e293b] border-white/10 shadow-2xl';

    return (
        <div data-pos-theme={theme} className={`${pageBg} p-8 font-sans transition-colors duration-300`}>
            {/* WARRANTY MODAL */}
            {warrantyModalOpen && (
                <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm animate-in fade-in duration-200 ${isLight ? 'bg-slate-900/40' : 'bg-slate-900/60'}`}>
                    <div className={`w-full max-w-[500px] overflow-hidden rounded-[24px] border shadow-2xl flex flex-col ${isLight ? 'bg-white border-slate-200' : 'bg-[#0f172a] border-white/10'}`}>
                        <div className={`p-6 border-b flex items-center gap-4 ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
                            <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center text-xl shadow-sm border ${isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                                <Shield size={24} />
                            </div>
                            <div>
                                <h3 className={`text-[18px] font-bold ${textMain}`}>Garanti Kaydı Bulundu</h3>
                                <p className={`text-[13px] font-medium mt-0.5 ${textMuted}`}>Bu müşteriye ait aktif garantiler:</p>
                            </div>
                        </div>

                        <div className="p-6 space-y-3 max-h-[350px] overflow-y-auto custom-scrollbar">
                            {customerWarranties.map(w => (
                                <button key={w.id}
                                    onClick={() => handleWarrantySelect(w)}
                                    className={`w-full text-left p-4 rounded-[16px] border transition-all flex justify-between items-center group ${isLight ? 'bg-slate-50 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50' : 'bg-white/[0.02] border-white/5 hover:border-emerald-500/50 hover:bg-emerald-500/5'}`}
                                >
                                    <div>
                                        <div className={`font-bold text-[14px] ${textMain} group-hover:text-emerald-500 transition-colors`}>{w.productName}</div>
                                        <div className="flex items-center gap-3 mt-1.5">
                                            <span className={`text-[11px] font-semibold uppercase tracking-wide ${textMuted}`}>S/N: {w.serialNo}</span>
                                            <div className={`w-1 h-1 rounded-full ${isLight ? 'bg-slate-300' : 'bg-slate-700'}`}></div>
                                            <span className={`text-[11px] font-bold text-emerald-500 uppercase tracking-wide`}>Bitiş: {w.endDate}</span>
                                        </div>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className={`text-[11px] font-bold uppercase tracking-wide ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`}>Seç ↗</span>
                                    </div>
                                </button>
                            ))}
                        </div>

                        <div className={`p-4 border-t ${isLight ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-white/[0.02]'}`}>
                            <button onClick={() => setWarrantyModalOpen(false)} className={`w-full py-3 rounded-[12px] text-[12px] font-semibold transition-all ${isLight ? 'text-slate-600 bg-slate-200 hover:bg-slate-300' : 'text-slate-300 bg-white/10 hover:bg-white/20'}`}>
                                İptal / Yeni Ürün
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-[1240px] mx-auto space-y-6">

                {/* HEADER */}
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 border-b pb-6 border-slate-200 dark:border-white/10">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.back()} className={`w-10 h-10 rounded-[12px] flex items-center justify-center transition-all ${isLight ? 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 shadow-sm' : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10'}`}>
                            <ArrowLeft size={18} />
                        </button>
                        <div>
                            <h1 className={`text-[24px] font-bold tracking-tight ${textMain}`}>Yeni Servis Kabul</h1>
                            <p className={`text-[12px] font-semibold uppercase tracking-wide mt-1 ${textMuted}`}>İş Emri & Randevu Kaydı</p>
                        </div>
                    </div>
                    <div className={`px-4 py-2 rounded-[12px] flex items-center gap-3 border shadow-sm ${isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'}`}>
                        <Clock size={16} className={textMuted} />
                        <span className={`text-[13px] font-semibold ${textMain}`}>
                            {new Date().toLocaleDateString('tr-TR')} • {new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                </header>

                <div className="flex flex-col lg:flex-row gap-8 items-start">

                    {/* LEFT: FORM CONTENT */}
                    <div className="w-full space-y-8 flex-1">

                        {/* SECTION 1 */}
                        <section className={`rounded-[20px] border shadow-sm p-6 sm:p-8 relative overflow-hidden ${cardBg}`}>
                            <div className={`absolute top-0 right-0 p-6 text-[100px] font-black italic opacity-[0.03] leading-none pointer-events-none ${isLight ? 'text-slate-900' : 'text-white'}`}>01</div>
                            <h2 className={`text-[13px] font-bold uppercase tracking-wide mb-6 flex items-center gap-3 ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>
                                <span className={`w-6 h-1 rounded-full ${isLight ? 'bg-blue-600' : 'bg-blue-500'}`}></span>
                                Müşteri & Araç Bilgileri
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                {/* Toggle */}
                                <div className="col-span-full mb-2">
                                    <label className={`text-[11px] font-semibold uppercase tracking-wide block mb-2 ${textMuted}`}>Taşıt Türü</label>
                                    <div className={`inline-flex p-1 rounded-[999px] border shadow-sm ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#0f172a] border-white/10'}`}>
                                        {(vehicleTypes && vehicleTypes.length > 0 ? vehicleTypes : ['Motosiklet', 'Bisiklet']).map((t) => (
                                            <button
                                                key={t}
                                                onClick={() => setVehicleType(t)}
                                                className={`px-5 py-2 rounded-[999px] text-[12px] font-semibold transition-all flex items-center gap-2 ${vehicleType === t ? (isLight ? 'bg-white text-slate-900 shadow-sm' : 'bg-slate-800 text-white shadow-sm') : (isLight ? 'text-slate-500 hover:text-slate-700' : 'text-slate-400 hover:text-slate-200')}`}
                                            >
                                                <span className="opacity-70">{t === 'Motosiklet' ? '🏍️' : t === 'Bisiklet' ? '🚲' : '🛵'}</span>
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Inputs */}
                                <div className="space-y-1.5 relative">
                                    <label className={`text-[11px] font-semibold uppercase tracking-wide ml-1 ${textMuted}`}>Müşteri Seçimi</label>
                                    <div className="relative group">
                                        <input type="text" placeholder="Müşteri adını girin veya arayın..."
                                            value={searchQuery}
                                            onChange={handleSearchChange}
                                            onFocus={() => { if (searchQuery.length > 0) setShowSuggestions(true); }}
                                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                            className={`w-full h-[42px] px-4 rounded-[12px] border text-[13px] transition-all outline-none shadow-sm ${inputBg}`}
                                        />
                                        <Search size={16} className={`absolute right-3 top-1/2 -translate-y-1/2 ${textMuted} opacity-50`} />
                                        {isNewCustomer && searchQuery.length > 2 && (
                                            <div className={`absolute right-10 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-[6px] text-[10px] font-bold uppercase tracking-wide ${isLight ? 'bg-amber-100 text-amber-700' : 'bg-amber-500/20 text-amber-400'}`}>Yeni</div>
                                        )}
                                        {showSuggestions && filteredCustomers.length > 0 && (
                                            <div className={`absolute top-full left-0 right-0 mt-2 rounded-[16px] overflow-hidden z-[50] ${dropdownBg}`}>
                                                {filteredCustomers.map(c => (
                                                    <button key={c.id} onClick={() => selectCustomer(c)} className={`w-full p-4 flex justify-between items-center border-b last:border-0 transition-colors ${isLight ? 'hover:bg-slate-50 border-slate-100' : 'hover:bg-white/5 border-white/5'}`}>
                                                        <span className={`font-semibold text-[13px] ${textMain}`}>{c.name}</span>
                                                        <span className={`text-[12px] font-mono ${textMuted}`}>{c.phone}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className={`text-[11px] font-semibold uppercase tracking-wide ml-1 ${textMuted}`}>İletişim Numarası</label>
                                    <input type="text" placeholder="5xx xxx xx xx" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        className={`w-full h-[42px] px-4 rounded-[12px] border text-[13px] transition-all outline-none shadow-sm ${inputBg}`}
                                    />
                                </div>

                                {isMotorized(vehicleType) ? (
                                    <>
                                        <div className="space-y-1.5">
                                            <label className={`text-[11px] font-semibold uppercase tracking-wide ml-1 ${textMuted}`}>Araç Plakası</label>
                                            <input type="text" placeholder="34 MOT 123" value={formData.plate} onChange={e => setFormData({ ...formData, plate: e.target.value })}
                                                className={`w-full h-[42px] px-4 rounded-[12px] border text-[14px] font-mono uppercase tracking-wider transition-all outline-none shadow-sm ${inputBg}`}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className={`text-[11px] font-semibold uppercase tracking-wide ml-1 ${textMuted}`}>Mevcut Kilometre</label>
                                            <input type="number" placeholder="Örn: 12400" value={formData.km} onChange={e => setFormData({ ...formData, km: e.target.value })}
                                                className={`w-full h-[42px] px-4 rounded-[12px] border text-[13px] transition-all outline-none shadow-sm ${inputBg}`}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className={`text-[11px] font-semibold uppercase tracking-wide ml-1 ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>Gelecek Bakım (Km)</label>
                                            <input type="number" placeholder="Örn: 17400" value={formData.nextKm} onChange={e => setFormData({ ...formData, nextKm: e.target.value })}
                                                className={`w-full h-[42px] px-4 rounded-[12px] border text-[13px] transition-all outline-none shadow-sm ${isLight ? 'bg-blue-50/50 border-blue-200 focus:border-blue-500 text-slate-900 focus:bg-white' : 'bg-blue-500/5 border-blue-500/20 focus:border-blue-500/50 text-white'}`}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className={`text-[11px] font-semibold uppercase tracking-wide ml-1 ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>Gelecek Bakım (Tarih)</label>
                                            <input type="date" value={formData.nextDate} onChange={e => setFormData({ ...formData, nextDate: e.target.value })}
                                                className={`w-full h-[42px] px-4 rounded-[12px] border text-[13px] transition-all outline-none shadow-sm ${isLight ? 'bg-blue-50/50 border-blue-200 focus:border-blue-500 text-slate-900 focus:bg-white' : 'bg-blue-500/5 border-blue-500/20 focus:border-blue-500/50 text-white'}`}
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="space-y-1.5">
                                            <label className={`text-[11px] font-semibold uppercase tracking-wide ml-1 ${textMuted}`}>Marka / Model</label>
                                            <input type="text" placeholder="Örn: Carraro 710" value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })}
                                                className={`w-full h-[42px] px-4 rounded-[12px] border text-[13px] transition-all outline-none shadow-sm ${inputBg}`}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className={`text-[11px] font-semibold uppercase tracking-wide ml-1 ${textMuted}`}>Kadro / Seri No</label>
                                            <input type="text" placeholder="Örn: CR123456" value={formData.serialNumber} onChange={e => setFormData({ ...formData, serialNumber: e.target.value })}
                                                className={`w-full h-[42px] px-4 rounded-[12px] border text-[13px] transition-all outline-none shadow-sm ${inputBg}`}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        </section>

                        {/* SECTION 2 */}
                        <section className={`rounded-[20px] border shadow-sm p-6 sm:p-8 relative overflow-hidden ${cardBg}`}>
                            <div className={`absolute top-0 right-0 p-6 text-[100px] font-black italic opacity-[0.03] leading-none pointer-events-none ${isLight ? 'text-slate-900' : 'text-white'}`}>02</div>
                            <h2 className={`text-[13px] font-bold uppercase tracking-wide mb-6 flex items-center gap-3 ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>
                                <span className={`w-6 h-1 rounded-full ${isLight ? 'bg-blue-600' : 'bg-blue-500'}`}></span>
                                Parça & İşçilik Yönetimi
                            </h2>

                            <div className="space-y-8">
                                {/* Search */}
                                <div className={`relative pb-6 border-b ${isLight ? 'border-slate-200' : 'border-white/5'}`}>
                                    <label className={`text-[11px] font-semibold uppercase tracking-wide block mb-2 ml-1 ${textMuted}`}>Envanterden Parça Ekle</label>
                                    <div className="relative">
                                        <input type="text" placeholder="Parça adı, kod veya barkod ile arayın..."
                                            value={productSearchQuery}
                                            onChange={(e) => setProductSearchQuery(e.target.value)}
                                            onFocus={() => setShowProductSuggestions(true)}
                                            onBlur={() => setTimeout(() => setShowProductSuggestions(false), 200)}
                                            className={`w-full h-[48px] px-12 rounded-[12px] border text-[13px] transition-all outline-none shadow-sm ${inputBg}`}
                                        />
                                        <Search size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 ${textMuted}`} />

                                        {showProductSuggestions && productSearchQuery.length > 0 && (
                                            <div className={`absolute top-full left-0 right-0 mt-2 rounded-[16px] overflow-hidden z-[60] ${dropdownBg}`}>
                                                {filteredProducts.length === 0 ? (
                                                    <div className={`p-6 text-center text-[13px] font-medium ${textMuted}`}>Sonuç bulunamadı...</div>
                                                ) : (
                                                    filteredProducts.map(p => (
                                                        <button key={p.id} onClick={() => addPart(p)} className={`w-full p-4 flex justify-between items-center border-b last:border-0 transition-colors ${isLight ? 'hover:bg-slate-50 border-slate-100' : 'hover:bg-white/5 border-white/5'}`}>
                                                            <div className="flex flex-col items-start gap-1">
                                                                <span className={`font-semibold text-[14px] ${textMain}`}>{p.name}</span>
                                                                <span className={`text-[11px] font-medium uppercase tracking-wide ${textMuted}`}>{p.code} • Stok: {p.stock} adet</span>
                                                            </div>
                                                            <div className="flex flex-col items-end gap-1">
                                                                <span className={`font-bold text-[14px] ${textMain}`}>₺{p.price.toLocaleString()}</span>
                                                                <span className={`text-[10px] uppercase font-bold tracking-wide ${textMuted}`}>+KDV (%)</span>
                                                            </div>
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Item Rows */}
                                <div className="space-y-4">
                                    <label className={`text-[11px] font-semibold uppercase tracking-wide ml-1 ${textMuted}`}>Uygulanan Kalemler</label>
                                    <div className="space-y-3">
                                        {selectedParts.map((part) => (
                                            <div key={part.id} className={`p-4 rounded-[16px] border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${isLight ? 'bg-slate-50 border-slate-200 hover:bg-slate-100' : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.04]'}`}>
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center border shadow-sm ${isLight ? 'bg-white border-slate-200 text-slate-500' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                                                        <Package size={18} />
                                                    </div>
                                                    <div>
                                                        <div className={`font-semibold text-[14px] ${textMain}`}>{part.name}</div>
                                                        {part.isWarranty && <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-wide mt-0.5 flex items-center gap-1"><Shield size={10} /> Garanti Değişimi</div>}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                                                    <button onClick={() => togglePartWarranty(part.id)} className={`px-3 py-1.5 rounded-[8px] text-[11px] font-semibold uppercase tracking-wide border transition-all ${part.isWarranty ? (isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20') : (isLight ? 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50' : 'bg-transparent text-slate-400 border-slate-600 hover:bg-slate-800')}`}>
                                                        {part.isWarranty ? 'Garanti' : 'Garanti?'}
                                                    </button>
                                                    <div className="text-right min-w-[80px]">
                                                        <div className={`font-bold text-[14px] ${part.isWarranty ? 'text-slate-400 line-through decoration-red-500' : textMain}`}>₺{part.price.toLocaleString()}</div>
                                                        <div className={`text-[10px] font-semibold tracking-wide uppercase ${textMuted}`}>Net Fiyat</div>
                                                    </div>
                                                    <button onClick={() => removePart(part.id)} className={`w-8 h-8 rounded-[8px] flex items-center justify-center transition-all ${isLight ? 'text-slate-400 hover:bg-red-50 hover:text-red-500' : 'text-slate-500 hover:bg-red-500/10 hover:text-red-400'}`}>
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Labor Row */}
                                        <div className={`p-4 rounded-[16px] border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all sm:-mx-1 ${isLight ? 'bg-blue-50/50 border-blue-100 hover:bg-blue-50' : 'bg-blue-500/5 border-blue-500/10 hover:bg-blue-500/10'}`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center border shadow-sm ${isLight ? 'bg-white border-blue-200 text-blue-600' : 'bg-blue-900 border-blue-800 text-blue-400'}`}>
                                                    <Tool size={18} />
                                                </div>
                                                <div>
                                                    <div className={`font-semibold text-[14px] ${isLight ? 'text-blue-900' : 'text-blue-100'}`}>Standart {vehicleType} Bakım Hizmeti</div>
                                                    {isLaborWarranty && <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-wide mt-0.5 flex items-center gap-1"><Shield size={10} /> Garanti Kapsamı</div>}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                                                <button onClick={() => setIsLaborWarranty(!isLaborWarranty)} className={`px-3 py-1.5 rounded-[8px] text-[11px] font-semibold uppercase tracking-wide border transition-all ${isLaborWarranty ? (isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20') : (isLight ? 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50' : 'bg-blue-900 text-blue-300 border-blue-800 hover:bg-blue-800')}`}>
                                                    {isLaborWarranty ? 'Garanti' : 'Garanti?'}
                                                </button>
                                                <div className="text-right min-w-[80px]">
                                                    <div className={`font-bold text-[14px] ${isLaborWarranty ? 'text-blue-400/50 line-through decoration-red-500' : (isLight ? 'text-blue-700' : 'text-blue-400')}`}>₺{laborCost.toLocaleString()}</div>
                                                    <div className={`text-[10px] font-semibold tracking-wide uppercase ${isLight ? 'text-blue-600/70' : 'text-blue-400/70'}`}>İşçilik Bedeli</div>
                                                </div>
                                                <div className="w-8 h-8"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <label className={`text-[11px] font-semibold uppercase tracking-wide ml-1 block mb-2 ${textMuted}`}>Müşteri Şikayeti / Detaylı Notlar</label>
                                    <textarea rows={4} placeholder="Müşterinin belirttiği şikayetler veya teknik notlar..."
                                        value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                        className={`w-full p-4 rounded-[12px] border text-[13px] transition-all outline-none shadow-sm resize-none ${inputBg}`}
                                    />
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* RIGHT: SUMMARY CARD */}
                    <div className="w-full lg:w-[380px] xl:w-[420px] sticky top-8 shrink-0 space-y-6">
                        <div className={`rounded-[24px] border shadow-xl p-6 sm:p-8 relative overflow-hidden ${isLight ? 'bg-white border-slate-200' : 'bg-[#1a1c2e] border-white/10'}`}>
                            <div className={`hidden dark:block absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none`}></div>
                            <h3 className={`text-[16px] font-bold mb-6 border-b pb-4 ${isLight ? 'border-slate-200 text-slate-900' : 'border-white/10 text-white'}`}>İş Emri Özeti</h3>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center bg-transparent">
                                    <span className={`text-[13px] font-medium ${textMuted}`}>Parça Toplamı</span>
                                    <span className={`text-[14px] font-semibold ${textMain}`}>₺{totalParts.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center bg-transparent">
                                    <span className={`text-[13px] font-medium ${textMuted}`}>İşçilik Hizmeti</span>
                                    <span className={`text-[14px] font-semibold ${isLaborWarranty ? 'text-slate-400 line-through decoration-slate-500' : textMain}`}>₺{laborCost.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center bg-transparent">
                                    <span className={`text-[13px] font-medium ${textMuted}`}>KDV (%20)</span>
                                    <span className={`text-[14px] font-semibold ${textMain}`}>₺{(totalCost * 0.1666).toFixed(0).toLocaleString()}</span>
                                </div>

                                <div className={`pt-5 mt-5 border-t ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
                                    <div className="flex justify-between items-end">
                                        <span className={`text-[11px] font-bold uppercase tracking-wide ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>Genel Toplam</span>
                                        <div className="flex flex-col items-end">
                                            <div className={`text-[32px] font-bold tracking-tight leading-none ${textMain}`}>₺{totalCost.toFixed(0).toLocaleString()}</div>
                                            <div className={`text-[11px] font-semibold uppercase tracking-wide mt-1.5 ${textMuted}`}>Vergiler Dahil Fiyat</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 space-y-3">
                                <button onClick={handleSave} className={`w-full h-[48px] rounded-[12px] text-[13px] font-bold uppercase tracking-wide transition-all shadow-sm flex items-center justify-center gap-2 ${isLight ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}>
                                    <Check size={16} strokeWidth={3} />
                                    {isNewCustomer ? 'Kaydet ve Ödeme Al' : 'Oluştur ve Ödeme Al'}
                                </button>
                                <button onClick={() => router.back()} className={`w-full h-[44px] rounded-[12px] border text-[12px] font-bold uppercase tracking-wide transition-all ${isLight ? 'border-slate-200 text-slate-500 hover:bg-slate-50' : 'border-white/10 text-slate-400 hover:bg-white/5'}`}>
                                    İşlemi İptal Et
                                </button>
                            </div>
                        </div>

                        <div className={`p-4 rounded-[16px] border flex items-start gap-4 ${isLight ? 'bg-blue-50 border-blue-100' : 'bg-blue-500/10 border-blue-500/20'}`}>
                            <div className={`w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0 mt-0.5 ${isLight ? 'bg-white text-blue-500 shadow-sm' : 'bg-blue-500/20 text-blue-400'}`}>
                                <Info size={16} />
                            </div>
                            <p className={`text-[12px] leading-relaxed font-medium ${isLight ? 'text-blue-800' : 'text-blue-200'}`}>
                                Kaydet butonuna bastığınızda seçilen parçalar stoktan düşülür ve tahsilat için ödeme terminaline aktarılırsınız.
                            </p>
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
            <div className="min-h-screen flex items-center justify-center flex-col gap-4">
                <div className="w-10 h-10 border-4 border-slate-200 dark:border-slate-800 border-t-blue-600 rounded-full animate-spin"></div>
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Yükleniyor...</span>
            </div>
        }>
            <ServiceAcceptanceContent />
        </Suspense>
    );
}
