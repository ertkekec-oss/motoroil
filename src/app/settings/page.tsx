
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useModal } from '@/contexts/ModalContext';
import { useApp } from '@/contexts/AppContext';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('branches'); // Default to branches since users is removed
    const [definitionTab, setDefinitionTab] = useState('brands'); // brands, cust_class, supp_class, prod_cat
    const [campaignSubTab, setCampaignSubTab] = useState('loyalty'); // loyalty, referral, coupons
    const { showSuccess, showError, showWarning, showConfirm } = useModal();
    const {
        branches: contextBranches,
        refreshBranches,
        serviceSettings,
        updateServiceSettings,
        brands, setBrands,
        prodCats, setProdCats,
        allBrands, allCats,
        custClasses, setCustClasses,
        suppClasses, setSuppClasses,
        warranties, setWarranties,
        refreshSettings,
        staff: users,
        refreshStaff,
        invoiceSettings, updateInvoiceSettings,
        salesExpenses, updateSalesExpenses,
        campaigns, refreshCampaigns,
        coupons, refreshCoupons,
        referralSettings: contextReferralSettings, updateReferralSettings,
        kasaTypes, setKasaTypes,
        paymentMethods, updatePaymentMethods, kasalar
    } = useApp();

    const [newPaymentMethod, setNewPaymentMethod] = useState({ label: '', type: 'cash', linkedKasaId: '' });

    const [newUser, setNewUser] = useState({ name: '', email: '', role: 'Personel', branch: 'Merkez', username: '', password: '' });

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

    const addUser = async () => {
        if (!newUser.name || !newUser.username) {
            showError('Hata', 'Ad Soyad ve Kullanıcı Adı zorunludur.');
            return;
        }
        const initialPerms = (permissionTemplates as any)[newUser.role] || [];

        try {
            const res = await fetch('/api/staff', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newUser,
                    permissions: initialPerms
                })
            });

            if (res.ok) {
                showSuccess('Başarılı', 'Kullanıcı sisteme eklendi.');
                await refreshStaff();
                setNewUser({ name: '', email: '', role: 'Personel', branch: 'Merkez', username: '', password: '' });
            } else {
                const data = await res.json();
                showError('Hata', data.error || 'Kullanıcı eklenemedi.');
            }
        } catch (e) {
            showError('Hata', 'İşlem sırasında bir hata oluştu.');
        }
    };

    const deleteUser = (id: string | number) => {
        showConfirm('Emin misiniz?', 'Kullanıcıyı silmek istediğinize emin misiniz?', async () => {
            try {
                const res = await fetch(`/api/staff?id=${id}`, { method: 'DELETE' });
                if (res.ok) {
                    showSuccess('Başarılı', 'Kullanıcı silindi.');
                    await refreshStaff();
                } else {
                    showError('Hata', 'Kullanıcı silinemedi.');
                }
            } catch (e) {
                showError('Hata', 'İşlem hatası.');
            }
        });
    };

    // --- 2. FATURA AYARLARI STATE ---

    const [newCampaign, setNewCampaign] = useState<any>({
        name: '',
        type: 'payment_method_discount',
        discountRate: 0,
        pointsRate: 0,
        conditions: { brands: [], categories: [], paymentMethod: '' }
    });
    const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);

    const [newCoupon, setNewCoupon] = useState<any>({
        code: '',
        campaignName: '',
        count: 1,
        type: 'percent',
        value: 10,
        minPurchaseAmount: 0,
        customerCategoryId: '',
        startDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
        conditions: { brands: [], categories: [] },
        usageLimit: 1 // 1: Single, 0: Multi
    });

    const [showCouponModal, setShowCouponModal] = useState(false);
    const [couponSearch, setCouponSearch] = useState('');
    const [couponPage, setCouponPage] = useState(1);
    const couponsPerPage = 10;

    const exportCouponsExcel = () => {
        const data = coupons.map(c => ({
            'KOD': c.code,
            'KAMPANYA': c.campaignName || '-',
            'TİP': c.type === 'amount' ? 'Tutar' : 'Oran',
            'DEĞER': c.value,
            'MİN. TUTAR': c.minPurchaseAmount,
            'LİMİT': c.usageLimit === 0 ? 'Sürekli' : c.usageLimit,
            'KULLANIM': c.usedCount,
            'DURUM': c.isUsed ? 'Kullanıldı' : (c.usageLimit > 0 && c.usedCount >= c.usageLimit ? 'Limit Dolu' : 'Aktif'),
            'SON TARİH': c.expiryDate ? new Date(c.expiryDate).toLocaleDateString('tr-TR') : 'Süresiz'
        }));
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Kuponlar");
        XLSX.writeFile(workbook, `Kupon_Listesi_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const exportCouponsPDF = () => {
        const doc = new jsPDF();
        doc.text("Hediye Çeki Listesi", 14, 15);
        const tableData = coupons.map(c => [
            c.code,
            c.campaignName || '-',
            c.type === 'amount' ? `₺${c.value}` : `%${c.value}`,
            c.usageLimit === 0 ? 'Sürekli' : c.usageLimit,
            c.usedCount,
            c.isUsed ? 'Kullanıldı' : 'Aktif'
        ]);
        autoTable(doc, {
            head: [['Kod', 'Kampanya', 'İndirim', 'Limit', 'Adet', 'Durum']],
            body: tableData,
            startY: 20
        });
        doc.save(`Kupon_Listesi_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const filteredCouponsList = useMemo(() => {
        return (coupons || []).filter(c =>
            (c.code?.toLowerCase() || '').includes(couponSearch.toLowerCase()) ||
            (c.campaignName?.toLowerCase() || '').includes(couponSearch.toLowerCase())
        );
    }, [coupons, couponSearch]);

    const totalCouponPages = Math.ceil(filteredCouponsList.length / couponsPerPage);
    const paginatedCouponsList = filteredCouponsList.slice((couponPage - 1) * couponsPerPage, couponPage * couponsPerPage);

    const [referralSettings, setReferralSettings] = useState(contextReferralSettings);
    useEffect(() => { setReferralSettings(contextReferralSettings); }, [contextReferralSettings]);

    const saveReferralSettings = async () => {
        await updateReferralSettings(referralSettings);
        showSuccess('Başarılı', 'Referans ayarları kaydedildi.');
    };

    const addCampaign = async () => {
        if (!newCampaign.name) return showError('Hata', 'Kampanya adı zorunludur.');
        try {
            const isEditing = !!editingCampaignId;
            const res = await fetch('/api/campaigns', {
                method: isEditing ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(isEditing ? { ...newCampaign, id: editingCampaignId } : newCampaign)
            });
            if (res.ok) {
                showSuccess('Başarılı', isEditing ? 'Kampanya güncellendi.' : 'Kampanya eklendi.');
                refreshCampaigns();
                setNewCampaign({ name: '', type: 'payment_method_discount', discountRate: 0, pointsRate: 0, conditions: { brands: [], categories: [], paymentMethod: '' } });
                setEditingCampaignId(null);
            }
        } catch (e) { showError('Hata', 'Kaydedilemedi.'); }
    };

    const startEditingCampaign = (camp: any) => {
        setNewCampaign({
            name: camp.name,
            type: camp.type,
            discountRate: camp.discountRate,
            pointsRate: camp.pointsRate,
            conditions: camp.conditions || { brands: [], categories: [], paymentMethod: '' }
        });
        setEditingCampaignId(camp.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const deleteCampaign = async (id: string) => {
        showConfirm('Emin misiniz?', 'Kampanyayı silmek istiyor musunuz?', async () => {
            try {
                const res = await fetch(`/api/campaigns?id=${id}`, { method: 'DELETE' });
                if (res.ok) {
                    showSuccess('Başarılı', 'Kampanya silindi.');
                    refreshCampaigns();
                }
            } catch (e) { showError('Hata', 'Silinemedi.'); }
        });
    };

    const addCoupon = async () => {
        try {
            const res = await fetch('/api/coupons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newCoupon)
            });
            const data = await res.json();
            if (res.ok) {
                showSuccess('Başarılı', data.count ? `${data.count} adet kupon üretildi.` : 'Hediye çeki oluşturuldu.');
                refreshCoupons();
                setNewCoupon({
                    code: '',
                    campaignName: '',
                    count: 1,
                    type: 'percent',
                    value: 10,
                    minPurchaseAmount: 0,
                    customerCategoryId: '',
                    startDate: new Date().toISOString().split('T')[0],
                    expiryDate: '',
                    conditions: { brands: [], categories: [] },
                    usageLimit: 1
                });
            } else {
                showError('Hata', data.error || 'İşlem başarısız oldu.');
            }
        } catch (e) {
            console.error('Kupon ekleme hatası:', e);
            showError('Hata', 'Sunucuya bağlanılamadı.');
        }
    };

    const [newKdv, setNewKdv] = useState('');

    const addKdv = () => {
        if (newKdv) {
            updateInvoiceSettings({ ...invoiceSettings, kdvRates: [...invoiceSettings.kdvRates, parseInt(newKdv)] });
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

    // Branch Documents State
    const [branchDocs, setBranchDocs] = useState<any[]>([]);
    const [isDocsLoading, setIsDocsLoading] = useState(false);

    const fetchBranchDocs = async (branchId: number) => {
        setIsDocsLoading(true);
        try {
            const res = await fetch(`/api/branches/documents?branchId=${branchId}`);
            const data = await res.json();
            if (Array.isArray(data)) setBranchDocs(data);
        } catch (e) { console.error('Error fetching docs', e); }
        finally { setIsDocsLoading(false); }
    };

    useEffect(() => {
        if (selectedBranchDocs) {
            fetchBranchDocs(selectedBranchDocs);
        }
    }, [selectedBranchDocs]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, branchId: number) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async () => {
            const base64 = reader.result as string;
            try {
                const res = await fetch('/api/branches/documents', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        branchId,
                        fileName: file.name,
                        fileType: file.type,
                        fileSize: file.size,
                        fileData: base64
                    })
                });
                if (res.ok) {
                    showSuccess('Başarılı', 'Belge arşive eklendi.');
                    fetchBranchDocs(branchId);
                }
            } catch (err) { showError('Hata', 'Dosya yüklenemedi.'); }
        };
        reader.readAsDataURL(file);
    };

    const deleteBranchDoc = async (docId: string, branchId: number) => {
        showConfirm('Belgeyi Sil?', 'Bu belgeyi kalıcı olarak silmek istediğinize emin misiniz?', async () => {
            try {
                const res = await fetch(`/api/branches/documents?id=${docId}`, { method: 'DELETE' });
                if (res.ok) {
                    showSuccess('Silindi', 'Belge kaldırıldı.');
                    fetchBranchDocs(branchId);
                }
            } catch (e) { showError('Hata', 'Silinemedi.'); }
        });
    };

    // --- 5. SATIŞ GİDERLERİ (YENİ) ---
    // SALES EXPENSES (Managed by AppContext)
    const [newCommission, setNewCommission] = useState({ installment: '', rate: 0 });
    const [newOtherCost, setNewOtherCost] = useState({ name: '', cost: 0 });
    const [editingCommissionIdx, setEditingCommissionIdx] = useState<number | null>(null);
    const [editingCommissionData, setEditingCommissionData] = useState({ installment: '', rate: 0 });

    const addCommissionRate = async () => {
        if (!newCommission.installment || newCommission.rate <= 0) return;
        const updated = {
            ...salesExpenses,
            posCommissions: [...(salesExpenses?.posCommissions || []), newCommission]
        };
        await updateSalesExpenses(updated);
        setNewCommission({ installment: '', rate: 0 });
    };

    const removeCommissionRate = async (index: number) => {
        const updatedComms = [...salesExpenses.posCommissions];
        updatedComms.splice(index, 1);
        await updateSalesExpenses({ ...salesExpenses, posCommissions: updatedComms });
    };

    const startEditingCommission = (index: number) => {
        setEditingCommissionIdx(index);
        setEditingCommissionData({ ...salesExpenses.posCommissions[index] });
    };

    const saveEditingCommission = async () => {
        if (editingCommissionIdx === null) return;
        const updatedComms = [...salesExpenses.posCommissions];
        updatedComms[editingCommissionIdx] = editingCommissionData;
        await updateSalesExpenses({ ...salesExpenses, posCommissions: updatedComms });
        setEditingCommissionIdx(null);
    };

    const cancelEditingCommission = () => {
        setEditingCommissionIdx(null);
    };

    const addOtherCost = async () => {
        if (!newOtherCost.name || newOtherCost.cost <= 0) return;
        const updated = {
            ...salesExpenses,
            otherCosts: [...(salesExpenses?.otherCosts || []), newOtherCost]
        };
        await updateSalesExpenses(updated);
        setNewOtherCost({ name: '', cost: 0 });
    };

    const removeOtherCost = async (index: number) => {
        const updatedOther = [...salesExpenses.otherCosts];
        updatedOther.splice(index, 1);
        await updateSalesExpenses({ ...salesExpenses, otherCosts: updatedOther });
    };


    // Data persistence is now handled by AppContext and API routes



    return (
        <div className="container" style={{ padding: '0', height: '100vh', display: 'flex' }}>

            {/* LEFT SIDEBAR MENU */}
            <div style={{ width: '220px', borderRight: '1px solid var(--border-light)', padding: '16px', background: 'var(--bg-card)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <h2 style={{ fontSize: '14px', fontWeight: '900', marginBottom: '16px', paddingLeft: '8px', opacity: 0.5, letterSpacing: '1px', textTransform: 'uppercase' }}>⚙ Ayarlar</h2>

                {[
                    // { id: 'users', label: 'Personel Yönetimi', icon: '👤' }, // REMOVED as requested - duplicate of Team Management
                    { id: 'branches', label: 'Şubeler & Depo', icon: '🏢' },
                    { id: 'profile', label: 'Hesabım', icon: '👤' },
                    { id: 'invoice', label: 'Fatura Ayarları', icon: '🧾' },
                    { id: 'services', label: 'Servis Ücretleri', icon: '🔧' },
                    { id: 'taxes', label: 'KDV & Vergiler', icon: '💰' },
                    { id: 'expenses', label: 'Satış Giderleri', icon: '💳' },
                    { id: 'campaigns', label: 'Kampanya & Puan', icon: '🎁' },
                    { id: 'definitions', label: 'Tanımlar & Liste', icon: '📚' },
                    { id: 'notifications', label: 'Bildirim Ayarları', icon: '🔔' },
                    { id: 'backup', label: 'Bulut Yedekleme', icon: '☁️' },
                    { id: 'logs', label: 'İşlem Günlükleri', icon: '📜' }
                ].map(item => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`btn ${activeTab === item.id ? 'btn-primary' : 'btn-ghost'}`}
                        style={{
                            justifyContent: 'flex-start',
                            padding: '8px 12px',
                            fontSize: '12px',
                            fontWeight: activeTab === item.id ? '800' : '600',
                            borderRadius: '8px',
                            gap: '10px'
                        }}
                    >
                        <span style={{ fontSize: '14px' }}>{item.icon}</span>
                        {item.label}
                    </button>
                ))}

                <div style={{ height: '1px', background: 'var(--border-light)', margin: '12px 0' }}></div>

                <button
                    onClick={() => setActiveTab('reset')}
                    className={`btn ${activeTab === 'reset' ? 'btn-danger' : 'btn-ghost'}`}
                    style={{
                        justifyContent: 'flex-start',
                        color: activeTab === 'reset' ? 'white' : 'var(--danger)',
                        fontSize: '11px',
                        fontWeight: '800',
                        padding: '8px 12px',
                        borderRadius: '8px'
                    }}
                >
                    🚨 SİSTEM SIFIRLAMA
                </button>
            </div>

            {/* RIGHT CONTENT AREA */}
            <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>

                {/* 1. KULLANICILAR - REDESIGNED */}
                {activeTab === 'users' && (
                    <div className="animate-fade-in-up">
                        <div className="flex-between mb-4">
                            <div>
                                <h1 style={{ fontSize: '20px', fontWeight: '900', background: 'var(--gradient-text)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '2px' }}>Personel Yönetimi</h1>
                                <p style={{ fontSize: '11px', opacity: 0.5 }}>Sistem erişim yetkilerini ve personel listesini yönetin</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '18px', fontWeight: '900', color: 'var(--primary)' }}>{users.length}</div>
                                <div style={{ fontSize: '9px', fontWeight: '800', opacity: 0.5, textTransform: 'uppercase' }}>Kayıtlı Personel</div>
                            </div>
                        </div>

                        <div className="grid-cols-12 gap-6">
                            {/* Add User Form - Compact Side Card */}
                            <div className="col-span-12 xl:col-span-4">
                                <div className="card glass" style={{ padding: '20px', border: '1px solid var(--primary-glow)' }}>
                                    <h3 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>+</span>
                                        Yeni Personel Tanımla
                                    </h3>

                                    <div className="flex-col gap-4">
                                        <div className="flex-col gap-1.5">
                                            <label style={{ fontSize: '10px', fontWeight: '800', opacity: 0.6, letterSpacing: '0.5px' }}>AD SOYAD</label>
                                            <input type="text" className="input-field" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} style={{ padding: '10px', fontSize: '12px' }} placeholder="Örn: Ahmet Yılmaz" />
                                        </div>

                                        <div className="grid-cols-2 gap-3">
                                            <div className="flex-col gap-1.5">
                                                <label style={{ fontSize: '10px', fontWeight: '800', opacity: 0.6, letterSpacing: '0.5px' }}>KULLANICI ADI</label>
                                                <input type="text" className="input-field" value={newUser.username} onChange={e => setNewUser({ ...newUser, username: e.target.value })} style={{ padding: '10px', fontSize: '12px' }} placeholder="ayilmaz" />
                                            </div>
                                            <div className="flex-col gap-1.5">
                                                <label style={{ fontSize: '10px', fontWeight: '800', opacity: 0.6, letterSpacing: '0.5px' }}>ŞİFRE</label>
                                                <input type="password" className="input-field" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} style={{ padding: '10px', fontSize: '12px' }} placeholder="****" />
                                            </div>
                                        </div>

                                        <div className="grid-cols-2 gap-3">
                                            <div className="flex-col gap-1.5">
                                                <label style={{ fontSize: '10px', fontWeight: '800', opacity: 0.6, letterSpacing: '0.5px' }}>ŞUBE</label>
                                                <select className="input-field" value={newUser.branch} onChange={e => setNewUser({ ...newUser, branch: e.target.value })} style={{ padding: '10px', fontSize: '12px' }}>
                                                    <option>Merkez</option>
                                                    <option>Kadıköy</option>
                                                    <option>Beşiktaş</option>
                                                    <option>İzmir</option>
                                                    <option>Tümü</option>
                                                </select>
                                            </div>
                                            <div className="flex-col gap-1.5">
                                                <label style={{ fontSize: '10px', fontWeight: '800', opacity: 0.6, letterSpacing: '0.5px' }}>ROL</label>
                                                <select className="input-field" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })} style={{ padding: '10px', fontSize: '12px' }}>
                                                    {Object.keys(permissionTemplates).map(role => <option key={role}>{role}</option>)}
                                                    <option>Personel</option>
                                                </select>
                                            </div>
                                        </div>

                                        <button onClick={addUser} className="btn btn-primary w-full" style={{ height: '42px', marginTop: '4px', fontSize: '12px', fontWeight: '900' }}>
                                            PERSONELİ KAYDET
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Personnel List Table */}
                            <div className="col-span-12 xl:col-span-8">
                                <div className="card glass" style={{ padding: '0', overflow: 'hidden' }}>
                                    <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '12px' }}>
                                        <thead>
                                            <tr style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--text-muted)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}>
                                                <th style={{ padding: '12px 20px' }}>PERSONEL / ERİŞİM</th>
                                                <th>ŞUBE</th>
                                                <th>ROL & YETKİ</th>
                                                <th style={{ textAlign: 'right', paddingRight: '20px' }}>İŞLEM</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.map(u => (
                                                <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }}>
                                                    <td style={{ padding: '12px 20px' }}>
                                                        <div className="flex items-center gap-3">
                                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary) 0%, #E64A00 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: 'white', fontSize: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
                                                                {u.name.substring(0, 1).toUpperCase()}
                                                            </div>
                                                            <div className="flex-col">
                                                                <div style={{ fontWeight: '800', fontSize: '13px', color: 'white' }}>{u.name}</div>
                                                                <div style={{ fontSize: '10px', fontFamily: 'monospace', opacity: 0.5 }}>@{u.username}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div style={{ fontWeight: '700', opacity: 0.8, fontSize: '11px' }}>🏢 {u.branch || 'Merkez'}</div>
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <span style={{
                                                                background: u.role === 'Admin' ? 'rgba(255, 85, 0, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                                                color: u.role === 'Admin' ? 'var(--primary)' : 'var(--success)',
                                                                padding: '3px 8px', borderRadius: '4px', fontSize: '9px', fontWeight: '900'
                                                            }}>
                                                                {u.role.toUpperCase()}
                                                            </span>
                                                            <button
                                                                onClick={() => setEditingUserPerms(u)}
                                                                className="btn btn-ghost"
                                                                style={{ padding: '3px 6px', fontSize: '9px', border: '1px solid var(--border-light)', borderRadius: '4px', opacity: 0.8 }}
                                                            >
                                                                🛡️ {(u.permissions || []).includes('*') ? 'Tam' : `${(u.permissions || []).length} Yetki`}
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                                                        {u.role !== 'System Admin' && (
                                                            <button
                                                                onClick={() => deleteUser(u.id)}
                                                                className="btn btn-ghost"
                                                                style={{ color: 'var(--danger)', fontSize: '16px', padding: '6px' }}
                                                                title="Personeli Sistemden Sil"
                                                            >🗑️</button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                            {users.length === 0 && (
                                                <tr><td colSpan={4} style={{ padding: '60px', textAlign: 'center', opacity: 0.3 }}>Henüz kayıtlı personel bulunmuyor.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
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
                                                        onClick={async () => {
                                                            const newPerms = (permissionTemplates as any)[role];
                                                            setEditingUserPerms({ ...editingUserPerms, role, permissions: newPerms });
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
                                                            onChange={val => {
                                                                let newPerms = [...(editingUserPerms.permissions || [])];
                                                                if (val.target.checked) newPerms.push(perm.id);
                                                                else newPerms = newPerms.filter(p => p !== perm.id);
                                                                setEditingUserPerms({ ...editingUserPerms, permissions: newPerms });
                                                            }}
                                                        />
                                                        <span style={{ fontSize: '14px' }}>{perm.label}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>

                                        <button
                                            onClick={async () => {
                                                try {
                                                    const res = await fetch('/api/staff', {
                                                        method: 'PUT',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({
                                                            id: editingUserPerms.id,
                                                            role: editingUserPerms.role,
                                                            permissions: editingUserPerms.permissions
                                                        })
                                                    });
                                                    if (res.ok) {
                                                        showSuccess('Başarılı', 'Yetkiler güncellendi.');
                                                        await refreshStaff();
                                                        setEditingUserPerms(null);
                                                    } else {
                                                        showError('Hata', 'Yetkiler kaydedilemedi.');
                                                    }
                                                } catch (e) {
                                                    showError('Hata', 'Sunucu hatası.');
                                                }
                                            }}
                                            className="btn btn-primary w-full"
                                            style={{ padding: '15px', fontWeight: 'bold' }}
                                        >
                                            DEĞİŞİKLİKLERİ KAYDET
                                        </button>
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
                                                <div>
                                                    <input
                                                        type="file"
                                                        id={`file-upload-${branch.id}`}
                                                        style={{ display: 'none' }}
                                                        onChange={(e) => handleFileUpload(e, branch.id)}
                                                    />
                                                    <label htmlFor={`file-upload-${branch.id}`} className="btn btn-outline" style={{ borderStyle: 'dashed', fontSize: '12px', cursor: 'pointer' }}>
                                                        ⬆ Yeni Belge Yükle
                                                    </label>
                                                </div>
                                            </div>
                                            {isDocsLoading ? (
                                                <div style={{ textAlign: 'center', padding: '20px', opacity: 0.5 }}>Yükleniyor...</div>
                                            ) : (
                                                <div className="grid-cols-2 gap-4">
                                                    {branchDocs.length === 0 && <div className="col-span-2 text-center text-muted" style={{ opacity: 0.5 }}>Belge bulunmamaktadır.</div>}
                                                    {branchDocs.map((file, idx) => (
                                                        <div key={file.id} className="flex-between" style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                            <div className="flex-center gap-3">
                                                                <div style={{ fontSize: '24px', opacity: 0.8 }}>{file.fileType.includes('pdf') ? '📄' : '🖼️'}</div>
                                                                <div>
                                                                    <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{file.fileName}</div>
                                                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{new Date(file.uploadedAt).toLocaleDateString('tr-TR')} • {(file.fileSize / 1024).toFixed(1)} KB</div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <button onClick={() => deleteBranchDoc(file.id, branch.id)} className="btn btn-ghost" style={{ padding: '6px', fontSize: '11px', color: 'var(--danger)', opacity: 0.7 }}>🗑️</button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 3. MASRAF & KOMİSYON AYARLARI */}
                {activeTab === 'expenses' && (
                    <div style={{ maxWidth: '800px' }}>
                        <h2 style={{ marginBottom: '20px' }}>Masraf & Komisyon Yönetimi</h2>

                        {/* POS KOMİSYONLARI */}
                        <div className="card glass mb-8">
                            <div className="flex-between mb-4">
                                <div>
                                    <h3>POS / Banka Komisyon Oranları</h3>
                                    <p className="text-muted" style={{ fontSize: '12px' }}>Kredi kartı satışlarında otomatik gider kaydı olarak düşülecek komisyon oranları.</p>
                                </div>
                                <button className="btn btn-primary" onClick={() => {
                                    const currentComms = salesExpenses?.posCommissions || [];
                                    updateSalesExpenses({ ...salesExpenses, posCommissions: [...currentComms, { installment: 'Tek Çekim', rate: 0 }] });
                                }}>+ Yeni Oran Ekle</button>
                            </div>

                            <div className="flex-col gap-3">
                                {(!salesExpenses?.posCommissions || salesExpenses.posCommissions.length === 0) && (
                                    <div className="text-muted text-center p-4 bg-white/5 rounded">Henüz oran tanımlanmamış.</div>
                                )}
                                {salesExpenses?.posCommissions?.map((comm: any, idx: number) => (
                                    <div key={idx} className="flex-between" style={{ padding: '12px', background: 'var(--bg-deep)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                                        <div className="flex gap-4 items-center flex-1">
                                            <div className="flex-col gap-1 flex-1">
                                                <label className="text-muted" style={{ fontSize: '10px', fontWeight: 'bold' }}>TAKSİT / TÜR</label>
                                                <input
                                                    type="text"
                                                    value={comm.installment}
                                                    onChange={(e) => {
                                                        const newComms = [...salesExpenses.posCommissions];
                                                        newComms[idx].installment = e.target.value;
                                                        updateSalesExpenses({ ...salesExpenses, posCommissions: newComms });
                                                    }}
                                                    placeholder="Örn: Tek Çekim"
                                                    style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border-light)', color: 'white', padding: '4px' }}
                                                />
                                            </div>
                                            <div className="flex-col gap-1" style={{ width: '120px' }}>
                                                <label className="text-muted" style={{ fontSize: '10px', fontWeight: 'bold' }}>ORAN (%)</label>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        value={comm.rate}
                                                        onChange={(e) => {
                                                            const newComms = [...salesExpenses.posCommissions];
                                                            newComms[idx].rate = Number(e.target.value);
                                                            updateSalesExpenses({ ...salesExpenses, posCommissions: newComms });
                                                        }}
                                                        style={{ width: '100%', background: 'transparent', border: '1px solid var(--border-light)', borderRadius: '4px', color: 'white', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}
                                                    />
                                                    <span>%</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button onClick={() => {
                                            const newComms = salesExpenses.posCommissions.filter((_: any, i: number) => i !== idx);
                                            updateSalesExpenses({ ...salesExpenses, posCommissions: newComms });
                                        }} className="btn btn-ghost text-danger ml-4">🗑️</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. FATURA AYARLARI */}
                {/* PROFILE TAB */}
                {activeTab === 'profile' && (
                    <div className="animate-fade-in-up" style={{ maxWidth: '600px' }}>
                        <h1 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '4px' }}>Profilim</h1>
                        <p style={{ fontSize: '12px', opacity: 0.5, marginBottom: '24px' }}>Hesap bilgilerinizi ve profil ayarlarınızı görüntüleyin</p>

                        <div className="card glass" style={{ padding: '32px' }}>
                            <div className="flex items-center gap-6 mb-8">
                                <div style={{
                                    width: '80px', height: '80px', borderRadius: '24px',
                                    background: 'linear-gradient(135deg, var(--primary) 0%, #E64A00 100%)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '32px', fontWeight: '900', color: 'white',
                                    boxShadow: '0 10px 30px rgba(255, 85, 0, 0.3)'
                                }}>
                                    {users.find((u: any) => u.name === (currentUser?.name || ''))?.name?.substring(0, 1).toUpperCase() || 'A'}
                                </div>
                                <div>
                                    <h2 style={{ fontSize: '20px', fontWeight: '900' }}>{currentUser?.name || 'Yönetici'}</h2>
                                    <div style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: '700' }}>{currentUser?.role || 'Sistem Yöneticisi'}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="flex-col gap-1.5">
                                    <label style={{ fontSize: '10px', fontWeight: '900', opacity: 0.5 }}>E-POSTA</label>
                                    <input type="text" readOnly value={currentUser?.email || '-'} className="input-field" style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.05)', opacity: 0.7 }} />
                                </div>
                                <div className="flex-col gap-1.5">
                                    <label style={{ fontSize: '10px', fontWeight: '900', opacity: 0.5 }}>ŞUBE</label>
                                    <input type="text" readOnly value={currentUser?.branch || 'Merkez'} className="input-field" style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.05)', opacity: 0.7 }} />
                                </div>
                            </div>

                            <p style={{ fontSize: '11px', opacity: 0.4, marginTop: '32px', textAlign: 'center', borderTop: '1px solid var(--border-light)', paddingTop: '20px' }}>
                                Şifre değişikliği ve profil güncelleme için sistem yöneticisine başvurun.
                            </p>
                        </div>
                    </div>
                )}

                {activeTab === 'invoice' && (
                    <div style={{ maxWidth: '600px' }} className="animate-fade-in-up">
                        <h2 style={{ fontSize: '18px', fontWeight: '900', marginBottom: '16px' }}>Fatura Konfigürasyonu</h2>

                        <div className="card glass flex-col gap-4" style={{ padding: '20px' }}>
                            <div className="flex-col gap-1">
                                <label style={{ fontSize: '10px', fontWeight: '900', opacity: 0.5 }}>FATURA NOTU (VARSAYILAN)</label>
                                <textarea
                                    rows={2}
                                    value={invoiceSettings.defaultNote}
                                    onChange={(e) => updateInvoiceSettings({ ...invoiceSettings, defaultNote: e.target.value })}
                                    style={{ background: 'var(--bg-deep)', border: '1px solid var(--border-light)', padding: '10px', borderRadius: '8px', color: 'white', fontSize: '12px' }}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex-col gap-1">
                                    <label style={{ fontSize: '10px', fontWeight: '900', opacity: 0.5 }}>SERİ ÖN EKİ</label>
                                    <input type="text" value={invoiceSettings.prefix} onChange={e => updateInvoiceSettings({ ...invoiceSettings, prefix: e.target.value })} style={{ padding: '8px 12px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-light)', color: 'var(--text-main)', fontSize: '12px' }} />
                                </div>
                                <div className="flex-col gap-1">
                                    <label style={{ fontSize: '10px', fontWeight: '900', opacity: 0.5 }}>SIRADAKİ NO</label>
                                    <input type="number" value={invoiceSettings.nextNumber} readOnly style={{ padding: '8px 12px', borderRadius: '6px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', color: 'var(--text-muted)', fontSize: '12px', cursor: 'not-allowed' }} />
                                </div>
                            </div>

                            <button className="btn btn-primary" style={{ marginTop: '10px', fontSize: '12px', fontWeight: '900', padding: '10px' }}>AYARLARI KAYDET</button>
                        </div>
                    </div>
                )}

                {/* 3.1. SERVİS AYARLARI */}
                {activeTab === 'services' && (
                    <div style={{ maxWidth: '500px' }} className="animate-fade-in-up">
                        <h2 style={{ fontSize: '18px', fontWeight: '900', marginBottom: '16px' }}>Servis Ücretleri</h2>
                        <div className="card glass" style={{ padding: '20px' }}>
                            <div className="flex-col gap-3">
                                {[
                                    { icon: '🏍️', label: 'Motosiklet Bakım', price: localServiceSettings.motoMaintenancePrice, field: 'motoMaintenancePrice' },
                                    { icon: '🚲', label: 'Bisiklet Bakım', price: localServiceSettings.bikeMaintenancePrice, field: 'bikeMaintenancePrice' }
                                ].map(s => (
                                    <div key={s.field} className="flex-between" style={{ padding: '12px 16px', background: 'var(--bg-deep)', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
                                        <div>
                                            <div style={{ fontWeight: '800', fontSize: '13px' }}>{s.icon} {s.label}</div>
                                            <div style={{ fontSize: '10px', opacity: 0.4 }}>Otomatik gelen işçilik bedeli</div>
                                        </div>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                type="number"
                                                value={s.price}
                                                onChange={(e) => setLocalServiceSettings({ ...localServiceSettings, [s.field]: Number(e.target.value) })}
                                                style={{ width: '90px', padding: '8px 25px 8px 8px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--primary)', color: 'white', fontWeight: '900', textAlign: 'right', fontSize: '13px' }}
                                            />
                                            <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', fontWeight: '900', fontSize: '11px', color: 'var(--primary)' }}>₺</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={handleSaveServiceSettings}
                                className="btn btn-primary w-full mt-4"
                                style={{ height: '38px', fontWeight: '900', fontSize: '12px' }}
                            >
                                💾 AYARLARI KAYDET
                            </button>
                        </div>
                    </div>
                )}

                {/* 3.1. KDV & VERGİLER */}
                {activeTab === 'taxes' && (
                    <div style={{ maxWidth: '500px' }} className="animate-fade-in-up">
                        <h2 style={{ fontSize: '18px', fontWeight: '900', marginBottom: '16px' }}>Vergi Oranları</h2>

                        <div className="card glass" style={{ padding: '20px' }}>
                            <div className="flex-col gap-2">
                                {invoiceSettings.kdvRates.map((rate, idx) => (
                                    <div key={rate} className="flex-between" style={{ padding: '10px 16px', background: 'var(--bg-deep)', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
                                        <div className="flex-center gap-3">
                                            <span style={{ fontSize: '14px', fontWeight: '900', color: 'var(--primary)' }}>%{rate}</span>
                                            <span style={{ fontSize: '10px', opacity: 0.5, fontWeight: '700' }}>KDV ORANI</span>
                                        </div>
                                        <button
                                            onClick={() => {
                                                const newRates = invoiceSettings.kdvRates.filter((_, i) => i !== idx);
                                                updateInvoiceSettings({ ...invoiceSettings, kdvRates: newRates });
                                            }}
                                            style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: 'var(--danger)', padding: '6px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}
                                        >Sil</button>
                                    </div>
                                ))}
                            </div>

                            <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '10px', border: '1px dashed var(--success)' }}>
                                <div className="flex-center gap-2">
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            value={newKdv}
                                            onChange={e => setNewKdv(e.target.value)}
                                            style={{ width: '80px', padding: '8px 20px 8px 10px', borderRadius: '6px', border: '1px solid var(--border-light)', background: 'var(--bg-card)', color: 'white', fontSize: '13px', fontWeight: '900', textAlign: 'center' }}
                                        />
                                        <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', fontWeight: '900', fontSize: '11px', opacity: 0.5 }}>%</span>
                                    </div>
                                    <button onClick={addKdv} className="btn btn-success" style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: '900' }}>+ ORAN EKLE</button>
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
                                        onChange={e => updateSalesExpenses({ ...salesExpenses, eInvoiceCost: parseFloat(e.target.value) || 0 })}
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
                                        onChange={e => updateSalesExpenses({ ...salesExpenses, printingCost: parseFloat(e.target.value) || 0 })}
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

                {/* 4. TANIMLAR */}
                {activeTab === 'definitions' && (
                    <div className="animate-fade-in-up">
                        <div className="flex-between mb-4">
                            <h2 style={{ fontSize: '18px', fontWeight: '900' }}>Sistem Tanımları</h2>
                            <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-card)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
                                {[
                                    { id: 'brands', label: 'Marka', icon: '🏷️' },
                                    { id: 'prod_cat', label: 'Kat.', icon: '📂' },
                                    { id: 'cust_class', label: 'Cari', icon: '👥' },
                                    { id: 'warranties', label: 'Garanti', icon: '🛡️' },
                                    { id: 'kasa_types', label: 'Ödeme', icon: '💳' }
                                ].map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => setDefinitionTab(t.id)}
                                        style={{
                                            padding: '6px 12px',
                                            borderRadius: '8px',
                                            fontSize: '11px',
                                            fontWeight: '800',
                                            border: 'none',
                                            cursor: 'pointer',
                                            background: definitionTab === t.id ? 'var(--primary)' : 'transparent',
                                            color: definitionTab === t.id ? 'white' : 'var(--text-muted)'
                                        }}
                                    >
                                        {t.icon} {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {definitionTab === 'kasa_types' ? (
                            <div className="card glass" style={{ padding: '0', overflow: 'hidden' }}>
                                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-light)', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '10px', alignItems: 'end' }}>
                                    <div className="flex-col gap-1">
                                        <label style={{ fontSize: '9px', fontWeight: '900', opacity: 0.5 }}>BUTON ADI</label>
                                        <input value={newPaymentMethod.label} onChange={e => setNewPaymentMethod({ ...newPaymentMethod, label: e.target.value })} style={{ padding: '8px 12px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-light)', color: 'white', fontSize: '12px' }} placeholder="Nakit, Bonus..." />
                                    </div>
                                    <div className="flex-col gap-1">
                                        <label style={{ fontSize: '9px', fontWeight: '900', opacity: 0.5 }}>İŞLEM TİPİ</label>
                                        <select value={newPaymentMethod.type} onChange={e => setNewPaymentMethod({ ...newPaymentMethod, type: e.target.value })} style={{ padding: '8px 12px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-light)', color: 'white', fontSize: '12px' }}>
                                            <option value="cash">Nakit (Kasa)</option>
                                            <option value="card">Kredi Kartı / POS</option>
                                            <option value="transfer">Havale / EFT</option>
                                        </select>
                                    </div>
                                    <div className="flex-col gap-1">
                                        <label style={{ fontSize: '9px', fontWeight: '900', opacity: 0.5 }}>HESAP</label>
                                        <select value={newPaymentMethod.linkedKasaId} onChange={e => setNewPaymentMethod({ ...newPaymentMethod, linkedKasaId: e.target.value })} style={{ padding: '8px 12px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-light)', color: 'white', fontSize: '12px' }}>
                                            <option value="">Seçiniz...</option>
                                            {kasalar.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
                                        </select>
                                    </div>
                                    <button onClick={() => { /* ... (Same logic as before) ... */ }} className="btn btn-primary" style={{ height: '32px', fontSize: '11px', fontWeight: '900' }}>+ EKLE</button>
                                </div>
                                <table style={{ width: '100%', textAlign: 'left', fontSize: '12px' }}>
                                    <thead>
                                        <tr style={{ opacity: 0.4, fontSize: '10px', padding: '10px' }}>
                                            <th style={{ padding: '12px 16px' }}>BUTON ADI</th>
                                            <th>BAĞLI HESAP</th>
                                            <th style={{ textAlign: 'right', paddingRight: '16px' }}>İŞLEM</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paymentMethods.map(pm => (
                                            <tr key={pm.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                                <td style={{ padding: '12px 16px', fontWeight: '700' }}>{pm.icon} {pm.label}</td>
                                                <td style={{ opacity: 0.6 }}>{kasalar.find(k => k.id === pm.linkedKasaId)?.name || 'Eşleşmemiş'}</td>
                                                <td style={{ textAlign: 'right', paddingRight: '16px' }}><button className="text-danger" style={{ background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer' }}>×</button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="card glass" style={{ maxWidth: '400px', padding: '20px' }}>
                                <div className="flex-col gap-1 mb-4">
                                    <label style={{ fontSize: '10px', fontWeight: '900', opacity: 0.5 }}>YENİ KAYIT EKLE (ENTER)</label>
                                    <input
                                        type="text"
                                        placeholder="Yazıp Enter'a basın..."
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
                                        style={{ padding: '10px 14px', background: 'var(--bg-deep)', border: '1px solid var(--border-light)', borderRadius: '10px', color: 'white', width: '100%', fontSize: '13px' }}
                                    />
                                </div>
                                <div className="flex-col gap-2" style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '5px' }}>
                                    {(
                                        definitionTab === 'brands' ? brands :
                                            definitionTab === 'prod_cat' ? prodCats :
                                                definitionTab === 'cust_class' ? custClasses :
                                                    definitionTab === 'supp_class' ? suppClasses : warranties
                                    ).map((item, i) => (
                                        <div key={i} className="flex-between" style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.02)' }}>
                                            <span style={{ fontSize: '12px', fontWeight: '600' }}>{item}</span>
                                            <button style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '14px' }}>🗑️</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* 5. BACKUP & CLOUD */}
                {activeTab === 'backup' && (
                    <div style={{ maxWidth: '600px' }} className="animate-fade-in-up">
                        <h2 style={{ fontSize: '18px', fontWeight: '900', marginBottom: '16px' }}>Güvenlik & Bulut</h2>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="card glass" style={{ borderLeft: '3px solid var(--success)', padding: '16px' }}>
                                <div style={{ fontSize: '10px', fontWeight: '900', opacity: 0.5 }}>BULUT DURUMU</div>
                                <div style={{ fontSize: '15px', fontWeight: '900', color: 'var(--success)', marginTop: '4px' }}>✓ Senkronize</div>
                            </div>
                            <div className="card glass" style={{ padding: '16px' }}>
                                <div style={{ fontSize: '10px', fontWeight: '900', opacity: 0.5 }}>DEPOLAMA</div>
                                <div style={{ fontSize: '15px', fontWeight: '900', marginTop: '4px' }}>1.2 GB / 10 GB</div>
                            </div>
                        </div>

                        <div className="card glass flex-col gap-4" style={{ padding: '20px' }}>
                            <div className="flex-between" style={{ background: 'rgba(59, 130, 246, 0.05)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '900', color: 'var(--primary)', fontSize: '13px' }}>🛡️ Geri Yükleme Noktası</div>
                                    <p style={{ fontSize: '10px', opacity: 0.5, marginTop: '2px' }}>Kritik işlemlerden önce Snapshot alın.</p>
                                </div>
                                <button onClick={() => { /* ... */ }} className="btn btn-primary" style={{ fontSize: '11px', fontWeight: '900', padding: '10px 15px' }}>SNAPSHOT AL</button>
                            </div>

                            <div className="flex-between" style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                <div>
                                    <div style={{ fontWeight: '800', fontSize: '13px' }}>Manuel SQL Yedekleme</div>
                                    <p style={{ fontSize: '10px', opacity: 0.5 }}>Veritabanını JSON olarak indir.</p>
                                </div>
                                <button onClick={() => { /* ... */ }} className="btn btn-ghost" style={{ fontSize: '12px', border: '1px solid var(--border-light)' }}>⬇ İNDİR</button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'notifications' && (
                    <div style={{ maxWidth: '500px' }} className="animate-fade-in-up">
                        <h2 style={{ fontSize: '18px', fontWeight: '900', marginBottom: '16px' }}>Bildirim Tercihleri</h2>

                        <div className="card glass flex-col gap-4" style={{ padding: '20px' }}>
                            <div className="flex-col gap-3">
                                {[
                                    { id: 'notif_on_delete', label: 'Kritik Silme İşlemleri', desc: 'Bir kayıt silindiğinde Admin e-postası' },
                                    { id: 'notif_on_approval', label: 'Yeni Ürün Onay Talebi', desc: 'Personel ürün eklediğinde onay gereksinimi' }
                                ].map(notif => (
                                    <label key={notif.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px' }}>
                                        <input
                                            type="checkbox"
                                            checked={(notifSettings as any)[notif.id]}
                                            onChange={e => setNotifSettings({ ...notifSettings, [notif.id]: e.target.checked })}
                                            style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                                        />
                                        <div>
                                            <div style={{ fontWeight: '800', fontSize: '12px' }}>{notif.label}</div>
                                            <div style={{ fontSize: '10px', opacity: 0.5 }}>{notif.desc}</div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                            <button className="btn btn-primary" style={{ height: '38px', fontSize: '11px', fontWeight: '900', marginTop: '4px' }} onClick={saveNotifSettings}>DEĞİŞİKLİKLERİ KAYDET</button>
                        </div>
                    </div>
                )}

                {/* 7. ACTIVITY LOGS */}
                {activeTab === 'logs' && (
                    <div className="animate-fade-in-up">
                        <div className="flex-between mb-4">
                            <div>
                                <h2 style={{ fontSize: '18px', fontWeight: '900' }}>İşlem Günlükleri</h2>
                                <p style={{ fontSize: '11px', opacity: 0.5 }}>Sistemdeki son değişiklikler</p>
                            </div>
                            <button className="btn btn-outline" style={{ height: '32px', fontSize: '11px', fontWeight: '800' }} onClick={fetchLogs} disabled={isLogsLoading}>
                                {isLogsLoading ? '...' : '🔄 YENİLE'}
                            </button>
                        </div>

                        <div className="card glass" style={{ padding: '0', overflow: 'hidden' }}>
                            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '12px' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(255,255,255,0.02)', fontWeight: '900', fontSize: '10px', opacity: 0.4 }}>
                                        <th style={{ padding: '12px 16px' }}>TARİH / KULLANICI</th>
                                        <th>İŞLEM</th>
                                        <th>NESNE</th>
                                        <th style={{ paddingRight: '16px' }}>DETAY</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.length === 0 ? (
                                        <tr><td colSpan={4} style={{ padding: '30px', textAlign: 'center', opacity: 0.3 }}>Kayıt bulunamadı.</td></tr>
                                    ) : (
                                        logs.map(log => (
                                            <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                                <td style={{ padding: '10px 16px' }}>
                                                    <div style={{ fontSize: '10px', opacity: 0.5 }}>{new Date(log.createdAt).toLocaleString('tr-TR')}</div>
                                                    <div style={{ fontWeight: '700' }}>{log.userName || 'Sistem'}</div>
                                                </td>
                                                <td>
                                                    <span style={{
                                                        padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: '900',
                                                        background: log.action?.includes('DELETE') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                                                        color: log.action?.includes('DELETE') ? 'var(--danger)' : 'var(--primary)',
                                                        textTransform: 'uppercase'
                                                    }}>
                                                        {log.action}
                                                    </span>
                                                </td>
                                                <td style={{ opacity: 0.7 }}>{log.entity}</td>
                                                <td style={{ paddingRight: '16px', opacity: 0.7, fontSize: '11px' }}>{log.details}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                {/* 10. KAMPANYALAR & PUAN - REDESIGNED */}
                {activeTab === 'campaigns' && (
                    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ padding: '10px 0' }}>
                            <h1 style={{ fontSize: '24px', fontWeight: '900', background: 'var(--gradient-text)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '4px' }}>🎁 Sadakat & Kampanya Merkezi</h1>
                            <p className="text-muted" style={{ fontSize: '13px' }}>Müşteri sadakatini artıracak indirim, puan ve hediye çeki kurgularını yönetin.</p>
                        </div>

                        {/* SUB-TABS NAVIGATION */}
                        <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-card)', padding: '6px', borderRadius: '14px', border: '1px solid var(--border-light)', width: 'fit-content' }}>
                            {[
                                { id: 'loyalty', label: 'Ana Kampanyalar', icon: '✨' },
                                { id: 'referral', label: 'Referans Sistemi', icon: '🔗' },
                                { id: 'coupons', label: 'Hediye Çekleri', icon: '🎫' }
                            ].map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setCampaignSubTab(t.id)}
                                    style={{
                                        padding: '10px 20px',
                                        borderRadius: '10px',
                                        fontSize: '13px',
                                        fontWeight: '700',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        background: campaignSubTab === t.id ? 'var(--primary)' : 'transparent',
                                        color: campaignSubTab === t.id ? 'white' : 'var(--text-muted)',
                                        boxShadow: campaignSubTab === t.id ? '0 4px 12px var(--primary-glow)' : 'none'
                                    }}
                                >
                                    <span>{t.icon}</span> {t.label}
                                </button>
                            ))}
                        </div>

                        {/* 10.1 ANA KAMPANYALAR (LOYALTY & DISCOUNTS) */}
                        {campaignSubTab === 'loyalty' && (
                            <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div className="grid-cols-12 gap-6">
                                    {/* Create/Edit Form */}
                                    <div className="col-span-12 xl:col-span-5">
                                        <div className="card glass" style={{ border: '1px solid var(--primary-glow)' }}>
                                            <h3 className="mb-4" style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>+</div>
                                                {editingCampaignId ? 'Kampanyayı Düzenle' : 'Yeni Kampanya Tanımla'}
                                            </h3>
                                            <div className="flex-col gap-4">
                                                <div className="flex-col gap-2">
                                                    <label style={{ fontSize: '11px', fontWeight: '800', opacity: 0.6 }}>KAMPANYA ADI</label>
                                                    <input type="text" value={newCampaign.name} onChange={e => setNewCampaign({ ...newCampaign, name: e.target.value })} placeholder="Örn: Hafta Sonu Nakit İndirimi" style={{ padding: '12px', background: 'var(--bg-deep)', border: '1px solid var(--border-light)', borderRadius: '10px', color: 'white', fontSize: '14px' }} />
                                                </div>

                                                <div className="grid-cols-2 gap-4">
                                                    <div className="flex-col gap-2">
                                                        <label style={{ fontSize: '11px', fontWeight: '800', opacity: 0.6 }}>KAMPANYA TİPİ</label>
                                                        <select value={newCampaign.type} onChange={e => setNewCampaign({ ...newCampaign, type: e.target.value })} style={{ padding: '12px', background: 'var(--bg-deep)', border: '1px solid var(--border-light)', borderRadius: '10px', color: 'white' }}>
                                                            <option value="payment_method_discount">💳 Ödeme İndirimi</option>
                                                            <option value="loyalty_points">💰 Sadakat Puanı</option>
                                                        </select>
                                                    </div>
                                                    <div className="flex-col gap-2">
                                                        <label style={{ fontSize: '11px', fontWeight: '800', opacity: 0.6 }}>
                                                            {newCampaign.type === 'payment_method_discount' ? 'İNDİRİM (%)' : 'KAZANIM (%)'}
                                                        </label>
                                                        <input type="number"
                                                            value={(newCampaign.type === 'payment_method_discount' ? (newCampaign.discountRate || 0) : (newCampaign.pointsRate || 0)) * 100}
                                                            onChange={e => {
                                                                const val = parseFloat(e.target.value) / 100;
                                                                if (newCampaign.type === 'payment_method_discount') setNewCampaign({ ...newCampaign, discountRate: val });
                                                                else setNewCampaign({ ...newCampaign, pointsRate: val });
                                                            }}
                                                            style={{ padding: '12px', background: 'var(--bg-deep)', border: '1px solid var(--border-light)', borderRadius: '10px', color: 'white' }} />
                                                    </div>
                                                </div>

                                                <div className="flex-col gap-2">
                                                    <label style={{ fontSize: '11px', fontWeight: '800', opacity: 0.6 }}>GEÇERLİ OLDUĞU MARKALAR (Boşsa Tümü)</label>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '10px', background: 'var(--bg-deep)', borderRadius: '10px', border: '1px solid var(--border-light)', minHeight: '60px' }}>
                                                        {allBrands.map(b => (
                                                            <button
                                                                key={b}
                                                                onClick={() => {
                                                                    const current = newCampaign.conditions.brands || [];
                                                                    const next = current.includes(b) ? current.filter((x: string) => x !== b) : [...current, b];
                                                                    setNewCampaign({ ...newCampaign, conditions: { ...newCampaign.conditions, brands: next } });
                                                                }}
                                                                style={{
                                                                    padding: '4px 10px',
                                                                    borderRadius: '6px',
                                                                    fontSize: '11px',
                                                                    fontWeight: '700',
                                                                    background: newCampaign.conditions.brands?.includes(b) ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                                                    border: 'none',
                                                                    color: 'white',
                                                                    cursor: 'pointer'
                                                                }}
                                                            >{b}</button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="flex-col gap-2">
                                                    <label style={{ fontSize: '11px', fontWeight: '800', opacity: 0.6 }}>GEÇERLİ OLDUĞU KATEGORİLER (Boşsa Tümü)</label>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '10px', background: 'var(--bg-deep)', borderRadius: '10px', border: '1px solid var(--border-light)', minHeight: '60px' }}>
                                                        {allCats.map(c => (
                                                            <button
                                                                key={c}
                                                                onClick={() => {
                                                                    const current = newCampaign.conditions.categories || [];
                                                                    const next = current.includes(c) ? current.filter((x: string) => x !== c) : [...current, c];
                                                                    setNewCampaign({ ...newCampaign, conditions: { ...newCampaign.conditions, categories: next } });
                                                                }}
                                                                style={{
                                                                    padding: '4px 10px',
                                                                    borderRadius: '6px',
                                                                    fontSize: '11px',
                                                                    fontWeight: '700',
                                                                    background: newCampaign.conditions.categories?.includes(c) ? 'var(--secondary)' : 'rgba(255,255,255,0.05)',
                                                                    border: 'none',
                                                                    color: 'white',
                                                                    cursor: 'pointer'
                                                                }}
                                                            >{c}</button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {newCampaign.type === 'payment_method_discount' && (
                                                    <div className="flex-col gap-2">
                                                        <label style={{ fontSize: '11px', fontWeight: '800', opacity: 0.6 }}>ÖDEME YÖNTEMİ SEÇİMİ</label>
                                                        <select style={{ padding: '12px', background: 'var(--bg-deep)', border: '1px solid var(--border-light)', borderRadius: '10px', color: 'white' }}
                                                            value={newCampaign.conditions.paymentMethod || ''}
                                                            onChange={e => setNewCampaign({ ...newCampaign, conditions: { ...newCampaign.conditions, paymentMethod: e.target.value } })}>
                                                            <option value="">Tüm Yöntemler</option>
                                                            <option value="cash">💵 Nakit</option>
                                                            <option value="card_single">💳 Kredi Kartı</option>
                                                            <option value="transfer">🏦 Havale / EFT</option>
                                                        </select>
                                                    </div>
                                                )}

                                                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                                    <button onClick={addCampaign} className="btn-primary" style={{ flex: 1, height: '48px', borderRadius: '12px', fontWeight: '900' }}>
                                                        {editingCampaignId ? 'KAMPANYAYI GÜNCELLE' : 'KAMPANYAYI OLUŞTUR'}
                                                    </button>
                                                    {editingCampaignId && (
                                                        <button onClick={() => {
                                                            setEditingCampaignId(null);
                                                            setNewCampaign({ name: '', type: 'payment_method_discount', discountRate: 0, pointsRate: 0, conditions: { brands: [], categories: [], paymentMethod: '' } });
                                                        }} className="btn-ghost" style={{ padding: '0 20px', borderRadius: '12px' }}>Vazgeç</button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* List View */}
                                    <div className="col-span-12 xl:col-span-7">
                                        <div className="card">
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                                <h3 style={{ fontSize: '16px' }}>Yayındaki Kampanyalar</h3>
                                                <span style={{ fontSize: '11px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', padding: '4px 12px', borderRadius: '20px', fontWeight: '800' }}>{campaigns.length} Aktif</span>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                {campaigns.map(camp => (
                                                    <div key={camp.id} style={{ background: 'var(--bg-deep)', padding: '16px', borderRadius: '14px', border: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: camp.type === 'loyalty_points' ? 'rgba(0, 240, 255, 0.1)' : 'rgba(255, 85, 0, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                                                                {camp.type === 'loyalty_points' ? '💎' : '🏷️'}
                                                            </div>
                                                            <div>
                                                                <div style={{ fontWeight: '800', fontSize: '14px', marginBottom: '2px' }}>{camp.name}</div>
                                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', gap: '8px' }}>
                                                                    <span>{camp.type === 'loyalty_points' ? 'Sadakat Puanı' : 'Ödeme İndirimi'}</span>
                                                                    {camp.conditions.brands?.length > 0 && <span>• {camp.conditions.brands.length} Marka</span>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                                            <div style={{ textAlign: 'right' }}>
                                                                <div style={{ fontSize: '18px', fontWeight: '900', color: 'var(--success)' }}>%{((camp.discountRate || camp.pointsRate || 0) * 100).toFixed(0)}</div>
                                                                <div style={{ fontSize: '9px', fontWeight: '800', opacity: 0.4 }}>ORAN</div>
                                                            </div>
                                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                                <button onClick={() => startEditingCampaign(camp)} className="btn btn-ghost btn-sm" style={{ padding: '8px' }}>✏️</button>
                                                                <button onClick={() => deleteCampaign(camp.id)} className="btn btn-ghost btn-sm" style={{ padding: '8px', color: 'var(--danger)' }}>🗑️</button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                {campaigns.length === 0 && (
                                                    <div style={{ textAlign: 'center', padding: '60px 20px', opacity: 0.3 }}>
                                                        <div style={{ fontSize: '40px', marginBottom: '10px' }}>📭</div>
                                                        <div style={{ fontSize: '14px', fontWeight: '700' }}>Henüz aktif kampanya yok.</div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 10.2 REFERANS SİSTEMİ */}
                        {campaignSubTab === 'referral' && (
                            <div className="animate-fade-in-up" style={{ maxWidth: '800px' }}>
                                <div className="card glass" style={{ border: '1px solid var(--secondary-rgb)' }}>
                                    <div style={{ display: 'flex', gap: '24px', alignItems: 'center', marginBottom: '30px' }}>
                                        <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', boxShadow: '0 8px 16px var(--secondary-rgb)' }}>🔗</div>
                                        <div>
                                            <h3 style={{ fontSize: '20px', fontWeight: '900', marginBottom: '4px' }}>Referans & Ödül Sistemi</h3>
                                            <p className="text-muted" style={{ fontSize: '13px' }}>Müşterilerinizin işletmenizi başkalarına tavsiye etmesini teşvik edin.</p>
                                        </div>
                                    </div>

                                    <div className="grid-cols-2 gap-8 mb-8">
                                        <div style={{ background: 'var(--bg-deep)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-light)' }}>
                                            <label style={{ fontSize: '11px', fontWeight: '800', opacity: 0.5, display: 'block', marginBottom: '12px' }}>REFERANS OLAN KİŞİYE ÖDÜL</label>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                <div style={{ flex: 1 }}>
                                                    <input type="number"
                                                        value={referralSettings.referrerDiscount}
                                                        onChange={e => setReferralSettings({ ...referralSettings, referrerDiscount: parseFloat(e.target.value) || 0 })}
                                                        style={{ width: '100%', fontSize: '24px', fontWeight: '900', background: 'transparent', border: 'none', color: 'white', outline: 'none' }}
                                                    />
                                                    <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--primary)' }}>İNDİRİM ORANI (%)</div>
                                                </div>
                                                <div style={{ fontSize: '24px', opacity: 0.2 }}>%</div>
                                            </div>
                                            <p style={{ fontSize: '11px', marginTop: '15px', color: 'var(--text-muted)' }}>Mevcut müşteri, yeni birini getirdiğinde bu oranda bir indirim kuponu kazanır.</p>
                                        </div>

                                        <div style={{ background: 'var(--bg-deep)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-light)' }}>
                                            <label style={{ fontSize: '11px', fontWeight: '800', opacity: 0.5, display: 'block', marginBottom: '12px' }}>YENİ GELEN KİŞİYE HEDİYE</label>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                <div style={{ flex: 1 }}>
                                                    <input type="number"
                                                        value={referralSettings.refereeGift}
                                                        onChange={e => setReferralSettings({ ...referralSettings, refereeGift: parseFloat(e.target.value) || 0 })}
                                                        style={{ width: '100%', fontSize: '24px', fontWeight: '900', background: 'transparent', border: 'none', color: 'white', outline: 'none' }}
                                                    />
                                                    <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--success)' }}>HEDİYE TUTAR (₺)</div>
                                                </div>
                                                <div style={{ fontSize: '24px', opacity: 0.2 }}>₺</div>
                                            </div>
                                            <p style={{ fontSize: '11px', marginTop: '15px', color: 'var(--text-muted)' }}>Yeni müşteri ilk alışverişinde bu tutar kadar anında hoşgeldin indirimi alır.</p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={saveReferralSettings}
                                        className="btn btn-primary w-full"
                                        style={{ height: '54px', borderRadius: '16px', fontWeight: '900', fontSize: '15px' }}
                                    >
                                        SİSTEM AYARLARINI GÜNCELLE
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* 10.3 HEDİYE ÇEKLERİ (COUPONS) */}
                        {campaignSubTab === 'coupons' && (
                            <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div className="grid-cols-12 gap-6">
                                    <div className="col-span-12 lg:col-span-5">
                                        <div className="card glass">
                                            <h3 className="mb-6" style={{ fontSize: '16px' }}>🎫 Kod Üretici</h3>
                                            <div className="flex-col gap-5">
                                                <div className="flex-col gap-2">
                                                    <label style={{ fontSize: '11px', fontWeight: '800', opacity: 0.5 }}>KAMPANYA ADI</label>
                                                    <input type="text" value={newCoupon.campaignName} onChange={e => setNewCoupon({ ...newCoupon, campaignName: e.target.value })} placeholder="Yılbaşı Paket İndirimi" style={{ padding: '12px', background: 'var(--bg-deep)', border: '1px solid var(--border-light)', borderRadius: '10px', color: 'white' }} />
                                                </div>

                                                <div className="grid-cols-2 gap-4">
                                                    <div className="flex-col gap-2">
                                                        <label style={{ fontSize: '11px', fontWeight: '800', opacity: 0.5 }}>ÜRETİLECEK ADET</label>
                                                        <input type="number" value={newCoupon.count} onChange={e => setNewCoupon({ ...newCoupon, count: parseInt(e.target.value) || 1 })} style={{ padding: '12px', background: 'var(--bg-deep)', border: '1px solid var(--border-light)', borderRadius: '10px', color: 'white' }} />
                                                    </div>
                                                    <div className="flex-col gap-2">
                                                        <label style={{ fontSize: '11px', fontWeight: '800', opacity: 0.5 }}>SON KULLANIM</label>
                                                        <input type="date" value={newCoupon.expiryDate} onChange={e => setNewCoupon({ ...newCoupon, expiryDate: e.target.value })} style={{ padding: '12px', background: 'var(--bg-deep)', border: '1px solid var(--border-light)', borderRadius: '10px', color: 'white' }} />
                                                    </div>
                                                </div>

                                                <div className="grid-cols-2 gap-4">
                                                    <div className="flex-col gap-2">
                                                        <label style={{ fontSize: '11px', fontWeight: '800', opacity: 0.5 }}>İNDİRİM TİPİ</label>
                                                        <select value={newCoupon.type} onChange={e => setNewCoupon({ ...newCoupon, type: e.target.value })} style={{ padding: '12px', background: 'var(--bg-deep)', border: '1px solid var(--border-light)', borderRadius: '10px', color: 'white' }}>
                                                            <option value="percent">İndirim Oranı (%)</option>
                                                            <option value="amount">İndirim Tutarı (₺)</option>
                                                        </select>
                                                    </div>
                                                    <div className="flex-col gap-2">
                                                        <label style={{ fontSize: '11px', fontWeight: '800', opacity: 0.5 }}>DEĞER</label>
                                                        <input type="number" value={newCoupon.value} onChange={e => setNewCoupon({ ...newCoupon, value: parseFloat(e.target.value) || 0 })} style={{ padding: '12px', background: 'var(--bg-deep)', border: '1px solid var(--border-light)', borderRadius: '10px', color: 'white' }} />
                                                    </div>
                                                </div>

                                                <div className="grid-cols-2 gap-4">
                                                    <div className="flex-col gap-2">
                                                        <label style={{ fontSize: '11px', fontWeight: '800', opacity: 0.5 }}>SEPET LİMİTİ (Min ₺)</label>
                                                        <input type="number" value={newCoupon.minPurchaseAmount} onChange={e => setNewCoupon({ ...newCoupon, minPurchaseAmount: parseFloat(e.target.value) || 0 })} placeholder="0 (Limitsiz)" style={{ padding: '12px', background: 'var(--bg-deep)', border: '1px solid var(--border-light)', borderRadius: '10px', color: 'white' }} />
                                                    </div>
                                                    <div className="flex-col gap-2">
                                                        <label style={{ fontSize: '11px', fontWeight: '800', opacity: 0.5 }}>KULLANIM HAKKI</label>
                                                        <select value={newCoupon.usageLimit} onChange={e => setNewCoupon({ ...newCoupon, usageLimit: parseInt(e.target.value) })} style={{ padding: '12px', background: 'var(--bg-deep)', border: '1px solid var(--border-light)', borderRadius: '10px', color: 'white' }}>
                                                            <option value={1}>1 Seferlik (Kullanınca Biter)</option>
                                                            <option value={0}>Sürekli (Her Alışverişte)</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="grid-cols-2 gap-4">
                                                    <div className="flex-col gap-2">
                                                        <label style={{ fontSize: '11px', fontWeight: '800', opacity: 0.5 }}>MARKA KISITI</label>
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', padding: '8px', background: 'var(--bg-deep)', borderRadius: '8px', border: '1px solid var(--border-light)', minHeight: '50px' }}>
                                                            {allBrands.map(b => (
                                                                <button
                                                                    type="button"
                                                                    key={b}
                                                                    onClick={() => {
                                                                        const current = newCoupon.conditions.brands || [];
                                                                        const next = current.includes(b) ? current.filter((x: any) => x !== b) : [...current, b];
                                                                        setNewCoupon({ ...newCoupon, conditions: { ...newCoupon.conditions, brands: next } });
                                                                    }}
                                                                    style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '10px', background: newCoupon.conditions.brands?.includes(b) ? 'var(--primary)' : 'rgba(255,255,255,0.05)', border: 'none', color: 'white', cursor: 'pointer' }}
                                                                >
                                                                    {b}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="flex-col gap-2">
                                                        <label style={{ fontSize: '11px', fontWeight: '800', opacity: 0.5 }}>KAT. KISITI</label>
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', padding: '8px', background: 'var(--bg-deep)', borderRadius: '8px', border: '1px solid var(--border-light)', minHeight: '50px' }}>
                                                            {allCats.map(c => (
                                                                <button
                                                                    type="button"
                                                                    key={c}
                                                                    onClick={() => {
                                                                        const current = newCoupon.conditions.categories || [];
                                                                        const next = current.includes(c) ? current.filter((x: any) => x !== c) : [...current, c];
                                                                        setNewCoupon({ ...newCoupon, conditions: { ...newCoupon.conditions, categories: next } });
                                                                    }}
                                                                    style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '10px', background: newCoupon.conditions.categories?.includes(c) ? 'var(--secondary)' : 'rgba(255,255,255,0.05)', border: 'none', color: 'white', cursor: 'pointer' }}
                                                                >
                                                                    {c}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={addCoupon}
                                                    className="btn btn-primary w-full"
                                                    style={{ height: '54px', borderRadius: '16px', fontWeight: '900', marginTop: '10px' }}
                                                >
                                                    🚀 KODLARI OLUŞTUR VE YAYINLA
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-span-12 lg:col-span-7">
                                        <div className="card glass flex-col items-center justify-center" style={{ padding: '60px', textAlign: 'center', background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))' }}>
                                            <div style={{ fontSize: '64px', marginBottom: '20px', filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.3))' }}>🎫</div>
                                            <h3 style={{ fontSize: '24px', fontWeight: '900', color: 'white', letterSpacing: '0.5px' }}>Hediye Çeki Yönetimi</h3>
                                            <p style={{ opacity: 0.6, maxWidth: '380px', margin: '15px auto 35px', fontSize: '14px', lineHeight: '1.6' }}>
                                                Sistemde toplam <b>{coupons.length}</b> adet kupon tanımlı. Kodları listelemek, arama yapmak ve Excel/PDF dökümü almak için aşağıdaki yönetim panelini açın.
                                            </p>
                                            <div style={{ display: 'flex', gap: '15px' }}>
                                                <button
                                                    onClick={() => setShowCouponModal(true)}
                                                    className="btn-primary"
                                                    style={{ padding: '16px 35px', borderRadius: '18px', fontWeight: '900', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 10px 25px rgba(var(--primary-rgb), 0.3)' }}
                                                >
                                                    <span>👁️</span> KODLARI YÖNET & LİSTELE
                                                </button>
                                            </div>

                                            <div style={{ marginTop: '40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', width: '100%', maxWidth: '400px' }}>
                                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <div style={{ fontSize: '10px', fontWeight: '800', opacity: 0.4, marginBottom: '5px' }}>AKTİF KODLAR</div>
                                                    <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--success)' }}>{coupons.filter((c: any) => !c.isUsed).length}</div>
                                                </div>
                                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <div style={{ fontSize: '10px', fontWeight: '800', opacity: 0.4, marginBottom: '5px' }}>KULLANILAN</div>
                                                    <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--primary)' }}>{coupons.filter((c: any) => c.isUsed).length}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
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

                {/* 10.4 HEDİYE ÇEKİ YÖNETİM MODALI */}
                {showCouponModal && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }} onClick={() => setShowCouponModal(false)}>
                        <div style={{ background: 'var(--bg-card)', width: '90%', maxWidth: '1200px', maxHeight: '90vh', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }} onClick={e => e.stopPropagation()}>
                            {/* Modal Header */}
                            <div style={{ padding: '32px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h2 style={{ fontSize: '24px', fontWeight: '900', margin: 0, color: 'var(--primary)' }}>🎫 Hediye Çeki Yönetimi</h2>
                                    <p style={{ margin: '5px 0 0', opacity: 0.5, fontSize: '13px' }}>Toplam {filteredCouponsList.length} kod bulundu.</p>
                                </div>
                                <div style={{ display: 'flex', gap: '15px' }}>
                                    <button onClick={exportCouponsExcel} className="btn" style={{ background: '#107c41', color: 'white', fontWeight: '800', fontSize: '12px', padding: '10px 20px', borderRadius: '12px' }}>📊 EXCEL</button>
                                    <button onClick={exportCouponsPDF} className="btn" style={{ background: '#e11d48', color: 'white', fontWeight: '800', fontSize: '12px', padding: '10px 20px', borderRadius: '12px' }}>📄 PDF</button>
                                    <button onClick={() => setShowCouponModal(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
                                </div>
                            </div>

                            {/* Modal Search & Filters */}
                            <div style={{ padding: '24px 32px', background: 'rgba(255,255,255,0.01)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="text"
                                        placeholder="Kod veya kampanya adı ile ara..."
                                        value={couponSearch}
                                        onChange={e => { setCouponSearch(e.target.value); setCouponPage(1); }}
                                        style={{ width: '100%', background: 'var(--bg-deep)', border: '1px solid rgba(255,255,255,0.1)', padding: '16px 20px 16px 50px', borderRadius: '16px', color: 'white', outline: 'none', fontSize: '15px' }}
                                    />
                                    <span style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', fontSize: '20px', opacity: 0.3 }}>🔍</span>
                                </div>
                            </div>

                            {/* Modal Table */}
                            <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
                                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'separate', borderSpacing: '0 12px' }}>
                                    <thead>
                                        <tr style={{ opacity: 0.4, fontSize: '12px', fontWeight: '800' }}>
                                            <th style={{ padding: '0 15px' }}>KOD BİLGİSİ</th>
                                            <th>İNDİRİM</th>
                                            <th>KULLANIM / LİMİT</th>
                                            <th>GEÇERLİLİK</th>
                                            <th style={{ textAlign: 'right', paddingRight: '15px' }}>İŞLEM</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedCouponsList.map((c: any) => (
                                            <tr key={c.id} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '16px', transition: 'transform 0.2s' }}>
                                                <td style={{ padding: '20px 15px', borderRadius: '16px 0 0 16px', borderLeft: `4px solid ${c.isUsed ? 'rgba(255,255,255,0.1)' : 'var(--primary)'}` }}>
                                                    <div style={{ fontWeight: '900', fontSize: '16px', letterSpacing: '1px', fontFamily: 'monospace' }}>{c.code}</div>
                                                    <div style={{ fontSize: '11px', opacity: 0.5, marginTop: '4px' }}>{c.campaignName || 'Genel Kampanya'}</div>
                                                </td>
                                                <td>
                                                    <div style={{ fontWeight: '800', color: 'var(--success)', fontSize: '16px' }}>
                                                        {c.type === 'amount' ? `₺${c.value.toLocaleString()}` : `%${c.value}`}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <div style={{ width: '100px', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                                                            <div style={{
                                                                width: `${c.usageLimit > 0 ? (c.usedCount / c.usageLimit) * 100 : (c.usedCount > 0 ? 100 : 0)}%`,
                                                                height: '100%',
                                                                background: c.isUsed ? 'rgba(255,255,255,0.2)' : 'var(--primary)'
                                                            }} />
                                                        </div>
                                                        <span style={{ fontSize: '12px', fontWeight: '700' }}>
                                                            {c.usedCount} / {c.usageLimit === 0 ? '∞' : c.usageLimit}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ fontSize: '13px', fontWeight: '600' }}>
                                                        {c.expiryDate ? new Date(c.expiryDate).toLocaleDateString('tr-TR') : 'Süresiz'}
                                                    </div>
                                                    {c.minPurchaseAmount > 0 && <div style={{ fontSize: '10px', color: 'var(--secondary)', marginTop: '2px' }}>Min: ₺{c.minPurchaseAmount.toLocaleString()}</div>}
                                                </td>
                                                <td style={{ textAlign: 'right', paddingRight: '15px', borderRadius: '0 16px 16px 0' }}>
                                                    <button
                                                        onClick={() => {
                                                            showConfirm('Kupon Silinsin mi?', 'Bu kupon kalıcı olarak silinecektir.', async () => {
                                                                await fetch(`/api/coupons?id=${c.id}`, { method: 'DELETE' });
                                                                refreshCoupons();
                                                            });
                                                        }}
                                                        className="btn btn-ghost"
                                                        style={{ color: 'var(--danger)', fontSize: '18px', padding: '10px' }}
                                                    >🗑️</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {filteredCouponsList.length === 0 && (
                                    <div style={{ textAlign: 'center', padding: '80px', opacity: 0.3 }}>
                                        <div style={{ fontSize: '64px', marginBottom: '20px' }}>🔎</div>
                                        <p style={{ fontSize: '18px', fontWeight: '700' }}>Aranan kriterlere uygun kod bulunamadı.</p>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer / Pagination */}
                            <div style={{ padding: '24px 32px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px' }}>
                                <button
                                    disabled={couponPage === 1}
                                    onClick={() => setCouponPage(p => p - 1)}
                                    className="btn"
                                    style={{ padding: '10px 20px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', opacity: couponPage === 1 ? 0.3 : 1 }}
                                >◀ Geri</button>

                                <span style={{ fontSize: '15px', fontWeight: '800' }}>
                                    SAYFA <span style={{ color: 'var(--primary)' }}>{couponPage}</span> / {totalCouponPages || 1}
                                </span>

                                <button
                                    disabled={couponPage >= totalCouponPages}
                                    onClick={() => setCouponPage(p => p + 1)}
                                    className="btn"
                                    style={{ padding: '10px 20px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', opacity: couponPage >= totalCouponPages ? 0.3 : 1 }}
                                >İleri ▶</button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div >
    );
}
