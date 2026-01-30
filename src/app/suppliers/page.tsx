
"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useModal } from '@/contexts/ModalContext';
import SupplierPurchaseModal from '@/components/modals/SupplierPurchaseModal';
import { formatCurrency } from '@/lib/utils';
import Pagination from '@/components/Pagination';

export default function SuppliersPage() {
    const router = useRouter();
    const { suppliers } = useApp();
    const { showSuccess, showError } = useModal();

    // UI States
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all'); // all, active, passive, debt, credit

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [newSupplier, setNewSupplier] = useState({
        name: '', phone: '', email: '', address: '', category: '',
        taxNumber: '', taxOffice: '', contactPerson: '', iban: ''
    });
    const [editSupplier, setEditSupplier] = useState<any>({
        id: '', name: '', phone: '', email: '', address: '', category: '',
        taxNumber: '', taxOffice: '', contactPerson: '', iban: ''
    });

    const [dbSuppClasses, setDbSuppClasses] = useState<string[]>([]);

    useEffect(() => {
        const fetchDefinitions = async () => {
            try {
                const res = await fetch('/api/settings');
                const data = await res.json();
                if (data && !data.error) {
                    if (data.suppClasses) setDbSuppClasses(data.suppClasses);
                }
            } catch (e) { console.error('Settings fetch error:', e); }
        };
        fetchDefinitions();
    }, []);

    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
    const [selectedSup, setSelectedSup] = useState<any>(null);

    // --- FILTER LOGIC ---
    const filteredSuppliers = suppliers.filter(sup => {
        // Search
        if (searchTerm) {
            const low = searchTerm.toLowerCase();
            const match =
                (sup.name || '').toLowerCase().includes(low) ||
                (sup.phone || '').includes(searchTerm) ||
                (sup.category || '').toLowerCase().includes(low);
            if (!match) return false;
        }

        // Tabs
        if (activeTab === 'debt' && sup.balance >= 0) return false; // Borçlu olduklarımız (negatif bakiye genelde alacak anlamına gelir ama sistemde Supplier balance logic: (-) means we owe them usually, check logic below)
        // Correction: In most accounting systems, Supplier Credit Balance (Alacak) means we owe them money. 
        // Let's assume standard logic: If Balance < 0 => We owe them (Borçluyuz). If Balance > 0 => They owe us (Alacaklıyız - iade vs).

        if (activeTab === 'debt' && sup.balance >= 0) return false; // Borçlu olduklarımız (Negatif)
        if (activeTab === 'credit' && sup.balance <= 0) return false; // Alacaklı olduklarımız (Pozitif)
        if (activeTab === 'passive' && sup.isActive !== false) return false;

        return true;
    });

    // --- PAGINATION LOGIC ---
    const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage);
    const paginatedSuppliers = filteredSuppliers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // --- STATS CALCULATION ---
    const totalDebt = suppliers.filter(s => s.balance < 0).reduce((acc, s) => acc + Math.abs(s.balance), 0);
    const totalCredit = suppliers.filter(s => s.balance > 0).reduce((acc, s) => acc + s.balance, 0);

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

    const handleEditSupplier = async () => {
        if (!editSupplier.name) {
            showError('Hata', 'Firma adı zorunludur!');
            return;
        }
        if (isProcessing) return;

        setIsProcessing(true);
        try {
            const res = await fetch('/api/suppliers', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editSupplier)
            });
            const data = await res.json();
            if (data.success) {
                showSuccess('Başarılı', 'Tedarikçi başarıyla güncellendi.');
                setIsEditModalOpen(false);
                setEditSupplier({ id: '', name: '', phone: '', email: '', address: '', category: '', taxNumber: '', taxOffice: '', contactPerson: '', iban: '' });
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

    const handleDeleteSupplier = async (supplier: any) => {
        if (!confirm(`"${supplier.name}" tedarikçisini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`)) {
            return;
        }

        try {
            const res = await fetch(`/api/suppliers?id=${supplier.id}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.success) {
                showSuccess('Başarılı', 'Tedarikçi başarıyla silindi.');
                window.location.reload();
            } else {
                showError('Hata', data.error || 'Silme işlemi başarısız.');
            }
        } catch (error: any) {
            console.error(error);
            showError('Hata', 'Bir hata oluştu.');
        }
    };

    return (
        <div className="container" style={{ padding: '30px', maxWidth: '1600px', margin: '0 auto' }}>

            {/* HEADER AREA */}
            <header style={{ marginBottom: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div>
                        <h1 className="text-gradient" style={{ fontSize: '28px', margin: 0 }}>Tedarikçi Yönetimi</h1>
                        <p className="text-muted" style={{ marginTop: '8px' }}>Toptancı listesi, bakiyeler ve satın alma işlemleri</p>
                    </div>
                    <div>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="btn btn-primary"
                            style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}>
                            <span style={{ fontSize: '16px' }}>+</span> Yeni Tedarikçi
                        </button>
                    </div>
                </div>

                {/* STATS ROW */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                    <div className="card glass animate-fade-in" style={{ padding: '20px', borderLeft: '4px solid #3b82f6' }}>
                        <div className="text-muted" style={{ fontSize: '12px', fontWeight: 'bold' }}>TOPLAM TEDARİKÇİ</div>
                        <div style={{ fontSize: '28px', fontWeight: '800', marginTop: '5px' }}>{suppliers.length}</div>
                    </div>
                    <div className="card glass animate-fade-in" style={{ padding: '20px', borderLeft: '4px solid #ef4444' }}>
                        <div className="text-muted" style={{ fontSize: '12px', fontWeight: 'bold' }}>TOPLAM BORCUMUZ</div>
                        <div style={{ fontSize: '28px', fontWeight: '800', marginTop: '5px', color: '#ef4444' }}>{formatCurrency(totalDebt)}</div>
                    </div>
                    <div className="card glass animate-fade-in" style={{ padding: '20px', borderLeft: '4px solid #10b981' }}>
                        <div className="text-muted" style={{ fontSize: '12px', fontWeight: 'bold' }}>TOPLAM ALACAĞIMIZ</div>
                        <div style={{ fontSize: '28px', fontWeight: '800', marginTop: '5px', color: '#10b981' }}>{formatCurrency(totalCredit)}</div>
                    </div>
                    <div className="card glass animate-fade-in" style={{ padding: '20px', borderLeft: '4px solid #f59e0b' }}>
                        <div className="text-muted" style={{ fontSize: '12px', fontWeight: 'bold' }}>NET DURUM</div>
                        <div style={{ fontSize: '28px', fontWeight: '800', marginTop: '5px' }}>{formatCurrency(totalCredit - totalDebt)}</div>
                    </div>
                </div>
            </header>

            {/* CONTROLS AREA */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', alignItems: 'center' }}>
                    {/* Search */}
                    <div style={{ position: 'relative', flex: 1, maxWidth: '600px' }}>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            placeholder="Tedarikçi adı, kategori veya telefon ile ara..."
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

                    {/* View Toggle & Filter Tabs */}
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '4px' }}>
                            {['all', 'debt', 'credit', 'passive'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: '8px',
                                        background: activeTab === tab ? 'rgba(255,255,255,0.1)' : 'transparent',
                                        color: activeTab === tab ? '#fff' : '#888',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: '13px',
                                        fontWeight: activeTab === tab ? 'bold' : 'normal'
                                    }}
                                >
                                    {tab === 'all' ? 'Tümü' : tab === 'debt' ? 'Borçlular' : tab === 'credit' ? 'Alacaklılar' : 'Pasifler'}
                                </button>
                            ))}
                        </div>

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
            </div>

            {/* LISTING CONTENT */}
            {viewMode === 'grid' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                    {paginatedSuppliers.map(sup => (
                        <div key={sup.id} className="card glass hover-scale" style={{ padding: '0', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ padding: '24px', background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{
                                        width: '48px', height: '48px', borderRadius: '12px',
                                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '20px', fontWeight: 'bold', color: 'white',
                                        boxShadow: '0 4px 10px rgba(245, 158, 11, 0.3)'
                                    }}>
                                        {sup.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: sup.balance < 0 ? '#ef4444' : (sup.balance > 0 ? '#10b981' : '#ccc') }}>
                                            {formatCurrency(Math.abs(sup.balance))}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#888' }}>
                                            {sup.balance < 0 ? 'Borçluyuz' : (sup.balance > 0 ? 'Alacaklıyız' : 'Dengeli')}
                                        </div>
                                    </div>
                                </div>
                                <h3 style={{ margin: '15px 0 5px 0', fontSize: '18px', fontWeight: 'bold', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {sup.name}
                                </h3>
                                <div style={{ fontSize: '12px', color: '#888' }}>
                                    <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>{sup.category || 'Genel'}</span>
                                    {sup.isActive === false && <span style={{ color: '#ef4444', marginLeft: '10px' }}>● Pasif</span>}
                                </div>
                            </div>

                            <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#aaa' }}>
                                    <span>📞</span> {sup.phone || '-'}
                                </div>
                                {sup.contactPerson && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#aaa' }}>
                                        <span>👤</span> {sup.contactPerson}
                                    </div>
                                )}
                            </div>

                            <div style={{ padding: '16px 24px', background: 'rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <button
                                        onClick={() => { setEditSupplier(sup); setIsEditModalOpen(true); }}
                                        className="btn btn-outline" style={{ fontSize: '12px', padding: '8px', color: '#10b981', borderColor: '#10b981' }}>
                                        ✏️ Düzenle
                                    </button>
                                    <button
                                        onClick={() => handleDeleteSupplier(sup)}
                                        className="btn btn-outline" style={{ fontSize: '12px', padding: '8px', color: '#ef4444', borderColor: '#ef4444' }}>
                                        🗑️ Sil
                                    </button>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <button
                                        onClick={() => { setSelectedSup(sup); setIsPurchaseModalOpen(true); }}
                                        className="btn btn-outline" style={{ fontSize: '12px', padding: '8px', color: '#3b82f6', borderColor: '#3b82f6' }}>
                                        🛒 Alış Gir
                                    </button>
                                    <button
                                        onClick={() => router.push(`/payment?amount=${Math.abs(sup.balance)}&title=${encodeURIComponent(sup.name)}&type=payable&ref=SUP-${sup.id}`)}
                                        className="btn btn-outline" style={{ fontSize: '12px', padding: '8px' }}>
                                        💸 Ödeme Yap
                                    </button>
                                </div>
                                <Link href={`/suppliers/${sup.id}`} className="btn btn-primary" style={{ textAlign: 'center', padding: '10px', fontSize: '13px', textDecoration: 'none' }}>
                                    İşlem Detayları & Ekstre
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card glass" style={{ overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.03)', color: '#888', fontSize: '12px', textTransform: 'uppercase' }}>
                                <th style={{ padding: '20px' }}>Firma</th>
                                <th>Kategori</th>
                                <th>İletişim</th>
                                <th>Bakiye</th>
                                <th style={{ textAlign: 'right', paddingRight: '20px' }}>İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedSuppliers.map(sup => (
                                <tr key={sup.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }} className="hover:bg-white/5">
                                    <td style={{ padding: '20px' }}>
                                        <div style={{ fontWeight: '600', color: 'white' }}>{sup.name}</div>
                                        {sup.isActive === false && <span style={{ fontSize: '10px', color: '#ef4444' }}>Pasif</span>}
                                    </td>
                                    <td>
                                        <span style={{ fontSize: '12px', padding: '4px 8px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', color: '#ccc' }}>
                                            {sup.category || '-'}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '13px', color: '#ccc' }}>{sup.phone}</div>
                                        {sup.contactPerson && <div style={{ fontSize: '11px', color: '#666' }}>Yetkili: {sup.contactPerson}</div>}
                                    </td>
                                    <td style={{ fontWeight: 'bold', color: sup.balance < 0 ? '#ef4444' : (sup.balance > 0 ? '#10b981' : '#ccc') }}>
                                        {formatCurrency(Math.abs(sup.balance))}
                                        <div style={{ fontSize: '10px', opacity: 0.7 }}>
                                            {sup.balance < 0 ? 'Borçluyuz' : (sup.balance > 0 ? 'Alacaklıyız' : '-')}
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                                        <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end' }}>
                                            <button onClick={() => { setEditSupplier(sup); setIsEditModalOpen(true); }} className="btn btn-sm btn-outline" style={{ color: '#10b981', borderColor: '#10b981' }}>✏️</button>
                                            <button onClick={() => handleDeleteSupplier(sup)} className="btn btn-sm btn-outline" style={{ color: '#ef4444', borderColor: '#ef4444' }}>🗑️</button>
                                            <button onClick={() => { setSelectedSup(sup); setIsPurchaseModalOpen(true); }} className="btn btn-sm btn-outline">🛒</button>
                                            <Link href={`/suppliers/${sup.id}`} className="btn btn-sm btn-primary" style={{ textDecoration: 'none' }}>Detay</Link>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {paginatedSuppliers.length === 0 && (
                <div style={{ padding: '60px', textAlign: 'center', color: '#888', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)', marginTop: '20px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '20px', opacity: 0.3 }}>🔍</div>
                    <h3>Kayıt Bulunamadı</h3>
                    <p>Arama kriterlerinize uygun tedarikçi bulunmuyor.</p>
                </div>
            )}

            {/* PAGINATION CONTROLS */}
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
            />

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
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(5px)' }}>
                    <div className="card glass animate-in" style={{ width: '600px', background: '#1e1e24', border: '1px solid rgba(255,255,255,0.1)', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="flex-between mb-6" style={{ paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <h3 style={{ margin: 0 }}>🏭 Yeni Tedarikçi Ekle</h3>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' }}>×</button>
                        </div>
                        <div className="flex-col gap-4">
                            <div className="grid-cols-2 gap-4" style={{ display: 'grid' }}>
                                <div>
                                    <label className="text-muted" style={{ fontSize: '12px' }}>FİRMA ADI <span style={{ color: 'red' }}>*</span></label>
                                    <input type="text" value={newSupplier.name} onChange={e => setNewSupplier({ ...newSupplier, name: e.target.value })} style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }} />
                                </div>
                                <div>
                                    <label className="text-muted" style={{ fontSize: '12px' }}>YETKİLİ KİŞİ</label>
                                    <input type="text" value={newSupplier.contactPerson} onChange={e => setNewSupplier({ ...newSupplier, contactPerson: e.target.value })} style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }} />
                                </div>
                            </div>

                            <div>
                                <label className="text-muted" style={{ fontSize: '12px' }}>TEDARİKÇİ SINIFI (KATEGORİ)</label>
                                <select
                                    value={newSupplier.category}
                                    onChange={e => setNewSupplier({ ...newSupplier, category: e.target.value })}
                                    style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }}
                                >
                                    <option value="">Sınıf Seçin...</option>
                                    {(dbSuppClasses.length > 0 ? dbSuppClasses : ['Saha Tedarikçisi', 'Distribütör', 'Yedek Parça', 'Hizmet']).map(cls => (
                                        <option key={cls} value={cls}>{cls}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid-cols-2 gap-4" style={{ display: 'grid' }}>
                                <div>
                                    <label className="text-muted" style={{ fontSize: '12px' }}>TELEFON</label>
                                    <input type="text" value={newSupplier.phone} onChange={e => setNewSupplier({ ...newSupplier, phone: e.target.value })} style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }} />
                                </div>
                                <div>
                                    <label className="text-muted" style={{ fontSize: '12px' }}>E-POSTA</label>
                                    <input type="text" value={newSupplier.email} onChange={e => setNewSupplier({ ...newSupplier, email: e.target.value })} style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }} />
                                </div>
                            </div>

                            <div className="grid-cols-2 gap-4" style={{ display: 'grid' }}>
                                <div>
                                    <label className="text-muted" style={{ fontSize: '12px' }}>VERGİ NO</label>
                                    <input type="text" value={newSupplier.taxNumber} onChange={e => setNewSupplier({ ...newSupplier, taxNumber: e.target.value })} style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }} />
                                </div>
                                <div>
                                    <label className="text-muted" style={{ fontSize: '12px' }}>VERGİ DAİRESİ</label>
                                    <input type="text" value={newSupplier.taxOffice} onChange={e => setNewSupplier({ ...newSupplier, taxOffice: e.target.value })} style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }} />
                                </div>
                            </div>

                            <div>
                                <label className="text-muted" style={{ fontSize: '12px' }}>IBAN</label>
                                <input type="text" placeholder="TR..." value={newSupplier.iban} onChange={e => setNewSupplier({ ...newSupplier, iban: e.target.value })} style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }} />
                            </div>

                            <div>
                                <label className="text-muted" style={{ fontSize: '12px' }}>ADRES</label>
                                <textarea value={newSupplier.address} onChange={e => setNewSupplier({ ...newSupplier, address: e.target.value })} style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', minHeight: '80px' }} />
                            </div>
                            <button onClick={handleAddSupplier} disabled={isProcessing} className="btn btn-primary w-full" style={{ padding: '16px', marginTop: '10px' }}>
                                {isProcessing ? 'KAYDEDİLİYOR...' : 'KAYDET'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT SUPPLIER MODAL */}
            {isEditModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(5px)' }}>
                    <div className="card glass animate-in" style={{ width: '600px', background: '#1e1e24', border: '1px solid rgba(255,255,255,0.1)', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="flex-between mb-6" style={{ paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <h3 style={{ margin: 0 }}>✏️ Tedarikçi Düzenle</h3>
                            <button onClick={() => setIsEditModalOpen(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' }}>×</button>
                        </div>
                        <div className="flex-col gap-4">
                            <div className="grid-cols-2 gap-4" style={{ display: 'grid' }}>
                                <div>
                                    <label className="text-muted" style={{ fontSize: '12px' }}>FİRMA ADI <span style={{ color: 'red' }}>*</span></label>
                                    <input type="text" value={editSupplier.name} onChange={e => setEditSupplier({ ...editSupplier, name: e.target.value })} style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }} />
                                </div>
                                <div>
                                    <label className="text-muted" style={{ fontSize: '12px' }}>YETKİLİ KİŞİ</label>
                                    <input type="text" value={editSupplier.contactPerson} onChange={e => setEditSupplier({ ...editSupplier, contactPerson: e.target.value })} style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }} />
                                </div>
                            </div>

                            <div>
                                <label className="text-muted" style={{ fontSize: '12px' }}>TEDARİKÇİ SINIFI (KATEGORİ)</label>
                                <select
                                    value={editSupplier.category}
                                    onChange={e => setEditSupplier({ ...editSupplier, category: e.target.value })}
                                    style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }}
                                >
                                    <option value="">Sınıf Seçin...</option>
                                    {(dbSuppClasses.length > 0 ? dbSuppClasses : ['Saha Tedarikçisi', 'Distribütör', 'Yedek Parça', 'Hizmet']).map(cls => (
                                        <option key={cls} value={cls}>{cls}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid-cols-2 gap-4" style={{ display: 'grid' }}>
                                <div>
                                    <label className="text-muted" style={{ fontSize: '12px' }}>TELEFON</label>
                                    <input type="text" value={editSupplier.phone} onChange={e => setEditSupplier({ ...editSupplier, phone: e.target.value })} style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }} />
                                </div>
                                <div>
                                    <label className="text-muted" style={{ fontSize: '12px' }}>E-POSTA</label>
                                    <input type="text" value={editSupplier.email} onChange={e => setEditSupplier({ ...editSupplier, email: e.target.value })} style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }} />
                                </div>
                            </div>

                            <div className="grid-cols-2 gap-4" style={{ display: 'grid' }}>
                                <div>
                                    <label className="text-muted" style={{ fontSize: '12px' }}>VERGİ NO</label>
                                    <input type="text" value={editSupplier.taxNumber} onChange={e => setEditSupplier({ ...editSupplier, taxNumber: e.target.value })} style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }} />
                                </div>
                                <div>
                                    <label className="text-muted" style={{ fontSize: '12px' }}>VERGİ DAİRESİ</label>
                                    <input type="text" value={editSupplier.taxOffice} onChange={e => setEditSupplier({ ...editSupplier, taxOffice: e.target.value })} style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }} />
                                </div>
                            </div>

                            <div>
                                <label className="text-muted" style={{ fontSize: '12px' }}>IBAN</label>
                                <input type="text" placeholder="TR..." value={editSupplier.iban} onChange={e => setEditSupplier({ ...editSupplier, iban: e.target.value })} style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }} />
                            </div>

                            <div>
                                <label className="text-muted" style={{ fontSize: '12px' }}>ADRES</label>
                                <textarea value={editSupplier.address} onChange={e => setEditSupplier({ ...editSupplier, address: e.target.value })} style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', minHeight: '80px' }} />
                            </div>
                            <button onClick={handleEditSupplier} disabled={isProcessing} className="btn btn-primary w-full" style={{ padding: '16px', marginTop: '10px' }}>
                                {isProcessing ? 'GÜNCELLENİYOR...' : 'DEĞİŞİKLİKLERİ KAYDET'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}
