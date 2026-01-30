"use client";

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useModal } from '@/contexts/ModalContext';
import { useApp } from '@/contexts/AppContext';

function ServiceAcceptanceContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { showSuccess, showError } = useModal();
    const { customers, products, serviceSettings } = useApp();
    const [vehicleType, setVehicleType] = useState('moto'); // 'moto' or 'bike'

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
        ).slice(0, 10); // Limit results
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

    const checkCustomerWarranties = (cId: string) => {
        if (cId) {
            const mockWarranties = [
                { id: 1, productName: 'Carraro Gravel G2', serialNo: 'CR12345678', endDate: '2026-01-15', status: 'Active' },
                { id: 2, productName: 'Shimano Fren Seti', serialNo: 'SH998877', endDate: '2025-06-20', status: 'Active' }
            ];
            setCustomerWarranties(mockWarranties);
            setWarrantyModalOpen(true);
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
        setVehicleType('bike');
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
    const laborCost = vehicleType === 'moto' ? (serviceSettings?.motoMaintenancePrice || 750) : (serviceSettings?.bikeMaintenancePrice || 350);
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
                    plate: vehicleType === 'moto' ? formData.plate : formData.serialNumber,
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

    return (
        <div className="container p-8 max-w-[1400px] mx-auto min-h-screen">
            {/* WARRANTY MODAL */}
            {warrantyModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[99] flex items-center justify-center p-6 animate-in">
                    <div className="bg-[#1a1c2e] border border-white/10 rounded-[32px] p-8 w-full max-w-lg shadow-[0_32px_64px_rgba(0,0,0,0.8)]">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center text-2xl shadow-inner border border-success/20">🛡️</div>
                            <div>
                                <h3 className="text-xl font-black text-white">Garanti Kaydı Bulundu</h3>
                                <p className="text-white/40 text-sm font-medium">Bu müşteriye ait aktif garantiler:</p>
                            </div>
                        </div>

                        <div className="space-y-3 mb-8 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                            {customerWarranties.map(w => (
                                <button key={w.id}
                                    onClick={() => handleWarrantySelect(w)}
                                    className="w-full text-left p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-success/50 hover:bg-success/5 transition-all group relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity"><span className="text-success text-xs font-black uppercase tracking-widest">Seç ↗</span></div>
                                    <div className="font-black text-white group-hover:text-success transition-colors">{w.productName}</div>
                                    <div className="flex items-center gap-3 mt-1.5">
                                        <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">S/N: {w.serialNo}</span>
                                        <div className="w-1 h-1 rounded-full bg-white/10"></div>
                                        <span className="text-[10px] font-black text-success/60 uppercase tracking-widest capitalize">Bitiş: {w.endDate}</span>
                                    </div>
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-4">
                            <button onClick={() => setWarrantyModalOpen(false)} className="flex-1 py-4 rounded-2xl bg-white/5 text-white/40 font-black text-xs uppercase tracking-widest hover:text-white transition-all">İptal / Yeni Ürün</button>
                        </div>
                    </div>
                </div>
            )}

            {/* HEADER */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                <div className="space-y-1">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.back()} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">←</button>
                        <div>
                            <h1 className="text-4xl font-black text-white tracking-tight">Yeni Servis Kabul</h1>
                            <p className="text-white/30 font-bold text-sm ml-1 uppercase tracking-[0.2em]">Servis İş Emri Oluşturma</p>
                        </div>
                    </div>
                </div>
                <div className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex flex-col items-end">
                    <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">Tarih / Saat</span>
                    <span className="text-sm font-black text-white/80">{new Date().toLocaleDateString('tr-TR')} • {new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-12 items-start">

                {/* LEFT: FORM CONTENT */}
                <div className="space-y-10">

                    {/* SECTION 1: VEHICLE & CUSTOMER */}
                    <section className="bg-white/5 rounded-[40px] border border-white/10 p-10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-10 opacity-[0.03] text-9xl font-black italic pointer-events-none">01</div>
                        <h2 className="text-sm font-black text-primary uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                            <span className="w-8 h-[2px] bg-primary"></span>
                            1. Müşteri & Araç Bilgileri
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                            {/* Vehicle Type Switcher */}
                            <div className="col-span-full mb-4">
                                <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1 mb-3 block text-center">Taşıt Türü</label>
                                <div className="flex p-1.5 bg-black/40 rounded-2xl border border-white/5 w-fit mx-auto">
                                    <button
                                        onClick={() => setVehicleType('moto')}
                                        className={`px-12 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${vehicleType === 'moto' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-white/20 hover:text-white/40'}`}
                                    >
                                        🏍️ Motosiklet
                                    </button>
                                    <button
                                        onClick={() => setVehicleType('bike')}
                                        className={`px-12 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${vehicleType === 'bike' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-white/20 hover:text-white/40'}`}
                                    >
                                        🚲 Bisiklet
                                    </button>
                                </div>
                            </div>

                            {/* Customer Search */}
                            <div className="space-y-2 relative">
                                <label className="text-[11px] font-black text-white/40 uppercase tracking-widest ml-1">Müşteri Seçimi</label>
                                <div className="relative group">
                                    <input
                                        type="text"
                                        placeholder="Müşteri adını girin veya arayın..."
                                        value={searchQuery}
                                        onChange={handleSearchChange}
                                        onFocus={() => { if (searchQuery.length > 0) setShowSuggestions(true); }}
                                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                        className="w-full bg-black/40 border-2 border-white/5 rounded-2xl px-6 py-4 text-white font-bold placeholder:text-white/10 focus:border-primary/50 focus:bg-black/60 transition-all outline-none"
                                    />
                                    {isNewCustomer && searchQuery.length > 2 && (
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 px-2 py-1 bg-secondary/10 border border-secondary/20 rounded-md text-[9px] font-black text-secondary uppercase tracking-widest">Yeni</div>
                                    )}

                                    {/* Suggestions */}
                                    {showSuggestions && filteredCustomers.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-3 bg-[#1a1c2e] border border-white/10 rounded-3xl overflow-hidden z-[50] shadow-2xl animate-in">
                                            {filteredCustomers.map(c => (
                                                <button
                                                    key={c.id}
                                                    onClick={() => selectCustomer(c)}
                                                    className="w-full p-5 flex justify-between items-center hover:bg-white/5 border-b border-white/5 last:border-0 transition-colors"
                                                >
                                                    <span className="font-black text-white text-sm">{c.name}</span>
                                                    <span className="text-[10px] font-bold text-white/20 font-mono italic">{c.phone}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-white/40 uppercase tracking-widest ml-1">İletişim Numarası</label>
                                <input type="text" placeholder="5xx xxx xx xx"
                                    value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full bg-black/40 border-2 border-white/5 rounded-2xl px-6 py-4 text-white font-bold placeholder:text-white/10 focus:border-white/20 transition-all outline-none"
                                />
                            </div>

                            {/* Dynamic Fields */}
                            {vehicleType === 'moto' ? (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-white/40 uppercase tracking-widest ml-1">Araç Plakası</label>
                                        <input type="text" placeholder="34 MOT 123"
                                            value={formData.plate} onChange={e => setFormData({ ...formData, plate: e.target.value })}
                                            className="w-full bg-black/40 border-2 border-white/5 rounded-2xl px-6 py-4 text-white font-black placeholder:text-white/10 focus:border-white/20 transition-all outline-none uppercase font-mono tracking-widest"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-white/40 uppercase tracking-widest ml-1">Mevcut Kilometre</label>
                                        <input type="number" placeholder="Örn: 12400"
                                            value={formData.km} onChange={e => setFormData({ ...formData, km: e.target.value })}
                                            className="w-full bg-black/40 border-2 border-white/5 rounded-2xl px-6 py-4 text-white font-black placeholder:text-white/10 focus:border-white/20 transition-all outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-primary/60 uppercase tracking-widest ml-1">Gelecek Bakım (Km)</label>
                                        <input type="number" placeholder="Örn: 17400"
                                            value={formData.nextKm} onChange={e => setFormData({ ...formData, nextKm: e.target.value })}
                                            className="w-full bg-primary/5 border-2 border-primary/20 rounded-2xl px-6 py-4 text-white font-black placeholder:text-white/10 focus:border-primary/40 transition-all outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-primary/60 uppercase tracking-widest ml-1">Gelecek Bakım (Tarih)</label>
                                        <input type="date"
                                            value={formData.nextDate} onChange={e => setFormData({ ...formData, nextDate: e.target.value })}
                                            className="w-full bg-primary/5 border-2 border-primary/20 rounded-2xl px-6 py-4 text-white font-black transition-all outline-none"
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-white/40 uppercase tracking-widest ml-1">Marka / Model</label>
                                        <input type="text" placeholder="Örn: Carraro 710"
                                            value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })}
                                            className="w-full bg-black/40 border-2 border-white/5 rounded-2xl px-6 py-4 text-white font-bold placeholder:text-white/10 focus:border-white/20 transition-all outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-white/40 uppercase tracking-widest ml-1">Kadro / Seri No</label>
                                        <input type="text" placeholder="Örn: CR123456"
                                            value={formData.serialNumber} onChange={e => setFormData({ ...formData, serialNumber: e.target.value })}
                                            className="w-full bg-black/40 border-2 border-white/5 rounded-2xl px-6 py-4 text-white font-black placeholder:text-white/10 focus:border-white/20 transition-all outline-none"
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </section>

                    {/* SECTION 2: SERVICES & PARTS */}
                    <section className="bg-white/5 rounded-[40px] border border-white/10 p-10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-10 opacity-[0.03] text-9xl font-black italic pointer-events-none">02</div>
                        <h2 className="text-sm font-black text-primary uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                            <span className="w-8 h-[2px] bg-primary"></span>
                            2. Parça & İşçilik Yönetimi
                        </h2>

                        <div className="space-y-8">
                            {/* Product Search */}
                            <div className="relative pb-6 border-b border-white/5">
                                <label className="text-[11px] font-black text-white/20 uppercase tracking-widest ml-1 mb-3 block">Envanterden Parça Ekle</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Parça adı, kod veya barkod ile arayın..."
                                        value={productSearchQuery}
                                        onChange={(e) => setProductSearchQuery(e.target.value)}
                                        onFocus={() => setShowProductSuggestions(true)}
                                        onBlur={() => setTimeout(() => setShowProductSuggestions(false), 200)}
                                        className="w-full bg-white/5 border-2 border-white/5 rounded-[24px] px-14 py-5 text-white font-bold placeholder:text-white/20 focus:border-primary/40 focus:bg-white/[0.08] transition-all outline-none shadow-inner"
                                    />
                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl opacity-30">🔍</span>

                                    {showProductSuggestions && productSearchQuery.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-3 bg-[#1a1c2e] border border-white/20 rounded-[32px] overflow-hidden z-[60] shadow-[0_32px_128px_rgba(0,0,0,0.8)] animate-in">
                                            {filteredProducts.length === 0 ? (
                                                <div className="p-8 text-center text-white/20 italic font-bold">Sonuç bulunamadı...</div>
                                            ) : (
                                                filteredProducts.map(p => (
                                                    <button
                                                        key={p.id}
                                                        onClick={() => addPart(p)}
                                                        className="w-full p-6 flex justify-between items-center hover:bg-white/5 border-b border-white/5 last:border-0 group transition-all"
                                                    >
                                                        <div className="flex flex-col items-start gap-1">
                                                            <span className="font-black text-white text-[15px] group-hover:text-primary transition-colors">{p.name}</span>
                                                            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">{p.code} • Stok: {p.stock} adet</span>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-1">
                                                            <span className="font-black text-lg text-white">₺{p.price.toLocaleString()}</span>
                                                            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">+KDV (%)</span>
                                                        </div>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Added Items List */}
                            <div className="space-y-4">
                                <label className="text-[11px] font-black text-white/40 uppercase tracking-widest ml-1">Uygulanan Kalemler</label>
                                <div className="space-y-3">
                                    {/* Selected Parts */}
                                    {selectedParts.map((part) => (
                                        <div key={part.id} className="group p-5 rounded-[24px] bg-black/40 border border-white/5 flex items-center justify-between transition-all hover:bg-black/60">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-lg">📦</div>
                                                <div>
                                                    <div className="font-black text-white text-[15px]">{part.name}</div>
                                                    {part.isWarranty && <div className="text-[10px] font-black text-success uppercase tracking-widest mt-0.5">🛡️ Garanti Değişimi</div>}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-8">
                                                <button
                                                    onClick={() => togglePartWarranty(part.id)}
                                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${part.isWarranty ? 'bg-success/10 text-success border border-success/20' : 'bg-white/5 text-white/30 hover:text-white border border-transparent'}`}
                                                >
                                                    {part.isWarranty ? 'Garanti Aktif' : 'Garanti?'}
                                                </button>
                                                <div className="text-right min-w-[100px]">
                                                    <div className={`font-black text-[15px] ${part.isWarranty ? 'text-white/20 line-through decoration-danger' : 'text-white'}`}>₺{part.price.toLocaleString()}</div>
                                                    <div className="text-[9px] font-bold text-white/20 tracking-tighter uppercase">Net Birim Fiyat</div>
                                                </div>
                                                <button onClick={() => removePart(part.id)} className="w-8 h-8 rounded-full flex items-center justify-center text-white/20 hover:text-red-500 hover:bg-red-500/10 transition-all text-2xl font-light">&times;</button>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Labor Item (Static) */}
                                    <div className="group p-5 rounded-[24px] bg-primary/5 border border-primary/10 flex items-center justify-between transition-all hover:bg-primary/[0.08]">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-lg">🔧</div>
                                            <div>
                                                <div className="font-black text-white text-[15px]">Standart {vehicleType === 'moto' ? 'Motosiklet' : 'Bisiklet'} Bakım Hizmeti</div>
                                                {isLaborWarranty && <div className="text-[10px] font-black text-success uppercase tracking-widest mt-0.5">🛡️ Garanti Kapsamı</div>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-8">
                                            <button
                                                onClick={() => setIsLaborWarranty(!isLaborWarranty)}
                                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isLaborWarranty ? 'bg-success/10 text-success border border-success/20' : 'bg-white/5 text-white/30 hover:text-white border border-transparent'}`}
                                            >
                                                {isLaborWarranty ? 'Garanti Aktif' : 'Garanti?'}
                                            </button>
                                            <div className="text-right min-w-[100px]">
                                                <div className={`font-black text-[15px] ${isLaborWarranty ? 'text-white/20 line-through decoration-danger' : 'text-primary'}`}>₺{laborCost.toLocaleString()}</div>
                                                <div className="text-[9px] font-bold text-white/20 tracking-tighter uppercase">İşçilik Bedeli</div>
                                            </div>
                                            <div className="w-8 h-8"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Notes Area */}
                            <div className="space-y-4 pt-4">
                                <label className="text-[11px] font-black text-white/40 uppercase tracking-widest ml-1">Müşteri Şikayeti / Detaylı Notlar</label>
                                <textarea rows={4} placeholder="Müşterinin belirttiği şikayetler veya teknik notlar..."
                                    value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full bg-black/40 border-2 border-white/5 rounded-3xl px-6 py-5 text-white font-bold placeholder:text-white/10 focus:border-white/20 transition-all outline-none resize-none"
                                />
                            </div>
                        </div>
                    </section>
                </div>

                {/* RIGHT: SUMMARY STICKY */}
                <div className="sticky top-8 space-y-6">
                    <div className="bg-[#1a1c2e] rounded-[40px] border border-white/10 p-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                        <h3 className="text-lg font-black text-white mb-8 border-b border-white/5 pb-4">İş Emri Özeti</h3>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center group">
                                <span className="text-sm font-bold text-white/30 italic group-hover:text-white/50 transition-colors">Parça Toplamı</span>
                                <span className="font-black text-white">₺{totalParts.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center group">
                                <span className="text-sm font-bold text-white/30 italic group-hover:text-white/50 transition-colors">İşçilik Hizmeti</span>
                                <span className={`font-black ${isLaborWarranty ? 'text-white/20 line-through' : 'text-white'}`}>₺{laborCost.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center group">
                                <span className="text-sm font-bold text-white/30 italic group-hover:text-white/50 transition-colors">KDV (%20)</span>
                                <span className="font-black text-white">₺{(totalCost * 0.1666).toFixed(0).toLocaleString()}</span>
                            </div>

                            <div className="pt-6 mt-6 border-t border-white/10 flex flex-col gap-1">
                                <div className="flex justify-between items-end">
                                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Genel Toplam</span>
                                    <div className="flex flex-col items-end">
                                        <div className="text-4xl font-black text-white tracking-tighter">₺{totalCost.toFixed(0).toLocaleString()}</div>
                                        <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest leading-none mt-1">Herşey Dahil Fiyat</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 space-y-3">
                            <button onClick={handleSave} className="w-full py-5 rounded-[24px] bg-primary hover:bg-primary/90 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                                {isNewCustomer ? '➕ Kaydet ve Ödeme Al' : '✨ Oluştur ve Ödeme Al'}
                            </button>
                            <button onClick={() => router.back()} className="w-full py-4 rounded-2xl bg-white/5 text-white/40 font-black text-[11px] uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all">İşlemi İptal Et</button>
                        </div>
                    </div>

                    <div className="p-6 rounded-[32px] bg-white/[0.02] border border-white/5 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-xl">💡</div>
                        <p className="text-[11px] text-white/40 font-bold leading-relaxed italic">
                            Kaydet butonuna bastığınızda stoklar otomatik olarak düşülür ve ödeme sayfasına yönlendirilirsiniz.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default function ServiceAcceptancePage() {
    return (
        <Suspense fallback={<div className="container flex-center min-h-screen">
            <div className="animate-pulse flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/10 border-4 border-t-primary border-transparent animate-spin"></div>
                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Yükleniyor...</span>
            </div>
        </div>}>
            <ServiceAcceptanceContent />
        </Suspense>
    );
}
