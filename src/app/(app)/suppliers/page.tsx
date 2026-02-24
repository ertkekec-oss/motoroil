
"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useCRM } from '@/contexts/CRMContext';
import { useModal } from '@/contexts/ModalContext';
import SupplierPurchaseModal from '@/components/modals/SupplierPurchaseModal';
import { formatCurrency } from '@/lib/utils';
import Pagination from '@/components/Pagination';
import { TURKISH_CITIES, TURKISH_DISTRICTS } from '@/lib/constants';
import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export default function SuppliersPage() {
    const router = useRouter();
    const { currentUser, branches, hasPermission, activeBranchName } = useApp();
    const { suppliers, suppClasses: dbSuppClasses } = useCRM();
    const { showSuccess, showError, showConfirm } = useModal();

    // ── Theme ──
    const { theme } = useTheme();

    // UI States
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [branchFilter, setBranchFilter] = useState(activeBranchName || 'all');

    useEffect(() => {
        if (activeBranchName) {
            setBranchFilter(activeBranchName);
            setNewSupplier(prev => ({ ...prev, branch: activeBranchName }));
            setCurrentPage(1);
        }
    }, [activeBranchName]);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [newSupplier, setNewSupplier] = useState({
        name: '', phone: '', email: '', address: '', city: 'İstanbul', district: '', category: '',
        taxNumber: '', taxOffice: '', contactPerson: '', iban: '',
        branch: activeBranchName || currentUser?.branch || 'Merkez'
    });
    const [editSupplier, setEditSupplier] = useState<any>({
        id: '', name: '', phone: '', email: '', address: '', city: '', district: '', category: '',
        taxNumber: '', taxOffice: '', contactPerson: '', iban: '', branch: ''
    });

    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
    const [selectedSup, setSelectedSup] = useState<any>(null);

    // --- FILTER LOGIC ---
    const filteredSuppliers = suppliers.filter(sup => {
        if (searchTerm) {
            const low = searchTerm.toLowerCase();
            const match =
                (sup.name || '').toLowerCase().includes(low) ||
                (sup.phone || '').includes(searchTerm) ||
                (sup.city || '').toLowerCase().includes(low) ||
                (sup.category || '').toLowerCase().includes(low);
            if (!match) return false;
        }
        if (activeTab === 'debt' && sup.balance >= 0) return false;
        if (activeTab === 'credit' && sup.balance <= 0) return false;
        if (activeTab === 'passive' && sup.isActive !== false) return false;
        if (branchFilter !== 'all' && (sup.branch || 'Merkez') !== branchFilter) return false;
        return true;
    });

    const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage);
    const paginatedSuppliers = filteredSuppliers.slice(
        (currentPage - 1) * itemsPerPage, currentPage * itemsPerPage
    );

    // Stats
    const totalDebt = suppliers.filter(s => s.balance < 0).reduce((acc, s) => acc + Math.abs(s.balance), 0);
    const totalCredit = suppliers.filter(s => s.balance > 0).reduce((acc, s) => acc + s.balance, 0);

    const handleAddSupplier = async () => {
        if (!newSupplier.name) { showError('Hata', 'Firma adı zorunludur!'); return; }
        if (isProcessing) return;
        setIsProcessing(true);
        try {
            const res = await fetch('/api/suppliers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newSupplier) });
            const data = await res.json();
            if (data.success) {
                showSuccess('Başarılı', 'Tedarikçi başarıyla oluşturuldu.');
                setIsModalOpen(false);
                setNewSupplier({ name: '', phone: '', email: '', address: '', city: 'İstanbul', district: '', category: '', taxNumber: '', taxOffice: '', contactPerson: '', iban: '', branch: activeBranchName || currentUser?.branch || 'Merkez' });
                window.location.reload();
            } else { showError('Hata', data.error); }
        } catch (e: any) { showError('Hata', 'Bir hata oluştu.'); }
        finally { setIsProcessing(false); }
    };

    const handleEditSupplier = async () => {
        if (!editSupplier.name) { showError('Hata', 'Firma adı zorunludur!'); return; }
        if (isProcessing) return;
        setIsProcessing(true);
        try {
            const res = await fetch(`/api/suppliers/${editSupplier.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editSupplier) });
            const data = await res.json();
            if (data.success) {
                showSuccess('Başarılı', 'Tedarikçi başarıyla güncellendi.');
                setIsEditModalOpen(false);
                window.location.reload();
            } else { showError('Hata', data.error); }
        } catch (e: any) { showError('Hata', 'Bir hata oluştu.'); }
        finally { setIsProcessing(false); }
    };

    const handleDeleteSupplier = async (supplier: any) => {
        showConfirm('Tedarikçiyi Sil', `"${supplier.name}" tedarikçisini silmek istediğinizden emin misiniz?`, async () => {
            try {
                const res = await fetch(`/api/suppliers?id=${supplier.id}`, { method: 'DELETE' });
                const data = await res.json();
                if (data.success) { showSuccess('Başarılı', 'Tedarikçi silindi.'); window.location.reload(); }
                else showError('Hata', data.error || 'Silme başarısız.');
            } catch { showError('Hata', 'Bir hata oluştu.'); }
        });
    };

    // ── Design tokens ──
    const isLight = theme === 'light';
    const L = {
        pageBg: '#F7F9FB',
        card: '#FFFFFF',
        border: '#E6EBF0',
        filterBg: '#F0F4F9',
        textMain: '#1A1F36',
        textMuted: '#8B95A5',
        textSubtle: '#B8C0C8',
        primary: '#247BFE',
        primaryLight: 'rgba(36,123,254,0.08)',
        success: '#02C951',
        successLight: 'rgba(2,201,81,0.1)',
        danger: '#E53E3E',
        dangerLight: 'rgba(229,62,62,0.08)',
        amber: '#C9AF7C',
        amberLight: 'rgba(201,175,124,0.1)',
        purple: '#6260FE',
        shadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
        shadowHover: '0 4px 20px rgba(36,123,254,0.12)',
    };

    const inputStyle = {
        width: '100%', padding: '12px',
        background: isLight ? L.filterBg : 'rgba(0,0,0,0.3)',
        border: `1px solid ${isLight ? L.border : 'rgba(255,255,255,0.1)'}`,
        borderRadius: '8px',
        color: isLight ? L.textMain : 'white',
    };
    const modalCardStyle = {
        width: '600px',
        background: isLight ? L.card : '#1e1e24',
        border: `1px solid ${isLight ? L.border : 'rgba(255,255,255,0.1)'}`,
        maxHeight: '90vh', overflowY: 'auto' as const,
        borderRadius: '16px', boxShadow: isLight ? '0 20px 60px rgba(0,0,0,0.12)' : undefined,
    };

    const tabLabels: Record<string, string> = { all: 'Tümü', debt: 'Borçlular', credit: 'Alacaklılar', passive: 'Pasifler' };

    return (
        <div data-pos-theme={theme} className="container"
            style={{ padding: '30px', maxWidth: '1600px', margin: '0 auto', background: isLight ? L.pageBg : undefined }}>

            {/* HEADER */}
            <header style={{ marginBottom: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: '800', margin: 0, color: isLight ? L.textMain : undefined }}
                            className={isLight ? '' : 'text-gradient'}>
                            Tedarikçi Yönetimi
                        </h1>
                        <p style={{ marginTop: '6px', fontSize: '14px', color: isLight ? L.textMuted : undefined }}
                            className={isLight ? '' : 'text-muted'}>
                            Toptancı listesi, bakiyeler ve satın alma işlemleri
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary"
                            style={{
                                padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px',
                                background: isLight ? L.primary : undefined,
                                boxShadow: isLight ? '0 4px 14px rgba(36,123,254,0.3)' : '0 4px 12px rgba(59,130,246,0.3)',
                                borderRadius: isLight ? '12px' : undefined, border: 'none', color: 'white'
                            }}>
                            <span style={{ fontSize: '16px' }}>+</span> Yeni Tedarikçi
                        </button>
                    </div>
                </div>

                {/* STATS ROW */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: isLight ? '16px' : '20px' }}>
                    {[
                        { label: 'Toplam Tedarikçi', value: suppliers.length, color: L.primary, borderColor: L.primary },
                        { label: 'Toplam Borcumuz', value: formatCurrency(totalDebt), color: L.danger, borderColor: L.danger },
                        { label: 'Toplam Alacağımız', value: formatCurrency(totalCredit), color: L.success, borderColor: L.success },
                        { label: 'Net Durum', value: formatCurrency(totalCredit - totalDebt), color: L.purple, borderColor: L.purple },
                    ].map(({ label, value, color, borderColor }) => (
                        <div key={label}
                            style={isLight
                                ? { background: L.card, border: `1px solid ${L.border}`, borderLeft: `4px solid ${borderColor}`, borderRadius: '14px', padding: '20px', boxShadow: L.shadow }
                                : { padding: '20px', borderLeft: `4px solid ${borderColor}` }}
                            className={isLight ? '' : 'card glass animate-fade-in'}>
                            <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase', color: isLight ? L.textSubtle : undefined }}
                                className={isLight ? '' : 'text-muted'}>{label}</div>
                            <div style={{ fontSize: isLight ? '34px' : '28px', fontWeight: '800', marginTop: '8px', color, lineHeight: 1 }}>{value}</div>
                        </div>
                    ))}
                </div>
            </header>

            {/* CONTROLS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', alignItems: 'center' }}>
                    {/* Search */}
                    <div style={{ position: 'relative', flex: 1, maxWidth: '600px' }}>
                        <input
                            type="text" value={searchTerm}
                            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            placeholder="Tedarikçi adı, kategori veya telefon ile ara..."
                            style={{
                                width: '100%', padding: '14px 20px 14px 50px',
                                background: isLight ? L.card : 'rgba(255,255,255,0.03)',
                                border: isLight ? `1px solid ${L.border}` : '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '14px', color: isLight ? L.textMain : 'white',
                                fontSize: '15px', outline: 'none', transition: 'all 0.2s',
                                boxShadow: isLight ? L.shadow : 'none'
                            }}
                        />
                        <span style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px', opacity: 0.4 }}>🔍</span>
                    </div>

                    {/* Tabs + Branch + View toggle */}
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        {/* Tab pills */}
                        <div style={{
                            display: 'flex', background: isLight ? L.filterBg : 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '4px',
                            border: isLight ? `1px solid ${L.border}` : 'none'
                        }}>
                            {['all', 'debt', 'credit', 'passive'].map(tab => (
                                <button key={tab} onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
                                    style={{
                                        padding: '8px 16px', borderRadius: '9px', border: 'none', cursor: 'pointer', fontSize: '13px', transition: 'all 0.15s',
                                        fontWeight: activeTab === tab ? '600' : '400',
                                        background: activeTab === tab ? (isLight ? L.primary : 'rgba(255,255,255,0.1)') : 'transparent',
                                        color: activeTab === tab ? (isLight ? 'white' : '#fff') : (isLight ? L.textMuted : '#888')
                                    }}>
                                    {tabLabels[tab]}
                                </button>
                            ))}
                        </div>

                        {/* Branch select */}
                        <select value={branchFilter} onChange={e => { setBranchFilter(e.target.value); setCurrentPage(1); }}
                            disabled={!hasPermission('branch_administration')}
                            style={{
                                padding: '10px 14px', borderRadius: '10px', fontSize: '13px',
                                background: isLight ? L.filterBg : 'rgba(255,255,255,0.03)',
                                border: isLight ? `1px solid ${L.border}` : '1px solid rgba(255,255,255,0.1)',
                                color: isLight ? L.textMain : 'white'
                            }}>
                            {hasPermission('branch_administration') && <option value="all">Tüm Şubeler</option>}
                            {branches.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
                        </select>

                        {/* Grid / List toggle */}
                        <div style={{
                            background: isLight ? L.filterBg : 'rgba(255,255,255,0.03)', padding: '5px', borderRadius: '12px', display: 'flex',
                            border: isLight ? `1px solid ${L.border}` : '1px solid rgba(255,255,255,0.1)'
                        }}>
                            <button onClick={() => setViewMode('grid')}
                                style={{
                                    padding: '10px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '16px',
                                    background: viewMode === 'grid' ? L.primary : 'transparent',
                                    color: viewMode === 'grid' ? 'white' : (isLight ? L.textMuted : '#888')
                                }}>⊞</button>
                            <button onClick={() => setViewMode('list')}
                                style={{
                                    padding: '10px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '16px',
                                    background: viewMode === 'list' ? L.primary : 'transparent',
                                    color: viewMode === 'list' ? 'white' : (isLight ? L.textMuted : '#888')
                                }}>≣</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* LISTING */}
            {viewMode === 'grid' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                    {paginatedSuppliers.map(sup => {
                        const balColor = sup.balance < 0 ? L.danger : (sup.balance > 0 ? L.success : (isLight ? L.textMuted : '#ccc'));
                        return (
                            <div key={sup.id}
                                style={isLight
                                    ? { background: L.card, border: `1px solid ${L.border}`, borderRadius: '16px', boxShadow: L.shadow, overflow: 'hidden', transition: 'box-shadow 0.2s ease' }
                                    : { padding: '0', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}
                                className={isLight ? '' : 'card glass hover-scale'}
                                onMouseEnter={e => { if (isLight) (e.currentTarget as HTMLElement).style.boxShadow = L.shadowHover; }}
                                onMouseLeave={e => { if (isLight) (e.currentTarget as HTMLElement).style.boxShadow = L.shadow; }}>

                                {/* Card Header */}
                                <div style={isLight
                                    ? { padding: '24px', background: L.amberLight, borderBottom: `1px solid ${L.border}` }
                                    : { padding: '24px', background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        {/* Avatar */}
                                        <div style={{
                                            width: '48px', height: '48px', borderRadius: '14px',
                                            background: isLight ? 'linear-gradient(135deg, #C9AF7C 0%, #a8883c 100%)' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '20px', fontWeight: 'bold', color: 'white',
                                            boxShadow: isLight ? '0 4px 12px rgba(201,175,124,0.4)' : '0 4px 10px rgba(245,158,11,0.3)'
                                        }}>
                                            {sup.name?.charAt(0).toUpperCase()}
                                        </div>
                                        {/* Balance */}
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '16px', fontWeight: '800', color: balColor }}>
                                                {formatCurrency(Math.abs(sup.balance))}
                                            </div>
                                            <div style={{ fontSize: '10px', fontWeight: '700', color: balColor, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>
                                                {sup.balance < 0 ? '● Borçluyuz' : (sup.balance > 0 ? '● Alacaklıyız' : '● Dengeli')}
                                            </div>
                                        </div>
                                    </div>
                                    <h3 style={{
                                        margin: '14px 0 6px 0', fontSize: '17px', fontWeight: '800',
                                        color: isLight ? L.textMain : 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                                    }}>
                                        {sup.name}
                                    </h3>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                        <span style={{
                                            fontSize: '11px', fontWeight: '600', padding: '4px 12px', borderRadius: '20px',
                                            background: isLight ? L.filterBg : 'rgba(255,255,255,0.1)',
                                            color: isLight ? L.textMuted : '#ccc',
                                            border: isLight ? `1px solid ${L.border}` : 'none'
                                        }}>
                                            {sup.category || 'Genel'}
                                        </span>
                                        {sup.isActive === false && (
                                            <span style={{ fontSize: '11px', color: L.danger, fontWeight: '700' }}>● Pasif</span>
                                        )}
                                    </div>
                                </div>

                                {/* Contact Info */}
                                <div style={{
                                    padding: '16px 24px', borderTop: `1px solid ${isLight ? L.border : 'rgba(255,255,255,0.05)'}`,
                                    background: isLight ? L.filterBg : 'transparent', display: 'flex', flexDirection: 'column', gap: '8px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: isLight ? L.textMain : '#aaa' }}>
                                        <span>📞</span> {sup.phone || '-'}
                                    </div>
                                    {sup.contactPerson && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: isLight ? L.textMuted : '#aaa' }}>
                                            <span>👤</span> {sup.contactPerson}
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div style={{
                                    padding: '16px 24px', background: isLight ? L.card : 'rgba(0,0,0,0.2)',
                                    borderTop: `1px solid ${isLight ? L.border : 'rgba(255,255,255,0.05)'}`,
                                    display: 'flex', flexDirection: 'column', gap: '10px'
                                }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                        <button onClick={() => { setEditSupplier(sup); setIsEditModalOpen(true); }}
                                            style={{
                                                fontSize: '12px', padding: '8px', borderRadius: '8px', cursor: 'pointer',
                                                border: `1px solid ${L.success}`, background: isLight ? L.successLight : 'transparent', color: L.success
                                            }}>
                                            ✏️ Düzenle
                                        </button>
                                        <button onClick={() => handleDeleteSupplier(sup)}
                                            style={{
                                                fontSize: '12px', padding: '8px', borderRadius: '8px', cursor: 'pointer',
                                                border: `1px solid ${L.danger}`, background: isLight ? L.dangerLight : 'transparent', color: L.danger
                                            }}>
                                            🗑️ Sil
                                        </button>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                        <button onClick={() => { setSelectedSup(sup); setIsPurchaseModalOpen(true); }}
                                            style={{
                                                fontSize: '12px', padding: '8px', borderRadius: '8px', cursor: 'pointer',
                                                border: `1px solid ${L.primary}`, background: isLight ? L.primaryLight : 'transparent', color: L.primary
                                            }}>
                                            🛒 Alış Gir
                                        </button>
                                        <button onClick={() => router.push(`/payment?amount=${Math.abs(sup.balance)}&title=${encodeURIComponent(sup.name)}&type=payable&ref=SUP-${sup.id}`)}
                                            style={{
                                                fontSize: '12px', padding: '8px', borderRadius: '8px', cursor: 'pointer',
                                                border: `1px solid ${isLight ? L.border : 'rgba(255,255,255,0.15)'}`,
                                                background: 'transparent', color: isLight ? L.textMuted : '#aaa'
                                            }}>
                                            💸 Ödeme Yap
                                        </button>
                                    </div>
                                    <Link href={`/suppliers/${sup.id}`}
                                        style={{
                                            textAlign: 'center', padding: '10px', fontSize: '13px', fontWeight: '700', textDecoration: 'none',
                                            borderRadius: '10px', display: 'block',
                                            background: isLight ? L.primary : 'var(--primary)',
                                            color: 'white', boxShadow: isLight ? '0 4px 12px rgba(36,123,254,0.28)' : undefined
                                        }}>
                                        İşlem Detayları &amp; Ekstre
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div style={isLight
                    ? { background: L.card, border: `1px solid ${L.border}`, borderRadius: '16px', boxShadow: L.shadow, overflow: 'hidden' }
                    : { overflow: 'hidden' }}
                    className={isLight ? '' : 'card glass'}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{
                                background: isLight ? L.filterBg : 'rgba(255,255,255,0.03)',
                                borderBottom: `1px solid ${isLight ? L.border : 'rgba(255,255,255,0.06)'}`,
                                fontSize: '11px', fontWeight: '700', letterSpacing: '0.06em',
                                textTransform: 'uppercase', color: isLight ? L.textSubtle : '#888'
                            }}>
                                <th style={{ padding: '16px 20px' }}>Firma</th>
                                <th>Kategori</th>
                                <th>İletişim</th>
                                <th>Bakiye</th>
                                <th style={{ textAlign: 'right', paddingRight: '20px' }}>İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedSuppliers.map(sup => (
                                <tr key={sup.id}
                                    style={{
                                        borderBottom: `1px solid ${isLight ? L.border : 'rgba(255,255,255,0.05)'}`,
                                        background: isLight ? L.card : 'transparent', transition: 'background 0.15s ease'
                                    }}
                                    onMouseEnter={e => { if (isLight) (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(36,123,254,0.04)'; }}
                                    onMouseLeave={e => { if (isLight) (e.currentTarget as HTMLTableRowElement).style.background = L.card; }}>
                                    <td style={{ padding: '18px 20px' }}>
                                        <div style={{ fontWeight: '600', fontSize: '14px', color: isLight ? L.textMain : 'white' }}>{sup.name}</div>
                                        {sup.isActive === false && <span style={{ fontSize: '10px', color: L.danger, fontWeight: '700' }}>● Pasif</span>}
                                    </td>
                                    <td>
                                        <span style={{
                                            fontSize: '12px', padding: '5px 12px', borderRadius: '20px', fontWeight: '600',
                                            background: isLight ? L.filterBg : 'rgba(255,255,255,0.1)',
                                            border: isLight ? `1px solid ${L.border}` : 'none',
                                            color: isLight ? L.textMuted : '#ccc'
                                        }}>
                                            {sup.category || '-'}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '13px', color: isLight ? L.textMain : '#ccc' }}>{sup.phone}</div>
                                        {sup.contactPerson && <div style={{ fontSize: '11px', color: isLight ? L.textMuted : '#666', marginTop: '2px' }}>Yetkili: {sup.contactPerson}</div>}
                                    </td>
                                    <td>
                                        <span style={{
                                            fontWeight: '700', fontSize: '14px',
                                            color: sup.balance < 0 ? L.danger : (sup.balance > 0 ? L.success : (isLight ? L.textMuted : '#ccc'))
                                        }}>
                                            {formatCurrency(Math.abs(sup.balance))}
                                        </span>
                                        <div style={{ fontSize: '10px', opacity: 0.7, color: isLight ? L.textMuted : undefined }}>
                                            {sup.balance < 0 ? 'Borçluyuz' : (sup.balance > 0 ? 'Alacaklıyız' : '-')}
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                            <button onClick={() => { setEditSupplier(sup); setIsEditModalOpen(true); }}
                                                style={{ padding: '7px 12px', borderRadius: '8px', border: `1px solid ${L.success}`, background: 'transparent', color: L.success, cursor: 'pointer', fontSize: '13px' }}>✏️</button>
                                            <button onClick={() => handleDeleteSupplier(sup)}
                                                style={{ padding: '7px 12px', borderRadius: '8px', border: `1px solid ${L.danger}`, background: 'transparent', color: L.danger, cursor: 'pointer', fontSize: '13px' }}>🗑️</button>
                                            <button onClick={() => { setSelectedSup(sup); setIsPurchaseModalOpen(true); }}
                                                style={{ padding: '7px 12px', borderRadius: '8px', border: `1px solid ${L.primary}`, background: 'transparent', color: L.primary, cursor: 'pointer', fontSize: '13px' }}>🛒</button>
                                            <Link href={`/suppliers/${sup.id}`}
                                                style={{
                                                    padding: '7px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', textDecoration: 'none',
                                                    background: L.primary, color: 'white'
                                                }}>Detay</Link>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Empty state */}
            {paginatedSuppliers.length === 0 && (
                <div style={{
                    padding: '60px', textAlign: 'center', marginTop: '20px', borderRadius: '16px',
                    background: isLight ? L.card : 'rgba(255,255,255,0.02)',
                    border: `1px dashed ${isLight ? L.border : 'rgba(255,255,255,0.1)'}`,
                    color: isLight ? L.textMuted : '#888',
                    boxShadow: isLight ? L.shadow : 'none'
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '20px', opacity: 0.3 }}>🔍</div>
                    <h3 style={{ color: isLight ? L.textMain : undefined }}>Kayıt Bulunamadı</h3>
                    <p>Arama kriterlerinize uygun tedarikçi bulunmuyor.</p>
                </div>
            )}

            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

            {/* PURCHASE MODAL */}
            {selectedSup && (
                <SupplierPurchaseModal
                    isOpen={isPurchaseModalOpen}
                    onClose={() => setIsPurchaseModalOpen(false)}
                    supplierId={selectedSup.id}
                    supplierName={selectedSup.name}
                />
            )}

            {/* ADD MODAL */}
            {isModalOpen && (
                <div style={{
                    position: 'fixed', inset: 0, background: isLight ? 'rgba(15,23,42,0.55)' : 'rgba(0,0,0,0.8)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(6px)'
                }}>
                    <div className="card glass animate-in" style={modalCardStyle}>
                        <div className="flex-between mb-6" style={{ paddingBottom: '20px', borderBottom: `1px solid ${isLight ? L.border : 'rgba(255,255,255,0.1)'}` }}>
                            <h3 style={{ margin: 0, color: isLight ? L.textMain : undefined }}>🏭 Yeni Tedarikçi Ekle</h3>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: isLight ? L.textMuted : 'white', fontSize: '24px', cursor: 'pointer' }}>×</button>
                        </div>
                        <div className="flex-col gap-4">
                            <div className="grid-cols-2 gap-4" style={{ display: 'grid' }}>
                                <div>
                                    <label className="text-muted" style={{ fontSize: '12px' }}>FİRMA ADI <span style={{ color: 'red' }}>*</span></label>
                                    <input type="text" value={newSupplier.name} onChange={e => setNewSupplier({ ...newSupplier, name: e.target.value })} style={inputStyle} />
                                </div>
                                <div>
                                    <label className="text-muted" style={{ fontSize: '12px' }}>YETKİLİ KİŞİ</label>
                                    <input type="text" value={newSupplier.contactPerson} onChange={e => setNewSupplier({ ...newSupplier, contactPerson: e.target.value })} style={inputStyle} />
                                </div>
                            </div>
                            <div className="grid-cols-2 gap-4" style={{ display: 'grid' }}>
                                <div>
                                    <label className="text-muted" style={{ fontSize: '12px' }}>TEDARİKÇİ SINIFI</label>
                                    <select value={newSupplier.category} onChange={e => setNewSupplier({ ...newSupplier, category: e.target.value })} style={inputStyle}>
                                        <option value="">Sınıf Seçin...</option>
                                        {(dbSuppClasses.length > 0 ? dbSuppClasses : ['Saha Tedarikçisi', 'Distribütör', 'Yedek Parça', 'Hizmet']).map(cls => (
                                            <option key={cls} value={cls}>{cls}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-muted" style={{ fontSize: '12px' }}>ŞUBE <span style={{ color: 'red' }}>*</span></label>
                                    <select value={newSupplier.branch} onChange={e => setNewSupplier({ ...newSupplier, branch: e.target.value })} style={inputStyle}>
                                        {(branches || []).map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid-cols-2 gap-4" style={{ display: 'grid' }}>
                                <div>
                                    <label className="text-muted" style={{ fontSize: '12px' }}>TELEFON</label>
                                    <input type="text" value={newSupplier.phone} onChange={e => setNewSupplier({ ...newSupplier, phone: e.target.value })} style={inputStyle} />
                                </div>
                                <div>
                                    <label className="text-muted" style={{ fontSize: '12px' }}>E-POSTA</label>
                                    <input type="text" value={newSupplier.email} onChange={e => setNewSupplier({ ...newSupplier, email: e.target.value })} style={inputStyle} />
                                </div>
                            </div>
                            <div className="grid-cols-2 gap-4" style={{ display: 'grid' }}>
                                <div>
                                    <label className="text-muted" style={{ fontSize: '12px' }}>VERGİ NO</label>
                                    <input type="text" value={newSupplier.taxNumber} onChange={e => setNewSupplier({ ...newSupplier, taxNumber: e.target.value })} style={inputStyle} />
                                </div>
                                <div>
                                    <label className="text-muted" style={{ fontSize: '12px' }}>VERGİ DAİRESİ</label>
                                    <input type="text" value={newSupplier.taxOffice} onChange={e => setNewSupplier({ ...newSupplier, taxOffice: e.target.value })} style={inputStyle} />
                                </div>
                            </div>
                            <div>
                                <label className="text-muted" style={{ fontSize: '12px' }}>IBAN</label>
                                <input type="text" placeholder="TR..." value={newSupplier.iban} onChange={e => setNewSupplier({ ...newSupplier, iban: e.target.value })} style={inputStyle} />
                            </div>
                            <div className="grid-cols-2 gap-4" style={{ display: 'grid' }}>
                                <div>
                                    <label className="text-muted" style={{ fontSize: '12px' }}>ŞEHİR</label>
                                    <select value={newSupplier.city} onChange={e => setNewSupplier({ ...newSupplier, city: e.target.value, district: '' })} style={inputStyle}>
                                        <option value="">Şehir Seçin...</option>
                                        {TURKISH_CITIES.map(city => <option key={city} value={city}>{city}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-muted" style={{ fontSize: '12px' }}>İLÇE</label>
                                    <select value={newSupplier.district} onChange={e => setNewSupplier({ ...newSupplier, district: e.target.value })} disabled={!newSupplier.city} style={inputStyle}>
                                        <option value="">İlçe Seçin...</option>
                                        {(TURKISH_DISTRICTS[newSupplier.city] || []).map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-muted" style={{ fontSize: '12px' }}>ADRES</label>
                                <textarea value={newSupplier.address} onChange={e => setNewSupplier({ ...newSupplier, address: e.target.value })}
                                    style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} />
                            </div>
                            <button onClick={handleAddSupplier} disabled={isProcessing} className="btn btn-primary w-full"
                                style={{ padding: '16px', marginTop: '10px', background: isLight ? L.primary : undefined, borderRadius: '12px', fontSize: '15px', fontWeight: '700' }}>
                                {isProcessing ? 'KAYDEDİLİYOR...' : 'KAYDET'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT MODAL */}
            {isEditModalOpen && (
                <div style={{
                    position: 'fixed', inset: 0, background: isLight ? 'rgba(15,23,42,0.55)' : 'rgba(0,0,0,0.8)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(6px)'
                }}>
                    <div className="card glass animate-in" style={modalCardStyle}>
                        <div className="flex-between mb-6" style={{ paddingBottom: '20px', borderBottom: `1px solid ${isLight ? L.border : 'rgba(255,255,255,0.1)'}` }}>
                            <h3 style={{ margin: 0, color: isLight ? L.textMain : undefined }}>✏️ Tedarikçi Düzenle</h3>
                            <button onClick={() => setIsEditModalOpen(false)} style={{ background: 'none', border: 'none', color: isLight ? L.textMuted : 'white', fontSize: '24px', cursor: 'pointer' }}>×</button>
                        </div>
                        <div className="flex-col gap-4">
                            <div className="grid-cols-2 gap-4" style={{ display: 'grid' }}>
                                <div>
                                    <label className="text-muted" style={{ fontSize: '12px' }}>FİRMA ADI <span style={{ color: 'red' }}>*</span></label>
                                    <input type="text" value={editSupplier.name} onChange={e => setEditSupplier({ ...editSupplier, name: e.target.value })} style={inputStyle} />
                                </div>
                                <div>
                                    <label className="text-muted" style={{ fontSize: '12px' }}>YETKİLİ KİŞİ</label>
                                    <input type="text" value={editSupplier.contactPerson} onChange={e => setEditSupplier({ ...editSupplier, contactPerson: e.target.value })} style={inputStyle} />
                                </div>
                            </div>
                            <div>
                                <label className="text-muted" style={{ fontSize: '12px' }}>TEDARİKÇİ SINIFI</label>
                                <select value={editSupplier.category} onChange={e => setEditSupplier({ ...editSupplier, category: e.target.value })} style={inputStyle}>
                                    <option value="">Sınıf Seçin...</option>
                                    {(dbSuppClasses.length > 0 ? dbSuppClasses : ['Saha Tedarikçisi', 'Distribütör', 'Yedek Parça', 'Hizmet']).map(cls => (
                                        <option key={cls} value={cls}>{cls}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid-cols-2 gap-4" style={{ display: 'grid' }}>
                                <div>
                                    <label className="text-muted" style={{ fontSize: '12px' }}>TELEFON</label>
                                    <input type="text" value={editSupplier.phone} onChange={e => setEditSupplier({ ...editSupplier, phone: e.target.value })} style={inputStyle} />
                                </div>
                                <div>
                                    <label className="text-muted" style={{ fontSize: '12px' }}>E-POSTA</label>
                                    <input type="text" value={editSupplier.email} onChange={e => setEditSupplier({ ...editSupplier, email: e.target.value })} style={inputStyle} />
                                </div>
                            </div>
                            <div className="grid-cols-2 gap-4" style={{ display: 'grid' }}>
                                <div>
                                    <label className="text-muted" style={{ fontSize: '12px' }}>VERGİ NO</label>
                                    <input type="text" value={editSupplier.taxNumber} onChange={e => setEditSupplier({ ...editSupplier, taxNumber: e.target.value })} style={inputStyle} />
                                </div>
                                <div>
                                    <label className="text-muted" style={{ fontSize: '12px' }}>VERGİ DAİRESİ</label>
                                    <input type="text" value={editSupplier.taxOffice} onChange={e => setEditSupplier({ ...editSupplier, taxOffice: e.target.value })} style={inputStyle} />
                                </div>
                            </div>
                            <div>
                                <label className="text-muted" style={{ fontSize: '12px' }}>IBAN</label>
                                <input type="text" placeholder="TR..." value={editSupplier.iban} onChange={e => setEditSupplier({ ...editSupplier, iban: e.target.value })} style={inputStyle} />
                            </div>
                            <div className="grid-cols-2 gap-4" style={{ display: 'grid' }}>
                                <div>
                                    <label className="text-muted" style={{ fontSize: '12px' }}>ŞEHİR</label>
                                    <select value={editSupplier.city} onChange={e => setEditSupplier({ ...editSupplier, city: e.target.value, district: '' })} style={inputStyle}>
                                        <option value="">Şehir Seçin...</option>
                                        {TURKISH_CITIES.map(city => <option key={city} value={city}>{city}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-muted" style={{ fontSize: '12px' }}>İLÇE</label>
                                    <select value={editSupplier.district} onChange={e => setEditSupplier({ ...editSupplier, district: e.target.value })} disabled={!editSupplier.city} style={inputStyle}>
                                        <option value="">İlçe Seçin...</option>
                                        {(TURKISH_DISTRICTS[editSupplier.city] || []).map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-muted" style={{ fontSize: '12px' }}>ADRES</label>
                                <textarea value={editSupplier.address} onChange={e => setEditSupplier({ ...editSupplier, address: e.target.value })}
                                    style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} />
                            </div>
                            <button onClick={handleEditSupplier} disabled={isProcessing} className="btn btn-primary w-full"
                                style={{ padding: '16px', marginTop: '10px', background: isLight ? L.primary : undefined, borderRadius: '12px', fontSize: '15px', fontWeight: '700' }}>
                                {isProcessing ? 'GÜNCELLENİYOR...' : 'DEĞİŞİKLİKLERİ KAYDET'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
