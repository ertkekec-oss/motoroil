"use client";

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useModal } from '@/contexts/ModalContext';
import { useInventory } from '@/contexts/InventoryContext';
import { useCRM } from '@/contexts/CRMContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useTheme } from '@/contexts/ThemeContext';
import { ArrowLeft, Search, Shield, X, Package, Check, Info, Calendar } from 'lucide-react';

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
        const t = (type || '').toLowerCase();
        const automotiveKeywords = ['motor', 'moto', 'araç', 'otomobil', 'araba', 'kamyon', 'otobüs', 'atv', 'scooter'];
        const nonAutomotiveKeywords = ['bisiklet', 'bicycle', 'bike', 'beyaz eşya', 'elektronik', 'mobilya'];
        return automotiveKeywords.some(kw => t.includes(kw)) && !nonAutomotiveKeywords.some(kw => t.includes(kw));
    };

    const [selectedParts, setSelectedParts] = useState<{ id: string | number, name: string, price: number, quantity: number, originalId: string | number, isWarranty?: boolean }[]>([]);
    const [isLaborWarranty, setIsLaborWarranty] = useState(false);
    const [productSearchQuery, setProductSearchQuery] = useState('');
    const [showProductSuggestions, setShowProductSuggestions] = useState(false);

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
        return customers.filter(c => c.name.toLowerCase().includes(q) || (c.phone && c.phone.includes(q))).slice(0, 8);
    }, [customers, searchQuery]);

    const filteredProducts = useMemo(() => {
        if (!productSearchQuery) return [];
        const q = productSearchQuery.toLowerCase();
        return products.filter(p => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q) || (p.barcode && p.barcode.toLowerCase().includes(q))).slice(0, 10);
    }, [products, productSearchQuery]);

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
            if (wData.success && wData.warranties?.length > 0) {
                setCustomerWarranties(wData.warranties);
                setWarrantyModalOpen(true);
            }
        } catch (err) { console.error('Warranty check failed', err); }
    };

    const selectCustomer = (customer: any) => {
        setSearchQuery(customer.name);
        setFormData({ ...formData, customerId: customer.id, customerName: customer.name, phone: customer.phone || '' });
        setShowSuggestions(false);
        checkCustomerWarranties(customer.id);
    };

    const addPart = (part: any) => {
        setSelectedParts([...selectedParts, { id: Date.now(), originalId: part.id, name: part.name, price: Number(part.price), quantity: 1, isWarranty: false }]);
        setProductSearchQuery('');
        setShowProductSuggestions(false);
    };

    const laborCost = serviceSettings?.[vehicleType] || (isMotorized(vehicleType) ? 600 : 300);
    const activeLaborCost = isLaborWarranty ? 0 : laborCost;
    const subTotal = selectedParts.reduce((acc, curr) => acc + (curr.isWarranty ? 0 : curr.price * curr.quantity), 0) + activeLaborCost;
    const totalAmount = subTotal * 1.2;

    const handleSave = async (status: 'Beklemede' | 'İşlemde' | 'Tamamlandı') => {
        if (!formData.customerName) {
            showError('Eksik Bilgi', 'Lütfen müşteri bilgilerini tamamlayın.');
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
                else throw new Error(cData.error);
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
                    checklist: formData.checklist,
                    km: formData.km,
                    nextKm: formData.nextKm,
                    nextDate: formData.nextDate,
                    notes: formData.notes,
                    items: selectedParts.map(p => ({ ...p, type: 'Part' })),
                    totalAmount: totalAmount,
                    subTotal: subTotal,
                    taxTotal: subTotal * 0.20,
                    status: status,
                    appointmentDate: formData.appointmentDate || null
                })
            });
            const sData = await sRes.json();
            if (sData.success) {
                showSuccess('Kayıt Başarılı', 'Servis iş emri başarıyla oluşturuldu.');
                router.push(status === 'Tamamlandı' ? `/service/${sData.service.id}` : '/service');
            }
        } catch (error: any) { showError('Hata', error.message); }
    };

    // Enterprise Color System Tokens
    const bgApp = isLight ? 'bg-[#F7F8FA]' : 'bg-[#020617]';
    const bgMain = isLight ? 'bg-[#FFFFFF]' : 'bg-[#0f172a]';
    const bgMuted = isLight ? 'bg-[#F4F6F8]' : 'bg-slate-900/50';
    const borderMain = isLight ? 'border-[#E1E5EA]' : 'border-slate-800';
    const borderCard = isLight ? 'border-[#D9DEE5]' : 'border-slate-800';
    const borderInput = isLight ? 'border-[#D6DAE1]' : 'border-slate-800';
    const textMain = isLight ? 'text-[#111827]' : 'text-slate-100';
    const textSecondary = isLight ? 'text-[#4B5563]' : 'text-slate-400';
    const textMuted = isLight ? 'text-[#9CA3AF]' : 'text-slate-500';

    const inputStyle = `h-10 px-3 rounded-lg border text-sm transition-all focus:ring-2 focus:ring-[#2563EB]/20 outline-none w-full ${bgMain} ${borderInput} ${textMain}`;
    const labelStyle = `text-[11px] font-semibold uppercase tracking-wider mb-1.5 block ${textSecondary}`;

    return (
        <div className={`min-h-screen ${bgApp} p-6 font-sans transition-colors duration-300`}>
            {/* WARRANTY DETECTION MODAL */}
            {warrantyModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-sm">
                    <div className={`w-full max-w-md rounded-xl border p-6 shadow-2xl ${bgMain} ${borderCard}`}>
                        <div className="flex items-center gap-3 mb-6">
                            <Shield className="text-[#027A48] w-6 h-6" />
                            <h3 className={`text-lg font-semibold ${textMain}`}>Garanti Tespit Edildi</h3>
                        </div>
                        <div className="space-y-2 mb-8">
                            {customerWarranties.map(w => (
                                <button key={w.id} onClick={() => { setFormData({...formData, brand: w.productName, serialNumber: w.serialNo}); setWarrantyModalOpen(false); }} className={`w-full text-left p-4 rounded-lg border hover:border-[#2563EB] transition-all ${bgMuted} ${borderCard}`}>
                                    <div className={`font-semibold ${textMain}`}>{w.productName}</div>
                                    <div className={`text-xs mt-1 ${textSecondary}`}>S/N: {w.serialNo} • {w.endDate} bitiş</div>
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setWarrantyModalOpen(false)} className={`w-full py-2.5 rounded-lg text-sm font-medium ${isLight ? 'text-[#4B5563] hover:bg-[#F1F3F6]' : 'text-slate-400 hover:bg-slate-800'}`}>Kapat</button>
                    </div>
                </div>
            )}

            <div className="max-w-[1400px] mx-auto space-y-6">
                {/* HEADER */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.back()} className={`w-9 h-9 rounded-lg border flex items-center justify-center ${bgMain} ${borderMain} ${textSecondary} hover:bg-[#F1F3F6] transition-colors`}><ArrowLeft size={18} /></button>
                        <div>
                            <h1 className={`text-xl font-semibold tracking-tight ${textMain}`}>Yeni Servis Kabulü</h1>
                            <p className={`text-sm ${textSecondary}`}>İş emri giriş ve müşteri kayıt terminali.</p>
                        </div>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-[#EFF8FF] border-[#EFF8FF]`}>
                        <Calendar size={14} className="text-[#175CD3]" />
                        <span className={`text-xs font-semibold text-[#175CD3]`}>{new Date().toLocaleDateString('tr-TR')}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                    {/* LEFT PANEL: FORM */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* BASIC INFO SECTION */}
                        <div className={`p-6 rounded-xl border shadow-[0_1px_2px_rgba(16,24,40,0.04)] ${bgMain} ${borderCard}`}>
                            <div className="mb-6">
                                <label className={labelStyle}>Hizmet Kategorisi</label>
                                <div className="flex flex-wrap gap-2">
                                    {['Motosiklet', 'Bisiklet', 'Beyaz Eşya', 'Elektronik'].map(t => (
                                        <button key={t} onClick={() => setVehicleType(t)} className={`h-8 px-4 rounded-full text-xs font-semibold transition-all border ${vehicleType === t ? 'bg-[#2563EB] border-[#2563EB] text-white' : (isLight ? 'bg-[#F1F3F5] border-transparent text-[#4B5563] hover:border-[#D6DAE1]' : 'bg-slate-800 border-transparent text-slate-500 hover:border-slate-300')}`}>{t}</button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="md:col-span-2 relative">
                                    <label className={labelStyle}>Müşteri Ara / Kayıt</label>
                                    <div className="relative">
                                        <input type="text" value={searchQuery} onChange={handleSearchChange} placeholder="İsim veya telefon..." className={inputStyle} />
                                        <Search size={16} className={`absolute right-3 top-1/2 -translate-y-1/2 ${textMuted}`} />
                                    </div>
                                    {isNewCustomer && searchQuery.length > 2 && <div className="absolute right-10 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-md bg-[#FFFAEB] text-[#B54708] text-[10px] font-bold uppercase tracking-wider border border-[#FFFAEB]">YENİ</div>}
                                    {showSuggestions && filteredCustomers.length > 0 && (
                                        <div className={`absolute left-0 right-0 top-full mt-2 rounded-lg border shadow-xl z-50 overflow-hidden ${bgMain} ${borderCard}`}>
                                            {filteredCustomers.map(c => (
                                                <button key={c.id} onClick={() => selectCustomer(c)} className="w-full text-left p-3 hover:bg-[#F1F3F6] flex justify-between items-center transition-colors">
                                                    <span className={`font-semibold ${textMain}`}>{c.name}</span>
                                                    <span className={`text-xs ${textSecondary}`}>{c.phone}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="md:col-span-1">
                                    <label className={labelStyle}>Telefon</label>
                                    <input type="text" placeholder="5xx..." value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className={inputStyle} />
                                </div>
                                <div className="md:col-span-1">
                                    <label className={labelStyle}>Marka / Model</label>
                                    <input type="text" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} className={inputStyle} />
                                </div>

                                {isMotorized(vehicleType) ? (
                                    <>
                                        <div><label className={labelStyle}>Plaka</label><input type="text" value={formData.plate} onChange={e => setFormData({...formData, plate: e.target.value})} className={inputStyle} /></div>
                                        <div><label className={labelStyle}>Kilometre</label><input type="number" value={formData.km} onChange={e => setFormData({...formData, km: e.target.value})} className={inputStyle} /></div>
                                        <div><label className={labelStyle}>Gelecek Bakım</label><input type="number" value={formData.nextKm} onChange={e => setFormData({...formData, nextKm: e.target.value})} className={inputStyle} /></div>
                                        <div><label className={labelStyle}>Bakım Tarihi</label><input type="date" value={formData.nextDate} onChange={e => setFormData({...formData, nextDate: e.target.value})} className={inputStyle} /></div>
                                    </>
                                ) : (
                                    <div className="md:col-span-2"><label className={labelStyle}>Seri Numarası / S/N</label><input type="text" value={formData.serialNumber} onChange={e => setFormData({...formData, serialNumber: e.target.value})} className={inputStyle} /></div>
                                )}
                            </div>
                        </div>

                        {/* WORK & PARTS SECTION */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Checklist */}
                            <div className={`p-6 rounded-xl border shadow-[0_1px_2px_rgba(16,24,40,0.04)] ${bgMain} ${borderCard}`}>
                                <h3 className={`text-sm font-semibold mb-4 ${textMain}`}>Kontrol Listesi</h3>
                                <div className="grid grid-cols-1 gap-2">
                                    {["Genel Temizlik", "Lastik/Ayak Kontrolü", "Yağ Seviyesi", "Fren Testi"].map((item, i) => (
                                        <button key={i} onClick={() => setFormData(p => ({...p, checklist: {...p.checklist, [item]: !p.checklist[item]}}))} className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${formData.checklist[item] ? (isLight ? 'bg-[#E8F0FF] border-[#2563EB] text-[#2563EB]' : 'bg-blue-50/50 border-blue-500 text-blue-700') : (isLight ? 'bg-transparent border-[#EEF1F4] text-[#4B5563] hover:border-[#D6DAE1]' : 'bg-transparent border-slate-800 text-slate-500 hover:border-slate-200')}`}>
                                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${formData.checklist[item] ? 'bg-[#2563EB] border-[#2563EB] text-white' : 'border-[#D6DAE1]'}`}>{formData.checklist[item] && <Check size={10} strokeWidth={4} />}</div>
                                            <span className="text-xs font-medium">{item}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Parts Search */}
                            <div className={`p-6 rounded-xl border shadow-[0_1px_2px_rgba(16,24,40,0.04)] ${bgMain} ${borderCard}`}>
                                <h3 className={`text-sm font-semibold mb-4 ${textMain}`}>Parça & Malzeme</h3>
                                <div className="relative mb-4">
                                    <input type="text" placeholder="Stoktan ekle..." value={productSearchQuery} onChange={e => setProductSearchQuery(e.target.value)} onFocus={() => setShowProductSuggestions(true)} onBlur={() => setTimeout(() => setShowProductSuggestions(false), 200)} className={inputStyle} />
                                    {showProductSuggestions && filteredProducts.length > 0 && (
                                        <div className={`absolute left-0 right-0 top-full mt-1 border rounded-lg shadow-lg z-50 overflow-hidden ${bgMain} ${borderCard}`}>
                                            {filteredProducts.map(p => (
                                                <button key={p.id} onClick={() => addPart(p)} className="w-full text-left p-3 hover:bg-[#F1F3F6] flex justify-between items-center transition-colors">
                                                    <span className={textMain}>{p.name}</span>
                                                    <span className="text-[#2563EB] font-bold">₺{p.price}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2 max-h-[160px] overflow-y-auto">
                                    {selectedParts.map(p => (
                                        <div key={p.id} className={`flex items-center justify-between p-2 rounded-lg ${bgMuted}`}>
                                            <span className={`text-xs font-medium ${textMain}`}>{p.name}</span>
                                            <div className="flex items-center gap-3">
                                                <span className={`text-xs font-bold ${textMain}`}>₺{p.price * p.quantity}</span>
                                                <button onClick={() => setSelectedParts(prev => prev.filter(x => x.id !== p.id))} className={`${textMuted} hover:text-[#B42318]`}><X size={14}/></button>
                                            </div>
                                        </div>
                                    ))}
                                    <div className={`flex items-center justify-between p-2 rounded-lg border-2 border-dashed ${isLight ? 'border-[#EEF1F4] bg-[#F4F6F8]/30' : 'border-slate-800 bg-white/5'}`}>
                                        <div className="flex flex-col">
                                            <span className={`text-xs font-bold ${textMain}`}>Hizmet Bedeli</span>
                                            <span className="text-[10px] text-[#2563EB] uppercase tracking-tighter">Standart Bakım</span>
                                        </div>
                                        <span className={`text-xs font-bold ${textMain}`}>₺{laborCost}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* NOTES PANEL */}
                        <div className={`p-6 rounded-xl border shadow-[0_1px_2px_rgba(16,24,40,0.04)] ${bgMain} ${borderCard}`}>
                            <label className={labelStyle}>Teknik Notlar</label>
                            <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} rows={3} placeholder="Müşteri şikayeti veya teknik detaylar..." className={`${inputStyle} h-auto p-4 resize-none`} />
                        </div>
                    </div>

                    {/* RIGHT PANEL: ACTIONS */}
                    <div className="space-y-6">
                        <div className={`rounded-xl border p-6 flex flex-col items-center shadow-[0_1px_2px_rgba(16,24,40,0.04)] ${bgMain} ${borderCard}`}>
                            <div className="text-center w-full pb-6 border-b border-[#ECEFF3] dark:border-slate-800">
                                <span className={labelStyle}>TAHMİNİ TOPLAM</span>
                                <div className={`text-3xl font-bold tracking-tight ${textMain}`}>₺{totalAmount.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
                            </div>
                            <div className="w-full pt-6 space-y-3">
                                <button onClick={() => handleSave('İşlemde')} className="w-full h-11 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold shadow-sm transition-all">Atölyeye Al</button>
                                <button onClick={() => handleSave('Tamamlandı')} className={`w-full h-11 rounded-lg border text-sm font-semibold transition-all ${isLight ? 'bg-[#E9EDF2] border-[#D6DAE1] text-[#4B5563] hover:bg-[#DEE3EA]' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'}`}>Bitti & Ödeme Al</button>
                                <button onClick={() => handleSave('Beklemede')} className={`w-full h-11 rounded-lg border text-sm font-semibold transition-all ${isLight ? 'bg-[#E9EDF2] border-[#D6DAE1] text-[#4B5563] hover:bg-[#DEE3EA]' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'}`}>Randevu Yap</button>
                            </div>
                        </div>
                        
                        <div className={`p-4 rounded-xl border flex items-start gap-4 ${bgMuted} ${borderCard}`}>
                            <Info size={16} className="text-[#2563EB] shrink-0 mt-0.5" />
                            <p className="text-xs text-[#6B7280] leading-relaxed">Randevu girilen kayıtlar teknisyen takviminde otomatik olarak ayırılır.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ServiceAcceptancePage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#F7F8FA] text-slate-400">Yükleniyor...</div>}>
            <ServiceAcceptanceContent />
        </Suspense>
    );
}
