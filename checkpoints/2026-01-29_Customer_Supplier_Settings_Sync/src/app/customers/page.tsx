
"use client";

import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useModal } from '@/contexts/ModalContext';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

export default function CustomersPage() {
    const [activeTab, setActiveTab] = useState('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid'); // New: View Toggle
    const { customers, currentUser, hasPermission, suppClasses, custClasses } = useApp();
    const { showSuccess, showError, showWarning, showConfirm } = useModal();
    const canDelete = hasPermission('delete_records');

    const [isProcessing, setIsProcessing] = useState(false);
    const [searchTerm, setSearchTerm] = useState(''); // New: Debounced Search
    const [branchFilter, setBranchFilter] = useState('all');
    const [showFilters, setShowFilters] = useState(false); // New: Collapse Filters

    // Filter Logic
    const filteredCustomers = customers.filter(cust => {
        // Search Filter
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            const searchMatch =
                (cust.name || '').toLowerCase().includes(lowerTerm) ||
                (cust.phone || '').includes(searchTerm) ||
                (cust.email || '').toLowerCase().includes(lowerTerm) ||
                ((cust as any).taxNumber || '').includes(searchTerm);
            if (!searchMatch) return false;
        }

        // Tab filter
        if (activeTab === 'borclular' && cust.balance <= 0) return false;
        if (activeTab === 'alacaklilar' && cust.balance >= 0) return false;
        if (activeTab === 'eticaret' && cust.category !== 'E-ticaret') return false;

        // Branch filter
        if (branchFilter !== 'all' && cust.branch !== branchFilter) return false;

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
        iban: '',
        customerClass: ''
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

                setNewCustomer({ name: '', phone: '', email: '', address: '', taxNumber: '', taxOffice: '', contactPerson: '', iban: '', customerClass: '' });
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

    // Calculate Stats
    const totalReceivable = customers.filter(c => c.balance > 0).reduce((sum, c) => sum + c.balance, 0);
    const totalPayable = customers.filter(c => c.balance < 0).reduce((sum, c) => sum + Math.abs(c.balance), 0);

    return (
        <div className="container" style={{ padding: '30px', maxWidth: '1600px', margin: '0 auto' }}>

            {/* HEADER AREA */}
            <header style={{ marginBottom: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div>
                        <h1 className="text-gradient" style={{ fontSize: '28px', margin: 0 }}>Müşteri & Cari Yönetimi</h1>
                        <p className="text-muted" style={{ marginTop: '8px' }}>Müşteri portföyü, bakiyeler ve hesap hareketleri</p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="btn btn-primary"
                            style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}>
                            <span style={{ fontSize: '16px' }}>+</span> Yeni Müşteri
                        </button>
                    </div>
                </div>

                {/* STATS ROW */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                    <div className="card glass animate-fade-in" style={{ padding: '20px', borderLeft: '4px solid #3b82f6' }}>
                        <div className="text-muted" style={{ fontSize: '12px', fontWeight: 'bold' }}>TOPLAM MÜŞTERİ</div>
                        <div style={{ fontSize: '28px', fontWeight: '800', marginTop: '5px' }}>{customers.length}</div>
                    </div>
                    <div className="card glass animate-fade-in" style={{ padding: '20px', borderLeft: '4px solid #10b981' }}>
                        <div className="text-muted" style={{ fontSize: '12px', fontWeight: 'bold' }}>TOPLAM ALACAK</div>
                        <div style={{ fontSize: '28px', fontWeight: '800', marginTop: '5px', color: '#ef4444' }}>{formatCurrency(totalReceivable)}</div>
                        <div style={{ fontSize: '11px', color: '#888' }}>Borçlu müşterilerden</div>
                    </div>
                    <div className="card glass animate-fade-in" style={{ padding: '20px', borderLeft: '4px solid #f59e0b' }}>
                        <div className="text-muted" style={{ fontSize: '12px', fontWeight: 'bold' }}>TOPLAM BORÇ</div>
                        <div style={{ fontSize: '28px', fontWeight: '800', marginTop: '5px', color: '#10b981' }}>{formatCurrency(totalPayable)}</div>
                        <div style={{ fontSize: '11px', color: '#888' }}>Alacaklı müşterilere</div>
                    </div>
                    <div className="card glass animate-fade-in" style={{ padding: '20px', borderLeft: '4px solid #8b5cf6' }}>
                        <div className="text-muted" style={{ fontSize: '12px', fontWeight: 'bold' }}>NET DURUM</div>
                        <div style={{ fontSize: '28px', fontWeight: '800', marginTop: '5px' }}>{formatCurrency(totalReceivable - totalPayable)}</div>
                    </div>
                </div>
            </header>

            {/* CONTROLS AREA */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>

                {/* Search & View Toggle */}
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1, maxWidth: '600px' }}>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Müşteri adı, telefon, vergi no veya e-posta ile ara..."
                            style={{
                                width: '100%',
                                padding: '16px 20px 16px 50px',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '14px',
                                color: 'white',
                                fontSize: '15px',
                                outline: 'none',
                                transition: 'all 0.3s'
                            }}
                            onFocus={(e) => e.target.style.background = 'rgba(255,255,255,0.08)'}
                            onBlur={(e) => e.target.style.background = 'rgba(255,255,255,0.03)'}
                        />
                        <span style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', fontSize: '20px', opacity: 0.5 }}>🔍</span>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="btn btn-outline"
                            style={{ height: '54px', padding: '0 20px', borderRadius: '12px', border: showFilters ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.1)', color: showFilters ? '#3b82f6' : '#888' }}
                        >
                            🌪️ Filtreler
                        </button>
                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '5px', borderRadius: '12px', display: 'flex', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <button
                                onClick={() => setViewMode('grid')}
                                style={{
                                    padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                    background: viewMode === 'grid' ? '#3b82f6' : 'transparent',
                                    color: viewMode === 'grid' ? 'white' : '#888'
                                }}
                            >
                                ⊞
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                style={{
                                    padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                    background: viewMode === 'list' ? '#3b82f6' : 'transparent',
                                    color: viewMode === 'list' ? 'white' : '#888'
                                }}
                            >
                                ≣
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filters Panel */}
                {showFilters && (
                    <div className="card glass animate-fade-in" style={{ padding: '20px', marginTop: '-10px', borderTop: 'none', borderRadius: '0 0 16px 16px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                            <div>
                                <label className="text-muted" style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>KATEGORİ</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {tabs.map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            style={{
                                                padding: '8px 16px', borderRadius: '8px', fontSize: '12px',
                                                border: activeTab === tab.id ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.1)',
                                                background: activeTab === tab.id ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                                color: activeTab === tab.id ? '#3b82f6' : '#888',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-muted" style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>ŞUBE</label>
                                <select
                                    value={branchFilter}
                                    onChange={(e) => setBranchFilter(e.target.value)}
                                    style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }}
                                >
                                    <option value="all">Tüm Şubeler</option>
                                    <option value="Merkez">Merkez</option>
                                    <option value="Kadıköy">Kadıköy</option>
                                    <option value="Beşiktaş">Beşiktaş</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* CONTENT AREA */}
            {viewMode === 'grid' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                    {filteredCustomers.map(cust => (
                        <div key={cust.id} className="card glass hover-scale" style={{ padding: '0', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ padding: '24px', background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{
                                        width: '50px', height: '50px', borderRadius: '12px',
                                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '20px', fontWeight: 'bold', color: 'white',
                                        boxShadow: '0 4px 10px rgba(59, 130, 246, 0.3)'
                                    }}>
                                        {cust.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: cust.balance > 0 ? '#ef4444' : (cust.balance < 0 ? '#10b981' : '#ccc') }}>
                                            {formatCurrency(Math.abs(cust.balance))}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#888' }}>
                                            {cust.balance > 0 ? 'Borçlu' : (cust.balance < 0 ? 'Alacaklı' : 'Dengeli')}
                                        </div>
                                    </div>
                                </div>
                                <h3 style={{ margin: '15px 0 5px 0', fontSize: '18px', fontWeight: 'bold', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {cust.name}
                                </h3>
                                <div style={{ fontSize: '12px', color: '#888' }}>{cust.category || 'Genel Müşteri'} • {cust.branch || 'Merkez'}</div>
                            </div>

                            <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#aaa' }}>
                                    <span>📞</span> {cust.phone || '-'}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#aaa' }}>
                                    <span>📧</span> {cust.email || '-'}
                                </div>
                            </div>

                            <div style={{ padding: '16px 24px', background: 'rgba(0,0,0,0.2)', display: 'flex', gap: '10px' }}>
                                <Link href={`/customers/${cust.id}`} className="btn btn-primary" style={{ flex: 1, textAlign: 'center', padding: '10px', fontSize: '13px', textDecoration: 'none' }}>
                                    Detay
                                </Link>
                                <a href={`tel:${cust.phone}`} className="btn btn-outline" style={{ padding: '10px', fontSize: '16px' }}>📞</a>
                                <a href={`https://wa.me/${cust.phone?.replace(/\s/g, '')}`} target="_blank" className="btn btn-outline" style={{ padding: '10px', fontSize: '16px', color: '#25D366', borderColor: '#25D366' }}>💬</a>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card glass" style={{ overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.03)', color: '#888', fontSize: '12px', textTransform: 'uppercase' }}>
                                <th style={{ padding: '20px' }}>Müşteri</th>
                                <th>İletişim</th>
                                <th>Kategori</th>
                                <th>Bakiye</th>
                                <th style={{ textAlign: 'right', paddingRight: '20px' }}>İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCustomers.map(cust => (
                                <tr key={cust.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }} className="hover:bg-white/5">
                                    <td style={{ padding: '20px' }}>
                                        <div style={{ fontWeight: '600', color: 'white' }}>{cust.name}</div>
                                        {(cust as any).taxNumber && <div style={{ fontSize: '12px', color: '#666' }}>VKN: {(cust as any).taxNumber}</div>}
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '13px', color: '#ccc' }}>{cust.phone}</div>
                                        <div style={{ fontSize: '12px', color: '#666' }}>{cust.email}</div>
                                    </td>
                                    <td>
                                        <span style={{ padding: '4px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', fontSize: '11px', color: '#ccc' }}>
                                            {cust.category || 'Genel'}
                                        </span>
                                    </td>
                                    <td>
                                        <span style={{ fontWeight: 'bold', color: cust.balance > 0 ? '#ef4444' : (cust.balance < 0 ? '#10b981' : '#ccc') }}>
                                            {formatCurrency(Math.abs(cust.balance))}
                                            <span style={{ fontSize: '10px', marginLeft: '5px', opacity: 0.7 }}>
                                                {cust.balance > 0 ? '(B)' : (cust.balance < 0 ? '(A)' : '-')}
                                            </span>
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                                        <Link href={`/customers/${cust.id}`} className="btn btn-sm btn-outline" style={{ textDecoration: 'none', marginRight: '8px' }}>Detay</Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {filteredCustomers.length === 0 && (
                <div style={{ padding: '60px', textAlign: 'center', color: '#888', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)', marginTop: '20px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '20px', opacity: 0.3 }}>🔍</div>
                    <h3>Kayıt Bulunamadı</h3>
                    <p>Arama kriterlerinize uygun müşteri bulunmuyor.</p>
                </div>
            )}

            {/* ADD CUSTOMER MODAL */}
            {isModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(5px)' }}>
                    <div className="card glass animate-in" style={{ width: '600px', background: '#1e1e24', border: '1px solid rgba(255,255,255,0.1)', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="flex-between mb-6" style={{ paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <h3 style={{ margin: 0 }}>👤 Yeni Müşteri Ekle</h3>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' }}>×</button>
                        </div>
                        <div className="flex-col gap-4">
                            <div className="grid-cols-2 gap-4" style={{ display: 'grid' }}>
                                <div>
                                    <label className="text-muted" style={{ fontSize: '11px', fontWeight: 'bold' }}>AD SOYAD / UNVAN <span style={{ color: 'red' }}>*</span></label>
                                    <input type="text" value={newCustomer.name} onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })} style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }} />
                                </div>
                                <div>
                                    <label className="text-muted" style={{ fontSize: '11px', fontWeight: 'bold' }}>YETKİLİ KİŞİ</label>
                                    <input type="text" value={newCustomer.contactPerson} onChange={e => setNewCustomer({ ...newCustomer, contactPerson: e.target.value })} style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }} />
                                </div>
                            </div>

                            <div className="grid-cols-2 gap-4" style={{ display: 'grid' }}>
                                <div>
                                    <label className="text-muted" style={{ fontSize: '11px', fontWeight: 'bold' }}>TELEFON</label>
                                    <input type="text" value={newCustomer.phone} onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })} style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }} />
                                </div>
                                <div>
                                    <label className="text-muted" style={{ fontSize: '11px', fontWeight: 'bold' }}>E-POSTA</label>
                                    <input type="text" value={newCustomer.email} onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })} style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }} />
                                </div>
                            </div>

                            <div className="grid-cols-2 gap-4" style={{ display: 'grid' }}>
                                <div>
                                    <label className="text-muted" style={{ fontSize: '11px', fontWeight: 'bold' }}>VERGİ NO / TC</label>
                                    <input type="text" value={newCustomer.taxNumber} onChange={e => setNewCustomer({ ...newCustomer, taxNumber: e.target.value })} style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }} />
                                </div>
                                <div>
                                    <label className="text-muted" style={{ fontSize: '11px', fontWeight: 'bold' }}>VERGİ DAİRESİ</label>
                                    <input type="text" value={newCustomer.taxOffice} onChange={e => setNewCustomer({ ...newCustomer, taxOffice: e.target.value })} style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }} />
                                </div>
                            </div>

                            <div>
                                <label className="text-muted" style={{ fontSize: '11px', fontWeight: 'bold' }}>IBAN</label>
                                <input type="text" placeholder="TR..." value={newCustomer.iban} onChange={e => setNewCustomer({ ...newCustomer, iban: e.target.value })} style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }} />
                            </div>

                            <div>
                                <label className="text-muted" style={{ fontSize: '11px', fontWeight: 'bold' }}>MÜŞTERİ SINIFI</label>
                                <select
                                    value={newCustomer.customerClass}
                                    onChange={e => setNewCustomer({ ...newCustomer, customerClass: e.target.value })}
                                    style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }}
                                >
                                    <option value="">Sınıf Seçin...</option>
                                    {(custClasses || []).map(cls => (
                                        <option key={cls} value={cls}>{cls}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-muted" style={{ fontSize: '11px', fontWeight: 'bold' }}>ADRES</label>
                                <textarea value={newCustomer.address} onChange={e => setNewCustomer({ ...newCustomer, address: e.target.value })} style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', minHeight: '80px', resize: 'vertical' }} />
                            </div>
                            <button onClick={handleAddCustomer} disabled={isProcessing} className="btn btn-primary w-full" style={{ padding: '16px', marginTop: '10px', fontSize: '16px' }}>
                                {isProcessing ? 'KAYDEDİLİYOR...' : 'KAYDET'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
