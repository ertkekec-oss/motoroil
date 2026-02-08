"use client";

import { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useModal } from '@/contexts/ModalContext';
import { useFinancials } from '@/contexts/FinancialContext';

export default function StaffManagementContent() {
    const [activeTab, setActiveTab] = useState('list'); // list, roles, performance, shifts, leaves, payroll
    const { staff, currentUser, hasPermission, addNotification, refreshStaff, branches } = useApp();
    const { addFinancialTransaction, kasalar, setKasalar } = useFinancials();
    const { showSuccess, showConfirm } = useModal();
    const isSystemAdmin = currentUser === null || (currentUser.role && (currentUser.role.toLowerCase().includes('admin') || currentUser.role.toLowerCase().includes('müdür')));

    const [selectedStaff, setSelectedStaff] = useState<any>(null);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [showPermissionModal, setShowPermissionModal] = useState(false);
    const [showAddStaffModal, setShowAddStaffModal] = useState(false);
    const [showEditStaffModal, setShowEditStaffModal] = useState(false);
    const [editStaff, setEditStaff] = useState<any>({ name: '', email: '', role: '', branch: '', type: 'service', age: '', address: '', salary: '' });

    const [taskContent, setTaskContent] = useState('');
    const [taskPriority, setTaskPriority] = useState('normal');
    const [isProcessing, setIsProcessing] = useState(false);

    const [newStaff, setNewStaff] = useState({
        name: '', email: '', role: '', branch: '', type: 'service', age: '', address: '', salary: ''
    });

    // --- NEW STATES FOR HR MODULES ---
    const [shifts, setShifts] = useState<any[]>([]);
    const [leaves, setLeaves] = useState<any[]>([]);
    const [payrolls, setPayrolls] = useState<any[]>([]);
    const [currentWeekStart, setCurrentWeekStart] = useState(getMonday(new Date()));
    const [targets, setTargets] = useState<any[]>([]);
    const [showTargetModal, setShowTargetModal] = useState(false);
    const [newTarget, setNewTarget] = useState({
        staffId: '', type: 'TURNOVER', targetValue: '', period: 'MONTHLY', startDate: '', endDate: ''
    });

    // --- STAFF DOCUMENTS STATE ---
    const [staffDocuments, setStaffDocuments] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    function getMonday(d: Date) {
        d = new Date(d);
        var day = d.getDay(),
            diff = d.getDate() - day + (day == 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    }

    // --- FETCH DATA FUNCTIONS ---
    useEffect(() => {
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
                setShifts(data);
            }
        } catch (e) { console.error(e); }
    };

    const fetchLeaves = async () => {
        try {
            const res = await fetch('/api/staff/leaves');
            if (res.ok) setLeaves(await res.json());
        } catch (e) { console.error(e); }
    };

    const fetchPayrolls = async () => {
        try {
            const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM
            const res = await fetch(`/api/staff/payroll?period=${currentPeriod}`);
            if (res.ok) setPayrolls(await res.json());
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
            if (res.ok) setTargets(await res.json());
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        if (showEditStaffModal && editStaff.id) {
            fetchStaffDocuments(editStaff.id);
        }
    }, [showEditStaffModal, editStaff.id]);

    // Load data when tab changes
    useEffect(() => {
        if (activeTab === 'shifts') fetchShifts();
        if (activeTab === 'leaves') fetchLeaves();
        if (activeTab === 'payroll') fetchPayrolls();
        if (activeTab === 'performance') fetchTargets();
    }, [activeTab, currentWeekStart]);

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

        if (!newStaff.email) {
            showSuccess('Hata', 'Lütfen e-posta adresini giriniz.');
            return;
        }

        if (!newStaff.branch) {
            showSuccess('Hata', 'Lütfen personel için bir şube seçiniz.');
            return;
        }

        setIsProcessing(true);
        try {
            const res = await fetch('/api/staff', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newStaff,
                    age: newStaff.age ? parseInt(newStaff.age) : null,
                    salary: newStaff.salary ? parseFloat(newStaff.salary) : 17002,
                    status: 'Müsait',
                    permissions: ['branch_isolation']
                })
            });

            if (res.ok) {
                await refreshStaff();
                setShowAddStaffModal(false);
                setNewStaff({ name: '', email: '', role: '', branch: '', type: 'service', age: '', address: '', salary: '' });
                showSuccess("Personel Eklendi", "Sisteme giriş yetkileri varsayılan olarak tanımlandı. Şifre mail olarak gönderildi.");
            }
        } catch (e) {
            console.error('Save staff failed', e);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleEditStaff = async () => {
        if (!editStaff.name || !editStaff.role || !editStaff.branch) {
            showSuccess('Hata', 'Lütfen tüm zorunlu alanları doldurun.');
            return;
        }

        setIsProcessing(true);
        try {
            const res = await fetch('/api/staff', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editStaff.id,
                    name: editStaff.name,
                    email: editStaff.email,
                    role: editStaff.role,
                    branch: editStaff.branch,
                    type: editStaff.type,
                    age: editStaff.age,
                    address: editStaff.address,
                    salary: editStaff.salary
                })
            });

            if (res.ok) {
                await refreshStaff();
                setShowEditStaffModal(false);
                setEditStaff({ name: '', email: '', role: '', branch: '', type: 'service', age: '', address: '', salary: '' });
                showSuccess("Personel Güncellendi", "Personel bilgileri başarıyla güncellendi.");
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
            showSuccess("Hata", "Dosya boyutu 5MB'dan küçük olmalıdır.");
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
        if (!confirm("Belgeyi silmek istediğinize emin misiniz?")) return;
        try {
            const res = await fetch(`/api/staff/documents?id=${docId}`, { method: 'DELETE' });
            if (res.ok) {
                await fetchStaffDocuments(editStaff.id);
                showSuccess("Silindi", "Belge başarıyla silindi.");
            }
        } catch (e) { console.error(e); }
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
            showSuccess('Hata', 'Lütfen tüm alanları doldurun.');
            return;
        }
        setIsProcessing(true);
        try {
            const res = await fetch('/api/staff/targets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newTarget,
                    targetValue: parseFloat(newTarget.targetValue)
                })
            });
            if (res.ok) {
                await fetchTargets();
                setShowTargetModal(false);
                setNewTarget({ staffId: '', type: 'TURNOVER', targetValue: '', period: 'MONTHLY', startDate: '', endDate: '' });
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
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-white mb-2">👥 Ekip & Yetki Yönetimi</h1>
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                        <p className="text-white/60 font-medium text-sm">Personel performansı ve erişim kontrol merkezi.</p>
                    </div>
                </div>

                <div className="flex gap-3">
                    {hasPermission('create_staff') && (
                        <button onClick={() => setShowAddStaffModal(true)} className="btn btn-primary h-12 px-6 flex items-center gap-2 shadow-lg shadow-primary/20">
                            <span className="text-xl">+</span>
                            <span>YENİ PERSONEL</span>
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
                    <div className="text-3xl font-black text-amber-400">{staff.filter(s => s.status === 'Meşgul').length}</div>
                </div>
                <div className="card glass p-5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl group-hover:scale-110 transition-transform">📈</div>
                    <div className="text-muted text-[10px] font-black uppercase tracking-widest mb-1">Ekip Verimliliği</div>
                    <div className="text-3xl font-black text-purple-400">%94</div>
                </div>
            </div>

            {/* --- TOOLBAR --- */}
            <div className="flex items-center gap-4 mb-8 bg-white/5 p-2 rounded-2xl border border-white/5">
                <div className="flex bg-black/20 p-1 rounded-xl overflow-x-auto">
                    <button onClick={() => setActiveTab('list')} className={`px-6 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'list' ? 'bg-primary text-white' : 'text-white/40 hover:text-white'}`}>PERSONEL LİSTESİ</button>
                    <button onClick={() => setActiveTab('roles')} className={`px-6 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'roles' ? 'bg-primary text-white' : 'text-white/40 hover:text-white'}`}>ROLLER & İZİNLER</button>
                    <button onClick={() => setActiveTab('performance')} className={`px-6 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'performance' ? 'bg-primary text-white' : 'text-white/40 hover:text-white'}`}>PERFORMANS</button>
                    <button onClick={() => setActiveTab('shifts')} className={`px-6 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'shifts' ? 'bg-primary text-white' : 'text-white/40 hover:text-white'}`}>VARDİYA</button>
                    <button onClick={() => setActiveTab('leaves')} className={`px-6 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'leaves' ? 'bg-primary text-white' : 'text-white/40 hover:text-white'}`}>İZİNLER</button>
                    <button onClick={() => setActiveTab('payroll')} className={`px-6 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'payroll' ? 'bg-primary text-white' : 'text-white/40 hover:text-white'}`}>BORDRO</button>
                </div>

                {activeTab === 'list' && (
                    <div className="flex-1 relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30">🔍</span>
                        <input
                            type="text"
                            placeholder="İsim, rol veya şube ile ara..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-sm text-white outline-none focus:border-primary/50 transition-all"
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
                        <div key={person.id} className="card glass p-6 border border-white/5 hover:border-primary/30 transition-all group">
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-white/10 flex items-center justify-center text-2xl font-black text-primary">
                                        {person.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-white group-hover:text-primary transition-colors">{person.name}</h3>
                                        <div className="text-xs text-white/40 font-bold uppercase tracking-wide">{person.role} • {person.branch}</div>
                                    </div>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${(person.status === 'Müsait' || person.status === 'Boşta' || !person.status) ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-500'
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
                                    className="flex-1 py-3 rounded-xl bg-primary/10 border border-primary/20 text-primary text-[10px] font-black hover:bg-primary/20 transition-all"
                                >
                                    ✏️ DÜZENLE
                                </button>
                                <button
                                    onClick={() => { setSelectedStaff(person); setShowTaskModal(true); }}
                                    className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black hover:bg-white/10 transition-all"
                                >
                                    GÖREV ATA
                                </button>
                                <button
                                    onClick={() => { setSelectedStaff(person); setShowPermissionModal(true); }}
                                    className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black hover:bg-white/10 transition-all"
                                >
                                    YETKİLER
                                </button>
                                <button
                                    onClick={() => handleDeleteStaff(person)}
                                    className="flex-none px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black hover:bg-red-500/20 transition-all"
                                >
                                    🗑️ SİL
                                </button>
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
                                <th className="p-6">KRİTİK YETKİLER</th>
                                <th className="p-6 text-right">AKSİYON</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {[
                                { name: 'Yönetici', scope: 'Tam Erişim', critical: 'Tüm Sistem Kontrolü', color: 'text-primary' },
                                { name: 'Şube Müdürü', scope: 'Kendi Şubesi + Raporlar', critical: 'İskonto Yetkisi, Silme Yok', color: 'text-white' },
                                { name: 'E-Ticaret Uzmanı', scope: 'Siparişler + Ürünler', critical: 'Fiyat Güncelleme', color: 'text-white' },
                                { name: 'Servis Personeli', scope: 'İş Emirleri + Stok', critical: 'Müşteri Kaydı', color: 'text-white' }
                            ].map((role, idx) => (
                                <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="p-6 font-black text-lg">{role.name}</td>
                                    <td className="p-6 text-sm text-white/60">{role.scope}</td>
                                    <td className="p-6">
                                        <span className="text-xs bg-red-500/10 text-red-400 px-3 py-1 rounded-full font-bold">{role.critical}</span>
                                    </td>
                                    <td className="p-6 text-right">
                                        <button className="text-xs font-black text-primary hover:underline">DÜZENLE</button>
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
                            <div className="card glass p-8 border-t-4 border-primary">
                                <h4 className="text-muted text-xs font-black uppercase mb-4">TOPLAM HEDEF CİRO</h4>
                                <div className="text-5xl font-black text-white mb-4">₺ {(totalTarget / 1000).toFixed(1)}K</div>
                                <p className="text-xs text-white/30">Belirlenen toplam satış hedefi.</p>
                            </div>
                            <button
                                onClick={() => setShowTargetModal(true)}
                                className="card glass p-8 border-2 border-dashed border-white/10 hover:border-primary/50 hover:bg-primary/5 transition-all text-center flex flex-col items-center justify-center gap-3"
                            >
                                <span className="text-3xl">🎯</span>
                                <span className="font-black text-sm text-primary">YENİ HEDEF TANIMLA</span>
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
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex-1 h-1.5 w-24 bg-white/5 rounded-full overflow-hidden">
                                                                    <div
                                                                        className={`h-full rounded-full ${progress >= 100 ? 'bg-emerald-500' : 'bg-primary'}`}
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
                                className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold transition-all ml-2 shadow-lg shadow-primary/20">+ YENİ PLAN</button>
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
                            <div className="text-4xl font-black text-amber-400 mb-2">5 <span className="text-lg text-white/40 font-normal">Talep</span></div>
                            <p className="text-xs text-white/40">Son talep 2 saat önce geldi.</p>
                        </div>
                        <button
                            onClick={() => setShowLeaveModal(true)}
                            className="card glass p-8 border-2 border-dashed border-white/10 hover:border-primary/50 hover:bg-primary/5 transition-all text-center flex flex-col items-center justify-center gap-3">
                            <span className="text-3xl">📝</span>
                            <span className="font-black text-sm text-primary">YENİ İZİN TALEBİ OLUŞTUR</span>
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
                                                        'bg-amber-500/10 text-amber-500'
                                                    }`}>{leave.status}</span>
                                            </td>
                                            <td className="p-6 text-right">
                                                {leave.status === 'Bekliyor' || leave.status === 'Beklemede' ? (
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => handleUpdateLeaveStatus(leave.id, 'Onaylandı')}
                                                            disabled={isProcessing}
                                                            className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center font-bold"
                                                            title="Onayla"
                                                        >
                                                            ✓
                                                        </button>
                                                        <button
                                                            onClick={() => handleUpdateLeaveStatus(leave.id, 'Reddedildi')}
                                                            disabled={isProcessing}
                                                            className="w-8 h-8 rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center font-bold"
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
                    <div className="p-6 border-b border-white/5 flex justify-between items-center">
                        <h3 className="text-xl font-black">💰 Maaş & Hakediş Listesi (Ocak 2026)</h3>
                        <button onClick={handlePayAll} className="px-5 py-2 rounded-lg bg-emerald-500 text-black text-xs font-black hover:bg-emerald-400 transition-all">TÜMÜNÜ ÖDE</button>
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
                                                    className="px-3 py-1 rounded text-[10px] bg-primary/20 text-primary font-bold hover:bg-primary/30 transition-all">
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

            {/* --- MODALS --- */}

            {/* 1. TASK ASSIGN MODAL */}
            {showTaskModal && selectedStaff && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
                    <div className="bg-[#0f111a] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl shadow-primary/20">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                            <h2 className="text-xl font-black text-white flex items-center gap-3">
                                ⚡ <span className="text-white/80">Görev Ata</span>
                            </h2>
                            <button onClick={() => setShowTaskModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all">✕</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-xl font-black text-primary border border-primary/20">
                                    {selectedStaff.name.charAt(0)}
                                </div>
                                <div>
                                    <div className="text-lg font-bold text-white">{selectedStaff.name}</div>
                                    <div className="text-xs text-white/40 uppercase font-bold tracking-wider">{selectedStaff.role}</div>
                                </div>
                            </div>

                            <textarea
                                className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-primary/50 focus:bg-white/10 transition-all outline-none resize-none"
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
                                            ? (p === 'yüksek' ? 'bg-red-500 text-white border-red-500' : p === 'normal' ? 'bg-primary text-white border-primary' : 'bg-emerald-500 text-white border-emerald-500')
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
                                className="w-full h-12 bg-primary hover:bg-primary/80 text-white rounded-xl font-black text-sm tracking-widest shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all disabled:opacity-50"
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
                    <div className="bg-[#0f111a] border border-white/10 rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl shadow-primary/20">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                            <div>
                                <h2 className="text-xl font-black text-white flex items-center gap-3">
                                    🛡️ <span className="text-white/80">Erişim & Yetki Yönetimi</span>
                                </h2>
                                <div className="text-xs text-white/40 font-bold uppercase tracking-widest mt-1">
                                    {selectedStaff.name} • {selectedStaff.role}
                                </div>
                            </div>
                            <button onClick={() => setShowPermissionModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all">✕</button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {Array.from(new Set(allPermissions.map(p => p.category))).map(category => (
                                    <div key={category} className="perm-cat">
                                        <h3 className="text-xs font-black text-primary uppercase tracking-widest mb-4 border-b border-white/5 pb-2">
                                            {category} YETKİLERİ
                                        </h3>
                                        <div className="space-y-3">
                                            {allPermissions.filter(p => p.category === category).map(perm => {
                                                const isActive = (selectedStaff.permissions || []).includes(perm.id);
                                                return (
                                                    <label key={perm.id} className="flex items-start gap-3 cursor-pointer group select-none">
                                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${isActive ? 'bg-primary border-primary' : 'bg-white/5 border-white/10 group-hover:border-primary/50'
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
                        </div>

                        <div className="p-6 border-t border-white/5 bg-white/[0.02] flex justify-end gap-3">
                            <button onClick={() => setShowPermissionModal(false)} className="px-6 h-12 rounded-xl border border-white/10 text-white font-bold hover:bg-white/5 transition-all">
                                VAZGEÇ
                            </button>
                            <button onClick={savePermissions} disabled={isProcessing} className="px-8 h-12 rounded-xl bg-primary text-white font-black tracking-widest shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-105 transition-all">
                                {isProcessing ? 'KAYDEDİLİYOR...' : 'DEĞİŞİKLİKLERİ KAYDET'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. ADD STAFF MODAL */}
            {showAddStaffModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
                    <div className="bg-[#0f111a] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl shadow-primary/20">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                            <h2 className="text-xl font-black text-white flex items-center gap-3">
                                🆕 <span className="text-white/80">Yeni Personel Girişi</span>
                            </h2>
                            <button onClick={() => setShowAddStaffModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all">✕</button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Ad Soyad</label>
                                    <input
                                        type="text"
                                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-primary/50 outline-none"
                                        placeholder="Tam İsim"
                                        value={newStaff.name}
                                        onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">E-Posta</label>
                                    <input
                                        type="email"
                                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-primary/50 outline-none"
                                        placeholder="ornek@sirket.com"
                                        value={newStaff.email}
                                        onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Rol / Pozisyon</label>
                                    <select
                                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-primary/50 outline-none appearance-none"
                                        value={newStaff.role}
                                        onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                                    >
                                        <option value="" className="bg-[#0f111a]">Rol Seçiniz</option>
                                        <option value="Yönetici" className="bg-[#0f111a]">👑 Yönetici</option>
                                        <option value="Şube Müdürü" className="bg-[#0f111a]">🏢 Şube Müdürü</option>
                                        <option value="Muhasebe" className="bg-[#0f111a]">💰 Muhasebe</option>
                                        <option value="Denetçi" className="bg-[#0f111a]">🔍 Denetçi (Auditor)</option>
                                        <option value="Servis Personeli" className="bg-[#0f111a]">🔧 Servis Personeli</option>
                                        <option value="Satış Temsilcisi" className="bg-[#0f111a]">🤝 Satış Temsilcisi</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Şube</label>
                                    <select
                                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-primary/50 outline-none appearance-none"
                                        value={newStaff.branch}
                                        onChange={(e) => setNewStaff({ ...newStaff, branch: e.target.value })}
                                    >
                                        <option value="" className="bg-[#0f111a]">Şube Seçiniz</option>
                                        {branches.map(b => (
                                            <option key={b.id} value={b.name} className="bg-[#0f111a]">{b.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Maaş (Aylık Net)</label>
                                    <input
                                        type="number"
                                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-primary/50 outline-none"
                                        placeholder="17002"
                                        value={newStaff.salary}
                                        onChange={(e) => setNewStaff({ ...newStaff, salary: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Yaş</label>
                                    <input
                                        type="number"
                                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-primary/50 outline-none"
                                        placeholder="25"
                                        value={newStaff.age}
                                        onChange={(e) => setNewStaff({ ...newStaff, age: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleSaveStaff}
                                disabled={isProcessing}
                                className="w-full h-14 bg-gradient-to-r from-primary to-primary/80 hover:to-primary text-white rounded-xl font-black text-sm tracking-widest shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3"
                            >
                                {isProcessing ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>KAYDEDİLİYOR...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>💾 PERSONELİ KAYDET VE DAVET GÖNDER</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. EDIT STAFF MODAL */}
            {showEditStaffModal && editStaff && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
                    <div className="bg-[#0f111a] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl shadow-primary/20 max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                            <h2 className="text-xl font-black text-white flex items-center gap-3">
                                ✏️ <span className="text-white/80">Personel Düzenle: {editStaff.name}</span>
                            </h2>
                            <button onClick={() => setShowEditStaffModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all">✕</button>
                        </div>
                        <div className="p-8 space-y-6 overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Ad Soyad</label>
                                    <input
                                        type="text"
                                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-primary/50 outline-none"
                                        value={editStaff.name}
                                        onChange={(e) => setEditStaff({ ...editStaff, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">E-Posta</label>
                                    <input
                                        type="email"
                                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-primary/50 outline-none"
                                        value={editStaff.email}
                                        onChange={(e) => setEditStaff({ ...editStaff, email: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Rol / Pozisyon</label>
                                    <select
                                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-primary/50 outline-none appearance-none"
                                        value={editStaff.role}
                                        onChange={(e) => setEditStaff({ ...editStaff, role: e.target.value })}
                                    >
                                        <option value="Yönetici" className="bg-[#0f111a]">👑 Yönetici</option>
                                        <option value="Şube Müdürü" className="bg-[#0f111a]">🏢 Şube Müdürü</option>
                                        <option value="Muhasebe" className="bg-[#0f111a]">💰 Muhasebe</option>
                                        <option value="Denetçi" className="bg-[#0f111a]">🔍 Denetçi (Auditor)</option>
                                        <option value="Servis Personeli" className="bg-[#0f111a]">🔧 Servis Personeli</option>
                                        <option value="Satış Temsilcisi" className="bg-[#0f111a]">🤝 Satış Temsilcisi</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Şube</label>
                                    <select
                                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-primary/50 outline-none appearance-none"
                                        value={editStaff.branch}
                                        onChange={(e) => setEditStaff({ ...editStaff, branch: e.target.value })}
                                    >
                                        {branches.map(b => (
                                            <option key={b.id} value={b.name} className="bg-[#0f111a]">{b.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Maaş (Net)</label>
                                    <input
                                        type="number"
                                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-primary/50 outline-none"
                                        value={editStaff.salary}
                                        onChange={(e) => setEditStaff({ ...editStaff, salary: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* DOCUMENT UPLOAD SECTION */}
                            <div className="pt-6 border-t border-white/5">
                                <h3 className="text-sm font-black text-white mb-4">📄 Personel Belgeleri</h3>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {staffDocuments.map(doc => (
                                            <div key={doc.id} className="p-3 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center group">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <span className="text-xl">📄</span>
                                                    <div className="truncate">
                                                        <div className="text-xs font-bold text-white truncate">{doc.fileName}</div>
                                                        <div className="text-[10px] text-white/40">{new Date(doc.uploadedAt).toLocaleDateString()}</div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <a href={doc.fileData} download={doc.fileName} className="w-8 h-8 flex items-center justify-center rounded bg-primary/20 text-primary hover:bg-primary hover:text-white transition-all">⬇</a>
                                                    <button onClick={() => handleDeleteDocument(doc.id)} className="w-8 h-8 flex items-center justify-center rounded bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all">🗑️</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className={`border-2 border-dashed border-white/10 rounded-xl p-8 text-center transition-all ${isUploading ? 'opacity-50 pointer-events-none' : 'hover:border-primary/50 hover:bg-primary/5'}`}>
                                        <input
                                            type="file"
                                            id="doc-upload"
                                            className="hidden"
                                            onChange={handleFileUpload}
                                        />
                                        <label htmlFor="doc-upload" className="cursor-pointer flex flex-col items-center gap-2">
                                            <span className="text-2xl">☁️</span>
                                            <span className="text-sm font-bold text-white">Dosya Yükle</span>
                                            <span className="text-xs text-white/40">Sözleşme, kimlik vb. belgeler (Max 5MB)</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleEditStaff}
                                disabled={isProcessing}
                                className="w-full h-14 bg-primary text-white rounded-xl font-black text-sm tracking-widest shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
                            >
                                {isProcessing ? 'GÜNCELLENİYOR...' : 'DEĞİŞİKLİKLERİ KAYDET'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- SHIFT CREATION MODAL --- */}
            {
                showShiftModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
                        <div className="bg-[#0f111a] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl shadow-primary/20">
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
                                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-primary/50 outline-none appearance-none"
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
                                            className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-primary/50 outline-none"
                                            value={newShift.start}
                                            onChange={(e) => setNewShift({ ...newShift, start: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Bitiş Zamanı</label>
                                        <input
                                            type="datetime-local"
                                            className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-primary/50 outline-none"
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
                                                    ? 'bg-primary text-white border-primary'
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
                                    className="w-full h-14 bg-gradient-to-r from-primary to-primary/80 hover:to-primary text-white rounded-xl font-black text-sm tracking-widest shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3"
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
                        <div className="bg-[#0f111a] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl shadow-primary/20">
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
                                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-primary/50 outline-none appearance-none"
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
                                                    ? 'bg-primary text-white border-primary'
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
                                            className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-primary/50 outline-none"
                                            value={newLeave.startDate}
                                            onChange={(e) => setNewLeave({ ...newLeave, startDate: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Bitiş</label>
                                        <input
                                            type="date"
                                            className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-primary/50 outline-none"
                                            value={newLeave.endDate}
                                            onChange={(e) => setNewLeave({ ...newLeave, endDate: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Açıklama / Not</label>
                                    <textarea
                                        className="w-full h-24 bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-primary/50 focus:bg-white/10 transition-all outline-none resize-none"
                                        placeholder="İzin nedeni veya ek notlar..."
                                        value={newLeave.description}
                                        onChange={(e) => setNewLeave({ ...newLeave, description: e.target.value })}
                                    />
                                </div>

                                <button
                                    onClick={handleCreateLeave}
                                    disabled={isProcessing}
                                    className="w-full h-14 bg-gradient-to-r from-primary to-primary/80 hover:to-primary text-white rounded-xl font-black text-sm tracking-widest shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3"
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
                        <div className="bg-[#0f111a] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl shadow-primary/20">
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
                                                    className="w-3 h-3 rounded border-white/20 bg-white/5 text-primary focus:ring-0 checked:bg-primary"
                                                />
                                                <span className="text-[9px] font-bold text-white/40 group-hover:text-white/60">VARSAYILAN YAP</span>
                                            </label>
                                        </div>
                                        <input
                                            type="number"
                                            className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-primary/50 outline-none font-mono"
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

                                <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl flex items-center gap-3">
                                    <span className="text-xl">ℹ️</span>
                                    <p className="text-[10px] font-bold text-primary/80 leading-relaxed uppercase">
                                        ONAYLANDIKTAN SONRA BU TUTAR GİDERLERE "PERSONEL MAAŞ ÖDEMESİ" OLARAK İŞLENECEKTİR.
                                    </p>
                                </div>

                                <button
                                    onClick={handleSavePayroll}
                                    disabled={isProcessing}
                                    className="w-full h-14 bg-gradient-to-r from-primary to-primary/80 hover:to-primary text-white rounded-xl font-black text-sm tracking-widest shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3"
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
                    <div className="bg-[#0f111a] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl shadow-primary/20">
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
                                    className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-primary/50 outline-none appearance-none"
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
                                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-primary/50 outline-none appearance-none"
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
                                    className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-primary/50 outline-none"
                                    placeholder={newTarget.type === 'TURNOVER' ? "50000" : "100"}
                                    value={newTarget.targetValue}
                                    onChange={(e) => setNewTarget({ ...newTarget, targetValue: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Başlangıç</label>
                                    <input
                                        type="date"
                                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-primary/50 outline-none"
                                        value={newTarget.startDate}
                                        onChange={(e) => setNewTarget({ ...newTarget, startDate: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Bitiş</label>
                                    <input
                                        type="date"
                                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-primary/50 outline-none"
                                        value={newTarget.endDate}
                                        onChange={(e) => setNewTarget({ ...newTarget, endDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleSaveTarget}
                                disabled={isProcessing}
                                className="w-full h-14 bg-primary text-white rounded-xl font-black text-sm tracking-widest shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
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
