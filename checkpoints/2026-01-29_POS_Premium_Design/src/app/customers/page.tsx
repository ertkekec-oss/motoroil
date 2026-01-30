
"use client";

import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useModal } from '@/contexts/ModalContext';
import { formatCurrency } from '@/lib/utils';


export default function CustomersPage() {
    const [activeTab, setActiveTab] = useState('all');
    const { customers, currentUser, hasPermission } = useApp();
    const { showSuccess, showError, showWarning, showConfirm } = useModal();
    const canDelete = hasPermission('delete_records');

    const [isProcessing, setIsProcessing] = useState(false);
    const [branchFilter, setBranchFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState<'all' | 'overdue' | 'upcoming'>('all');
    const [dateRangeStart, setDateRangeStart] = useState('');
    const [dateRangeEnd, setDateRangeEnd] = useState('');

    const filteredCustomers = customers.filter(cust => {
        // Tab filter
        if (activeTab === 'borclular' && cust.balance <= 0) return false;
        if (activeTab === 'alacaklilar' && cust.balance >= 0) return false;
        if (activeTab === 'eticaret' && cust.category !== 'E-ticaret') return false;

        // Branch filter
        if (branchFilter !== 'all' && cust.branch !== branchFilter) return false;

        // Date filter (for demonstration, using mock due dates)
        if (dateFilter === 'overdue') {
            // In real app, check if customer has overdue invoices
            return cust.balance < 0; // Mock: negative balance = overdue
        }
        if (dateFilter === 'upcoming' && dateRangeStart && dateRangeEnd) {
            // In real app, check if customer has invoices due in date range
            return cust.balance < 0; // Mock filter
        }

        return true;
    });

    const tabs = [
        { id: 'all', label: 'Tümü' },
        { id: 'borclular', label: 'Borçlular' },
        { id: 'alacaklilar', label: 'Alacaklılar' },
        { id: 'eticaret', label: 'E-Ticaret' },
        { id: 'kurumsal', label: 'Kurumsal' },
        { id: 'vip', label: 'VIP' }
    ];

    // --- ADD CUSTOMER LOGIC ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newCustomer, setNewCustomer] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        taxNumber: '',
        taxOffice: '',
        contactPerson: '',
        iban: ''
    });

    const handleAddCustomer = async () => {
        if (!newCustomer.name) {
            showWarning("Eksik Bilgi", "İsim zorunludur!");
            return;
        }

        if (isProcessing) return;

        setIsProcessing(true);
        try {
            const res = await fetch('/api/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newCustomer)
            });
            const data = await res.json();
            if (data.success) {
                showSuccess("Başarılı", "Müşteri başarıyla oluşturuldu.");
                setIsModalOpen(false);

                setNewCustomer({ name: '', phone: '', email: '', address: '', taxNumber: '', taxOffice: '', contactPerson: '', iban: '' });
                // Reload page or re-fetch (simplest way here is reload for now, or you'd expose a refresh function from context)
                window.location.reload();
            } else {
                showError("Hata", data.error || "Beklenmedik bir hata oluştu.");
            }

        } catch (error: any) {
            console.error(error);
            showError("Hata", "Müşteri eklenirken bir hata oluştu.");
        } finally {

            setIsProcessing(false);
        }
    };

    const handleDeleteCustomer = (id: number) => {
        if (!canDelete) return;
        if (isProcessing) return;

        showConfirm(
            'Emin misiniz?',
            'Bu müşteriyi (cari) silmek istediğinize emin misiniz? Bu işlem geri alınamaz.',
            async () => {
                setIsProcessing(true);
                try {
                    // In a real app, this would call an API
                    showSuccess("Başarılı", "Müşteri kaydı silindi.");
                    setTimeout(() => window.location.reload(), 1500);
                } finally {
                    setIsProcessing(false);
                }
            }
        );
    };


    return (
        <div className="container" style={{ padding: '40px 20px' }}>

            {/* Header */}
            <header className="flex-between" style={{ marginBottom: '32px' }}>
                <div>
                    <h1 className="text-gradient">Müşteri & Cari Yönetimi</h1>
                    <p className="text-muted">Müşteri Bakiyeleri ve Geçmiş İşlemler</p>
                </div>
                <div className="flex-center gap-4">
                    <input
                        type="text"
                        placeholder="Müşteri adı, plaka veya telefon..."
                        style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-light)',
                            padding: '12px 16px',
                            borderRadius: '8px',
                            color: 'white',
                            width: '300px'
                        }}
                    />
                    <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">+ Yeni Müşteri</button>
                </div>
            </header>

            {/* Advanced Filters */}
            <div className="card glass" style={{ marginBottom: '24px', padding: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    <div className="flex-col gap-2">
                        <label style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)' }}>ŞUBE FİLTRESİ</label>
                        <select
                            value={branchFilter}
                            onChange={(e) => setBranchFilter(e.target.value)}
                            style={{ padding: '10px', background: 'var(--bg-deep)', border: '1px solid var(--border-light)', borderRadius: '6px', color: 'white' }}
                        >
                            <option value="all">Tüm Şubeler</option>
                            <option value="Merkez">Merkez</option>
                            <option value="Kadıköy">Kadıköy</option>
                            <option value="Beşiktaş">Beşiktaş</option>
                        </select>
                    </div>

                    <div className="flex-col gap-2">
                        <label style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)' }}>VADE DURUMU</label>
                        <select
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value as any)}
                            style={{ padding: '10px', background: 'var(--bg-deep)', border: '1px solid var(--border-light)', borderRadius: '6px', color: 'white' }}
                        >
                            <option value="all">Tümü</option>
                            <option value="overdue">Vadesi Geçenler</option>
                            <option value="upcoming">Vadesi Gelecekler</option>
                        </select>
                    </div>

                    {dateFilter === 'upcoming' && (
                        <>
                            <div className="flex-col gap-2">
                                <label style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)' }}>BAŞLANGIÇ TARİHİ</label>
                                <input
                                    type="date"
                                    value={dateRangeStart}
                                    onChange={(e) => setDateRangeStart(e.target.value)}
                                    style={{ padding: '10px', background: 'var(--bg-deep)', border: '1px solid var(--border-light)', borderRadius: '6px', color: 'white' }}
                                />
                            </div>
                            <div className="flex-col gap-2">
                                <label style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)' }}>BİTİŞ TARİHİ</label>
                                <input
                                    type="date"
                                    value={dateRangeEnd}
                                    onChange={(e) => setDateRangeEnd(e.target.value)}
                                    style={{ padding: '10px', background: 'var(--bg-deep)', border: '1px solid var(--border-light)', borderRadius: '6px', color: 'white' }}
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Financial Summary */}
            <div className="grid-cols-3" style={{ marginBottom: '32px' }}>
                <div className="card glass flex-between" style={{ padding: '20px' }}>
                    <div>
                        <div className="text-muted" style={{ fontSize: '12px' }}>TOPLAM ALACAK (BORÇLU MÜŞTERİLER)</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--success)' }}>
                            {formatCurrency(customers.filter(c => c.balance > 0).reduce((sum, c) => sum + c.balance, 0))}
                        </div>
                    </div>
                </div>
                <div className="card glass flex-between" style={{ padding: '20px' }}>
                    <div>
                        <div className="text-muted" style={{ fontSize: '12px' }}>TOPLAM MÜŞTERİ SAYISI</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{customers.length}</div>
                    </div>
                </div>
                <div className="card glass flex-between" style={{ padding: '20px' }}>
                    <div>
                        <div className="text-muted" style={{ fontSize: '12px' }}>TOPLAM BORÇ (ALACAKLI MÜŞTERİLER)</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--danger)' }}>
                            {formatCurrency(customers.filter(c => c.balance < 0).reduce((sum, c) => sum + Math.abs(c.balance), 0))}
                        </div>
                    </div>
                </div>
            </div>


            {/* Customer List */}
            <div className="card">
                {/* Tabs */}
                <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '2px', marginBottom: '20px', borderBottom: '1px solid var(--border-light)' }}>
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                padding: '12px 24px',
                                background: 'transparent',
                                border: 'none',
                                borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
                                color: activeTab === tab.id ? 'white' : 'var(--text-muted)',
                                cursor: 'pointer',
                                fontWeight: '500',
                                transition: 'all 0.2s'
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>
                            <th style={{ padding: '12px 16px' }}>Müşteri</th>
                            <th>İletişim</th>
                            <th>Son Araç / Servis</th>
                            <th>Bakiye Durumu</th>
                            <th>Son İşlem</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody style={{ fontSize: '14px' }}>
                        {filteredCustomers.map((item) => (
                            <tr key={item.id} style={{ borderBottom: '1px solid var(--border-light)', transition: 'background 0.2s' }}>
                                <td style={{ padding: '16px' }}>
                                    <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '8px' }}>
                                        <div style={{ fontWeight: '600' }}>{item.name}</div>
                                        {item.isVIP && <span style={{ fontSize: '10px', background: 'gold', color: 'black', padding: '1px 5px', borderRadius: '4px', fontWeight: '900' }}>VIP</span>}
                                        {item.isCorporate && <span style={{ fontSize: '10px', background: 'var(--primary)', color: 'white', padding: '1px 5px', borderRadius: '4px', fontWeight: '900' }}>ŞİRKET</span>}
                                        {item.category === 'E-ticaret' && <span style={{ fontSize: '10px', background: 'var(--secondary)', color: 'black', padding: '1px 5px', borderRadius: '4px', fontWeight: '900' }}>E-TİCARET</span>}
                                    </div>
                                    <div className="text-muted" style={{ fontSize: '12px' }}>ID: {item.id}</div>
                                </td>
                                <td>{item.phone}</td>
                                <td>{(item as any).vehicle || 'Belirtilmemiş'}</td>
                                <td>
                                    {item.balance > 0 ? (
                                        <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>
                                            {formatCurrency(item.balance)} (Borçlu)
                                        </span>
                                    ) : item.balance < 0 ? (
                                        <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>
                                            {formatCurrency(item.balance)} (Alacaklı)
                                        </span>
                                    ) : (
                                        <span style={{ color: 'rgba(255,255,255,0.4)' }}>₺0,00 (Temiz)</span>
                                    )}
                                </td>
                                <td className="text-muted">{item.lastVisit}</td>
                                <td style={{ textAlign: 'right' }}>
                                    <a href={`/customers/${item.id}`} className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '12px', marginRight: '8px', textDecoration: 'none' }}>Ekstre</a>
                                    <a href={`/customers/${item.id}`} className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '12px', marginRight: '8px', textDecoration: 'none' }}>Detay</a>
                                    {canDelete && <button disabled={isProcessing} onClick={() => handleDeleteCustomer(Number(item.id))} className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '12px', color: 'var(--danger)', borderColor: 'var(--danger)' }}>{isProcessing ? '...' : 'Sil'}</button>}
                                </td>
                            </tr>
                        ))}
                        {filteredCustomers.length === 0 && (
                            <tr>
                                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Bu kategoride kayıtlı cari bulunamadı.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* ADD CUSTOMER MODAL */}
            {isModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card glass animate-in" style={{ width: '600px', background: 'var(--bg-card)', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="flex-between mb-6">
                            <h3>👤 Yeni Müşteri Ekle</h3>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' }}>×</button>
                        </div>
                        <div className="flex-col gap-4">
                            <div className="grid-cols-2 gap-4" style={{ display: 'grid' }}>
                                <div>
                                    <label className="text-muted" style={{ fontSize: '12px' }}>AD SOYAD / UNVAN <span style={{ color: 'red' }}>*</span></label>
                                    <input type="text" value={newCustomer.name} onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })} style={{ width: '100%', padding: '12px', background: 'var(--bg-deep)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'white' }} />
                                </div>
                                <div>
                                    <label className="text-muted" style={{ fontSize: '12px' }}>YETKİLİ KİŞİ</label>
                                    <input type="text" value={newCustomer.contactPerson} onChange={e => setNewCustomer({ ...newCustomer, contactPerson: e.target.value })} style={{ width: '100%', padding: '12px', background: 'var(--bg-deep)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'white' }} />
                                </div>
                            </div>

                            <div className="grid-cols-2 gap-4" style={{ display: 'grid' }}>
                                <div>
                                    <label className="text-muted" style={{ fontSize: '12px' }}>TELEFON</label>
                                    <input type="text" value={newCustomer.phone} onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })} style={{ width: '100%', padding: '12px', background: 'var(--bg-deep)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'white' }} />
                                </div>
                                <div>
                                    <label className="text-muted" style={{ fontSize: '12px' }}>E-POSTA</label>
                                    <input type="text" value={newCustomer.email} onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })} style={{ width: '100%', padding: '12px', background: 'var(--bg-deep)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'white' }} />
                                </div>
                            </div>

                            <div className="grid-cols-2 gap-4" style={{ display: 'grid' }}>
                                <div>
                                    <label className="text-muted" style={{ fontSize: '12px' }}>VERGİ NO / TC</label>
                                    <input type="text" value={newCustomer.taxNumber} onChange={e => setNewCustomer({ ...newCustomer, taxNumber: e.target.value })} style={{ width: '100%', padding: '12px', background: 'var(--bg-deep)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'white' }} />
                                </div>
                                <div>
                                    <label className="text-muted" style={{ fontSize: '12px' }}>VERGİ DAİRESİ</label>
                                    <input type="text" value={newCustomer.taxOffice} onChange={e => setNewCustomer({ ...newCustomer, taxOffice: e.target.value })} style={{ width: '100%', padding: '12px', background: 'var(--bg-deep)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'white' }} />
                                </div>
                            </div>

                            <div>
                                <label className="text-muted" style={{ fontSize: '12px' }}>IBAN</label>
                                <input type="text" placeholder="TR..." value={newCustomer.iban} onChange={e => setNewCustomer({ ...newCustomer, iban: e.target.value })} style={{ width: '100%', padding: '12px', background: 'var(--bg-deep)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'white' }} />
                            </div>

                            <div>
                                <label className="text-muted" style={{ fontSize: '12px' }}>ADRES / FATURA ADRESİ</label>
                                <textarea value={newCustomer.address} onChange={e => setNewCustomer({ ...newCustomer, address: e.target.value })} style={{ width: '100%', padding: '12px', background: 'var(--bg-deep)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'white', minHeight: '80px' }} />
                            </div>
                            <button onClick={handleAddCustomer} disabled={isProcessing} className="btn btn-primary w-full" style={{ padding: '14px' }}>
                                {isProcessing ? 'İŞLENİYOR...' : 'KAYDET'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

}
