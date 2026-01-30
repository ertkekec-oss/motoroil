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
        ).slice(0, 20); // Limit results
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
        brand: '',      // New (Marka/Model for Bike)
        serialNumber: '' // New (Seri No for Bike)
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

            // Try to find phone if customer exists in context
            const existing = customers.find(c => c.id.toString() === cId);
            if (existing) {
                setFormData(prev => ({ ...prev, phone: existing.phone || '' }));
            }

            // Check warranties if pre-filled
            checkCustomerWarranties(cId);
        }
    }, [searchParams, customers]);

    // Filter customers
    const filteredCustomers = useMemo(() => {
        if (!searchQuery) return [];
        const q = searchQuery.toLowerCase();
        return customers.filter(c =>
            c.name.toLowerCase().includes(q) ||
            (c.phone && c.phone.includes(q))
        );
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

    // Mock function to fetch warranties (Replace with API call)
    const checkCustomerWarranties = (cId: string) => {
        if (cId) {
            // Mock data matching the CustomerDetailClient mock
            // We can assume every customer has a potential warranty for demo purposes or random
            const mockWarranties = [
                { id: 1, productName: 'Carraro Gravel G2', serialNo: 'CR12345678', endDate: '2026-01-15', status: 'Active' },
                { id: 2, productName: 'Shimano Fren Seti', serialNo: 'SH998877', endDate: '2025-06-20', status: 'Active' }
            ];
            // In real scenario, only set if length > 0
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

        // Check for warranties
        checkCustomerWarranties(customer.id);
    };

    const handleWarrantySelect = (warranty: any) => {
        setFormData(prev => ({
            ...prev,
            brand: warranty.productName,
            serialNumber: warranty.serialNo,
            plate: warranty.serialNo // Auto-fill plate/serial with warranty serial
        }));
        setVehicleType('bike'); // Assuming warranty items are bikes/parts usually
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
        <div className="container" style={{ padding: '40px 20px' }}>
            {/* WARRANTY SELECTION MODAL */}
            {warrantyModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="card glass animate-fade-in" style={{ width: '500px', background: '#1e1e1e', padding: '24px' }}>
                        <h3 style={{ borderBottom: '1px solid var(--primary)', paddingBottom: '10px', marginBottom: '20px' }}>🛡️ Garanti Kaydı Bulundu</h3>
                        <p className="text-muted" style={{ marginBottom: '20px' }}>Bu müşteriye ait aktif garantisi devam eden ürünler bulundu. İşlem yapmak istediğiniz ürünü seçin:</p>

                        <div className="flex-col gap-3" style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '20px' }}>
                            {customerWarranties.map(w => (
                                <div key={w.id}
                                    onClick={() => handleWarrantySelect(w)}
                                    style={{
                                        padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        transition: '0.2s'
                                    }}
                                    className="hover:bg-white/10"
                                >
                                    <div>
                                        <div style={{ fontWeight: 'bold', color: 'white' }}>{w.productName}</div>
                                        <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>Seri No: {w.serialNo}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 'bold', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 8px', borderRadius: '6px' }}>GARANTİLİ</div>
                                        <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>Biters: {w.endDate}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex-center gap-4">
                            <button
                                onClick={() => setWarrantyModalOpen(false)}
                                className="btn btn-outline"
                                style={{ flex: 1 }}
                            >
                                ➕ Farklı / Yeni Ürün Ekle
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex-between" style={{ marginBottom: '32px' }}>
                <div>
                    <a href="/service" className="text-muted" style={{ fontSize: '14px', marginBottom: '8px', display: 'inline-block' }}>← Servis Paneline Dön</a>
                    <h1 className="text-gradient">Yeni Servis Kaydı</h1>
                </div>
                <div className="flex-center gap-4">
                    <span className="text-muted">Tarih: {new Date().toLocaleDateString('tr-TR')}</span>
                    <div className="card" style={{ padding: '8px 16px', background: 'var(--bg-card)' }}>
                        Fiş No: #SRV-NEW
                    </div>
                </div>
            </div>

            <div className="grid-cols-3" style={{ gridTemplateColumns: '2fr 1fr', alignItems: 'start' }}>

                {/* LEFT COLUMN: Input Forms */}
                <div className="flex-col gap-4">

                    {/* 1. Müşteri ve Araç Bilgileri */}
                    <div className="card glass" style={{ overflow: 'visible' }}> {/* Overflow visible for dropdown */}
                        <h3 style={{ marginBottom: '20px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
                            1. Müşteri Seçimi & Araç
                        </h3>

                        <div className="flex-center gap-4" style={{ marginBottom: '24px', justifyContent: 'flex-start' }}>
                            <button onClick={() => setVehicleType('moto')} className={`btn ${vehicleType === 'moto' ? 'btn-primary' : 'btn-outline'}`} style={{ width: '150px' }}>🏍️ Motosiklet</button>
                            <button onClick={() => setVehicleType('bike')} className={`btn ${vehicleType === 'bike' ? 'btn-primary' : 'btn-outline'}`} style={{ width: '150px' }}>🚲 Bisiklet</button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

                            {/* MÜŞTERİ ARAMA ALANI (Autocomplete) */}
                            <div className="flex-col gap-2" style={{ position: 'relative' }}>
                                <label className="text-muted" style={{ fontSize: '12px' }}>MÜŞTERİ ADI / ÜNVANI</label>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <input
                                        type="text"
                                        placeholder="Müşteri Ara veya Yeni Yaz..."
                                        value={searchQuery}
                                        onChange={handleSearchChange}
                                        onFocus={() => { if (searchQuery.length > 0) setShowSuggestions(true); }}
                                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                        style={{ background: 'var(--bg-deep)', border: isNewCustomer ? '1px solid var(--secondary)' : '1px solid var(--success)', padding: '12px', borderRadius: '8px', color: 'white', width: '100%' }}
                                    />
                                    {isNewCustomer && searchQuery.length > 2 && (
                                        <span style={{ position: 'absolute', right: '12px', fontSize: '10px', background: 'var(--secondary)', color: 'black', padding: '2px 6px', borderRadius: '4px' }}>YENİ KAYIT</span>
                                    )}
                                </div>

                                {/* Arama Sonuçları Dropdown */}
                                {showSuggestions && filteredCustomers.length > 0 && (
                                    <div style={{
                                        position: 'absolute', top: '100%', left: 0, right: 0,
                                        background: '#1e1e1e', border: '1px solid var(--border-light)',
                                        borderRadius: '8px', zIndex: 50, maxHeight: '200px', overflowY: 'auto',
                                        boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                                    }}>
                                        {filteredCustomers.map(c => (
                                            <div
                                                key={c.id}
                                                onClick={() => selectCustomer(c)}
                                                style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}
                                                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <span>{c.name}</span>
                                                <span className="text-muted" style={{ fontSize: '12px' }}>{c.phone}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex-col gap-2">
                                <label className="text-muted" style={{ fontSize: '12px' }}>TELEFON</label>
                                <input type="text" placeholder="5XX XXX XX XX"
                                    value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    style={{ background: 'var(--bg-deep)', border: '1px solid var(--border-light)', padding: '12px', borderRadius: '8px', color: 'white', width: '100%' }} />
                            </div>

                            {/* Plaka / KM */}
                            {vehicleType === 'moto' ? (
                                <>
                                    <div className="flex-col gap-2">
                                        <label className="text-muted" style={{ fontSize: '12px' }}>PLAKA</label>
                                        <input type="text" placeholder="34 ABC 123"
                                            value={formData.plate} onChange={e => setFormData({ ...formData, plate: e.target.value })}
                                            style={{ background: 'var(--bg-deep)', border: '1px solid var(--border-light)', padding: '12px', borderRadius: '8px', color: 'white', width: '100%' }} />
                                    </div>
                                    <div className="flex-col gap-2">
                                        <label className="text-muted" style={{ fontSize: '12px' }}>KM SAYAÇ</label>
                                        <input type="number" placeholder="Örn: 24500"
                                            value={formData.km} onChange={e => setFormData({ ...formData, km: e.target.value })}
                                            style={{ background: 'var(--bg-deep)', border: '1px solid var(--border-light)', padding: '12px', borderRadius: '8px', color: 'white', width: '100%' }} />
                                    </div>
                                    <div className="flex-col gap-2">
                                        <label className="text-muted" style={{ fontSize: '12px' }}>GELECEK BAKIM (KM)</label>
                                        <input type="number" placeholder="Örn: 34500"
                                            value={formData.nextKm} onChange={e => setFormData({ ...formData, nextKm: e.target.value })}
                                            style={{ background: 'var(--bg-deep)', border: '1px solid var(--primary)', padding: '12px', borderRadius: '8px', color: 'white', width: '100%' }} />
                                    </div>
                                    <div className="flex-col gap-2">
                                        <label className="text-muted" style={{ fontSize: '12px' }}>GELECEK BAKIM (TARİH)</label>
                                        <input type="date"
                                            value={formData.nextDate} onChange={e => setFormData({ ...formData, nextDate: e.target.value })}
                                            style={{ background: 'var(--bg-deep)', border: '1px solid var(--primary)', padding: '12px', borderRadius: '8px', color: 'white', width: '100%' }} />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex-col gap-2">
                                        <label className="text-muted" style={{ fontSize: '12px' }}>MARKA / MODEL (Bisiklet)</label>
                                        <input type="text" placeholder="Örn: Carraro Gravel"
                                            value={formData.brand}
                                            onChange={e => setFormData({ ...formData, brand: e.target.value })}
                                            style={{ background: 'var(--bg-deep)', border: '1px solid var(--border-light)', padding: '12px', borderRadius: '8px', color: 'white', width: '100%' }} />
                                    </div>
                                    <div className="flex-col gap-2">
                                        <label className="text-muted" style={{ fontSize: '12px' }}>SERİ NO (Kadro No)</label>
                                        <input type="text" placeholder="Örn: CR12345678"
                                            value={formData.serialNumber}
                                            onChange={e => setFormData({ ...formData, serialNumber: e.target.value })}
                                            style={{ background: 'var(--bg-deep)', border: '1px solid var(--border-light)', padding: '12px', borderRadius: '8px', color: 'white', width: '100%' }} />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* 2. Servis İşlemleri ve Parçalar */}
                    <div className="card glass">
                        <div style={{ marginBottom: '20px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
                            <div className="flex-between">
                                <h3>2. Parça & İşçilik Ekle</h3>
                                <div style={{ fontSize: '11px', color: '#888' }}>
                                    Envanterden arama yapın
                                </div>
                            </div>

                            {/* Envanter Arama Alanı */}
                            <div style={{ position: 'relative', marginTop: '12px' }}>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <div style={{ position: 'relative', flex: 1 }}>
                                        <input
                                            type="text"
                                            placeholder="Parça Adı, Barkod veya Stok Kodu ile Ara..."
                                            value={productSearchQuery}
                                            onChange={(e) => setProductSearchQuery(e.target.value)}
                                            onFocus={() => setShowProductSuggestions(true)}
                                            onBlur={() => setTimeout(() => setShowProductSuggestions(false), 200)} // Delay for click
                                            style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--bg-hover)', color: 'white', border: '1px solid var(--border-light)' }}
                                        />
                                        <span style={{ position: 'absolute', right: '12px', top: '12px', fontSize: '14px', opacity: 0.5 }}>🔍</span>
                                    </div>
                                </div>

                                {/* Arama Sonuçları Dropdown */}
                                {showProductSuggestions && productSearchQuery.length > 0 && (
                                    <div style={{
                                        position: 'absolute', top: '100%', left: 0, right: 0,
                                        background: '#1e1e1e', border: '1px solid var(--border-light)',
                                        borderRadius: '8px', zIndex: 60, maxHeight: '300px', overflowY: 'auto',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)', marginTop: '4px'
                                    }}>
                                        {filteredProducts.length === 0 ? (
                                            <div style={{ padding: '16px', color: '#888', textAlign: 'center', fontSize: '13px' }}>Ürün bulunamadı.</div>
                                        ) : (
                                            filteredProducts.map(p => (
                                                <div
                                                    key={p.id}
                                                    onClick={() => addPart(p)}
                                                    style={{
                                                        padding: '12px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)',
                                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                                    }}
                                                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                                >
                                                    <div className="flex-col">
                                                        <span style={{ fontWeight: '600' }}>{p.name}</span>
                                                        <span style={{ fontSize: '11px', color: '#888' }}>{p.code} • Stok: {p.stock}</span>
                                                    </div>
                                                    <div className="flex-col" style={{ alignItems: 'flex-end' }}>
                                                        <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>₺{p.price}</span>
                                                        <span style={{ fontSize: '10px', color: '#666' }}>+KDV</span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex-col gap-2" style={{ marginBottom: '24px' }}>
                            <label className="text-muted" style={{ fontSize: '12px' }}>NOTLAR / ŞİKAYET</label>
                            <textarea rows={3} placeholder="Müşterinin talebi..."
                                value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                style={{ background: 'var(--bg-deep)', border: '1px solid var(--border-light)', padding: '12px', borderRadius: '8px', color: 'white', width: '100%', resize: 'none' }} />
                        </div>

                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr className="text-muted" style={{ fontSize: '12px', textAlign: 'left' }}>
                                    <th style={{ paddingBottom: '12px' }}>KALEM ADI</th>
                                    <th style={{ paddingBottom: '12px', width: '80px' }}>MİKTAR</th>
                                    <th style={{ paddingBottom: '12px', width: '100px', textAlign: 'right' }}>FİYAT</th>
                                    <th style={{ width: '40px' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedParts.map((part) => (
                                    <tr key={part.id} style={{ borderTop: '1px solid var(--border-light)', opacity: part.isWarranty ? 0.7 : 1 }}>
                                        <td style={{ padding: '12px 0' }}>
                                            <div className="flex-col">
                                                <span>{part.name}</span>
                                                {part.isWarranty && <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 'bold' }}>🛡️ GARANTİ KAPSAMINDA</span>}
                                            </div>
                                        </td>
                                        <td>1</td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div className="flex-col" style={{ alignItems: 'flex-end' }}>
                                                <button
                                                    onClick={() => togglePartWarranty(part.id)}
                                                    style={{
                                                        background: 'none', border: '1px solid ' + (part.isWarranty ? '#10b981' : 'rgba(255,255,255,0.1)'),
                                                        padding: '2px 8px', borderRadius: '4px', fontSize: '10px', color: part.isWarranty ? '#10b981' : '#888',
                                                        marginBottom: '4px', cursor: 'pointer'
                                                    }}
                                                >
                                                    {part.isWarranty ? '✓ Garanti Seçili' : 'Garanti?'}
                                                </button>
                                                <span style={{ textDecoration: part.isWarranty ? 'line-through' : 'none', opacity: part.isWarranty ? 0.5 : 1 }}>
                                                    ₺ {part.price}
                                                </span>
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <button onClick={() => removePart(part.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '18px' }}>×</button>
                                        </td>
                                    </tr>
                                ))}

                                <tr style={{ borderTop: '1px solid var(--border-light)', background: 'rgba(255,255,255,0.02)', opacity: isLaborWarranty ? 0.7 : 1 }}>
                                    <td style={{ padding: '12px 0', color: 'var(--secondary)' }}>
                                        <div className="flex-col">
                                            <span>Standart {vehicleType === 'moto' ? 'Motosiklet' : 'Bisiklet'} Bakım Hizmeti</span>
                                            {isLaborWarranty && <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 'bold' }}>🛡️ GARANTİ KAPSAMINDA</span>}
                                        </div>
                                    </td>
                                    <td>1</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div className="flex-col" style={{ alignItems: 'flex-end' }}>
                                            <button
                                                onClick={() => setIsLaborWarranty(!isLaborWarranty)}
                                                style={{
                                                    background: 'none', border: '1px solid ' + (isLaborWarranty ? '#10b981' : 'rgba(255,255,255,0.1)'),
                                                    padding: '2px 8px', borderRadius: '4px', fontSize: '10px', color: isLaborWarranty ? '#10b981' : '#888',
                                                    marginBottom: '4px', cursor: 'pointer'
                                                }}
                                            >
                                                {isLaborWarranty ? '✓ Garanti Seçili' : 'Garanti?'}
                                            </button>
                                            <span style={{ textDecoration: isLaborWarranty ? 'line-through' : 'none', opacity: isLaborWarranty ? 0.5 : 1 }}>
                                                ₺ {laborCost}
                                            </span>
                                        </div>
                                    </td>
                                    <td></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                </div>

                {/* RIGHT COLUMN: Summary */}
                <div className="card" style={{ position: 'sticky', top: '20px', borderTop: '4px solid var(--primary)' }}>
                    <h3 style={{ marginBottom: '24px' }}>Hesap Özeti</h3>

                    <div className="flex-between" style={{ marginBottom: '12px' }}>
                        <span className="text-muted">Parça Toplam</span>
                        <span>₺ {totalParts}</span>
                    </div>
                    <div className="flex-between" style={{ marginBottom: '12px' }}>
                        <span className="text-muted">İşçilik</span>
                        <span style={{ textDecoration: isLaborWarranty ? 'line-through' : 'none' }}>₺ {laborCost}</span>
                    </div>
                    <div className="flex-between" style={{ marginBottom: '24px' }}>
                        <span className="text-muted">KDV (%20)</span>
                        <span>₺ {(totalCost * 0.2 - totalParts - activeLaborCost).toFixed(0)}</span>
                    </div>

                    <div className="flex-between" style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border-light)', fontSize: '24px', fontWeight: 'bold' }}>
                        <span>TOPLAM</span>
                        <span style={{ color: 'var(--primary)' }}>₺ {totalCost.toFixed(0)}</span>
                    </div>

                    <div className="flex-ol gap-2 mt-4">
                        <button onClick={handleSave} className="btn btn-primary w-full" style={{ padding: '16px' }}>
                            {isNewCustomer ? '🆕 KAYDET ve ÖDE' : '✅ KAYDET ve ÖDE'}
                        </button>
                        <button onClick={() => router.back()} className="btn btn-outline w-full" style={{ border: 'none' }}>
                            İptal
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default function ServiceAcceptancePage() {
    return (
        <Suspense fallback={<div className="container flex-center" style={{ height: '100vh', color: '#888' }}>Yükleniyor...</div>}>
            <ServiceAcceptanceContent />
        </Suspense>
    );
}
