
"use client";
import {
    Check,
    Building2,
    Plug,
    Building,
    ShieldCheck,
    User,
    DollarSign,
    FileText,
    Wrench,
    Coins,
    CreditCard,
    Gift,
    BookOpen,
    Bell,
    Cloud,
    ScrollText,
    Mail,
    ShieldAlert,
    Globe,
    Coffee
} from 'lucide-react';
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
import RestaurantSettingsPanel from './_components/forms/RestaurantSettingsPanel';
import BranchesPanel from './_components/forms/BranchesPanel';
import CompanyProfileForm from './_components/forms/CompanyProfileForm';
import IntegrationsPanel from './_components/forms/IntegrationsPanel';
import AuthorizedSignersPanel from './_components/forms/AuthorizedSignersPanel';
import PricingPage from './pricing/page';
import BranchSettingsPage from './branch/page';
import CustomDomainPanel from './_components/forms/CustomDomainPanel';

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
                company_phone: appSettings.company_phone || '',
                company_default_branch: appSettings.company_default_branch || ''
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

    const testSmtpConnection = async () => {
        try {
            const res = await fetch('/api/settings/mail/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(smtpSettings)
            });
            const data = await res.json();
            if (res.ok && data.success) {
                showSuccess('Başarılı', 'Bağlantı başarılı. Sistem mailleri gönderebiliyor.');
            } else {
                showError('Hata', data.error || 'Bağlantı sağlanamadı.');
            }
        } catch (e) {
            showError('Hata', 'Sunucuya ulaşılamadı.');
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
                <div key={pm.id || i} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                    <div className="flex items-center gap-2">
                        <span>{pm.icon || '💰'}</span>
                        <div className="flex-col">
                            <span >{pm.label}</span>
                            <span >{pm.type === 'card' ? 'Kredi Kartı' : 'Nakit'}</span>
                        </div>
                    </div>
                    <button
                        onClick={() => quickRemovePaymentMethod(pm.id)}
                        className="text-red-500 hover:text-red-600 transition-colors"
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
            <div key={i} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                <span >{item}</span>
                <button
                    onClick={() => {
                        if (definitionTab === 'brands') removeDefinition('brands', item, brands, setBrands);
                        if (definitionTab === 'prod_cat') removeDefinition('prodCat', item, prodCats, setProdCats);
                        if (definitionTab === 'cust_class') removeDefinition('custClasses', item, custClasses, setCustClasses);
                        if (definitionTab === 'supp_class') removeDefinition('suppClasses', item, suppClasses, setSuppClasses);
                        if (definitionTab === 'warranties') removeDefinition('warranties', item, warranties, setWarranties);
                    }}
                    className="text-red-500 hover:text-red-600 transition-colors"
                >
                    🗑️
                </button>
            </div>
        ));
    };



    const sharedProps: any = {
        Check, TURKISH_CITIES, TURKISH_DISTRICTS, setSelectedBranchDocs, selectedBranchDocs, handleFileUpload, isDocsLoading, branchDocs, deleteBranchDoc, setShowKasaDefinitions, showKasaDefinitions, addPaymentMethodDefinition, editingPaymentMethodId, setEditingPaymentMethodId, startEditingPaymentMethod, removePaymentMethodDefinition, kasaTypes, contextBranches, products, allBrands, allCats, campaigns, addCoupon, setNewItemInput, newItemInput, addDefinition, brands, setBrands, prodCats, setProdCats, warranties, setWarranties, vehicleTypes, setVehicleTypes, quickRemovePaymentMethod, removeDefinition, IntegrationsContent, saveSmtpSettings, testSmtpConnection, salesExpenses, updateSalesExpenses, addKdv,
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
        <div className="flex min-h-screen text-slate-900 dark:text-white">
            <div className="fixed inset-0 -z-10 bg-slate-50 dark:bg-[#0f172a]" />

            {/* LEFT SIDEBAR MENU — sticky */}
            <div className="w-[280px] shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] flex flex-col sticky top-0 h-screen overflow-y-auto">
                <div className="p-5 border-b border-slate-200 dark:border-slate-800">
                    <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Ayarlar</h2>
                </div>
                <nav className="flex-1 p-3 flex flex-col gap-0.5">
                    {[
                        { id: 'company', label: 'Firma Profili', icon: <Building2 className="w-5 h-5 text-indigo-500" /> },
                        { id: 'custom_domain', label: 'Özel Alan Adı (B2B)', icon: <Globe className="w-5 h-5 text-blue-500" /> },
                        { id: 'authorized_signers', label: 'İmza Yetkilileri', icon: <ShieldCheck className="w-5 h-5 text-emerald-600" /> },
                        { id: 'restaurant', label: 'Restoran ve POS', icon: <Coffee className="w-5 h-5 text-amber-500" /> },
                        { id: 'branches', label: 'Şubeler & Depo', icon: <Building className="w-5 h-5 text-sky-500" /> },
                        { id: 'branch_auth', label: 'Şube-Kasa Yetkileri', icon: <ShieldCheck className="w-5 h-5 text-rose-500" /> },
                        { id: 'profile', label: 'Hesabım', icon: <User className="w-5 h-5 text-amber-500" /> },
                        { id: 'pricing', label: 'Fiyatlandırma', icon: <DollarSign className="w-5 h-5 text-green-500" /> },
                        { id: 'invoice', label: 'Fatura Ayarları', icon: <FileText className="w-5 h-5 text-cyan-500" /> },
                        { id: 'services', label: 'Servis Ayarları', icon: <Wrench className="w-5 h-5 text-violet-500" /> },
                        { id: 'taxes', label: 'KDV & Vergiler', icon: <Coins className="w-5 h-5 text-yellow-500" /> },
                        { id: 'expenses', label: 'Satış Giderleri', icon: <CreditCard className="w-5 h-5 text-blue-500" /> },
                        { id: 'definitions', label: 'Tanımlar & Liste', icon: <BookOpen className="w-5 h-5 text-teal-500" /> },
                        { id: 'notifications', label: 'Bildirim Ayarları', icon: <Bell className="w-5 h-5 text-orange-500" /> },
                        { id: 'backup', label: 'Bulut Yedekleme', icon: <Cloud className="w-5 h-5 text-sky-400" /> },
                        { id: 'logs', label: 'İşlem Günlükleri', icon: <ScrollText className="w-5 h-5 text-slate-500" /> },
                        { id: 'system', label: 'Mail Ayarları', icon: <Mail className="w-5 h-5 text-indigo-400" /> }
                    ].map(item => {
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all text-left text-sm ${isActive
                                    ? 'bg-slate-900 dark:bg-white text-white dark:bg-white dark:text-slate-900 font-medium'
                                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                                    }`}
                            >
                                <span className={isActive ? 'opacity-100' : 'opacity-60'}>{item.icon}</span>
                                {item.label}
                            </button>
                        );
                    })}
                </nav>

                <div className="p-3 border-t border-slate-200 dark:border-slate-800">
                    <button
                        onClick={() => setActiveTab('reset')}
                        className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all text-left text-sm ${activeTab === 'reset'
                            ? 'bg-rose-600 text-white font-medium'
                            : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20'
                            }`}
                    >
                        <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                        <span>Sistem Sıfırlama</span>
                    </button>
                </div>
            </div>

            {/* RIGHT CONTENT AREA — scrolls naturally */}
            <div className="flex-1 min-w-0 overflow-y-auto">

                {/* 0. FİRMA PROFİLİ */}
                {activeTab === 'company' && <CompanyProfileForm {...sharedProps} />}

                {/* ÖZEL ALAN ADI */}
                {activeTab === 'custom_domain' && <CustomDomainPanel />}

                {/* İMZA YETKİLİLERİ */}
                {activeTab === 'authorized_signers' && <AuthorizedSignersPanel />}

                {/* 1. ŞUBELER & DEPO */}
                {activeTab === 'branches' && <BranchesPanel {...sharedProps} />}
                {/* RESTORAN VE POS */}
                {activeTab === 'restaurant' && <RestaurantSettingsPanel {...sharedProps} />}

                {/* ŞUBE-KASA YETKILERI */}
                {activeTab === 'branch_auth' && <BranchSettingsPage />}

                {/* 3. MASRAF & KOMİSYON AYARLARI */}
                {activeTab === 'expenses' && <SalesExpensesPanel {...sharedProps} />}

                {/* 3. FATURA AYARLARI */}
                {/* PROFILE TAB */}
                {activeTab === 'profile' && <AccountPanel {...sharedProps} />}

                {activeTab === 'invoice' && <InvoiceSettingsPanel {...sharedProps} />}
                {activeTab === 'pricing' && <PricingPage />}

                {/* 3.1. SERVİS AYARLARI */}
                {activeTab === 'services' && <ServiceFeesPanel {...sharedProps} />}

                {/* 3.1. KDV & VERGİLER */}
                {activeTab === 'taxes' && <TaxesPanel {...sharedProps} />}



                {/* 4. TANIMLAR */}
                {/* 4. SİSTEM TANIMLARI - REDESIGNED */}
                {activeTab === 'definitions' && <DefinitionsListPanel {...sharedProps} />}

                {/* 5. BACKUP & CLOUD */}
                {activeTab === 'backup' && <CloudBackupPanel {...sharedProps} />}

                {activeTab === 'notifications' && <NotificationSettingsPanel {...sharedProps} />}

                {/* 7. ACTIVITY LOGS */}
                {activeTab === 'logs' && <AuditLogsPanel {...sharedProps} />}

                {/* 5. SİSTEM SIFIRLAMA (DANGER ZONE) */}
                {activeTab === 'reset' && <SystemResetPanel {...sharedProps} />}

                {/* 10.4 HEDİYE ÇEKİ YÖNETİM MODALI */}
                {showCouponModal && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900 dark:bg-white/50 dark:bg-[#0f172a]/80 animate-in fade-in"
                        onClick={() => setShowCouponModal(false)}
                    >
                        <div
                            className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm w-[800px] max-w-[95vw] h-[600px] max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0f172a]">
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">🎫 Hediye Çeki Yönetimi</h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Toplam <strong className="text-slate-700 dark:text-slate-300">{filteredCouponsList.length}</strong> kod bulundu.</p>
                                </div>
                                <div className="flex gap-2 items-center">
                                    <button onClick={exportCouponsExcel} className="h-9 px-4 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white transition-colors">📊 EXCEL</button>
                                    <button onClick={exportCouponsPDF} className="h-9 px-4 rounded-xl font-bold text-sm bg-rose-600 hover:bg-rose-700 text-white transition-colors">📄 PDF</button>
                                    <button onClick={() => setShowCouponModal(false)} className="h-9 w-9 rounded-xl flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors ml-2">✕</button>
                                </div>
                            </div>

                            {/* Modal Search & Filters */}
                            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a]">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Kod veya kampanya adı ile ara..."
                                        value={couponSearch}
                                        onChange={e => { setCouponSearch(e.target.value); setCouponPage(1); }}
                                        className="w-full h-11 pl-11 pr-4 rounded-xl bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                    />
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">🔍</span>
                                </div>
                            </div>

                            {/* Modal Table */}
                            <div className="flex-1 overflow-auto bg-white dark:bg-[#0B1220]">
                                <table className="w-full text-left border-collapse">
                                    <thead className="h-12 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap bg-slate-50 dark:bg-[#0f172a] sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800">
                                        <tr>
                                            <th className="px-6 placeholder-slate-400 font-bold max-w-[200px]">KOD BİLGİSİ</th>
                                            <th className="px-6 font-bold">İNDİRİM</th>
                                            <th className="px-6 font-bold">KULLANIM / LİMİT</th>
                                            <th className="px-6 font-bold">GEÇERLİLİK</th>
                                            <th className="px-6 font-bold text-right">İŞLEM</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                        {paginatedCouponsList.map((c: any) => (
                                            <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">{c.code}</div>
                                                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-1" title={c.campaignName}>{c.campaignName || 'Genel Kampanya'}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="inline-flex items-center px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-sm font-bold border border-blue-200 dark:border-blue-800/30">
                                                        {c.type === 'amount' ? `₺${c.value.toLocaleString()}` : `%${c.value}`}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-1 max-w-[80px] h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full ${c.usageLimit > 0 && c.usedCount >= c.usageLimit ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                                                style={{ width: c.usageLimit === 0 ? '50%' : `${Math.min(100, (c.usedCount / c.usageLimit) * 100)}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                                                            {c.usedCount} <span className="opacity-50 text-[10px]">/</span> {c.usageLimit === 0 ? '∞' : c.usageLimit}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className={`text-sm font-medium ${!c.expiryDate || new Date(c.expiryDate) > new Date() ? 'text-slate-700 dark:text-slate-300' : 'text-rose-500'}`}>
                                                        {c.expiryDate ? new Date(c.expiryDate).toLocaleDateString('tr-TR') : 'Süresiz'}
                                                    </div>
                                                    {c.minPurchaseAmount > 0 && <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Min: ₺{c.minPurchaseAmount.toLocaleString()}</div>}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => {
                                                            showConfirm('Kupon Silinsin mi?', 'Bu kupon kalıcı olarak silinecektir.', async () => {
                                                                await fetch(`/api/coupons?id=${c.id}`, { method: 'DELETE' });
                                                                refreshCoupons();
                                                            });
                                                        }}
                                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors ml-auto opacity-0 group-hover:opacity-100"
                                                    >
                                                        🗑️
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {filteredCouponsList.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500">
                                        <div className="text-3xl mb-3">🔎</div>
                                        <p className="text-sm">Aranan kriterlere uygun kod bulunamadı.</p>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer / Pagination */}
                            <div className="flex justify-between items-center p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0f172a]">
                                <button
                                    disabled={couponPage === 1}
                                    onClick={() => setCouponPage(p => p - 1)}
                                    className="h-9 px-4 rounded-xl text-sm font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    ◀ Geri
                                </button>

                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                                    SAYFA <span className="text-slate-900 dark:text-white px-1">{couponPage}</span> / {totalCouponPages || 1}
                                </span>

                                <button
                                    disabled={couponPage >= totalCouponPages}
                                    onClick={() => setCouponPage(p => p + 1)}
                                    className="h-9 px-4 rounded-xl text-sm font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    İleri ▶
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* SYSTEM SETTINGS TAB */}
                {activeTab === 'system' && <MailSettingsPanel {...sharedProps} />}

            </div>
        </div>
    );
}



