
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useModal } from '@/contexts/ModalContext';

export default function InvoicedSalesPage() {
    const { showSuccess, showError } = useModal();
    // --- STATE ---
    const [invoiceType, setInvoiceType] = useState<'Satış Faturası' | 'Proforma' | 'İade Faturası'>('Satış Faturası');
    const [customerType, setCustomerType] = useState<'registered' | 'new' | 'supplier'>('registered');

    // Data States
    const [selectedEntity, setSelectedEntity] = useState('');
    const [newCustomerData, setNewCustomerData] = useState({ name: '', taxNo: '', address: '' });
    const [invoiceItems, setInvoiceItems] = useState<{ id: number, name: string, qty: number, price: number, taxRate: number }[]>([]);

    // UI Helpers
    const [tempItem, setTempItem] = useState({ name: '', qty: 1, price: 0, taxRate: 20 });

    const mockRegistered = ['Ahmet Yılmaz (Cari)', 'Caner Erkin (Cari)', 'Mehmet Öz (Cari)'];
    const mockSuppliers = ['Motul Otomotiv A.Ş.', 'Shimano Türkiye', 'Dadaş Motor'];

    // --- ACTIONS ---
    const addItem = () => {
        if (!tempItem.name || tempItem.price <= 0) return;
        setInvoiceItems([...invoiceItems, { ...tempItem, id: Date.now() }]);
        setTempItem({ name: '', qty: 1, price: 0, taxRate: 20 });
    };

    const removeItem = (id: number) => {
        setInvoiceItems(invoiceItems.filter(item => item.id !== id));
    };

    const calculateSubtotal = () => invoiceItems.reduce((acc, item) => acc + (item.qty * item.price), 0);
    const calculateTax = () => invoiceItems.reduce((acc, item) => acc + (item.qty * item.price * (item.taxRate / 100)), 0);
    const calculateGrandTotal = () => calculateSubtotal() + calculateTax();

    const handleSaveInvoice = () => {
        if (invoiceItems.length === 0) {
            showError('Sepet Boş', 'Lütfen sepeti doldurun.');
            return;
        }

        let target = customerType === 'new' ? newCustomerData.name : selectedEntity;
        if (!target) {
            showError('Eksik Bilgi', 'Lütfen müşteri/tedarikçi seçin veya bilgilerini girin.');
            return;
        }

        const log = `📝 FATURA OLUŞTURULDU\n\n` +
            `Tür: ${invoiceType}\n` +
            `Muhatap: ${target}\n` +
            `Kalem Sayısı: ${invoiceItems.length}\n` +
            `Toplam: ${calculateGrandTotal().toLocaleString()} ₺\n\n` +
            `Resmi kayıt oluşturuldu ve stoklar güncellendi.`;

        showSuccess('Başarılı', log);
        // Reset or Redirect
    };

    return (
        <div className="container" style={{ padding: '40px 20px' }}>

            {/* Header */}
            <header className="flex-between mb-8">
                <div>
                    <h1 className="text-gradient">Fatura Oluştur</h1>
                    <p className="text-muted">Resmi satış, iade ve proforma işlemleri</p>
                </div>
                <Link href="/" className="btn btn-outline" style={{ fontSize: '13px' }}>← Kasa Ekranına Dön</Link>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px' }}>

                {/* LEFT: FORM AREA */}
                <div className="flex-col gap-6">

                    {/* 1. FATURA AYARLARI */}
                    <div className="card glass grid-cols-3 gap-4">
                        <div className="flex-col gap-2">
                            <label className="text-muted" style={{ fontSize: '11px' }}>FATURA TÜRÜ</label>
                            <select value={invoiceType} onChange={(e: any) => setInvoiceType(e.target.value)} style={{ padding: '10px', background: 'var(--bg-deep)', border: '1px solid var(--border-light)', color: 'white', borderRadius: '6px' }}>
                                <option>Satış Faturası</option>
                                <option>Proforma</option>
                                <option>İade Faturası</option>
                            </select>
                        </div>
                        <div className="flex-col gap-2">
                            <label className="text-muted" style={{ fontSize: '11px' }}>TİP</label>
                            <select value={customerType} onChange={(e: any) => { setCustomerType(e.target.value); setSelectedEntity(''); }} style={{ padding: '10px', background: 'var(--bg-deep)', border: '1px solid var(--border-light)', color: 'white', borderRadius: '6px' }}>
                                <option value="registered">Kayıtlı Müşteri</option>
                                <option value="new">Yeni Müşteri (Kaydetme)</option>
                                <option value="supplier">Tedarikçiye Kes (İade vb.)</option>
                            </select>
                        </div>
                        <div className="flex-col gap-2">
                            <label className="text-muted" style={{ fontSize: '11px' }}>FATURA NO</label>
                            <input type="text" placeholder="GIB2026..." style={{ padding: '10px', background: 'var(--bg-deep)', border: '1px solid var(--border-light)', color: 'white', borderRadius: '6px' }} />
                        </div>
                    </div>

                    {/* 2. MÜŞTERİ SEÇİMİ / BİLGİSİ */}
                    <div className="card glass">
                        <h3 className="mb-4">Müşteri / Cari Bilgileri</h3>

                        {customerType === 'registered' && (
                            <select value={selectedEntity} onChange={(e) => setSelectedEntity(e.target.value)} style={{ width: '100%', padding: '12px', background: 'var(--bg-deep)', border: '1px solid var(--primary)', color: 'white', borderRadius: '8px' }}>
                                <option value="">Cari Seçiniz...</option>
                                {mockRegistered.map(c => <option key={c}>{c}</option>)}
                            </select>
                        )}

                        {customerType === 'supplier' && (
                            <select value={selectedEntity} onChange={(e) => setSelectedEntity(e.target.value)} style={{ width: '100%', padding: '12px', background: 'var(--bg-deep)', border: '1px solid var(--warning)', color: 'white', borderRadius: '8px' }}>
                                <option value="">Tedarikçi Seçiniz...</option>
                                {mockSuppliers.map(s => <option key={s}>{s}</option>)}
                            </select>
                        )}

                        {customerType === 'new' && (
                            <div className="grid-cols-2 gap-4">
                                <input type="text" placeholder="Müşteri Ad Soyad / Ünvan" value={newCustomerData.name} onChange={e => setNewCustomerData({ ...newCustomerData, name: e.target.value })} style={{ padding: '12px', background: 'var(--bg-deep)', border: '1px solid var(--border-light)', color: 'white', borderRadius: '8px' }} />
                                <input type="text" placeholder="Vergi No / TCKN" value={newCustomerData.taxNo} onChange={e => setNewCustomerData({ ...newCustomerData, taxNo: e.target.value })} style={{ padding: '12px', background: 'var(--bg-deep)', border: '1px solid var(--border-light)', color: 'white', borderRadius: '8px' }} />
                                <textarea placeholder="Fatura Adresi" value={newCustomerData.address} onChange={e => setNewCustomerData({ ...newCustomerData, address: e.target.value })} style={{ gridColumn: 'span 2', padding: '12px', background: 'var(--bg-deep)', border: '1px solid var(--border-light)', color: 'white', borderRadius: '8px', minHeight: '60px' }} />
                            </div>
                        )}
                    </div>

                    {/* 3. ÜRÜN KALEMLERİ */}
                    <div className="card glass">
                        <h3 className="mb-4">Ürünler & Kalemler</h3>

                        <div className="flex-center gap-2 mb-6" style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px' }}>
                            <input type="text" placeholder="Ürün Adı" value={tempItem.name} onChange={e => setTempItem({ ...tempItem, name: e.target.value })} style={{ flex: 2, padding: '10px', background: 'black', border: '1px solid #333', color: 'white', borderRadius: '4px' }} />
                            <input type="number" placeholder="Miktar" value={tempItem.qty} onChange={e => setTempItem({ ...tempItem, qty: parseFloat(e.target.value) })} style={{ width: '80px', padding: '10px', background: 'black', border: '1px solid #333', color: 'white', borderRadius: '4px' }} />
                            <input type="number" placeholder="Birim Fiyat" value={tempItem.price} onChange={e => setTempItem({ ...tempItem, price: parseFloat(e.target.value) })} style={{ width: '120px', padding: '10px', background: 'black', border: '1px solid #333', color: 'white', borderRadius: '4px' }} />
                            <select value={tempItem.taxRate} onChange={e => setTempItem({ ...tempItem, taxRate: parseInt(e.target.value) })} style={{ padding: '10px', background: 'black', border: '1px solid #333', color: 'white', borderRadius: '4px' }}>
                                <option value={20}>%20</option>
                                <option value={10}>%10</option>
                                <option value={0}>%0</option>
                            </select>
                            <button onClick={addItem} className="btn btn-primary" style={{ padding: '10px 20px' }}>Ekle</button>
                        </div>

                        <table style={{ width: '100%', textAlign: 'left', fontSize: '14px' }}>
                            <thead className="text-muted" style={{ fontSize: '11px', borderBottom: '1px solid var(--border-light)' }}>
                                <tr><th style={{ padding: '10px' }}>Ürün</th><th>Miktar</th><th>Birim Fiyat</th><th>KDV</th><th style={{ textAlign: 'right' }}>Toplam</th><th></th></tr>
                            </thead>
                            <tbody>
                                {invoiceItems.map((item) => (
                                    <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '15px 10px' }}>{item.name}</td>
                                        <td>{item.qty}</td>
                                        <td>₺ {item.price.toLocaleString()}</td>
                                        <td>%{item.taxRate}</td>
                                        <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                                            ₺ {(item.qty * item.price * (1 + item.taxRate / 100)).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <button onClick={() => removeItem(item.id)} style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
                                        </td>
                                    </tr>
                                ))}
                                {invoiceItems.length === 0 && (
                                    <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Sepet boş. Ürün ekleyerek başlayın.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* RIGHT: SUMMARY AREA */}
                <div className="flex-col gap-6">
                    <div className="card glass" style={{ position: 'sticky', top: '20px', border: '1px solid var(--primary)' }}>
                        <h3 className="mb-6">Özet & Toplam</h3>

                        <div className="flex-col gap-3 mb-6" style={{ fontSize: '14px' }}>
                            <div className="flex-between"><span className="text-muted">Ara Toplam</span><span>₺ {calculateSubtotal().toLocaleString()}</span></div>
                            <div className="flex-between"><span className="text-muted">Toplam KDV</span><span>₺ {calculateTax().toLocaleString()}</span></div>
                            <div className="flex-between" style={{ borderTop: '1px solid #444', paddingTop: '15px', marginTop: '10px' }}>
                                <span style={{ fontSize: '18px', fontWeight: 'bold' }}>GENEL TOPLAM</span>
                                <b style={{ fontSize: '24px', color: 'var(--primary)' }}>₺ {calculateGrandTotal().toLocaleString()}</b>
                            </div>
                        </div>

                        <div className="flex-col gap-3">
                            <button onClick={handleSaveInvoice} className="btn btn-primary w-full" style={{ padding: '20px', fontSize: '18px', fontWeight: 'bold' }}>
                                {invoiceType.toUpperCase()} KAYDET
                            </button>
                            <Link href="/reports" className="btn btn-outline w-full" style={{ fontSize: '12px', border: 'none' }}>
                                📋 Geçmiş Faturaları Gör →
                            </Link>
                        </div>

                        <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                            <div className="text-muted" style={{ fontSize: '10px', marginBottom: '8px' }}>DİKKAT</div>
                            <p style={{ fontSize: '11px', lineHeight: '1.4' }}>
                                Bu işlem sonucunda resmi fatura kaydı oluşturulacaktır. {invoiceType === 'İade Faturası' ? 'Stoklar depoya geri girecektir.' : 'Stoklar sistemden düşülecektir.'}
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
