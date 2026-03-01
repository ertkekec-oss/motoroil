"use client";

import { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useModal } from '@/contexts/ModalContext';
import { useFinancials } from '@/contexts/FinancialContext';

export default function StaffManagementContent() {
    const [activeTab, setActiveTab] = useState('list'); // list, roles, performance, shifts, leaves, payroll, attendance, puantaj
    const { staff, currentUser, hasPermission, addNotification, refreshStaff, branches } = useApp();
    const { addFinancialTransaction, kasalar, setKasalar } = useFinancials();
    const { showSuccess, showConfirm, showError } = useModal();
    const isSystemAdmin = currentUser === null || (currentUser.role && (currentUser.role.toLowerCase().includes('admin') || currentUser.role.toLowerCase().includes('müdür')));

    const [selectedStaff, setSelectedStaff] = useState<any>(null);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [showPermissionModal, setShowPermissionModal] = useState(false);
    const [showAddStaffModal, setShowAddStaffModal] = useState(false);
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
        assignedCategoryIds: [] as string[]
    });

    const [editStaff, setEditStaff] = useState<any>({
        name: '', email: '', role: '', branch: '', type: 'service', birthDate: '', address: '', salary: '',
        maritalStatus: '', bloodType: '', militaryStatus: '', educationLevel: '', hasDriverLicense: false,
        reference: '', relativeName: '', relativePhone: '', city: '', district: '', notes: '',
        healthReport: '', certificate: '', assignedCategoryIds: []
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

    function getMonday(d: Date) {
        d = new Date(d);
        var day = d.getDay(),
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
            const res = await fetch(`/api/staff/documents?staffId=${staffId}`);
            if (res.ok) setStaffDocuments(await res.json());
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
        // --- SATIŞ & POS ---
        { id: 'pos_access', label: 'Hızlı Satış (POS) Erişimi', category: 'Satış' },
        { id: 'sales_archive', label: 'Geçmiş Satışları Görme', category: 'Satış' },
        { id: 'discount_auth', label: 'İskonto Yapma Yetkisi', category: 'Satış' },
        { id: 'price_override', label: '💸 Fiyat Değiştirme / Manuel Fiyat', category: 'Satış' },
        { id: 'return_create', label: '↩️ İade Alma', category: 'Satış' },
        { id: 'credit_sales', label: 'Veresiye (Açık Hesap) Satış', category: 'Satış' },
        { id: 'field_sales_access', label: '📍 Saha Satış Modülü Erişimi (Mobil)', category: 'Satış' },
        { id: 'field_sales_admin', label: '🗺️ Saha Satış Yönetimi (Rota Planlama)', category: 'Satış' },

        // --- SERVİS & İŞ EMRİ ---
        { id: 'service_view', label: 'Servis / İş Emirlerini Görme', category: 'Servis' },
        { id: 'service_create', label: 'Yeni İş Emri Oluşturma', category: 'Servis' },
        { id: 'service_complete', label: 'İş Emri Tamamlama / Kapatma', category: 'Servis' },
        { id: 'appointment_manage', label: 'Randevu Takvimi Yönetimi', category: 'Servis' },

        // --- TEKLİF YÖNETİMİ ---
        { id: 'offer_create', label: 'Teklif Hazırlama', category: 'Teklif' },
        { id: 'offer_approve', label: '✅ Teklif Onaylama / Satışa Çevirme', category: 'Teklif' },

        // --- DEPO & STOK ---
        { id: 'inventory_view', label: 'Stok Görüntüleme', category: 'Depo' },
        { id: 'inventory_edit', label: 'Ürün Ekleme / Düzenleme', category: 'Depo' },
        { id: 'inventory_transfer', label: 'Depolar Arası Transfer İsteği', category: 'Depo' },
        { id: 'stock_correction', label: 'Stok Sayım / Düzeltme', category: 'Depo' },

        // --- MUHASEBE & FİNANS ---
        { id: 'finance_view', label: 'Finansal Özetleri Görme', category: 'Finans' },
        { id: 'finance_transactions', label: 'Kasa/Banka Hareketleri', category: 'Finans' },
        { id: 'accounting_manage', label: 'Kasa/Banka Hesap Yönetimi', category: 'Finans' },
        { id: 'expense_create', label: 'Gider / Masraf Girişi', category: 'Finans' },
        { id: 'finance_reports', label: 'Bilanço ve Kar/Zarar', category: 'Finans' },

        // --- MÜŞTERİ & TEDARİKÇİ ---
        { id: 'customer_view', label: 'Müşteri Listesi', category: 'Cari' },
        { id: 'customer_edit', label: 'Müşteri Ekleme / Düzenleme', category: 'Cari' },
        { id: 'customer_delete', label: '⚠️ Müşteri Silme', category: 'Cari' },
        { id: 'supplier_view', label: 'Tedarikçi Listesi', category: 'Cari' },
        { id: 'supplier_edit', label: 'Tedarikçi Yönetimi', category: 'Cari' },

        // --- E-TİCARET ---
        { id: 'ecommerce_view', label: 'E-Ticaret Paneli', category: 'Online' },
        { id: 'ecommerce_manage', label: 'Sipariş ve Entegrasyon Yönetimi', category: 'Online' },

        // --- YÖNETİM & GÜVENLİK ---
        { id: 'staff_manage', label: 'Personel Yönetimi', category: 'Yönetim' },
        { id: 'settings_manage', label: 'Sistem Ayarları', category: 'Yönetim' },
        { id: 'admin_view', label: '⚙️ Platform Yönetim Paneli', category: 'Yönetim' },
        { id: 'security_access', label: 'Güvenlik Masası / Loglar', category: 'Yönetim' },

        // --- KRİTİK İŞLEMLER ---
        { id: 'delete_records', label: '🔴 Kayıt Silme (Genel)', category: 'Kritik' },
        { id: 'create_staff', label: '🔴 Personel Ekleme', category: 'Kritik' },
        { id: 'create_bank', label: '🔴 Kasa/Banka Silme/Açma', category: 'Kritik' },
        { id: 'approve_products', label: '🔴 Ürün Kartı Onayı', category: 'Kritik' },
        { id: 'approve_transfers', label: '🔴 Transfer Onaylama', category: 'Kritik' },

        // --- ÖZEL KISITLAMALAR ---
        { id: 'branch_isolation', label: '🚫 Şube İzolasyonu (Sadece Kendi Şubesi)', category: 'Kısıtlama' }
    ];

    const roleTemplates: Record<string, string[]> = {
        'Yönetici': allPermissions.map(p => p.id),
        'Şube Müdürü': ['pos_access', 'sales_archive', 'discount_auth', 'inventory_view', 'customer_view', 'customer_edit', 'service_view', 'service_create', 'branch_isolation'],
        'Saha Satış': ['field_sales_access', 'field_sales_admin', 'customer_view', 'customer_edit', 'inventory_view', 'pos_access', 'sales_archive'],
        'E-Ticaret Uzmanı': ['ecommerce_view', 'ecommerce_manage', 'inventory_view', 'inventory_edit', 'sales_archive'],
        'Servis Personeli': ['service_view', 'service_create', 'service_complete', 'inventory_view'],
        'Personel': ['pos_access', 'branch_isolation']
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

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            showError("Hata", "Dosya boyutu 5MB'dan küçük olmalıdır.");
            return;
        }

        setIsUploading(true);
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64 = reader.result as string;
            try {
                const res = await fetch('/api/staff/documents', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        staffId: editStaff.id,
                        fileName: file.name,
                        fileType: file.type,
                        fileSize: file.size,
                        fileData: base64
                    })
                });

                if (res.ok) {
                    await fetchStaffDocuments(editStaff.id);
                    showSuccess("Dosya Yüklendi", "Personel belgesi başarıyla kaydedildi.");
                } else {
                    const err = await res.json();
                    showSuccess("Hata", err.error || "Dosya yüklenemedi.");
                }
            } catch (e) {
                console.error("Upload error", e);
                showSuccess("Hata", "Dosya yüklenirken bir sorun oluştu.");
            } finally {
                setIsUploading(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleDeleteDocument = async (docId: string) => {
        showConfirm("Belgeyi Sil", "Belgeyi silmek istediğinize emin misiniz?", async () => {
            try {
                const res = await fetch(`/api/staff/documents?id=${docId}`, { method: 'DELETE' });
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

            {/* --- HEADER --- */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.05))' }}>
                <div>
                    <h1 style={{ fontSize: '30px', fontWeight: '700', color: 'var(--text-main, #fff)', margin: 0, letterSpacing: '-0.5px' }}>Ekip & Yetki Yönetimi</h1>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted, #888)', marginTop: '6px', fontWeight: '500' }}>
                        Organizasyon yapısı ve personel operasyon kontrolü
                    </div>
                </div>

                <div className="flex gap-3">
                    {hasPermission('create_staff') && (
                        <button onClick={() => setShowAddStaffModal(true)} style={{ height: '44px', padding: '0 24px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 8px 16px rgba(59, 130, 246, 0.25)', transition: 'all 0.2s' }} className="hover:-translate-y-0.5 hover:shadow-xl">
                            <span style={{ fontSize: '18px' }}>+</span> Yeni Personel
                        </button>
                    )}
                </div>
            </div>

            {/* --- STATS OVERVIEW --- */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="card glass p-5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl group-hover:scale-110 transition-transform">👥</div>
                    <div className="text-muted text-[10px] font-black uppercase tracking-widest mb-1">Toplam Ekip</div>
                    <div className="text-3xl font-black text-white">{staff.length} <span className="text-xs font-normal opacity-40">Kişi</span></div>
                </div>
                <div className="card glass p-5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl group-hover:scale-110 transition-transform">🟢</div>
                    <div className="text-muted text-[10px] font-black uppercase tracking-widest mb-1">Müsait Personel</div>
                    <div className="text-3xl font-black text-emerald-400">{staff.filter(s => s.status === 'Müsait' || s.status === 'Boşta' || !s.status).length}</div>
                </div>
                <div className="card glass p-5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl group-hover:scale-110 transition-transform">⚒️</div>
                    <div className="text-muted text-[10px] font-black uppercase tracking-widest mb-1">Devam Eden İŞ</div>
                    <div className="text-3xl font-black text-blue-400">{staff.filter(s => s.status === 'Meşgul').length}</div>
                </div>
                <div className="card glass p-5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl group-hover:scale-110 transition-transform">📈</div>
                    <div className="text-muted text-[10px] font-black uppercase tracking-widest mb-1">Ekip Verimliliği</div>
                    <div className="text-3xl font-black text-slate-400">%94</div>
                </div>
            </div>

            {/* --- TOOLBAR --- */}
            <div className="flex items-center gap-4 mb-8 bg-[#0f111a] rounded-xl border border-white/5 overflow-hidden flex-col md:flex-row items-stretch">
                <div className="flex bg-[#0f111a] border-b border-white/5 w-full overflow-x-auto select-none" style={{ borderRadius: '12px 12px 0 0' }}>
                    {[
                        { id: 'list', label: 'Personel Listesi' },
                        { id: 'roles', label: 'Roller & İzinler' },
                        { id: 'performance', label: 'Performans' },
                        { id: 'shifts', label: 'Vardiya' },
                        { id: 'leaves', label: 'İzinler' },
                        { id: 'attendance', label: 'PDKS' },
                        { id: 'puantaj', label: 'Puantaj' },
                        { id: 'payroll', label: 'Bordro' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={activeTab === tab.id
                                ? "px-6 py-4 text-[14px] font-semibold text-blue-400 whitespace-nowrap transition-all border-b-2 border-blue-500 group relative"
                                : "px-6 py-4 text-[14px] font-medium text-white/40 hover:text-white/80 whitespace-nowrap transition-all border-b-2 border-transparent"}
                            style={activeTab === tab.id ? { boxShadow: 'inset 0 -15px 15px -15px rgba(59, 130, 246, 0.2)' } : {}}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {activeTab === 'list' && (
                    <div className="flex-1 relative min-w-[300px] m-3">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30">🔍</span>
                        <input
                            type="text"
                            placeholder="İsim, rol veya şube ile ara..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-sm text-white outline-none focus:border-blue-500/30/50 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                )}
            </div>

            {/* --- LIST TAB --- */}
            {activeTab === 'list' && (
                <div className="staff-grid">
                    {filteredStaff.map(person => (
                        <div key={person.id} style={{ background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(12px)' }} className="rounded-2xl p-6 border border-white/5 hover:border-blue-500/30 transition-all duration-300 group shadow-lg">
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-white/10 flex items-center justify-center text-2xl font-black text-blue-500">
                                        {person.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '18px', fontWeight: 800 }} className="text-white tracking-tight group-hover:text-blue-500 transition-colors">{person.name}</h3>
                                        <div className="flex items-center gap-2 mt-2"><span className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] font-bold text-white/50 uppercase border border-white/10">{person.role}</span><span className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] font-bold text-white/50 uppercase border border-white/10">{person.branch}</span></div>
                                    </div>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${(person.status === 'Müsait' || person.status === 'Boşta' || !person.status) ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-500'
                                    }`}>
                                    {person.status || 'Boşta'}
                                </div>
                            </div>

                            <div className="bg-white/[0.03] rounded-2xl p-4 mb-6">
                                <div className="text-[10px] text-white/20 font-black uppercase mb-1 tracking-widest">GÜNCEL GÖREV</div>
                                <div className="text-sm text-white/80 font-medium italic">"{person.currentJob || '-'}"</div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <div className="bg-black/20 rounded-xl p-3 border border-white/5">
                                    <div className="text-[9px] text-white/30 font-bold uppercase mb-1">BU AY CİRO</div>
                                    <div className="text-sm font-black text-emerald-400">₺ {Number(person.earnings || 0).toLocaleString()}</div>
                                </div>
                                <div className="bg-black/20 rounded-xl p-3 border border-white/5">
                                    <div className="text-[9px] text-white/30 font-bold uppercase mb-1">İŞ SKORU</div>
                                    <div className="text-sm font-black text-white">{person.performance || 100}</div>
                                </div>
                            </div>

                            <div className="flex gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => { setEditStaff(person); setShowEditStaffModal(true); }}
                                    className="flex-1 py-3 rounded-xl bg-transparent text-white/60 hover:text-blue-400 hover:bg-blue-500/10 border border-transparent hover:border-blue-500/20 text-[10px] font-black hover:bg-blue-500/20 transition-all"
                                >
                                    ✏️ DÜZENLE
                                </button>
                                <button
                                    onClick={() => { setSelectedStaff(person); setShowTaskModal(true); }}
                                    className="flex-1 py-3 rounded-xl bg-transparent text-white/60 hover:text-white hover:bg-white/5 text-[10px] border-transparent font-black hover:bg-white/10 transition-all"
                                >
                                    GÖREV ATA
                                </button>
                                <button
                                    onClick={() => { setSelectedStaff(person); setShowPermissionModal(true); }}
                                    className="flex-1 py-3 rounded-xl bg-transparent text-white/60 hover:text-white hover:bg-white/5 text-[10px] border-transparent font-black hover:bg-white/10 transition-all"
                                >
                                    YETKİLER
                                </button>
                                <button
                                    onClick={() => handleDeleteStaff(person)}
                                    className="flex-none px-4 py-3 rounded-xl bg-transparent text-white/60 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 text-[10px] font-black hover:bg-red-500/20 transition-all"
                                >
                                    🗑️ SİL
                                </button>
                                {(() => {
                                    const activeAtt = attendance.find(a => a.staffId === person.id && !a.checkOut);
                                    return (
                                        <button
                                            onClick={() => handleProcessAttendance(person.id.toString(), activeAtt ? 'CHECK_OUT' : 'CHECK_IN')}
                                            disabled={isProcessing}
                                            className={`flex-1 py-3 rounded-xl border text-[10px] font-black transition-all ${activeAtt
                                                ? 'bg-blue-500/10 border-blue-500/30 text-blue-500 hover:bg-blue-500/20'
                                                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                                                }`}
                                        >
                                            {activeAtt ? '🏁 ÇIKIŞ YAP' : '🚀 GİRİŞ YAP'}
                                        </button>
                                    );
                                })()}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* --- ROLES TAB --- */}
            {activeTab === 'roles' && (
                <div className="card glass p-0 overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/5 text-[10px] text-white/40 font-black uppercase tracking-widest">
                                <th className="p-6">ROL TANIMI</th>
                                <th className="p-6">ERİŞİM KAPSAMI</th>
                                <th className="p-6">YETKİ SAYISI</th>
                                <th className="p-6 text-right">DURUM</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {Object.keys(roleTemplates).map((roleName, idx) => (
                                <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="p-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-lg">
                                                {roleName === 'Yönetici' ? '👑' : roleName === 'Saha Satış' ? '📍' : roleName === 'Şube Müdürü' ? '🏢' : '👤'}
                                            </div>
                                            <span className="font-black text-lg">{roleName}</span>
                                        </div>
                                    </td>
                                    <td className="p-6 text-sm text-white/60">
                                        {roleName === 'Yönetici' ? 'Tüm modüllere sınırsız erişim' :
                                            roleName === 'Saha Satış' ? 'Müşteri, Stok ve Mobil Saha Satış modülleri' :
                                                roleName === 'Şube Müdürü' ? 'Şube operasyonları, Satışlar ve Personel takibi' :
                                                    'Standart personel yetkileri'}
                                    </td>
                                    <td className="p-6">
                                        <span className="text-xs bg-blue-500/10 text-blue-500 px-3 py-1 rounded-full font-bold">
                                            {roleTemplates[roleName].length} Yetki Tanımlı
                                        </span>
                                    </td>
                                    <td className="p-6 text-right">
                                        <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded uppercase">Aktif</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* --- PERFORMANCE TAB --- */}
            {activeTab === 'performance' && (() => {
                const totalTarget = targets.reduce((sum, t) => sum + Number(t.targetValue), 0);
                const totalActual = targets.reduce((sum, t) => sum + Number(t.currentValue), 0);
                const overallProgress = totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0;

                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="card glass p-8 border-t-4 border-emerald-500">
                                <h4 className="text-muted text-xs font-black uppercase mb-4">GENEL CİRO HEDEFİ (%)</h4>
                                <div className="text-5xl font-black text-white mb-4">%{overallProgress}</div>
                                <div className="w-full h-2 bg-white/5 rounded-full">
                                    <div className="h-full bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: `${Math.min(overallProgress, 100)}%` }}></div>
                                </div>
                            </div>
                            <div className="card glass p-8 border-t-4 border-blue-500/30">
                                <h4 className="text-muted text-xs font-black uppercase mb-4">TOPLAM HEDEF CİRO</h4>
                                <div className="text-5xl font-black text-white mb-4">₺ {(totalTarget / 1000).toFixed(1)}K</div>
                                <p className="text-xs text-white/30">Belirlenen toplam satış hedefi.</p>
                            </div>
                            <button
                                onClick={() => setShowTargetModal(true)}
                                className="card glass p-8 border-2 border-dashed border-white/10 hover:border-blue-500/30/50 hover:bg-blue-600/5 transition-all text-center flex flex-col items-center justify-center gap-3"
                            >
                                <span className="text-3xl">🎯</span>
                                <span className="font-black text-sm text-blue-500">YENİ HEDEF TANIMLA</span>
                            </button>
                        </div>

                        <div className="card glass p-0 overflow-hidden">
                            <div className="p-6 border-b border-white/5">
                                <h3 className="text-xl font-black">Personel Bazlı Hedef Takibi</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-white/5 text-[10px] text-white/40 font-black uppercase">
                                        <tr>
                                            <th className="p-6">PERSONEL</th>
                                            <th className="p-6">HEDEF TÜRÜ</th>
                                            <th className="p-6">HEDEF</th>
                                            <th className="p-6">GERÇEKLEŞEN</th>
                                            <th className="p-6">BEKLENEN PRİM</th>
                                            <th className="p-6">İLERLEME</th>
                                            <th className="p-6">TARİH ARALIĞI</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {targets.length > 0 ? (
                                            targets.map((t, idx) => {
                                                const progress = t.targetValue > 0 ? Math.round((t.currentValue / t.targetValue) * 100) : 0;
                                                return (
                                                    <tr key={t.id} className="hover:bg-white/[0.02]">
                                                        <td className="p-6 font-bold text-white">{t.staff?.name}</td>
                                                        <td className="p-6">
                                                            <span className="text-xs font-bold bg-white/5 px-2 py-1 rounded">
                                                                {t.type === 'TURNOVER' ? '💰 CİRO' : '📍 ZİYARET'}
                                                            </span>
                                                        </td>
                                                        <td className="p-6 text-white/40">
                                                            {t.type === 'TURNOVER' ? `₺ ${Number(t.targetValue).toLocaleString()}` : `${t.targetValue} Adet`}
                                                        </td>
                                                        <td className="p-6 font-black text-emerald-400">
                                                            {t.type === 'TURNOVER' ? `₺ ${Number(t.currentValue).toLocaleString()}` : `${t.currentValue} Adet`}
                                                        </td>
                                                        <td className="p-6">
                                                            <div className="flex flex-col gap-1">
                                                                <span className="text-sm font-black text-blue-400">₺ {Number(t.estimatedBonus || 0).toLocaleString()}</span>
                                                                {t.commissionRate > 0 && <span className="text-[9px] text-white/30">%{t.commissionRate} Komisyon</span>}
                                                            </div>
                                                        </td>
                                                        <td className="p-6">
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex-1 h-1.5 w-24 bg-white/5 rounded-full overflow-hidden">
                                                                    <div
                                                                        className={`h-full rounded-full ${progress >= 100 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                                                                        style={{ width: `${Math.min(progress, 100)}%` }}
                                                                    ></div>
                                                                </div>
                                                                <span className="text-xs font-black text-white">%{progress}</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-6 text-xs text-white/40 font-mono">
                                                            {new Date(t.startDate).toLocaleDateString('tr-TR')} - {new Date(t.endDate).toLocaleDateString('tr-TR')}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr><td colSpan={6} className="p-8 text-center text-white/40">Henüz bir hedef tanımlanmamış.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* --- SHIFT MANAGEMENT TAB --- */}
            {activeTab === 'shifts' && (
                <div className="card glass p-0 overflow-hidden">
                    <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                        <div>
                            <h3 className="text-xl font-black mb-1">📅 Haftalık Vardiya Planı</h3>
                            <p className="text-xs text-white/40 font-bold uppercase tracking-widest">
                                {new Date(currentWeekStart).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} - {new Date(new Date(currentWeekStart).setDate(new Date(currentWeekStart).getDate() + 6)).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    const d = new Date(currentWeekStart);
                                    d.setDate(d.getDate() - 7);
                                    setCurrentWeekStart(d);
                                }}
                                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-all"
                            >
                                ◀ Önceki Hafta
                            </button>
                            <button
                                onClick={() => {
                                    const d = new Date(currentWeekStart);
                                    d.setDate(d.getDate() + 7);
                                    setCurrentWeekStart(d);
                                }}
                                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-all"
                            >
                                Sonraki Hafta ▶
                            </button>
                            <button
                                onClick={() => setShowShiftModal(true)}
                                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold transition-all ml-2 shadow-lg shadow-blue/20">+ YENİ PLAN</button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-white/5 text-[10px] text-white/40 font-black uppercase">
                                <tr>
                                    <th className="p-6 border-r border-white/5 w-[200px]">PERSONEL</th>
                                    <th className="p-6 border-r border-white/5 text-center w-[14%]">Pazartesi</th>
                                    <th className="p-6 border-r border-white/5 text-center w-[14%]">Salı</th>
                                    <th className="p-6 border-r border-white/5 text-center w-[14%]">Çarşamba</th>
                                    <th className="p-6 border-r border-white/5 text-center w-[14%]">Perşembe</th>
                                    <th className="p-6 border-r border-white/5 text-center w-[14%]">Cuma</th>
                                    <th className="p-6 text-center w-[14%]">Cumartesi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {staff.map((person) => (
                                    <tr key={person.id} className="hover:bg-white/[0.02]">
                                        <td className="p-6 border-r border-white/5 font-bold">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-xs font-black text-white/60">
                                                    {person.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="text-sm text-white">{person.name}</div>
                                                    <div className="text-[10px] text-white/40 uppercase">{person.role}</div>
                                                </div>
                                            </div>
                                        </td>
                                        {[0, 1, 2, 3, 4, 5, 6].map((offset) => {
                                            const d = new Date(currentWeekStart);
                                            d.setDate(d.getDate() + offset);
                                            const shift = shifts.find(s => s.staffId === person.id && new Date(s.start).getDate() === d.getDate());

                                            return (
                                                <td key={offset} className="p-4 border-r border-white/5 text-center align-middle">
                                                    {shift ? (
                                                        <div className="relative group/shift">
                                                            {shift.type === 'İzinli' ? (
                                                                <div className="inline-block px-3 py-1 rounded bg-white/5 border border-white/5 text-[10px] font-bold text-white/30">
                                                                    İZİNLİ
                                                                </div>
                                                            ) : (
                                                                <div className="flex flex-col gap-1 items-center">
                                                                    <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                                                        {new Date(shift.start).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} - {new Date(shift.end).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleDeleteShift(shift.id); }}
                                                                className="absolute -top-3 -right-3 w-5 h-5 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center opacity-0 group-hover/shift:opacity-100 transition-opacity shadow-lg z-10 hover:bg-red-600"
                                                                title="Vardiyayı Sil"
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="text-[10px] text-white/10">-</div>
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

            {/* --- LEAVE MANAGEMENT TAB --- */}
            {activeTab === 'leaves' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="card glass p-8">
                            <h4 className="text-muted text-xs font-black uppercase mb-4">BUGÜN İZİNLİLER</h4>
                            <div className="text-4xl font-black text-white mb-2">2 <span className="text-lg text-white/40 font-normal">Kişi</span></div>
                            <div className="flex -space-x-2">
                                <div className="w-8 h-8 rounded-full bg-red-500 border-2 border-[#1a1c2e]"></div>
                                <div className="w-8 h-8 rounded-full bg-blue-500 border-2 border-[#1a1c2e]"></div>
                            </div>
                        </div>
                        <div className="card glass p-8">
                            <h4 className="text-muted text-xs font-black uppercase mb-4">BEKLEYEN ONAYLAR</h4>
                            <div className="text-4xl font-black text-blue-400 mb-2">5 <span className="text-lg text-white/40 font-normal">Talep</span></div>
                            <p className="text-xs text-white/40">Son talep 2 saat önce geldi.</p>
                        </div>
                        <button
                            onClick={() => setShowLeaveModal(true)}
                            className="card glass p-8 border-2 border-dashed border-white/10 hover:border-blue-500/30/50 hover:bg-blue-600/5 transition-all text-center flex flex-col items-center justify-center gap-3">
                            <span className="text-3xl">📝</span>
                            <span className="font-black text-sm text-blue-500">YENİ İZİN TALEBİ OLUŞTUR</span>
                        </button>
                    </div>

                    <div className="card glass p-0 overflow-hidden">
                        <div className="p-6 border-b border-white/5">
                            <h3 className="text-xl font-black">İzin Hareketleri</h3>
                        </div>
                        <table className="w-full text-left">
                            <thead className="bg-white/5 text-[10px] text-white/40 font-black uppercase">
                                <tr>
                                    <th className="p-6">PERSONEL</th>
                                    <th className="p-6">İZİN TÜRÜ</th>
                                    <th className="p-6">TARİH ARALIĞI</th>
                                    <th className="p-6">SÜRE</th>
                                    <th className="p-6">DURUM</th>
                                    <th className="p-6 text-right">İŞLEM</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {leaves.length > 0 ? (
                                    leaves.map((leave, idx) => (
                                        <tr key={leave.id} className="hover:bg-white/[0.02]">
                                            <td className="p-6 font-bold">{leave.staff?.name}</td>
                                            <td className="p-6 text-sm text-white/70">{leave.type}</td>
                                            <td className="p-6 font-mono text-sm text-white/60">
                                                {new Date(leave.startDate).toLocaleDateString('tr-TR')} - {new Date(leave.endDate).toLocaleDateString('tr-TR')}
                                            </td>
                                            <td className="p-6 font-bold text-white">{leave.days} Gün</td>
                                            <td className="p-6">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${leave.status === 'Onaylandı' ? 'bg-emerald-500/10 text-emerald-400' :
                                                    leave.status === 'Reddedildi' ? 'bg-red-500/10 text-red-500' :
                                                        'bg-blue-500/10 text-blue-500'
                                                    }`}>{leave.status}</span>
                                            </td>
                                            <td className="p-6 text-right">
                                                {leave.status === 'Bekliyor' || leave.status === 'Beklemede' ? (
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => handleUpdateLeaveStatus(leave.id, 'Onaylandı')}
                                                            disabled={isProcessing}
                                                            className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all flex items-center justify-center font-bold"
                                                            title="Onayla"
                                                        >
                                                            ✓
                                                        </button>
                                                        <button
                                                            onClick={() => handleUpdateLeaveStatus(leave.id, 'Reddedildi')}
                                                            disabled={isProcessing}
                                                            className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500/20 transition-all flex items-center justify-center font-bold"
                                                            title="Reddet"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="text-[10px] text-white/40 font-bold uppercase">
                                                        {leave.approvedBy ? `İŞLEM: ${leave.approvedBy}` : (leave.status === 'Beklemede' ? 'BEKLİYOR' : '-')}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={6} className="p-8 text-center text-white/40">Henüz izin talebi bulunmuyor.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* --- PAYROLL TAB --- */}
            {activeTab === 'payroll' && (
                <div className="card glass p-0 overflow-hidden">
                    <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                        <div>
                            <h3 className="text-xl font-black">💰 Maaş & Hakediş Listesi</h3>
                            <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">DÖNEM: {new Date().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}</div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={handleGeneratePayrolls}
                                disabled={isProcessing}
                                className="px-5 py-2 rounded-lg bg-blue-500 text-white text-xs font-black hover:bg-blue-400 transition-all shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50"
                            >
                                {isProcessing ? 'İŞLENİYOR...' : 'BORDROLARI OLUŞTUR ⚙️'}
                            </button>
                            <button onClick={handlePayAll} className="px-5 py-2 rounded-lg bg-emerald-500 text-black text-xs font-black hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 active:scale-95">TÜMÜNÜ ÖDE</button>
                        </div>
                    </div>
                    <table className="w-full text-left">
                        <thead className="bg-white/5 text-[10px] text-white/40 font-black uppercase">
                            <tr>
                                <th className="p-6">PERSONEL</th>
                                <th className="p-6 text-right">MAAŞ</th>
                                <th className="p-6 text-right">PRİM</th>
                                <th className="p-6 text-right">AVANS / KESİNTİ</th>
                                <th className="p-6 text-right">NET ÖDENECEK</th>
                                <th className="p-6 text-center">DURUM</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {staff.map((person) => {
                                const payroll = payrolls.find(p => p.staffId === person.id);
                                return (
                                    <tr key={person.id} className="hover:bg-white/[0.02]">
                                        <td className="p-6 font-bold text-white">{person.name}</td>
                                        <td className="p-6 text-right text-white/60">
                                            {payroll ? `₺ ${Number(payroll.salary).toLocaleString()}` : '-'}
                                        </td>
                                        <td className="p-6 text-right text-emerald-400 font-bold">
                                            {payroll && Number(payroll.bonus) > 0 ? `+ ₺ ${Number(payroll.bonus).toLocaleString()}` : '-'}
                                        </td>
                                        <td className="p-6 text-right text-red-400 font-bold">
                                            {payroll && Number(payroll.deductions) > 0 ? `- ₺ ${Number(payroll.deductions).toLocaleString()}` : '-'}
                                        </td>
                                        <td className="p-6 text-right font-black text-xl text-white">
                                            {payroll ? `₺ ${Number(payroll.netPay).toLocaleString()}` : '-'}
                                        </td>
                                        <td className="p-6 text-center">
                                            {payroll ? (
                                                payroll.status === 'Bekliyor' ? (
                                                    <div className="flex flex-col gap-2 items-center">
                                                        <span className="text-[10px] text-white/40 font-bold uppercase">BEKLİYOR</span>
                                                        <button
                                                            onClick={() => handleMarkAsPaid(payroll)}
                                                            className="px-4 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold hover:bg-emerald-500 hover:text-white transition-all shadow-lg shadow-emerald-500/10 text-[10px]"
                                                        >
                                                            ÖDE 💸
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${payroll.status === 'Ödendi' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-white/40'
                                                        }`}>
                                                        {payroll.status} {payroll.paidAt && `(${new Date(payroll.paidAt).toLocaleDateString()})`}
                                                    </span>
                                                )
                                            ) : (
                                                <button
                                                    onClick={() => handleOpenPayrollModal(person)}
                                                    className="px-3 py-1 rounded text-[10px] bg-blue-500/20 text-blue-500 font-bold hover:bg-blue-600/30 transition-all">
                                                    HESAPLA
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                        <tfoot className="bg-white/5 border-t border-white/10">
                            <tr>
                                <td colSpan={4} className="p-6 text-right text-xs font-black text-white/40 uppercase tracking-widest">TOPLAM ÖDENECEK</td>
                                <td className="p-6 text-right text-2xl font-black text-emerald-500">
                                    ₺ {payrolls.reduce((sum, p) => sum + Number(p.netPay || 0), 0).toLocaleString()}
                                </td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}

            {/* --- ATTENDANCE TAB (PDKS) --- */}
            {activeTab === 'attendance' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="card glass p-6 border-l-4 border-emerald-500">
                            <div className="text-[10px] font-black text-white/40 uppercase mb-2">ŞU AN ÇALIŞAN</div>
                            <div className="text-3xl font-black text-white">{attendance.filter(a => !a.checkOut).length}</div>
                        </div>
                        <div className="card glass p-6 border-l-4 border-blue-500">
                            <div className="text-[10px] font-black text-white/40 uppercase mb-2">GEÇ KALANLAR</div>
                            <div className="text-3xl font-black text-white">0</div>
                        </div>
                    </div>

                    <div className="card glass p-0 overflow-hidden">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center">
                            <h3 className="text-xl font-black">📍 Günlük Giriş-Çıkış Takibi</h3>
                        </div>
                        <table className="w-full text-left">
                            <thead className="bg-white/5 text-[10px] text-white/40 font-black uppercase">
                                <tr>
                                    <th className="p-6">PERSONEL</th>
                                    <th className="p-6">TARİH</th>
                                    <th className="p-6">GİRİŞ</th>
                                    <th className="p-6">ÇIKIŞ</th>
                                    <th className="p-6">SÜRE</th>
                                    <th className="p-6 text-right">KONUM</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {attendance.length > 0 ? (
                                    attendance.map(a => (
                                        <tr key={a.id} className="hover:bg-white/[0.02]">
                                            <td className="p-6 font-bold">{a.staff?.name}</td>
                                            <td className="p-6 text-sm text-white/60">{new Date(a.date).toLocaleDateString('tr-TR')}</td>
                                            <td className="p-6 font-mono text-emerald-400 font-bold">{new Date(a.checkIn).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</td>
                                            <td className="p-6 font-mono text-blue-400 font-bold">{a.checkOut ? new Date(a.checkOut).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                                            <td className="p-6 font-black">{a.workingHours || 0} Sa</td>
                                            <td className="p-6 text-right text-[10px] text-white/40">{a.locationIn || '—'}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={6} className="p-8 text-center text-white/40">Kayıt bulunamadı.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* --- PUANTAJ TAB --- */}
            {activeTab === 'puantaj' && (
                <div className="space-y-6">
                    <div className="card glass p-6 flex flex-wrap gap-4 items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="text-lg font-black">Aylık Puantaj Çizelgesi</div>
                            <input
                                type="month"
                                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white outline-none focus:border-blue-500/30"
                                value={selectedPeriod}
                                onChange={(e) => setSelectedPeriod(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-500 rounded-full"></div> <span className="text-[10px] font-bold text-white/40">ÇALIŞILAN</span></div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-500 rounded-full"></div> <span className="text-[10px] font-bold text-white/40">İZİNLİ</span></div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500 rounded-full"></div> <span className="text-[10px] font-bold text-white/40">GELMEDİ</span></div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-white/10 rounded-full"></div> <span className="text-[10px] font-bold text-white/40">HAFTA TATİLİ</span></div>
                        </div>
                    </div>

                    <div className="card glass p-0 overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/5 text-[9px] text-white/40 font-black uppercase border-b border-white/5">
                                    <th className="p-4 sticky left-0 bg-[#0f111a] z-10 w-[150px]">PERSONEL</th>
                                    {[...Array(31)].map((_, i) => (
                                        <th key={i} className="p-2 text-center w-8 border-l border-white/5">{i + 1}</th>
                                    ))}
                                    <th className="p-4 text-center border-l-2 border-blue-500/30/20">TOPLAM</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {puantaj.map((row: any) => (
                                    <tr key={row.staffId} className="hover:bg-white/[0.02]">
                                        <td className="p-4 font-bold text-xs sticky left-0 bg-[#0f111a] border-r border-white/5 z-10">
                                            {row.name}
                                            <div className="text-[8px] text-white/40">{row.role}</div>
                                        </td>
                                        {row.dailyStats.map((stat: any, idx: number) => (
                                            <td key={idx} className="p-2 border-l border-white/5 text-center">
                                                <div className={`w-5 h-5 mx-auto rounded-md flex items-center justify-center text-[8px] font-black ${stat.status === 'WORKED' ? 'bg-emerald-500 text-white' :
                                                    stat.status === 'LEAVE' ? 'bg-blue-500 text-white' :
                                                        stat.status === 'OFF_DAY' ? 'bg-white/10 text-white/40' :
                                                            'bg-red-500/20 text-red-500'
                                                    }`}>
                                                    {stat.status === 'WORKED' ? 'Ç' : stat.status === 'LEAVE' ? 'İ' : stat.status === 'OFF_DAY' ? 'H' : 'X'}
                                                </div>
                                            </td>
                                        ))}
                                        <td className="p-4 text-center border-l-2 border-blue-500/30/20">
                                            <div className="text-[10px] font-black whitespace-nowrap">{row.summary.workedDays}G / {row.summary.workedHours}S</div>
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
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
                    <div className="bg-[#0f111a] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl shadow-blue/20">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                            <h2 className="text-xl font-black text-white flex items-center gap-3">
                                ⚡ <span className="text-white/80">Görev Ata</span>
                            </h2>
                            <button onClick={() => setShowTaskModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all">✕</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-xl font-black text-blue-500 border border-blue-500/30/20">
                                    {selectedStaff.name.charAt(0)}
                                </div>
                                <div>
                                    <div className="text-lg font-bold text-white">{selectedStaff.name}</div>
                                    <div className="text-xs text-white/40 uppercase font-bold tracking-wider">{selectedStaff.role}</div>
                                </div>
                            </div>

                            <textarea
                                className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-blue-500/30/50 focus:bg-white/10 transition-all outline-none resize-none"
                                placeholder="Görevi detaylı açıklayınız..."
                                value={taskContent}
                                onChange={(e) => setTaskContent(e.target.value)}
                            />

                            <div className="flex gap-2">
                                {['düşük', 'normal', 'yüksek'].map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setTaskPriority(p)}
                                        className={`flex-1 py-2 rounded-lg text-xs font-black uppercase transition-all border ${taskPriority === p
                                            ? (p === 'yüksek' ? 'bg-red-500 text-white border-red-500' : p === 'normal' ? 'bg-blue-600 text-white border-blue-500/30' : 'bg-emerald-500 text-white border-emerald-500')
                                            : 'bg-white/5 text-white/40 border-transparent hover:bg-white/10'
                                            }`}
                                    >
                                        {p} Öncelik
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={handleAssignTask}
                                disabled={isProcessing || !taskContent}
                                className="w-full h-12 bg-blue-600 hover:bg-blue-600/80 text-white rounded-xl font-black text-sm tracking-widest shadow-lg shadow-blue/20 hover:shadow-blue/40 transition-all disabled:opacity-50"
                            >
                                {isProcessing ? 'ATANIYOR...' : 'GÖREVİ İLET'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. PERMISSIONS MODAL */}
            {showPermissionModal && selectedStaff && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
                    <div className="bg-[#0f111a] border border-white/10 rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl shadow-blue/20">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                            <div>
                                <h2 className="text-xl font-black text-white flex items-center gap-3">
                                    🛡️ <span className="text-white/80">Erişim & Yetki Yönetimi</span>
                                </h2>
                                <div className="text-xs text-white/40 font-bold uppercase tracking-widest mt-1">
                                    PERSONEL: {selectedStaff.name} ({selectedStaff.role})
                                </div>
                            </div>
                            <button onClick={() => setShowPermissionModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all">✕</button>
                        </div>

                        {/* HIZLI ŞABLONLAR */}
                        <div className="px-6 py-4 bg-white/[0.03] border-b border-white/5 flex items-center gap-4 shrink-0 overflow-x-auto custom-scrollbar">
                            <span className="text-[10px] font-black text-blue-500 uppercase whitespace-nowrap">⚡ Hızlı Şablonlar:</span>
                            <div className="flex gap-2">
                                {Object.keys(roleTemplates).map(roleName => (
                                    <button
                                        key={roleName}
                                        onClick={() => {
                                            setSelectedStaff({ ...selectedStaff, permissions: roleTemplates[roleName] });
                                            addNotification({ type: 'success', icon: '🪄', text: `${roleName} şablonu uygulandı.` });
                                        }}
                                        className="px-4 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[10px] font-bold text-white/60 hover:bg-blue-600 hover:text-white hover:border-blue-500/30 transition-all whitespace-nowrap"
                                    >
                                        {roleName}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {Array.from(new Set(allPermissions.map(p => p.category))).map(category => (
                                    <div key={category} className="perm-cat">
                                        <h3 className="text-xs font-black text-blue-500 uppercase tracking-widest mb-4 border-b border-white/5 pb-2">
                                            {category} YETKİLERİ
                                        </h3>
                                        <div className="space-y-3">
                                            {allPermissions.filter(p => p.category === category).map(perm => {
                                                const isActive = (selectedStaff.permissions || []).includes(perm.id);
                                                return (
                                                    <label key={perm.id} className="flex items-start gap-3 cursor-pointer group select-none">
                                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${isActive ? 'bg-blue-600 border-blue-500/30' : 'bg-white/5 border-white/10 group-hover:border-blue-500/30/50'
                                                            }`}>
                                                            {isActive && <span className="text-white text-xs font-bold">✓</span>}
                                                        </div>
                                                        <input
                                                            type="checkbox"
                                                            className="hidden"
                                                            checked={isActive}
                                                            onChange={() => togglePermission(perm.id)}
                                                        />
                                                        <span className={`text-sm font-medium transition-colors ${isActive ? 'text-white' : 'text-white/40 group-hover:text-white/70'}`}>
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
                            <div className="mt-8 p-6 bg-white/[0.03] border border-white/5 rounded-2xl space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-xs font-black text-blue-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                        🛡️ DATA SCOPING: Müşteri Kategorileri
                                    </h3>
                                    {selectedStaff.assignedCategoryIds?.length > 0 && (
                                        <button
                                            onClick={() => setSelectedStaff({ ...selectedStaff, assignedCategoryIds: [] })}
                                            className="text-[10px] font-black text-red-400 hover:text-red-300 transition-all uppercase"
                                        >
                                            KISITLAMALARI KALDIR
                                        </button>
                                    )}
                                </div>
                                <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest pl-1">
                                    Bu personel sadece seçili kategorideki müşterilere erişebilir. Seçim yapılmazsa tümünü görür.
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {customerCategories.map(cat => {
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
                                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${isActive
                                                    ? 'bg-blue-600 text-white border-blue-500/30 shadow-lg shadow-blue/20'
                                                    : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10'
                                                    }`}
                                            >
                                                {cat.name}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-white/5 bg-white/[0.02] flex justify-end gap-3">
                            <button onClick={() => setShowPermissionModal(false)} className="px-6 h-12 rounded-xl border border-white/10 text-white font-bold hover:bg-white/5 transition-all">
                                VAZGEÇ
                            </button>
                            <button onClick={savePermissions} disabled={isProcessing} className="px-8 h-12 rounded-xl bg-blue-600 text-white font-black tracking-widest shadow-lg shadow-blue/20 hover:shadow-blue/40 hover:scale-105 transition-all">
                                {isProcessing ? 'KAYDEDİLİYOR...' : 'DEĞİŞİKLİKLERİ KAYDET'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. ADD STAFF MODAL */}
            {showAddStaffModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
                    <div className="bg-[#0f111a] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl shadow-blue/20 flex flex-col">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02] shrink-0">
                            <h2 className="text-xl font-black text-white flex items-center gap-3">
                                🆕 <span className="text-white/80">Yeni Personel Kaydı & Özlük Girişi</span>
                            </h2>
                            <button onClick={() => setShowAddStaffModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all">✕</button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            <div className="space-y-8">
                                {/* Temel Bilgiler */}
                                <section className="space-y-4">
                                    <h3 className="text-xs font-black text-blue-500 uppercase tracking-widest border-l-2 border-blue-500/30 pl-3">Temel Bilgiler</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Ad Soyad</label>
                                            <input type="text" className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white outline-none focus:border-blue-500/30/50" placeholder="Tam İsim" value={newStaff.name} onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Kullanıcı Adı</label>
                                            <input type="text" className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white outline-none focus:border-blue-500/30/50" placeholder="ali_yilmaz" value={newStaff.username} onChange={(e) => setNewStaff({ ...newStaff, username: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Şifre</label>
                                            <input type="password" name="password" className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white outline-none focus:border-blue-500/30/50" placeholder="••••••••" value={newStaff.password} onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">E-Posta</label>
                                            <input type="email" className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white outline-none focus:border-blue-500/30/50" placeholder="ornek@sirket.com" value={newStaff.email} onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Telefon</label>
                                            <input type="tel" className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white outline-none focus:border-blue-500/30/50" placeholder="05xxxxxxxxx" value={newStaff.phone} onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })} />
                                        </div>
                                    </div>
                                </section>

                                {/* Özlük Detayları */}
                                <section className="space-y-4">
                                    <h3 className="text-xs font-black text-blue-500 uppercase tracking-widest border-l-2 border-blue-500/30 pl-3">Özlük Bilgileri</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Doğum Tarihi</label>
                                            <input type="date" className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white outline-none focus:border-blue-500/30/50 cursor-pointer" value={newStaff.birthDate} onChange={(e) => setNewStaff({ ...newStaff, birthDate: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Medeni Durum</label>
                                            <select className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white outline-none focus:border-blue-500/30/50" value={newStaff.maritalStatus} onChange={(e) => setNewStaff({ ...newStaff, maritalStatus: e.target.value })}>
                                                <option value="">Seçiniz</option>
                                                <option value="Bekar">Bekar</option>
                                                <option value="Evli">Evli</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Kan Grubu</label>
                                            <select className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white outline-none focus:border-blue-500/30/50" value={newStaff.bloodType} onChange={(e) => setNewStaff({ ...newStaff, bloodType: e.target.value })}>
                                                <option value="">Seçiniz</option>
                                                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', '0+', '0-'].map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Askerlik Durumu</label>
                                            <select className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white outline-none focus:border-blue-500/30/50" value={newStaff.militaryStatus} onChange={(e) => setNewStaff({ ...newStaff, militaryStatus: e.target.value })}>
                                                <option value="">Seçiniz</option>
                                                <option value="Yapıldı">Yapıldı</option>
                                                <option value="Muaf">Muaf</option>
                                                <option value="Tecilli">Tecilli</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Eğitim Durumu</label>
                                            <select className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white outline-none focus:border-blue-500/30/50" value={newStaff.educationLevel} onChange={(e) => setNewStaff({ ...newStaff, educationLevel: e.target.value })}>
                                                <option value="">Seçiniz</option>
                                                <option value="İlkokul">İlkokul</option>
                                                <option value="Ortaokul">Ortaokul</option>
                                                <option value="Lise">Lise</option>
                                                <option value="Önlisans">Önlisans</option>
                                                <option value="Lisans">Lisans</option>
                                                <option value="Yüksek Lisans">Yüksek Lisans</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Ehliyet Durumu</label>
                                            <select className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white outline-none focus:border-blue-500/30/50" value={newStaff.hasDriverLicense ? "Evet" : "Hayır"} onChange={(e) => setNewStaff({ ...newStaff, hasDriverLicense: e.target.value === "Evet" })}>
                                                <option value="Hayır">Yok</option>
                                                <option value="Evet">Var</option>
                                            </select>
                                        </div>
                                        <div className="col-span-2 space-y-2">
                                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Referans</label>
                                            <input type="text" className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white outline-none focus:border-blue-500/30/50" placeholder="İsim / Telefon / Not" value={newStaff.reference} onChange={(e) => setNewStaff({ ...newStaff, reference: e.target.value })} />
                                        </div>
                                    </div>
                                </section>

                                {/* Adres & Yakın Bilgisi */}
                                <section className="space-y-4">
                                    <h3 className="text-xs font-black text-blue-500 uppercase tracking-widest border-l-2 border-blue-500/30 pl-3">Adres & İletişim Detayları</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">İl</label>
                                            <input type="text" className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white outline-none focus:border-blue-500/30/50" placeholder="İstanbul" value={newStaff.city} onChange={(e) => setNewStaff({ ...newStaff, city: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">İlçe</label>
                                            <input type="text" className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white outline-none focus:border-blue-500/30/50" placeholder="Üsküdar" value={newStaff.district} onChange={(e) => setNewStaff({ ...newStaff, district: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Acil Durum Yakını (İsim & Tel)</label>
                                            <input type="text" className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white outline-none focus:border-blue-500/30/50" placeholder="Ahmet Yılmaz - 0532..." value={newStaff.relativeName} onChange={(e) => setNewStaff({ ...newStaff, relativeName: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Tam Adres</label>
                                        <textarea className="w-full min-h-[80px] bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-blue-500/30/50 resize-none" placeholder="Mahalle, sokak, no..." value={newStaff.address} onChange={(e) => setNewStaff({ ...newStaff, address: e.target.value })} />
                                    </div>
                                </section>

                                {/* İş Bilgileri */}
                                <section className="space-y-4 pb-4">
                                    <h3 className="text-xs font-black text-blue-500 uppercase tracking-widest border-l-2 border-blue-500/30 pl-3">İş & Finansal Bilgiler</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Rol / Pozisyon</label>
                                            <select className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white outline-none focus:border-blue-500/30/50" value={newStaff.role} onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}>
                                                <option value="">Rol Seçiniz</option>
                                                <option value="Yönetici">👑 Yönetici</option>
                                                <option value="Şube Müdürü">🏢 Şube Müdürü</option>
                                                <option value="Muhasebe">💰 Muhasebe</option>
                                                <option value="Servis Personeli">🔧 Servis Personeli</option>
                                                <option value="Satış Temsilcisi">🤝 Satış Temsilcisi</option>
                                                <option value="Saha Satış">🚚 Saha Satış</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Şube</label>
                                            <select className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white outline-none focus:border-blue-500/30/50" value={newStaff.branch} onChange={(e) => setNewStaff({ ...newStaff, branch: e.target.value })}>
                                                <option value="">Şube Seçiniz</option>
                                                {branches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Net Maaş (TL)</label>
                                            <input type="number" className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white outline-none focus:border-blue-500/30/50" placeholder="17002" value={newStaff.salary} onChange={(e) => setNewStaff({ ...newStaff, salary: e.target.value })} />
                                        </div>
                                    </div>

                                    {/* Müşteri Kategori Erişimi */}
                                    <div className="space-y-3 p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Müşteri Kategori Erişimi (Kısıtlama)</label>
                                            <span className="text-[9px] text-blue-500/60 font-bold uppercase">Boş bırakılırsa tüm müşterileri görür</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {customerCategories.map(cat => {
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
                                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border ${isActive
                                                            ? 'bg-blue-600 text-white border-blue-500/30'
                                                            : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10'
                                                            }`}
                                                    >
                                                        {cat.name}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </section>

                                <button onClick={handleSaveStaff} disabled={isProcessing} className="w-full h-14 bg-gradient-to-r from-primary to-primary/80 text-white rounded-xl font-black text-sm tracking-widest shadow-lg shadow-blue/20 hover:scale-[1.01] transition-all flex items-center justify-center gap-3">
                                    {isProcessing ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>KAYDEDİLİYOR...</span></> : <span>💾 PERSONELİ KAYDET VE ÖZLÜK DOSYASI OLUŞTUR</span>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. EDIT STAFF MODAL */}
            {showEditStaffModal && editStaff && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
                    <div className="bg-[#0f111a] border border-white/10 rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl shadow-blue/20 h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02] shrink-0">
                            <div>
                                <h2 className="text-xl font-black text-white flex items-center gap-3">
                                    🗂️ <span className="text-white/80">Personel Özlük Dosyası: {editStaff.name}</span>
                                </h2>
                                <div className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mt-1 pl-8">Dijital Arşiv ve Bilgi Yönetimi</div>
                            </div>
                            <button onClick={() => setShowEditStaffModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all">✕</button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* SOL KOLON: ÖZLÜK BİLGİLERİ */}
                                <div className="lg:col-span-2 space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-blue-600" /> KİMLİK & KİŞİSEL
                                            </h3>
                                            <div className="space-y-3">
                                                <div className="group">
                                                    <label className="text-[10px] font-bold text-white/20 uppercase group-focus-within:text-blue-500/50 transition-colors">Doğum Tarihi</label>
                                                    <input type="date" className="w-full h-11 bg-white/[0.03] border border-white/5 rounded-xl px-4 text-sm text-white focus:border-blue-500/30/30 outline-none mt-1" value={editStaff.birthDate ? new Date(editStaff.birthDate).toISOString().split('T')[0] : ''} onChange={(e) => setEditStaff({ ...editStaff, birthDate: e.target.value })} />
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="text-[10px] font-bold text-white/20 uppercase">Medeni Durum</label>
                                                        <select className="w-full h-11 bg-white/[0.03] border border-white/5 rounded-xl px-4 text-sm text-white outline-none mt-1" value={editStaff.maritalStatus || ''} onChange={(e) => setEditStaff({ ...editStaff, maritalStatus: e.target.value })}>
                                                            <option value="">Seçiniz</option>
                                                            <option value="Bekar">Bekar</option>
                                                            <option value="Evli">Evli</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-bold text-white/20 uppercase">Kan Grubu</label>
                                                        <select className="w-full h-11 bg-white/[0.03] border border-white/5 rounded-xl px-4 text-sm text-white outline-none mt-1" value={editStaff.bloodType || ''} onChange={(e) => setEditStaff({ ...editStaff, bloodType: e.target.value })}>
                                                            <option value="">Seçiniz</option>
                                                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', '0+', '0-'].map(t => <option key={t} value={t}>{t}</option>)}
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="group">
                                                    <label className="text-[10px] font-bold text-white/20 uppercase">Eğitim Durumu</label>
                                                    <select className="w-full h-11 bg-white/[0.03] border border-white/5 rounded-xl px-4 text-sm text-white outline-none mt-1" value={editStaff.educationLevel || ''} onChange={(e) => setEditStaff({ ...editStaff, educationLevel: e.target.value })}>
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
                                                    <label className="text-[10px] font-bold text-white/20 uppercase">Askerlik Durumu</label>
                                                    <select className="w-full h-11 bg-white/[0.03] border border-white/5 rounded-xl px-4 text-sm text-white outline-none mt-1" value={editStaff.militaryStatus || ''} onChange={(e) => setEditStaff({ ...editStaff, militaryStatus: e.target.value })}>
                                                        <option value="">Seçiniz</option>
                                                        <option value="Yapıldı">Yapıldı</option>
                                                        <option value="Muaf">Muaf</option>
                                                        <option value="Tecilli">Tecilli</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-blue-600" /> İLETİŞİM & ADRES
                                            </h3>
                                            <div className="space-y-3">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="text-[10px] font-bold text-white/20 uppercase">İl</label>
                                                        <input type="text" className="w-full h-11 bg-white/[0.03] border border-white/5 rounded-xl px-4 text-sm text-white outline-none mt-1" value={editStaff.city || ''} onChange={(e) => setEditStaff({ ...editStaff, city: e.target.value })} />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-bold text-white/20 uppercase">İlçe</label>
                                                        <input type="text" className="w-full h-11 bg-white/[0.03] border border-white/5 rounded-xl px-4 text-sm text-white outline-none mt-1" value={editStaff.district || ''} onChange={(e) => setEditStaff({ ...editStaff, district: e.target.value })} />
                                                    </div>
                                                </div>
                                                <div className="group">
                                                    <label className="text-[10px] font-bold text-white/20 uppercase">Acil Durum Yakını</label>
                                                    <input type="text" className="w-full h-11 bg-white/[0.03] border border-white/5 rounded-xl px-4 text-sm text-white outline-none mt-1" placeholder="İsim - Telefon" value={editStaff.relativeName || ''} onChange={(e) => setEditStaff({ ...editStaff, relativeName: e.target.value })} />
                                                </div>
                                                <div className="group">
                                                    <label className="text-[10px] font-bold text-white/20 uppercase">Tam Adres</label>
                                                    <textarea className="w-full h-24 bg-white/[0.03] border border-white/5 rounded-xl p-3 text-sm text-white outline-none mt-1 resize-none" value={editStaff.address || ''} onChange={(e) => setEditStaff({ ...editStaff, address: e.target.value })} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* EK BİLGİLER & NOTLAR */}
                                    <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4">
                                        <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">🚩 Kurumsal & Ek Bilgiler</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                                                    <span className="text-[10px] font-bold text-white/40 uppercase">Ehliyet</span>
                                                    <button
                                                        onClick={() => setEditStaff({ ...editStaff, hasDriverLicense: !editStaff.hasDriverLicense })}
                                                        className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${editStaff.hasDriverLicense ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-white/10 text-white/40'}`}
                                                    >
                                                        {editStaff.hasDriverLicense ? 'VAR' : 'YOK'}
                                                    </button>
                                                </div>
                                                <div className="group">
                                                    <label className="text-[10px] font-bold text-white/20 uppercase">Referans</label>
                                                    <input type="text" className="w-full h-11 bg-white/[0.03] border border-white/5 rounded-xl px-4 text-sm text-white outline-none mt-1" value={editStaff.reference || ''} onChange={(e) => setEditStaff({ ...editStaff, reference: e.target.value })} />
                                                </div>
                                            </div>
                                            <div className="group">
                                                <label className="text-[10px] font-bold text-white/20 uppercase">Personel Notları</label>
                                                <textarea className="w-full h-[92px] bg-white/[0.03] border border-white/5 rounded-xl p-3 text-sm text-white outline-none mt-1 resize-none" placeholder="Örn: Sağlık durumu, özel yetenekler vb." value={editStaff.notes || ''} onChange={(e) => setEditStaff({ ...editStaff, notes: e.target.value })} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* MÜŞTERİ KATEGORİ ERİŞİMİ */}
                                    <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-blue-600" /> Müşteri Kategori Yetkileri
                                            </h3>
                                            <span className="text-[9px] text-white/30 font-bold uppercase italic">Scoping & Segmentation</span>
                                        </div>
                                        <p className="text-[9px] text-white/20 uppercase tracking-widest mb-2 border-b border-white/5 pb-2">Seçim yapılmazsa personel tüm müşterilere erişebilir.</p>
                                        <div className="flex flex-wrap gap-2">
                                            {customerCategories.map(cat => {
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
                                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${isActive
                                                            ? 'bg-blue-600 text-white border-blue-500/30 shadow-lg shadow-blue/20'
                                                            : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10'
                                                            }`}
                                                    >
                                                        {cat.name}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    <button onClick={handleEditStaff} disabled={isProcessing} className="w-full h-14 bg-blue-600 text-white rounded-xl font-black text-xs tracking-[0.2em] shadow-xl shadow-blue/20 hover:scale-[1.01] active:scale-[0.99] transition-all">
                                        {isProcessing ? 'GÜNCELLENİYOR...' : 'ÖZLÜK BİLGİLERİNİ GÜNCELLE'}
                                    </button>
                                </div>

                                {/* SAĞ KOLON: DİJİTAL DOSYALAR */}
                                <div className="space-y-6">
                                    <div className="p-6 bg-[#151821] border border-white/5 rounded-2xl flex flex-col h-full min-h-[400px]">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em] flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-emerald-500" /> DİJİTAL ARŞİV
                                            </h3>
                                            <span className="text-[10px] font-bold text-white/20 bg-white/5 px-2 py-1 rounded-md">{staffDocuments.length} DOSYA</span>
                                        </div>

                                        <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar mb-6 pr-1">
                                            {staffDocuments.length === 0 ? (
                                                <div className="h-40 flex flex-col items-center justify-center text-white/10 gap-3 grayscale opacity-30">
                                                    <span className="text-4xl">📂</span>
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Arşiv Henüz Boş</span>
                                                </div>
                                            ) : (
                                                staffDocuments.map(doc => (
                                                    <div key={doc.id} className="p-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 rounded-xl flex justify-between items-center group transition-all">
                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-lg">
                                                                {doc.fileType.includes('pdf') ? '📕' : '🖼️'}
                                                            </div>
                                                            <div className="truncate">
                                                                <div className="text-[11px] font-bold text-white/80 truncate">{doc.fileName}</div>
                                                                <div className="text-[9px] text-white/20 uppercase tracking-tighter">{new Date(doc.uploadedAt).toLocaleDateString()} • {(doc.fileSize / 1024).toFixed(0)} KB</div>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                            <a href={doc.fileData} download={doc.fileName} className="w-7 h-7 flex items-center justify-center rounded bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all text-xs">⬇</a>
                                                            <button onClick={() => handleDeleteDocument(doc.id)} className="w-7 h-7 flex items-center justify-center rounded bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all text-xs">🗑️</button>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>

                                        <div className={`mt-auto shrink-0 border-2 border-dashed border-white/5 rounded-2xl p-6 text-center transition-all ${isUploading ? 'opacity-50 pointer-events-none' : 'hover:border-blue-500/30/30 hover:bg-blue-600/5 group'}`}>
                                            <input type="file" id="doc-upload" className="hidden" onChange={handleFileUpload} accept=".pdf,.png,.jpg,.jpeg" />
                                            <label htmlFor="doc-upload" className="cursor-pointer flex flex-col items-center gap-2">
                                                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-500/20 transition-all">
                                                    <span className="text-xl">📤</span>
                                                </div>
                                                <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Belge Yükle</span>
                                                <span className="text-[8px] text-white/20 leading-tight uppercase">PDF, PNG, JPEG (MAX 5MB)</span>
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
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
                        <div className="bg-[#0f111a] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl shadow-blue/20">
                            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                                <h2 className="text-xl font-black text-white flex items-center gap-3">
                                    🕒 <span className="text-white/80">Vardiya Oluştur</span>
                                </h2>
                                <button onClick={() => setShowShiftModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all">✕</button>
                            </div>

                            <div className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Personel</label>
                                    <select
                                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-blue-500/30/50 outline-none appearance-none"
                                        value={newShift.staffId}
                                        onChange={(e) => setNewShift({ ...newShift, staffId: e.target.value })}
                                    >
                                        <option value="" className="bg-[#0f111a]">Personel Seçiniz</option>
                                        {staff.map(p => (
                                            <option key={p.id} value={p.id} className="bg-[#0f111a]">{p.name} ({p.role})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Başlangıç Zamanı</label>
                                        <input
                                            type="datetime-local"
                                            className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-blue-500/30/50 outline-none"
                                            value={newShift.start}
                                            onChange={(e) => setNewShift({ ...newShift, start: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Bitiş Zamanı</label>
                                        <input
                                            type="datetime-local"
                                            className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-blue-500/30/50 outline-none"
                                            value={newShift.end}
                                            onChange={(e) => setNewShift({ ...newShift, end: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Vardiya Türü</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {['Normal', 'Fazla Mesai', 'İzinli'].map(type => (
                                            <button
                                                key={type}
                                                onClick={() => setNewShift({ ...newShift, type })}
                                                className={`py-3 rounded-xl text-xs font-black uppercase transition-all border ${newShift.type === type
                                                    ? 'bg-blue-600 text-white border-blue-500/30'
                                                    : 'bg-white/5 text-white/40 border-transparent hover:bg-white/10'
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
                                    className="w-full h-14 bg-gradient-to-r from-primary to-primary/80 hover:to-primary text-white rounded-xl font-black text-sm tracking-widest shadow-lg shadow-blue/20 hover:shadow-blue/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3"
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
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
                        <div className="bg-[#0f111a] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl shadow-blue/20">
                            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                                <h2 className="text-xl font-black text-white flex items-center gap-3">
                                    🏖️ <span className="text-white/80">İzin Talebi</span>
                                </h2>
                                <button onClick={() => setShowLeaveModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all">✕</button>
                            </div>

                            <div className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Personel</label>
                                    <select
                                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-blue-500/30/50 outline-none appearance-none"
                                        value={newLeave.staffId}
                                        onChange={(e) => setNewLeave({ ...newLeave, staffId: e.target.value })}
                                    >
                                        <option value="" className="bg-[#0f111a]">Personel Seçiniz</option>
                                        {staff.map(p => (
                                            <option key={p.id} value={p.id} className="bg-[#0f111a]">{p.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">İzin Türü</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {['Yıllık İzin', 'Raporlu', 'Ücretsiz İzin'].map(type => (
                                            <button
                                                key={type}
                                                onClick={() => setNewLeave({ ...newLeave, type })}
                                                className={`py-3 rounded-xl text-[10px] font-black uppercase transition-all border ${newLeave.type === type
                                                    ? 'bg-blue-600 text-white border-blue-500/30'
                                                    : 'bg-white/5 text-white/40 border-transparent hover:bg-white/10'
                                                    }`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Başlangıç</label>
                                        <input
                                            type="date"
                                            className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-blue-500/30/50 outline-none"
                                            value={newLeave.startDate}
                                            onChange={(e) => setNewLeave({ ...newLeave, startDate: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Bitiş</label>
                                        <input
                                            type="date"
                                            className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-blue-500/30/50 outline-none"
                                            value={newLeave.endDate}
                                            onChange={(e) => setNewLeave({ ...newLeave, endDate: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Açıklama / Not</label>
                                    <textarea
                                        className="w-full h-24 bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-blue-500/30/50 focus:bg-white/10 transition-all outline-none resize-none"
                                        placeholder="İzin nedeni veya ek notlar..."
                                        value={newLeave.description}
                                        onChange={(e) => setNewLeave({ ...newLeave, description: e.target.value })}
                                    />
                                </div>

                                <button
                                    onClick={handleCreateLeave}
                                    disabled={isProcessing}
                                    className="w-full h-14 bg-gradient-to-r from-primary to-primary/80 hover:to-primary text-white rounded-xl font-black text-sm tracking-widest shadow-lg shadow-blue/20 hover:shadow-blue/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3"
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
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
                        <div className="bg-[#0f111a] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl shadow-blue/20">
                            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                                <div>
                                    <h2 className="text-xl font-black text-white flex items-center gap-3">
                                        💰 <span className="text-white/80">Maaş Hesapla</span>
                                    </h2>
                                    <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">{currentPayroll.staffName} • {currentPayroll.period}</div>
                                </div>
                                <button onClick={() => setShowPayrollModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all">✕</button>
                            </div>

                            <div className="p-8 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Maaş (Net)</label>
                                            <label className="flex items-center gap-2 cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    checked={updateBaseSalary}
                                                    onChange={(e) => setUpdateBaseSalary(e.target.checked)}
                                                    className="w-3 h-3 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-0 checked:bg-blue-600"
                                                />
                                                <span className="text-[9px] font-bold text-white/40 group-hover:text-white/60">VARSAYILAN YAP</span>
                                            </label>
                                        </div>
                                        <input
                                            type="number"
                                            className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-blue-500/30/50 outline-none font-mono"
                                            value={currentPayroll.salary}
                                            onChange={(e) => setCurrentPayroll({ ...currentPayroll, salary: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Prim / Bonus</label>
                                        <input
                                            type="number"
                                            className="w-full h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 text-sm text-emerald-400 focus:border-emerald-500/50 outline-none font-mono"
                                            value={currentPayroll.bonus}
                                            onChange={(e) => setCurrentPayroll({ ...currentPayroll, bonus: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Avans / Kesinti</label>
                                        <input
                                            type="number"
                                            className="w-full h-12 bg-red-500/10 border border-red-500/20 rounded-xl px-4 text-sm text-red-400 focus:border-red-500/50 outline-none font-mono"
                                            value={currentPayroll.deductions}
                                            onChange={(e) => setCurrentPayroll({ ...currentPayroll, deductions: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">NET ÖDENECEK</label>
                                        <div className="w-full h-12 bg-white/10 border border-white/20 rounded-xl px-4 flex items-center text-lg font-black text-white font-mono">
                                            ₺ {(Number(currentPayroll.salary) + Number(currentPayroll.bonus) - Number(currentPayroll.deductions)).toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-blue-500/10 border border-blue-500/30/20 rounded-2xl flex items-center gap-3">
                                    <span className="text-xl">ℹ️</span>
                                    <p className="text-[10px] font-bold text-blue-500/80 leading-relaxed uppercase">
                                        ONAYLANDIKTAN SONRA BU TUTAR GİDERLERE "PERSONEL MAAŞ ÖDEMESİ" OLARAK İŞLENECEKTİR.
                                    </p>
                                </div>

                                <button
                                    onClick={handleSavePayroll}
                                    disabled={isProcessing}
                                    className="w-full h-14 bg-gradient-to-r from-primary to-primary/80 hover:to-primary text-white rounded-xl font-black text-sm tracking-widest shadow-lg shadow-blue/20 hover:shadow-blue/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3"
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
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
                    <div className="bg-[#0f111a] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl shadow-blue/20">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                            <h2 className="text-xl font-black text-white flex items-center gap-3">
                                🎯 <span className="text-white/80">Yeni Hedef Tanımla</span>
                            </h2>
                            <button onClick={() => setShowTargetModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all">✕</button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Personel</label>
                                <select
                                    className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-blue-500/30/50 outline-none appearance-none"
                                    value={newTarget.staffId}
                                    onChange={(e) => setNewTarget({ ...newTarget, staffId: e.target.value })}
                                >
                                    <option value="" className="bg-[#0f111a]">Personel Seçiniz</option>
                                    {staff.map(p => (
                                        <option key={p.id} value={p.id} className="bg-[#0f111a]">{p.name} ({p.role})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Hedef Türü</label>
                                    <select
                                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-blue-500/30/50 outline-none appearance-none"
                                        value={newTarget.type}
                                        onChange={(e) => setNewTarget({ ...newTarget, type: e.target.value })}
                                    >
                                        <option value="TURNOVER" className="bg-[#0f111a]">💰 Ciro Hedefi</option>
                                        <option value="VISIT" className="bg-[#0f111a]">📍 Ziyaret Hedefi</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Periyot</label>
                                    <input
                                        type="text"
                                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white/50 outline-none"
                                        value="Aylık (Varsayılan)"
                                        disabled
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Hedef Değeri ({newTarget.type === 'TURNOVER' ? 'TL' : 'Adet'})</label>
                                <input
                                    type="number"
                                    className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-blue-500/30/50 outline-none"
                                    placeholder={newTarget.type === 'TURNOVER' ? "50000" : "100"}
                                    value={newTarget.targetValue}
                                    onChange={(e) => setNewTarget({ ...newTarget, targetValue: e.target.value })}
                                />
                            </div>

                            {newTarget.type === 'TURNOVER' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Prim Oranı (%)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            className="w-full h-12 bg-blue-500/5 border border-blue-500/10 rounded-xl px-4 text-sm text-blue-400 focus:border-blue-500/30 outline-none"
                                            placeholder="1.5"
                                            value={newTarget.commissionRate}
                                            onChange={(e) => setNewTarget({ ...newTarget, commissionRate: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Hedef Bonusu (TL)</label>
                                        <input
                                            type="number"
                                            className="w-full h-12 bg-emerald-500/5 border border-emerald-500/10 rounded-xl px-4 text-sm text-emerald-400 focus:border-emerald-500/30 outline-none"
                                            placeholder="2500"
                                            value={newTarget.bonusAmount}
                                            onChange={(e) => setNewTarget({ ...newTarget, bonusAmount: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Başlangıç</label>
                                    <input
                                        type="date"
                                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-blue-500/30/50 outline-none"
                                        value={newTarget.startDate}
                                        onChange={(e) => setNewTarget({ ...newTarget, startDate: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Bitiş</label>
                                    <input
                                        type="date"
                                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-blue-500/30/50 outline-none"
                                        value={newTarget.endDate}
                                        onChange={(e) => setNewTarget({ ...newTarget, endDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleSaveTarget}
                                disabled={isProcessing}
                                className="w-full h-14 bg-blue-600 text-white rounded-xl font-black text-sm tracking-widest shadow-lg shadow-blue/20 hover:shadow-blue/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                            >
                                {isProcessing ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : '🎯 HEDEFİ KAYDET'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}
