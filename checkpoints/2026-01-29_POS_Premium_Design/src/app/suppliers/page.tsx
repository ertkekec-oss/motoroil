
"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useModal } from '@/contexts/ModalContext';
import SupplierPurchaseModal from '@/components/modals/SupplierPurchaseModal';
import { formatCurrency } from '@/lib/utils';

export default function SuppliersPage() {
    const router = useRouter();
    const { suppliers } = useApp();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [newSupplier, setNewSupplier] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        category: '',
        taxNumber: '',
        taxOffice: '',
        contactPerson: '',
        iban: ''
    });

    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
    const [selectedSup, setSelectedSup] = useState<any>(null);

    const { showSuccess, showError } = useModal();

    const handleAddSupplier = async () => {
        if (!newSupplier.name) {
            showError('Hata', 'Firma adı zorunludur!');
            return;
        }
        if (isProcessing) return;

        setIsProcessing(true);
        try {
            const res = await fetch('/api/suppliers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newSupplier)
            });
            const data = await res.json();
            if (data.success) {
                showSuccess('Başarılı', 'Tedarikçi başarıyla oluşturuldu.');
                setIsModalOpen(false);
                setNewSupplier({ name: '', phone: '', email: '', address: '', category: '', taxNumber: '', taxOffice: '', contactPerson: '', iban: '' });
                window.location.reload();
            } else {
                showError('Hata', data.error);
            }
        } catch (error: any) {
            console.error(error);
            showError('Hata', 'Bir hata oluştu.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="container" style={{ padding: '40px 20px' }}>
            <header className="flex-between" style={{ marginBottom: '32px' }}>
                <div>
                    <h1 className="text-gradient">Tedarikçi Yönetimi</h1>
                    <p className="text-muted">Toptancı Listesi ve İletişim Bilgileri</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">+ Yeni Tedarikçi</button>
            </header>

            <div className="card glass">
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead className="text-muted" style={{ fontSize: '12px', borderBottom: '1px solid var(--border-light)' }}>
                        <tr>
                            <th style={{ padding: '12px' }}>Firma Adı</th>
                            <th>Kategori</th>
                            <th>İletişim</th>
                            <th>Güncel Bakiye (Borcumuz)</th>
                            <th>Durum</th>
                            <th>İşlem</th>
                        </tr>
                    </thead>
                    <tbody>
                        {suppliers.map(sup => (
                            <tr key={sup.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '16px 0', fontWeight: 'bold' }}>
                                    <Link href={`/suppliers/${sup.id}`} style={{ color: 'white', textDecoration: 'none' }}>
                                        {sup.name}
                                    </Link>
                                </td>
                                <td><span style={{ fontSize: '12px', padding: '2px 8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>{sup.category}</span></td>
                                <td>{sup.phone || 'Belirtilmemiş'}</td>
                                <td style={{ color: sup.balance < 0 ? 'var(--danger)' : (sup.balance > 0 ? 'var(--success)' : 'white'), fontWeight: 'bold' }}>
                                    {sup.balance < 0 ? 'Borç: ' : (sup.balance > 0 ? 'Alacak: ' : '')}
                                    {formatCurrency(Math.abs(sup.balance))}
                                </td>
                                <td><span style={{ color: sup.isActive !== false ? 'var(--success)' : 'var(--danger)', fontSize: '12px' }}>● {sup.isActive !== false ? 'Aktif' : 'Pasif'}</span></td>
                                <td>
                                    <button
                                        onClick={() => { setSelectedSup(sup); setIsPurchaseModalOpen(true); }}
                                        className="btn btn-outline"
                                        style={{ fontSize: '12px', marginRight: '8px', borderColor: 'var(--primary)', color: 'var(--primary)' }}
                                    >
                                        🛒 Alış Ekle
                                    </button>
                                    <button
                                        onClick={() => router.push(`/payment?amount=${Math.abs(sup.balance)}&title=${encodeURIComponent(sup.name)}&type=payable&ref=SUP-${sup.id}`)}
                                        className="btn btn-outline"
                                        style={{ fontSize: '12px', marginRight: '8px' }}
                                    >
                                        Ödeme Yap
                                    </button>
                                    <Link href={`/suppliers/${sup.id}`} className="btn btn-outline" style={{ fontSize: '12px', textDecoration: 'none' }}>Bakiye/Detay</Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* PURCHASE MODAL */}
            {selectedSup && (
                <SupplierPurchaseModal
                    isOpen={isPurchaseModalOpen}
                    onClose={() => setIsPurchaseModalOpen(false)}
                    supplierId={selectedSup.id}
                    supplierName={selectedSup.name}
                />
            )}

            {/* ADD SUPPLIER MODAL */}
            {isModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card glass animate-in" style={{ width: '600px', background: 'var(--bg-card)', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="flex-between mb-6">
                            <h3>🏭 Yeni Tedarikçi Ekle</h3>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' }}>×</button>
                        </div>
                        <div className="flex-col gap-4">
                            <div className="grid-cols-2 gap-4" style={{ display: 'grid' }}>
                                <div>
                                    <label className="text-muted" style={{ fontSize: '12px' }}>FİRMA ADI <span style={{ color: 'red' }}>*</span></label>
                                    <input type="text" value={newSupplier.name} onChange={e => setNewSupplier({ ...newSupplier, name: e.target.value })} style={{ width: '100%', padding: '12px', background: 'var(--bg-deep)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'white' }} />
                                </div>
                                <div>
                                    <label className="text-muted" style={{ fontSize: '12px' }}>YETKİLİ KİŞİ</label>
                                    <input type="text" value={newSupplier.contactPerson} onChange={e => setNewSupplier({ ...newSupplier, contactPerson: e.target.value })} style={{ width: '100%', padding: '12px', background: 'var(--bg-deep)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'white' }} />
                                </div>
                            </div>

                            <div>
                                <label className="text-muted" style={{ fontSize: '12px' }}>KATEGORİ</label>
                                <input type="text" placeholder="Örn: Yedek Parça, Yağ..." value={newSupplier.category} onChange={e => setNewSupplier({ ...newSupplier, category: e.target.value })} style={{ width: '100%', padding: '12px', background: 'var(--bg-deep)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'white' }} />
                            </div>

                            <div className="grid-cols-2 gap-4" style={{ display: 'grid' }}>
                                <div>
                                    <label className="text-muted" style={{ fontSize: '12px' }}>TELEFON</label>
                                    <input type="text" value={newSupplier.phone} onChange={e => setNewSupplier({ ...newSupplier, phone: e.target.value })} style={{ width: '100%', padding: '12px', background: 'var(--bg-deep)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'white' }} />
                                </div>
                                <div>
                                    <label className="text-muted" style={{ fontSize: '12px' }}>E-POSTA</label>
                                    <input type="text" value={newSupplier.email} onChange={e => setNewSupplier({ ...newSupplier, email: e.target.value })} style={{ width: '100%', padding: '12px', background: 'var(--bg-deep)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'white' }} />
                                </div>
                            </div>

                            <div className="grid-cols-2 gap-4" style={{ display: 'grid' }}>
                                <div>
                                    <label className="text-muted" style={{ fontSize: '12px' }}>VERGİ NO</label>
                                    <input type="text" value={newSupplier.taxNumber} onChange={e => setNewSupplier({ ...newSupplier, taxNumber: e.target.value })} style={{ width: '100%', padding: '12px', background: 'var(--bg-deep)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'white' }} />
                                </div>
                                <div>
                                    <label className="text-muted" style={{ fontSize: '12px' }}>VERGİ DAİRESİ</label>
                                    <input type="text" value={newSupplier.taxOffice} onChange={e => setNewSupplier({ ...newSupplier, taxOffice: e.target.value })} style={{ width: '100%', padding: '12px', background: 'var(--bg-deep)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'white' }} />
                                </div>
                            </div>

                            <div>
                                <label className="text-muted" style={{ fontSize: '12px' }}>IBAN</label>
                                <input type="text" placeholder="TR..." value={newSupplier.iban} onChange={e => setNewSupplier({ ...newSupplier, iban: e.target.value })} style={{ width: '100%', padding: '12px', background: 'var(--bg-deep)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'white' }} />
                            </div>

                            <div>
                                <label className="text-muted" style={{ fontSize: '12px' }}>ADRES</label>
                                <textarea value={newSupplier.address} onChange={e => setNewSupplier({ ...newSupplier, address: e.target.value })} style={{ width: '100%', padding: '12px', background: 'var(--bg-deep)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'white', minHeight: '80px' }} />
                            </div>
                            <button onClick={handleAddSupplier} disabled={isProcessing} className="btn btn-primary w-full" style={{ padding: '14px' }}>
                                {isProcessing ? 'KAYDEDİLİYOR...' : 'KAYDET'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}
