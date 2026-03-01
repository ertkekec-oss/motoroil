
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useModal } from '@/contexts/ModalContext';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useFinancials, PaymentMethod } from '@/contexts/FinancialContext';
import { useInventory } from '@/contexts/InventoryContext';
import { useCRM } from '@/contexts/CRMContext';
import { useSettings } from '@/contexts/SettingsContext';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import IntegrationsContent from '@/components/IntegrationsContent';
import { TURKISH_CITIES, TURKISH_DISTRICTS } from '@/lib/constants';

export default function SettingsPage() {
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState('company');

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab) setActiveTab(tab);
    }, [searchParams]);
    const [definitionTab, setDefinitionTab] = useState('brands');
    const [campaignSubTab, setCampaignSubTab] = useState('loyalty');
    const { showSuccess, showError, showWarning, showConfirm } = useModal();

    useEffect(() => {
        console.log('SettingsPage Mounted. Debugging Modal Context:');
        console.log('showSuccess:', typeof showSuccess, showSuccess);
        console.log('showError:', typeof showError, showError);
    }, [showSuccess, showError]);

    const { user: currentUser } = useAuth(); // Fix: Get currentUser from AuthContext

    const {
        branches: contextBranches,
        refreshBranches,
        staff: users,
        refreshStaff,
    } = useApp();

    const {
        kasalar, setKasalar,
        kasaTypes, setKasaTypes,
        paymentMethods, updatePaymentMethods,
        refreshKasalar, salesExpenses, updateSalesExpenses
    } = useFinancials();

    const {
        products
    } = useInventory();

    const {
        customers, suppliers,
        custClasses, setCustClasses,
        suppClasses, setSuppClasses
    } = useCRM();

    const {
        campaigns, refreshCampaigns,
        coupons, refreshCoupons,
        serviceSettings, updateServiceSettings,
        invoiceSettings, updateInvoiceSettings,
        referralSettings: contextReferralSettings, updateReferralSettings,
        warranties, setWarranties,
        brands, setBrands, prodCats, setProdCats,
        vehicleTypes, setVehicleTypes,
        allBrands, allCats,
        appSettings, updateAppSetting
    } = useSettings();

    const [newPaymentMethod, setNewPaymentMethod] = useState<Partial<PaymentMethod>>({ label: '', type: 'cash', icon: '💰', linkedKasaId: '' });
    const [editingPaymentMethodId, setEditingPaymentMethodId] = useState<string | null>(null);
    const [showKasaDefinitions, setShowKasaDefinitions] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [tempCompanyInfo, setTempCompanyInfo] = useState<any>(null);

    useEffect(() => {
        if (activeTab === 'company' && appSettings) {
            setTempCompanyInfo({
                company_name: appSettings.company_name || '',
                company_slogan: appSettings.company_slogan || '',
                company_email: appSettings.company_email || '',
                company_website: appSettings.company_website || '',
                company_address: appSettings.company_address || '',
                company_city: appSettings.company_city || '',
                company_district: appSettings.company_district || '',
                company_phone: appSettings.company_phone || ''
            });
        }
    }, [activeTab, appSettings]);

    const handleSaveCompany = async () => {
        setIsSaving(true);
        try {
            for (const [key, value] of Object.entries(tempCompanyInfo)) {
                if (appSettings[key] !== value) {
                    await updateAppSetting(key, value);
                }
            }
            showSuccess('Başarılı', 'Firma bilgileri güncellendi.');
        } catch (e) {
            showError('Hata', 'Bilgiler kaydedilemedi.');
        } finally {
            setIsSaving(false);
        }
    };

    const addPaymentMethodDefinition = async () => {
        if (!newPaymentMethod.label) return showError('Hata', 'Buton adı zorunludur.');

        let updatedMethods;
        if (editingPaymentMethodId) {
            updatedMethods = (paymentMethods || []).map((pm: any) =>
                pm.id === editingPaymentMethodId ? { ...newPaymentMethod, id: pm.id } : pm
            );
            setEditingPaymentMethodId(null);
        } else {
            const id = Math.random().toString(36).substr(2, 9);
            const icon = newPaymentMethod.type === 'cash' ? '💵' : (newPaymentMethod.type === 'card' ? '💳' : '🏦');
            updatedMethods = [...(paymentMethods || []), { ...newPaymentMethod, id, icon }];
        }

        try {
            await updatePaymentMethods(updatedMethods);
            showSuccess('Başarılı', 'Hesap tanımı kaydedildi.');
            setNewPaymentMethod({ label: '', type: 'cash', icon: '💰', linkedKasaId: '' });
        } catch (e) {
            showError('Hata', 'Kaydedilemedi.');
        }
    };

    const removePaymentMethodDefinition = (id: string) => {
        showConfirm('Emin misiniz?', 'Bu ödeme tanımı silinecek. Şubelerdeki aktif hesapları etkilemez ancak yeni şubelerde seçilemez.', async () => {
            const updatedMethods = (paymentMethods || []).filter((pm: any) => pm.id !== id);
            await updatePaymentMethods(updatedMethods);
            showSuccess('Başarılı', 'Tanım silindi.');
        });
    };

    const startEditingPaymentMethod = (pm: any) => {
        setNewPaymentMethod({
            label: pm.label,
            type: pm.type,
            icon: pm.icon,
            linkedKasaId: pm.linkedKasaId || ''
        });
        setEditingPaymentMethodId(pm.id);
        setShowKasaDefinitions(true);
    };
    const [smtpSettings, setSmtpSettings] = useState({ email: '', password: '' });

    const [profilePass, setProfilePass] = useState({ old: '', new: '', confirm: '' });
    const [newUser, setNewUser] = useState({ name: '', email: '', role: 'Personel', branch: 'Merkez', username: '', password: '' });

    // KASA MANAGEMENT STATES
    const [showKasaModal, setShowKasaModal] = useState(false);
    const [editingKasa, setEditingKasa] = useState<any>(null);
    const [newKasa, setNewKasa] = useState({ name: '', type: 'Nakit', branch: 'Merkez', balance: 0 });
    const [isProcessingKasa, setIsProcessingKasa] = useState(false);

    const handleSaveKasa = async () => {
        if (!newKasa.name) { showError('Hata', 'Hesap adı giriniz.'); return; }

        setIsProcessingKasa(true);
        try {
            const payload = {
                name: newKasa.name,
                type: newKasa.type,
                branch: newKasa.branch,
                balance: Number(newKasa.balance) || 0
            };

            let res;
            if (editingKasa) {
                res = await fetch(`/api/kasalar/${editingKasa.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } else {
                res = await fetch('/api/kasalar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }

            const data = await res.json();
            if (!data.success) throw new Error(data.error || 'API Hatası');

            showSuccess('Başarılı', 'Hesap kaydedildi.');
            setShowKasaModal(false);
            setEditingKasa(null);
            setNewKasa({ name: '', type: 'Nakit', branch: 'Merkez', balance: 0 });

            if (refreshKasalar) refreshKasalar();
        } catch (e: any) {
            console.error('Kasa Error:', e);
            showError('Hata', e.message || 'İşlem başarısız.');
        } finally { setIsProcessingKasa(false); }
    };

    const handleDeleteKasa = async (id: string) => {
        showConfirm('Silmek istiyor musunuz?', 'Hesap kalıcı silinecek ve tüm geçmiş kayıtlar etkilenebilir.', async () => {
            try {
                await fetch(`/api/kasalar/${id}`, { method: 'DELETE' });
                showSuccess('Silindi', 'Hesap başarıyla silindi.');
                if (refreshKasalar) refreshKasalar();
            } catch (e) {
                showError('Hata', 'Silinemedi.');
            }
        });
    };

    const startEditingKasa = (k: any) => {
        setEditingKasa(k);
        setNewKasa({
            name: k.name,
            type: k.type,
            branch: k.branch || 'Merkez',
            balance: Number(k.balance) || 0
        });
        setShowKasaModal(true);
    };


    const handlePasswordChange = async () => {
        if (profilePass.new !== profilePass.confirm) {
            showError('Hata', 'Yeni şifreler eşleşmiyor.');
            return;
        }
        if (!profilePass.old || !profilePass.new) {
            showError('Hata', 'Lütfen tüm alanları doldurun.');
            return;
        }

        try {
            const res = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: currentUser?.username,
                    oldPassword: profilePass.old,
                    newPassword: profilePass.new
                })
            });

            if (res.ok) {
                showSuccess('Başarılı', 'Şifreniz güncellendi.');
                setProfilePass({ old: '', new: '', confirm: '' });
            } else {
                const data = await res.json();
                showError('Hata', data.error || 'Şifre değiştirilemedi.');
            }
        } catch (e) {
            showError('Hata', 'Sunucu hatası.');
        }
    };

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
        conditions: {
            brands: [],
            categories: [],
            paymentMethod: '',
            buyQuantity: 1,
            rewardProductId: '',
            rewardQuantity: 1,
            rewardValue: 0,
            rewardType: 'percentage_discount'
        },
        targetCustomerCategoryIds: []
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

    const [resetOptions, setResetOptions] = useState({
        customers: false,
        inventory: false,
        ecommerce: false,
        pos: false,
        receivables: false,
        payables: false,
        checks: false,
        notes: false,
        staff: false,
        branches: false,
        expenses: false,
        all: false
    });

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
                setNewCampaign({
                    name: '',
                    type: 'payment_method_discount',
                    discountRate: 0,
                    pointsRate: 0,
                    conditions: {
                        brands: [],
                        categories: [],
                        paymentMethod: '',
                        buyQuantity: 1,
                        rewardProductId: '',
                        rewardQuantity: 1,
                        rewardValue: 0,
                        rewardType: 'percentage_discount'
                    },
                    targetCustomerCategoryIds: []
                });
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
            conditions: camp.conditions || {
                brands: [],
                categories: [],
                paymentMethod: '',
                buyQuantity: 1,
                rewardProductId: '',
                rewardQuantity: 1,
                rewardValue: 0,
                rewardType: 'percentage_discount'
            },
            targetCustomerCategoryIds: camp.targetCustomerCategoryIds || []
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
            const currentRates = (invoiceSettings as any)?.kdvRates || [];
            updateInvoiceSettings({ ...invoiceSettings, kdvRates: [...currentRates, parseInt(newKdv)] });
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
        const currentList = list || [];
        const newList = [...currentList, newItemInput];
        setList(newList);
        setNewItemInput('');

        // Veritabanına kaydet
        try {
            await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [key]: newList })
            });
            // Optional: Show success
            if (showSuccess) showSuccess('Başarılı', 'Kayıt eklendi');
        } catch (e) {
            console.error('Save definition failed:', e);
            if (showError) showError('Hata', 'Kayıt yapılamadı.');
        }
    };

    const removeDefinition = async (key: string, item: string, list: string[], setList: any) => {
        const currentList = list || [];
        const newList = currentList.filter(i => i !== item);
        setList(newList);

        // Veritabanına kaydet
        try {
            await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [key]: newList })
            });
            if (showSuccess) showSuccess('Başarılı', 'Kayıt silindi');
        } catch (e) {
            console.error('Remove definition failed:', e);
            if (showError) showError('Hata', 'Kayıt güncellenemedi.');
        }
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
    const [newBranch, setNewBranch] = useState({ name: '', type: 'Şube', city: 'İstanbul', district: '', address: '', phone: '', manager: '', status: 'Aktif' });
    const [editingBranchId, setEditingBranchId] = useState<number | null>(null);
    const [selectedBranchDocs, setSelectedBranchDocs] = useState<number | null>(null); // Branch ID

    // --- BRANCH - KASA MAPPING STATE ---
    const [branchDefaults, setBranchDefaults] = useState<Record<string, any>>({});

    useEffect(() => {
        // Load branch defaults from settings
        fetch('/api/settings').then(r => r.json()).then(d => {
            if (d.branch_defaults) setBranchDefaults(d.branch_defaults);
        });
    }, []);

    const updateBranchDefault = (branchId: number | string, key: string, value: string) => {
        setBranchDefaults(prev => ({
            ...prev,
            [branchId]: {
                ...prev[branchId],
                [key]: value
            }
        }));
    };

    const saveBranchDefaults = async () => {
        try {
            await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ branch_defaults: branchDefaults })
            });
            showSuccess('Başarılı', 'Şube-Kasa eşleşmeleri kaydedildi.');
        } catch (e) { showError('Hata', 'Kaydedilemedi'); }
    };

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
                setNewBranch({ name: '', type: 'Şube', city: 'İstanbul', district: '', address: '', phone: '', manager: '', status: 'Aktif' });
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



    // Fetch SMTP settings
    useEffect(() => {
        if (activeTab === 'system') {
            fetch('/api/settings/mail')
                .then(res => res.json())
                .then(data => {
                    if (data && !data.error) setSmtpSettings({ email: data.email || '', password: data.password || '' });
                })
                .catch(err => console.error("SMTP fetch failed", err));
        }
    }, [activeTab]);

    const saveSmtpSettings = async () => {
        try {
            const res = await fetch('/api/settings/mail', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(smtpSettings)
            });
            if (res.ok) {
                showSuccess('Başarılı', 'Mail ayarları kaydedildi.');
            } else {
                showError('Hata', 'Kaydedilemedi.');
            }
        } catch (e) {
            showError('Hata', 'Sunucu hatası.');
        }
    };

    const quickAddPaymentMethod = async () => {
        if (!newItemInput) return;
        const id = Math.random().toString(36).substr(2, 9);
        // Default to cash for quick add
        const newMethod = { id, label: newItemInput, type: 'cash' as const, icon: '💰', linkedKasaId: '' };
        const updatedMethods = [...paymentMethods, newMethod];

        try {
            await updatePaymentMethods(updatedMethods);
            setNewItemInput('');
            showSuccess('Başarılı', 'Ödeme yöntemi eklendi (Nakit). Detaylar için Finans ayarlarına gidin.');
        } catch (e) {
            showError('Hata', 'Kaydedilemedi.');
        }
    };

    const quickRemovePaymentMethod = async (id: string) => {
        const updatedMethods = paymentMethods.filter((pm: any) => pm.id !== id);
        try {
            await updatePaymentMethods(updatedMethods);
            showSuccess('Silindi', 'Ödeme yöntemi silindi.');
        } catch (e) { showError('Hata', 'Silinemedi'); }
    };

    // Helper to render active list
    const activeListRender = () => {
        if (definitionTab === 'payment_methods') {
            return paymentMethods.map((pm: any, i: number) => (
                <div key={pm.id || i} className="flex-between" style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.02)' }}>
                    <div className="flex items-center gap-2">
                        <span>{pm.icon || '💰'}</span>
                        <div className="flex-col">
                            <span style={{ fontSize: '12px', fontWeight: '600' }}>{pm.label}</span>
                            <span style={{ fontSize: '10px', opacity: 0.5 }}>{pm.type === 'card' ? 'Kredi Kartı' : 'Nakit'}</span>
                        </div>
                    </div>
                    <button
                        onClick={() => quickRemovePaymentMethod(pm.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '14px' }}
                    >
                        🗑️
                    </button>
                </div>
            ));
        }

        const list = definitionTab === 'brands' ? brands :
            definitionTab === 'prod_cat' ? prodCats :
                definitionTab === 'cust_class' ? custClasses :
                    definitionTab === 'supp_class' ? suppClasses : warranties;

        return list.map((item: string, i: number) => (
            <div key={i} className="flex-between" style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.02)' }}>
                <span style={{ fontSize: '12px', fontWeight: '600' }}>{item}</span>
                <button
                    onClick={() => {
                        if (definitionTab === 'brands') removeDefinition('brands', item, brands, setBrands);
                        if (definitionTab === 'prod_cat') removeDefinition('prodCat', item, prodCats, setProdCats);
                        if (definitionTab === 'cust_class') removeDefinition('custClasses', item, custClasses, setCustClasses);
                        if (definitionTab === 'supp_class') removeDefinition('suppClasses', item, suppClasses, setSuppClasses);
                        if (definitionTab === 'warranties') removeDefinition('warranties', item, warranties, setWarranties);
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '14px' }}
                >
                    🗑️
                </button>
            </div>
        ));
    };

    return (
        <div className="flex h-screen bg-[#F6F8FB] dark:bg-[#0B1120] text-slate-900 dark:text-white overflow-hidden">

            {/* LEFT SIDEBAR MENU */}
            <div className="w-[260px] shrink-0 border-r border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-[#111827] flex flex-col gap-2 overflow-y-auto">
                <h2 className="text-[11px] font-bold mb-4 px-3 text-slate-500 uppercase tracking-widest">⚙ Ayarlar</h2>

                {[
                    { id: 'company', label: 'Firma Profili', icon: '🏢' },
                    { id: 'integrations', label: 'Entegrasyonlar', icon: '🔌' },
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
                    { id: 'logs', label: 'İşlem Günlükleri', icon: '📜' },
                    { id: 'system', label: 'Mail Ayarları', icon: '📧' }
                ].map(item => {
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-colors text-left relative overflow-hidden ${isActive
                                ? 'bg-[#E0E7FF] dark:bg-[#1E293B] text-blue-700 dark:text-white font-bold'
                                : 'text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                            style={{ fontSize: '13px' }}
                        >
                            {isActive && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 dark:bg-blue-400" />
                            )}
                            <span className={isActive ? 'opacity-100' : 'opacity-60'} style={{ fontSize: '16px' }}>{item.icon}</span>
                            {item.label}
                        </button>
                    );
                })}

                <div style={{ height: '1px', background: "#E2E8F0", margin: '12px 0' }}></div>

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
            <div className="flex-1 p-8 overflow-y-auto w-full max-w-7xl mx-auto flex flex-col gap-8 pb-32">

                {/* 0. FİRMA PROFİLİ */}
                {activeTab === 'company' && (
                    <div style={{ maxWidth: '600px' }} className="animate-fade-in-up">
                        <h2 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '8px' }}>Firma Profili</h2>
                        <p className="text-muted mb-8" style={{ fontSize: '14px' }}>Belgelerde ve tekliflerde görünecek genel firma bilgilerini düzenleyin.</p>

                        <div className="flex flex-col gap-6 p-8 bg-white dark:bg-[#111827] rounded-[20px] border border-slate-200 dark:border-slate-800 shadow-sm">
                            <div className="flex-col gap-2">
                                <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 block mb-2">FİRMA ADI</label>
                                <input
                                    type="text"
                                    value={tempCompanyInfo?.company_name || ""}
                                    onChange={(e) => setTempCompanyInfo({ ...tempCompanyInfo, company_name: e.target.value })}
                                    placeholder="Örn: MOTOROIL"
                                    className="w-full h-[44px] px-[12px] rounded-[12px] bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all shadow-sm" style={{ fontWeight: 800 }}
                                />
                            </div>

                            <div className="flex-col gap-2">
                                <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 block mb-2">SLOGAN / ALT BAŞLIK</label>
                                <input
                                    type="text"
                                    value={tempCompanyInfo?.company_slogan || ""}
                                    onChange={(e) => setTempCompanyInfo({ ...tempCompanyInfo, company_slogan: e.target.value })}
                                    placeholder="Örn: Profesyonel Oto Servis ve Bakım"
                                    className="w-full h-[44px] px-[12px] rounded-[12px] bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all shadow-sm"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex-col gap-2">
                                    <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 block mb-2">ŞEHİR</label>
                                    <select
                                        value={tempCompanyInfo?.company_city || ""}
                                        onChange={(e) => setTempCompanyInfo({ ...tempCompanyInfo, company_city: e.target.value, company_district: '' })}
                                        className="w-full h-[44px] px-[12px] rounded-[12px] bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all shadow-sm"
                                    >
                                        <option value="">Şehir Seçin...</option>
                                        {TURKISH_CITIES.map(city => (
                                            <option key={city} value={city}>{city}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex-col gap-2">
                                    <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 block mb-2">İLÇE</label>
                                    <select
                                        value={tempCompanyInfo?.company_district || ""}
                                        onChange={(e) => setTempCompanyInfo({ ...tempCompanyInfo, company_district: e.target.value })}
                                        disabled={!tempCompanyInfo?.company_city}
                                        className="w-full h-[44px] px-[12px] rounded-[12px] bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all shadow-sm"
                                    >
                                        <option value="">İlçe Seçin...</option>
                                        {(TURKISH_DISTRICTS[tempCompanyInfo?.company_city] || []).map(district => (
                                            <option key={district} value={district}>{district}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex-col gap-2">
                                    <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 block mb-2">GENEL E-POSTA</label>
                                    <input
                                        type="email"
                                        value={tempCompanyInfo?.company_email || ""}
                                        onChange={(e) => setTempCompanyInfo({ ...tempCompanyInfo, company_email: e.target.value })}
                                        placeholder="info@firma.com"
                                        className="w-full h-[44px] px-[12px] rounded-[12px] bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all shadow-sm"
                                    />
                                </div>
                                <div className="flex-col gap-2">
                                    <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 block mb-2">WEB SİTESİ</label>
                                    <input
                                        type="text"
                                        value={tempCompanyInfo?.company_website || ""}
                                        onChange={(e) => setTempCompanyInfo({ ...tempCompanyInfo, company_website: e.target.value })}
                                        placeholder="www.firma.com.tr"
                                        className="w-full h-[44px] px-[12px] rounded-[12px] bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all shadow-sm"
                                    />
                                </div>
                            </div>

                            <div className="flex-col gap-2">
                                <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 block mb-2">VARSAYILAN ADRES (ŞUBE BİLGİSİ YOKSA)</label>
                                <textarea
                                    rows={3}
                                    value={tempCompanyInfo?.company_address || ""}
                                    onChange={(e) => setTempCompanyInfo({ ...tempCompanyInfo, company_address: e.target.value })}
                                    placeholder="Firma açık adresi..."
                                    className="w-full h-[44px] px-[12px] rounded-[12px] bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all shadow-sm"
                                />
                            </div>

                            <div className="flex-col gap-2">
                                <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 block mb-2">VARSAYILAN TELEFON</label>
                                <input
                                    type="text"
                                    value={tempCompanyInfo?.company_phone || ""}
                                    onChange={(e) => setTempCompanyInfo({ ...tempCompanyInfo, company_phone: e.target.value })}
                                    placeholder="+90 (---) --- -- --"
                                    className="w-full h-[44px] px-[12px] rounded-[12px] bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all shadow-sm"
                                />
                            </div>

                            <button
                                onClick={handleSaveCompany}
                                disabled={isSaving}
                                className="btn bg-blue-600 hover:bg-blue-700 text-white !border-none transition-colors h-12"
                                style={{
                                    width: '100%',
                                    marginTop: '10px',
                                    fontSize: '14px',
                                    fontWeight: '900',
                                    gap: '10px'
                                }}
                            >
                                {isSaving ? '⏳ KAYDEDİLİYOR...' : '💾 DEĞİŞİKLİKLERİ KAYDET'}
                            </button>

                            <div style={{ marginTop: '10px', padding: '15px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                <p style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: '700' }}>💡 Bilgi:</p>
                                <p style={{ fontSize: '11px', opacity: 0.7, marginTop: '5px' }}>
                                    Bu bilgiler sistem genelindeki belgelerde (teklif, fatura vb.) varsayılan olarak kullanılır.
                                    Şube bazlı belgelerde ilgili şubenin kendi adres ve telefonu önceliklidir.
                                </p>
                            </div>
                        </div>
                    </div>
                )}


                {/* 0. ENTEGRASYONLAR */}
                {activeTab === 'integrations' && <IntegrationsContent />}

                {/* 1. ŞUBELER & DEPO */}
                {activeTab === 'branches' && (
                    <div>
                        <h2 style={{ marginBottom: '20px' }}>Şubeler ve Dijital Arşiv</h2>

                        {/* Add/Edit Branch Form */}
                        <div className="flex flex-col gap-6 p-8 mb-8 bg-white dark:bg-[#111827] rounded-[20px] border border-slate-200 dark:border-slate-800 shadow-sm" style={{ borderLeft: editingBranchId ? '4px solid var(--warning)' : '4px solid var(--primary)' }}>
                            <div className="flex-between mb-4">
                                <h3 style={{ fontSize: '16px', color: editingBranchId ? 'var(--warning)' : 'var(--primary)' }}>
                                    {editingBranchId ? '✏️ Şube Düzenleme Modu' : '➕ Yeni Şube / Depo Ekle'}
                                </h3>
                                {editingBranchId && (
                                    <button onClick={() => { setEditingBranchId(null); setNewBranch({ name: '', type: 'Şube', city: '', district: '', address: '', phone: '', manager: '', status: 'Aktif' }); }} className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition-colors" style={{ fontSize: '12px' }}>Vazgeç</button>
                                )}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                <div className="flex-col gap-2">
                                    <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 block mb-2">TÜR</label>
                                    <select value={newBranch.type} onChange={e => setNewBranch({ ...newBranch, type: e.target.value })} className="w-full h-[44px] px-[12px] rounded-[12px] bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all shadow-sm">
                                        <option>Şube</option>
                                        <option>Depo</option>
                                        <option>Merkez Ofis</option>
                                        <option>Home Office</option>
                                    </select>
                                </div>
                                <div className="flex-col gap-2">
                                    <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 block mb-2">ŞUBE ADI</label>
                                    <input type="text" value={newBranch.name} onChange={e => setNewBranch({ ...newBranch, name: e.target.value })} className="w-full h-[44px] px-[12px] rounded-[12px] bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all shadow-sm" placeholder="Örn: İzmir Bornova Şube" />
                                </div>
                                <div className="flex-col gap-2">
                                    <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 block mb-2">ŞEHİR</label>
                                    <select
                                        value={newBranch.city}
                                        onChange={e => setNewBranch({ ...newBranch, city: e.target.value, district: '' })}
                                        className="w-full h-[44px] px-[12px] rounded-[12px] bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all shadow-sm"
                                    >
                                        <option value="">Şehir Seçin...</option>
                                        {TURKISH_CITIES.map(city => (
                                            <option key={city} value={city}>{city}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex-col gap-2">
                                    <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 block mb-2">İLÇE</label>
                                    <select
                                        value={newBranch.district}
                                        onChange={e => setNewBranch({ ...newBranch, district: e.target.value })}
                                        disabled={!newBranch.city}
                                        className="w-full h-[44px] px-[12px] rounded-[12px] bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all shadow-sm"
                                    >
                                        <option value="">İlçe Seçin...</option>
                                        {(TURKISH_DISTRICTS[newBranch.city] || []).map(district => (
                                            <option key={district} value={district}>{district}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex-col gap-2">
                                    <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 block mb-2">DURUM</label>
                                    <select value={newBranch.status} onChange={e => setNewBranch({ ...newBranch, status: e.target.value })} className="w-full h-[44px] px-[12px] rounded-[12px] bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all shadow-sm">
                                        <option>Aktif</option>
                                        <option>Tadilat</option>
                                        <option>Kapalı</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                                <div className="flex-col gap-2">
                                    <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 block mb-2">AÇIK ADRES</label>
                                    <input type="text" value={newBranch.address} onChange={e => setNewBranch({ ...newBranch, address: e.target.value })} className="w-full h-[44px] px-[12px] rounded-[12px] bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all shadow-sm" placeholder="Mahalle, Cadde, No..." />
                                </div>
                                <div className="flex-col gap-2">
                                    <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 block mb-2">TELEFON</label>
                                    <input type="text" value={newBranch.phone} onChange={e => setNewBranch({ ...newBranch, phone: e.target.value })} className="w-full h-[44px] px-[12px] rounded-[12px] bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all shadow-sm" placeholder="0212..." />
                                </div>
                                <div className="flex-col gap-2">
                                    <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 block mb-2">YÖNETİCİ</label>
                                    <input type="text" value={newBranch.manager} onChange={e => setNewBranch({ ...newBranch, manager: e.target.value })} className="w-full h-[44px] px-[12px] rounded-[12px] bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all shadow-sm" placeholder="Ad Soyad" />
                                </div>
                            </div>

                            <button onClick={addBranch} className={`btn w-full ${editingBranchId ? 'btn-warning' : 'bg-blue-600 hover:bg-blue-700 text-white !border-none transition-colors'}`} style={{ height: '48px', fontWeight: 'bold', fontSize: '14px' }}>
                                {editingBranchId ? '💾 Değişiklikleri Kaydet (Güncelle)' : '➕ Sisteme Yeni Şube Ekle'}
                            </button>
                        </div>

                        {/* Branch List */}
                        <div className="flex-col gap-4">
                            {branches.map(branch => (
                                <div key={branch.id} className="p-8 bg-white dark:bg-[#111827] rounded-[20px] border border-slate-200 dark:border-slate-800 shadow-sm animate-slide-up" style={{ borderLeft: `4px solid ${branch.status === 'Aktif' ? 'var(--success)' : "#64748B"}` }}>
                                    <div className="flex-between" style={{ alignItems: 'flex-start' }}>
                                        <div className="flex-col gap-1">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <span style={{ backgroundColor: "transparent", padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', border: '1px solid var(--border-light)' }}>
                                                    {branch.type || 'Şube'}
                                                </span>
                                                <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>{branch.name}</h3>
                                                {branch.status !== 'Aktif' && <span style={{ background: 'rgba(255,255,255,0.1)', fontSize: '10px', padding: '2px 6px', borderRadius: '4px' }}>{branch.status}</span>}
                                            </div>
                                            <div className="text-muted" style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '15px', marginTop: '5px' }}>
                                                <span>📍 {branch.city}{branch.district ? ` / ${branch.district}` : ''}</span>
                                                <span>📞 {branch.phone}</span>
                                                <span>👤 Yon: {branch.manager || '-'}</span>
                                            </div>
                                            <div className="text-muted" style={{ fontSize: '12px', marginTop: '2px', opacity: 0.7 }}>
                                                🏠 {branch.address}
                                            </div>
                                        </div>

                                        <div className="flex-col gap-2" style={{ alignItems: 'flex-end' }}>
                                            <div className="flex-center gap-2">
                                                <button onClick={() => editBranch(branch)} className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition-colors" style={{ padding: '6px 10px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', fontSize: '12px' }}>✏️ Düzenle</button>
                                                <button onClick={() => deleteBranch(branch.id)} className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition-colors" style={{ padding: '6px 10px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', fontSize: '12px' }}>🗑️ Sil</button>
                                            </div>
                                            <button
                                                onClick={() => setSelectedBranchDocs(selectedBranchDocs === branch.id ? null : branch.id)}
                                                className={`btn ${selectedBranchDocs === branch.id ? 'bg-blue-600 hover:bg-blue-700 text-white !border-none transition-colors' : 'btn-outline'}`}
                                                style={{ fontSize: '11px', padding: '6px 12px' }}
                                            >
                                                {selectedBranchDocs === branch.id ? '📂 Evrakları Kapat' : `📁 Evrak Yönetimi (${branch.docs})`}
                                            </button>
                                        </div>
                                    </div>

                                    {selectedBranchDocs === branch.id && (
                                        <div className="animate-fade-in" style={{ marginTop: '20px', padding: '20px', backgroundColor: "transparent", borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                                            <div className="flex-between mb-4">
                                                <h4 className="text-muted" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>📂 Şube Dijital Arşivi <span style={{ fontSize: '11px', opacity: 0.5 }}>(Kira Kontratı, Ruhsat vb.)</span></h4>
                                                <div>
                                                    <input
                                                        type="file"
                                                        id={`file-upload-${branch.id}`}
                                                        className="hidden"
                                                        onChange={(e) => handleFileUpload(e, branch.id)}
                                                    />
                                                    <label htmlFor={`file-upload-${branch.id}`} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold transition-colors" style={{ borderStyle: 'dashed', fontSize: '12px', cursor: 'pointer' }}>
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
                                                                    <div style={{ fontSize: '10px', color: "#64748B" }}>{new Date(file.uploadedAt).toLocaleDateString('tr-TR')} • {(file.fileSize / 1024).toFixed(1)} KB</div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <button onClick={() => deleteBranchDoc(file.id, branch.id)} className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition-colors" style={{ padding: '6px', fontSize: '11px', color: 'var(--danger)', opacity: 0.7 }}>🗑️</button>
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

                        {/* KASA & BANKA YÖNETİMİ (Revamped) */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8 mb-8">

                            {/* SOL PANEL: ÖDEME YÖNTEMLERİ (Anasayfa Butonları) */}
                            <div className="bg-white dark:bg-[#111827] rounded-[20px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                                <div className="p-4 border-b border-white/5 bg-white/5 flex-between">
                                    <div>
                                        <h3 className="font-bold flex items-center gap-2">🔘 Ödeme Yöntemi Butonları</h3>
                                        <p className="text-[10px] text-muted">Anasayfadaki hızlı işlem butonlarını tanımlayın.</p>
                                    </div>
                                    <button onClick={() => setShowKasaDefinitions(!showKasaDefinitions)} className="btn btn-xs bg-blue-600 hover:bg-blue-700 text-white !border-none transition-colors">
                                        {showKasaDefinitions ? 'KAPAT' : '+ YENİ BUTON'}
                                    </button>
                                </div>

                                {showKasaDefinitions && (
                                    <div className="p-4 bg-black/40 border-b border-white/5 animate-fade-in">
                                        <div className="flex flex-col gap-3 mb-4">
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="form-group">
                                                    <label className="text-[9px] font-black opacity-50 mb-1 block uppercase">Buton Adı</label>
                                                    <input value={newPaymentMethod.label} onChange={e => setNewPaymentMethod({ ...newPaymentMethod, label: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded p-2 text-xs" placeholder="Nakit, Bonus, Havale..." />
                                                </div>
                                                <div className="form-group">
                                                    <label className="text-[9px] font-black opacity-50 mb-1 block uppercase">İşlem Tipi</label>
                                                    <select value={newPaymentMethod.type} onChange={e => setNewPaymentMethod({ ...newPaymentMethod, type: e.target.value as any })} className="w-full bg-black/50 border border-white/10 rounded p-2 text-xs">
                                                        <option value="cash">Nakit (Kasa)</option>
                                                        <option value="card">Kredi Kartı / POS</option>
                                                        <option value="transfer">Havale / EFT</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={addPaymentMethodDefinition} className="btn bg-blue-600 hover:bg-blue-700 text-white !border-none transition-colors btn-sm flex-1 font-bold">
                                                    {editingPaymentMethodId ? 'GÜNCELLE' : 'EKLE'}
                                                </button>
                                                {editingPaymentMethodId && <button onClick={() => { setEditingPaymentMethodId(null); setNewPaymentMethod({ label: '', type: 'cash', icon: '💰', linkedKasaId: '' }); }} className="btn btn-ghost btn-sm">İptal</button>}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="p-4">
                                    <div className="grid grid-cols-1 gap-2">
                                        {(paymentMethods || []).map(pm => (
                                            <div key={pm.id} className="flex-between p-3 bg-white/5 border border-white/5 rounded-xl group hover:bg-white/10 transition-all">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xl p-2 bg-white/5 rounded-lg">{pm.icon}</span>
                                                    <div>
                                                        <div className="text-xs font-black uppercase tracking-wider">{pm.label}</div>
                                                        <div className="text-[9px] text-muted lowercase opacity-60">tip: {pm.type}</div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button onClick={() => startEditingPaymentMethod(pm)} className="text-primary p-2 hover:bg-primary/20 rounded-lg">✏️</button>
                                                    <button onClick={() => removePaymentMethodDefinition(pm.id)} className="text-danger p-2 hover:bg-danger/20 rounded-lg">×</button>
                                                </div>
                                            </div>
                                        ))}
                                        <div className="flex-between p-3 bg-primary/10 border border-primary/20 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <span className="text-xl p-2 bg-white/5 rounded-lg">📖</span>
                                                <div>
                                                    <div className="text-xs font-black uppercase tracking-wider">VERESİYE</div>
                                                    <div className="text-[9px] text-primary lowercase opacity-60">sistem tarafından sabitlenmiştir</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* SAĞ PANEL: KASA & BANKA HESAPLARI */}
                            <div className="bg-white dark:bg-[#111827] rounded-[20px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                                <div className="p-4 border-b border-white/5 bg-white/5 flex-between">
                                    <div>
                                        <h3 className="font-bold flex items-center gap-2">🏛️ Kasa & Banka Hesapları</h3>
                                        <p className="text-[10px] text-muted">Gerçek para giriş-çıkışı yapılan hesaplar.</p>
                                    </div>
                                    <button onClick={() => { setEditingKasa(null); setNewKasa({ name: '', type: 'Nakit', branch: 'Merkez', balance: 0 }); setShowKasaModal(!showKasaModal); }} className="btn btn-xs btn-secondary">
                                        {showKasaModal ? 'KAPAT' : '+ YENİ HESAP'}
                                    </button>
                                </div>

                                {showKasaModal && (
                                    <div className="p-4 bg-black/40 border-b border-white/5 animate-fade-in">
                                        <div className="grid grid-cols-2 gap-3 mb-4">
                                            <div className="form-group col-span-2">
                                                <label className="text-[9px] font-black opacity-50 mb-1 block uppercase">Hesap Adı</label>
                                                <input value={newKasa.name} onChange={e => setNewKasa({ ...newKasa, name: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded p-2 text-sm" placeholder="Örn: Merkez Nakit, Garanti Bankası vb." />
                                            </div>
                                            <div className="form-group">
                                                <label className="text-[9px] font-black opacity-50 mb-1 block uppercase">Tipi</label>
                                                <select value={newKasa.type} onChange={e => setNewKasa({ ...newKasa, type: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded p-2 text-xs">
                                                    {(kasaTypes || []).map(t => <option key={t} value={t}>{t}</option>)}
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label className="text-[9px] font-black opacity-50 mb-1 block uppercase">Şube</label>
                                                <select value={newKasa.branch} onChange={e => setNewKasa({ ...newKasa, branch: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded p-2 text-xs">
                                                    <option value="Global">Küresel (Tüm Şubeler)</option>
                                                    {(contextBranches || []).map((b: any) => <option key={b.id} value={b.name}>{b.name}</option>)}
                                                </select>
                                            </div>
                                            {!editingKasa && (
                                                <div className="form-group col-span-2">
                                                    <label className="text-[9px] font-black opacity-50 mb-1 block uppercase">Açılış Bakiyesi</label>
                                                    <input type="number" value={newKasa.balance} onChange={e => setNewKasa({ ...newKasa, balance: Number(e.target.value) })} className="w-full bg-black/50 border border-white/10 rounded p-2 text-sm" placeholder="0.00" />
                                                </div>
                                            )}
                                        </div>
                                        <button onClick={handleSaveKasa} disabled={isProcessingKasa} className="btn btn-secondary w-full font-bold">
                                            {isProcessingKasa ? 'İŞLENİYOR...' : (editingKasa ? 'GÜNCELLE' : 'HESABI OLUŞTUR')}
                                        </button>
                                    </div>
                                )}

                                <div className="p-4">
                                    <div className="flex flex-col gap-2">
                                        {(kasalar || []).map(k => (
                                            <div key={k.id} className="p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all group">
                                                <div className="flex-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-secondary/20 flex-center text-secondary font-black text-xs">
                                                            {k.type.substring(0, 1).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-black uppercase text-white/90">{k.name}</div>
                                                            <div className="flex items-center gap-2 opacity-60">
                                                                <span className="text-[9px] border border-white/10 px-1 rounded">{k.branch || 'Merkez'}</span>
                                                                <span className="text-[9px] uppercase">{k.type}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-xs font-black text-secondary">₺{(Number(k.balance) || 0).toLocaleString()}</div>
                                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all mt-1">
                                                            <button onClick={() => startEditingKasa(k)} className="text-primary text-[10px] hover:underline">Düzenle</button>
                                                            <button onClick={() => handleDeleteKasa(String(k.id))} className="text-danger text-[10px] hover:underline">Sil</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
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
                                <button className="btn bg-blue-600 hover:bg-blue-700 text-white !border-none transition-colors" onClick={() => {
                                    const currentComms = salesExpenses?.posCommissions || [];
                                    updateSalesExpenses({ ...salesExpenses, posCommissions: [...currentComms, { installment: 'Tek Çekim', rate: 0 }] });
                                }}>+ Yeni Oran Ekle</button>
                            </div>

                            <div className="flex-col gap-3">
                                {(!salesExpenses?.posCommissions || salesExpenses.posCommissions.length === 0) && (
                                    <div className="text-muted text-center p-4 bg-white/5 rounded">Henüz oran tanımlanmamış.</div>
                                )}
                                {salesExpenses?.posCommissions?.map((comm: any, idx: number) => (
                                    <div key={idx} className="flex-between" style={{ padding: '12px', backgroundColor: "transparent", borderRadius: '8px', border: '1px solid var(--border-light)' }}>
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
                    <div className="animate-fade-in-up" style={{ maxWidth: '800px' }}>
                        <h1 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '4px' }}>Profilim</h1>
                        <p style={{ fontSize: '12px', opacity: 0.5, marginBottom: '24px' }}>Hesap bilgilerinizi ve profil ayarlarınızı görüntüleyin</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* INFO CARD */}
                            <div className="p-8 bg-white dark:bg-[#111827] rounded-[20px] border border-slate-200 dark:border-slate-800 shadow-sm" style={{ padding: '32px' }}>
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

                                <div className="flex-col gap-4">
                                    <div className="flex-col gap-1.5">
                                        <label style={{ fontSize: '10px', fontWeight: '900', opacity: 0.5 }}>KULLANICI ADI</label>
                                        <input type="text" readOnly value={currentUser?.username || '-'} className="input-field" style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.05)', opacity: 0.7 }} />
                                    </div>
                                    <div className="flex-col gap-1.5">
                                        <label style={{ fontSize: '10px', fontWeight: '900', opacity: 0.5 }}>ŞUBE</label>
                                        <input type="text" readOnly value={currentUser?.branch || 'Merkez'} className="input-field" style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.05)', opacity: 0.7 }} />
                                    </div>
                                </div>
                            </div>

                            {/* PASSWORD CHANGE */}
                            <div className="card glass p-6">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    🔐 Şifre Değiştir
                                </h3>
                                <div className="flex flex-col gap-3">
                                    <div>
                                        <label className="text-xs font-bold opacity-60">Mevcut Şifre</label>
                                        <input
                                            type="password"
                                            className="input-field w-full"
                                            value={profilePass.old}
                                            onChange={e => setProfilePass({ ...profilePass, old: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold opacity-60">Yeni Şifre</label>
                                        <input
                                            type="password"
                                            className="input-field w-full"
                                            value={profilePass.new}
                                            onChange={e => setProfilePass({ ...profilePass, new: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold opacity-60">Yeni Şifre (Tekrar)</label>
                                        <input
                                            type="password"
                                            className="input-field w-full"
                                            value={profilePass.confirm}
                                            onChange={e => setProfilePass({ ...profilePass, confirm: e.target.value })}
                                        />
                                    </div>
                                    <button
                                        onClick={handlePasswordChange}
                                        className="btn bg-blue-600 hover:bg-blue-700 text-white !border-none transition-colors mt-2 font-bold"
                                    >
                                        Şifreyi Güncelle
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'invoice' && (
                    <div style={{ maxWidth: '600px' }} className="animate-fade-in-up">
                        <h2 style={{ fontSize: '18px', fontWeight: '900', marginBottom: '16px' }}>Fatura Konfigürasyonu</h2>

                        <div className="flex flex-col gap-4 p-8 bg-white dark:bg-[#111827] rounded-[20px] border border-slate-200 dark:border-slate-800 shadow-sm" style={{ padding: '20px' }}>
                            <div className="flex-col gap-1">
                                <label style={{ fontSize: '10px', fontWeight: '900', opacity: 0.5 }}>FATURA NOTU (VARSAYILAN)</label>
                                <textarea
                                    rows={2}
                                    value={invoiceSettings?.defaultNote || ''}
                                    onChange={(e) => updateInvoiceSettings({ ...invoiceSettings, defaultNote: e.target.value })}
                                    style={{ backgroundColor: "transparent", border: '1px solid var(--border-light)', padding: '10px', borderRadius: '8px', color: 'white', fontSize: '12px' }}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex-col gap-1">
                                    <label style={{ fontSize: '10px', fontWeight: '900', opacity: 0.5 }}>SERİ ÖN EKİ</label>
                                    <input type="text" value={invoiceSettings?.prefix || ''} onChange={e => updateInvoiceSettings({ ...invoiceSettings, prefix: e.target.value })} style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: "transparent", border: '1px solid var(--border-light)', color: 'var(--text-main)', fontSize: '12px' }} />
                                </div>
                                <div className="flex-col gap-1">
                                    <label style={{ fontSize: '10px', fontWeight: '900', opacity: 0.5 }}>SIRADAKİ NO</label>
                                    <input type="number" value={invoiceSettings?.nextNumber || 0} readOnly style={{ padding: '8px 12px', borderRadius: '6px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', color: "#64748B", fontSize: '12px', cursor: 'not-allowed' }} />
                                </div>
                            </div>

                            <button className="btn bg-blue-600 hover:bg-blue-700 text-white !border-none transition-colors" style={{ marginTop: '10px', fontSize: '12px', fontWeight: '900', padding: '10px' }}>AYARLARI KAYDET</button>
                        </div>
                    </div>
                )}

                {/* 3.1. SERVİS AYARLARI */}
                {activeTab === 'services' && (
                    <div style={{ maxWidth: '500px' }} className="animate-fade-in-up">
                        <h2 style={{ fontSize: '18px', fontWeight: '900', marginBottom: '16px' }}>Servis Ücretleri</h2>
                        <div className="p-8 bg-white dark:bg-[#111827] rounded-[20px] border border-slate-200 dark:border-slate-800 shadow-sm" style={{ padding: '20px' }}>
                            <div className="flex-col gap-3">
                                {[
                                    { icon: '🏍️', label: 'Motosiklet Bakım', price: localServiceSettings.motoMaintenancePrice, field: 'motoMaintenancePrice' },
                                    { icon: '🚲', label: 'Bisiklet Bakım', price: localServiceSettings.bikeMaintenancePrice, field: 'bikeMaintenancePrice' }
                                ].map(s => (
                                    <div key={s.field} className="flex-between" style={{ padding: '12px 16px', backgroundColor: "transparent", borderRadius: '10px', border: '1px solid var(--border-light)' }}>
                                        <div>
                                            <div style={{ fontWeight: '800', fontSize: '13px' }}>{s.icon} {s.label}</div>
                                            <div style={{ fontSize: '10px', opacity: 0.4 }}>Otomatik gelen işçilik bedeli</div>
                                        </div>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                type="number"
                                                value={s.price}
                                                onChange={(e) => setLocalServiceSettings({ ...localServiceSettings, [s.field]: Number(e.target.value) })}
                                                style={{ width: '90px', padding: '8px 25px 8px 8px', borderRadius: '6px', backgroundColor: "transparent", border: '1px solid var(--primary)', color: 'white', fontWeight: '900', textAlign: 'right', fontSize: '13px' }}
                                            />
                                            <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', fontWeight: '900', fontSize: '11px', color: 'var(--primary)' }}>₺</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={handleSaveServiceSettings}
                                className="btn bg-blue-600 hover:bg-blue-700 text-white !border-none transition-colors w-full mt-4"
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

                        <div className="p-8 bg-white dark:bg-[#111827] rounded-[20px] border border-slate-200 dark:border-slate-800 shadow-sm" style={{ padding: '20px' }}>
                            <div className="flex-col gap-2">
                                {((invoiceSettings as any)?.kdvRates || []).map((rate: any, idx: number) => (
                                    <div key={idx} className="flex-between" style={{ padding: '10px 16px', backgroundColor: "transparent", borderRadius: '10px', border: '1px solid var(--border-light)' }}>
                                        <div className="flex-center gap-3">
                                            <span style={{ fontSize: '14px', fontWeight: '900', color: 'var(--primary)' }}>%{rate}</span>
                                            <span style={{ fontSize: '10px', opacity: 0.5, fontWeight: '700' }}>KDV ORANI</span>
                                        </div>
                                        <button
                                            onClick={() => {
                                                const currentRates = (invoiceSettings as any)?.kdvRates || [];
                                                const newRates = currentRates.filter((_: any, i: number) => i !== idx);
                                                updateInvoiceSettings({ ...invoiceSettings, kdvRates: newRates });
                                            }}
                                            style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: 'var(--danger)', padding: '6px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}
                                        >Sil</button>
                                    </div>
                                ))}
                            </div>

                            <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '10px', border: '1px dashed var(--success)' }}>
                                <div className="flex-col gap-3">
                                    <p style={{ fontSize: '11px', fontWeight: 'bold', opacity: 0.7 }}>Yeni Vergi Oranı Ekle</p>
                                    <div className="flex items-center gap-2">
                                        <div style={{ position: 'relative', flex: 1 }}>
                                            <input
                                                type="number"
                                                placeholder="0"
                                                value={newKdv}
                                                onChange={e => setNewKdv(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') addKdv();
                                                }}
                                                style={{ width: '100%', padding: '10px 30px 10px 12px', borderRadius: '8px', border: '1px solid var(--border-light)', backgroundColor: "transparent", color: 'white', fontSize: '14px', fontWeight: '800' }}
                                            />
                                            <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: '900', fontSize: '12px', opacity: 0.5 }}>%</span>
                                        </div>
                                        <button
                                            onClick={addKdv}
                                            className="btn btn-success"
                                            style={{ padding: '10px 20px', fontSize: '12px', fontWeight: '900', minWidth: '100px', borderRadius: '8px' }}
                                        >
                                            + EKLE
                                        </button>
                                    </div>
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

                            {/* Add New Commission - Streamlined */}
                            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', padding: '15px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                                <div style={{ flex: 2 }}>
                                    <label style={{ fontSize: '10px', fontWeight: 'bold', display: 'block', marginBottom: '4px', opacity: 0.5 }}>TAKSİT TÜRÜ</label>
                                    <input
                                        type="text"
                                        placeholder="Örn: 4 Taksit"
                                        value={newCommission.installment}
                                        onChange={e => setNewCommission({ ...newCommission, installment: e.target.value })}
                                        style={{ width: '100%', padding: '10px 15px', backgroundColor: "transparent", border: '1px solid var(--border-light)', borderRadius: '8px', color: 'white' }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '10px', fontWeight: 'bold', display: 'block', marginBottom: '4px', opacity: 0.5 }}>ORAN (%)</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type="number"
                                            step="0.1"
                                            placeholder="0.0"
                                            value={newCommission.rate || ''}
                                            onChange={e => setNewCommission({ ...newCommission, rate: parseFloat(e.target.value) || 0 })}
                                            style={{ width: '100%', padding: '10px 30px 10px 15px', backgroundColor: "transparent", border: '1px solid var(--border-light)', borderRadius: '8px', color: 'white' }}
                                        />
                                        <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-40%)', fontSize: '12px', opacity: 0.5 }}>%</span>
                                    </div>
                                </div>
                                <button onClick={addCommissionRate} className="btn bg-blue-600 hover:bg-blue-700 text-white !border-none transition-colors" style={{ alignSelf: 'flex-end', height: '42px', padding: '0 20px', borderRadius: '8px' }}>+ EKLE</button>
                            </div>

                            {/* Commission Table */}
                            <table style={{ width: '100%', textAlign: 'left' }}>
                                <thead className="text-muted" style={{ fontSize: '11px', borderBottom: '1px solid var(--border-light)' }}>
                                    <tr><th style={{ padding: '10px' }}>TAKSİT TİPİ</th><th>KOMİSYON ORANI</th><th style={{ textAlign: 'right' }}>İŞLEM</th></tr>
                                </thead>
                                <tbody>
                                    {(salesExpenses?.posCommissions || []).map((comm: any, idx: number) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            {editingCommissionIdx === idx ? (
                                                // EDIT MODE
                                                <>
                                                    <td style={{ padding: '12px 10px' }}>
                                                        <input
                                                            type="text"
                                                            value={editingCommissionData.installment}
                                                            onChange={e => setEditingCommissionData({ ...editingCommissionData, installment: e.target.value })}
                                                            style={{ width: '100%', padding: '8px', backgroundColor: "transparent", border: '1px solid var(--primary)', borderRadius: '4px', color: 'var(--text-main)', fontWeight: 'bold' }}
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
                                                                style={{ width: '80px', padding: '8px', backgroundColor: "transparent", border: '1px solid var(--primary)', borderRadius: '4px', color: 'var(--danger)', fontWeight: 'bold' }}
                                                            />
                                                        </div>
                                                    </td>
                                                    <td style={{ textAlign: 'right' }}>
                                                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                                                            <button onClick={saveEditingCommission} className="btn bg-blue-600 hover:bg-blue-700 text-white !border-none transition-colors" style={{ padding: '4px 12px', fontSize: '12px' }}>Kaydet</button>
                                                            <button onClick={cancelEditingCommission} className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition-colors" style={{ padding: '4px 12px', fontSize: '12px' }}>İptal</button>
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
                                                            <button onClick={() => startEditingCommission(idx)} className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition-colors" style={{ padding: '4px 12px', fontSize: '12px', color: 'var(--primary)' }}>Düzenle</button>
                                                            <button onClick={() => removeCommissionRate(idx)} className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition-colors" style={{ padding: '4px 8px', fontSize: '12px', color: 'var(--danger)' }}>Sil</button>
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
                            <div className="p-8 bg-white dark:bg-[#111827] rounded-[20px] border border-slate-200 dark:border-slate-800 shadow-sm">
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

                            <div className="p-8 bg-white dark:bg-[#111827] rounded-[20px] border border-slate-200 dark:border-slate-800 shadow-sm">
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
                        <div className="p-8 bg-white dark:bg-[#111827] rounded-[20px] border border-slate-200 dark:border-slate-800 shadow-sm">
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
                                <button onClick={addOtherCost} className="btn bg-blue-600 hover:bg-blue-700 text-white !border-none transition-colors" style={{ background: 'var(--warning)' }}>+ Ekle</button>
                            </div>

                            {/* Other Costs List */}
                            <div className="flex-col gap-2">
                                {(salesExpenses?.otherCosts || []).map((cost: any, idx: number) => (
                                    <div key={idx} className="flex-between" style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                                        <span style={{ fontWeight: 'bold' }}>{cost.name}</span>
                                        <div className="flex-center gap-4">
                                            <span style={{ color: 'var(--warning)', fontWeight: 'bold' }}>{cost.cost.toFixed(2)} ₺</span>
                                            <button onClick={() => removeOtherCost(idx)} className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition-colors" style={{ padding: '4px 8px', fontSize: '12px', color: 'var(--danger)' }}>Sil</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>


                        <div className="card" style={{ marginTop: '24px', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid var(--primary)' }}>
                            <h4 style={{ color: 'var(--primary)', marginBottom: '8px' }}>💡 Nasıl Çalışır?</h4>
                            <ul style={{ fontSize: '13px', lineHeight: '1.8', color: "#64748B", paddingLeft: '20px' }}>
                                <li>POS ile yapılan satışlarda, seçilen taksit türüne göre komisyon <b>otomatik hesaplanır</b></li>
                                <li>Her fatura için e-fatura kontör gideri <b>otomatik eklenir</b></li>
                                <li>Fiziksel yazdırma yapılırsa yazdırma maliyeti <b>kara yansıtılır</b></li>
                                <li>Tüm bu giderler <b>Raporlar → Gerçek Karlılık</b> bölümünde detaylı gösterilir</li>
                            </ul>
                        </div>
                    </div>
                )}

                {/* 4. TANIMLAR */}
                {/* 4. SİSTEM TANIMLARI - REDESIGNED */}
                {activeTab === 'definitions' && (
                    <div className="animate-fade-in-up" style={{ height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column' }}>

                        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '24px', height: '100%' }}>

                            {/* SIDEBAR */}
                            <div className="card glass-dark" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
                                <h3 style={{ fontSize: '12px', fontWeight: '900', color: "#64748B", marginBottom: '8px', paddingLeft: '8px' }}>TANIMLAR</h3>
                                {[
                                    { id: 'brands', label: 'Markalar', icon: '🏷️', desc: 'Ürün markaları' },
                                    { id: 'prod_cat', label: 'Ürün Kategorileri', icon: '📂', desc: 'Stok grupları' },
                                    { id: 'cust_class', label: 'Cari Sınıfları', icon: '👥', desc: 'Müşteri tipleri' },
                                    { id: 'supp_class', label: 'Tedarikçi Sınıfları', icon: '🏭', desc: 'Tedarikçi tipleri' },
                                    { id: 'warranties', label: 'Garanti Süreleri', icon: '🛡️', desc: 'Garanti seçenekleri' },
                                    { id: 'vehicle_types', label: 'Taşıt Türleri', icon: '🛵', desc: 'Araç tipleri' },
                                    { id: 'payment_methods', label: 'Ödeme Yöntemleri', icon: '💳', desc: 'Kasa ve banka hesapları', highlight: true }
                                ].map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => { setDefinitionTab(t.id); setNewItemInput(''); }}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '12px',
                                            padding: '12px 14px', borderRadius: '12px',
                                            border: '1px solid',
                                            borderColor: definitionTab === t.id ? 'var(--primary)' : 'transparent',
                                            background: definitionTab === t.id ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                            color: definitionTab === t.id ? 'white' : "#64748B",
                                            textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s',
                                            position: 'relative', overflow: 'hidden'
                                        }}
                                    >
                                        <span style={{ fontSize: '18px' }}>{t.icon}</span>
                                        <div className="flex-col">
                                            <span style={{ fontSize: '13px', fontWeight: '700', color: definitionTab === t.id ? 'white' : 'var(--text-main)' }}>{t.label}</span>
                                            <span style={{ fontSize: '10px', opacity: 0.6 }}>{t.desc}</span>
                                        </div>
                                        {definitionTab === t.id && (
                                            <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '4px', background: 'var(--primary)' }} />
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* MAIN CONTENT Area */}
                            <div className="flex-col gap-6" style={{ overflowY: 'auto', paddingRight: '10px' }}>

                                {/* Header & Input */}
                                <div className="card glass p-6">
                                    <h2 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '8px' }}>
                                        {definitionTab === 'brands' && 'Marka Tanımları'}
                                        {definitionTab === 'prod_cat' && 'Ürün Kategorileri'}
                                        {definitionTab === 'cust_class' && 'Cari Sınıfları'}
                                        {definitionTab === 'supp_class' && 'Tedarikçi Sınıfları'}
                                        {definitionTab === 'warranties' && 'Garanti Seçenekleri'}
                                        {definitionTab === 'vehicle_types' && 'Taşıt Türleri'}
                                        {definitionTab === 'payment_methods' && 'Ödeme Yöntemleri'}
                                    </h2>
                                    <p className="text-muted mb-6" style={{ fontSize: '13px' }}>
                                        Bu liste genel sistemde seçilebilir seçenekler olarak görünecektir.
                                    </p>

                                    <div className="flex gap-4 items-end">
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '6px', color: "#64748B" }}>YENİ EKLE</label>
                                            <div className="flex gap-2">
                                                {/* Payment Method Type Selector */}
                                                {definitionTab === 'payment_methods' && (
                                                    <select
                                                        value={newPaymentMethod.type}
                                                        onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, type: e.target.value as any })}
                                                        style={{
                                                            padding: '14px', borderRadius: '12px', backgroundColor: "transparent",
                                                            border: '1px solid var(--border-light)', color: 'white', fontWeight: 'bold', width: '140px'
                                                        }}
                                                    >
                                                        <option value="cash">Nakit</option>
                                                        <option value="card">Kredi Kartı</option>
                                                        <option value="transfer">Havale/EFT</option>
                                                    </select>
                                                )}

                                                <input
                                                    type="text"
                                                    placeholder={definitionTab === 'payment_methods' ? "Hesap Adı (örn: Akbank)" : "Yeni değer yazın..."}
                                                    value={newItemInput}
                                                    onChange={e => setNewItemInput(e.target.value)}
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter') {
                                                            if (definitionTab === 'payment_methods') {
                                                                // Use the local newPaymentMethod state + input
                                                                const id = Math.random().toString(36).substr(2, 9);
                                                                const icon = newPaymentMethod.type === 'cash' ? '💵' : (newPaymentMethod.type === 'card' ? '💳' : '🏦');
                                                                const newVal = {
                                                                    id,
                                                                    label: newItemInput || 'Yeni Hesap',
                                                                    type: newPaymentMethod.type,
                                                                    icon,
                                                                    linkedKasaId: ''
                                                                };
                                                                // Manual update call
                                                                const updated = [...paymentMethods, newVal];
                                                                updatePaymentMethods(updated).then(() => {
                                                                    setNewItemInput('');
                                                                    if (showSuccess) showSuccess('Başarılı', 'Ödeme yöntemi eklendi.');
                                                                }).catch(() => {
                                                                    if (showError) showError('Hata', 'Eklenemedi');
                                                                });
                                                            } else {
                                                                // Standard Definitions
                                                                if (definitionTab === 'brands') addDefinition('brands', brands, setBrands);
                                                                else if (definitionTab === 'prod_cat') addDefinition('prod_cat', prodCats, setProdCats);
                                                                else if (definitionTab === 'cust_class') addDefinition('custClasses', custClasses, setCustClasses);
                                                                else if (definitionTab === 'supp_class') addDefinition('suppClasses', suppClasses, setSuppClasses);
                                                                else if (definitionTab === 'warranties') addDefinition('warranties', warranties, setWarranties);
                                                                else if (definitionTab === 'vehicle_types') addDefinition('vehicleTypes', vehicleTypes, setVehicleTypes);
                                                            }
                                                        }
                                                    }}
                                                    className="w-full"
                                                    style={{
                                                        padding: '14px 20px', borderRadius: '12px', backgroundColor: "transparent",
                                                        border: '1px solid var(--border-light)', color: 'white', fontSize: '15px'
                                                    }}
                                                />
                                                <button
                                                    onClick={() => {
                                                        const e = { key: 'Enter' } as any;
                                                        // Trigger manual logic same as Enter
                                                        if (definitionTab === 'payment_methods') {
                                                            const id = Math.random().toString(36).substr(2, 9);
                                                            const icon = newPaymentMethod.type === 'cash' ? '💵' : (newPaymentMethod.type === 'card' ? '💳' : '🏦');
                                                            const newVal = {
                                                                id,
                                                                label: newItemInput || 'Yeni Hesap',
                                                                type: newPaymentMethod.type,
                                                                icon,
                                                                linkedKasaId: ''
                                                            };
                                                            updatePaymentMethods([...paymentMethods, newVal]).then(() => {
                                                                setNewItemInput('');
                                                                showSuccess('Başarılı', 'Ödeme yöntemi eklendi.');
                                                            });
                                                        } else {
                                                            if (definitionTab === 'brands') addDefinition('brands', brands, setBrands);
                                                            else if (definitionTab === 'prod_cat') addDefinition('prod_cat', prodCats, setProdCats);
                                                            else if (definitionTab === 'cust_class') addDefinition('custClasses', custClasses, setCustClasses);
                                                            else if (definitionTab === 'supp_class') addDefinition('suppClasses', suppClasses, setSuppClasses);
                                                            else if (definitionTab === 'warranties') addDefinition('warranties', warranties, setWarranties);
                                                            else if (definitionTab === 'vehicle_types') addDefinition('vehicleTypes', vehicleTypes, setVehicleTypes);
                                                        }
                                                    }}
                                                    className="btn bg-blue-600 hover:bg-blue-700 text-white !border-none transition-colors"
                                                    style={{ padding: '0 24px', borderRadius: '12px', fontSize: '20px' }}
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* LIST AREA */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                                    {definitionTab === 'payment_methods' ?
                                        (paymentMethods || []).map((pm: any, i: number) => (
                                            <div key={pm.id || i} className="card glass-hover animate-scale-in" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                <div className="flex items-center gap-3">
                                                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                                                        {pm.icon || '💰'}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 'bold' }}>{pm.label}</div>
                                                        <div style={{ fontSize: '11px', opacity: 0.5 }}>
                                                            {pm.type === 'card' ? 'Kredi Kartı' : pm.type === 'transfer' ? 'Banka' : 'Nakit'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => quickRemovePaymentMethod(pm.id)}
                                                    style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', background: 'rgba(255,50,50,0.1)', color: 'var(--danger)', border: 'none', cursor: 'pointer' }}
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        ))
                                        : (
                                            (definitionTab === 'brands' ? (brands || []) :
                                                definitionTab === 'prod_cat' ? (prodCats || []) :
                                                    definitionTab === 'cust_class' ? (custClasses || []) :
                                                        definitionTab === 'supp_class' ? (suppClasses || []) :
                                                            definitionTab === 'vehicle_types' ? (vehicleTypes || []) : (warranties || [])
                                            ).map((item: string, i: number) => (
                                                <div key={i} className="card glass-hover animate-scale-in" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontWeight: '600' }}>{item}</span>
                                                    <button
                                                        onClick={() => {
                                                            if (definitionTab === 'brands') removeDefinition('brands', item, brands, setBrands);
                                                            else if (definitionTab === 'prod_cat') removeDefinition('prodCats', item, prodCats, setProdCats);
                                                            else if (definitionTab === 'cust_class') removeDefinition('custClasses', item, custClasses, setCustClasses);
                                                            else if (definitionTab === 'supp_class') removeDefinition('suppClasses', item, suppClasses, setSuppClasses);
                                                            else if (definitionTab === 'warranties') removeDefinition('warranties', item, warranties, setWarranties);
                                                            else if (definitionTab === 'vehicle_types') removeDefinition('vehicleTypes', item, vehicleTypes, setVehicleTypes);
                                                        }}
                                                        style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', background: 'transparent', color: 'var(--danger)', border: '1px solid rgba(255,50,50,0.2)', cursor: 'pointer' }}
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                </div>

                                {/* Empty State Hint */}
                                {(definitionTab !== 'payment_methods' ? (
                                    (definitionTab === 'brands' ? brands :
                                        definitionTab === 'prod_cat' ? prodCats :
                                            definitionTab === 'cust_class' ? custClasses :
                                                definitionTab === 'supp_class' ? suppClasses :
                                                    definitionTab === 'vehicle_types' ? vehicleTypes : warranties
                                    ).length === 0
                                ) : paymentMethods.length === 0) && (
                                        <div className="flex-center flex-col text-muted" style={{ padding: '40px', opacity: 0.5 }}>
                                            <span style={{ fontSize: '30px', marginBottom: '10px' }}>📝</span>
                                            <span>Liste boş. Yeni eklemek için yukarıdaki alanı kullanın.</span>
                                        </div>
                                    )}
                            </div>
                        </div>
                    </div>
                )}

                {/* 5. BACKUP & CLOUD */}
                {activeTab === 'backup' && (
                    <div style={{ maxWidth: '600px' }} className="animate-fade-in-up">
                        <h2 style={{ fontSize: '18px', fontWeight: '900', marginBottom: '16px' }}>Güvenlik & Bulut</h2>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="p-8 bg-white dark:bg-[#111827] rounded-[20px] border border-slate-200 dark:border-slate-800 shadow-sm" style={{ borderLeft: '3px solid var(--success)', padding: '16px' }}>
                                <div style={{ fontSize: '10px', fontWeight: '900', opacity: 0.5 }}>BULUT DURUMU</div>
                                <div style={{ fontSize: '15px', fontWeight: '900', color: 'var(--success)', marginTop: '4px' }}>✓ Senkronize</div>
                            </div>
                            <div className="p-8 bg-white dark:bg-[#111827] rounded-[20px] border border-slate-200 dark:border-slate-800 shadow-sm" style={{ padding: '16px' }}>
                                <div style={{ fontSize: '10px', fontWeight: '900', opacity: 0.5 }}>DEPOLAMA</div>
                                <div style={{ fontSize: '15px', fontWeight: '900', marginTop: '4px' }}>1.2 GB / 10 GB</div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4 p-8 bg-white dark:bg-[#111827] rounded-[20px] border border-slate-200 dark:border-slate-800 shadow-sm" style={{ padding: '20px' }}>
                            <div className="flex-between" style={{ background: 'rgba(59, 130, 246, 0.05)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '900', color: 'var(--primary)', fontSize: '13px' }}>🛡️ Geri Yükleme Noktası</div>
                                    <p style={{ fontSize: '10px', opacity: 0.5, marginTop: '2px' }}>Kritik işlemlerden önce Snapshot alın.</p>
                                </div>
                                <button onClick={() => { /* ... */ }} className="btn bg-blue-600 hover:bg-blue-700 text-white !border-none transition-colors" style={{ fontSize: '11px', fontWeight: '900', padding: '10px 15px' }}>SNAPSHOT AL</button>
                            </div>

                            <div className="flex-between" style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                <div>
                                    <div style={{ fontWeight: '800', fontSize: '13px' }}>Manuel SQL Yedekleme</div>
                                    <p style={{ fontSize: '10px', opacity: 0.5 }}>Veritabanını JSON olarak indir.</p>
                                </div>
                                <button onClick={() => { /* ... */ }} className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition-colors" style={{ fontSize: '12px', border: '1px solid var(--border-light)' }}>⬇ İNDİR</button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'notifications' && (
                    <div style={{ maxWidth: '500px' }} className="animate-fade-in-up">
                        <h2 style={{ fontSize: '18px', fontWeight: '900', marginBottom: '16px' }}>Bildirim Tercihleri</h2>

                        <div className="flex flex-col gap-4 p-8 bg-white dark:bg-[#111827] rounded-[20px] border border-slate-200 dark:border-slate-800 shadow-sm" style={{ padding: '20px' }}>
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
                            <button className="btn bg-blue-600 hover:bg-blue-700 text-white !border-none transition-colors" style={{ height: '38px', fontSize: '11px', fontWeight: '900', marginTop: '4px' }} onClick={saveNotifSettings}>DEĞİŞİKLİKLERİ KAYDET</button>
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
                            <button className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold transition-colors" style={{ height: '32px', fontSize: '11px', fontWeight: '800' }} onClick={fetchLogs} disabled={isLogsLoading}>
                                {isLogsLoading ? '...' : '🔄 YENİLE'}
                            </button>
                        </div>

                        <div className="p-8 bg-white dark:bg-[#111827] rounded-[20px] border border-slate-200 dark:border-slate-800 shadow-sm" style={{ padding: '0', overflow: 'hidden' }}>
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
                            <h1 style={{ fontSize: '24px', fontWeight: '900', color: 'var(--text-main)', marginBottom: '4px' }}>🎁 Sadakat & Kampanya Merkezi</h1>
                            <p className="text-muted" style={{ fontSize: '13px' }}>Müşteri sadakatini artıracak indirim, puan ve hediye çeki kurgularını yönetin.</p>
                        </div>

                        {/* SUB-TABS NAVIGATION */}
                        <div style={{ display: 'flex', gap: '8px', backgroundColor: "transparent", padding: '6px', borderRadius: '14px', border: '1px solid var(--border-light)', width: 'fit-content' }}>
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
                                        color: campaignSubTab === t.id ? 'white' : "#64748B",
                                        boxShadow: campaignSubTab === t.id ? '0 4px 12px var(--primary)' : 'none'
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
                                        <div className="p-8 bg-white dark:bg-[#111827] rounded-[20px] border border-slate-200 dark:border-slate-800 shadow-sm" style={{ border: '1px solid var(--primary)' }}>
                                            <h3 className="mb-4" style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>+</div>
                                                {editingCampaignId ? 'Kampanyayı Düzenle' : 'Yeni Kampanya Tanımla'}
                                            </h3>
                                            <div className="flex-col gap-4">
                                                <div className="flex-col gap-2">
                                                    <label style={{ fontSize: '11px', fontWeight: '800', opacity: 0.6 }}>KAMPANYA ADI</label>
                                                    <input type="text" value={newCampaign.name} onChange={e => setNewCampaign({ ...newCampaign, name: e.target.value })} placeholder="Örn: Hafta Sonu Nakit İndirimi" style={{ padding: '12px', backgroundColor: "transparent", border: '1px solid var(--border-light)', borderRadius: '10px', color: 'white', fontSize: '14px' }} />
                                                </div>

                                                <div className="grid-cols-2 gap-4">
                                                    <div className="flex-col gap-2">
                                                        <label style={{ fontSize: '11px', fontWeight: '800', opacity: 0.6 }}>KAMPANYA TİPİ</label>
                                                        <select value={newCampaign.type} onChange={e => setNewCampaign({ ...newCampaign, type: e.target.value })} style={{ padding: '12px', backgroundColor: "transparent", border: '1px solid var(--border-light)', borderRadius: '10px', color: 'white' }}>
                                                            <option value="payment_method_discount">💳 Ödeme İndirimi</option>
                                                            <option value="buy_x_get_discount">🏷️ X Alana % İndirim</option>
                                                            <option value="buy_x_get_free">🎁 X Alana Y Bedava</option>
                                                            <option value="loyalty_points">💰 Sadakat Puanı</option>
                                                        </select>
                                                    </div>
                                                    <div className="flex-col gap-2">
                                                        <label style={{ fontSize: '11px', fontWeight: '800', opacity: 0.6 }}>
                                                            {newCampaign.type === 'loyalty_points' ? 'KAZANIM (%)' : 'TEMEL İNDİRİM (%)'}
                                                        </label>
                                                        <input type="number"
                                                            value={(newCampaign.type === 'loyalty_points' ? (newCampaign.pointsRate || 0) : (newCampaign.discountRate || 0)) * 100}
                                                            onChange={e => {
                                                                const val = parseFloat(e.target.value) / 100;
                                                                if (newCampaign.type === 'loyalty_points') setNewCampaign({ ...newCampaign, pointsRate: val });
                                                                else setNewCampaign({ ...newCampaign, discountRate: val });
                                                            }}
                                                            style={{ padding: '12px', backgroundColor: "transparent", border: '1px solid var(--border-light)', borderRadius: '10px', color: 'white' }} />
                                                    </div>
                                                </div>

                                                {/* CONDITIONAL FIELDS BASED ON TYPE */}
                                                {(newCampaign.type === 'buy_x_get_discount' || newCampaign.type === 'buy_x_get_free') && (
                                                    <div className="card" style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '15px' }}>
                                                        <h4 style={{ fontSize: '12px', fontWeight: '900', marginBottom: '12px', color: 'var(--primary)' }}>KAMPANYA KURALLARI (X ALANA Y DURUMU)</h4>
                                                        <div className="flex-col gap-4">
                                                            <div className="flex gap-4">
                                                                <div className="flex-1 flex-col gap-1">
                                                                    <label style={{ fontSize: '10px', fontWeight: '800', opacity: 0.5 }}>ALINACAK MİKTAR (X)</label>
                                                                    <input
                                                                        type="number"
                                                                        value={newCampaign.conditions.buyQuantity || 1}
                                                                        onChange={e => setNewCampaign({ ...newCampaign, conditions: { ...newCampaign.conditions, buyQuantity: parseInt(e.target.value) } })}
                                                                        style={{ padding: '10px', backgroundColor: "transparent", border: '1px solid var(--border-light)', borderRadius: '8px', color: 'white' }}
                                                                    />
                                                                </div>
                                                                {newCampaign.type === 'buy_x_get_discount' && (
                                                                    <div className="flex-1 flex-col gap-1">
                                                                        <label style={{ fontSize: '10px', fontWeight: '800', opacity: 0.5 }}>İNDİRİM ORANI (%)</label>
                                                                        <input
                                                                            type="number"
                                                                            value={newCampaign.conditions.rewardValue || 0}
                                                                            onChange={e => setNewCampaign({ ...newCampaign, conditions: { ...newCampaign.conditions, rewardValue: parseFloat(e.target.value) } })}
                                                                            style={{ padding: '10px', backgroundColor: "transparent", border: '1px solid var(--border-light)', borderRadius: '8px', color: 'white' }}
                                                                        />
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {newCampaign.type === 'buy_x_get_free' && (
                                                                <div className="flex-col gap-2">
                                                                    <label style={{ fontSize: '10px', fontWeight: '800', opacity: 0.5 }}>BEDELSİZ VERİLECEK ÜRÜN</label>
                                                                    <select
                                                                        value={newCampaign.conditions.rewardProductId || ''}
                                                                        onChange={e => setNewCampaign({ ...newCampaign, conditions: { ...newCampaign.conditions, rewardProductId: e.target.value } })}
                                                                        style={{ padding: '10px', backgroundColor: "transparent", border: '1px solid var(--border-light)', borderRadius: '8px', color: 'white' }}
                                                                    >
                                                                        <option value="">Aynı Üründen</option>
                                                                        {(products || []).map((p: any) => (
                                                                            <option key={p.id} value={p.id}>{p.name}</option>
                                                                        ))}
                                                                    </select>
                                                                    <div className="flex-col gap-1 mt-2">
                                                                        <label style={{ fontSize: '10px', fontWeight: '800', opacity: 0.5 }}>BEDELSİZ ADEDİ</label>
                                                                        <input
                                                                            type="number"
                                                                            value={newCampaign.conditions.rewardQuantity || 1}
                                                                            onChange={e => setNewCampaign({ ...newCampaign, conditions: { ...newCampaign.conditions, rewardQuantity: parseInt(e.target.value) } })}
                                                                            style={{ padding: '10px', width: '100px', backgroundColor: "transparent", border: '1px solid var(--border-light)', borderRadius: '8px', color: 'white' }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex-col gap-2">
                                                    <label style={{ fontSize: '11px', fontWeight: '800', opacity: 0.6 }}>HEDEF MÜŞTERİ GRUPLARI (SAHA SATIŞ ÖZEL)</label>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '10px', backgroundColor: "transparent", borderRadius: '10px', border: '1px solid var(--border-light)', minHeight: '60px' }}>
                                                        {(custClasses || []).map(cc => (
                                                            <button
                                                                key={cc}
                                                                onClick={() => {
                                                                    const current = newCampaign.targetCustomerCategoryIds || [];
                                                                    const next = current.includes(cc) ? current.filter((x: string) => x !== cc) : [...current, cc];
                                                                    setNewCampaign({ ...newCampaign, targetCustomerCategoryIds: next });
                                                                }}
                                                                style={{
                                                                    padding: '4px 10px',
                                                                    borderRadius: '6px',
                                                                    fontSize: '11px',
                                                                    fontWeight: '700',
                                                                    background: newCampaign.targetCustomerCategoryIds?.includes(cc) ? 'var(--info)' : 'rgba(255,255,255,0.05)',
                                                                    border: 'none',
                                                                    color: 'white',
                                                                    cursor: 'pointer'
                                                                }}
                                                            >{cc}</button>
                                                        ))}
                                                        {(custClasses || []).length === 0 && <span style={{ fontSize: '10px', opacity: 0.3 }}>Kategori tanımlanmamış.</span>}
                                                    </div>
                                                </div>

                                                <div className="flex-col gap-2">
                                                    <label style={{ fontSize: '11px', fontWeight: '800', opacity: 0.6 }}>GEÇERLİ OLDUĞU MARKALAR (Boşsa Tümü)</label>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '10px', backgroundColor: "transparent", borderRadius: '10px', border: '1px solid var(--border-light)', minHeight: '60px' }}>
                                                        {(allBrands || []).map(b => (
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
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '10px', backgroundColor: "transparent", borderRadius: '10px', border: '1px solid var(--border-light)', minHeight: '60px' }}>
                                                        {(allCats || []).map(c => (
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
                                                        <select style={{ padding: '12px', backgroundColor: "transparent", border: '1px solid var(--border-light)', borderRadius: '10px', color: 'white' }}
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
                                                    <button onClick={addCampaign} className="bg-blue-600 hover:bg-blue-700 text-white !border-none transition-colors" style={{ flex: 1, height: '48px', borderRadius: '12px', fontWeight: '900' }}>
                                                        {editingCampaignId ? 'KAMPANYAYI GÜNCELLE' : 'KAMPANYAYI OLUŞTUR'}
                                                    </button>
                                                    {editingCampaignId && (
                                                        <button onClick={() => {
                                                            setEditingCampaignId(null);
                                                            setNewCampaign({
                                                                name: '',
                                                                type: 'payment_method_discount',
                                                                discountRate: 0,
                                                                pointsRate: 0,
                                                                conditions: {
                                                                    brands: [],
                                                                    categories: [],
                                                                    paymentMethod: '',
                                                                    buyQuantity: 1,
                                                                    rewardProductId: '',
                                                                    rewardQuantity: 1,
                                                                    rewardValue: 0,
                                                                    rewardType: 'percentage_discount'
                                                                },
                                                                targetCustomerCategoryIds: []
                                                            });
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
                                                    <div key={camp.id} style={{ backgroundColor: "transparent", padding: '16px', borderRadius: '14px', border: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: camp.type === 'loyalty_points' ? 'rgba(0, 240, 255, 0.1)' : (camp.type === 'buy_x_get_free' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                                                                {camp.type === 'loyalty_points' ? '💎' : (camp.type === 'buy_x_get_free' ? '🎁' : (camp.type === 'buy_x_get_discount' ? '🏷️' : '💳'))}
                                                            </div>
                                                            <div>
                                                                <div style={{ fontWeight: '800', fontSize: '14px', marginBottom: '2px' }}>{camp.name}</div>
                                                                <div style={{ fontSize: '11px', color: "#64748B", display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                                    <span>
                                                                        {camp.type === 'loyalty_points' && 'Sadakat Puanı'}
                                                                        {camp.type === 'payment_method_discount' && 'Ödeme İndirimi'}
                                                                        {camp.type === 'buy_x_get_discount' && `${camp.conditions.buyQuantity} Alana %${camp.conditions.rewardValue} İndirim`}
                                                                        {camp.type === 'buy_x_get_free' && `${camp.conditions.buyQuantity} Alana ${camp.conditions.rewardQuantity} Hediye`}
                                                                    </span>
                                                                    {camp.conditions.brands?.length > 0 && <span>• {camp.conditions.brands.length} Marka</span>}
                                                                    {camp.targetCustomerCategoryIds?.length > 0 && <span>• {camp.targetCustomerCategoryIds.length} Müşteri Grubu</span>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                                            <div style={{ textAlign: 'right' }}>
                                                                <div style={{ fontSize: '18px', fontWeight: '900', color: 'var(--success)' }}>
                                                                    {camp.type === 'buy_x_get_free' ? `+${camp.conditions.rewardQuantity}` : `%${((camp.discountRate || camp.pointsRate || 0) * 100).toFixed(0)}`}
                                                                </div>
                                                                <div style={{ fontSize: '9px', fontWeight: '800', opacity: 0.4 }}>{camp.type === 'buy_x_get_free' ? 'ADET' : 'ORAN'}</div>
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
                                <div className="p-8 bg-white dark:bg-[#111827] rounded-[20px] border border-slate-200 dark:border-slate-800 shadow-sm" style={{ border: '1px solid rgba(100,116,139, 0.2)' }}>
                                    <div style={{ display: 'flex', gap: '24px', alignItems: 'center', marginBottom: '30px' }}>
                                        <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', boxShadow: '0 8px 16px rgba(100,116,139, 0.2)' }}>🔗</div>
                                        <div>
                                            <h3 style={{ fontSize: '20px', fontWeight: '900', marginBottom: '4px' }}>Referans & Ödül Sistemi</h3>
                                            <p className="text-muted" style={{ fontSize: '13px' }}>Müşterilerinizin işletmenizi başkalarına tavsiye etmesini teşvik edin.</p>
                                        </div>
                                    </div>

                                    <div className="grid-cols-2 gap-8 mb-8">
                                        <div style={{ backgroundColor: "transparent", padding: '20px', borderRadius: '16px', border: '1px solid var(--border-light)' }}>
                                            <div className="flex-between mb-2">
                                                <label style={{ fontSize: '11px', fontWeight: '800', opacity: 0.5 }}>REFERANS OLAN KİŞİYE ÖDÜL</label>
                                                <select
                                                    value={referralSettings.referrerRewardType || 'percent'}
                                                    onChange={e => setReferralSettings({ ...referralSettings, referrerRewardType: e.target.value })}
                                                    style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '6px', color: 'white', fontSize: '11px', padding: '4px 8px' }}
                                                >
                                                    <option value="percent">Yüzde (%)</option>
                                                    <option value="amount">Tutar (₺)</option>
                                                </select>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                <div style={{ flex: 1 }}>
                                                    <input type="number"
                                                        value={referralSettings.referrerDiscount}
                                                        onChange={e => setReferralSettings({ ...referralSettings, referrerDiscount: parseFloat(e.target.value) || 0 })}
                                                        style={{ width: '100%', fontSize: '24px', fontWeight: '900', background: 'transparent', border: 'none', color: 'white', outline: 'none' }}
                                                    />
                                                    <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--primary)' }}>
                                                        {referralSettings.referrerRewardType === 'amount' ? 'İNDİRİM TUTARI (₺)' : 'İNDİRİM ORANI (%)'}
                                                    </div>
                                                </div>
                                                <div style={{ fontSize: '24px', opacity: 0.2 }}>
                                                    {referralSettings.referrerRewardType === 'amount' ? '₺' : '%'}
                                                </div>
                                            </div>
                                            <p style={{ fontSize: '11px', marginTop: '15px', color: "#64748B" }}>Mevcut müşteri, yeni birini getirdiğinde bu değerde bir indirim kuponu kazanır.</p>
                                        </div>

                                        <div style={{ backgroundColor: "transparent", padding: '20px', borderRadius: '16px', border: '1px solid var(--border-light)' }}>
                                            <div className="flex-between mb-2">
                                                <label style={{ fontSize: '11px', fontWeight: '800', opacity: 0.5 }}>YENİ GELEN KİŞİYE HEDİYE</label>
                                                <select
                                                    value={referralSettings.refereeGiftType || 'amount'}
                                                    onChange={e => setReferralSettings({ ...referralSettings, refereeGiftType: e.target.value })}
                                                    style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '6px', color: 'white', fontSize: '11px', padding: '4px 8px' }}
                                                >
                                                    <option value="percent">Yüzde (%)</option>
                                                    <option value="amount">Tutar (₺)</option>
                                                </select>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                <div style={{ flex: 1 }}>
                                                    <input type="number"
                                                        value={referralSettings.refereeGift}
                                                        onChange={e => setReferralSettings({ ...referralSettings, refereeGift: parseFloat(e.target.value) || 0 })}
                                                        style={{ width: '100%', fontSize: '24px', fontWeight: '900', background: 'transparent', border: 'none', color: 'white', outline: 'none' }}
                                                    />
                                                    <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--success)' }}>
                                                        {referralSettings.refereeGiftType === 'percent' ? 'HEDİYE ORANI (%)' : 'HEDİYE TUTAR (₺)'}
                                                    </div>
                                                </div>
                                                <div style={{ fontSize: '24px', opacity: 0.2 }}>
                                                    {referralSettings.refereeGiftType === 'percent' ? '%' : '₺'}
                                                </div>
                                            </div>
                                            <p style={{ fontSize: '11px', marginTop: '15px', color: "#64748B" }}>Yeni müşteri ilk alışverişinde bu değerde anında hoşgeldin indirimi alır.</p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={saveReferralSettings}
                                        className="btn bg-blue-600 hover:bg-blue-700 text-white !border-none transition-colors w-full"
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
                                        <div className="p-8 bg-white dark:bg-[#111827] rounded-[20px] border border-slate-200 dark:border-slate-800 shadow-sm">
                                            <h3 className="mb-6" style={{ fontSize: '16px' }}>🎫 Kod Üretici</h3>
                                            <div className="flex-col gap-5">
                                                <div className="flex-col gap-2">
                                                    <label style={{ fontSize: '11px', fontWeight: '800', opacity: 0.5 }}>KAMPANYA ADI</label>
                                                    <input type="text" value={newCoupon.campaignName} onChange={e => setNewCoupon({ ...newCoupon, campaignName: e.target.value })} placeholder="Yılbaşı Paket İndirimi" style={{ padding: '12px', backgroundColor: "transparent", border: '1px solid var(--border-light)', borderRadius: '10px', color: 'white' }} />
                                                </div>

                                                <div className="grid-cols-2 gap-4">
                                                    <div className="flex-col gap-2">
                                                        <label style={{ fontSize: '11px', fontWeight: '800', opacity: 0.5 }}>ÜRETİLECEK ADET</label>
                                                        <input type="number" value={newCoupon.count} onChange={e => setNewCoupon({ ...newCoupon, count: parseInt(e.target.value) || 1 })} style={{ padding: '12px', backgroundColor: "transparent", border: '1px solid var(--border-light)', borderRadius: '10px', color: 'white' }} />
                                                    </div>
                                                    <div className="flex-col gap-2">
                                                        <label style={{ fontSize: '11px', fontWeight: '800', opacity: 0.5 }}>SON KULLANIM</label>
                                                        <input type="date" value={newCoupon.expiryDate} onChange={e => setNewCoupon({ ...newCoupon, expiryDate: e.target.value })} style={{ padding: '12px', backgroundColor: "transparent", border: '1px solid var(--border-light)', borderRadius: '10px', color: 'white' }} />
                                                    </div>
                                                </div>

                                                <div className="grid-cols-2 gap-4">
                                                    <div className="flex-col gap-2">
                                                        <label style={{ fontSize: '11px', fontWeight: '800', opacity: 0.5 }}>İNDİRİM TİPİ</label>
                                                        <select value={newCoupon.type} onChange={e => setNewCoupon({ ...newCoupon, type: e.target.value })} style={{ padding: '12px', backgroundColor: "transparent", border: '1px solid var(--border-light)', borderRadius: '10px', color: 'white' }}>
                                                            <option value="percent">İndirim Oranı (%)</option>
                                                            <option value="amount">İndirim Tutarı (₺)</option>
                                                        </select>
                                                    </div>
                                                    <div className="flex-col gap-2">
                                                        <label style={{ fontSize: '11px', fontWeight: '800', opacity: 0.5 }}>DEĞER</label>
                                                        <input type="number" value={newCoupon.value} onChange={e => setNewCoupon({ ...newCoupon, value: parseFloat(e.target.value) || 0 })} style={{ padding: '12px', backgroundColor: "transparent", border: '1px solid var(--border-light)', borderRadius: '10px', color: 'white' }} />
                                                    </div>
                                                </div>

                                                <div className="grid-cols-2 gap-4">
                                                    <div className="flex-col gap-2">
                                                        <label style={{ fontSize: '11px', fontWeight: '800', opacity: 0.5 }}>SEPET LİMİTİ (Min ₺)</label>
                                                        <input type="number" value={newCoupon.minPurchaseAmount} onChange={e => setNewCoupon({ ...newCoupon, minPurchaseAmount: parseFloat(e.target.value) || 0 })} placeholder="0 (Limitsiz)" style={{ padding: '12px', backgroundColor: "transparent", border: '1px solid var(--border-light)', borderRadius: '10px', color: 'white' }} />
                                                    </div>
                                                    <div className="flex-col gap-2">
                                                        <label style={{ fontSize: '11px', fontWeight: '800', opacity: 0.5 }}>KULLANIM HAKKI</label>
                                                        <select value={newCoupon.usageLimit} onChange={e => setNewCoupon({ ...newCoupon, usageLimit: parseInt(e.target.value) })} style={{ padding: '12px', backgroundColor: "transparent", border: '1px solid var(--border-light)', borderRadius: '10px', color: 'white' }}>
                                                            <option value={1}>1 Seferlik (Kullanınca Biter)</option>
                                                            <option value={0}>Sürekli (Her Alışverişte)</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="grid-cols-2 gap-4">
                                                    <div className="flex-col gap-2">
                                                        <label style={{ fontSize: '11px', fontWeight: '800', opacity: 0.5 }}>MARKA KISITI</label>
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', padding: '8px', backgroundColor: "transparent", borderRadius: '8px', border: '1px solid var(--border-light)', minHeight: '50px' }}>
                                                            {(allBrands || []).map(b => (
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
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', padding: '8px', backgroundColor: "transparent", borderRadius: '8px', border: '1px solid var(--border-light)', minHeight: '50px' }}>
                                                            {(allCats || []).map(c => (
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
                                                    className="btn bg-blue-600 hover:bg-blue-700 text-white !border-none transition-colors w-full"
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
                                                    className="bg-blue-600 hover:bg-blue-700 text-white !border-none transition-colors"
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
                    <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
                        <h2 style={{ marginBottom: '20px', color: 'var(--danger)', fontSize: '24px', fontWeight: '900' }}>⚠️ KRİTİK SİSTEM SIFIRLAMA</h2>

                        <div className="p-8 bg-white dark:bg-[#111827] rounded-[20px] border border-slate-200 dark:border-slate-800 shadow-sm" style={{ border: '2px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.05)', padding: '40px', borderRadius: '24px' }}>
                            <div style={{ fontSize: '64px', marginBottom: '20px' }}>🧨</div>
                            <h3 style={{ fontSize: '22px', fontWeight: '900', marginBottom: '15px', color: 'white' }}>Veri Temizleme ve Yapılandırma</h3>
                            <p className="text-muted" style={{ marginBottom: '30px', lineHeight: '1.6', fontSize: '14px' }}>
                                Lütfen sıfırlamak istediğiniz modülleri seçin. Bu işlem seçilen kategorilerdeki tüm verileri <b>KALICI OLARAK</b> silecektir.
                            </p>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '15px', textAlign: 'left', marginBottom: '40px', background: 'rgba(0,0,0,0.2)', padding: '25px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '10px', borderRadius: '12px', background: resetOptions.all ? 'rgba(239, 68, 68, 0.2)' : 'transparent' }}>
                                    <input type="checkbox" checked={resetOptions.all} onChange={e => setResetOptions({ ...resetOptions, all: e.target.checked })} style={{ width: '18px', height: '18px', accentColor: 'var(--danger)' }} />
                                    <span style={{ fontWeight: '800', fontSize: '14px', color: resetOptions.all ? 'white' : '#888' }}>HER ŞEYİ SİL (TAM SIFIRLAMA)</span>
                                </label>

                                <hr style={{ gridColumn: '1 / -1', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)', margin: '5px 0' }} />

                                {[
                                    { id: 'customers', label: 'Cariler' },
                                    { id: 'inventory', label: 'Envanter' },
                                    { id: 'ecommerce', label: 'E-ticaret Satışları' },
                                    { id: 'pos', label: 'Mağaza Satışları' },
                                    { id: 'receivables', label: 'Alacaklar' },
                                    { id: 'payables', label: 'Borçlar' },
                                    { id: 'checks', label: 'Çekler' },
                                    { id: 'notes', label: 'Senetler' },
                                    { id: 'staff', label: 'Personel' },
                                    { id: 'branches', label: 'Şubeler' },
                                    { id: 'expenses', label: 'Giderler' },
                                ].map(opt => (
                                    <label key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '10px', borderRadius: '12px', opacity: resetOptions.all ? 0.3 : 1 }}>
                                        <input
                                            type="checkbox"
                                            disabled={resetOptions.all}
                                            checked={resetOptions.all || (resetOptions as any)[opt.id]}
                                            onChange={e => setResetOptions({ ...resetOptions, [opt.id]: e.target.checked })}
                                            style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                                        />
                                        <span style={{ fontWeight: '600', fontSize: '13px', color: (resetOptions as any)[opt.id] ? 'white' : '#666' }}>{opt.label}</span>
                                    </label>
                                ))}
                            </div>

                            <div className="flex-col gap-4" style={{ alignItems: 'center' }}>
                                <div style={{ width: '100%', maxWidth: '400px' }}>
                                    <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '10px', color: '#888' }}>
                                        İşlemi onaylamak için <span style={{ color: 'var(--danger)' }}>ONAYLIYORUM</span> yazın:
                                    </label>
                                    <input
                                        type="text"
                                        id="resetConfirmationInput"
                                        style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(0,0,0,0.3)', color: 'white', textAlign: 'center', fontSize: '18px', letterSpacing: '4px', fontWeight: '900', outline: 'none' }}
                                        placeholder="ONAYLIYORUM"
                                    />
                                </div>

                                <button
                                    disabled={!Object.values(resetOptions).some(v => v)}
                                    onClick={async () => {
                                        const input = (document.getElementById('resetConfirmationInput') as HTMLInputElement).value;
                                        if (input !== 'ONAYLIYORUM') {
                                            showError('Hata', 'Lütfen onay kutusuna ONAYLIYORUM yazın.');
                                            return;
                                        }

                                        showConfirm(
                                            'KRİTİK SİSTEM SIFIRLAMA',
                                            'Seçilen veriler kalıcı olarak silinecektir. Devam etmek istediğinizden emin misiniz?',
                                            async () => {
                                                try {
                                                    const res = await fetch('/api/admin/reset-data', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({
                                                            confirmation: input,
                                                            options: resetOptions,
                                                            currentUsername: currentUser?.username
                                                        })
                                                    });
                                                    const data = await res.json();
                                                    if (data.success) {
                                                        showSuccess('BAŞARILI', '✅ Seçilen veriler sıfırlandı.');
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
                                    style={{
                                        background: '#dc2626',
                                        color: 'white',
                                        fontWeight: '900',
                                        padding: '18px 40px',
                                        width: '100%',
                                        maxWidth: '400px',
                                        fontSize: '16px',
                                        borderRadius: '18px',
                                        boxShadow: 'none',
                                        opacity: (!Object.values(resetOptions).some(v => v)) ? 0.5 : 1,
                                        cursor: (!Object.values(resetOptions).some(v => v)) ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    🔥 SEÇİLİ VERİLERİ SİL & SIFIRLA
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 10.4 HEDİYE ÇEKİ YÖNETİM MODALI */}
                {showCouponModal && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }} onClick={() => setShowCouponModal(false)}>
                        <div style={{ backgroundColor: "transparent", width: '90%', maxWidth: '1200px', maxHeight: '90vh', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }} onClick={e => e.stopPropagation()}>
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
                                        style={{ width: '100%', backgroundColor: "transparent", border: '1px solid rgba(255,255,255,0.1)', padding: '16px 20px 16px 50px', borderRadius: '16px', color: 'white', outline: 'none', fontSize: '15px' }}
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
                                                        className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition-colors"
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

                {/* SYSTEM SETTINGS TAB */}
                {activeTab === 'system' && (
                    <div className="animate-fade-in-up space-y-6 max-w-4xl p-8" style={{ padding: '32px' }}>
                        <div>
                            <h1 className="text-2xl font-black mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/50" style={{ fontSize: '24px', fontWeight: '900', marginBottom: '8px', background: '-webkit-linear-gradient(left, #fff, rgba(255,255,255,0.5))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                📧 Mail Ayarları
                            </h1>
                            <p className="text-sm text-white/40" style={{ fontSize: '13px', opacity: 0.4 }}>Mail sunucu yapılandırması ve SMTP entegrasyon ayarları.</p>
                        </div>

                        <div className="card glass p-8" style={{ padding: '32px', backgroundColor: "transparent", border: '1px solid var(--border-light)', borderRadius: '16px' }}>
                            <div className="flex justify-between items-center border-b border-white/5 pb-6 mb-6" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '24px', marginBottom: '24px' }}>
                                <div>
                                    <h3 className="text-lg font-black flex items-center gap-2" style={{ fontSize: '18px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        📧 Mail Sunucu Ayarları (SMTP)
                                    </h3>
                                    <p className="text-xs text-white/40 mt-1" style={{ fontSize: '12px', opacity: 0.4, marginTop: '4px' }}>Personel şifreleri ve bildirimlerin gönderileceği mail hesabı.</p>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-[10px] font-bold ${smtpSettings.email ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`} style={{ padding: '4px 12px', borderRadius: '50px', fontSize: '10px', fontWeight: 'bold', background: smtpSettings.email ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: smtpSettings.email ? '#10b981' : '#ef4444' }}>
                                    {smtpSettings.email ? 'YAPILANDIRILDI' : 'AYARLANMADI'}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
                                <div className="space-y-2" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label className="text-xs font-bold text-white/60" style={{ fontSize: '12px', fontWeight: 'bold', opacity: 0.6 }}>Gönderici E-Posta (Gmail vb.)</label>
                                    <input
                                        type="email"
                                        className="input-field w-full p-3"
                                        style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', outline: 'none' }}
                                        placeholder="ornek@gmail.com"
                                        value={smtpSettings.email}
                                        onChange={e => setSmtpSettings({ ...smtpSettings, email: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label className="text-xs font-bold text-white/60" style={{ fontSize: '12px', fontWeight: 'bold', opacity: 0.6 }}>Uygulama Şifresi (App Password)</label>
                                    <input
                                        type="password"
                                        className="input-field w-full p-3"
                                        style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', outline: 'none' }}
                                        placeholder="**** **** **** ****"
                                        value={smtpSettings.password}
                                        onChange={e => setSmtpSettings({ ...smtpSettings, password: e.target.value })}
                                    />
                                    <p className="text-[10px] text-white/30" style={{ fontSize: '10px', opacity: 0.3, marginTop: '4px' }}>Gmail kullanıyorsanız normal şifreniz çalışmaz. Google Hesabım &gt; Güvenlik &gt; Uygulama Şifreleri kısmından 16 haneli şifre almalısınız.</p>
                                </div>
                            </div>

                            <div className="flex justify-end mt-6" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
                                <button
                                    onClick={saveSmtpSettings}
                                    className="px-6 py-3 rounded-xl bg-primary text-white font-black hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
                                    style={{ padding: '12px 24px', borderRadius: '12px', background: 'var(--primary)', color: 'white', fontWeight: '900', border: 'none', cursor: 'pointer', boxShadow: '0 10px 20px -10px var(--primary)' }}
                                >
                                    KAYDET
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div >
    );
}
