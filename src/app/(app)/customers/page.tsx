
"use client";

import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useCRM } from '@/contexts/CRMContext';
import { useModal } from '@/contexts/ModalContext';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import Pagination from '@/components/Pagination';
import { useSearchParams } from 'next/navigation';
import { TURKISH_CITIES, TURKISH_DISTRICTS } from '@/lib/constants';
import { Sun, Moon } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

export default function CustomersPage() {
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid'); // New: View Toggle
    const { currentUser, hasPermission, branches, activeBranchName } = useApp();
    const { customers, suppClasses, custClasses } = useCRM();
    const { showSuccess, showError, showWarning, showConfirm } = useModal();
    const canDelete = hasPermission('delete_records');

    const [posTheme, setPosTheme] = useState<'dark' | 'light'>('dark');
    useEffect(() => {
        const savedTheme = localStorage.getItem('pos-theme') as 'dark' | 'light';
        if (savedTheme) setPosTheme(savedTheme);
    }, []);
    const togglePosTheme = () => {
        const newTheme = posTheme === 'dark' ? 'light' : 'dark';
        setPosTheme(newTheme);
        localStorage.setItem('pos-theme', newTheme);
        if (newTheme === 'light') {
            document.body.style.background = '#F7F9FC';
            document.body.style.color = '#1A1F36';
        } else {
            document.body.style.background = 'var(--bg-deep)';
            document.body.style.color = 'var(--text-main)';
        }
    };

    const [isProcessing, setIsProcessing] = useState(false);
    const [searchTerm, setSearchTerm] = useState(''); // New: Debounced Search

    // Sync branch filter and new customer branch with global operational branch
    useEffect(() => {
        if (activeBranchName) {
            setBranchFilter(activeBranchName);
            setNewCustomer(prev => ({ ...prev, branch: activeBranchName }));
            setCurrentPage(1); // Reset pagination on branch change
        }
    }, [activeBranchName]);

    // Default to user's branch if not system admin, otherwise 'all'
    const initialBranch = currentUser?.branch || 'all';
    const [branchFilter, setBranchFilter] = useState(initialBranch);

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
                (cust.city || '').toLowerCase().includes(lowerTerm) ||
                ((cust as any).taxNumber || '').includes(searchTerm);
            if (!searchMatch) return false;
        }

        // Tab filter
        if (activeTab === 'borclular' && cust.balance <= 0) return false;
        if (activeTab === 'alacaklilar' && cust.balance >= 0) return false;
        if (activeTab === 'eticaret' && cust.category !== 'E-ticaret') return false;

        // Branch filter - Improved to respect system admin vs local branch users
        // If branchFilter is 'all', it shows everything (permitted for admins)
        // If user is restricted to a branch, branchFilter will be their branch
        if (branchFilter !== 'all' && (cust.branch || 'Merkez') !== branchFilter) return false;

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
        city: 'İstanbul',
        district: '',
        taxNumber: '',
        taxOffice: '',
        contactPerson: '',
        iban: '',
        customerClass: '',
        referredByCode: '',
        branch: activeBranchName || currentUser?.branch || 'Merkez'
    });
    const [editCustomer, setEditCustomer] = useState<any>({
        id: '',
        name: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        district: '',
        taxNumber: '',
        taxOffice: '',
        contactPerson: '',
        iban: '',
        customerClass: '',
        referredByCode: '',
        branch: ''
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

                setNewCustomer({ name: '', phone: '', email: '', address: '', city: 'İstanbul', district: '', taxNumber: '', taxOffice: '', contactPerson: '', iban: '', customerClass: '', referredByCode: '', branch: activeBranchName || currentUser?.branch || 'Merkez' });
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
            const res = await fetch(`/api/customers/${editCustomer.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editCustomer)
            });
            const data = await res.json();
            if (data.success) {
                showSuccess("Başarılı", "Müşteri başarıyla güncellendi.");
                setIsEditModalOpen(false);
                setEditCustomer({ id: '', name: '', phone: '', email: '', address: '', city: '', district: '', taxNumber: '', taxOffice: '', contactPerson: '', iban: '', customerClass: '', referredByCode: '' });
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
                    city: (customerToEdit as any).city || '',
                    district: (customerToEdit as any).district || '',
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

    // Calculate Stats - USE RAW CUSTOMERS LIST, NOT FILTERED
    const totalReceivable = customers.reduce((sum, c) => {
        const netBalance = Number(c.balance);
        const portfolioChecks = (c.checks || [])
            .filter((check: any) => check.type.includes('Alınan'))
            .reduce((acc: number, curr: any) => acc + Number(curr.amount), 0);

        // If balance > 0, it's a receivable
        // Add checks as they are also assets/receivables in portfolio
        return sum + (netBalance > 0 ? netBalance : 0) + portfolioChecks;
    }, 0);
    const totalPayable = customers.filter(c => Number(c.balance) < 0).reduce((sum, c) => sum + Math.abs(Number(c.balance)), 0);

    const isLight = posTheme === 'light';
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
        teal: '#02BC7E',
        tealLight: 'rgba(2,188,126,0.1)',
        danger: '#E53E3E',
        purple: '#6260FE',
        purpleLight: 'rgba(98,96,254,0.08)',
        shadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
    };

    return (
        <div data-pos-theme={posTheme} className="container" style={{ padding: '30px', maxWidth: '1600px', margin: '0 auto', background: isLight ? L.pageBg : undefined }}>

            {/* HEADER AREA */}
            <header style={{ marginBottom: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: '800', margin: 0, color: isLight ? L.textMain : undefined }}
                            className={isLight ? '' : 'text-gradient'}>
                            Müşteri &amp; Cari Yönetimi
                        </h1>
                        <p style={{ marginTop: '8px', fontSize: '14px', color: isLight ? L.textMuted : undefined }}
                            className={isLight ? '' : 'text-muted'}>
                            Müşteri portföyü, bakiyeler ve hesap hareketleri
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <button onClick={togglePosTheme} title={isLight ? 'Karanlık Mod' : 'Aydınlık Mod'}
                            style={{
                                padding: '10px 14px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: isLight ? `1px solid ${L.border}` : '1px solid var(--border-pos)',
                                background: isLight ? L.card : 'var(--card-pos)',
                                boxShadow: isLight ? L.shadow : 'none'
                            }}>
                            {isLight ? <Moon size={18} color={L.primary} /> : <Sun size={18} color="#F59E0B" />}
                        </button>
                        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary"
                            style={{
                                padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px',
                                background: isLight ? L.primary : undefined,
                                boxShadow: isLight ? '0 4px 14px rgba(36,123,254,0.3)' : '0 4px 12px rgba(59,130,246,0.3)',
                                borderRadius: isLight ? '12px' : undefined, border: 'none', color: 'white'
                            }}>
                            <span style={{ fontSize: '16px' }}>+</span> Yeni Müşteri
                        </button>
                    </div>
                </div>

                {/* STATS ROW */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: isLight ? '16px' : '20px' }}>
                    <div style={isLight ? { background: L.card, border: `1px solid ${L.border}`, borderLeft: `4px solid ${L.primary}`, borderRadius: '14px', padding: '20px', boxShadow: L.shadow } : { padding: '20px', borderLeft: '4px solid #3b82f6' }} className={isLight ? '' : 'card glass animate-fade-in'}>
                        <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: isLight ? L.textSubtle : undefined }} className={isLight ? '' : 'text-muted'}>Toplam Müşteri</div>
                        <div style={{ fontSize: isLight ? '36px' : '28px', fontWeight: '800', marginTop: '8px', color: isLight ? L.primary : undefined, lineHeight: 1 }}>{customers.length}</div>
                    </div>
                    <div style={isLight ? { background: L.card, border: `1px solid ${L.border}`, borderLeft: `4px solid ${L.danger}`, borderRadius: '14px', padding: '20px', boxShadow: L.shadow } : { padding: '20px', borderLeft: '4px solid #10b981' }} className={isLight ? '' : 'card glass animate-fade-in'}>
                        <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: isLight ? L.textSubtle : undefined }} className={isLight ? '' : 'text-muted'}>Toplam Alacak</div>
                        <div style={{ fontSize: isLight ? '36px' : '28px', fontWeight: '800', marginTop: '8px', color: L.danger, lineHeight: 1 }}>{formatCurrency(totalReceivable)}</div>
                        <div style={{ fontSize: '11px', marginTop: '4px', color: isLight ? L.textMuted : '#888' }}>Borçlu müşterilerden</div>
                    </div>
                    <div style={isLight ? { background: L.card, border: `1px solid ${L.border}`, borderLeft: `4px solid ${L.success}`, borderRadius: '14px', padding: '20px', boxShadow: L.shadow } : { padding: '20px', borderLeft: '4px solid #f59e0b' }} className={isLight ? '' : 'card glass animate-fade-in'}>
                        <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: isLight ? L.textSubtle : undefined }} className={isLight ? '' : 'text-muted'}>Toplam Borç</div>
                        <div style={{ fontSize: isLight ? '36px' : '28px', fontWeight: '800', marginTop: '8px', color: L.success, lineHeight: 1 }}>{formatCurrency(totalPayable)}</div>
                        <div style={{ fontSize: '11px', marginTop: '4px', color: isLight ? L.textMuted : '#888' }}>Alacaklı müşterilere</div>
                    </div>
                    <div style={isLight ? { background: L.card, border: `1px solid ${L.border}`, borderLeft: `4px solid ${L.purple}`, borderRadius: '14px', padding: '20px', boxShadow: L.shadow } : { padding: '20px', borderLeft: '4px solid #8b5cf6' }} className={isLight ? '' : 'card glass animate-fade-in'}>
                        <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: isLight ? L.textSubtle : undefined }} className={isLight ? '' : 'text-muted'}>Net Durum</div>
                        <div style={{ fontSize: isLight ? '36px' : '28px', fontWeight: '800', marginTop: '8px', color: isLight ? L.purple : undefined, lineHeight: 1 }}>{formatCurrency(totalReceivable - totalPayable)}</div>
                    </div>
                </div>
            </header>

            {/* CONTROLS AREA */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>

                {/* Search & View Toggle */}
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1, maxWidth: '600px' }}>
                        <input
                            type="text" value={searchTerm}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            placeholder="Müşteri adı, telefon, vergi no veya e-posta ile ara..."
                            style={{
                                width: '100%', padding: '14px 20px 14px 50px',
                                background: isLight ? L.card : 'rgba(255,255,255,0.03)',
                                border: isLight ? `1px solid ${L.border}` : '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '14px',
                                color: isLight ? L.textMain : 'white',
                                fontSize: '15px', outline: 'none', transition: 'all 0.2s',
                                boxShadow: isLight ? L.shadow : 'none',
                            }}
                        />
                        <span style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px', opacity: 0.4 }}>🔍</span>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => setShowFilters(!showFilters)}
                            style={{
                                height: '50px', padding: '0 20px', borderRadius: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: '500',
                                border: showFilters ? `1px solid ${L.primary}` : `1px solid ${isLight ? L.border : 'rgba(255,255,255,0.1)'}`,
                                background: showFilters ? L.primaryLight : (isLight ? L.card : 'transparent'),
                                color: showFilters ? L.primary : (isLight ? L.textMuted : '#888'),
                                boxShadow: isLight ? L.shadow : 'none'
                            }}>
                            🌪️ Filtreler
                        </button>
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

                {/* Filters Panel */}
                {showFilters && (
                    <div style={isLight
                        ? { background: L.card, border: `1px solid ${L.border}`, borderRadius: '14px', padding: '20px', boxShadow: L.shadow }
                        : { padding: '20px', marginTop: '-10px', borderTop: 'none', borderRadius: '0 0 16px 16px' }}
                        className={isLight ? '' : 'card glass animate-fade-in'}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                            <div>
                                <label style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase' as const, marginBottom: '10px', display: 'block', color: isLight ? L.textSubtle : undefined }} className={isLight ? '' : 'text-muted'}>Kategori</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '8px' }}>
                                    {tabs.map(tab => (
                                        <button key={tab.id} onClick={() => handleTabChange(tab.id)}
                                            style={{
                                                padding: '7px 16px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer', fontWeight: activeTab === tab.id ? '600' : '400',
                                                border: activeTab === tab.id ? `1px solid ${L.primary}` : `1px solid ${isLight ? L.border : 'rgba(255,255,255,0.1)'}`,
                                                background: activeTab === tab.id ? L.primaryLight : (isLight ? L.filterBg : 'transparent'),
                                                color: activeTab === tab.id ? L.primary : (isLight ? L.textMuted : '#888')
                                            }}>
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase' as const, marginBottom: '10px', display: 'block', color: isLight ? L.textSubtle : undefined }} className={isLight ? '' : 'text-muted'}>Şube</label>
                                <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}
                                    disabled={!hasPermission('branch_administration')}
                                    style={{
                                        width: '100%', padding: '12px', borderRadius: '10px',
                                        background: isLight ? L.filterBg : 'rgba(255,255,255,0.03)',
                                        border: isLight ? `1px solid ${L.border}` : '1px solid rgba(255,255,255,0.1)',
                                        color: isLight ? L.textMain : 'white'
                                    }}>
                                    {hasPermission('branch_administration') && <option value="all">Tüm Şubeler</option>}
                                    {branches.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* CONTENT AREA */}
            {viewMode === 'grid' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                    {paginatedCustomers.map(cust => {
                        const portfolioChecks = (cust.checks || [])
                            .filter((c: any) => c.type.includes('Alınan') && ['Portföyde', 'Beklemede'].includes(c.status))
                            .reduce((acc: number, curr: any) => acc + Number(curr.amount), 0);
                        const rawBalance = Number(cust.balance);
                        const effectiveBalance = rawBalance + portfolioChecks;
                        const balColor = effectiveBalance > 0 ? L.danger : (effectiveBalance < 0 ? L.success : (isLight ? L.textMuted : '#94a3b8'));

                        return (
                            <div key={cust.id}
                                style={isLight ? {
                                    background: L.card, border: `1px solid ${L.border}`, borderRadius: '16px',
                                    boxShadow: L.shadow, overflow: 'hidden', transition: 'box-shadow 0.2s ease'
                                } : {
                                    padding: '0', overflow: 'hidden',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    background: 'linear-gradient(135deg, rgba(15,17,26,0.95) 0%, rgba(20,22,35,0.95) 100%)',
                                    backdropFilter: 'blur(10px)', transition: 'all 0.3s ease'
                                }}
                                className={isLight ? '' : 'card glass hover-scale'}
                                onMouseEnter={e => { if (isLight) (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(36,123,254,0.12)'; }}
                                onMouseLeave={e => { if (isLight) (e.currentTarget as HTMLElement).style.boxShadow = L.shadow; }}
                            >
                                {/* Card Header */}
                                <div style={isLight ? {
                                    padding: '20px 24px',
                                    background: L.primaryLight,
                                    borderBottom: `1px solid ${L.border}`
                                } : {
                                    padding: '20px 24px',
                                    background: 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.05) 100%)',
                                    borderBottom: '1px solid rgba(59,130,246,0.1)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                        {/* Avatar */}
                                        <div style={{
                                            width: '48px', height: '48px', borderRadius: '14px',
                                            background: isLight ? `linear-gradient(135deg, ${L.primary} 0%, ${L.purple} 100%)` : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '20px', fontWeight: '900', color: 'white',
                                            boxShadow: isLight ? '0 4px 14px rgba(36,123,254,0.3)' : '0 8px 24px rgba(59,130,246,0.4)',
                                        }}>
                                            {cust.name?.charAt(0).toUpperCase()}
                                        </div>
                                        {/* Balance Badge */}
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '18px', fontWeight: '900', color: balColor }}>
                                                {formatCurrency(Math.abs(effectiveBalance))}
                                            </div>
                                            <div style={{ fontSize: '10px', fontWeight: '700', color: balColor, textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginTop: '2px' }}>
                                                {effectiveBalance > 0 ? '● Borçlu' : (effectiveBalance < 0 ? '● Alacaklı' : '● Dengeli')}
                                            </div>
                                        </div>
                                    </div>
                                    <h3 style={{ margin: '0 0 8px 0', fontSize: '17px', fontWeight: '800', color: isLight ? L.textMain : 'white', letterSpacing: '-0.3px', lineHeight: '1.3' }}>
                                        {cust.name}
                                    </h3>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const, marginBottom: '8px' }}>
                                        <span style={{ fontSize: '11px', fontWeight: '700', color: L.success, background: L.successLight, padding: '4px 10px', borderRadius: '20px', border: `1px solid rgba(2,201,81,0.2)` }}>
                                            ⭐ {Number(cust.points || 0).toFixed(0)} Puan
                                        </span>
                                        <span style={{ fontSize: '11px', fontWeight: '700', color: L.purple, background: L.purpleLight, padding: '4px 10px', borderRadius: '20px', border: `1px solid rgba(98,96,254,0.2)` }}>
                                            🔑 {cust.referralCode}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '6px', fontSize: '11px', color: isLight ? L.textMuted : '#94a3b8', fontWeight: '600' }}>
                                        <span>{cust.category || 'Genel'}</span>
                                        <span>•</span>
                                        <span>{cust.branch || 'Merkez'}</span>
                                    </div>
                                </div>

                                {/* Contact Info */}
                                <div style={{ padding: '16px 24px', background: isLight ? L.filterBg : 'rgba(0,0,0,0.2)' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: isLight ? L.textMain : '#cbd5e1' }}>
                                            <span style={{ fontSize: '15px' }}>📞</span>
                                            <span style={{ fontWeight: '500' }}>{cust.phone || '-'}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: isLight ? L.textMain : '#cbd5e1' }}>
                                            <span style={{ fontSize: '15px' }}>📧</span>
                                            <span style={{ fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{cust.email || '-'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div style={{ padding: '14px 24px', background: isLight ? L.card : 'rgba(0,0,0,0.3)', borderTop: `1px solid ${isLight ? L.border : 'rgba(255,255,255,0.05)'}`, display: 'flex', gap: '8px' }}>
                                    <Link href={`/customers/${cust.id}`}
                                        style={{
                                            flex: 1, textAlign: 'center', padding: '11px', fontSize: '13px', fontWeight: '700', textDecoration: 'none', display: 'block', borderRadius: '10px',
                                            background: isLight ? L.primary : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                            color: 'white', boxShadow: isLight ? '0 4px 12px rgba(36,123,254,0.28)' : '0 4px 12px rgba(59,130,246,0.3)', border: 'none'
                                        }}>
                                        📋 Detay &amp; İşlemler
                                    </Link>
                                    <a href={`tel:${cust.phone}`}
                                        style={{
                                            padding: '11px 14px', fontSize: '18px', borderRadius: '10px', display: 'flex', alignItems: 'center', textDecoration: 'none',
                                            background: isLight ? L.filterBg : 'rgba(255,255,255,0.05)',
                                            border: `1px solid ${isLight ? L.border : 'rgba(255,255,255,0.1)'}`
                                        }}>📞
                                    </a>
                                    <a href={`https://wa.me/${cust.phone?.replace(/\s/g, '')}`} target="_blank"
                                        style={{
                                            padding: '11px 14px', fontSize: '18px', borderRadius: '10px', color: '#25D366', display: 'flex', alignItems: 'center', textDecoration: 'none',
                                            background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.3)'
                                        }}>💬
                                    </a>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div style={isLight ? { background: L.card, border: `1px solid ${L.border}`, borderRadius: '16px', boxShadow: L.shadow, overflow: 'hidden' } : { overflow: 'hidden' }}
                    className={isLight ? '' : 'card glass'}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: isLight ? L.filterBg : 'rgba(255,255,255,0.03)', borderBottom: `1px solid ${isLight ? L.border : 'rgba(255,255,255,0.06)'}`, fontSize: '11px', fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: isLight ? L.textSubtle : '#888' }}>
                                <th style={{ padding: '16px 20px' }}>Müşteri</th>
                                <th>İletişim</th>
                                <th>Kategori</th>
                                <th>Bakiye</th>
                                <th style={{ textAlign: 'right', paddingRight: '20px' }}>İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedCustomers.map(cust => (
                                <tr key={cust.id}
                                    style={{ borderBottom: `1px solid ${isLight ? L.border : 'var(--border-light)'}`, background: isLight ? L.card : 'transparent', transition: 'background 0.15s ease', cursor: 'pointer' }}
                                    onMouseEnter={e => { if (isLight) (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(36,123,254,0.04)'; }}
                                    onMouseLeave={e => { if (isLight) (e.currentTarget as HTMLTableRowElement).style.background = L.card; }}>
                                    <td style={{ padding: '18px 20px' }}>
                                        <div style={{ fontWeight: '600', fontSize: '14px', color: isLight ? L.textMain : 'var(--text-main)' }}>{cust.name}</div>
                                        <div style={{ fontSize: '11px', color: L.success, marginTop: '2px' }}>Puan: {Number(cust.points || 0).toFixed(0)} | Kod: {cust.referralCode}</div>
                                        {(cust as any).taxNumber && <div style={{ fontSize: '12px', color: isLight ? L.textMuted : 'var(--text-muted)', marginTop: '2px' }}>VKN: {(cust as any).taxNumber}</div>}
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '13px', color: isLight ? L.textMain : 'var(--text-main)' }}>{cust.phone}</div>
                                        <div style={{ fontSize: '12px', color: isLight ? L.textMuted : 'var(--text-muted)' }}>{cust.email}</div>
                                    </td>
                                    <td>
                                        <span style={{
                                            padding: '5px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '600',
                                            background: isLight ? L.filterBg : 'var(--input-bg)',
                                            color: isLight ? L.textMuted : 'var(--text-muted)',
                                            border: isLight ? `1px solid ${L.border}` : 'none'
                                        }}>
                                            {cust.category || 'Genel'}
                                        </span>
                                    </td>
                                    <td>
                                        <span style={{ fontWeight: '700', color: cust.balance > 0 ? L.danger : (cust.balance < 0 ? L.success : (isLight ? L.textMuted : '#ccc')) }}>
                                            {formatCurrency(Math.abs(cust.balance))}
                                            <span style={{ fontSize: '10px', marginLeft: '5px', opacity: 0.7 }}>
                                                {cust.balance > 0 ? '(B)' : (cust.balance < 0 ? '(A)' : '-')}
                                            </span>
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                                        <Link href={`/customers/${cust.id}`} style={{ textDecoration: 'none', marginRight: '8px', padding: '7px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', background: L.primary, color: 'white' }}>Detay</Link>
                                        <button onClick={() => handleDeleteCustomer(cust.id)} style={{ padding: '7px 14px', borderRadius: '8px', fontSize: '13px', border: `1px solid ${L.danger}`, background: 'transparent', color: L.danger, cursor: 'pointer' }}>Sil</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {filteredCustomers.length === 0 && (
                <div style={{
                    padding: '60px', textAlign: 'center', marginTop: '20px', borderRadius: '16px',
                    background: isLight ? L.card : 'var(--input-bg)',
                    border: isLight ? `1px dashed ${L.border}` : '1px dashed var(--border-light)',
                    color: isLight ? L.textMuted : 'var(--text-muted)',
                    boxShadow: isLight ? L.shadow : 'none'
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '20px', opacity: 0.3 }}>🔍</div>
                    <h3 style={{ color: isLight ? L.textMain : undefined }}>Kayıt Bulunamadı</h3>
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
                                    <label className="text-muted" style={{ fontSize: '11px', fontWeight: 'bold' }}>ŞUBE <span style={{ color: 'red' }}>*</span></label>
                                    <select
                                        value={newCustomer.branch}
                                        onChange={e => setNewCustomer({ ...newCustomer, branch: e.target.value })}
                                        style={{ width: '100%', padding: '12px', background: 'var(--input-bg)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'var(--text-main)' }}
                                    >
                                        {(branches || []).map(b => (
                                            <option key={b.name} value={b.name}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid-cols-2 gap-4" style={{ display: 'grid' }}>
                                <div>
                                    <label className="text-muted" style={{ fontSize: '11px', fontWeight: 'bold' }}>ŞEHİR</label>
                                    <select
                                        value={newCustomer.city}
                                        onChange={e => setNewCustomer({ ...newCustomer, city: e.target.value, district: '' })}
                                        style={{ width: '100%', padding: '12px', background: 'var(--input-bg)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'var(--text-main)' }}
                                    >
                                        <option value="">Şehir Seçin...</option>
                                        {TURKISH_CITIES.map(city => (
                                            <option key={city} value={city}>{city}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-muted" style={{ fontSize: '11px', fontWeight: 'bold' }}>İLÇE</label>
                                    <select
                                        value={newCustomer.district}
                                        onChange={e => setNewCustomer({ ...newCustomer, district: e.target.value })}
                                        disabled={!newCustomer.city}
                                        style={{ width: '100%', padding: '12px', background: 'var(--input-bg)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'var(--text-main)' }}
                                    >
                                        <option value="">İlçe Seçin...</option>
                                        {(TURKISH_DISTRICTS[newCustomer.city] || []).map(district => (
                                            <option key={district} value={district}>{district}</option>
                                        ))}
                                    </select>
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

                            <div className="grid-cols-2 gap-4" style={{ display: 'grid' }}>
                                <div>
                                    <label className="text-muted" style={{ fontSize: '12px' }}>ŞEHİR</label>
                                    <select
                                        value={editCustomer.city}
                                        onChange={e => setEditCustomer({ ...editCustomer, city: e.target.value, district: '' })}
                                        style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }}
                                    >
                                        <option value="">Şehir Seçin...</option>
                                        {TURKISH_CITIES.map(city => (
                                            <option key={city} value={city}>{city}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-muted" style={{ fontSize: '12px' }}>İLÇE</label>
                                    <select
                                        value={editCustomer.district}
                                        onChange={e => setEditCustomer({ ...editCustomer, district: e.target.value })}
                                        disabled={!editCustomer.city}
                                        style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }}
                                    >
                                        <option value="">İlçe Seçin...</option>
                                        {(TURKISH_DISTRICTS[editCustomer.city] || []).map(district => (
                                            <option key={district} value={district}>{district}</option>
                                        ))}
                                    </select>
                                </div>
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
