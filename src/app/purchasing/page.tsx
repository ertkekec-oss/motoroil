
"use client";

import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useInventory } from '@/contexts/InventoryContext';
import { useCRM } from '@/contexts/CRMContext';
import { useModal } from '@/contexts/ModalContext';

export default function PurchasingPage() {
    // --- STATE ---
    const [view, setView] = useState('list'); // 'list' | 'new_invoice'
    const { showSuccess, showError } = useModal();

    const { products } = useInventory();
    const { suppliers } = useCRM();
    const [invoices, setInvoices] = useState<any[]>([]);

    useEffect(() => {
        // Fetch real invoices from DB
        fetch('/api/purchasing/list') // I'll create this or just fetch all suppliers? 
            .then(res => res.json())
            .then(data => { if (data.success) setInvoices(data.invoices); })
            .catch(e => console.error(e));
    }, []);

    const [formData, setFormData] = useState({
        supplierId: '',
        invNo: '',
        date: new Date().toISOString().split('T')[0],
        targetBranch: 'Merkez Depo',
        items: [] as { productId: string, name: string, qty: number, price: number }[]
    });

    const [tempItem, setTempItem] = useState({ productId: '', name: '', qty: 1, price: 0 });

    // --- ACTIONS ---
    const addItem = () => {
        if (!tempItem.name) return;
        setFormData({
            ...formData,
            items: [...formData.items, tempItem]
        });
        setTempItem({ productId: '', name: '', qty: 1, price: 0 });
    };

    const removeItem = (index: number) => {
        const newItems = [...formData.items];
        newItems.splice(index, 1);
        setFormData({ ...formData, items: newItems });
    };

    const calculateTotal = () => {
        return formData.items.reduce((acc, item) => acc + (item.qty * item.price), 0);
    };

    const handleSaveInvoice = async () => {
        if (!formData.supplierId || formData.items.length === 0) {
            showError('Eksik Bilgi', 'Lütfen tedarikçi seçin ve en az bir ürün ekleyin.');
            return;
        }

        const totalAmount = calculateTotal() * 1.2; // Including VAT

        try {
            const res = await fetch('/api/purchasing/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    supplierId: formData.supplierId,
                    invoiceNo: formData.invNo || `FAT-${Date.now()}`,
                    invoiceDate: formData.date,
                    items: formData.items,
                    totalAmount: totalAmount
                })
            });

            const data = await res.json();
            if (data.success) {
                showSuccess('Başarılı', '✅ Fatura başarıyla kaydedildi, stoklar güncellendi ve cariye borç işlendi.');
                setView('list');
                // Optional: Refresh list
            } else {
                showError('Hata', '❌ Hata: ' + data.error);
            }
        } catch (e) {
            showError('Hata', '❌ Bağlantı hatası!');
        }
    };

    return (
        <div className="container" style={{ padding: '40px 20px' }}>

            {/* Header */}
            <header className="flex-between" style={{ marginBottom: '32px' }}>
                <div>
                    <h1 className="text-gradient">Satın Alma & Mal Kabul</h1>
                    <p className="text-muted">Gelen Faturalar ve Depo Giriş İşlemleri</p>
                </div>
                {view === 'list' && (
                    <button onClick={() => setView('new_invoice')} className="btn btn-primary">
                        + Yeni Alım Faturası Gir
                    </button>
                )}
            </header>

            {/* --- LIST VIEW --- */}
            <div className="card glass">
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr className="text-muted" style={{ borderBottom: '1px solid var(--border-light)', fontSize: '12px' }}>
                            <th style={{ padding: '12px' }}>Fatura Bilgisi</th>
                            <th>Hedef Depo</th>
                            <th>Tarih</th>
                            <th>Tutar</th>
                            <th>Durum</th>
                            <th>İşlem</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoices.map((inv, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '16px 0' }}>
                                    <div style={{ fontWeight: 'bold' }}>{inv.supplier}</div>
                                    <div className="text-muted" style={{ fontSize: '12px' }}>{inv.id} - {inv.msg}</div>
                                </td>
                                <td>
                                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)' }}>
                                        {inv.target}
                                    </span>
                                </td>
                                <td>{inv.date}</td>
                                <td style={{ fontWeight: 'bold' }}>{inv.total.toLocaleString()} ₺</td>
                                <td>
                                    <span style={{ color: inv.status === 'Onaylandı' ? 'var(--success)' : '#F59E0B' }}>
                                        {inv.status === 'Onaylandı' ? '● Stokta' : '● Bekliyor'}
                                    </span>
                                </td>
                                <td>
                                    <button className="btn btn-outline" style={{ fontSize: '12px' }}>Detay</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* --- NEW INVOICE MODAL --- */}
            {view === 'new_invoice' && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
                    <div className="card" style={{ maxWidth: '800px', width: '100%', maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--primary)', background: 'var(--bg-main)' }}>
                        <div className="flex-between mb-4">
                            <h3>🧾 Fatura Girişi (Stok & Cari)</h3>
                            <button onClick={() => setView('list')} className="btn btn-ghost">İptal</button>
                        </div>

                        <div className="grid-cols-2 gap-4 mb-6">
                            <div className="flex-col gap-2">
                                <label className="text-muted" style={{ fontSize: '12px' }}>TEDARİKÇİ</label>
                                <select
                                    value={formData.supplierId} onChange={e => setFormData({ ...formData, supplierId: e.target.value })}
                                    style={{ padding: '12px', background: 'var(--bg-deep)', border: '1px solid var(--border-light)', borderRadius: '6px', color: 'white' }}
                                >
                                    <option value="">Seçiniz...</option>
                                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div className="flex-col gap-2">
                                <label className="text-muted" style={{ fontSize: '12px' }}>GİRİŞ YAPILACAK DEPO / ŞUBE</label>
                                <select
                                    value={formData.targetBranch} onChange={e => setFormData({ ...formData, targetBranch: e.target.value })}
                                    style={{ padding: '12px', background: 'var(--bg-deep)', border: '1px solid var(--primary)', borderRadius: '6px', color: 'white' }}
                                >
                                    <option>Merkez Depo</option>
                                    <option>Kadıköy Şube</option>
                                    <option>Beşiktaş Şube</option>
                                    <option>İzmir Şube</option>
                                </select>
                            </div>
                            <div className="flex-col gap-2">
                                <label className="text-muted" style={{ fontSize: '12px' }}>FATURA NO</label>
                                <input type="text" placeholder="Örn: GIB2026..." value={formData.invNo} onChange={e => setFormData({ ...formData, invNo: e.target.value })} style={{ padding: '12px', background: 'var(--bg-deep)', border: '1px solid var(--border-light)', borderRadius: '6px', color: 'white' }} />
                            </div>
                            <div className="flex-col gap-2">
                                <label className="text-muted" style={{ fontSize: '12px' }}>FATURA TARİHİ</label>
                                <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} style={{ padding: '12px', background: 'var(--bg-deep)', border: '1px solid var(--border-light)', borderRadius: '6px', color: 'white' }} />
                            </div>
                        </div>

                        {/* ITEMS ADDER */}
                        <div className="card glass mb-6">
                            <h4 className="text-muted mb-4" style={{ fontSize: '14px' }}>Ürünleri Giriniz</h4>
                            <div className="flex-center gap-2 mb-4">
                                <select
                                    value={tempItem.productId}
                                    onChange={e => {
                                        const p = products.find(prod => prod.id === e.target.value);
                                        setTempItem({ ...tempItem, productId: e.target.value, name: p?.name || '' });
                                    }}
                                    style={{ flex: 2, padding: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '4px', color: 'var(--text-main)' }}
                                >
                                    <option value="">Ürün Seçiniz...</option>
                                    {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
                                </select>
                                <input type="number" placeholder="Adet" value={tempItem.qty} onChange={e => setTempItem({ ...tempItem, qty: parseInt(e.target.value) })} style={{ width: '80px', padding: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '4px', color: 'var(--text-main)' }} />
                                <input type="number" placeholder="Birim Fiyat" value={tempItem.price} onChange={e => setTempItem({ ...tempItem, price: parseFloat(e.target.value) })} style={{ width: '100px', padding: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '4px', color: 'var(--text-main)' }} />
                                <button onClick={addItem} className="btn btn-outline">Ekle</button>
                            </div>

                            {/* ITEMS LIST */}
                            {formData.items.length > 0 && (
                                <table style={{ width: '100%', fontSize: '13px', textAlign: 'left' }}>
                                    <thead className="text-muted"><tr><th>Ürün</th><th>Miktar</th><th>Birim Fiyat</th><th>Toplam</th><th></th></tr></thead>
                                    <tbody>
                                        {formData.items.map((item, i) => (
                                            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                <td style={{ padding: '8px 0' }}>{item.name}</td>
                                                <td>{item.qty}</td>
                                                <td>{item.price} ₺</td>
                                                <td style={{ fontWeight: 'bold' }}>{item.qty * item.price} ₺</td>
                                                <td><button onClick={() => removeItem(i)} style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}>×</button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* SUMMARY & SAVE */}
                        <div className="flex-between box-shadow" style={{ background: 'var(--bg-deep)', padding: '20px', borderRadius: '12px' }}>
                            <div>
                                <div className="text-muted">Ara Toplam</div>
                                <div style={{ fontSize: '12px' }}>+ KDV (%20)</div>
                                <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '8px' }}>GENEL TOPLAM</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div>{calculateTotal().toLocaleString()} ₺</div>
                                <div style={{ fontSize: '12px' }}>{(calculateTotal() * 0.2).toLocaleString()} ₺</div>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary)' }}>{(calculateTotal() * 1.2).toLocaleString()} ₺</div>
                            </div>
                        </div>

                        <div className="flex-end gap-4 mt-6">
                            <button onClick={() => setView('list')} className="btn btn-outline" style={{ padding: '16px 32px' }}>Vazgeç</button>
                            <button onClick={handleSaveInvoice} className="btn btn-primary" style={{ padding: '16px 32px', fontSize: '18px' }}>
                                FATURAYI KAYDET VE STOĞA İŞLE
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
