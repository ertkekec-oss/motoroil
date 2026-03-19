"use client";

import React, { useState, useEffect, useMemo, Fragment } from 'react';

import HrOverviewTab from '@/app/(app)/staff/_components/HrOverviewTab';
import HrTargetsTab from '@/app/(app)/staff/_components/HrTargetsTab';
import HrTasksTab from '@/app/(app)/staff/_components/HrTasksTab';
import HrFilesTab from '@/app/(app)/staff/_components/HrFilesTab';
import { useApp } from '@/contexts/AppContext';
import { useModal } from '@/contexts/ModalContext';
import { useFinancials } from '@/contexts/FinancialContext';

import PayrollModule from './PayrollModule';
import AdvancesModule from './AdvancesModule';
import PdksSecurityModule from './PdksSecurityModule';

export default function StaffManagementContent() {
    const [activeTab, setActiveTab] = useState('list'); // list, roles, performance, shifts, leaves, payroll, attendance, puantaj
    const [pdksSubTab, setPdksSubTab] = useState('puantaj');
    const [selectedRoleForPermissions, setSelectedRoleForPermissions] = useState('Sistem Yöneticisi');

    const { staff, currentUser, hasPermission, addNotification, refreshStaff, branches } = useApp();
    const { addFinancialTransaction, kasalar, setKasalar } = useFinancials();
    const { showSuccess, showConfirm, showError } = useModal();
    const isSystemAdmin = currentUser === null || (currentUser.role && (currentUser.role.toLowerCase().includes('admin') || currentUser.role.toLowerCase().includes('müdür')));

    const [selectedStaff, setSelectedStaff] = useState<any>(null);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [showPermissionModal, setShowPermissionModal] = useState(false);
    const [showAddStaffModal, setShowAddStaffModal] = useState(false);
    const [addStaffStep, setAddStaffStep] = useState(1);
    const [showEditStaffModal, setShowEditStaffModal] = useState(false);
    const [taskContent, setTaskContent] = useState('');
    const [taskPriority, setTaskPriority] = useState('normal');
    const [isProcessing, setIsProcessing] = useState(false);

    // --- STAFF DOCUMENTS STATE ---
    const [staffDocuments, setStaffDocuments] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [customerCategories, setCustomerCategories] = useState<any[]>([]);

    const [newStaff, setNewStaff] = useState({
        name: '', email: '', username: '', phone: '', password: '', role: '', branch: '', type: 'service',
        birthDate: '', maritalStatus: '', bloodType: '', militaryStatus: '', educationLevel: '',
        hasDriverLicense: false, reference: '', relativeName: '', relativePhone: '',
        city: '', district: '', address: '', notes: '', healthReport: '', certificate: '', salary: '',
        salaryType: 'NET', entryDate: '', leaveDate: '',
        assignedCategoryIds: [] as string[]
    });

    const [editStaff, setEditStaff] = useState<any>({
        name: '', email: '', role: '', branch: '', type: 'service', birthDate: '', address: '', salary: '',
        maritalStatus: '', bloodType: '', militaryStatus: '', educationLevel: '', hasDriverLicense: false,
        reference: '', relativeName: '', relativePhone: '', city: '', district: '', notes: '',
        healthReport: '', certificate: '', assignedCategoryIds: [],
        salaryType: 'NET', entryDate: '', leaveDate: ''
    });

    const fetchCustomerCategories = async () => {
        try {
            const res = await fetch('/api/customers/categories');
            if (res.ok) {
                const data = await res.json();
                setCustomerCategories(data.data || data.categories || []);
            }
        } catch (e) {
            console.error('Failed to fetch categories', e);
        }
    };

    // --- NEW STATES FOR HR MODULES ---
    const [shifts, setShifts] = useState<any[]>([]);
    const [leaves, setLeaves] = useState<any[]>([]);
    const [payrolls, setPayrolls] = useState<any[]>([]);
    const [currentWeekStart, setCurrentWeekStart] = useState(getMonday(new Date()));
    const [targets, setTargets] = useState<any[]>([]);
    const [attendance, setAttendance] = useState<any[]>([]);
    const [puantaj, setPuantaj] = useState<any[]>([]);
    const [selectedPeriod, setSelectedPeriod] = useState(new Date().toISOString().slice(0, 7));
    const [showTargetModal, setShowTargetModal] = useState(false);
    const [newTarget, setNewTarget] = useState({
        staffId: '', type: 'TURNOVER', targetValue: '', period: 'MONTHLY', startDate: '', endDate: '', commissionRate: '', bonusAmount: ''
    });

    const [expandedPdksStaffId, setExpandedPdksStaffId] = useState<string | null>(null);

    function getMonday(d: Date) {
        d = new Date(d);
        let day = d.getDay(),
            diff = d.getDate() - day + (day == 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    }

    // --- FETCH DATA FUNCTIONS ---
    useEffect(() => {
        fetchCustomerCategories();
        if (kasalar.length === 0) {
            fetch('/api/kasalar')
                .then(res => res.json())
                .then(data => {
                    if (data.success && setKasalar) setKasalar(data.kasalar);
                })
                .catch(err => console.error('Failed to fetch kasalar', err));
        }
    }, []);

    const fetchShifts = async () => {
        try {
            const endWeek = new Date(currentWeekStart);
            endWeek.setDate(endWeek.getDate() + 6);

            const res = await fetch(`/api/staff/shifts?start=${currentWeekStart.toISOString()}&end=${endWeek.toISOString()}`);
            if (res.ok) {
                const data = await res.json();
                setShifts(Array.isArray(data) ? data : []);
            }
        } catch (e) { console.error(e); }
    };

    const fetchLeaves = async () => {
        try {
            const res = await fetch('/api/staff/leaves');
            if (res.ok) {
                const data = await res.json();
                setLeaves(Array.isArray(data) ? data : []);
            }
        } catch (e) { console.error(e); }
    };

    const fetchPayrolls = async () => {
        try {
            const currentPeriod = new Date().toISOString().slice(0, 7);
            const res = await fetch(`/api/staff/payroll?period=${currentPeriod}`);
            if (res.ok) {
                const data = await res.json();
                setPayrolls(data.payrolls || []);
            }
        } catch (e) { console.error(e); }
    };

    const fetchStaffDocuments = async (staffId: string) => {
        if (!staffId) return;
        try {
            const res = await fetch(`/api/employees/${staffId}/documents`);
            if (res.ok) {
                const data = await res.json();
                setStaffDocuments(data.documents || []);
            }
        } catch (e) { console.error(e); }
    };

    const fetchTargets = async () => {
        try {
            const res = await fetch('/api/staff/targets');
            if (res.ok) {
                const data = await res.json();
                setTargets(Array.isArray(data) ? data : []);
            }
        } catch (e) { console.error(e); }
    };

    const fetchAttendance = async () => {
        try {
            const res = await fetch('/api/staff/attendance');
            if (res.ok) {
                const data = await res.json();
                setAttendance(Array.isArray(data) ? data : []);
            }
        } catch (e) { console.error(e); }
    };

    const fetchPuantaj = async () => {
        try {
            const res = await fetch(`/api/staff/puantaj?period=${selectedPeriod}`);
            if (res.ok) {
                const data = await res.json();
                setPuantaj(Array.isArray(data) ? data : []);
            }
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        if (showEditStaffModal && editStaff.id) {
            fetchStaffDocuments(editStaff.id);
        }
    }, [showEditStaffModal, editStaff.id]);

    useEffect(() => {
        fetchAttendance(); // Load for list tab indicators
    }, []);

    // Load data when tab changes
    useEffect(() => {
        if (activeTab === 'shifts') fetchShifts();
        if (activeTab === 'leaves') fetchLeaves();
        if (activeTab === 'payroll') fetchPayrolls();
        if (activeTab === 'performance') fetchTargets();
        if (activeTab === 'attendance') fetchAttendance();
        if (activeTab === 'puantaj') fetchPuantaj();
        if (activeTab === 'list') fetchAttendance();
    }, [activeTab, currentWeekStart, selectedPeriod]);

    // Set default branch when branches load
    useEffect(() => {
        if (!newStaff.branch) {
            setNewStaff(prev => ({ ...prev, branch: '' }));
        }
    }, []);

    const [searchTerm, setSearchTerm] = useState('');

    const allPermissions = [
        // --- SATIŞ & OPERASYON ---
        { id: 'pos_access', label: 'Hızlı Satış (POS) Erişimi', category: 'Satış & Operasyon' },
        { id: 'sales_archive', label: 'Geçmiş Satışları Görüntüleme', category: 'Satış & Operasyon' },
        { id: 'discount_auth', label: 'İskonto ve Fiyat Düşürme Yetkisi', category: 'Satış & Operasyon' },
        { id: 'price_override', label: '💸 Anlık Fiyat Değiştirme / İnsiyatif', category: 'Satış & Operasyon' },
        { id: 'return_create', label: '↩️ Ürün İade Alma ve İşleme', category: 'Satış & Operasyon' },
        { id: 'credit_sales', label: 'Açık Hesap (Veresiye) Satış Yetkisi', category: 'Satış & Operasyon' },
        { id: 'offer_create', label: 'Müşteriye Teklif Hazırlama', category: 'Satış & Operasyon' },
        { id: 'offer_approve', label: '✅ Teklif Onaylama ve Siparişe Çevirme', category: 'Satış & Operasyon' },
        { id: 'ecommerce_view', label: 'E-Ticaret Paneli Görüntüleme', category: 'Satış & Operasyon' },
        { id: 'ecommerce_manage', label: 'E-Ticaret Sipariş Yönetimi', category: 'Satış & Operasyon' },
        { id: 'field_sales_access', label: '📍 Saha Satış Modülü Erişimi (Mobil)', category: 'Satış & Operasyon' },
        { id: 'field_sales_admin', label: '🗺️ Saha Satış Yönetimi (Rota Planlama)', category: 'Satış & Operasyon' },

        // --- STOK & ÜRETİM ---
        { id: 'inventory_view', label: 'Depo ve Stok Görüntüleme', category: 'Stok & Üretim' },
        { id: 'inventory_edit', label: 'Ürün Kartı Ekleme ve Düzenleme', category: 'Stok & Üretim' },
        { id: 'inventory_transfer', label: 'Depolar Arası Transfer', category: 'Stok & Üretim' },
        { id: 'stock_correction', label: 'Stok Sayım ve Miktar Düzeltme', category: 'Stok & Üretim' },
        { id: 'approve_products', label: '🔴 Ürün Kartı Kesin Onayı', category: 'Stok & Üretim' },
        { id: 'approve_transfers', label: '🔴 Sistem İçi Transfer Onaylama', category: 'Stok & Üretim' },

        // --- FİNANS & MUHASEBE ---
        { id: 'finance_view', label: 'Finansal Gösterge Paneli ve Özetler', category: 'Finans & Muhasebe' },
        { id: 'finance_transactions', label: 'Kasa ve Banka Hareketleri', category: 'Finans & Muhasebe' },
        { id: 'accounting_manage', label: 'Kasa/Banka Hesap Yönetimi', category: 'Finans & Muhasebe' },
        { id: 'expense_create', label: 'Gider ve Masraf Fişi Girişi', category: 'Finans & Muhasebe' },
        { id: 'finance_reports', label: 'Bilanço ve Kar/Zarar Göstergeleri', category: 'Finans & Muhasebe' },
        { id: 'tax_manage', label: 'KDV, Vergi ve Beyannameler', category: 'Finans & Muhasebe' },
        { id: 'mizan_export', label: 'Mizan ve Mali Dışa Aktarımlar', category: 'Finans & Muhasebe' },
        { id: 'e_invoice', label: 'Resmi e-Fatura ve e-Arşiv Kesimi', category: 'Finans & Muhasebe' },
        { id: 'create_bank', label: '🔴 Kasa/Banka Açma ve Kapatma', category: 'Finans & Muhasebe' },

        // --- MÜŞTERİ & TEDARİKÇİ (CRM) ---
        { id: 'customer_view', label: 'Müşteri (Cari) Listesi', category: 'Müşteri & Tedarikçi' },
        { id: 'customer_edit', label: 'Müşteri Ekleme ve Düzenleme', category: 'Müşteri & Tedarikçi' },
        { id: 'customer_delete', label: '⚠️ Müşteri Silme Yetkisi', category: 'Müşteri & Tedarikçi' },
        { id: 'supplier_view', label: 'Tedarikçi Listesi', category: 'Müşteri & Tedarikçi' },
        { id: 'supplier_edit', label: 'Tedarikçi Ekleme ve Düzenleme', category: 'Müşteri & Tedarikçi' },

        // --- İNSAN KAYNAKLARI (HR) ---
        { id: 'hr_view', label: 'Personel Listesini Görüntüleme', category: 'İnsan Kaynakları' },
        { id: 'hr_manage', label: 'Personel Dosyası Düzenleme', category: 'İnsan Kaynakları' },
        { id: 'staff_manage', label: 'Personel Operasyon Yönetimi', category: 'İnsan Kaynakları' },
        { id: 'shift_manage', label: 'Vardiya ve İzinleri Yönetme', category: 'İnsan Kaynakları' },
        { id: 'payroll_manage', label: 'Maaş, Prim ve Bordro Onayı', category: 'İnsan Kaynakları' },
        { id: 'create_staff', label: '🔴 Yeni Personel Girişi / Çıkışı', category: 'İnsan Kaynakları' },

        // --- SERVİS & TEKNİK ---
        { id: 'service_view', label: 'Servis / İş Emirlerini Görme', category: 'Servis & Teknik' },
        { id: 'service_create', label: 'Yeni İş Emri Oluşturma', category: 'Servis & Teknik' },
        { id: 'service_complete', label: 'İş Emri Tamamlama / Kapatma', category: 'Servis & Teknik' },

        // --- YÖNETİM & PLATFORM ---
        { id: 'settings_manage', label: 'Sistem Ayarları', category: 'Yönetim & Platform' },
        { id: 'admin_view', label: '⚙️ Platform Yönetim Paneli', category: 'Yönetim & Platform' },
        { id: 'security_access', label: 'Güvenlik Masası / Loglar', category: 'Yönetim & Platform' },
        { id: 'delete_records', label: '🔴 Kayıt Silme (Genel)', category: 'Yönetim & Platform' },

        // --- ÖZEL KISITLAMALAR ---
        { id: 'branch_isolation', label: '🚫 Şube İzolasyonu (Sadece Kendi Şubesi)', category: 'Kısıtlamalar' }
    ];

    const roleTemplates: Record<string, string[]> = {
        'Sistem Yöneticisi': allPermissions.map(p => p.id),
        'Şube Yöneticisi': ['pos_access', 'sales_archive', 'discount_auth', 'inventory_view', 'customer_view', 'customer_edit', 'service_view', 'service_create', 'branch_isolation', 'hr_view', 'finance_view', 'expense_create'],
        'Saha Satış': ['field_sales_access', 'field_sales_admin', 'customer_view', 'customer_edit', 'inventory_view', 'pos_access', 'sales_archive', 'branch_isolation'],
        'E-Ticaret Uzmanı': ['ecommerce_view', 'ecommerce_manage', 'inventory_view', 'inventory_edit', 'sales_archive', 'branch_isolation'],
        'Servis Personeli': ['service_view', 'service_create', 'service_complete', 'inventory_view', 'branch_isolation'],
        'İnsan Kaynakları': ['hr_view', 'hr_manage', 'payroll_manage', 'shift_manage', 'staff_manage', 'create_staff', 'branch_isolation'],
        'Mali Müşavir': ['tax_manage', 'mizan_export', 'e_invoice', 'finance_view', 'finance_transactions', 'finance_reports', 'accounting_manage'],
        'Kasiyer / Standart Personel': ['pos_access', 'branch_isolation']
    };

    const filteredStaff = useMemo(() => {
        return staff.filter(s =>
            s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.branch.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [staff, searchTerm]);

    const handleAssignTask = async () => {
        if (!taskContent) return;
        setIsProcessing(true);
        try {
            const res = await fetch('/api/staff', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: selectedStaff.id,
                    currentJob: taskContent,
                    status: 'Meşgul'
                })
            });

            if (res.ok) {
                await refreshStaff();
                addNotification({
                    type: 'info',
                    icon: '⚒️',
                    text: `${selectedStaff.name} personeline görev atandı: ${taskContent.substring(0, 20)}...`
                });
                setShowTaskModal(false);
                setTaskContent('');
                showSuccess("Görev Atandı", "Personel durumu 'Meşgul' olarak güncellendi.");
            }
        } catch (e) {
            console.error('Task assign failed', e);
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

    const handleSaveStaff = async () => {
        if (!newStaff.name || !newStaff.role) return;

        if (!newStaff.name) {
            showError('Hata', 'Lütfen personel adını giriniz.');
            return;
        }

        if (!newStaff.branch) {
            showError('Hata', 'Lütfen personel için bir şube seçiniz.');
            return;
        }

        setIsProcessing(true);
        try {
            const res = await fetch('/api/staff', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newStaff,
                    salary: newStaff.salary ? parseFloat(newStaff.salary) : 17002,
                    status: 'Müsait',
                    permissions: ['branch_isolation']
                })
            });

            if (res.ok) {
                await refreshStaff();
                setShowAddStaffModal(false);
                setNewStaff({
                    name: '', email: '', username: '', phone: '', password: '', role: '', branch: '', type: 'service',
                    birthDate: '', maritalStatus: '', bloodType: '', militaryStatus: '', educationLevel: '',
                    hasDriverLicense: false, reference: '', relativeName: '', relativePhone: '',
                    city: '', district: '', address: '', notes: '', healthReport: '', certificate: '', salary: '',
                    salaryType: 'NET', entryDate: '', leaveDate: '',
                    assignedCategoryIds: []
                });
                showSuccess("Personel Eklendi", "Sisteme giriş yetkileri varsayılan olarak tanımlandı. Şifre mail olarak gönderildi.");
            } else {
                const errData = await res.json();
                showError("İşlem Başarısız", errData.error || "Personel eklenirken bir hata oluştu.");
            }
        } catch (e) {
            console.error('Save staff failed', e);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleEditStaff = async () => {
        if (!editStaff.name || !editStaff.role || !editStaff.branch) {
            showError('Hata', 'Lütfen tüm zorunlu alanları doldurun.');
            return;
        }

        setIsProcessing(true);
        try {
            const res = await fetch('/api/staff', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...editStaff,
                    age: undefined // Remove age as per instruction
                })
            });

            if (res.ok) {
                await refreshStaff();
                setShowEditStaffModal(false);
                showSuccess("Güncellendi", "Personel bilgileri başarıyla güncellendi.");
            }
        } catch (e) {
            console.error('Edit staff failed', e);
        } finally {
            setIsProcessing(false);
        }
    };

    // --- DOCUMENT HANDLERS ---
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !editStaff.id) return;

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            showError("Hata", "Dosya boyutu 10MB'dan küçük olmalıdır.");
            return;
        }

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('title', file.name);

            const res = await fetch(`/api/employees/${editStaff.id}/documents/upload`, {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                await fetchStaffDocuments(editStaff.id);
                showSuccess("Dosya Yüklendi", "Personel belgesi başarıyla kaydedildi.");
            } else {
                const err = await res.json();
                showError("Hata", err.error || "Dosya yüklenemedi.");
            }
        } catch (e) {
            console.error("Upload error", e);
            showError("Hata", "Dosya yüklenirken bir sorun oluştu.");
        } finally {
            setIsUploading(false);
            e.target.value = '';
        }
    };

    const handleDownloadDocument = async (docId: string, fileName: string) => {
        try {
            const res = await fetch(`/api/employees/documents/${docId}/download`);
            const data = await res.json();

            if (data.success && data.url) {
                const link = document.createElement('a');
                link.href = data.url;
                link.setAttribute('download', fileName);
                document.body.appendChild(link);
                link.click();
                link.parentNode?.removeChild(link);
            } else {
                showError("Hata", data.error || "İndirme bağlantısı alınamadı");
            }
        } catch (e) {
            console.error(e);
            showError("Hata", "İndirme sırasında bir hata oluştu");
        }
    };

    const handleDeleteDocument = async (docId: string) => {
        showConfirm("Belgeyi Sil", "Belgeyi silmek istediğinize emin misiniz?", async () => {
            try {
                const res = await fetch(`/api/employees/documents/${docId}`, { method: 'DELETE' });
                if (res.ok) {
                    await fetchStaffDocuments(editStaff.id);
                    showSuccess("Silindi", "Belge başarıyla silindi.");
                } else {
                    showError("Hata", "Belge silinemedi.");
                }
            } catch (e) {
                console.error(e);
                showError("Hata", "Silme sırasında bir hata oluştu.");
            }
        });
    };

    // --- SHIFT CREATION LOGIC ---
    const [showShiftModal, setShowShiftModal] = useState(false);
    const [newShift, setNewShift] = useState({
        staffId: '', start: '', end: '', type: 'Normal'
    });

    const handleCreateShift = async () => {
        if (!newShift.staffId || !newShift.start || !newShift.end) return;
        setIsProcessing(true);
        try {
            const res = await fetch('/api/staff/shifts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    staffId: newShift.staffId,
                    start: newShift.start,
                    end: newShift.end,
                    type: newShift.type,
                    branch: currentUser?.branch || 'Merkez'
                })
            });

            if (res.ok) {
                await fetchShifts();
                setShowShiftModal(false);
                setNewShift({ staffId: '', start: '', end: '', type: 'Normal' });
                showSuccess("Vardiya Eklendi", "Vardiya planı başarıyla oluşturuldu.");
            }
        } catch (e) { console.error(e); }
        finally { setIsProcessing(false); }
    };

    const handleDeleteShift = async (shiftId: string) => {
        setIsProcessing(true);
        try {
            await fetch(`/api/staff/shifts?id=${shiftId}`, { method: 'DELETE' });
            await fetchShifts();
            showSuccess("Vardiya Silindi", "Vardiya planı kaldırıldı.");
        } catch (e) { console.error(e); }
        finally { setIsProcessing(false); }
    };

    // --- LEAVE REQUEST LOGIC ---
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [newLeave, setNewLeave] = useState({
        staffId: '', type: 'Yıllık İzin', startDate: '', endDate: '', description: ''
    });

    const handleCreateLeave = async () => {
        if (!newLeave.staffId || !newLeave.startDate || !newLeave.endDate) return;
        setIsProcessing(true);
        try {
            const res = await fetch('/api/staff/leaves', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    staffId: newLeave.staffId,
                    type: newLeave.type,
                    startDate: newLeave.startDate,
                    endDate: newLeave.endDate,
                    description: newLeave.description,
                    status: 'Beklemede'
                })
            });

            if (res.ok) {
                await fetchLeaves();
                setShowLeaveModal(false);
                setNewLeave({ staffId: '', type: 'Yıllık İzin', startDate: '', endDate: '', description: '' });
                showSuccess("İzin Talebi Oluşturuldu", "Yönetici onayı bekleniyor.");
            }
        } catch (e) { console.error(e); }
        finally { setIsProcessing(false); }
    };

    const handleUpdateLeaveStatus = async (id: string, status: string) => {
        setIsProcessing(true);
        try {
            const res = await fetch('/api/staff/leaves', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id,
                    status,
                    approvedBy: currentUser?.name || 'Yönetici'
                })
            });

            if (res.ok) {
                await fetchLeaves();
                showSuccess(`İzin ${status}`, `İzin talebi başarıyla ${status.toLowerCase()}ildi.`);
            }
        } catch (e) { console.error(e); }
        finally { setIsProcessing(false); }
    };

    const handleGeneratePayrolls = async () => {
        const period = new Date().toISOString().slice(0, 7);
        setIsProcessing(true);
        try {
            const res = await fetch('/api/staff/payroll', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ period })
            });

            if (res.ok) {
                const data = await res.json();
                showSuccess("Başarılı", data.message || "Bordrolar başarıyla oluşturuldu.");
                await fetchPayrolls();
            }
        } catch (e) {
            console.error(e);
            showError("Hata", "Bordrolar oluşturulamadı.");
        } finally {
            setIsProcessing(false);
        }
    };

    // --- PAYROLL MANAGEMENT LOGIC ---
    const [showPayrollModal, setShowPayrollModal] = useState(false);
    const [currentPayroll, setCurrentPayroll] = useState({
        staffId: '', staffName: '', salary: 0, bonus: 0, deductions: 0, netPay: 0, period: ''
    });

    const [updateBaseSalary, setUpdateBaseSalary] = useState(false);

    const handleOpenPayrollModal = (person: any) => {
        setUpdateBaseSalary(false);
        const period = new Date().toISOString().slice(0, 7);
        const existing = payrolls.find(p => p.staffId === person.id);

        setCurrentPayroll({
            staffId: person.id,
            staffName: person.name,
            salary: existing ? Number(existing.salary) : Number(person.salary || 17002),
            bonus: existing ? Number(existing.bonus) : 0,
            deductions: existing ? Number(existing.deductions) : 0,
            netPay: existing ? Number(existing.netPay) : Number(person.salary || 17002),
            period: period
        });
        setShowPayrollModal(true);
    };

    const handleSavePayroll = async () => {
        setIsProcessing(true);
        const net = Number(currentPayroll.salary) + Number(currentPayroll.bonus) - Number(currentPayroll.deductions);

        try {
            const res = await fetch('/api/staff/payroll', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    staffId: currentPayroll.staffId,
                    period: currentPayroll.period,
                    salary: currentPayroll.salary,
                    bonus: currentPayroll.bonus,
                    deductions: currentPayroll.deductions,
                    netPay: net,
                    status: 'Bekliyor'
                })
            });

            if (res.ok) {
                if (updateBaseSalary) {
                    await fetch('/api/staff', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: currentPayroll.staffId, salary: currentPayroll.salary })
                    });
                    await refreshStaff();
                }

                await fetchPayrolls();
                setShowPayrollModal(false);
                showSuccess("Bordro Kaydedildi", "Ödeme emri başarıyla oluşturuldu.");
            }
        } catch (e) { console.error(e); }
        finally { setIsProcessing(false); }
    };

    const handleMarkAsPaid = (payroll: any) => {
        if (!kasalar || kasalar.length === 0) {
            showSuccess("Hata", "Ödeme yapılacak kasa bulunamadı. Lütfen sayfayı yenileyin.");
            return;
        }

        showConfirm('Ödeme Onayı', `${payroll.staff?.name || 'Personel'} için ${Number(payroll.netPay).toLocaleString()} TL ödeme yapılacak ve kasadan düşülecek. Onaylıyor musunuz?`, async () => {
            setIsProcessing(true);
            try {
                const res = await fetch('/api/staff/payroll', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: payroll.id, status: 'Ödendi' })
                });

                if (res.ok) {
                    const kasaId = kasalar.find(k => k.type === 'Nakit')?.id || kasalar[0]?.id;

                    if (addFinancialTransaction && kasaId) {
                        await addFinancialTransaction({
                            type: 'Expense',
                            amount: Number(payroll.netPay),
                            description: `Maaş Ödemesi: ${payroll.staff?.name} (${payroll.period})`,
                            kasaId: kasaId.toString()
                        });
                    }

                    await fetchPayrolls();
                    showSuccess("Ödeme Yapıldı", "Maaş ödemesi muhasebeye işlendi.");
                }
            } catch (e) { console.error(e); }
            finally { setIsProcessing(false); }
        });
    };

    const handlePayAll = async () => {
        addNotification({ type: 'info', icon: '💰', text: 'Toplu ödeme servisi eklenecek.' });
    };

    const savePermissions = async () => {
        setIsProcessing(true);
        try {
            const res = await fetch('/api/staff', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: selectedStaff.id,
                    permissions: selectedStaff.permissions
                })
            });

            if (res.ok) {
                await refreshStaff();
                setShowPermissionModal(false);
                showSuccess("Yetkiler Kaydedildi", "Yeni yetki tanımları bir sonraki girişte aktif olacaktır.");
            }
        } catch (e) {
            console.error('Save permissions failed', e);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleResetDeviceStatus = async (staffId: string, staffName: string) => {
        showConfirm('Cihaz Kilidini Aç', `${staffName} personeli için mevcut PDKS cihaz eşleşmesi silinecek. Personel, yeni telefonuyla uygulama üzerinden tekrar ilk giriş kaydını yapabilir ve o cihaza mühürlenir. Onaylıyor musunuz?`, async () => {
            setIsProcessing(true);
            try {
                const res = await fetch('/api/admin/pdks/devices/reset', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ staffId })
                });

                const data = await res.json();
                if (data.success) {
                    showSuccess("Cihaz Kilidi Kaldırıldı", `${staffName} artık yeni cihazından sorunsuz PDKS girişi sağlayabilir.`);
                } else {
                    showSuccess("Hata", data.error || "İşlem yapılırken bir hata oluştu.");
                }
            } catch (e) {
                console.error('Reset device failed', e);
                showSuccess("Hata", "Ağ hatası oluştu.");
            } finally {
                setIsProcessing(false);
            }
        });
    };

    const handleProcessAttendance = async (staffId: string, type: 'CHECK_IN' | 'CHECK_OUT') => {
        setIsProcessing(true);
        try {
            const res = await fetch('/api/staff/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    staffId,
                    type,
                    location: 'Merkez Ofis', // Default for manual
                    deviceInfo: 'Yönetici Paneli'
                })
            });

            if (res.ok) {
                showSuccess(type === 'CHECK_IN' ? "Giriş Yapıldı" : "Çıkış Yapıldı", "İşlem başarıyla PDKS kayıtlarına işlendi.");
                fetchAttendance();
                if (activeTab === 'puantaj') fetchPuantaj();
            } else {
                const data = await res.json();
                showError("İşlem Başarısız", data.error || "Hata oluştu.");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDeleteStaff = (person: any) => {
        showConfirm("Personel Silinecek", `${person.name} isimli personeli silmek istediğinize emin misiniz?`, async () => {
            try {
                const res = await fetch(`/api/staff?id=${person.id}`, { method: 'DELETE' });
                if (res.ok) {
                    await refreshStaff();
                    showSuccess("Personel Başarıyla Silindi", "");
                }
            } catch (err) {
                console.error("Staff delete error", err);
            }
            finally { setIsProcessing(false); }
        });
    };

    const handleSaveTarget = async () => {
        if (newTarget.type === 'MATRIX') {
            if (!newTarget.staffId || !newTarget.targetValue || !newTarget.bonusAmount) {
                showError('Hata', 'Lütfen personel, yıllık şirket hedefi ve bonus havuzu alanlarını doldurun.');
                return;
            }
            setIsProcessing(true);
            try {
                const res = await fetch('/api/hr/performance/matrix', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        year: Number((newTarget as any).matrixYear) || new Date().getFullYear(),
                        totalTarget: parseFloat(newTarget.targetValue),
                        bonusPool: parseFloat(newTarget.bonusAmount),
                        staffIds: [newTarget.staffId]
                    })
                });
                if (res.ok) {
                    await fetchTargets();
                    setShowTargetModal(false);
                    setNewTarget({ staffId: '', type: 'TURNOVER', targetValue: '', period: 'MONTHLY', startDate: '', endDate: '', commissionRate: '', bonusAmount: '' });
                    showSuccess("Matrix Tanımlandı", "Yıllık hedefleme Q1-Q4 çeyreklerine eşit ağırlıkta dağıtıldı.");
                } else {
                    const data = await res.json();
                    showError("İşlem Başarısız", data.error || "Hata oluştu.");
                }
            } catch (e) {
                console.error(e);
            } finally {
                setIsProcessing(false);
            }
            return;
        }

        if (!newTarget.staffId || !newTarget.targetValue || !newTarget.startDate || !newTarget.endDate) {
            showError('Hata', 'Lütfen tüm alanları doldurun.');
            return;
        }
        setIsProcessing(true);
        try {
            const res = await fetch('/api/staff/targets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newTarget,
                    targetValue: parseFloat(newTarget.targetValue),
                    commissionRate: parseFloat(newTarget.commissionRate || '0'),
                    bonusAmount: parseFloat(newTarget.bonusAmount || '0')
                })
            });
            if (res.ok) {
                await fetchTargets();
                setShowTargetModal(false);
                setNewTarget({ staffId: '', type: 'TURNOVER', targetValue: '', period: 'MONTHLY', startDate: '', endDate: '', commissionRate: '', bonusAmount: '' });
                showSuccess("Hedef Tanımlandı", "Personel hedefleri güncellendi.");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="animate-fade-in relative">
            <style jsx>{`
                .staff-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
                    gap: 20px;
                }
                .perm-cat {
                    background: rgba(255,255,255,0.02);
                    border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 16px;
                    padding: 20px;
                }
            `}</style>

            {/* --- HEADER (HERO STRATEJİ BANDI) --- */}
            {/* --- HR COMMAND CENTER (STICKY) --- */}
            <div className="sticky top-0 z-40 bg-slate-50/95 dark:bg-[#0f172a]/95 backdrop-blur-md pb-4 pt-4 mb-6 border-b border-slate-200 dark:border-white/5 space-y-4">

                {/* TOP ACTIONS & COMPACT METRICS */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                    {/* Compact Metrics */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 px-4 py-2 rounded-[10px] flex items-center gap-3 shadow-sm">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-500 flex items-center justify-center text-[14px]">👥</div>
                            <div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Toplam Personel</div>
                                <div className="text-[16px] font-black leading-none text-slate-900 dark:text-white mt-0.5">{staff.length}</div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 px-4 py-2 rounded-[10px] flex items-center gap-3 shadow-sm">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-[14px]">✨</div>
                            <div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aktif Personel</div>
                                <div className="text-[16px] font-black leading-none text-emerald-600 dark:text-emerald-400 mt-0.5">{staff.filter(s => s.status === 'Müsait' || s.status === 'Aktif' || s.status === 'Boşta' || !s.status).length}</div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 px-4 py-2 rounded-[10px] flex items-center gap-3 shadow-sm">
                            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-500 flex items-center justify-center text-[14px]">⚡</div>
                            <div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Devam Eden İş</div>
                                <div className="text-[16px] font-black leading-none text-amber-600 dark:text-amber-400 mt-0.5">{staff.filter(s => s.currentJob).length}</div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 px-4 py-2 rounded-[10px] flex items-center gap-3 shadow-sm">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-[14px]">🎯</div>
                            <div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Açık Hedef</div>
                                <div className="text-[16px] font-black leading-none text-indigo-600 dark:text-indigo-400 mt-0.5">{targets.filter(t => t.status !== 'Tamamlandı').length}</div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-2">
                        {hasPermission('create_staff') && (
                            <button onClick={() => setShowAddStaffModal(true)} className="h-[36px] px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-[8px] font-bold text-[12px] flex items-center justify-center gap-1.5 transition-colors shadow-sm">
                                <span>+</span> Yeni Personel
                            </button>
                        )}
                        <button onClick={() => setShowTaskModal(true)} className="h-[36px] px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 rounded-[8px] font-bold text-[12px] flex items-center justify-center gap-1.5 transition-colors shadow-sm">
                            Görev Ata
                        </button>
                        <button className="h-[36px] px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 rounded-[8px] font-bold text-[12px] flex items-center justify-center gap-1.5 transition-colors shadow-sm hidden sm:flex">
                            Dışa Aktar
                        </button>
                    </div>
                </div>

                {/* GROUPED NAVIGATION & FILTERS */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mt-2">
                    <div className="flex w-full lg:w-max whitespace-nowrap overflow-x-auto items-center gap-6 px-1 custom-scroll select-none pb-1">
                        {[
                            { group: 'PERSONEL', items: [{ id: 'list', label: 'Personel Listesi' }, { id: 'roles', label: 'Roller & Yetkiler' }] },
                            { group: 'OPERASYON', items: [{ id: 'tasks', label: 'Görevler' }, { id: 'performance', label: 'Hedefler' }] },
                            { group: 'ZAMAN', items: [{ id: 'shifts', label: 'Vardiya' }, { id: 'leaves', label: 'İzinler' }, { id: 'attendance', label: 'PDKS' }, { id: 'puantaj', label: 'Puantaj' }] },
                            { group: 'FİNANS', items: [{ id: 'payroll', label: 'Bordro' }, { id: 'advances', label: 'Avans & Kesintiler' }] },
                            { group: 'DOSYALAR', items: [{ id: 'files', label: 'Personel Dosyaları' }] },
                        ].map((grp, i) => (
                            <div key={grp.group} className="flex items-center gap-3">
                                {i !== 0 && <div className="w-[1px] h-4 bg-slate-200 dark:bg-white/10 hidden sm:block"></div>}
                                <div className="flex items-center gap-1 bg-slate-100/50 dark:bg-slate-800/30 p-1 rounded-lg border border-slate-200/50 dark:border-white/5">
                                    {grp.items.map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={activeTab === tab.id
                                                ? "px-3 py-1.5 text-[12px] font-bold text-slate-900 dark:text-white bg-white dark:bg-[#0f172a] shadow-sm border border-slate-200/50 dark:border-white/10 rounded-[6px]"
                                                : "px-3 py-1.5 text-[12px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-all rounded-[6px]"
                                            }
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Quick Search & Filters for List */}
                    <div className="flex items-center gap-2">
                        <div className="relative w-full lg:w-[220px]">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                            </span>
                            <input
                                type="text"
                                placeholder="Personel ara..."
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-[8px] h-[36px] pl-9 pr-3 text-[12px] font-semibold outline-none focus:border-blue-500 shadow-sm transition-all text-slate-900 dark:text-white"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <select
                            className="h-[36px] px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-bold rounded-[8px] text-[12px] outline-none focus:border-blue-500 shadow-sm transition-colors w-[130px]"
                            onChange={(e) => setSearchTerm(e.target.value)}
                        >
                            <option value="">Tüm Dept.</option>
                            <option value="Yönetici">Yönetici</option>
                            <option value="Saha Satış">Saha Satış</option>
                            <option value="Merkez">Merkez</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* --- V2 TABS (OVERVIEW, TASKS, FILES) --- */}
            {activeTab === 'overview' && (
                <HrOverviewTab
                    staff={staff}
                    targets={targets}
                    setShowAddStaffModal={setShowAddStaffModal}
                    setShowTaskModal={setShowTaskModal}
                    setSelectedStaff={setSelectedStaff}
                />
            )}

            {activeTab === 'tasks' && (
                <HrTasksTab
                    staff={staff}
                    setSelectedStaff={setSelectedStaff}
                    setShowTaskModal={setShowTaskModal}
                />
            )}

            {activeTab === 'files' && (
                <HrFilesTab
                    staff={staff}
                    setSelectedStaff={setSelectedStaff}
                />
            )}

            {/* --- LIST TAB (OPERASYON TABLOSU) --- */}
            {activeTab === 'list' && (
                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] shadow-sm overflow-hidden flex flex-col">
                    <div className="overflow-auto max-h-[calc(100vh-270px)] custom-scroll">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 dark:bg-[#1e293b] text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest sticky top-0 z-20">
                                <tr>
                                    <th className="px-4 py-3 pl-6 font-bold w-[40px] border-b border-slate-200 dark:border-white/5"><input type="checkbox" className="w-4 h-4 rounded appearance-none border border-slate-300 dark:border-white/10 checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer" /></th>
                                    <th className="px-4 py-3 font-bold border-b border-slate-200 dark:border-white/5">Personel</th>
                                    <th className="px-4 py-3 font-bold border-b border-slate-200 dark:border-white/5">Rol & Şube</th>
                                    <th className="px-4 py-3 font-bold border-b border-slate-200 dark:border-white/5">Durum</th>
                                    <th className="px-4 py-3 font-bold border-b border-slate-200 dark:border-white/5">Bugün (Vardiya/İzin)</th>
                                    <th className="px-4 py-3 font-bold border-b border-slate-200 dark:border-white/5">PDKS</th>
                                    <th className="px-4 py-3 pr-6 font-bold text-right border-b border-slate-200 dark:border-white/5">İşlem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {filteredStaff.length > 0 ? filteredStaff?.map(person => {
                                    const activeAtt = attendance.find(a => a.staffId === person.id && !a.checkOut);
                                    const isAvailable = person.status === 'Müsait' || person.status === 'Boşta' || !person.status;
                                    const personTargets = targets.filter(t => t.staffId === person.id);

                                    return (
                                        <tr key={person.id} className="hover:bg-slate-50 dark:hover:bg-[#1e293b]/80 transition-colors h-[48px] group">
                                            <td className="px-4 py-2 pl-6 align-middle"><input type="checkbox" className="w-4 h-4 rounded appearance-none border border-slate-300 dark:border-white/10 checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer opacity-50 group-hover:opacity-100" /></td>
                                            <td className="px-4 py-2 align-middle">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#334155]/50 border border-slate-200 dark:border-white/5 flex items-center justify-center text-[12px] font-black text-slate-600 dark:text-slate-400">
                                                        {person.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="text-[13px] font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">{person.name}</div>
                                                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{person.email || '-'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2 align-middle">
                                                <div className="flex flex-col gap-1 items-start">
                                                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#334155]/50 text-[10px] font-bold tracking-wider text-slate-600 dark:text-slate-400 uppercase border border-slate-200 dark:border-white/5 whitespace-nowrap">{person.role}</span>
                                                    <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase whitespace-nowrap">{person.branch}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2 align-middle">
                                                <div className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${isAvailable ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}>
                                                    <div className={`w-1 h-1 rounded-full mr-1.5 ${isAvailable ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                                                    {person.status || 'Aktif'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-2 align-middle">
                                                <div className="flex flex-col gap-1.5">
                                                    {person.currentJob ? (
                                                        <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-500/20 flex items-center gap-1.5 whitespace-nowrap w-max">
                                                            <span className="animate-pulse w-1.5 h-1.5 rounded-full bg-amber-500"></span> İş: {person.currentJob.substring(0, 20)}{person.currentJob.length > 20 ? '...' : ''}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Normal Mesai</span>
                                                    )}

                                                    {personTargets.length > 0 && (
                                                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-500/20 flex items-center gap-1 w-max">
                                                            🎯 {personTargets.length}Açık Hedef
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-2 align-middle">
                                                <button
                                                    onClick={() => handleProcessAttendance(person.id.toString(), activeAtt ? 'CHECK_OUT' : 'CHECK_IN')}
                                                    disabled={isProcessing}
                                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border whitespace-nowrap ${activeAtt
                                                        ? 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100'
                                                        : 'bg-white dark:bg-[#0f172a] border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1e293b]'}`}
                                                >
                                                    {activeAtt ? '🏁 ÇIKIŞ' : '🚀 GİRİŞ'}
                                                </button>
                                            </td>
                                            <td className="px-4 py-2 pr-6 align-middle text-right">
                                                <div className="flex items-center justify-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => { setEditStaff(person); setShowEditStaffModal(true); }} className="w-7 h-7 rounded-md text-slate-500 dark:text-slate-400 hover:bg-blue-50 border hover:border-blue-200 border-transparent hover:text-blue-600 transition-all flex items-center justify-center font-bold" title="Düzenle">✏️</button>
                                                    <button onClick={() => { setSelectedStaff(person); setShowTaskModal(true); }} className="w-7 h-7 rounded-md text-slate-500 dark:text-slate-400 hover:bg-amber-50 border hover:border-amber-200 border-transparent hover:text-amber-600 transition-all flex items-center justify-center font-bold" title="Görev Ata">⚡</button>
                                                    <button onClick={() => { setSelectedStaff(person); setShowPermissionModal(true); }} className="w-7 h-7 rounded-md text-slate-500 dark:text-slate-400 hover:bg-emerald-50 border hover:border-emerald-200 border-transparent hover:text-emerald-600 transition-all flex items-center justify-center font-bold" title="Yetkiler">🛡️</button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan={7} className="p-16 text-center">
                                            <div className="flex flex-col items-center justify-center gap-4">
                                                <div className="w-16 h-16 bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-full flex items-center justify-center text-2xl text-slate-400">👥</div>
                                                <div className="text-slate-500 dark:text-slate-400 font-medium">Bu kriterlere uygun personel bulunamadı.</div>
                                                <button onClick={() => setShowAddStaffModal(true)} className="px-5 py-2.5 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300 font-bold rounded-[12px] text-[13px] hover:bg-slate-50 transition-colors shadow-sm">
                                                    + Yeni Personel Ekle
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            
            {/* --- ROLES TAB (BÖLÜNMÜŞ GÖRÜNÜM / MATRİS) --- */}
            {activeTab === 'roles' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500 min-h-[600px]">
                    {/* Sol Panel: Rol Listesi */}
                    <div className="lg:col-span-1 flex flex-col gap-4">
                        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] shadow-sm p-6 flex flex-col h-[600px]">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Mevcut Kurumsal Roller</h3>
                                <div className="group/tt relative inline-flex items-center justify-center">
                                    <span className="w-5 h-5 rounded-full border border-slate-300 dark:border-white/10 text-slate-400 flex items-center justify-center cursor-help text-[11px] font-bold">?</span>
                                    <div className="opacity-0 invisible group-hover/tt:opacity-100 group-hover/tt:visible absolute bottom-full -right-2 mb-2 w-[240px] p-3 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-xl shadow-lg text-slate-700 dark:text-slate-300 text-[12px] z-50 text-left">
                                        <div className="font-bold text-slate-900 dark:text-white mb-1">Kurumsal Roller</div>
                                        Seçtiğiniz rolün taşıdığı tüm kurumsal yetkileri sağ taraftan detaylıca görüntüleyebilir ve yetki matrisini güncelleyebilirsiniz.
                                    </div>
                                </div>
                            </div>
                            <div className="relative mb-5 flex-shrink-0">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                                <input type="text" placeholder="Rol ara..." className="w-full h-11 pl-10 pr-3 bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-xl text-[13px] outline-none focus:border-blue-500 transition-all font-medium" />
                            </div>
                            <div className="flex flex-col gap-3 overflow-y-auto custom-scrollbar flex-1 pb-4 pr-2">
                                {Object.keys(roleTemplates)?.map((roleName, idx) => {
                                    const isSelected = selectedRoleForPermissions === roleName;
                                    return (
                                        <button 
                                            key={idx} 
                                            onClick={() => setSelectedRoleForPermissions(roleName)}
                                            className={`flex items-center justify-between p-4 rounded-xl border transition-all text-left w-full ${isSelected ? 'bg-blue-50 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/20 shadow-sm' : 'bg-white dark:bg-[#0f172a] border-slate-100 dark:border-slate-800 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-[#1e293b]'}`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-inner ${isSelected ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                                                    {roleName.includes('Yönetici') || roleName.includes('Admin') ? '👑' : roleName.includes('Satış') ? '📍' : roleName.includes('Şube') ? '🏢' : roleName.includes('İK') || roleName.includes('İnsan') ? '👥' : '👤'}
                                                </div>
                                                <div>
                                                    <div className={`text-[14px] font-black ${isSelected ? 'text-blue-700 dark:text-blue-400' : 'text-slate-900 dark:text-white'}`}>{roleName}</div>
                                                    <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1 tracking-widest uppercase">{roleTemplates[roleName].length} Yetki İzni</div>
                                                </div>
                                            </div>
                                            <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-blue-600 dark:bg-blue-400 animate-pulse' : 'bg-emerald-500'}`}></div>
                                        </button>
                                    );
                                })}
                            </div>
                            <button className="mt-4 w-full h-11 flex-shrink-0 bg-slate-50 dark:bg-[#1e293b] hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300 font-bold tracking-widest uppercase rounded-[12px] text-[11px] transition-colors flex items-center justify-center gap-2">
                                <span className="text-lg">+</span> YENİ ROL ŞABLONU OLUŞTUR
                            </button>
                        </div>
                    </div>
                    {/* Sağ Panel: Yetki Matrisi */}
                    <div className="lg:col-span-2 flex flex-col h-full">
                        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] shadow-sm flex-1 flex flex-col overflow-hidden h-[600px]">
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50 dark:bg-[#1e293b] gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl shadow-lg border-2 border-slate-50 dark:border-slate-900 shrink-0">
                                        🛡️
                                    </div>
                                    <div>
                                        <h3 className="text-[18px] sm:text-lg font-black text-slate-900 dark:text-white leading-tight">{selectedRoleForPermissions} Rolü Yetkileri</h3>
                                        <p className="text-[10px] sm:text-[11px] font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400 mt-1">
                                            {selectedRoleForPermissions === 'Sistem Yöneticisi' ? 'Tüm modüllere sınırsız kurumsal erişim' : `${roleTemplates[selectedRoleForPermissions]?.length || 0} Adet Tanımlanmış Mikro Yetki`}
                                        </p>
                                    </div>
                                </div>
                                <button className="h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white font-black tracking-widest uppercase rounded-xl text-[11px] shadow-sm transition-colors flex items-center justify-center gap-2 shrink-0">
                                    <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
                                    DEĞİŞİKLİKLERİ KAYDET
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-white dark:bg-[#0f172a]">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
                                    {Object.entries(
                                        allPermissions.reduce((acc, perm) => {
                                            if (!acc[perm.category]) acc[perm.category] = [];
                                            acc[perm.category].push(perm);
                                            return acc;
                                        }, {} as Record<string, typeof allPermissions>)
                                    ).map(([category, perms]) => {
                                        const typeSafePerms = perms as Array<{id: string, label: string, category: string}>;
                                        const totalPerms = typeSafePerms.length;
                                        const selectedPermsLength = typeSafePerms.filter(p => selectedRoleForPermissions === 'Sistem Yöneticisi' ? true : roleTemplates[selectedRoleForPermissions]?.includes(p.id)).length;
                                        const isAllSelected = selectedPermsLength === totalPerms;
                                        return (
                                            <div key={category} className="space-y-4">
                                                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                                                    <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                                        <span className="text-blue-500 text-sm">✦</span> {category}
                                                    </h4>
                                                    <label className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 cursor-pointer hover:text-blue-500 transition-colors">
                                                        <input type="checkbox" checked={selectedRoleForPermissions === 'Sistem Yöneticisi' || isAllSelected} readOnly className="w-3.5 h-3.5 rounded-sm border-slate-300 text-blue-600 cursor-pointer" />
                                                        TÜMÜ
                                                    </label>
                                                </div>
                                                <div className="flex flex-col gap-2.5">
                                                    {typeSafePerms.map(perm => {
                                                        const isChecked = selectedRoleForPermissions === 'Sistem Yöneticisi' ? true : roleTemplates[selectedRoleForPermissions]?.includes(perm.id);
                                                        return (
                                                            <label key={perm.id} className={`flex items-start gap-3 p-3.5 rounded-xl border ${isChecked ? 'bg-blue-50/50 border-blue-200 dark:bg-blue-500/5 dark:border-blue-500/20 shadow-sm' : 'bg-white dark:bg-[#0f172a] border-slate-200 dark:border-white/5 hover:border-slate-300 transition-colors'} cursor-pointer group`}>
                                                                <div className="pt-0.5 shrink-0">
                                                                    <input type="checkbox" checked={isChecked || false} readOnly className={`w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer transition-all ${isChecked ? 'ring-2 ring-blue-500/20' : ''}`} />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <span className={`text-[13px] font-bold block mb-1 transition-colors ${isChecked ? 'text-blue-900 dark:text-blue-100' : 'text-slate-700 group-hover:text-slate-900 dark:text-slate-300 dark:group-hover:text-white'}`}>{perm.label}</span>
                                                                    <span className="text-[10px] text-slate-400 font-medium font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded opacity-60 group-hover:opacity-100 transition-opacity whitespace-nowrap overflow-hidden text-ellipsis">{perm.id}</span>
                                                                </div>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- PERFORMANCE TAB (KPI KARTLARI + TABLO) --- */}
            {activeTab === 'performance' && (
                <HrTargetsTab staff={staff} targets={targets} fetchTargets={fetchTargets} setShowTargetModal={setShowTargetModal} />
            )}

            {/* --- SHIFT MANAGEMENT TAB (VARDİYA) --- */}
            {activeTab === 'shifts' && (
                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-white/5 flex flex-col md:flex-row md:justify-between md:items-center gap-4 bg-slate-50 dark:bg-[#1e293b]">
                        <div>
                            <h3 className="text-[16px] font-black text-slate-900 dark:text-white mb-1 flex items-center gap-2"><span>📅</span> Haftalık Vardiya Planı</h3>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">
                                {new Date(currentWeekStart).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} - {new Date(new Date(currentWeekStart).setDate(new Date(currentWeekStart).getDate() + 6)).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                onClick={() => {
                                    const d = new Date(currentWeekStart);
                                    d.setDate(d.getDate() - 7);
                                    setCurrentWeekStart(d);
                                }}
                                className="h-9 px-3 rounded-xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 hover:bg-slate-50 text-slate-700 dark:text-slate-300 text-[12px] font-bold transition-all shadow-sm"
                            >
                                ◀ Önceki Hafta
                            </button>
                            <button
                                onClick={() => {
                                    const d = new Date(currentWeekStart);
                                    d.setDate(d.getDate() + 7);
                                    setCurrentWeekStart(d);
                                }}
                                className="h-9 px-3 rounded-xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 hover:bg-slate-50 text-slate-700 dark:text-slate-300 text-[12px] font-bold transition-all shadow-sm"
                            >
                                Sonraki Hafta ▶
                            </button>
                            <button
                                onClick={() => setShowShiftModal(true)}
                                className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold transition-all ml-1 shadow-sm">+ YENİ PLAN</button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead className="bg-slate-50 dark:bg-[#1e293b] text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-slate-200 dark:border-white/5">
                                <tr>
                                    <th className="p-4 pl-6 border-r border-slate-200 dark:border-white/5 w-[200px] sticky left-0 bg-slate-50 dark:bg-[#1e293b] z-10">PERSONEL</th>
                                    <th className="p-4 border-r border-slate-200 dark:border-white/5 text-center w-[14%]">Pzt</th>
                                    <th className="p-4 border-r border-slate-200 dark:border-white/5 text-center w-[14%]">Sal</th>
                                    <th className="p-4 border-r border-slate-200 dark:border-white/5 text-center w-[14%]">Çar</th>
                                    <th className="p-4 border-r border-slate-200 dark:border-white/5 text-center w-[14%]">Per</th>
                                    <th className="p-4 border-r border-slate-200 dark:border-white/5 text-center w-[14%]">Cum</th>
                                    <th className="p-4 text-center w-[14%]">Cmt</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {staff?.map((person) => (
                                    <tr key={person.id} className="hover:bg-slate-50 dark:bg-[#1e293b]/50 transition-colors h-[60px] group">
                                        <td className="p-4 pl-6 border-r border-slate-100 dark:border-white/5 font-bold sticky left-0 bg-white dark:bg-[#0f172a] group-hover:bg-slate-50/95 z-10 transition-colors shadow-[1px_0_0_0_#f1f5f9]">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-[#334155]/50 border border-slate-200 dark:border-white/5 flex items-center justify-center text-[11px] font-black text-slate-600 dark:text-slate-400">
                                                    {person.name.charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <div className="text-[13px] text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">{person.name}</div>
                                                    <div className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase mt-0.5">{person.role}</div>
                                                </div>
                                            </div>
                                        </td>
                                        {[0, 1, 2, 3, 4, 5, 6]?.map((offset) => {
                                            const d = new Date(currentWeekStart);
                                            d.setDate(d.getDate() + offset);
                                            const shift = shifts.find(s => s.staffId === person.id && new Date(s.start).getDate() === d.getDate());

                                            return (
                                                <td key={offset} className="p-2 border-r border-slate-100 dark:border-white/5 text-center align-middle hover:bg-slate-50 dark:bg-[#1e293b] transition-colors cursor-crosshair">
                                                    {shift ? (
                                                        <div className="relative group/shift flex justify-center w-full">
                                                            {shift.type === 'İzinli' ? (
                                                                <div className="w-full mx-1.5 px-2 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] font-bold tracking-widest text-amber-600">
                                                                    İZİNLİ
                                                                </div>
                                                            ) : (
                                                                <div className="w-full mx-1.5 flex flex-col items-center justify-center py-1.5 rounded-lg bg-blue-50 border border-blue-200 hover:border-blue-300 transition-colors">
                                                                    <span className="text-[11px] font-bold tracking-wider text-blue-700">
                                                                        {new Date(shift.start).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} - {new Date(shift.end).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleDeleteShift(shift.id); }}
                                                                className="absolute -top-2 -right-1 w-5 h-5 bg-white dark:bg-[#0f172a] border border-rose-200 text-rose-500 rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover/shift:opacity-100 transition-all shadow-sm z-20 hover:bg-rose-50 hover:border-rose-300 font-black cursor-pointer"
                                                                title="Vardiyayı Sil"
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="text-[10px] text-slate-300 group-hover:text-slate-400 font-medium">-</div>
                                                    )}
                                                </td>
                                            )
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* --- LEAVE MANAGEMENT TAB (İZİNLER) --- */}
            {activeTab === 'leaves' && (() => {
                const pendingLeaves = leaves.filter(l => l.status === 'Bekliyor' || l.status === 'Beklemede');
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const activeLeavesToday = leaves.filter(l => {
                    if (l.status !== 'Onaylandı') return false;
                    const start = new Date(l.startDate);
                    start.setHours(0, 0, 0, 0);
                    const end = new Date(l.endDate);
                    end.setHours(23, 59, 59, 999);
                    return start <= today && end >= today;
                });

                return (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Aktif İzinliler */}
                        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[16px] shadow-sm p-6 flex flex-col justify-between">
                            <h4 className="text-[11px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div> BUGÜN İZİNLİLER</h4>
                            <div className="text-[32px] font-black text-slate-900 dark:text-white mt-3">{activeLeavesToday.length} <span className="text-[14px] font-medium text-slate-500 dark:text-slate-400 ml-1">Kişi</span></div>
                            <div className="flex -space-x-2 mt-3">
                                {activeLeavesToday.slice(0, 5).map(l => (
                                    <div key={l.id} title={l.staff?.name} className="w-7 h-7 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-400">
                                        {l.staff?.name?.charAt(0)?.toUpperCase()}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Bekleyen Onaylar */}
                        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[16px] shadow-sm p-6 border-l-4 border-l-amber-500 flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[11px] font-bold tracking-widest text-amber-700 flex items-center gap-1.5 uppercase"><div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div> BEKLEYEN ONAYLAR</h4>
                            </div>
                            <div className="text-[32px] font-black text-slate-900 dark:text-white mt-3">{pendingLeaves.length} <span className="text-[14px] font-medium text-slate-500 dark:text-slate-400 ml-1">Talep</span></div>
                            <p className="text-[11px] text-slate-400 font-semibold mt-3">Yönetici onayı bekliyor.</p>
                        </div>

                        {/* Aksiyon */}
                        <button
                            onClick={() => setShowLeaveModal(true)}
                            className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[16px] shadow-sm p-5 border-2 border-dashed hover:border-blue-500 hover:bg-blue-50 transition-all text-center flex flex-col items-center justify-center gap-3 w-full h-full min-h-[140px]"
                        >
                            <span className="text-2xl">📝</span>
                            <span className="font-bold text-sm text-blue-600">YENİ İZİN TALEBİ OLUŞTUR</span>
                        </button>
                    </div>

                    <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] shadow-sm overflow-hidden mt-6">
                        <div className="p-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                            <h3 className="text-[16px] font-black text-slate-900 dark:text-white">İzin Hareketleri</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-[#1e293b] border-b border-slate-200 dark:border-white/5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                    <tr>
                                        <th className="p-4 pl-6 font-bold">Personel</th>
                                        <th className="p-4 font-bold">İzin Türü</th>
                                        <th className="p-4 font-bold">Tarih Aralığı</th>
                                        <th className="p-4 font-bold">Süre</th>
                                        <th className="p-4 font-bold">Durum</th>
                                        <th className="p-4 pr-6 font-bold text-right">İşlem</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {leaves.length > 0 ? (
                                        leaves?.map((leave, idx) => (
                                            <tr key={leave.id} className="hover:bg-slate-50 dark:bg-[#1e293b]/70 transition-colors h-[56px] group">
                                                <td className="p-4 pl-6 align-middle font-bold text-slate-900 dark:text-white text-[13px]">{leave.staff?.name}</td>
                                                <td className="p-4 align-middle">
                                                    <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-300">{leave.type}</span>
                                                </td>
                                                <td className="p-4 align-middle text-[12px] text-slate-500 dark:text-slate-400 font-medium">
                                                    {new Date(leave.startDate).toLocaleDateString('tr-TR')} - {new Date(leave.endDate).toLocaleDateString('tr-TR')}
                                                </td>
                                                <td className="p-4 align-middle text-[13px] font-black text-slate-900 dark:text-white">{leave.days} Gün</td>
                                                <td className="p-4 align-middle">
                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border inline-flex items-center gap-1.5
                                                        ${leave.status === 'Onaylandı' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                                            leave.status === 'Reddedildi' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                                                                'bg-amber-50 text-amber-600 border-amber-200'
                                                        }`}>
                                                        <div className={`w-1 h-1 rounded-full ${leave.status === 'Onaylandı' ? 'bg-emerald-500' : leave.status === 'Reddedildi' ? 'bg-rose-500' : 'bg-amber-500'}`}></div>
                                                        {leave.status}
                                                    </span>
                                                </td>
                                                <td className="p-4 pr-6 align-middle text-right text-[11px]">
                                                    {leave.status === 'Bekliyor' || leave.status === 'Beklemede' ? (
                                                        <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => handleUpdateLeaveStatus(leave.id, 'Onaylandı')}
                                                                disabled={isProcessing}
                                                                className="h-8 px-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 font-bold hover:bg-emerald-100 transition-colors shadow-sm text-[11px]"
                                                                title="Onayla"
                                                            >
                                                                ONAYLA
                                                            </button>
                                                            <button
                                                                onClick={() => handleUpdateLeaveStatus(leave.id, 'Reddedildi')}
                                                                disabled={isProcessing}
                                                                className="h-8 px-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 font-bold hover:bg-rose-100 transition-colors shadow-sm text-[11px]"
                                                                title="Reddet"
                                                            >
                                                                REDDET
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="text-[10px] text-slate-400 font-bold uppercase">
                                                            {leave.approvedBy ? `${leave.status === 'Onaylandı' ? 'ONAYLAYAN:' : 'REDDEDEN:'} ${leave.approvedBy}` : '-'}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="p-16 text-center">
                                                <div className="flex flex-col items-center justify-center gap-3">
                                                    <span className="text-3xl opacity-50">🌴</span>
                                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Henüz izin talebi bulunmuyor.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                             </table>
                        </div>
                    </div>
                </div>
                );
            })()}

            {/* --- PAYROLL TAB (BORDRO) --- */}
            {activeTab === 'payroll' && (
                <PayrollModule />
            )}

            {/* --- ADVANCES TAB (AVANS VE KESİNTİLER) --- */}
            {activeTab === 'advances' && (
                <AdvancesModule staffList={staff} />
            )}

            {activeTab === 'attendance' && (
                <div className="space-y-6">
                    <div className="flex gap-6 border-b border-slate-200 dark:border-slate-800 mb-6 pb-0">
                        <button 
                            className={`pb-3 text-[13px] font-bold border-b-2 transition-colors ${pdksSubTab === 'puantaj' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`} 
                            onClick={() => setPdksSubTab('puantaj')}
                        >
                            Puantaj ve Mesai
                        </button>
                        <button 
                            className={`pb-3 text-[13px] font-bold border-b-2 transition-colors ${pdksSubTab === 'onay' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`} 
                            onClick={() => setPdksSubTab('onay')}
                        >
                            Onay Havuzu
                        </button>
                        <button 
                            className={`pb-3 text-[13px] font-bold border-b-2 transition-colors ${pdksSubTab === 'tabletler' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`} 
                            onClick={() => setPdksSubTab('tabletler')}
                        >
                            Tablet Yönetimi
                        </button>
                        <button 
                            className={`pb-3 text-[13px] font-bold border-b-2 transition-colors ${pdksSubTab === 'loglar' ? 'border-purple-500 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`} 
                            onClick={() => setPdksSubTab('loglar')}
                        >
                            Tüm Hareketler
                        </button>
                    </div>

                    {pdksSubTab === 'puantaj' && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[16px] shadow-sm p-6 border-l-4 border-l-emerald-500 flex flex-col justify-between">
                            <h4 className="text-[11px] font-bold tracking-widest text-emerald-700 flex items-center gap-1.5 uppercase"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> ŞU AN ÇALIŞAN</h4>
                            <div className="text-[32px] font-black text-slate-900 dark:text-white mt-3">{attendance.filter(a => !a.checkOut).length} <span className="text-[14px] font-medium text-slate-500 dark:text-slate-400 ml-1">Kişi</span></div>
                        </div>
                        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[16px] shadow-sm p-6 border-l-4 border-l-rose-500 flex flex-col justify-between">
                            <h4 className="text-[11px] font-bold tracking-widest text-rose-700 flex items-center gap-1.5 uppercase"><div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div> GEÇ KALANLAR</h4>
                            <div className="text-[32px] font-black text-slate-900 dark:text-white mt-3">0 <span className="text-[14px] font-medium text-slate-500 dark:text-slate-400 ml-1">Kişi</span></div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-white dark:bg-[#0f172a]">
                            <h3 className="text-[16px] font-black text-slate-900 dark:text-white flex items-center gap-2"><span>📍</span> PDKS (Personel Devam Kontrol Sistemi) Takibi</h3>
                        </div>
                        <div className="overflow-x-auto pb-10">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-[#1e293b] border-b border-slate-200 dark:border-white/5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                    <tr>
                                        <th className="p-4 pl-6 font-bold w-12">Detay</th>
                                        <th className="p-4 font-bold">Personel</th>
                                        <th className="p-4 font-bold">Aylık Toplam Kayıt</th>
                                        <th className="p-4 font-bold">Durum</th>
                                        <th className="p-4 pr-6 font-bold text-right">Aksiyon</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                    {staff?.map(person => {
                                        const personLogs = attendance.filter(a => a.staffId === person.id);
                                        const isWorkingNow = personLogs.some(a => !a.checkOut);
                                        const isExpanded = expandedPdksStaffId === person.id;
                                        return (
                                            <Fragment key={person.id}>
                                                <tr 
                                                    onClick={() => setExpandedPdksStaffId(isExpanded ? null : String(person.id))}
                                                    className={`hover:bg-slate-50 dark:hover:bg-[#1e293b]/70 transition-colors h-[64px] cursor-pointer group select-none ${isExpanded ? 'bg-slate-50/50 dark:bg-[#1e293b]/50' : ''}`}
                                                >
                                                    <td className="p-4 pl-6 align-middle">
                                                        <div className={`w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center transition-transform ${isExpanded ? 'rotate-180 bg-slate-200 text-slate-600' : 'bg-white text-slate-400'}`}>
                                                            <span className="text-[10px]">▼</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 align-middle font-bold text-slate-900 dark:text-white text-[13px]">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-[12px]">
                                                                {person.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <div className="text-[13px] font-bold">{person.name}</div>
                                                                <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">{person.role}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 align-middle text-[14px] font-black text-slate-700 dark:text-slate-300">
                                                        {personLogs.length} İşlem
                                                    </td>
                                                    <td className="p-4 align-middle">
                                                        {isWorkingNow ? (
                                                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-600 border-emerald-200">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> ŞU AN MESAİDE
                                                            </span>
                                                        ) : (
                                                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border inline-flex items-center gap-1.5 bg-slate-50 text-slate-500 border-slate-200">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div> DIŞARIDA
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="p-4 pr-6 align-middle text-right">
                                                        <button 
                                                            className="text-[11px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-widest"
                                                        >
                                                            {isExpanded ? 'Gizle' : 'Günlük Hareketler'}
                                                        </button>
                                                    </td>
                                                </tr>
                                                
                                                {/* Expanded Details Row */}
                                                {isExpanded && (
                                                    <tr>
                                                        <td colSpan={5} className="p-0 border-none bg-slate-50/50 dark:bg-[#0f172a]">
                                                            <div className="py-6 px-16 border-t border-slate-100 dark:border-white/5 animate-in slide-in-from-top-2 duration-200">
                                                                <div className="flex items-center justify-between mb-4">
                                                                    <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                                                        <span>🕒</span> {person.name} - Son Hareket Geçmişi
                                                                    </h4>
                                                                    <button 
                                                                        onClick={() => handleResetDeviceStatus(person.id, person.name)}
                                                                        className="h-7 px-3 bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200 rounded-lg text-[10px] font-bold tracking-widest uppercase transition-colors flex items-center gap-1.5 shadow-sm"
                                                                    >
                                                                        <span>🔓</span> CİHAZ KİLİDİNİ KALDIR
                                                                    </button>
                                                                </div>
                                                                {personLogs.length > 0 ? (
                                                                    <div className="bg-white dark:bg-[#1e293b]/30 border border-slate-200 dark:border-white/5 rounded-xl overflow-hidden shadow-sm">
                                                                        <table className="w-full text-left text-[12px]">
                                                                            <thead className="bg-slate-50 dark:bg-[#1e293b]/50 border-b border-slate-100 dark:border-white/5">
                                                                                <tr>
                                                                                    <th className="py-3 px-4 font-semibold text-slate-500">Tarih</th>
                                                                                    <th className="py-3 px-4 font-semibold text-slate-500">Giriş Saati</th>
                                                                                    <th className="py-3 px-4 font-semibold text-slate-500">Çıkış Saati</th>
                                                                                    <th className="py-3 px-4 font-semibold text-slate-500">Toplam Süre</th>
                                                                                    <th className="py-3 px-4 font-semibold text-slate-500">Giriş Konumu / Durum</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                                                                {personLogs.sort((a,b)=>new Date(b.date).getTime() - new Date(a.date).getTime()).map(log => (
                                                                                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                                                                                        <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                                                                                            {new Date(log.date).toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                                                                        </td>
                                                                                        <td className="py-3 px-4 font-mono font-bold text-emerald-600">
                                                                                            {new Date(log.checkIn).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                                                                        </td>
                                                                                        <td className="py-3 px-4 font-mono font-bold text-blue-600">
                                                                                            {log.checkOut ? new Date(log.checkOut).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : (
                                                                                                <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-700 rounded-md">DEVAM EDİYOR</span>
                                                                                            )}
                                                                                        </td>
                                                                                        <td className="py-3 px-4 font-black text-slate-900 dark:text-white">
                                                                                            {log.workingHours ? `${log.workingHours} Sa` : '-'}
                                                                                        </td>
                                                                                        <td className="py-3 px-4 text-slate-500">
                                                                                            {log.deviceInfo || log.locationIn || 'Ofis / Geçiş Noktası'}
                                                                                        </td>
                                                                                    </tr>
                                                                                ))}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                ) : (
                                                                    <div className="text-center py-8 text-[12px] font-medium text-slate-400 border border-dashed border-slate-300 dark:border-white/10 rounded-xl">
                                                                        Bu personelin henüz herhangi bir PDKS kaydı bulunmuyor.
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </Fragment>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                 </>
                 )}

                 {pdksSubTab !== 'puantaj' && (
                     <PdksSecurityModule activeSubTab={pdksSubTab} setActiveSubTab={setPdksSubTab} />
                 )}
                </div>
            )}

            {/* --- PUANTAJ TAB --- */}
            {activeTab === 'puantaj' && (
                <div className="space-y-6">
                    <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[16px] shadow-sm p-6 flex flex-wrap gap-4 items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="text-[16px] font-black text-slate-900 dark:text-white">Aylık Puantaj Çizelgesi</div>
                            <input
                                type="month"
                                className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[12px] px-4 h-9 text-[13px] font-semibold text-slate-700 dark:text-slate-300 outline-none focus:border-blue-500 shadow-sm"
                                value={selectedPeriod}
                                onChange={(e) => setSelectedPeriod(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-5 bg-slate-50 dark:bg-[#1e293b] px-5 py-2.5 rounded-xl border border-slate-100 dark:border-white/5">
                            <div className="flex items-center gap-2"><div className="w-2 h-2 bg-emerald-500 rounded-full shadow-sm"></div> <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">ÇALIŞILAN</span></div>
                            <div className="flex items-center gap-2"><div className="w-2 h-2 bg-blue-500 rounded-full shadow-sm"></div> <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">İZİNLİ</span></div>
                            <div className="flex items-center gap-2"><div className="w-2 h-2 bg-rose-500 rounded-full shadow-sm"></div> <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">GELMEDİ</span></div>
                            <div className="flex items-center gap-2"><div className="w-2 h-2 bg-slate-300 rounded-full shadow-sm"></div> <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">HAFTA TATİLİ</span></div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] shadow-sm overflow-hidden overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-[#1e293b] text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest border-b border-slate-200 dark:border-white/5">
                                    <th className="p-4 pl-6 sticky left-0 bg-slate-50 dark:bg-[#1e293b] z-10 w-[180px] border-r border-slate-200 dark:border-white/5">Personel</th>
                                    {[...Array(new Date(Number(selectedPeriod.split('-')[0]), Number(selectedPeriod.split('-')[1]), 0).getDate())]?.map((_, i) => (
                                        <th key={i} className="py-4 text-center w-8 border-l border-slate-200 dark:border-white/5/50">{i + 1}</th>
                                    ))}
                                    <th className="p-4 pr-6 text-center border-l border-slate-200 dark:border-white/5">Toplam</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {puantaj?.map((row: any) => (
                                    <tr key={row.staffId} className="hover:bg-slate-50 dark:bg-[#1e293b]/70 transition-colors h-[56px]">
                                        <td className="p-4 pl-6 font-bold text-[13px] sticky left-0 bg-white dark:bg-[#0f172a] border-r border-slate-100 dark:border-white/5 z-10">
                                            {row.name}
                                            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5 tracking-wider">{row.role}</div>
                                        </td>
                                        {row.dailyStats?.map((stat: any, idx: number) => (
                                            <td key={idx} className="p-1.5 border-l border-slate-100 dark:border-white/5/50 text-center align-middle">
                                                <div className={`w-5 h-5 mx-auto rounded flex items-center justify-center text-[10px] font-bold shadow-sm ${stat.status === 'WORKED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                                                    stat.status === 'LEAVE' ? 'bg-blue-50 text-blue-600 border border-blue-200' :
                                                        stat.status === 'OFF_DAY' ? 'bg-slate-50 text-slate-500 border border-slate-200' :
                                                            'bg-rose-50 text-rose-600 border border-rose-200'
                                                    }`}>
                                                    {stat.status === 'WORKED' ? 'Ç' : stat.status === 'LEAVE' ? 'İ' : stat.status === 'OFF_DAY' ? 'H' : 'X'}
                                                </div>
                                            </td>
                                        ))}
                                        <td className="p-4 pr-6 text-center border-l border-slate-100 dark:border-white/5">
                                            <div className="text-[12px] font-black text-slate-900 dark:text-white whitespace-nowrap">{row.summary.workedDays} G / {row.summary.workedHours} S</div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* --- MODALS --- */}

            {/* 1. TASK ASSIGN MODAL */}
            {showTaskModal && selectedStaff && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
                    <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
                        <div className="p-5 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-white dark:bg-[#0f172a] shrink-0">
                            <h2 className="text-[16px] font-black text-slate-900 dark:text-white flex items-center gap-2">
                                <span>⚡</span> Görev Ata
                            </h2>
                            <button onClick={() => setShowTaskModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:bg-[#334155]/50 text-slate-500 hover:text-slate-800 dark:text-slate-200 transition-colors">✕</button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-[#1e293b] rounded-[16px] border border-slate-100 dark:border-white/5">
                                <div className="w-12 h-12 rounded-[12px] bg-white dark:bg-[#0f172a] shadow-sm flex items-center justify-center text-[18px] font-black text-blue-600 border border-slate-200 dark:border-white/5">
                                    {selectedStaff.name.charAt(0)}
                                </div>
                                <div>
                                    <div className="text-[15px] font-black text-slate-900 dark:text-white">{selectedStaff.name}</div>
                                    <div className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-widest">{selectedStaff.role}</div>
                                </div>
                            </div>

                            <textarea
                                className="w-full h-32 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[16px] p-4 text-[13px] font-medium text-slate-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none resize-none shadow-sm"
                                placeholder="Görevi detaylı açıklayınız..."
                                value={taskContent}
                                onChange={(e) => setTaskContent(e.target.value)}
                            />

                            <div className="flex gap-2">
                                {['düşük', 'normal', 'yüksek']?.map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setTaskPriority(p)}
                                        className={`flex-1 h-9 rounded-xl text-[11px] font-bold tracking-widest uppercase transition-all border shadow-sm ${taskPriority === p
                                            ? (p === 'yüksek' ? 'bg-rose-50 text-rose-600 border-rose-200' : p === 'normal' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200')
                                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                                            }`}
                                    >
                                        {p} Öncelik
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={handleAssignTask}
                                disabled={isProcessing || !taskContent}
                                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-[12px] font-bold text-[13px] transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isProcessing ? 'ATANIYOR...' : 'GÖREVİ İLET'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. PERMISSIONS MODAL */}
            {showPermissionModal && selectedStaff && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
                    <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl">
                        <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-start bg-slate-50 dark:bg-[#1e293b]/50 shrink-0">
                            <div>
                                <h2 className="text-[18px] font-black text-slate-900 dark:text-white flex items-center gap-2">
                                    <span>🛡️</span> Erişim & Yetki Yönetimi
                                </h2>
                                <div className="text-[12px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1.5 flex items-center gap-2">
                                    <span>Personel:</span> <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">{selectedStaff.name}</span> <span className="text-slate-400">•</span> <span className="text-slate-600 dark:text-slate-400">{selectedStaff.role}</span>
                                </div>
                            </div>
                            <button onClick={() => setShowPermissionModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:bg-[#334155]/50 text-slate-500 hover:text-slate-800 dark:text-slate-200 transition-colors">✕</button>
                        </div>

                        {/* HIZLI ŞABLONLAR */}
                        <div className="px-6 py-4 bg-white dark:bg-[#0f172a] border-b border-slate-100 dark:border-white/5 flex items-center gap-4 shrink-0 overflow-x-auto">
                            <span className="text-[11px] font-black text-blue-600 uppercase tracking-widest whitespace-nowrap flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> HIZLI ŞABLONLAR:</span>
                            <div className="flex gap-2">
                                {Object.keys(roleTemplates)?.map(roleName => (
                                    <button
                                        key={roleName}
                                        onClick={() => {
                                            setSelectedStaff({ ...selectedStaff, permissions: roleTemplates[roleName] });
                                            addNotification({ type: 'success', icon: '🪄', text: `${roleName} şablonu uygulandı.` });
                                        }}
                                        className="h-8 px-4 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 shadow-sm transition-all whitespace-nowrap"
                                    >
                                        {roleName}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-[#1e293b]/30">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {Array.from(new Set(allPermissions?.map(p => p.category)))?.map(category => (
                                    <div key={category} className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[16px] p-5 shadow-sm">
                                        <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest border-b border-slate-100 dark:border-white/5 pb-3 mb-4 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div> {category} YETKİLERİ
                                        </h3>
                                        <div className="space-y-3">
                                            {allPermissions.filter(p => p.category === category)?.map(perm => {
                                                const isActive = (selectedStaff.permissions || []).includes(perm.id);
                                                return (
                                                    <label key={perm.id} className="flex items-start gap-3 cursor-pointer group select-none">
                                                        <div className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center transition-colors border shadow-sm shrink-0 ${isActive ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300 group-hover:border-blue-400'
                                                            }`}>
                                                            {isActive && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                                        </div>
                                                        <input
                                                            type="checkbox"
                                                            className="hidden"
                                                            checked={isActive}
                                                            onChange={() => togglePermission(perm.id)}
                                                        />
                                                        <span className={`text-[13px] font-semibold transition-colors leading-tight ${isActive ? 'text-slate-900' : 'text-slate-600 group-hover:text-slate-900'}`}>
                                                            {perm.label}
                                                        </span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* MÜŞTERİ KATEGORİ ERİŞİMİ */}
                            <div className="mt-6 p-6 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[16px] shadow-sm space-y-4">
                                <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/5 pb-4">
                                    <h3 className="text-[12px] font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                                        <span>🛡️</span> DATA SCOPING: MÜŞTERİ KATEGORİLERİ
                                    </h3>
                                    {selectedStaff.assignedCategoryIds?.length > 0 && (
                                        <button
                                            onClick={() => setSelectedStaff({ ...selectedStaff, assignedCategoryIds: [] })}
                                            className="h-7 px-3 rounded-lg bg-rose-50 text-rose-600 text-[10px] font-bold tracking-widest uppercase hover:bg-rose-100 transition-colors border border-rose-100"
                                        >
                                            KISITLAMALARI KALDIR
                                        </button>
                                    )}
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                    Bu personel <span className="font-bold">sadece seçili kategorideki</span> müşterilere erişebilir. Seçim yapılmazsa veri kısıtı uygulanmaz (tümünü görür).
                                </p>
                                <div className="flex flex-wrap gap-2 pt-2">
                                    {customerCategories?.map(cat => {
                                        const isActive = (selectedStaff.assignedCategoryIds || []).includes(cat.id);
                                        return (
                                            <button
                                                key={cat.id}
                                                type="button"
                                                onClick={() => {
                                                    const currentIds = selectedStaff.assignedCategoryIds || [];
                                                    const newIds = isActive
                                                        ? currentIds.filter((id: string) => id !== cat.id)
                                                        : [...currentIds, cat.id];
                                                    setSelectedStaff({ ...selectedStaff, assignedCategoryIds: newIds });
                                                }}
                                                className={`h-9 px-4 rounded-xl text-[12px] font-bold uppercase transition-all shadow-sm border ${isActive
                                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>}
                                                    {cat.name}
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="p-5 border-t border-slate-100 dark:border-white/5 bg-white dark:bg-[#0f172a] flex justify-end gap-3 shrink-0">
                            <button onClick={() => setShowPermissionModal(false)} className="h-10 px-6 rounded-[12px] border border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:bg-[#1e293b] transition-colors text-[13px] shadow-sm">
                                VAZGEÇ
                            </button>
                            <button onClick={savePermissions} disabled={isProcessing} className="h-10 px-8 rounded-[12px] bg-blue-600 hover:bg-blue-700 text-white font-bold text-[13px] transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2">
                                {isProcessing ? 'KAYDEDİLİYOR...' : 'DEĞİŞİKLİKLERİ KAYDET'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. ADD STAFF MODAL WIZARD */}
            {showAddStaffModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
                    <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[24px] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
                        <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-white dark:bg-[#0f172a] shrink-0">
                            <h2 className="text-[18px] font-black text-slate-900 dark:text-white flex items-center gap-2">
                                <span>🚀</span> Yeni Personel Onay & Giriş Sihirbazı
                            </h2>
                            <button
                                onClick={() => {
                                    setShowAddStaffModal(false);
                                    setAddStaffStep(1);
                                }}
                                className="w-8 h-8 flex items-center justify-center rounded-[10px] hover:bg-slate-100 dark:hover:bg-[#334155]/50 text-slate-500 hover:text-slate-800 dark:text-slate-200 transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        {/* WIZARD PROGRESS BAR */}
                        <div className="bg-slate-50 dark:bg-[#1e293b] px-8 py-5 border-b border-slate-100 dark:border-white/5 shrink-0 flex items-center justify-center">
                            <div className="flex items-center w-full max-w-2xl justify-between relative">
                                <div className="absolute top-1/2 left-0 w-full h-[2px] bg-slate-200 dark:bg-slate-700 -z-10 -translate-y-1/2 rounded-full"></div>
                                <div className="absolute top-1/2 left-0 h-[2px] bg-blue-600 -z-10 -translate-y-1/2 transition-all duration-300 rounded-full" style={{ width: `${((addStaffStep - 1) / 3) * 100}%` }}></div>

                                {[
                                    { step: 1, label: 'KİMLİK' },
                                    { step: 2, label: 'KADRO' },
                                    { step: 3, label: 'ÖZLÜK' },
                                    { step: 4, label: 'YETKİ' }
                                ]?.map((s) => (
                                    <div key={s.step} className="flex flex-col items-center gap-2">
                                        <div
                                            className={`w-10 h-10 rounded-full flex items-center justify-center text-[14px] font-black transition-all shadow-sm
                                                ${addStaffStep >= s.step
                                                    ? 'bg-blue-600 text-white ring-4 ring-blue-600/20'
                                                    : 'bg-white dark:bg-[#0f172a] border-2 border-slate-200 dark:border-slate-700 text-slate-400'
                                                }`}
                                        >
                                            {addStaffStep > s.step ? '✓' : s.step}
                                        </div>
                                        <span className={`text-[10px] font-bold tracking-widest uppercase transition-colors ${addStaffStep >= s.step ? 'text-blue-600' : 'text-slate-400'}`}>
                                            {s.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50 dark:bg-[#0f172a]/50">
                            <div className="max-w-3xl mx-auto">
                                {/* STEP 1: KIMLIK & TEMEL ILETISIM */}
                                {addStaffStep === 1 && (
                                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                        <div className="mb-6">
                                            <h3 className="text-[18px] font-black text-slate-900 dark:text-white">Kimlik & Erişim Bilgileri</h3>
                                            <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">Personelin sisteme giriş yapabilmesi için gerekli temel bilgilerini eksiksiz doldurunuz.</p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest pl-1">Ad Soyad (Kimlikteki Gibi) *</label>
                                                <input type="text" className="w-full h-12 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[12px] px-4 text-[14px] font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 shadow-sm transition-all" placeholder="Tam İsim..." value={newStaff.name} onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })} />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest pl-1">Sistem Kullanıcı Adı *</label>
                                                <input type="text" className="w-full h-12 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[12px] px-4 text-[14px] font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 shadow-sm transition-all" placeholder="orn_isim.soyisim" value={newStaff.username} onChange={(e) => setNewStaff({ ...newStaff, username: e.target.value })} />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest pl-1">Kurumsal E-Posta *</label>
                                                <input type="email" className="w-full h-12 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[12px] px-4 text-[14px] font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 shadow-sm transition-all" placeholder="isim@sirket.com" value={newStaff.email} onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })} />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest pl-1">Mobil Telefon *</label>
                                                <input type="tel" className="w-full h-12 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[12px] px-4 text-[14px] font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 shadow-sm transition-all" placeholder="05XX XXX XX XX" value={newStaff.phone} onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })} />
                                            </div>
                                            <div className="space-y-2 col-span-full">
                                                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest pl-1">Giriş Şifresi *</label>
                                                <input type="password" name="password" className="w-full h-12 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[12px] px-4 text-[14px] font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 shadow-sm transition-all" placeholder="Geçici şifre belirleyin..." value={newStaff.password} onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })} />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 2: ORGANIZASYON & FINANS */}
                                {addStaffStep === 2 && (
                                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                        <div className="mb-6">
                                            <h3 className="text-[18px] font-black text-slate-900 dark:text-white">Kadro & Pozisyon Ataması</h3>
                                            <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">Personelin şirketteki resmi şubesini, unvanını ve maaş bilgilerini tanımlayın.</p>
                                        </div>

                                        <div className="grid grid-cols-1 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest pl-1">Bağlı Olduğu Şube / Lokasyon *</label>
                                                <select className="w-full h-12 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[12px] px-4 text-[14px] font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 shadow-sm transition-all" value={newStaff.branch} onChange={(e) => setNewStaff({ ...newStaff, branch: e.target.value })}>
                                                    <option value="">Merkez veya Şube Seçiniz</option>
                                                    {branches?.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                                                </select>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest pl-1">Departman & Yönetim Rolü *</label>
                                                <select className="w-full h-12 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[12px] px-4 text-[14px] font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 shadow-sm transition-all" value={newStaff.role} onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}>
                                                    <option value="">Organizasyon Şeması Rolü Seçiniz</option>
                                                    <option value="Sistem Yöneticisi">👑 Sistem Yöneticisi (Üst Yönetim)</option>
                                                    <option value="Şube Yöneticisi">🏢 Şube Yöneticisi</option>
                                                    <option value="E-Ticaret Uzmanı">🌐 E-Ticaret Uzmanı</option>
                                                    <option value="Saha Satış">🚚 Saha Satış Uzmanı</option>
                                                    <option value="Mali Müşavir">💼 Mali Müşavir</option>
                                                    <option value="İnsan Kaynakları">👥 İnsan Kaynakları Yetkilisi</option>
                                                    <option value="Servis Personeli">🔧 Servis Personeli</option>
                                                    <option value="Kasiyer / Standart Personel">👤 Kasiyer / Standart Personel</option>
                                                </select>
                                            </div>

                                            <div className="bg-slate-50 dark:bg-[#1e293b] p-5 rounded-[16px] border border-slate-100 dark:border-white/5 space-y-5">
                                                <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/5 pb-3">
                                                    <span className="text-xl">💵</span>
                                                    <h4 className="text-[13px] font-black text-slate-900 dark:text-white">Maaş & Bordro Tanımlamaları</h4>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest pl-1 block">Brüt / Net Anlaşma *</label>
                                                        <select className="w-full h-11 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-xl px-4 text-[13px] font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500 shadow-sm transition-all" value={newStaff.salaryType} onChange={(e) => setNewStaff({ ...newStaff, salaryType: e.target.value })}>
                                                            <option value="NET">Net Maaş Anlaşması</option>
                                                            <option value="GROSS">Brüt Maaş Anlaşması</option>
                                                        </select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest pl-1 block">Kök / Taban Ücret *</label>
                                                        <div className="relative">
                                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black">₺</span>
                                                            <input type="number" className="w-full h-11 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-xl pl-8 pr-4 text-[15px] font-black text-slate-900 dark:text-white outline-none focus:border-emerald-500 shadow-sm transition-all text-right" placeholder="17002" value={newStaff.salary} onChange={(e) => setNewStaff({ ...newStaff, salary: e.target.value })} />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest pl-1 block">Resmi İşe Giriş Tarihi</label>
                                                        <input type="date" className="w-full h-11 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-xl px-4 text-[13px] font-semibold text-slate-900 dark:text-white outline-none focus:border-emerald-500 shadow-sm transition-all" value={newStaff.entryDate} onChange={(e) => setNewStaff({ ...newStaff, entryDate: e.target.value })} />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest pl-1 block text-rose-500">İşten Çıkış Tarihi</label>
                                                        <input type="date" className="w-full h-11 bg-rose-50/50 dark:bg-rose-900/10 border border-slate-200 dark:border-white/5 rounded-xl px-4 text-[13px] font-semibold text-rose-700 dark:text-rose-400 outline-none focus:border-rose-500 shadow-sm transition-all" value={newStaff.leaveDate} onChange={(e) => setNewStaff({ ...newStaff, leaveDate: e.target.value })} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 3: ÖZLÜK & HR DETAYLARI */}
                                {addStaffStep === 3 && (
                                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                        <div className="flex justify-between items-end mb-6">
                                            <div>
                                                <h3 className="text-[18px] font-black text-slate-900 dark:text-white">Özlük Dosyası Ön Kayıt</h3>
                                                <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">Acil durum iletişimi ve yasal evrak altyapısı için gerekli detaylar. <br />Bu adımı daha sonra Özlük Dosyası içerisinden güncelleyebilirsiniz.</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest pl-1">Doğum Tarihi</label>
                                                <input type="date" className="w-full h-11 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-xl px-4 text-[13px] font-semibold text-slate-900 dark:text-white outline-none focus:border-blue-500 shadow-sm" value={newStaff.birthDate} onChange={(e) => setNewStaff({ ...newStaff, birthDate: e.target.value })} />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest pl-1">Kan Grubu</label>
                                                <select className="w-full h-11 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-xl px-4 text-[13px] font-semibold text-slate-900 dark:text-white outline-none focus:border-blue-500 shadow-sm" value={newStaff.bloodType} onChange={(e) => setNewStaff({ ...newStaff, bloodType: e.target.value })}>
                                                    <option value="">İsteğe Bağlı</option>
                                                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', '0+', '0-']?.map(t => <option key={t} value={t}>{t}</option>)}
                                                </select>
                                            </div>
                                            <div className="col-span-full space-y-2 mt-2 pt-2 border-t border-slate-100 dark:border-white/5">
                                                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest pl-1">Açık İkamet Adresi</label>
                                                <div className="grid grid-cols-2 gap-3 mb-2">
                                                    <input type="text" className="w-full h-11 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-xl px-4 text-[13px] font-semibold text-slate-900 dark:text-white outline-none shadow-sm" placeholder="İl" value={newStaff.city} onChange={(e) => setNewStaff({ ...newStaff, city: e.target.value })} />
                                                    <input type="text" className="w-full h-11 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-xl px-4 text-[13px] font-semibold text-slate-900 dark:text-white outline-none shadow-sm" placeholder="İlçe" value={newStaff.district} onChange={(e) => setNewStaff({ ...newStaff, district: e.target.value })} />
                                                </div>
                                                <textarea className="w-full h-20 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-xl p-3 text-[13px] font-semibold text-slate-900 dark:text-white outline-none focus:border-blue-500 shadow-sm resize-none" placeholder="Mahalle, sokak, no, daire..." value={newStaff.address} onChange={(e) => setNewStaff({ ...newStaff, address: e.target.value })} />
                                            </div>
                                            <div className="col-span-full space-y-2 p-4 bg-amber-50 rounded-[12px] border border-amber-200 mt-2">
                                                <h4 className="text-[12px] font-black text-amber-700 uppercase tracking-widest flex items-center gap-2 mb-2">
                                                    <span>🚨</span> Acil Durum İletişimi
                                                </h4>
                                                <input type="text" className="w-full h-11 bg-white border border-amber-300 rounded-xl px-4 text-[13px] font-semibold text-slate-900 outline-none focus:border-amber-500 shadow-sm" placeholder="Yakınının Adı Soyadı ve Telefonu..." value={newStaff.relativeName} onChange={(e) => setNewStaff({ ...newStaff, relativeName: e.target.value })} />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 4: YETKİ & BİTİR */}
                                {addStaffStep === 4 && (
                                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                        <div className="mb-6">
                                            <h3 className="text-[18px] font-black text-slate-900 dark:text-white">Veri Kapsamı & Kayıt (Scoping)</h3>
                                            <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">Multi-tenant izolasyonu gereği, sadece erişilmesi gereken müşteri gruplarını seçin. Boş bırakırsanız tüm platform datasına erişir (Riskli).</p>
                                        </div>

                                        <div className="bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-[16px] p-6 shadow-sm space-y-5">
                                            <div className="flex items-start gap-3 border-b border-slate-200 dark:border-white/5 pb-4">
                                                <div className="w-8 h-8 rounded-[8px] bg-blue-100 flex items-center justify-center text-blue-600 text-lg shrink-0">🛡️</div>
                                                <div>
                                                    <h4 className="text-[14px] font-black text-slate-900 dark:text-white">Müşteri Kategori İzolasyonu</h4>
                                                    <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                                                        Seçtiğiniz kategoriler dışındaki müşterilerin cari özetleri, faturaları veya görevleri bu personelden <strong>Sıfır Güven (Zero-Trust)</strong> mimarisi ile gizlenir.
                                                    </p>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">ERİŞİME İZİN VERİLEN KATEGORİLER</label>
                                                <div className="flex flex-wrap gap-2.5">
                                                    {customerCategories?.map(cat => {
                                                        const isActive = newStaff.assignedCategoryIds.includes(cat.id);
                                                        return (
                                                            <button
                                                                key={cat.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    const newIds = isActive
                                                                        ? newStaff.assignedCategoryIds.filter(id => id !== cat.id)
                                                                        : [...newStaff.assignedCategoryIds, cat.id];
                                                                    setNewStaff({ ...newStaff, assignedCategoryIds: newIds });
                                                                }}
                                                                className={`h-10 px-4 rounded-[10px] text-[12px] font-black uppercase transition-all border shadow-sm ${isActive
                                                                    ? 'bg-blue-600 text-white border-blue-700 ring-2 ring-blue-600/30'
                                                                    : 'bg-white dark:bg-[#0f172a] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50'
                                                                    }`}
                                                            >
                                                                {isActive && <span className="mr-1.5 opacity-80">✓</span>}
                                                                {cat.name}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-[12px] mt-8 flex flex-col items-center text-center gap-2">
                                            <span className="text-3xl">🎉</span>
                                            <h4 className="text-[14px] font-black text-emerald-800">Her Şey Hazır!</h4>
                                            <p className="text-[12px] text-emerald-600 font-medium">Bu personeli sisteme kaydetmek için aşağıdaki butona tıklayın.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* WIZARD ACTIONS */}
                        <div className="p-6 border-t border-slate-100 dark:border-white/5 bg-white dark:bg-[#0f172a] shrink-0 flex items-center justify-between">
                            <button
                                onClick={() => addStaffStep > 1 ? setAddStaffStep(addStaffStep - 1) : setShowAddStaffModal(false)}
                                className="h-12 px-6 rounded-[12px] font-bold text-[13px] tracking-wide text-slate-500 hover:bg-slate-100 dark:hover:bg-[#1e293b] transition-all"
                            >
                                {addStaffStep > 1 ? 'GERİ DÖN' : 'İPTAL ET'}
                            </button>

                            <div className="flex gap-3">
                                {addStaffStep === 3 && (
                                    <button
                                        onClick={() => setAddStaffStep(4)}
                                        className="h-12 px-5 rounded-[12px] border-2 border-slate-200 dark:border-white/10 font-bold text-[13px] tracking-wide text-slate-600 hover:bg-slate-50 transition-all font-semibold"
                                    >
                                        BU ADIMI ATLA
                                    </button>
                                )}

                                {addStaffStep < 4 ? (
                                    <button
                                        onClick={() => {
                                            if (addStaffStep === 1 && (!newStaff.name || !newStaff.username || !newStaff.password || !newStaff.email)) {
                                                showError('Eksik Bilgi', "Lütfen zorunlu alanları doldurun.");
                                                return;
                                            }
                                            if (addStaffStep === 2 && (!newStaff.role || !newStaff.branch)) {
                                                showError('Eksik Bilgi', "Lütfen zorunlu alanları doldurun.");
                                                return;
                                            }
                                            setAddStaffStep(addStaffStep + 1);
                                        }}
                                        className="h-12 px-8 rounded-[12px] bg-slate-900 dark:bg-slate-100 hover:bg-black dark:hover:bg-white text-white dark:text-black font-black text-[13px] tracking-wide transition-all shadow-md flex items-center gap-2"
                                    >
                                        SONRAKİ ADIM <span className="text-lg">→</span>
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleSaveStaff}
                                        disabled={isProcessing}
                                        className="h-12 px-10 rounded-[12px] bg-blue-600 hover:bg-blue-700 text-white font-black text-[13px] tracking-widest uppercase transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 flex items-center gap-2 relative overflow-hidden group"
                                    >
                                        <div className="absolute inset-0 bg-white/20 translate-y-[-100%] group-hover:translate-y-[100%] transition-transform duration-500"></div>
                                        {isProcessing ? 'KAYDEDİLİYOR...' : '💾 PERSONELİ SİSTEME EKLE'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. EDIT STAFF MODAL */}
            {showEditStaffModal && editStaff && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
                    <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] w-full max-w-5xl overflow-hidden shadow-2xl h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-white dark:bg-[#0f172a] shrink-0">
                            <div>
                                <h2 className="text-[18px] font-black text-slate-900 dark:text-white flex items-center gap-2">
                                    <span className="text-xl">🗂️</span> Personel Özlük Dosyası: <span className="text-blue-600">{editStaff.name}</span>
                                </h2>
                                <div className="text-[11px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase mt-1 pl-8">Dijital Arşiv ve Bilgi Yönetimi</div>
                            </div>
                            <button onClick={() => setShowEditStaffModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:bg-[#334155]/50 text-slate-500 hover:text-slate-800 dark:text-slate-200 transition-colors">✕</button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 bg-slate-50 dark:bg-[#1e293b]/50 custom-scrollbar">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* SOL KOLON: ÖZLÜK BİLGİLERİ */}
                                <div className="lg:col-span-2 space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <h3 className="text-[11px] font-black text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-blue-100 pb-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-600" /> KİMLİK & KİŞİSEL
                                            </h3>
                                            <div className="space-y-3">
                                                <div className="group">
                                                    <label className="text-[11px] font-bold tracking-widest text-slate-600 dark:text-slate-400 uppercase pb-1 block">Doğum Tarihi</label>
                                                    <input type="date" className="w-full h-11 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-xl px-4 text-[13px] font-semibold text-slate-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 shadow-sm transition-all outline-none" value={editStaff.birthDate ? new Date(editStaff.birthDate).toISOString().split('T')[0] : ''} onChange={(e) => setEditStaff({ ...editStaff, birthDate: e.target.value })} />
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="text-[11px] font-bold tracking-widest text-slate-600 dark:text-slate-400 uppercase pb-1 block">Medeni Durum</label>
                                                        <select className="w-full h-11 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-xl px-4 text-[13px] font-semibold text-slate-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 shadow-sm transition-all outline-none" value={editStaff.maritalStatus || ''} onChange={(e) => setEditStaff({ ...editStaff, maritalStatus: e.target.value })}>
                                                            <option value="">Seçiniz</option>
                                                            <option value="Bekar">Bekar</option>
                                                            <option value="Evli">Evli</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-[11px] font-bold tracking-widest text-slate-600 dark:text-slate-400 uppercase pb-1 block">Kan Grubu</label>
                                                        <select className="w-full h-11 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-xl px-4 text-[13px] font-semibold text-slate-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 shadow-sm transition-all outline-none" value={editStaff.bloodType || ''} onChange={(e) => setEditStaff({ ...editStaff, bloodType: e.target.value })}>
                                                            <option value="">Seçiniz</option>
                                                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', '0+', '0-']?.map(t => <option key={t} value={t}>{t}</option>)}
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="group">
                                                    <label className="text-[11px] font-bold tracking-widest text-slate-600 dark:text-slate-400 uppercase pb-1 block">Eğitim Durumu</label>
                                                    <select className="w-full h-11 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-xl px-4 text-[13px] font-semibold text-slate-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 shadow-sm transition-all outline-none" value={editStaff.educationLevel || ''} onChange={(e) => setEditStaff({ ...editStaff, educationLevel: e.target.value })}>
                                                        <option value="">Seçiniz</option>
                                                        <option value="İlkokul">İlkokul</option>
                                                        <option value="Ortaokul">Ortaokul</option>
                                                        <option value="Lise">Lise</option>
                                                        <option value="Önlisans">Önlisans</option>
                                                        <option value="Lisans">Lisans</option>
                                                        <option value="Yüksek Lisans">Yüksek Lisans</option>
                                                    </select>
                                                </div>
                                                <div className="group">
                                                    <label className="text-[11px] font-bold tracking-widest text-slate-600 dark:text-slate-400 uppercase pb-1 block">Askerlik Durumu</label>
                                                    <select className="w-full h-11 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-xl px-4 text-[13px] font-semibold text-slate-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 shadow-sm transition-all outline-none" value={editStaff.militaryStatus || ''} onChange={(e) => setEditStaff({ ...editStaff, militaryStatus: e.target.value })}>
                                                        <option value="">Seçiniz</option>
                                                        <option value="Yapıldı">Yapıldı</option>
                                                        <option value="Muaf">Muaf</option>
                                                        <option value="Tecilli">Tecilli</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-200 dark:border-white/5 pb-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-900" /> İLETİŞİM & ADRES
                                            </h3>
                                            <div className="space-y-3">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="text-[11px] font-bold tracking-widest text-slate-600 dark:text-slate-400 uppercase pb-1 block">İl</label>
                                                        <input type="text" className="w-full h-11 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-xl px-4 text-[13px] font-semibold text-slate-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 shadow-sm transition-all outline-none" value={editStaff.city || ''} onChange={(e) => setEditStaff({ ...editStaff, city: e.target.value })} />
                                                    </div>
                                                    <div>
                                                        <label className="text-[11px] font-bold tracking-widest text-slate-600 dark:text-slate-400 uppercase pb-1 block">İlçe</label>
                                                        <input type="text" className="w-full h-11 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-xl px-4 text-[13px] font-semibold text-slate-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 shadow-sm transition-all outline-none" value={editStaff.district || ''} onChange={(e) => setEditStaff({ ...editStaff, district: e.target.value })} />
                                                    </div>
                                                </div>
                                                <div className="group">
                                                    <label className="text-[11px] font-bold tracking-widest text-slate-600 dark:text-slate-400 uppercase pb-1 block">Acil Durum Yakını</label>
                                                    <input type="text" className="w-full h-11 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-xl px-4 text-[13px] font-semibold text-slate-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 shadow-sm transition-all outline-none" placeholder="İsim - Telefon" value={editStaff.relativeName || ''} onChange={(e) => setEditStaff({ ...editStaff, relativeName: e.target.value })} />
                                                </div>
                                                <div className="group">
                                                    <label className="text-[11px] font-bold tracking-widest text-slate-600 dark:text-slate-400 uppercase pb-1 block">Tam Adres</label>
                                                    <textarea className="w-full h-24 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-xl p-3 text-[13px] font-semibold text-slate-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 shadow-sm transition-all outline-none resize-none" value={editStaff.address || ''} onChange={(e) => setEditStaff({ ...editStaff, address: e.target.value })} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="text-[11px] font-black text-rose-600 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-rose-100 pb-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-rose-600" /> FİNANS & BORDRO BİLGİLERİ (GİZLİ)
                                            </h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest pl-1 block">Sözleşme Tipi</label>
                                                    <select className="w-full h-11 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-xl px-4 text-[13px] font-bold text-slate-900 dark:text-white outline-none focus:border-rose-500 shadow-sm transition-all" value={editStaff.salaryType || 'NET'} onChange={(e) => setEditStaff({ ...editStaff, salaryType: e.target.value })}>
                                                        <option value="NET">Net Maaş Anlaşması</option>
                                                        <option value="GROSS">Brüt Maaş Anlaşması</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest pl-1 block">Aylık Kök Ücret</label>
                                                    <div className="relative">
                                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black">₺</span>
                                                        <input type="number" className="w-full h-11 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-xl pl-8 pr-4 text-[15px] font-black text-slate-900 dark:text-white outline-none focus:border-rose-500 shadow-sm transition-all text-right" placeholder="0.00" value={editStaff.salary || ''} onChange={(e) => setEditStaff({ ...editStaff, salary: e.target.value })} />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest pl-1 block">İşe Giriş Tarihi</label>
                                                    <input type="date" className="w-full h-11 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-xl px-4 text-[13px] font-semibold text-slate-900 dark:text-white outline-none focus:border-rose-500 shadow-sm transition-all" value={editStaff.entryDate ? new Date(editStaff.entryDate).toISOString().split('T')[0] : ''} onChange={(e) => setEditStaff({ ...editStaff, entryDate: e.target.value })} />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest pl-1 block text-rose-500">İşten Çıkış Tarihi</label>
                                                    <input type="date" className="w-full h-11 bg-rose-50/50 dark:bg-rose-900/10 border border-slate-200 dark:border-white/5 rounded-xl px-4 text-[13px] font-semibold text-rose-700 dark:text-rose-400 outline-none focus:border-rose-500 shadow-sm transition-all" value={editStaff.leaveDate ? new Date(editStaff.leaveDate).toISOString().split('T')[0] : ''} onChange={(e) => setEditStaff({ ...editStaff, leaveDate: e.target.value })} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* EK BİLGİLER & NOTLAR */}
                                    <div className="p-6 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm space-y-4">
                                        <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest border-b border-slate-100 dark:border-white/5 pb-2">🚩 Kurumsal & Ek Bilgiler</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-white/5">
                                                    <span className="text-[11px] font-bold tracking-widest text-slate-600 dark:text-slate-400 uppercase">Ehliyet</span>
                                                    <button
                                                        onClick={() => setEditStaff({ ...editStaff, hasDriverLicense: !editStaff.hasDriverLicense })}
                                                        className={`h-8 px-4 rounded-lg text-[10px] font-black uppercase transition-all shadow-sm ${editStaff.hasDriverLicense ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-100'}`}
                                                    >
                                                        {editStaff.hasDriverLicense ? 'VAR' : 'YOK'}
                                                    </button>
                                                </div>
                                                <div className="group">
                                                    <label className="text-[11px] font-bold tracking-widest text-slate-600 dark:text-slate-400 uppercase pb-1 block">Referans</label>
                                                    <input type="text" className="w-full h-11 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-xl px-4 text-[13px] font-semibold text-slate-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 shadow-sm transition-all outline-none" value={editStaff.reference || ''} onChange={(e) => setEditStaff({ ...editStaff, reference: e.target.value })} />
                                                </div>
                                            </div>
                                            <div className="group">
                                                <label className="text-[11px] font-bold tracking-widest text-slate-600 dark:text-slate-400 uppercase pb-1 block">Personel Notları</label>
                                                <textarea className="w-full h-[98px] bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-xl p-3 text-[13px] font-semibold text-slate-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 shadow-sm transition-all outline-none resize-none" placeholder="Örn: Sağlık durumu, özel yetenekler vb." value={editStaff.notes || ''} onChange={(e) => setEditStaff({ ...editStaff, notes: e.target.value })} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* MÜŞTERİ KATEGORİ ERİŞİMİ */}
                                    <div className="p-6 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm space-y-4">
                                        <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/5 pb-2">
                                            <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-600" /> Müşteri Kategori Yetkileri
                                            </h3>
                                            <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Scoping & Segmentation</span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-widest mb-2">Seçim yapılmazsa personel tüm müşterilere erişebilir.</p>
                                        <div className="flex flex-wrap gap-2 pt-2">
                                            {customerCategories?.map(cat => {
                                                const isActive = (editStaff.assignedCategoryIds || []).includes(cat.id);
                                                return (
                                                    <button
                                                        key={cat.id}
                                                        type="button"
                                                        onClick={() => {
                                                            const currentIds = editStaff.assignedCategoryIds || [];
                                                            const newIds = isActive
                                                                ? currentIds.filter((id: string) => id !== cat.id)
                                                                : [...currentIds, cat.id];
                                                            setEditStaff({ ...editStaff, assignedCategoryIds: newIds });
                                                        }}
                                                        className={`h-9 px-4 rounded-xl text-[11px] font-bold uppercase transition-all border shadow-sm ${isActive
                                                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                                            }`}
                                                    >
                                                        {cat.name}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    <button onClick={handleEditStaff} disabled={isProcessing} className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold tracking-widest shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                                        {isProcessing ? 'GÜNCELLENİYOR...' : '💾 ÖZLÜK BİLGİLERİNİ GÜNCELLE'}
                                    </button>
                                </div>

                                {/* SAĞ KOLON: DİJİTAL DOSYALAR */}
                                <div className="space-y-6">
                                    <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-full min-h-[400px] shadow-lg relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[50px] pointer-events-none rounded-full" />
                                        <div className="flex justify-between items-center mb-6 relative z-10">
                                            <h3 className="text-[11px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> DİJİTAL ARŞİV
                                            </h3>
                                            <span className="text-[10px] font-bold tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">{staffDocuments.length} DOSYA</span>
                                        </div>

                                        <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar mb-6 pr-1 relative z-10">
                                            {staffDocuments.length === 0 ? (
                                                <div className="h-40 flex flex-col items-center justify-center text-slate-400 gap-3 grayscale opacity-50">
                                                    <span className="text-4xl text-slate-500 dark:text-slate-400">📂</span>
                                                    <span className="text-[11px] font-bold uppercase tracking-widest">Arşiv Henüz Boş</span>
                                                </div>
                                            ) : (
                                                staffDocuments?.map(doc => (
                                                    <div key={doc.id} className="p-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/50 rounded-xl flex justify-between items-center group transition-all">
                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                            <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-lg">
                                                                {doc.mimeType?.includes('pdf') ? '📕' : '🖼️'}
                                                            </div>
                                                            <div className="truncate">
                                                                <div className="text-[12px] font-bold text-slate-200 truncate">{doc.name || doc.fileName}</div>
                                                                <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-medium tracking-wide mt-0.5">{new Date(doc.createdAt).toLocaleDateString()} • {(doc.size / 1024).toFixed(0)} KB</div>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                                                            <button onClick={() => handleDownloadDocument(doc.id, doc.fileName)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all text-sm border border-emerald-500/20">⬇</button>
                                                            <button onClick={() => handleDeleteDocument(doc.id)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all text-sm border border-red-500/20">🗑️</button>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>

                                        <div className={`mt-auto shrink-0 border-2 border-dashed border-slate-700/50 rounded-xl p-6 text-center transition-all bg-slate-800/30 relative z-10 ${isUploading ? 'opacity-50 pointer-events-none' : 'hover:border-blue-500/50 hover:bg-blue-500/5 group'}`}>
                                            <input type="file" id="doc-upload" className="hidden" onChange={handleFileUpload} accept=".pdf,.png,.jpg,.jpeg" />
                                            <label htmlFor="doc-upload" className="cursor-pointer flex flex-col items-center gap-3">
                                                <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-500/20 group-hover:border-blue-500/30 transition-all">
                                                    <span className="text-2xl pt-1">📤</span>
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="text-[12px] font-bold text-slate-300 uppercase tracking-widest">Belge Yükle</div>
                                                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase">PDF, PNG, JPEG (MAX 5MB)</div>
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- SHIFT CREATION MODAL --- */}
            {
                showShiftModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
                        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] w-full max-w-lg overflow-hidden shadow-2xl">
                            <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-white dark:bg-[#0f172a]">
                                <h2 className="text-[18px] font-black text-slate-900 dark:text-white flex items-center gap-2">
                                    <span className="text-xl">🕒</span> Vardiya Oluştur
                                </h2>
                                <button onClick={() => setShowShiftModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:bg-[#334155]/50 text-slate-500 hover:text-slate-800 dark:text-slate-200 transition-all">✕</button>
                            </div>

                            <div className="p-8 bg-slate-50 dark:bg-[#1e293b]/50 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest pl-1 block">Personel</label>
                                    <select
                                        className="w-full h-11 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-xl px-4 text-[13px] font-semibold text-slate-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none appearance-none shadow-sm"
                                        value={newShift.staffId}
                                        onChange={(e) => setNewShift({ ...newShift, staffId: e.target.value })}
                                    >
                                        <option value="">Personel Seçiniz</option>
                                        {staff?.map(p => (
                                            <option key={p.id} value={p.id}>{p.name} ({p.role})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest pl-1 block">Başlangıç Zamanı</label>
                                        <input
                                            type="datetime-local"
                                            className="w-full h-11 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-xl px-4 text-[13px] font-semibold text-slate-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none shadow-sm"
                                            value={newShift.start}
                                            onChange={(e) => setNewShift({ ...newShift, start: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest pl-1 block">Bitiş Zamanı</label>
                                        <input
                                            type="datetime-local"
                                            className="w-full h-11 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-xl px-4 text-[13px] font-semibold text-slate-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none shadow-sm"
                                            value={newShift.end}
                                            onChange={(e) => setNewShift({ ...newShift, end: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest pl-1 block">Vardiya Türü</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {['Normal', 'Fazla Mesai', 'İzinli']?.map(type => (
                                            <button
                                                key={type}
                                                onClick={() => setNewShift({ ...newShift, type })}
                                                className={`py-3 rounded-xl text-[11px] font-bold uppercase transition-all shadow-sm border ${newShift.type === type
                                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                                    }`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={handleCreateShift}
                                    disabled={isProcessing}
                                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs tracking-widest shadow-sm transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                                >
                                    {isProcessing ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>OLUŞTURULUYOR...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>✅ VARDİYAYI KAYDET</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* --- LEAVE REQUEST MODAL --- */}
            {
                showLeaveModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
                        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] w-full max-w-lg overflow-hidden shadow-2xl">
                            <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-white dark:bg-[#0f172a]">
                                <h2 className="text-[18px] font-black text-slate-900 dark:text-white flex items-center gap-2">
                                    <span className="text-xl">🏖️</span> İzin Talebi
                                </h2>
                                <button onClick={() => setShowLeaveModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:bg-[#334155]/50 text-slate-500 hover:text-slate-800 dark:text-slate-200 transition-all">✕</button>
                            </div>

                            <div className="p-8 bg-slate-50 dark:bg-[#1e293b]/50 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest pl-1 block">Personel</label>
                                    <select
                                        className="w-full h-11 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-xl px-4 text-[13px] font-semibold text-slate-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none appearance-none shadow-sm"
                                        value={newLeave.staffId}
                                        onChange={(e) => setNewLeave({ ...newLeave, staffId: e.target.value })}
                                    >
                                        <option value="">Personel Seçiniz</option>
                                        {staff?.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest pl-1 block">İzin Türü</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {['Yıllık İzin', 'Raporlu', 'Ücretsiz İzin']?.map(type => (
                                            <button
                                                key={type}
                                                onClick={() => setNewLeave({ ...newLeave, type })}
                                                className={`py-3 rounded-xl text-[11px] font-bold uppercase transition-all shadow-sm border ${newLeave.type === type
                                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                                    }`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest pl-1 block">Başlangıç</label>
                                        <input
                                            type="date"
                                            className="w-full h-11 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-xl px-4 text-[13px] font-semibold text-slate-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none shadow-sm"
                                            value={newLeave.startDate}
                                            onChange={(e) => setNewLeave({ ...newLeave, startDate: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest pl-1 block">Bitiş</label>
                                        <input
                                            type="date"
                                            className="w-full h-11 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-xl px-4 text-[13px] font-semibold text-slate-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none shadow-sm"
                                            value={newLeave.endDate}
                                            onChange={(e) => setNewLeave({ ...newLeave, endDate: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest pl-1 block">Açıklama / Not</label>
                                    <textarea
                                        className="w-full h-24 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-xl p-3 text-[13px] font-semibold text-slate-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none resize-none shadow-sm"
                                        placeholder="İzin nedeni veya ek notlar..."
                                        value={newLeave.description}
                                        onChange={(e) => setNewLeave({ ...newLeave, description: e.target.value })}
                                    />
                                </div>

                                <button
                                    onClick={handleCreateLeave}
                                    disabled={isProcessing}
                                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs tracking-widest shadow-sm transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                                >
                                    {isProcessing ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>TALEP OLUŞTURULUYOR...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>🚀 TALEBİ GÖNDER</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* --- PAYROLL MODAL --- */}
            {
                showPayrollModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
                        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] w-full max-w-lg overflow-hidden shadow-2xl">
                            <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-white dark:bg-[#0f172a]">
                                <div>
                                    <h2 className="text-[18px] font-black text-slate-900 dark:text-white flex items-center gap-2">
                                        <span className="text-xl">💰</span> Maaş Hesapla
                                    </h2>
                                    <div className="text-[11px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase mt-1">{currentPayroll.staffName} • {currentPayroll.period}</div>
                                </div>
                                <button onClick={() => setShowPayrollModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:bg-[#334155]/50 text-slate-500 hover:text-slate-800 dark:text-slate-200 transition-all">✕</button>
                            </div>

                            <div className="p-8 bg-slate-50 dark:bg-[#1e293b]/50 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest block">Maaş (Net)</label>
                                            <label className="flex items-center gap-1.5 cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    checked={updateBaseSalary}
                                                    onChange={(e) => setUpdateBaseSalary(e.target.checked)}
                                                    className="w-3.5 h-3.5 rounded border border-slate-300 dark:border-white/10 bg-white dark:bg-[#0f172a] text-blue-600 focus:ring-blue-500/10 cursor-pointer"
                                                />
                                                <span className="text-[9px] font-bold text-slate-500 group-hover:text-slate-700 dark:text-slate-300 tracking-wider">VARSAYILAN KIL</span>
                                            </label>
                                        </div>
                                        <input
                                            type="number"
                                            className="w-full h-11 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-xl px-4 text-[13px] font-semibold text-slate-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none shadow-sm text-right"
                                            value={currentPayroll.salary}
                                            onChange={(e) => setCurrentPayroll({ ...currentPayroll, salary: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest pl-1 block">Prim / Bonus</label>
                                        <input
                                            type="number"
                                            className="w-full h-11 bg-emerald-50 border border-emerald-200 rounded-xl px-4 text-[13px] font-semibold text-emerald-700 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none shadow-sm text-right"
                                            value={currentPayroll.bonus}
                                            onChange={(e) => setCurrentPayroll({ ...currentPayroll, bonus: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest pl-1 block">Avans / Kesinti</label>
                                        <input
                                            type="number"
                                            className="w-full h-11 bg-red-50 border border-red-200 rounded-xl px-4 text-[13px] font-semibold text-red-700 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none shadow-sm text-right"
                                            value={currentPayroll.deductions}
                                            onChange={(e) => setCurrentPayroll({ ...currentPayroll, deductions: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest pl-1 block">NET ÖDENECEK</label>
                                        <div className="w-full h-11 bg-slate-900 border border-slate-800 rounded-xl px-4 flex items-center justify-end text-[14px] font-black text-white shadow-sm">
                                            ₺ {(Number(currentPayroll.salary) + Number(currentPayroll.bonus) - Number(currentPayroll.deductions)).toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-3">
                                    <span className="text-xl">ℹ️</span>
                                    <p className="text-[11px] font-bold tracking-widest text-blue-700 leading-relaxed uppercase">
                                        ONAYLANDIKTAN SONRA BU TUTAR GİDERLERE &quot;PERSONEL MAAŞ ÖDEMESİ&quot; OLARAK İŞLENECEKTİR.
                                    </p>
                                </div>

                                <button
                                    onClick={handleSavePayroll}
                                    disabled={isProcessing}
                                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs tracking-widest shadow-sm transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                                >
                                    {isProcessing ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>İŞLENİYOR...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>💾 ÖDEME EMRİNİ OLUŞTUR</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* 6. TARGET MODAL */}
            {showTargetModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
                    <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] w-full max-w-lg overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-white dark:bg-[#0f172a]">
                            <h2 className="text-[18px] font-black text-slate-900 dark:text-white flex items-center gap-2">
                                <span className="text-xl">🎯</span> Yeni Hedef Tanımla
                            </h2>
                            <button onClick={() => setShowTargetModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:bg-[#334155]/50 text-slate-500 hover:text-slate-800 dark:text-slate-200 transition-all">✕</button>
                        </div>

                        <div className="p-8 bg-slate-50 dark:bg-[#1e293b]/50 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest pl-1 block">Personel</label>
                                <select
                                    className="w-full h-11 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-xl px-4 text-[13px] font-semibold text-slate-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none appearance-none shadow-sm"
                                    value={newTarget.staffId}
                                    onChange={(e) => setNewTarget({ ...newTarget, staffId: e.target.value })}
                                >
                                    <option value="">Personel Seçiniz</option>
                                    {staff?.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} ({p.role})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest pl-1 block">Hedef Türü</label>
                                    <select
                                        className="w-full h-11 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-xl px-4 text-[13px] font-semibold text-slate-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none appearance-none shadow-sm"
                                        value={newTarget.type}
                                        onChange={(e) => setNewTarget({ ...newTarget, type: e.target.value })}
                                    >
                                        <option value="TURNOVER">💰 Ciro Hedefi</option>
                                        <option value="VISIT">📍 Ziyaret Hedefi</option>
                                        <option value="MATRIX">🎯 Matrix (Yıllık Hedef Modeli)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest pl-1 block">Periyot</label>
                                    <input
                                        type="text"
                                        className="w-full h-11 bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-xl px-4 text-[13px] font-semibold text-slate-500 dark:text-slate-400 outline-none shadow-sm"
                                        value={newTarget.type === 'MATRIX' ? 'Yıllık (Q1-Q4 Dağılımlı)' : 'Aylık (Varsayılan)'}
                                        disabled
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest pl-1 block">
                                    {newTarget.type === 'MATRIX' ? 'Şirket Genel Yıllık Satış Hedefi (TL)' : `Hedef Değeri (${newTarget.type === 'TURNOVER' ? 'TL' : 'Adet'})`}
                                </label>
                                <input
                                    type="number"
                                    className="w-full h-11 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-xl px-4 text-[13px] font-semibold text-slate-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none shadow-sm"
                                    placeholder={newTarget.type === 'MATRIX' ? "4000000" : (newTarget.type === 'TURNOVER' ? "50000" : "100")}
                                    value={newTarget.targetValue}
                                    onChange={(e) => setNewTarget({ ...newTarget, targetValue: e.target.value })}
                                />
                            </div>

                            {newTarget.type === 'TURNOVER' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest pl-1 block">Prim Oranı (%)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            className="w-full h-11 bg-blue-50 border border-blue-200 rounded-xl px-4 text-[13px] font-semibold text-blue-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none shadow-sm"
                                            placeholder="1.5"
                                            value={newTarget.commissionRate}
                                            onChange={(e) => setNewTarget({ ...newTarget, commissionRate: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest pl-1 block">Hedef Bonusu (TL)</label>
                                        <input
                                            type="number"
                                            className="w-full h-11 bg-emerald-50 border border-emerald-200 rounded-xl px-4 text-[13px] font-semibold text-emerald-700 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none shadow-sm"
                                            placeholder="2500"
                                            value={newTarget.bonusAmount}
                                            onChange={(e) => setNewTarget({ ...newTarget, bonusAmount: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}

                            {newTarget.type === 'MATRIX' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest pl-1 block">Performans Yılı</label>
                                        <input
                                            type="number"
                                            className="w-full h-11 bg-indigo-50 border border-indigo-200 rounded-xl px-4 text-[13px] font-semibold text-indigo-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none shadow-sm"
                                            placeholder="2026"
                                            value={(newTarget as any).matrixYear || new Date().getFullYear()}
                                            onChange={(e) => setNewTarget({ ...newTarget, matrixYear: e.target.value } as any)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest pl-1 block">Yıllık Bonus Bütçesi (Q1-Q4)</label>
                                        <input
                                            type="number"
                                            className="w-full h-11 bg-emerald-50 border border-emerald-200 rounded-xl px-4 text-[13px] font-semibold text-emerald-700 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none shadow-sm"
                                            placeholder="160000"
                                            value={newTarget.bonusAmount}
                                            onChange={(e) => setNewTarget({ ...newTarget, bonusAmount: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}

                            {newTarget.type !== 'MATRIX' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest pl-1 block">Başlangıç</label>
                                        <input
                                            type="date"
                                            className="w-full h-11 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-xl px-4 text-[13px] font-semibold text-slate-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none shadow-sm"
                                            value={newTarget.startDate}
                                            onChange={(e) => setNewTarget({ ...newTarget, startDate: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest pl-1 block">Bitiş</label>
                                        <input
                                            type="date"
                                            className="w-full h-11 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-xl px-4 text-[13px] font-semibold text-slate-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none shadow-sm"
                                            value={newTarget.endDate}
                                            onChange={(e) => setNewTarget({ ...newTarget, endDate: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={handleSaveTarget}
                                disabled={isProcessing}
                                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs tracking-widest shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isProcessing ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : '🎯 HEDEFİ KAYDET'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}
