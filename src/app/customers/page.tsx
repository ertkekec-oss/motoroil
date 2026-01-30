
"use client";

import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useModal } from '@/contexts/ModalContext';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import Pagination from '@/components/Pagination';
import { useSearchParams } from 'next/navigation';

const ITEMS_PER_PAGE = 10;

export default function CustomersPage() {
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid'); // New: View Toggle
    const { customers, currentUser, hasPermission, suppClasses, custClasses } = useApp();
    const { showSuccess, showError, showWarning, showConfirm } = useModal();
    const canDelete = hasPermission('delete_records');

    const [isProcessing, setIsProcessing] = useState(false);
    const [searchTerm, setSearchTerm] = useState(''); // New: Debounced Search
    const [branchFilter, setBranchFilter] = useState('all');
    const [showFilters, setShowFilters] = useState(false); // New: Collapse Filters
    const [currentPage, setCurrentPage] = useState(1);

    // Reset pagination when filters change
    const handleSearchChange = (val: string) => { setSearchTerm(val); setCurrentPage(1); };
    const handleTabChange = (val: string) => { setActiveTab(val); setCurrentPage(1); };

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

    const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE);
    const paginatedCustomers = filteredCustomers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

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
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [newCustomer, setNewCustomer] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        taxNumber: '',
        taxOffice: '',
        contactPerson: '',
        iban: '',
        customerClass: '',
        referredByCode: ''
    });
    const [editCustomer, setEditCustomer] = useState<any>({
        id: '',
        name: '',
        phone: '',
        email: '',
        address: '',
        taxNumber: '',
        taxOffice: '',
        contactPerson: '',
        iban: '',
        customerClass: '',
        referredByCode: ''
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

                setNewCustomer({ name: '', phone: '', email: '', address: '', taxNumber: '', taxOffice: '', contactPerson: '', iban: '', customerClass: '', referredByCode: '' });
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

    const handleEditCustomer = async () => {
        if (!editCustomer.name) {
            showWarning("Eksik Bilgi", "İsim zorunludur!");
            return;
        }

        if (isProcessing) return;

        setIsProcessing(true);
        try {
            const res = await fetch('/api/customers', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editCustomer)
            });
            const data = await res.json();
            if (data.success) {
                showSuccess("Başarılı", "Müşteri başarıyla güncellendi.");
                setIsEditModalOpen(false);
                setEditCustomer({ id: '', name: '', phone: '', email: '', address: '', taxNumber: '', taxOffice: '', contactPerson: '', iban: '', customerClass: '', referredByCode: '' });
                window.location.reload();
            } else {
                showError("Hata", data.error || "Beklenmedik bir hata oluştu.");
            }

        } catch (error: any) {
            console.error(error);
            showError("Hata", "Müşteri güncellenirken bir hata oluştu.");
        } finally {
            setIsProcessing(false);
        }
    };

    // Handle edit parameter from URL
    useEffect(() => {
        const editId = searchParams.get('edit');
        if (editId && customers.length > 0) {
            const customerToEdit = customers.find(c => c.id === editId);
            if (customerToEdit) {
                setEditCustomer({
                    id: customerToEdit.id,
                    name: customerToEdit.name || '',
                    phone: customerToEdit.phone || '',
                    email: customerToEdit.email || '',
                    address: customerToEdit.address || '',
                    taxNumber: (customerToEdit as any).taxNumber || '',
                    taxOffice: (customerToEdit as any).taxOffice || '',
                    contactPerson: (customerToEdit as any).contactPerson || '',
                    iban: (customerToEdit as any).iban || '',
                    customerClass: (customerToEdit as any).customerClass || '',
                    referredByCode: (customerToEdit as any).referredByCode || ''
                });
                setIsEditModalOpen(true);
                // Clear URL parameter
                window.history.replaceState({}, '', '/customers');
            }
        }
    }, [searchParams, customers]);

    const handleDeleteCustomer = (id: string | number) => {
        if (!canDelete) return;
        if (isProcessing) return;

        showConfirm(
            'Emin misiniz?',
            'Bu müşteriyi (cari) silmek istediğinize emin misiniz? Bu işlem geri alınamaz.',
            async () => {
                setIsProcessing(true);
                try {
                    const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
                    const data = await res.json();
                    if (data.success) {
                        showSuccess("Başarılı", "Müşteri kaydı silindi.");
                        window.location.reload();
                    } else {
                        showError("İşlem Başarısız", data.error || "Silme işlemi sırasında bir hata oluştu.");
                    }
                } catch (error: any) {
                    showError("Hata", "Müşteri silinirken bir hata oluştu.");
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
                            onChange={(e) => handleSearchChange(e.target.value)}
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
                                            onClick={() => handleTabChange(tab.id)}
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                    {paginatedCustomers.map(cust => (
                        <div
                            key={cust.id}
                            className="card glass hover-scale"
                            style={{
                                padding: '0',
                                overflow: 'hidden',
                                border: '1px solid rgba(255,255,255,0.08)',
                                background: 'linear-gradient(135deg, rgba(15,17,26,0.95) 0%, rgba(20,22,35,0.95) 100%)',
                                backdropFilter: 'blur(10px)',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            {/* Header with gradient */}
                            <div style={{
                                padding: '20px 24px',
                                background: 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.05) 100%)',
                                borderBottom: '1px solid rgba(59,130,246,0.1)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                    {/* Avatar */}
                                    <div style={{
                                        width: '56px',
                                        height: '56px',
                                        borderRadius: '16px',
                                        background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '24px',
                                        fontWeight: '900',
                                        color: 'white',
                                        boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)',
                                        border: '2px solid rgba(255,255,255,0.1)'
                                    }}>
                                        {cust.name?.charAt(0).toUpperCase()}
                                    </div>

                                    {/* Balance Badge */}
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{
                                            fontSize: '20px',
                                            fontWeight: '900',
                                            color: cust.balance > 0 ? '#ef4444' : (cust.balance < 0 ? '#10b981' : '#94a3b8'),
                                            textShadow: cust.balance !== 0 ? '0 2px 8px rgba(0,0,0,0.3)' : 'none'
                                        }}>
                                            {formatCurrency(Math.abs(cust.balance))}
                                        </div>
                                        <div style={{
                                            fontSize: '10px',
                                            fontWeight: '700',
                                            color: cust.balance > 0 ? '#ef4444' : (cust.balance < 0 ? '#10b981' : '#64748b'),
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            marginTop: '2px'
                                        }}>
                                            {cust.balance > 0 ? '● Borçlu' : (cust.balance < 0 ? '● Alacaklı' : '● Dengeli')}
                                        </div>
                                    </div>
                                </div>

                                {/* Customer Name */}
                                <h3 style={{
                                    margin: '0 0 8px 0',
                                    fontSize: '18px',
                                    fontWeight: '800',
                                    color: 'white',
                                    letterSpacing: '-0.3px',
                                    lineHeight: '1.3'
                                }}>
                                    {cust.name}
                                </h3>

                                {/* Points & Referral Code */}
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                                    <span style={{
                                        fontSize: '11px',
                                        fontWeight: '700',
                                        color: '#10b981',
                                        background: 'rgba(16,185,129,0.1)',
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        border: '1px solid rgba(16,185,129,0.2)'
                                    }}>
                                        ⭐ {Number(cust.points || 0).toFixed(0)} Puan
                                    </span>
                                    <span style={{
                                        fontSize: '11px',
                                        fontWeight: '700',
                                        color: '#8b5cf6',
                                        background: 'rgba(139,92,246,0.1)',
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        border: '1px solid rgba(139,92,246,0.2)'
                                    }}>
                                        🔑 {cust.referralCode}
                                    </span>
                                </div>

                                {/* Category & Branch */}
                                <div style={{ display: 'flex', gap: '6px', fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>
                                    <span>{cust.category || 'Genel'}</span>
                                    <span>•</span>
                                    <span>{cust.branch || 'Merkez'}</span>
                                </div>
                            </div>

                            {/* Contact Info */}
                            <div style={{ padding: '16px 24px', background: 'rgba(0,0,0,0.2)' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#cbd5e1' }}>
                                        <span style={{ fontSize: '16px' }}>📞</span>
                                        <span style={{ fontWeight: '500' }}>{cust.phone || '-'}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#cbd5e1' }}>
                                        <span style={{ fontSize: '16px' }}>📧</span>
                                        <span style={{
                                            fontWeight: '500',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {cust.email || '-'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div style={{
                                padding: '16px 24px',
                                background: 'rgba(0,0,0,0.3)',
                                borderTop: '1px solid rgba(255,255,255,0.05)',
                                display: 'flex',
                                gap: '8px'
                            }}>
                                <Link
                                    href={`/customers/${cust.id}`}
                                    className="btn btn-primary"
                                    style={{
                                        flex: 1,
                                        textAlign: 'center',
                                        padding: '12px',
                                        fontSize: '13px',
                                        fontWeight: '700',
                                        textDecoration: 'none',
                                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                        border: 'none',
                                        boxShadow: '0 4px 12px rgba(59,130,246,0.3)'
                                    }}
                                >
                                    📋 Detay & İşlemler
                                </Link>
                                <a
                                    href={`tel:${cust.phone}`}
                                    className="btn btn-outline"
                                    style={{
                                        padding: '12px 16px',
                                        fontSize: '18px',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    📞
                                </a>
                                <a
                                    href={`https://wa.me/${cust.phone?.replace(/\s/g, '')}`}
                                    target="_blank"
                                    className="btn btn-outline"
                                    style={{
                                        padding: '12px 16px',
                                        fontSize: '18px',
                                        color: '#25D366',
                                        background: 'rgba(37,211,102,0.1)',
                                        border: '1px solid rgba(37,211,102,0.3)',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    💬
                                </a>
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
                            {paginatedCustomers.map(cust => (
                                <tr key={cust.id} style={{ borderBottom: '1px solid var(--border-light)', transition: 'background 0.2s' }} className="hover-bg">
                                    <td style={{ padding: '20px' }}>
                                        <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{cust.name}</div>
                                        <div style={{ fontSize: '11px', color: '#00e676' }}>Puan: {Number(cust.points || 0).toFixed(0)} | Kod: {cust.referralCode}</div>
                                        {(cust as any).taxNumber && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>VKN: {(cust as any).taxNumber}</div>}
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '13px', color: 'var(--text-main)', opacity: 0.8 }}>{cust.phone}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{cust.email}</div>
                                    </td>
                                    <td>
                                        <span style={{ padding: '4px 8px', borderRadius: '4px', background: 'var(--input-bg)', fontSize: '11px', color: 'var(--text-muted)' }}>
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
                                        <Link href={`/customers/${cust.id}`} className="btn btn-sm btn-primary" style={{ textDecoration: 'none', marginRight: '8px' }}>Detay</Link>
                                        <button onClick={() => handleDeleteCustomer(cust.id)} className="btn btn-sm btn-outline" style={{ color: '#ff4444', borderColor: '#ff4444' }}>Sil</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {filteredCustomers.length === 0 && (
                <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--input-bg)', borderRadius: '16px', border: '1px dashed var(--border-light)', marginTop: '20px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '20px', opacity: 0.3 }}>🔍</div>
                    <h3>Kayıt Bulunamadı</h3>
                    <p>Arama kriterlerinize uygun müşteri bulunmuyor.</p>
                </div>
            )}

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
            />

            {/* ADD CUSTOMER MODAL */}
            {isModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'var(--modal-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(5px)' }}>
                    <div className="card glass animate-in" style={{ width: '600px', background: 'var(--bg-card)', border: '1px solid var(--border-light)', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="flex-between mb-6" style={{ paddingBottom: '20px', borderBottom: '1px solid var(--border-light)' }}>
                            <h3 style={{ margin: 0, color: 'var(--text-main)' }}>👤 Yeni Müşteri Ekle</h3>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-main)', fontSize: '24px', cursor: 'pointer' }}>×</button>
                        </div>
                        <div className="flex-col gap-4">
                            <div className="grid-cols-2 gap-4" style={{ display: 'grid' }}>
                                <div>
                                    <label className="text-muted" style={{ fontSize: '11px', fontWeight: 'bold' }}>AD SOYAD / UNVAN <span style={{ color: 'red' }}>*</span></label>
                                    <input type="text" value={newCustomer.name} onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })} style={{ width: '100%', padding: '12px', background: 'var(--input-bg)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'var(--text-main)' }} />
                                </div>
                                <div>
                                    <label className="text-muted" style={{ fontSize: '11px', fontWeight: 'bold' }}>YETKİLİ KİŞİ</label>
                                    <input type="text" value={newCustomer.contactPerson} onChange={e => setNewCustomer({ ...newCustomer, contactPerson: e.target.value })} style={{ width: '100%', padding: '12px', background: 'var(--input-bg)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'var(--text-main)' }} />
                                </div>
                            </div>

                            <div className="grid-cols-2 gap-4" style={{ display: 'grid' }}>
                                <div>
                                    <label className="text-muted" style={{ fontSize: '11px', fontWeight: 'bold' }}>TELEFON</label>
                                    <input type="text" value={newCustomer.phone} onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })} style={{ width: '100%', padding: '12px', background: 'var(--input-bg)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'var(--text-main)' }} />
                                </div>
                                <div>
                                    <label className="text-muted" style={{ fontSize: '11px', fontWeight: 'bold' }}>E-POSTA</label>
                                    <input type="text" value={newCustomer.email} onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })} style={{ width: '100%', padding: '12px', background: 'var(--input-bg)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'var(--text-main)' }} />
                                </div>
                            </div>

                            <div className="grid-cols-2 gap-4" style={{ display: 'grid' }}>
                                <div>
                                    <label className="text-muted" style={{ fontSize: '11px', fontWeight: 'bold' }}>VERGİ NO / TC</label>
                                    <input type="text" value={newCustomer.taxNumber} onChange={e => setNewCustomer({ ...newCustomer, taxNumber: e.target.value })} style={{ width: '100%', padding: '12px', background: 'var(--input-bg)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'var(--text-main)' }} />
                                </div>
                                <div>
                                    <label className="text-muted" style={{ fontSize: '11px', fontWeight: 'bold' }}>VERGİ DAİRESİ</label>
                                    <input type="text" value={newCustomer.taxOffice} onChange={e => setNewCustomer({ ...newCustomer, taxOffice: e.target.value })} style={{ width: '100%', padding: '12px', background: 'var(--input-bg)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'var(--text-main)' }} />
                                </div>
                            </div>

                            <div>
                                <label className="text-muted" style={{ fontSize: '11px', fontWeight: 'bold' }}>IBAN</label>
                                <input type="text" placeholder="TR..." value={newCustomer.iban} onChange={e => setNewCustomer({ ...newCustomer, iban: e.target.value })} style={{ width: '100%', padding: '12px', background: 'var(--input-bg)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'var(--text-main)' }} />
                            </div>

                            <div className="grid-cols-2 gap-4" style={{ display: 'grid' }}>
                                <div>
                                    <label className="text-muted" style={{ fontSize: '11px', fontWeight: 'bold' }}>MÜŞTERİ SINIFI</label>
                                    <select
                                        value={newCustomer.customerClass}
                                        onChange={e => setNewCustomer({ ...newCustomer, customerClass: e.target.value })}
                                        style={{ width: '100%', padding: '12px', background: 'var(--input-bg)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'var(--text-main)' }}
                                    >
                                        <option value="">Sınıf Seçin...</option>
                                        {(custClasses || []).map(cls => (
                                            <option key={cls} value={cls}>{cls}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-muted" style={{ fontSize: '11px', fontWeight: 'bold' }}>REFERANS KODU (Varsa)</label>
                                    <input type="text" value={newCustomer.referredByCode} onChange={e => setNewCustomer({ ...newCustomer, referredByCode: e.target.value.toUpperCase() })} placeholder="DAVET KODU" style={{ width: '100%', padding: '12px', background: 'var(--input-bg)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'var(--text-main)' }} />
                                </div>
                            </div>

                            <div>
                                <label className="text-muted" style={{ fontSize: '11px', fontWeight: 'bold' }}>ADRES</label>
                                <textarea value={newCustomer.address} onChange={e => setNewCustomer({ ...newCustomer, address: e.target.value })} style={{ width: '100%', padding: '12px', background: 'var(--input-bg)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'var(--text-main)', minHeight: '80px', resize: 'vertical' }} />
                            </div>
                            <button onClick={handleAddCustomer} disabled={isProcessing} className="btn btn-primary w-full" style={{ padding: '16px', marginTop: '10px', fontSize: '16px' }}>
                                {isProcessing ? 'KAYDEDİLİYOR...' : 'KAYDET'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT CUSTOMER MODAL */}
            {isEditModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(5px)' }}>
                    <div className="card glass animate-in" style={{ width: '600px', background: '#1e1e24', border: '1px solid rgba(255,255,255,0.1)', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="flex-between mb-6" style={{ paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <h3 style={{ margin: 0 }}>✏️ Müşteri Düzenle</h3>
                            <button onClick={() => setIsEditModalOpen(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' }}>×</button>
                        </div>
                        <div className="flex-col gap-4">
                            <div className="grid-cols-2 gap-4" style={{ display: 'grid' }}>
                                <div>
                                    <label className="text-muted" style={{ fontSize: '12px' }}>MÜŞTERİ ADI <span style={{ color: 'red' }}>*</span></label>
                                    <input type="text" value={editCustomer.name} onChange={e => setEditCustomer({ ...editCustomer, name: e.target.value })} style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }} />
                                </div>
                                <div>
                                    <label className="text-muted" style={{ fontSize: '12px' }}>TELEFON</label>
                                    <input type="text" value={editCustomer.phone} onChange={e => setEditCustomer({ ...editCustomer, phone: e.target.value })} style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }} />
                                </div>
                            </div>

                            <div className="grid-cols-2 gap-4" style={{ display: 'grid' }}>
                                <div>
                                    <label className="text-muted" style={{ fontSize: '12px' }}>E-POSTA</label>
                                    <input type="text" value={editCustomer.email} onChange={e => setEditCustomer({ ...editCustomer, email: e.target.value })} style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }} />
                                </div>
                                <div>
                                    <label className="text-muted" style={{ fontSize: '12px' }}>MÜŞTERİ SINIFI</label>
                                    <select value={editCustomer.customerClass} onChange={e => setEditCustomer({ ...editCustomer, customerClass: e.target.value })} style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }}>
                                        <option value="">Sınıf Seçin...</option>
                                        {custClasses.map(cls => (
                                            <option key={cls} value={cls}>{cls}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid-cols-2 gap-4" style={{ display: 'grid' }}>
                                <div>
                                    <label className="text-muted" style={{ fontSize: '12px' }}>VERGİ NO</label>
                                    <input type="text" value={editCustomer.taxNumber} onChange={e => setEditCustomer({ ...editCustomer, taxNumber: e.target.value })} style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }} />
                                </div>
                                <div>
                                    <label className="text-muted" style={{ fontSize: '12px' }}>VERGİ DAİRESİ</label>
                                    <input type="text" value={editCustomer.taxOffice} onChange={e => setEditCustomer({ ...editCustomer, taxOffice: e.target.value })} style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }} />
                                </div>
                            </div>

                            <div>
                                <label className="text-muted" style={{ fontSize: '12px' }}>YETKİLİ KİŞİ</label>
                                <input type="text" value={editCustomer.contactPerson} onChange={e => setEditCustomer({ ...editCustomer, contactPerson: e.target.value })} style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }} />
                            </div>

                            <div>
                                <label className="text-muted" style={{ fontSize: '12px' }}>IBAN</label>
                                <input type="text" placeholder="TR..." value={editCustomer.iban} onChange={e => setEditCustomer({ ...editCustomer, iban: e.target.value })} style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }} />
                            </div>

                            <div>
                                <label className="text-muted" style={{ fontSize: '12px' }}>ADRES</label>
                                <textarea value={editCustomer.address} onChange={e => setEditCustomer({ ...editCustomer, address: e.target.value })} style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', minHeight: '80px' }} />
                            </div>

                            <button onClick={handleEditCustomer} disabled={isProcessing} className="btn btn-primary w-full" style={{ padding: '16px', marginTop: '10px' }}>
                                {isProcessing ? 'GÜNCELLENİYOR...' : 'DEĞİŞİKLİKLERİ KAYDET'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
