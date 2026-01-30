
"use client";

import { useState, useEffect } from 'react';
import { useModal } from '@/contexts/ModalContext';
import { useApp } from '@/contexts/AppContext';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('users'); // users, invoice, definitions, branches, expenses, logs
    const [definitionTab, setDefinitionTab] = useState('brands'); // brands, cust_class, supp_class, prod_cat
    const { showSuccess, showError, showWarning, showConfirm } = useModal();
    const {
        branches: contextBranches,
        refreshBranches,
        serviceSettings,
        updateServiceSettings,
        brands, setBrands,
        prodCats, setProdCats,
        custClasses, setCustClasses,
        suppClasses, setSuppClasses,
        warranties, setWarranties,
        refreshSettings
    } = useApp();

    // --- 1. KULLANICILAR STATE ---
    const [users, setUsers] = useState([
        { id: 1, name: 'Yönetici', email: 'admin@motoroil.com', role: 'System Admin', permissions: ['*'], branch: 'Tümü', status: 'Aktif' },
        { id: 2, name: 'Kemal Usta', email: 'kemal@motoroil.com', role: 'Servis', permissions: ['service_view', 'service_create'], branch: 'Merkez', status: 'Aktif' },
    ]);
    const [newUser, setNewUser] = useState({ name: '', email: '', role: 'Personel', branch: 'Merkez' });

    const permissionTemplates = {
        'Admin': ['*'],
        'Kasiyer': ['pos_access', 'sales_view', 'customer_view', 'finance_collect'],
        'Depo Sorumlusu': ['inventory_view', 'inventory_edit', 'transfer_request'],
        'Muhasebe': ['finance_view', 'finance_edit', 'report_view', 'customer_view'],
        'Servis Danışmanı': ['service_view', 'service_create', 'service_edit', 'customer_view']
    };

    const [editingUserPerms, setEditingUserPerms] = useState<any>(null);
    const availablePermissions = [
        { id: 'inventory_view', label: 'Stok Görüntüleme' },
        { id: 'inventory_edit', label: 'Stok Düzenleme' },
        { id: 'delete_records', label: 'Kayıt Silme (Kritik)' },
        { id: 'finance_view', label: 'Finansal Raporları Görme' },
        { id: 'finance_collect', label: 'Tahsilat Yapma' },
        { id: 'branch_isolation', label: 'Şube İzolasyonu (Sadece Kendi Şubesi)' },
        { id: 'staff_manage', label: 'Personel Yönetimi' },
        { id: 'ecommerce_view', label: 'E-Ticaret Analizi' },
        { id: 'pos_access', label: 'Satış/POS Erişimi' }
    ];

    const addUser = () => {
        if (!newUser.name) return;
        const initialPerms = (permissionTemplates as any)[newUser.role] || [];
        setUsers([...users, { id: Date.now(), ...newUser, permissions: initialPerms, status: 'Aktif' }]);
        setNewUser({ name: '', email: '', role: 'Personel', branch: 'Merkez' });
    };

    const deleteUser = (id: number) => {
        showConfirm('Emin misiniz?', 'Kullanıcıyı silmek istediğinize emin misiniz?', () => {
            setUsers(users.filter(u => u.id !== id));
            showSuccess('Başarılı', 'Kullanıcı silindi.');
        });
    };

    // --- 2. FATURA AYARLARI STATE ---
    const [invoiceSettings, setInvoiceSettings] = useState({
        kdvRates: [1, 10, 20],
        defaultNote: 'İşbu fatura 7 gün içinde itiraz edilmediği takdirde kabul edilmiş sayılır.',
        prefix: 'MTR',
        nextNumber: 2026001
    });
    const [newKdv, setNewKdv] = useState('');

    const addKdv = () => {
        if (newKdv) {
            setInvoiceSettings({ ...invoiceSettings, kdvRates: [...invoiceSettings.kdvRates, parseInt(newKdv)] });
            setNewKdv('');
        }
    };

    // --- 2. FATURA AYARLARI STATE ---

    // --- 3. SERVİS AYARLARI YEREL STATE ---
    const [localServiceSettings, setLocalServiceSettings] = useState(serviceSettings);

    useEffect(() => {
        if (activeTab === 'services') {
            setLocalServiceSettings(serviceSettings);
        }
    }, [activeTab, serviceSettings]);

    const handleSaveServiceSettings = async () => {
        try {
            await updateServiceSettings(localServiceSettings);
            showSuccess('Başarılı', 'Servis ücretleri güncellendi.');
        } catch (e) {
            showError('Hata', 'Ayarlar kaydedilemedi.');
        }
    };

    const [newItemInput, setNewItemInput] = useState('');

    const addDefinition = async (key: string, list: string[], setList: any) => {
        if (!newItemInput) return;
        const newList = [...list, newItemInput];
        setList(newList);
        setNewItemInput('');

        // Veritabanına kaydet
        try {
            await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [key]: newList })
            });
        } catch (e) { showError('Hata', 'Kayıt yapılamadı.'); }
    };

    const removeDefinition = async (key: string, item: string, list: string[], setList: any) => {
        const newList = list.filter(i => i !== item);
        setList(newList);

        // Veritabanına kaydet
        try {
            await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [key]: newList })
            });
        } catch (e) { showError('Hata', 'Kayıt güncellenemedi.'); }
    };

    // --- 4. BİLDİRİM AYARLARI ---
    const [notifSettings, setNotifSettings] = useState({
        notif_on_delete: true,
        notif_on_approval: true
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/settings');
                const data = await res.json();
                if (data && !data.error) {
                    setNotifSettings({
                        notif_on_delete: data.notif_on_delete ?? true,
                        notif_on_approval: data.notif_on_approval ?? true
                    });

                    // Veritabanından tanımları yükle
                    if (data.brands) setBrands(data.brands);
                    if (data.custClasses) setCustClasses(data.custClasses);
                    if (data.suppClasses) setSuppClasses(data.suppClasses);
                    if (data.prodCats) setProdCats(data.prodCats);
                    if (data.warranties) setWarranties(data.warranties);
                }
            } catch (e) { console.error(e); }
        };
        fetchSettings();
    }, []);

    const saveNotifSettings = async () => {
        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(notifSettings)
            });
            const data = await res.json();
            if (data.success) {
                showSuccess('Başarılı', '✅ Bildirim tercihleri kaydedildi.');
            } else {
                showError('Hata', 'Ayarlar kaydedilemedi.');
            }
        } catch (e) {
            showError('Hata', 'Sunucu hatası.');
        }
    };

    // --- 5. HAREKET GÜNLÜKLERİ ---
    const [logs, setLogs] = useState<any[]>([]);
    const [isLogsLoading, setIsLogsLoading] = useState(false);

    const fetchLogs = async () => {
        setIsLogsLoading(true);
        try {
            const res = await fetch('/api/logs');
            const data = await res.json();
            if (data.success) {
                setLogs(data.logs);
            }
        } catch (e) {
            console.error('Log error:', e);
        } finally {
            setIsLogsLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'logs') {
            fetchLogs();
        }
    }, [activeTab]);

    // --- 4. ŞUBELER & EVRAK DEPOSU ---
    // --- 4. ŞUBELER & EVRAK DEPOSU ---
    const branches = contextBranches?.map(b => ({ ...b, docs: 0 })) || [];
    const [newBranch, setNewBranch] = useState({ name: '', type: 'Şube', city: '', address: '', phone: '', manager: '', status: 'Aktif' });
    const [editingBranchId, setEditingBranchId] = useState<number | null>(null);
    const [selectedBranchDocs, setSelectedBranchDocs] = useState<number | null>(null); // Branch ID

    const addBranch = async () => {
        if (!newBranch.name) return;

        try {
            let res;
            if (editingBranchId) {
                res = await fetch(`/api/branches/${editingBranchId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newBranch)
                });
            } else {
                res = await fetch('/api/branches', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newBranch)
                });
            }

            const data = await res.json();
            if (data.success) {
                showSuccess(editingBranchId ? 'Güncellendi' : 'Eklendi', 'Şube işlemi başarılı.');
                await refreshBranches();
                setEditingBranchId(null);
                setNewBranch({ name: '', type: 'Şube', city: '', address: '', phone: '', manager: '', status: 'Aktif' });
            } else {
                showError('Hata', data.error);
            }
        } catch (e) {
            console.error(e);
            showError('Hata', 'Bir hata oluştu.');
        }
    };

    const editBranch = (branch: any) => {
        setNewBranch(branch);
        setEditingBranchId(branch.id);
        setActiveTab('branches'); // Ensure tab is active
        // Scroll to form (optional)
    };

    const deleteBranch = (id: number) => {
        showConfirm('Şubeyi Sil?', 'Bu şubeyi silmek istediğinize emin misiniz? Bağlı personel ve stoklar etkilenebilir.', async () => {
            try {
                const res = await fetch(`/api/branches/${id}`, { method: 'DELETE' });
                const data = await res.json();

                if (data.success) {
                    await refreshBranches();
                    showSuccess('Silindi', 'Şube sistemden kaldırıldı.');
                } else {
                    showError('Hata', data.error || 'Silinemedi');
                }
            } catch (e) {
                showError('Hata', 'Silme işlemi başarısız.');
            }
        });
    };

    // Mock File Upload
    const [mockFiles, setMockFiles] = useState([
        { name: 'Kira_Sozlesmesi_2026.pdf', date: '2026-01-10', type: 'PDF' },
        { name: 'Ruhsat_Fotokopisi.jpg', date: '2025-12-15', type: 'IMG' },
        { name: 'Vergi_Levhasi.png', date: '2026-01-02', type: 'IMG' }
    ]);

    const handleFileUpload = () => {
        showSuccess('Simülasyon', '📂 Dosya seçme penceresi açıldı (Simülasyon).\n\nDosya sunucuya yükleniyor...');
        setMockFiles([...mockFiles, { name: 'Yeni_Yuklenen_Belge.pdf', date: new Date().toISOString().split('T')[0], type: 'PDF' }]);
    };

    // --- 5. SATIŞ GİDERLERİ (YENİ) ---
    const [salesExpenses, setSalesExpenses] = useState({
        posCommissions: [
            { installment: 'Tek Çekim', rate: 3.0 },
            { installment: '2 Taksit', rate: 3.5 },
            { installment: '3 Taksit', rate: 4.2 },
            { installment: '6 Taksit', rate: 5.8 },
            { installment: '9 Taksit', rate: 6.9 },
            { installment: '12 Taksit', rate: 7.8 },
        ],
        eInvoiceCost: 0.15, // TL per invoice
        printingCost: 0.05, // TL per printed page
        otherCosts: [
            { name: 'Poşet/Ambalaj', cost: 0.50 },
            { name: 'Kargo Maliyeti (Ortalama)', cost: 15.00 }
        ]
    });

    const [newCommission, setNewCommission] = useState({ installment: '', rate: 0 });
    const [newOtherCost, setNewOtherCost] = useState({ name: '', cost: 0 });
    const [editingCommissionIdx, setEditingCommissionIdx] = useState<number | null>(null);
    const [editingCommissionData, setEditingCommissionData] = useState({ installment: '', rate: 0 });

    const addCommissionRate = () => {
        if (!newCommission.installment || newCommission.rate <= 0) return;
        setSalesExpenses({
            ...salesExpenses,
            posCommissions: [...salesExpenses.posCommissions, newCommission]
        });
        setNewCommission({ installment: '', rate: 0 });
    };

    const removeCommissionRate = (index: number) => {
        const updated = [...salesExpenses.posCommissions];
        updated.splice(index, 1);
        setSalesExpenses({ ...salesExpenses, posCommissions: updated });
    };

    const startEditingCommission = (index: number) => {
        setEditingCommissionIdx(index);
        setEditingCommissionData({ ...salesExpenses.posCommissions[index] });
    };

    const saveEditingCommission = () => {
        if (editingCommissionIdx === null) return;
        const updated = [...salesExpenses.posCommissions];
        updated[editingCommissionIdx] = editingCommissionData;
        setSalesExpenses({ ...salesExpenses, posCommissions: updated });
        setEditingCommissionIdx(null);
    };

    const cancelEditingCommission = () => {
        setEditingCommissionIdx(null);
    };

    const addOtherCost = () => {
        if (!newOtherCost.name || newOtherCost.cost <= 0) return;
        setSalesExpenses({
            ...salesExpenses,
            otherCosts: [...salesExpenses.otherCosts, newOtherCost]
        });
        setNewOtherCost({ name: '', cost: 0 });
    };

    const removeOtherCost = (index: number) => {
        const updated = [...salesExpenses.otherCosts];
        updated.splice(index, 1);
        setSalesExpenses({ ...salesExpenses, otherCosts: updated });
    };


    // --- DATA PERSISTENCE (AUTO SAVE) ---
    const [isLoaded, setIsLoaded] = useState(false);

    // 1. Load data from localStorage on mount
    useEffect(() => {
        try {
            const savedUsers = localStorage.getItem('motoroil_settings_users');
            if (savedUsers) setUsers(JSON.parse(savedUsers));

            const savedInvoice = localStorage.getItem('motoroil_settings_invoice');
            if (savedInvoice) setInvoiceSettings(JSON.parse(savedInvoice));

            const savedExpenses = localStorage.getItem('motoroil_settings_expenses');
            if (savedExpenses) setSalesExpenses(JSON.parse(savedExpenses));


            const savedDefinitions = localStorage.getItem('motoroil_settings_definitions');
            if (savedDefinitions) {
                const defs = JSON.parse(savedDefinitions);
                if (defs.brands) setBrands(defs.brands);
                if (defs.prodCats) setProdCats(defs.prodCats);
                if (defs.custClasses) setCustClasses(defs.custClasses);
            }
        } catch (error) {
            console.error('Ayarlar yüklenirken hata oluştu:', error);
        } finally {
            setIsLoaded(true);
        }
    }, []);

    // 2. Auto-save data when changes occur
    useEffect(() => {
        if (!isLoaded) return;
        localStorage.setItem('motoroil_settings_users', JSON.stringify(users));
    }, [users, isLoaded]);



    useEffect(() => {
        if (!isLoaded) return;
        localStorage.setItem('motoroil_settings_invoice', JSON.stringify(invoiceSettings));
    }, [invoiceSettings, isLoaded]);

    useEffect(() => {
        if (!isLoaded) return;
        localStorage.setItem('motoroil_settings_expenses', JSON.stringify(salesExpenses));
    }, [salesExpenses, isLoaded]);


    useEffect(() => {
        if (!isLoaded) return;
        localStorage.setItem('motoroil_settings_definitions', JSON.stringify({
            brands, prodCats, custClasses
        }));
    }, [brands, prodCats, custClasses, isLoaded]);



    return (
        <div className="container" style={{ padding: '0', height: '100vh', display: 'flex' }}>

            {/* LEFT SIDEBAR MENU */}
            <div style={{ width: '250px', borderRight: '1px solid var(--border-light)', padding: '20px', background: 'var(--bg-card)' }}>
                <h2 style={{ fontSize: '20px', marginBottom: '24px', paddingLeft: '10px' }}>⚙ Ayarlar</h2>

                <div className="flex-col gap-2">
                    <button onClick={() => setActiveTab('users')} className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-ghost'}`} style={{ justifyContent: 'flex-start' }}>👤 Kullanıcılar</button>
                    <button onClick={() => setActiveTab('branches')} className={`btn ${activeTab === 'branches' ? 'btn-primary' : 'btn-ghost'}`} style={{ justifyContent: 'flex-start' }}>🏢 Şubeler & Depo</button>
                    <button onClick={() => setActiveTab('invoice')} className={`btn ${activeTab === 'invoice' ? 'btn-primary' : 'btn-ghost'}`} style={{ justifyContent: 'flex-start' }}>🧾 Fatura Ayarları</button>
                    <button onClick={() => setActiveTab('services')} className={`btn ${activeTab === 'services' ? 'btn-primary' : 'btn-ghost'}`} style={{ justifyContent: 'flex-start' }}>🔧 Servis Ücretleri</button>
                    <button onClick={() => setActiveTab('taxes')} className={`btn ${activeTab === 'taxes' ? 'btn-primary' : 'btn-ghost'}`} style={{ justifyContent: 'flex-start' }}>💰 KDV & Vergiler</button>
                    <button onClick={() => setActiveTab('expenses')} className={`btn ${activeTab === 'expenses' ? 'btn-primary' : 'btn-ghost'}`} style={{ justifyContent: 'flex-start' }}>💳 Satış Giderleri</button>
                    <button onClick={() => setActiveTab('definitions')} className={`btn ${activeTab === 'definitions' ? 'btn-primary' : 'btn-ghost'}`} style={{ justifyContent: 'flex-start' }}>📚 Tanımlar & Liste</button>
                    <button onClick={() => setActiveTab('logs')} className={`btn ${activeTab === 'logs' ? 'btn-primary' : 'btn-ghost'}`} style={{ justifyContent: 'flex-start' }}>📜 İşlem Günlükleri (Log)</button>
                    <button onClick={() => setActiveTab('notifications')} className={`btn ${activeTab === 'notifications' ? 'btn-primary' : 'btn-ghost'}`} style={{ justifyContent: 'flex-start' }}>🔔 Bildirim Ayarları</button>
                    <button onClick={() => setActiveTab('backup')} className={`btn ${activeTab === 'backup' ? 'btn-primary' : 'btn-ghost'}`} style={{ justifyContent: 'flex-start' }}>☁️ Yedekleme & Bulut</button>
                    <div style={{ height: '1px', background: 'var(--border-light)', margin: '10px 0' }}></div>
                    <button onClick={() => setActiveTab('reset')} className={`btn ${activeTab === 'reset' ? 'btn-danger' : 'btn-ghost'}`} style={{ justifyContent: 'flex-start', color: activeTab === 'reset' ? 'white' : 'var(--danger)' }}>🚨 SİSTEM SIFIRLAMA</button>
                </div>
            </div>

            {/* RIGHT CONTENT AREA */}
            <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>

                {/* 1. KULLANICILAR */}
                {activeTab === 'users' && (
                    <div>
                        <h2 style={{ marginBottom: '20px' }}>Kullanıcı Yönetimi</h2>

                        {/* Add User Form */}
                        <div className="card glass mb-4" style={{ display: 'grid', gridTemplateColumns: 'minmax(150px, 1fr) minmax(150px, 1.5fr) 1fr 1fr auto', gap: '12px', alignItems: 'end' }}>
                            <div className="flex-col gap-2">
                                <label className="text-muted" style={{ fontSize: '11px', fontWeight: 'bold' }}>AD SOYAD</label>
                                <input type="text" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-light)', background: 'var(--bg-card)', color: 'var(--text-main)' }} placeholder="Ali Veli" />
                            </div>
                            <div className="flex-col gap-2">
                                <label className="text-muted" style={{ fontSize: '11px', fontWeight: 'bold' }}>E-POSTA</label>
                                <input type="text" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-light)', background: 'var(--bg-card)', color: 'var(--text-main)' }} placeholder="ali@mail.com" />
                            </div>
                            <div className="flex-col gap-2">
                                <label className="text-muted" style={{ fontSize: '11px', fontWeight: 'bold' }}>ŞUBE</label>
                                <select value={newUser.branch} onChange={e => setNewUser({ ...newUser, branch: e.target.value })} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-light)', background: 'var(--bg-card)', color: 'var(--text-main)' }}>
                                    <option>Merkez</option>
                                    <option>Kadıköy</option>
                                    <option>Beşiktaş</option>
                                    <option>Tümü</option>
                                </select>
                            </div>
                            <div className="flex-col gap-2">
                                <label className="text-muted" style={{ fontSize: '11px', fontWeight: 'bold' }}>ROL / ŞABLON</label>
                                <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-light)', background: 'var(--bg-card)', color: 'var(--text-main)' }}>
                                    {Object.keys(permissionTemplates).map(role => <option key={role}>{role}</option>)}
                                    <option>Personel</option>
                                </select>
                            </div>
                            <button onClick={addUser} className="btn btn-primary" style={{ height: '42px', fontWeight: 'bold' }}>+ Kullanıcı Ekle</button>
                        </div>

                        {/* User List */}
                        <div className="card">
                            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                                <thead><tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)', fontSize: '11px' }}>
                                    <th style={{ padding: '10px' }}>AD SOYAD</th>
                                    <th>E-POSTA</th>
                                    <th>ŞUBE</th>
                                    <th>ROL</th>
                                    <th>YETKİLER</th>
                                    <th style={{ textAlign: 'right' }}>İŞLEM</th>
                                </tr></thead>
                                <tbody>
                                    {users.map(u => (
                                        <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '12px 10px', fontWeight: 'bold' }}>{u.name}</td>
                                            <td className="text-muted">{u.email}</td>
                                            <td><span style={{ fontSize: '12px' }}>{u.branch || 'Merkez'}</span></td>
                                            <td><span style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>{u.role}</span></td>
                                            <td>
                                                <button onClick={() => setEditingUserPerms(u)} className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: '11px', border: '1px solid var(--border-light)' }}>
                                                    ⚙️ {(u.permissions || []).includes('*') ? 'Tam Yetki' : `${(u.permissions || []).length} Yetki`}
                                                </button>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                {u.role !== 'System Admin' && <button onClick={() => deleteUser(u.id)} className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: '11px', color: 'var(--danger)' }}>Sil</button>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* PERMISSION MODAL */}
                        {editingUserPerms && (
                            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <div className="card glass animate-fade-in" style={{ width: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
                                    <div className="flex-between mb-6">
                                        <h3 style={{ borderBottom: '2px solid var(--primary)', paddingBottom: '5px' }}>🛡️ Yetki Yönetimi: {editingUserPerms.name}</h3>
                                        <button onClick={() => setEditingUserPerms(null)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' }}>×</button>
                                    </div>

                                    <div className="flex-col gap-4">
                                        <div className="flex-col gap-2">
                                            <label className="text-muted" style={{ fontSize: '11px', fontWeight: 'bold' }}>HAZIR ŞABLON UYGULA</label>
                                            <div className="flex-center gap-2" style={{ flexWrap: 'wrap' }}>
                                                {Object.keys(permissionTemplates).map(role => (
                                                    <button
                                                        key={role}
                                                        onClick={() => {
                                                            const updated = users.map(u => u.id === editingUserPerms.id ? { ...u, role, permissions: (permissionTemplates as any)[role] } : u);
                                                            setUsers(updated);
                                                            setEditingUserPerms({ ...editingUserPerms, role, permissions: (permissionTemplates as any)[role] });
                                                        }}
                                                        className="btn btn-outline"
                                                        style={{ fontSize: '10px', padding: '4px 8px' }}
                                                    >
                                                        {role}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex-col gap-3" style={{ padding: '20px', background: 'var(--bg-deep)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={(editingUserPerms.permissions || []).includes('*')}
                                                    onChange={e => {
                                                        const newPerms = e.target.checked ? ['*'] : [];
                                                        const updated = users.map(u => u.id === editingUserPerms.id ? { ...u, permissions: newPerms } : u);
                                                        setUsers(updated);
                                                        setEditingUserPerms({ ...editingUserPerms, permissions: newPerms });
                                                    }}
                                                />
                                                <span style={{ fontWeight: 'bold', color: 'var(--warning)' }}>TAM YETKİ (System Admin)</span>
                                            </div>

                                            {availablePermissions.map(perm => {
                                                const isChecked = (editingUserPerms.permissions || []).includes(perm.id) || (editingUserPerms.permissions || []).includes('*');
                                                const isDisabled = (editingUserPerms.permissions || []).includes('*');

                                                return (
                                                    <label key={perm.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: isDisabled ? 'not-allowed' : 'pointer', opacity: isDisabled ? 0.5 : 1 }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={isChecked}
                                                            disabled={isDisabled}
                                                            onChange={e => {
                                                                let newPerms = [...(editingUserPerms.permissions || [])];
                                                                if (e.target.checked) newPerms.push(perm.id);
                                                                else newPerms = newPerms.filter(p => p !== perm.id);

                                                                const updated = users.map(u => u.id === editingUserPerms.id ? { ...u, permissions: newPerms } : u);
                                                                setUsers(updated);
                                                                setEditingUserPerms({ ...editingUserPerms, permissions: newPerms });
                                                            }}
                                                        />
                                                        <span style={{ fontSize: '14px' }}>{perm.label}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>

                                        <button onClick={() => setEditingUserPerms(null)} className="btn btn-primary w-full" style={{ padding: '15px', fontWeight: 'bold' }}>DEĞİŞİKLİKLERİ TAMAMLA</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* 2. ŞUBELER & BELGELER (YENİ) */}
                {activeTab === 'branches' && (
                    <div>
                        <h2 style={{ marginBottom: '20px' }}>Şubeler ve Dijital Arşiv</h2>

                        {/* Add/Edit Branch Form */}
                        <div className="card glass mb-8" style={{ padding: '24px', borderLeft: editingBranchId ? '4px solid var(--warning)' : '4px solid var(--primary)' }}>
                            <div className="flex-between mb-4">
                                <h3 style={{ fontSize: '16px', color: editingBranchId ? 'var(--warning)' : 'var(--primary)' }}>
                                    {editingBranchId ? '✏️ Şube Düzenleme Modu' : '➕ Yeni Şube / Depo Ekle'}
                                </h3>
                                {editingBranchId && (
                                    <button onClick={() => { setEditingBranchId(null); setNewBranch({ name: '', type: 'Şube', city: '', address: '', phone: '', manager: '', status: 'Aktif' }); }} className="btn btn-ghost" style={{ fontSize: '12px' }}>Vazgeç</button>
                                )}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                <div className="flex-col gap-2">
                                    <label className="text-muted" style={{ fontSize: '11px', fontWeight: 'bold' }}>TÜR</label>
                                    <select value={newBranch.type} onChange={e => setNewBranch({ ...newBranch, type: e.target.value })} style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-deep)', color: 'white' }}>
                                        <option>Şube</option>
                                        <option>Depo</option>
                                        <option>Merkez Ofis</option>
                                        <option>Home Office</option>
                                    </select>
                                </div>
                                <div className="flex-col gap-2">
                                    <label className="text-muted" style={{ fontSize: '11px', fontWeight: 'bold' }}>ŞUBE ADI</label>
                                    <input type="text" value={newBranch.name} onChange={e => setNewBranch({ ...newBranch, name: e.target.value })} style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-deep)', color: 'white' }} placeholder="Örn: İzmir Bornova Şube" />
                                </div>
                                <div className="flex-col gap-2">
                                    <label className="text-muted" style={{ fontSize: '11px', fontWeight: 'bold' }}>ŞEHİR</label>
                                    <input type="text" value={newBranch.city} onChange={e => setNewBranch({ ...newBranch, city: e.target.value })} style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-deep)', color: 'white' }} placeholder="İzmir" />
                                </div>
                                <div className="flex-col gap-2">
                                    <label className="text-muted" style={{ fontSize: '11px', fontWeight: 'bold' }}>DURUM</label>
                                    <select value={newBranch.status} onChange={e => setNewBranch({ ...newBranch, status: e.target.value })} style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-deep)', color: 'white' }}>
                                        <option>Aktif</option>
                                        <option>Tadilat</option>
                                        <option>Kapalı</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                                <div className="flex-col gap-2">
                                    <label className="text-muted" style={{ fontSize: '11px', fontWeight: 'bold' }}>AÇIK ADRES</label>
                                    <input type="text" value={newBranch.address} onChange={e => setNewBranch({ ...newBranch, address: e.target.value })} style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-deep)', color: 'white' }} placeholder="Mahalle, Cadde, No..." />
                                </div>
                                <div className="flex-col gap-2">
                                    <label className="text-muted" style={{ fontSize: '11px', fontWeight: 'bold' }}>TELEFON</label>
                                    <input type="text" value={newBranch.phone} onChange={e => setNewBranch({ ...newBranch, phone: e.target.value })} style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-deep)', color: 'white' }} placeholder="0212..." />
                                </div>
                                <div className="flex-col gap-2">
                                    <label className="text-muted" style={{ fontSize: '11px', fontWeight: 'bold' }}>YÖNETİCİ</label>
                                    <input type="text" value={newBranch.manager} onChange={e => setNewBranch({ ...newBranch, manager: e.target.value })} style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-deep)', color: 'white' }} placeholder="Ad Soyad" />
                                </div>
                            </div>

                            <button onClick={addBranch} className={`btn w-full ${editingBranchId ? 'btn-warning' : 'btn-primary'}`} style={{ height: '48px', fontWeight: 'bold', fontSize: '14px' }}>
                                {editingBranchId ? '💾 Değişiklikleri Kaydet (Güncelle)' : '➕ Sisteme Yeni Şube Ekle'}
                            </button>
                        </div>

                        {/* Branch List */}
                        <div className="flex-col gap-4">
                            {branches.map(branch => (
                                <div key={branch.id} className="card glass animate-slide-up" style={{ borderLeft: `4px solid ${branch.status === 'Aktif' ? 'var(--success)' : 'var(--text-muted)'}` }}>
                                    <div className="flex-between" style={{ alignItems: 'flex-start' }}>
                                        <div className="flex-col gap-1">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <span style={{ background: 'var(--bg-deep)', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', border: '1px solid var(--border-light)' }}>
                                                    {branch.type || 'Şube'}
                                                </span>
                                                <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>{branch.name}</h3>
                                                {branch.status !== 'Aktif' && <span style={{ background: 'rgba(255,255,255,0.1)', fontSize: '10px', padding: '2px 6px', borderRadius: '4px' }}>{branch.status}</span>}
                                            </div>
                                            <div className="text-muted" style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '15px', marginTop: '5px' }}>
                                                <span>📍 {branch.city}</span>
                                                <span>📞 {branch.phone}</span>
                                                <span>👤 Yon: {branch.manager || '-'}</span>
                                            </div>
                                            <div className="text-muted" style={{ fontSize: '12px', marginTop: '2px', opacity: 0.7 }}>
                                                🏠 {branch.address}
                                            </div>
                                        </div>

                                        <div className="flex-col gap-2" style={{ alignItems: 'flex-end' }}>
                                            <div className="flex-center gap-2">
                                                <button onClick={() => editBranch(branch)} className="btn btn-ghost" style={{ padding: '6px 10px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', fontSize: '12px' }}>✏️ Düzenle</button>
                                                <button onClick={() => deleteBranch(branch.id)} className="btn btn-ghost" style={{ padding: '6px 10px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', fontSize: '12px' }}>🗑️ Sil</button>
                                            </div>
                                            <button
                                                onClick={() => setSelectedBranchDocs(selectedBranchDocs === branch.id ? null : branch.id)}
                                                className={`btn ${selectedBranchDocs === branch.id ? 'btn-primary' : 'btn-outline'}`}
                                                style={{ fontSize: '11px', padding: '6px 12px' }}
                                            >
                                                {selectedBranchDocs === branch.id ? '📂 Evrakları Kapat' : `📁 Evrak Yönetimi (${branch.docs})`}
                                            </button>
                                        </div>
                                    </div>

                                    {selectedBranchDocs === branch.id && (
                                        <div className="animate-fade-in" style={{ marginTop: '20px', padding: '20px', background: 'var(--bg-deep)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                                            <div className="flex-between mb-4">
                                                <h4 className="text-muted" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>📂 Şube Dijital Arşivi <span style={{ fontSize: '11px', opacity: 0.5 }}>(Kira Kontratı, Ruhsat vb.)</span></h4>
                                                <button onClick={handleFileUpload} className="btn btn-outline" style={{ borderStyle: 'dashed', fontSize: '12px' }}>⬆ Yeni Belge Yükle</button>
                                            </div>
                                            <div className="grid-cols-2 gap-4">
                                                {mockFiles.map((file, idx) => (
                                                    <div key={idx} className="flex-between" style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                        <div className="flex-center gap-3">
                                                            <div style={{ fontSize: '24px', opacity: 0.8 }}>{file.type === 'PDF' ? '📄' : '🖼️'}</div>
                                                            <div>
                                                                <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{file.name}</div>
                                                                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{file.date} • {file.type}</div>
                                                            </div>
                                                        </div>
                                                        <button className="btn btn-ghost" style={{ padding: '6px', fontSize: '11px', opacity: 0.7 }}>⬇ İndir</button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 3. FATURA AYARLARI */}
                {activeTab === 'invoice' && (
                    <div style={{ maxWidth: '600px' }}>
                        <h2 style={{ marginBottom: '20px' }}>Fatura Konfigürasyonu</h2>

                        <div className="card glass flex-col gap-6">
                            <div className="flex-col gap-2">
                                <label className="text-muted">Fatura Notu (Varsayılan)</label>
                                <textarea
                                    rows={3}
                                    value={invoiceSettings.defaultNote}
                                    onChange={(e) => setInvoiceSettings({ ...invoiceSettings, defaultNote: e.target.value })}
                                    style={{ background: 'var(--bg-deep)', border: '1px solid var(--border-light)', padding: '12px', borderRadius: '8px', color: 'white' }}
                                />
                            </div>

                            <div className="grid-cols-2 gap-4">
                                <div className="flex-col gap-2">
                                    <label className="text-muted">Seri Ön Eki</label>
                                    <input type="text" value={invoiceSettings.prefix} onChange={e => setInvoiceSettings({ ...invoiceSettings, prefix: e.target.value })} style={{ padding: '10px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-light)', color: 'var(--text-main)' }} />
                                </div>
                                <div className="flex-col gap-2">
                                    <label className="text-muted">Sıradaki No</label>
                                    <input type="number" value={invoiceSettings.nextNumber} readOnly style={{ padding: '10px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-light)', color: 'var(--text-muted)' }} />
                                </div>
                            </div>

                        </div>

                        <button className="btn btn-primary mt-4">Ayarları Kaydet</button>
                    </div>
                )}

                {/* 3.1. SERVİS AYARLARI (YENİ) */}
                {activeTab === 'services' && (
                    <div style={{ maxWidth: '600px' }}>
                        <h2 style={{ marginBottom: '20px' }}>Servis Ücretlendirme Ayarları</h2>
                        <div className="card glass">
                            <h3 className="mb-4">Standart Bakım Ücretleri</h3>
                            <p className="text-muted" style={{ fontSize: '13px', marginBottom: '20px' }}>
                                Yeni servis kaydı oluştururken otomatik olarak gelecek işçilik (standart bakım) ücretlerini buradan belirleyebilirsiniz.
                            </p>

                            <div className="flex-col gap-4">
                                {/* MOTO */}
                                <div className="flex-between" style={{ padding: '16px', background: 'var(--bg-deep)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                                    <div>
                                        <div style={{ fontWeight: 'bold', fontSize: '15px' }}>🏍️ Motosiklet Bakım Bedeli</div>
                                        <div className="text-muted" style={{ fontSize: '11px' }}>Standart periyodik bakım (yağ, filtre değişim vb.)</div>
                                    </div>
                                    <div className="flex-center gap-2">
                                        <input
                                            type="number"
                                            value={localServiceSettings.motoMaintenancePrice}
                                            onChange={(e) => setLocalServiceSettings({ ...localServiceSettings, motoMaintenancePrice: Number(e.target.value) })}
                                            style={{ width: '100px', padding: '10px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--primary)', color: 'white', fontWeight: 'bold', textAlign: 'right' }}
                                        />
                                        <span style={{ fontWeight: 'bold' }}>₺</span>
                                    </div>
                                </div>

                                {/* BIKE */}
                                <div className="flex-between" style={{ padding: '16px', background: 'var(--bg-deep)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                                    <div>
                                        <div style={{ fontWeight: 'bold', fontSize: '15px' }}>🚲 Bisiklet Bakım Bedeli</div>
                                        <div className="text-muted" style={{ fontSize: '11px' }}>Standart genel bakım ve ayarlar</div>
                                    </div>
                                    <div className="flex-center gap-2">
                                        <input
                                            type="number"
                                            value={localServiceSettings.bikeMaintenancePrice}
                                            onChange={(e) => setLocalServiceSettings({ ...localServiceSettings, bikeMaintenancePrice: Number(e.target.value) })}
                                            style={{ width: '100px', padding: '10px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--primary)', color: 'white', fontWeight: 'bold', textAlign: 'right' }}
                                        />
                                        <span style={{ fontWeight: 'bold' }}>₺</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleSaveServiceSettings}
                                className="btn btn-primary w-full mt-6"
                                style={{ height: '48px', fontWeight: 'bold' }}
                            >
                                💾 Bakım Ücretlerini Kaydet
                            </button>

                            <div style={{ marginTop: '20px', padding: '12px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', fontSize: '12px', color: '#93c5fd', display: 'flex', gap: '10px' }}>
                                <span>ℹ️</span>
                                <span> Not: Bu fiyatlar "Yeni Servis Kaydı" oluşturulurken varsayılan olarak gelir. Servis kaydı esnasında değiştirilebilir.</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3.1. KDV & VERGİLER (YENİ) */}
                {activeTab === 'taxes' && (
                    <div style={{ maxWidth: '600px' }}>
                        <h2 style={{ marginBottom: '20px' }}>Vergi Oranları</h2>

                        <div className="card glass">
                            <h3 className="mb-4">KDV Oranları Listesi</h3>
                            <p className="text-muted" style={{ fontSize: '13px', marginBottom: '20px' }}>
                                Satış ve alış işlemlerinde kullanılacak KDV (Katma Değer Vergisi) oranlarını buradan yönetebilirsiniz.
                                ÖTV veya ÖİV gibi özel vergiler bu sisteme dahil edilmemiştir.
                            </p>

                            <div className="flex-col gap-3">
                                {invoiceSettings.kdvRates.map((rate, idx) => (
                                    <div key={rate} className="flex-between" style={{ padding: '12px 20px', background: 'var(--bg-deep)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                                        <div className="flex-center gap-3">
                                            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>%{rate}</span>
                                            <span className="text-muted" style={{ fontSize: '12px' }}>KDV Oranı</span>
                                        </div>
                                        <button
                                            onClick={() => {
                                                const newRates = invoiceSettings.kdvRates.filter((_, i) => i !== idx);
                                                setInvoiceSettings({ ...invoiceSettings, kdvRates: newRates });
                                            }}
                                            className="btn btn-ghost"
                                            style={{ padding: '6px 12px', color: 'var(--danger)' }}
                                        >
                                            Sil
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div style={{ marginTop: '24px', padding: '20px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '12px', border: '1px dashed var(--success)' }}>
                                <div className="text-muted" style={{ fontSize: '12px', marginBottom: '8px', fontWeight: 'bold' }}>YENİ ORAN EKLE</div>
                                <div className="flex-center gap-2">
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={newKdv}
                                        onChange={e => setNewKdv(e.target.value)}
                                        style={{ width: '100px', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '16px', textAlign: 'center' }}
                                    />
                                    <span style={{ fontSize: '18px', fontWeight: 'bold' }}>%</span>
                                    <button onClick={addKdv} className="btn btn-success" style={{ marginLeft: 'auto' }}>+ Listeye Ekle</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3.5. SATIŞ GİDERLERİ (YENİ) */}
                {activeTab === 'expenses' && (
                    <div>
                        <h2 style={{ marginBottom: '10px' }}>Satış Giderleri Yönetimi</h2>
                        <p className="text-muted" style={{ marginBottom: '30px', fontSize: '14px' }}>
                            Her satışta oluşan görünmeyen giderleri tanımlayın. Bu giderler kar hesaplamalarına otomatik yansıtılır.
                        </p>

                        {/* POS KOMİSYON ORANLARI */}
                        <div className="card glass mb-6">
                            <div className="flex-between mb-4">
                                <div>
                                    <h3>💳 POS Komisyon Oranları</h3>
                                    <p className="text-muted" style={{ fontSize: '12px', marginTop: '4px' }}>Kredi kartı ile yapılan satışlarda banka tarafından kesilen komisyon oranları</p>
                                </div>
                            </div>

                            {/* Add New Commission */}
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '12px', marginBottom: '20px', padding: '15px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '8px', border: '1px dashed var(--primary)' }}>
                                <input
                                    type="text"
                                    placeholder="Taksit Türü (örn: 4 Taksit)"
                                    value={newCommission.installment}
                                    onChange={e => setNewCommission({ ...newCommission, installment: e.target.value })}
                                    style={{ padding: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '6px', color: 'var(--text-main)' }}
                                />
                                <input
                                    type="number"
                                    step="0.1"
                                    placeholder="Oran (%)"
                                    value={newCommission.rate || ''}
                                    onChange={e => setNewCommission({ ...newCommission, rate: parseFloat(e.target.value) || 0 })}
                                    style={{ padding: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '6px', color: 'var(--text-main)' }}
                                />
                                <button onClick={addCommissionRate} className="btn btn-primary">+ Ekle</button>
                            </div>

                            {/* Commission Table */}
                            <table style={{ width: '100%', textAlign: 'left' }}>
                                <thead className="text-muted" style={{ fontSize: '11px', borderBottom: '1px solid var(--border-light)' }}>
                                    <tr><th style={{ padding: '10px' }}>TAKSİT TİPİ</th><th>KOMİSYON ORANI</th><th style={{ textAlign: 'right' }}>İŞLEM</th></tr>
                                </thead>
                                <tbody>
                                    {salesExpenses.posCommissions.map((comm, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            {editingCommissionIdx === idx ? (
                                                // EDIT MODE
                                                <>
                                                    <td style={{ padding: '12px 10px' }}>
                                                        <input
                                                            type="text"
                                                            value={editingCommissionData.installment}
                                                            onChange={e => setEditingCommissionData({ ...editingCommissionData, installment: e.target.value })}
                                                            style={{ width: '100%', padding: '8px', background: 'var(--bg-card)', border: '1px solid var(--primary)', borderRadius: '4px', color: 'var(--text-main)', fontWeight: 'bold' }}
                                                        />
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <span style={{ color: 'var(--danger)' }}>%</span>
                                                            <input
                                                                type="number"
                                                                step="0.1"
                                                                value={editingCommissionData.rate}
                                                                onChange={e => setEditingCommissionData({ ...editingCommissionData, rate: parseFloat(e.target.value) || 0 })}
                                                                style={{ width: '80px', padding: '8px', background: 'var(--bg-card)', border: '1px solid var(--primary)', borderRadius: '4px', color: 'var(--danger)', fontWeight: 'bold' }}
                                                            />
                                                        </div>
                                                    </td>
                                                    <td style={{ textAlign: 'right' }}>
                                                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                                                            <button onClick={saveEditingCommission} className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '12px' }}>Kaydet</button>
                                                            <button onClick={cancelEditingCommission} className="btn btn-ghost" style={{ padding: '4px 12px', fontSize: '12px' }}>İptal</button>
                                                        </div>
                                                    </td>
                                                </>
                                            ) : (
                                                // VIEW MODE
                                                <>
                                                    <td style={{ padding: '12px 10px', fontWeight: 'bold' }}>{comm.installment}</td>
                                                    <td style={{ color: 'var(--danger)' }}>%{comm.rate.toFixed(1)}</td>
                                                    <td style={{ textAlign: 'right' }}>
                                                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                                                            <button onClick={() => startEditingCommission(idx)} className="btn btn-ghost" style={{ padding: '4px 12px', fontSize: '12px', color: 'var(--primary)' }}>Düzenle</button>
                                                            <button onClick={() => removeCommissionRate(idx)} className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: '12px', color: 'var(--danger)' }}>Sil</button>
                                                        </div>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* E-FATURA VE YAZDIRMA GİDERLERİ */}
                        <div className="grid-cols-2 gap-6 mb-6">
                            <div className="card glass">
                                <h3 className="mb-4">🧾 E-Fatura Kontör Gideri</h3>
                                <p className="text-muted" style={{ fontSize: '11px', marginBottom: '12px' }}>Her fatura için ödenen kontör bedeli</p>
                                <div className="flex-center gap-2">
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={salesExpenses.eInvoiceCost}
                                        onChange={e => setSalesExpenses({ ...salesExpenses, eInvoiceCost: parseFloat(e.target.value) || 0 })}
                                        style={{ flex: 1, padding: '12px', background: 'black', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'white', fontSize: '18px', fontWeight: 'bold', textAlign: 'center' }}
                                    />
                                    <span style={{ fontSize: '18px', fontWeight: 'bold' }}>₺</span>
                                </div>
                            </div>

                            <div className="card glass">
                                <h3 className="mb-4">🖨️ Kağıt/Yazdırma Gideri</h3>
                                <p className="text-muted" style={{ fontSize: '11px', marginBottom: '12px' }}>Fiziksel yazdırma başına maliyet</p>
                                <div className="flex-center gap-2">
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={salesExpenses.printingCost}
                                        onChange={e => setSalesExpenses({ ...salesExpenses, printingCost: parseFloat(e.target.value) || 0 })}
                                        style={{ flex: 1, padding: '12px', background: 'black', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'white', fontSize: '18px', fontWeight: 'bold', textAlign: 'center' }}
                                    />
                                    <span style={{ fontSize: '18px', fontWeight: 'bold' }}>₺</span>
                                </div>
                            </div>
                        </div>

                        {/* DİĞER GİDERLER */}
                        <div className="card glass">
                            <div className="flex-between mb-4">
                                <div>
                                    <h3>📦 Diğer Satış Giderleri</h3>
                                    <p className="text-muted" style={{ fontSize: '12px', marginTop: '4px' }}>Poşet, ambalaj, kargo gibi ek maliyetler</p>
                                </div>
                            </div>

                            {/* Add Other Cost */}
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '12px', marginBottom: '20px', padding: '15px', background: 'rgba(255, 165, 0, 0.05)', borderRadius: '8px', border: '1px dashed var(--warning)' }}>
                                <input
                                    type="text"
                                    placeholder="Gider Adı (örn: Poşet)"
                                    value={newOtherCost.name}
                                    onChange={e => setNewOtherCost({ ...newOtherCost, name: e.target.value })}
                                    style={{ padding: '10px', background: 'black', border: '1px solid var(--border-light)', borderRadius: '6px', color: 'white' }}
                                />
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="Tutar (₺)"
                                    value={newOtherCost.cost || ''}
                                    onChange={e => setNewOtherCost({ ...newOtherCost, cost: parseFloat(e.target.value) || 0 })}
                                    style={{ padding: '10px', background: 'black', border: '1px solid var(--border-light)', borderRadius: '6px', color: 'white' }}
                                />
                                <button onClick={addOtherCost} className="btn btn-primary" style={{ background: 'var(--warning)' }}>+ Ekle</button>
                            </div>

                            {/* Other Costs List */}
                            <div className="flex-col gap-2">
                                {salesExpenses.otherCosts.map((cost, idx) => (
                                    <div key={idx} className="flex-between" style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                                        <span style={{ fontWeight: 'bold' }}>{cost.name}</span>
                                        <div className="flex-center gap-4">
                                            <span style={{ color: 'var(--warning)', fontWeight: 'bold' }}>{cost.cost.toFixed(2)} ₺</span>
                                            <button onClick={() => removeOtherCost(idx)} className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: '12px', color: 'var(--danger)' }}>Sil</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* INFO BOX */}
                        <div className="card" style={{ marginTop: '24px', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid var(--primary)' }}>
                            <h4 style={{ color: 'var(--primary)', marginBottom: '8px' }}>💡 Nasıl Çalışır?</h4>
                            <ul style={{ fontSize: '13px', lineHeight: '1.8', color: 'var(--text-muted)', paddingLeft: '20px' }}>
                                <li>POS ile yapılan satışlarda, seçilen taksit türüne göre komisyon <b>otomatik hesaplanır</b></li>
                                <li>Her fatura için e-fatura kontör gideri <b>otomatik eklenir</b></li>
                                <li>Fiziksel yazdırma yapılırsa yazdırma maliyeti <b>kara yansıtılır</b></li>
                                <li>Tüm bu giderler <b>Raporlar → Gerçek Karlılık</b> bölümünde detaylı gösterilir</li>
                            </ul>
                        </div>
                    </div>
                )}

                {/* 4. TANIMLAR (MARKALAR, KATEGORİLER) */}
                {activeTab === 'definitions' && (
                    <div>
                        <h2 style={{ marginBottom: '20px' }}>Sistem Tanımları</h2>

                        <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '12px', marginBottom: '24px' }}>
                            {[
                                { id: 'brands', label: 'Markalar' },
                                { id: 'prod_cat', label: 'Ürün Kategorileri' },
                                { id: 'cust_class', label: 'Müşteri Sınıfları' },
                                { id: 'supp_class', label: 'Tedarikçi Sınıfları' },
                                { id: 'warranties', label: 'Garanti Süreleri' }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setDefinitionTab(tab.id)}
                                    className={`btn ${definitionTab === tab.id ? 'btn-outline' : 'btn-ghost'}`}
                                    style={{ borderColor: definitionTab === tab.id ? 'var(--primary)' : 'transparent' }}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="card glass" style={{ maxWidth: '500px' }}>
                            <div className="flex-between mb-4">
                                <h3 style={{ textTransform: 'capitalize' }}>
                                    {definitionTab === 'brands' ? 'Marka Listesi' :
                                        definitionTab === 'prod_cat' ? 'Ürün Kategorileri' :
                                            definitionTab === 'warranties' ? 'Garanti Süreleri Listesi' : 'Sınıf Tanımları'}
                                </h3>
                                <span className="text-muted" style={{ fontSize: '12px' }}>Yeni eklemek için yazıp Enter'a basın</span>
                            </div>

                            <div className="flex-col gap-2 mb-4">
                                <input
                                    type="text"
                                    placeholder="Yeni Ekle..."
                                    value={newItemInput}
                                    onChange={e => setNewItemInput(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                            if (definitionTab === 'brands') addDefinition('brands', brands, setBrands);
                                            if (definitionTab === 'prod_cat') addDefinition('prodCats', prodCats, setProdCats);
                                            if (definitionTab === 'cust_class') addDefinition('custClasses', custClasses, setCustClasses);
                                            if (definitionTab === 'supp_class') addDefinition('suppClasses', suppClasses, setSuppClasses);
                                            if (definitionTab === 'warranties') addDefinition('warranties', warranties, setWarranties);
                                        }
                                    }}
                                    style={{ padding: '12px', background: 'var(--bg-deep)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'white', width: '100%' }}
                                />
                            </div>

                            <div className="flex-col gap-2">
                                {(
                                    definitionTab === 'brands' ? brands :
                                        definitionTab === 'prod_cat' ? prodCats :
                                            definitionTab === 'cust_class' ? custClasses :
                                                definitionTab === 'supp_class' ? suppClasses : warranties
                                ).map((item, i) => (
                                    <div key={i} className="flex-between" style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                                        <span>{item}</span>
                                        <button
                                            onClick={() => {
                                                if (definitionTab === 'brands') removeDefinition('brands', item, brands, setBrands);
                                                if (definitionTab === 'prod_cat') removeDefinition('prodCats', item, prodCats, setProdCats);
                                                if (definitionTab === 'cust_class') removeDefinition('custClasses', item, custClasses, setCustClasses);
                                                if (definitionTab === 'supp_class') removeDefinition('suppClasses', item, suppClasses, setSuppClasses);
                                                if (definitionTab === 'warranties') removeDefinition('warranties', item, warranties, setWarranties);
                                            }}
                                            style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                                        >
                                            Sil
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* 5. BACKUP & CLOUD */}
                {activeTab === 'backup' && (
                    <div style={{ maxWidth: '700px' }}>
                        <h2 style={{ marginBottom: '20px' }}>Veri Güvenliği ve Yedekleme</h2>

                        <div className="grid-cols-2 gap-6 mb-6">
                            <div className="card glass" style={{ borderLeft: '4px solid var(--success)' }}>
                                <div className="text-muted" style={{ fontSize: '12px' }}>BULUT DURUMU</div>
                                <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '5px' }}>🟢 Senkronize Edildi</div>
                                <div className="text-muted" style={{ fontSize: '11px', marginTop: '5px' }}>Son yedekleme: Bugün, 18:45</div>
                            </div>
                            <div className="card glass">
                                <div className="text-muted" style={{ fontSize: '12px' }}>DEPOLAMA ALANI</div>
                                <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '5px' }}>1.2 GB / 10 GB</div>
                                <div style={{ height: '4px', background: '#222', borderRadius: '2px', marginTop: '10px' }}><div style={{ width: '12%', height: '100%', background: 'var(--primary)', borderRadius: '2px' }}></div></div>
                            </div>
                        </div>

                        <div className="card glass flex-col gap-6">
                            <div className="flex-between" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '16px' }}>
                                <div>
                                    <h4 style={{ marginBottom: '4px' }}>Manuel Yedekleme</h4>
                                    <p className="text-muted" style={{ fontSize: '12px' }}>Tüm veritabanını SQL ve JSON formatında bilgisayarınıza indirin.</p>
                                </div>
                                <button
                                    onClick={() => {
                                        showSuccess('Yedekleme Başlatıldı', '📥 İndirme birazdan başlayacak...');
                                        setTimeout(() => {
                                            window.location.href = '/api/backup';
                                        }, 1000);
                                    }}
                                    className="btn btn-outline"
                                >
                                    ⬇️ Hemen İndir
                                </button>
                            </div>

                            <div className="flex-between" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '16px' }}>
                                <div>
                                    <h4 style={{ marginBottom: '4px' }}>Otomatik Yedekleme Planı</h4>
                                    <p className="text-muted" style={{ fontSize: '12px' }}>Her gece saat 03:00'te otomatik bulut yedeği alınır.</p>
                                </div>
                                <div style={{ color: 'var(--success)', fontWeight: 'bold' }}>AKTİF</div>
                            </div>

                            <div className="flex-between">
                                <div>
                                    <h4 style={{ marginBottom: '4px' }}>Dışa Aktarma (Excel)</h4>
                                    <p className="text-muted" style={{ fontSize: '12px' }}>Tüm cari ve ürün listesini tek bir Excel dosyasında toplayın.</p>
                                </div>
                                <button onClick={() => showSuccess('Rapor Hazırlanıyor', '📑 Konsolide Excel raporu hazırlanıyor...')} className="btn btn-primary">📤 Toplu Aktar</button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'notifications' && (
                    <div style={{ maxWidth: '600px' }}>
                        <h2 style={{ marginBottom: '20px' }}>Bildirim ve Onay Ayarları</h2>

                        <div className="card glass flex-col gap-6">
                            <div>
                                <h3 className="mb-4">📧 E-Posta Bildirimleri</h3>
                                <div className="flex-col gap-4">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={notifSettings.notif_on_delete}
                                            onChange={e => setNotifSettings({ ...notifSettings, notif_on_delete: e.target.checked })}
                                        />
                                        <div>
                                            <div style={{ fontWeight: 'bold' }}>Kritik Silme İşlemleri</div>
                                            <div className="text-muted" style={{ fontSize: '12px' }}>Bir kayıt silindiğinde Admin'e e-posta gönder</div>
                                        </div>
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={notifSettings.notif_on_approval}
                                            onChange={e => setNotifSettings({ ...notifSettings, notif_on_approval: e.target.checked })}
                                        />
                                        <div>
                                            <div style={{ fontWeight: 'bold' }}>Yeni Ürün Onay Talebi</div>
                                            <div className="text-muted" style={{ fontSize: '12px' }}>Personel yeni ürün eklediğinde onay için e-posta gönder</div>
                                        </div>
                                    </label>
                                </div>
                            </div>
                            <button className="btn btn-primary w-full" onClick={saveNotifSettings}>Ayarları Kaydet</button>
                        </div>
                    </div>
                )}

                {/* 7. ACTIVITY LOGS */}
                {activeTab === 'logs' && (
                    <div>
                        <div className="flex-between mb-6">
                            <div>
                                <h2 style={{ marginBottom: '5px' }}>İşlem Günlükleri (Audit Log)</h2>
                                <p className="text-muted" style={{ fontSize: '13px' }}>Sistemdeki kritik değişikliklerin tarihçesi</p>
                            </div>
                            <button className="btn btn-outline" onClick={fetchLogs} disabled={isLogsLoading}>
                                {isLogsLoading ? '...' : '🔄 Yenile'}
                            </button>
                        </div>

                        <div className="card">
                            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)', fontSize: '11px' }}>
                                        <th style={{ padding: '12px' }}>TARİH</th>
                                        <th>KULLANICI</th>
                                        <th>İŞLEM</th>
                                        <th>NESNE</th>
                                        <th>DETAY</th>
                                    </tr>
                                </thead>
                                <tbody style={{ fontSize: '13px' }}>
                                    {logs.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Henüz işlem kaydı bulunmuyor.</td>
                                        </tr>
                                    ) : (
                                        logs.map(log => (
                                            <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                <td style={{ padding: '12px', color: 'var(--text-muted)' }}>
                                                    {new Date(log.createdAt).toLocaleString('tr-TR')}
                                                </td>
                                                <td style={{ fontWeight: 'bold' }}>{log.userName || 'Sistem'}</td>
                                                <td>
                                                    <span style={{
                                                        padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold',
                                                        background: log.action?.includes('DELETE') ? 'rgba(239, 68, 68, 0.1)' :
                                                            log.action?.includes('RESET') ? 'rgba(239, 68, 68, 0.2)' :
                                                                'rgba(59, 130, 246, 0.1)',
                                                        color: log.action?.includes('DELETE') || log.action?.includes('RESET') ? 'var(--danger)' : 'var(--primary)'
                                                    }}>
                                                        {log.action}
                                                    </span>
                                                </td>
                                                <td className="text-muted">{log.entity}</td>
                                                <td>{log.details}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                {/* 5. SİSTEM SIFIRLAMA (DANGER ZONE) */}
                {activeTab === 'reset' && (
                    <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
                        <h2 style={{ marginBottom: '20px', color: 'var(--danger)', fontSize: '24px' }}>⚠️ TEHLİKELİ BÖLGE</h2>

                        <div className="card glass" style={{ border: '2px solid var(--danger)', background: 'rgba(239, 68, 68, 0.05)', padding: '40px' }}>
                            <div style={{ fontSize: '64px', marginBottom: '20px' }}>🧨</div>
                            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '10px' }}>Tüm Verileri Sil ve Sıfırla</h3>
                            <p className="text-muted" style={{ marginBottom: '30px', lineHeight: '1.6' }}>
                                Bu işlem geri alınamaz! Onayladığınız takdirde sistemdeki:<br />
                                <b>- Tüm Satış & Alış Faturaları</b><br />
                                <b>- Tüm Ödeme & Tahsilat İşlemleri (Transactions)</b><br />
                                <b>- Müşteri, Tedarikçi ve Kasa Bakiyeleri</b><br />
                                kalıcı olarak silinecek ve <b>SIFIRLANACAKTIR.</b><br />
                                (Stok kartları ve kullanıcılar silinmez.)
                            </p>

                            <div className="flex-col gap-4" style={{ alignItems: 'center' }}>
                                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>İşlemi onaylamak için aşağıya <span style={{ color: 'var(--danger)' }}>ONAYLIYORUM</span> yazın:</label>
                                <input
                                    type="text"
                                    id="resetConfirmationInput"
                                    style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--danger)', background: 'black', color: 'white', textAlign: 'center', fontSize: '16px', letterSpacing: '2px', width: '100%', maxWidth: '300px' }}
                                    placeholder="ONAYLIYORUM"
                                />

                                <button
                                    onClick={async () => {
                                        const input = (document.getElementById('resetConfirmationInput') as HTMLInputElement).value;
                                        if (input !== 'ONAYLIYORUM') {
                                            showError('Hata', 'Lütfen onay kutusuna büyük harflerle ONAYLIYORUM yazın.');
                                            return;
                                        }

                                        showConfirm(
                                            'KRİTİK UYARI',
                                            'SON UYARI: Tüm finansal verileriniz silinecek. Bu işlem geri alınamaz. Emin misiniz?',
                                            async () => {
                                                try {
                                                    const res = await fetch('/api/admin/reset-data', {
                                                        method: 'POST',
                                                        body: JSON.stringify({ confirmation: input })
                                                    });
                                                    const data = await res.json();
                                                    if (data.success) {
                                                        showSuccess('SİSTEM SIFIRLANDI', '✅ Tüm veriler başarıyla silindi ve sistem sıfırlandı.');
                                                        setTimeout(() => window.location.reload(), 2000);
                                                    } else {
                                                        showError('Hata', 'İşlem hatası: ' + data.error);
                                                    }
                                                } catch (e) {
                                                    showError('Hata', 'Sunucu ile iletişim kurulamadı.');
                                                }
                                            }
                                        );
                                    }}
                                    className="btn"
                                    style={{ background: 'var(--danger)', color: 'white', fontWeight: 'bold', padding: '15px 30px', width: '100%', maxWidth: '300px', fontSize: '16px' }}
                                >
                                    🔥 VERİLERİ SİL & SIFIRLA
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
