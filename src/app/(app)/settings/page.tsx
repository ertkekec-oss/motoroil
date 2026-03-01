
"use client";
import { Check } from 'lucide-react';
import MailSettingsPanel from './_components/forms/MailSettingsPanel';
import SystemResetPanel from './_components/forms/SystemResetPanel';
import CampaignPointsPanel from './_components/forms/CampaignPointsPanel';
import AuditLogsPanel from './_components/forms/AuditLogsPanel';
import NotificationSettingsPanel from './_components/forms/NotificationSettingsPanel';
import CloudBackupPanel from './_components/forms/CloudBackupPanel';
import DefinitionsListPanel from './_components/forms/DefinitionsListPanel';
import SalesExpensesPanel from './_components/forms/SalesExpensesPanel';
import TaxesPanel from './_components/forms/TaxesPanel';
import ServiceFeesPanel from './_components/forms/ServiceFeesPanel';
import InvoiceSettingsPanel from './_components/forms/InvoiceSettingsPanel';
import AccountPanel from './_components/forms/AccountPanel';
import BranchesPanel from './_components/forms/BranchesPanel';
import IntegrationsPanel from './_components/forms/IntegrationsPanel';
import CompanyProfileForm from './_components/forms/CompanyProfileForm';

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



    const sharedProps: any = {
        Check, TURKISH_CITIES, TURKISH_DISTRICTS, setSelectedBranchDocs, selectedBranchDocs, handleFileUpload, isDocsLoading, branchDocs, deleteBranchDoc, setShowKasaDefinitions, showKasaDefinitions, addPaymentMethodDefinition, editingPaymentMethodId, setEditingPaymentMethodId, startEditingPaymentMethod, removePaymentMethodDefinition, kasaTypes, contextBranches, products, allBrands, allCats, campaigns, addCoupon, setNewItemInput, newItemInput, addDefinition, brands, setBrands, prodCats, setProdCats, warranties, setWarranties, vehicleTypes, setVehicleTypes, quickRemovePaymentMethod, removeDefinition, IntegrationsContent, saveSmtpSettings, salesExpenses, updateSalesExpenses, addKdv,
        activeTab, setActiveTab, appSettings, tempCompanyInfo, setTempCompanyInfo, isSaving, handleSaveCompany,
        newCampaign, setNewCampaign, editingCampaignId, setEditingCampaignId, addCampaign, startEditingCampaign, deleteCampaign,
        newCoupon, setNewCoupon, showCouponModal, setShowCouponModal, couponSearch, setCouponSearch, couponPage, setCouponPage, exportCouponsExcel, exportCouponsPDF, totalCouponPages, paginatedCouponsList,
        referralSettings, setReferralSettings, saveReferralSettings, coupons, refreshCoupons,
        newKdv, setNewKdv, invoiceSettings, updateInvoiceSettings,
        customers, custClasses, setCustClasses, suppliers, suppClasses, setSuppClasses,
        kasalar, setKasalar, newKasa, setNewKasa, editingKasa, setEditingKasa, isProcessingKasa, showKasaModal, setShowKasaModal, handleSaveKasa, handleDeleteKasa, startEditingKasa,
        newPaymentMethod, setNewPaymentMethod, paymentMethods, updatePaymentMethods,
        serviceSettings, updateServiceSettings, localServiceSettings, setLocalServiceSettings, handleSaveServiceSettings,
        branches, newBranch, setNewBranch, editingBranchId, setEditingBranchId, addBranch, editBranch, deleteBranch, branchDefaults, updateBranchDefault, saveBranchDefaults,
        users, refreshStaff, newUser, setNewUser, addUser, deleteUser, editingUserPerms, setEditingUserPerms, availablePermissions, permissionTemplates,
        notifSettings, setNotifSettings, saveNotifSettings, logs, isLogsLoading, fetchLogs, smtpSettings, setSmtpSettings, resetOptions, setResetOptions,
        showSuccess, showError, showWarning, showConfirm, definitionTab, setDefinitionTab, campaignSubTab, setCampaignSubTab, refreshKasalar, refreshBranches, currentUser, profilePass, setProfilePass, handlePasswordChange,
        kasalarTotalBalance: kasalar?.reduce((a, b) => a + b.balance, 0) || 0
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

                        >
                            {isActive && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 dark:bg-blue-400" />
                            )}
                            <span className={isActive ? 'opacity-100' : 'opacity-60'} >{item.icon}</span>
                            {item.label}
                        </button>
                    );
                })}

                <div ></div>

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
                {activeTab === 'company' && <CompanyProfileForm {...sharedProps} />}


                {/* 0. ENTEGRASYONLAR */}
                {activeTab === 'integrations' && <IntegrationsPanel {...sharedProps} />}

                {/* 1. ŞUBELER & DEPO */}
                {activeTab === 'branches' && <BranchesPanel {...sharedProps} />}

                {/* 3. MASRAF & KOMİSYON AYARLARI */}
                {activeTab === 'expenses' && <SalesExpensesPanel {...sharedProps} />}

                {/* 3. FATURA AYARLARI */}
                {/* PROFILE TAB */}
                {activeTab === 'profile' && <AccountPanel {...sharedProps} />}

                {activeTab === 'invoice' && <InvoiceSettingsPanel {...sharedProps} />}

                {/* 3.1. SERVİS AYARLARI */}
                {activeTab === 'services' && <ServiceFeesPanel {...sharedProps} />}

                {/* 3.1. KDV & VERGİLER */}
                {activeTab === 'taxes' && <TaxesPanel {...sharedProps} />}

                {/* 3.5. SATIŞ GİDERLERİ (YENİ) */}
                {activeTab === 'expenses' && <SalesExpensesPanel {...sharedProps} />}

                {/* 4. TANIMLAR */}
                {/* 4. SİSTEM TANIMLARI - REDESIGNED */}
                {activeTab === 'definitions' && <DefinitionsListPanel {...sharedProps} />}

                {/* 5. BACKUP & CLOUD */}
                {activeTab === 'backup' && <CloudBackupPanel {...sharedProps} />}

                {activeTab === 'notifications' && <NotificationSettingsPanel {...sharedProps} />}

                {/* 7. ACTIVITY LOGS */}
                {activeTab === 'logs' && <AuditLogsPanel {...sharedProps} />}
                {/* 10. KAMPANYALAR & PUAN - REDESIGNED */}
                {activeTab === 'campaigns' && <CampaignPointsPanel {...sharedProps} />}

                {/* 5. SİSTEM SIFIRLAMA (DANGER ZONE) */}
                {activeTab === 'reset' && <SystemResetPanel {...sharedProps} />}

                {/* 10.4 HEDİYE ÇEKİ YÖNETİM MODALI */}
                {showCouponModal && (
                    <div onClick={() => setShowCouponModal(false)}>
                        <div onClick={e => e.stopPropagation()}>
                            {/* Modal Header */}
                            <div >
                                <div>
                                    <h2 >🎫 Hediye Çeki Yönetimi</h2>
                                    <p >Toplam {filteredCouponsList.length} kod bulundu.</p>
                                </div>
                                <div >
                                    <button onClick={exportCouponsExcel} className="btn" >📊 EXCEL</button>
                                    <button onClick={exportCouponsPDF} className="btn" >📄 PDF</button>
                                    <button onClick={() => setShowCouponModal(false)} >✕</button>
                                </div>
                            </div>

                            {/* Modal Search & Filters */}
                            <div >
                                <div >
                                    <input
                                        type="text"
                                        placeholder="Kod veya kampanya adı ile ara..."
                                        value={couponSearch}
                                        onChange={e => { setCouponSearch(e.target.value); setCouponPage(1); }}

                                    />
                                    <span >🔍</span>
                                </div>
                            </div>

                            {/* Modal Table */}
                            <div >
                                <table >
                                    <thead className="h-[52px] px-6 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800">
                                        <tr >
                                            <th >KOD BİLGİSİ</th>
                                            <th>İNDİRİM</th>
                                            <th>KULLANIM / LİMİT</th>
                                            <th>GEÇERLİLİK</th>
                                            <th >İŞLEM</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedCouponsList.map((c: any) => (
                                            <tr key={c.id} >
                                                <td >
                                                    <div >{c.code}</div>
                                                    <div >{c.campaignName || 'Genel Kampanya'}</div>
                                                </td>
                                                <td>
                                                    <div >
                                                        {c.type === 'amount' ? `₺${c.value.toLocaleString()}` : `%${c.value}`}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div >
                                                        <div >
                                                            <div style={{
                                                                width: `${c.usageLimit > 0 ? (c.usedCount / c.usageLimit) * 100 : (c.usedCount > 0 ? 100 : 0)}%`,
                                                                height: '100%',
                                                                background: c.isUsed ? 'rgba(255,255,255,0.2)' : 'var(--primary)'
                                                            }} />
                                                        </div>
                                                        <span >
                                                            {c.usedCount} / {c.usageLimit === 0 ? '∞' : c.usageLimit}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div >
                                                        {c.expiryDate ? new Date(c.expiryDate).toLocaleDateString('tr-TR') : 'Süresiz'}
                                                    </div>
                                                    {c.minPurchaseAmount > 0 && <div >Min: ₺{c.minPurchaseAmount.toLocaleString()}</div>}
                                                </td>
                                                <td >
                                                    <button
                                                        onClick={() => {
                                                            showConfirm('Kupon Silinsin mi?', 'Bu kupon kalıcı olarak silinecektir.', async () => {
                                                                await fetch(`/api/coupons?id=${c.id}`, { method: 'DELETE' });
                                                                refreshCoupons();
                                                            });
                                                        }}
                                                        className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition-colors"

                                                    >🗑️</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {filteredCouponsList.length === 0 && (
                                    <div >
                                        <div >🔎</div>
                                        <p >Aranan kriterlere uygun kod bulunamadı.</p>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer / Pagination */}
                            <div >
                                <button
                                    disabled={couponPage === 1}
                                    onClick={() => setCouponPage(p => p - 1)}
                                    className="btn"

                                >◀ Geri</button>

                                <span >
                                    SAYFA <span >{couponPage}</span> / {totalCouponPages || 1}
                                </span>

                                <button
                                    disabled={couponPage >= totalCouponPages}
                                    onClick={() => setCouponPage(p => p + 1)}
                                    className="btn"

                                >İleri ▶</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* SYSTEM SETTINGS TAB */}
                {activeTab === 'system' && <MailSettingsPanel {...sharedProps} />}

            </div>
        </div >
    );
}
