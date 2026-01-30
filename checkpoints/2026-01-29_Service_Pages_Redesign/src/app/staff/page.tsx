
"use client";

import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useModal } from '@/contexts/ModalContext';


export default function StaffPage() {
    const [activeTab, setActiveTab] = useState('list'); // list, roles

    const { staff, setStaff, currentUser, hasPermission, addNotification } = useApp();
    const { showSuccess } = useModal();
    const isSystemAdmin = currentUser === null;


    const [selectedStaff, setSelectedStaff] = useState<any>(null);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [showPermissionModal, setShowPermissionModal] = useState(false);

    const [taskContent, setTaskContent] = useState('');
    const [taskPriority, setTaskPriority] = useState('normal');

    const [showAddStaffModal, setShowAddStaffModal] = useState(false);
    const [newStaff, setNewStaff] = useState({
        name: '', role: '', branch: 'Kadıköy', type: 'service'
    });
    const [isProcessing, setIsProcessing] = useState(false);

    const allPermissions = [
        { id: 'pos_access', label: 'Hızlı Satış (POS)', category: 'Satış' },
        { id: 'sales_archive', label: 'Geçmiş Satışları Görme', category: 'Satış' },
        { id: 'discount_auth', label: 'İskonto Yapma Yetkisi', category: 'Satış' },

        { id: 'inventory_view', label: 'Stok Görüntüleme', category: 'Depo' },
        { id: 'inventory_edit', label: 'Stok Düzenleme/Ekleme', category: 'Depo' },
        { id: 'inventory_transfer', label: 'Depolar Arası Transfer', category: 'Depo' },

        { id: 'reports_view', label: 'Raporları Görme (Dashboard)', category: 'Muhasebe' },
        { id: 'accounting_manage', label: 'Kasa/Banka Yönetimi', category: 'Muhasebe' },
        { id: 'expense_create', label: 'Gider/Ödeme Girişi', category: 'Muhasebe' },

        { id: 'customer_view', label: 'Müşteri Listesi Görme', category: 'Müşteri' },
        { id: 'customer_edit', label: 'Müşteri Bilgi Düzenleme', category: 'Müşteri' },

        { id: 'supplier_view', label: 'Tedarikçileri Görme', category: 'Tedarikçi' },

        { id: 'finance_view', label: 'Finansal Özetleri Görme', category: 'Finansal Yönetim' },
        { id: 'finance_transactions', label: 'Kasa/Banka Hareketleri', category: 'Finansal Yönetim' },
        { id: 'finance_reports', label: 'Bilanço ve Kar/Zarar Raporları', category: 'Finansal Yönetim' },

        { id: 'ecommerce_view', label: 'E-Ticaret Satışlarını Görme', category: 'E-Ticaret' },
        { id: 'ecommerce_manage', label: 'E-Ticaret Sipariş Yönetimi', category: 'E-Ticaret' },

        { id: 'staff_manage', label: 'Personel Yönetimi', category: 'Yönetim' },
        { id: 'settings_manage', label: 'Sistem Ayarlarını Değiştirme', category: 'Yönetim' },
        { id: 'security_access', label: 'Güvenlik Masasına Erişim', category: 'Yönetim' },

        { id: 'delete_records', label: '🔴 Kayıt Silme (Fatura/Ürün/Gider)', category: 'Kritik Yetkiler' },
        { id: 'create_staff', label: '🔴 Personel Ekleme', category: 'Kritik Yetkiler' },
        { id: 'create_bank', label: '🔴 Kasa/Banka Açma', category: 'Kritik Yetkiler' },
        { id: 'approve_products', label: '🔴 Ürün Kartı Onaylama', category: 'Kritik Yetkiler' },

        { id: 'branch_isolation', label: '❌ Sadece Kendi Şubesi (Zorunlu)', category: 'Güvenlik' }
    ];

    const handleAssignTask = () => {
        if (!taskContent) return;
        if (isProcessing) return;
        setIsProcessing(true);
        try {
            const updatedStaff = staff.map(s =>
                s.id === selectedStaff.id ? { ...s, currentJob: taskContent, status: 'Meşgul' } : s
            );
            setStaff(updatedStaff);

            // Push Global Notification
            addNotification({
                type: 'info',
                icon: '⚒️',
                text: `${selectedStaff.name} personeline yeni görev atandı: ${taskContent.substring(0, 30)}...`
            });

            setShowTaskModal(false);
            setTaskContent('');
            showSuccess("Görev Atandı", `Görev ${selectedStaff.name} isimli personele başarıyla atandı.`);
        } finally {

            setIsProcessing(false);
        }
    };

    const togglePermission = (permId: string) => {
        const currentPerms = selectedStaff.permissions || [];
        const newPerms = currentPerms.includes(permId)
            ? currentPerms.filter((p: string) => p !== permId)
            : [...currentPerms, permId];
        setSelectedStaff({ ...selectedStaff, permissions: newPerms });
    };

    const handleSaveStaff = () => {
        if (!newStaff.name || !newStaff.role) return;
        if (isProcessing) return;
        setIsProcessing(true);
        try {
            const freshStaff = {
                ...newStaff,
                id: Date.now(),
                status: 'Müsait',
                currentJob: '-',
                earnings: 0,
                jobsCount: 0,
                permissions: ['branch_isolation'] // ALWAYS CHECKED BY DEFAULT
            };
            setStaff([...staff, freshStaff as any]);
            setShowAddStaffModal(false);
            setNewStaff({ name: '', role: '', branch: 'Kadıköy', type: 'service' });
            showSuccess("Personel Eklendi", `${newStaff.name} eklendi ve Şube İzolasyonu otomatik tanımlandı.`);
        } finally {

            setIsProcessing(false);
        }
    };

    // Reset modals on tab change
    useEffect(() => {
        setShowTaskModal(false);
        setShowPermissionModal(false);
        setShowAddStaffModal(false);
    }, [activeTab]);

    const savePermissions = () => {
        if (!selectedStaff) return;
        if (isProcessing) return;
        setIsProcessing(true);
        try {
            const updatedStaff = staff.map(s =>
                s.id === selectedStaff.id ? selectedStaff : s
            );
            setStaff(updatedStaff);
            setShowPermissionModal(false);
            showSuccess("Yetkiler Güncellendi", `${selectedStaff.name} yetkileri başarıyla güncellendi.`);
        } finally {

            setIsProcessing(false);
        }
    };

    return (
        <div className="container" style={{ padding: '40px 20px' }}>


            {/* Header */}
            <header className="flex-between" style={{ marginBottom: '32px' }}>
                <div>
                    <h1 className="text-gradient">Personel & Yetkiler</h1>
                    <p className="text-muted">Ekip Yönetimi, Performans ve Erişim Kontrolleri</p>
                </div>
                {hasPermission('create_staff') && (
                    <div className="flex-center gap-4">
                        {activeTab === 'list' ? (
                            <button className="btn btn-primary" onClick={() => setShowAddStaffModal(true)}>+ Personel Ekle</button>
                        ) : (
                            <button className="btn btn-primary">+ Yeni Rol Tanımla</button>
                        )}
                    </div>
                )}
            </header>

            {/* Tabs */}
            <div className="flex-center" style={{ justifyContent: 'flex-start', borderBottom: '1px solid var(--border-light)', marginBottom: '32px', gap: '24px' }}>
                <button
                    onClick={() => setActiveTab('list')}
                    style={{
                        padding: '12px 0', background: 'transparent', border: 'none', cursor: 'pointer',
                        borderBottom: activeTab === 'list' ? '2px solid var(--primary)' : '2px solid transparent',
                        color: activeTab === 'list' ? 'white' : 'var(--text-muted)', fontWeight: '500'
                    }}
                >
                    Personel Listesi
                </button>
                {hasPermission('staff_manage') && (
                    <button
                        onClick={() => setActiveTab('roles')}
                        style={{
                            padding: '12px 0', background: 'transparent', border: 'none', cursor: 'pointer',
                            borderBottom: activeTab === 'roles' ? '2px solid var(--primary)' : '2px solid transparent',
                            color: activeTab === 'roles' ? 'white' : 'var(--text-muted)', fontWeight: '500'
                        }}
                    >
                        Roller ve İzinler
                    </button>
                )}
                {hasPermission('reports_view') && (
                    <button
                        onClick={() => setActiveTab('performance')}
                        style={{
                            padding: '12px 0', background: 'transparent', border: 'none', cursor: 'pointer',
                            borderBottom: activeTab === 'performance' ? '2px solid var(--success)' : '2px solid transparent',
                            color: activeTab === 'performance' ? 'var(--success)' : 'var(--text-muted)', fontWeight: '500'
                        }}
                    >
                        ⭐ Performans & Prim
                    </button>
                )}
            </div>

            {/* STAFF LIST TAB */}
            {activeTab === 'list' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                    {staff.map((person) => (
                        <div key={person.id} className="card glass">
                            {/* Staff Card Header */}
                            <div className="flex-between" style={{ marginBottom: '16px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
                                <div className="flex-center gap-4" style={{ justifyContent: 'flex-start' }}>
                                    <div style={{ width: '40px', height: '40px', background: 'var(--bg-hover)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {person.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '600' }}>{person.name}</div>
                                        <div className="text-muted" style={{ fontSize: '12px' }}>{person.role} • {person.branch}</div>
                                    </div>
                                </div>
                                <span style={{
                                    fontSize: '12px', padding: '4px 8px', borderRadius: '4px',
                                    background: person.status.includes('Müsait') ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 85, 0, 0.2)',
                                    color: person.status.includes('Müsait') ? 'var(--success)' : 'var(--primary)'
                                }}>
                                    {person.status}
                                </span>
                            </div>

                            {/* Current Status */}
                            <div style={{ marginBottom: '20px' }}>
                                <div className="text-muted" style={{ fontSize: '10px', textTransform: 'uppercase' }}>ŞU ANKİ GÖREV</div>
                                <div style={{ fontSize: '14px', marginTop: '4px' }}>{person.currentJob}</div>
                            </div>

                            {/* Metrics */}
                            <div className="flex-between" style={{ background: 'var(--bg-deep)', padding: '12px', borderRadius: '8px' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div className="text-muted" style={{ fontSize: '10px' }}>BU AY CİRO</div>
                                    <div style={{ fontWeight: 'bold', color: 'var(--success)' }}>₺ {person.earnings.toLocaleString()}</div>
                                </div>
                                <div style={{ width: '1px', height: '24px', background: 'var(--border-light)' }}></div>
                                <div style={{ textAlign: 'center' }}>
                                    <div className="text-muted" style={{ fontSize: '10px' }}>BİTEN İŞ</div>
                                    <div style={{ fontWeight: 'bold' }}>{person.jobsCount}</div>
                                </div>
                            </div>

                            {isSystemAdmin && (
                                <div className="flex-between gap-2" style={{ marginTop: '16px' }}>
                                    <button className="btn btn-outline w-full" style={{ fontSize: '12px' }} onClick={() => { setSelectedStaff(person); setShowTaskModal(true); }}>Görev Ata</button>
                                    <button className="btn btn-outline w-full" style={{ fontSize: '12px' }} onClick={() => { setSelectedStaff(person); setShowPermissionModal(true); }}>Yetki Düzenle</button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* ROLES PERMISSIONS TAB */}
            {activeTab === 'roles' && (
                <div className="card glass">
                    <h3 style={{ marginBottom: '24px' }}>Rol Bazlı Erişim Matrisi</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead className="text-muted" style={{ fontSize: '12px', borderBottom: '1px solid var(--border-light)' }}>
                            <tr>
                                <th style={{ padding: '12px' }}>Rol Adı</th>
                                <th>Erişebildiği Alanlar</th>
                                <th>Kritik İşlemler</th>
                                <th>İşlem</th>
                            </tr>
                        </thead>
                        <tbody style={{ fontSize: '14px' }}>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '20px 12px', fontWeight: 'bold', color: 'var(--primary)' }}>Süper Yönetici</td>
                                <td>Tam Erişim</td>
                                <td>Şube Silme, Personel Silme, Ayar Değiştirme</td>
                                <td><span className="text-muted" style={{ fontSize: '12px' }}>Sistem</span></td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '20px 12px', fontWeight: 'bold' }}>Şube Müdürü</td>
                                <td>
                                    <div className="flex-center gap-2" style={{ justifyContent: 'flex-start', flexWrap: 'wrap' }}>
                                        <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>Kendi Şubesi</span>
                                        <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>Personel Yönetimi</span>
                                        <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>Kasa Raporu</span>
                                    </div>
                                </td>
                                <td>Fiyat İndirimi, İade Onayı</td>
                                <td><button className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '12px' }}>Düzenle</button></td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '20px 12px', fontWeight: 'bold' }}>E-Ticaret Uzmanı</td>
                                <td>
                                    <div className="flex-center gap-2" style={{ justifyContent: 'flex-start', flexWrap: 'wrap' }}>
                                        <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>Siparişler</span>
                                        <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>Web Ürünleri</span>
                                    </div>
                                </td>
                                <td>E-Fatura Oluşturma</td>
                                <td><button className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '12px' }}>Düzenle</button></td>
                            </tr>
                            <tr>
                                <td style={{ padding: '20px 12px', fontWeight: 'bold' }}>Servis Personeli</td>
                                <td>
                                    <div className="flex-center gap-2" style={{ justifyContent: 'flex-start', flexWrap: 'wrap' }}>
                                        <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>İş Emri Açma</span>
                                        <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>Stok Görüntüleme</span>
                                    </div>
                                </td>
                                <td>-</td>
                                <td><button className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '12px' }}>Düzenle</button></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}

            {/* PERFORMANCE ANALYSIS TAB */}
            {activeTab === 'performance' && (
                <div className="flex-col gap-6">
                    <div className="grid-cols-3 gap-6">
                        <div className="card glass" style={{ borderTop: '4px solid var(--success)' }}>
                            <div className="text-muted" style={{ fontSize: '12px' }}>EKİP SATIŞ HEDEFİ</div>
                            <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '5px' }}>%82 <span style={{ fontSize: '14px', color: 'var(--success)' }}>↑</span></div>
                            <div style={{ height: '6px', background: '#222', borderRadius: '3px', marginTop: '10px' }}><div style={{ width: '82%', height: '100%', background: 'var(--success)', borderRadius: '3px' }}></div></div>
                        </div>
                        <div className="card glass" style={{ borderTop: '4px solid var(--primary)' }}>
                            <div className="text-muted" style={{ fontSize: '12px' }}>BEKLENEN TOPLAM PRİM</div>
                            <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '5px' }}>₺ 32,450</div>
                            <div className="text-muted" style={{ fontSize: '11px', marginTop: '5px' }}>Tüm personel toplamı</div>
                        </div>
                        <div className="card glass" style={{ borderTop: '4px solid var(--warning)' }}>
                            <div className="text-muted" style={{ fontSize: '12px' }}>EKİP VERİMLİLİĞİ</div>
                            <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '5px' }}>B+</div>
                            <div className="text-muted" style={{ fontSize: '11px', marginTop: '5px' }}>Geçen aya göre %5 artış</div>
                        </div>
                    </div>

                    <div className="card">
                        <h3>Personel Bazlı Prim Hesaplaması (Bu Ay)</h3>
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                            <thead className="text-muted" style={{ fontSize: '12px', borderBottom: '1px solid var(--border-light)' }}>
                                <tr>
                                    <th style={{ padding: '12px' }}>Personel</th>
                                    <th>Kategori</th>
                                    <th>Ciro Hedefi</th>
                                    <th>Gerçekleşen</th>
                                    <th>Performans</th>
                                    <th>Hakedilen Prim</th>
                                </tr>
                            </thead>
                            <tbody style={{ fontSize: '14px' }}>
                                {[
                                    { name: 'Kemal Y.', cat: 'Mekanik', target: 50000, actual: 45000, bonus: 2250, color: 'var(--primary)' },
                                    { name: 'Ayşe B.', cat: 'Mağaza', target: 120000, actual: 154000, bonus: 4620, color: 'var(--success)' },
                                    { name: 'Serkan D.', cat: 'Bisiklet', target: 15000, actual: 12500, bonus: 625, color: 'var(--warning)' },
                                ].map((p, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '15px 12px', fontWeight: 'bold' }}>{p.name}</td>
                                        <td>{p.cat}</td>
                                        <td className="text-muted">₺ {p.target.toLocaleString()}</td>
                                        <td style={{ fontWeight: 'bold' }}>₺ {p.actual.toLocaleString()}</td>
                                        <td>
                                            <div style={{ width: '80px', height: '6px', background: '#222', borderRadius: '3px' }}>
                                                <div style={{ width: `${Math.min(100, (p.actual / p.target) * 100)}%`, height: '100%', background: p.color, borderRadius: '3px' }}></div>
                                            </div>
                                            <div style={{ fontSize: '10px', marginTop: '4px', color: p.color }}>%{Math.round((p.actual / p.target) * 100)}</div>
                                        </td>
                                        <td style={{ color: 'var(--success)', fontWeight: 'bold' }}>₺ {p.bonus.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* --- ASSIGN TASK MODAL --- */}
            {showTaskModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
                    <div className="card glass animate-slide-up" style={{ width: '450px', padding: '30px' }}>
                        <h3 style={{ marginBottom: '10px' }}>🛠️ Görev Atama: {selectedStaff?.name}</h3>
                        <p className="text-muted" style={{ fontSize: '13px', marginBottom: '25px' }}>Personelin "Şu Anki Görev" alanında görünecek işi belirleyin.</p>

                        <div className="flex-col gap-4">
                            <div className="flex-col gap-2">
                                <label style={{ fontSize: '11px', fontWeight: 'bold' }}>İŞ AÇIKLAMASI</label>
                                <textarea
                                    placeholder="Örn: Honda Forza periyodik bakım..."
                                    value={taskContent}
                                    onChange={e => setTaskContent(e.target.value)}
                                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '10px', padding: '15px', color: 'var(--text-main)', fontSize: '14px', minHeight: '100px', outline: 'none' }}
                                />
                            </div>

                            <div className="flex-col gap-2">
                                <label style={{ fontSize: '11px', fontWeight: 'bold' }}>ÖNCELİK DURUMU</label>
                                <select
                                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '10px', padding: '12px', color: 'var(--text-main)' }}
                                    value={taskPriority}
                                    onChange={e => setTaskPriority(e.target.value)}
                                >
                                    <option value="normal">🟢 Normal</option>
                                    <option value="high">🟡 Yüksek Öncelik</option>
                                    <option value="urgent">🔴 Acil</option>
                                </select>
                            </div>

                            <div className="flex-between gap-3" style={{ marginTop: '20px' }}>
                                <button className="btn btn-outline w-full" disabled={isProcessing} onClick={() => setShowTaskModal(false)}>İptal</button>
                                <button className="btn btn-primary w-full" disabled={isProcessing} onClick={handleAssignTask}>
                                    {isProcessing ? 'İŞLENİYOR...' : 'Görevi Başlat'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MANAGE PERMISSIONS MODAL --- */}
            {showPermissionModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
                    <div className="card glass animate-slide-up" style={{ width: '600px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '30px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <h3 style={{ marginBottom: '5px' }}>🔐 Yetki & Erişim Kontrolü</h3>
                            <p className="text-muted" style={{ fontSize: '13px' }}>{selectedStaff?.name} - {selectedStaff?.branch} Şubesi</p>
                        </div>

                        <div style={{ padding: '30px', overflowY: 'auto' }}>
                            <div style={{ background: 'rgba(255, 85, 0, 0.1)', border: '1px solid rgba(255, 85, 0, 0.2)', padding: '15px', borderRadius: '12px', marginBottom: '25px' }}>
                                <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--primary)' }}>👮 ŞUBE İZOLASYONU AKTİF</div>
                                <p style={{ fontSize: '11px', marginTop: '5px', opacity: 0.8 }}>Bu personel sadece <b>{selectedStaff?.branch}</b> şubesinin verilerini görebilecek. Diğer şubelerin stok, satış ve kasa verileri gizlenecektir.</p>
                            </div>

                            <div className="flex-col gap-6">
                                {['Satış', 'Depo', 'Muhasebe', 'Müşteri', 'Tedarikçi', 'Finansal Yönetim', 'E-Ticaret', 'Yönetim', 'Kritik Yetkiler', 'Güvenlik'].map(cat => (
                                    <div key={cat}>
                                        <div style={{ fontSize: '10px', fontWeight: '900', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '12px' }}>{cat.toUpperCase()} YETKİLERİ</div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                            {allPermissions.filter(p => p.category === cat).map(perm => (
                                                <div
                                                    key={perm.id}
                                                    onClick={() => togglePermission(perm.id)}
                                                    style={{
                                                        padding: '12px', borderRadius: '10px', border: '1px solid #333', cursor: 'pointer',
                                                        background: selectedStaff.permissions?.includes(perm.id) ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                                                        display: 'flex', alignItems: 'center', gap: '10px'
                                                    }}
                                                >
                                                    <div style={{
                                                        width: '18px', height: '18px', borderRadius: '4px', border: '2px solid var(--primary)',
                                                        background: selectedStaff.permissions?.includes(perm.id) ? 'var(--primary)' : 'transparent',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px'
                                                    }}>
                                                        {selectedStaff.permissions?.includes(perm.id) && '✓'}
                                                    </div>
                                                    <span style={{ fontSize: '13px', fontWeight: selectedStaff.permissions?.includes(perm.id) ? 'bold' : 'normal' }}>{perm.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ padding: '20px 30px', background: 'rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
                            <button className="btn btn-outline" disabled={isProcessing} onClick={() => setShowPermissionModal(false)}>VAZGEÇ</button>
                            <button className="btn btn-primary" style={{ padding: '12px 30px' }} disabled={isProcessing} onClick={savePermissions}>
                                {isProcessing ? 'KAYDEDİLİYOR...' : 'YETKİLERİ KAYDET'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- ADD STAFF MODAL --- */}
            {showAddStaffModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
                    <div className="card glass animate-slide-up" style={{ width: '450px', padding: '30px' }}>
                        <h3 style={{ marginBottom: '10px' }}>👤 Yeni Personel Kaydı</h3>
                        <p className="text-muted" style={{ fontSize: '13px', marginBottom: '25px' }}>Personel bilgilerini girin. Güvenlik için <b>Şube İzolasyonu</b> aktif edilecektir.</p>

                        <div className="flex-col gap-4">
                            <div className="flex-col gap-2">
                                <label style={{ fontSize: '11px', fontWeight: 'bold' }}>AD SOYAD</label>
                                <input
                                    type="text"
                                    value={newStaff.name}
                                    onChange={e => setNewStaff({ ...newStaff, name: e.target.value })}
                                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '12px', color: 'var(--text-main)' }}
                                />
                            </div>

                            <div className="flex-col gap-2">
                                <label style={{ fontSize: '11px', fontWeight: 'bold' }}>UNVAN / ROL</label>
                                <input
                                    type="text"
                                    placeholder="Örn: Mekanik, Satış Danışmanı..."
                                    value={newStaff.role}
                                    onChange={e => setNewStaff({ ...newStaff, role: e.target.value })}
                                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '12px', color: 'var(--text-main)' }}
                                />
                            </div>

                            <div className="flex-col gap-2">
                                <label style={{ fontSize: '11px', fontWeight: 'bold' }}>ATANAN ŞUBE</label>
                                <select
                                    value={newStaff.branch}
                                    onChange={e => setNewStaff({ ...newStaff, branch: e.target.value })}
                                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '12px', color: 'var(--text-main)' }}
                                >
                                    <option>Merkez</option>
                                    <option>Kadıköy</option>
                                    <option>Beşiktaş</option>
                                    <option>E-Ticaret</option>
                                </select>
                            </div>

                            <div className="flex-between gap-3" style={{ marginTop: '20px' }}>
                                <button className="btn btn-outline w-full" disabled={isProcessing} onClick={() => setShowAddStaffModal(false)}>Vazgeç</button>
                                <button className="btn btn-primary w-full" disabled={isProcessing} onClick={handleSaveStaff}>
                                    {isProcessing ? 'İŞLENİYOR...' : 'Kaydet'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
