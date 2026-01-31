"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/contexts/AppContext';
import { useModal } from '@/contexts/ModalContext';
import Pagination from '@/components/Pagination';


export default function AccountingPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('receivables'); // receivables, payables, banks, expenses, checks
    const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'this_month'>('all');
    const {
        kasalar, setKasalar, addTransaction, currentUser, hasPermission,
        customers, suppliers, addFinancialTransaction, checks, addCheck,
        collectCheck, transactions, refreshCustomers, refreshTransactions,
        refreshKasalar, refreshSuppliers, kasaTypes, activeBranchName, salesExpenses
    } = useApp();
    const { showSuccess, showError, showWarning, showConfirm } = useModal();

    const isSystemAdmin = currentUser === null;
    const canDelete = hasPermission('delete_records');
    const [isProcessing, setIsProcessing] = useState(false);

    // Force refresh customers on mount to ensure latest balances
    useEffect(() => {
        refreshCustomers();
    }, []);

    const [receivables, setReceivables] = useState<any[]>([]);
    const [payables, setPayables] = useState<any[]>([]);

    const customerReceivables = useMemo(() => {
        const custs = customers.filter(c => Number(c.balance) > 0).map(c => ({
            id: `cust-${c.id}`,
            title: `${c.name} (Müşteri)`,
            date: c.lastVisit || new Date().toLocaleDateString('tr-TR'),
            amount: Number(c.balance),
            due: 'Veresiye',
            status: 'Cari Bakiye',
            branch: c.branch || 'Merkez'
        }));

        const sups = suppliers.filter(s => Number(s.balance) > 0).map(s => ({
            id: `sup-${s.id}`,
            title: `${s.name} (Tedarikçi)`,
            date: new Date().toLocaleDateString('tr-TR'),
            amount: Number(s.balance),
            due: 'Alacaklı',
            status: 'Tedarikçi Alacak',
            branch: 'Merkez'
        }));

        return [...custs, ...sups].sort((a, b) => b.amount - a.amount);
    }, [customers, suppliers]);

    const supplierPayables = useMemo(() => {
        const sups = suppliers.filter(s => Number(s.balance) < 0).map(s => ({
            id: `sup-${s.id}`,
            title: `${s.name} (Tedarikçi)`,
            date: new Date().toLocaleDateString('tr-TR'),
            amount: Math.abs(Number(s.balance)),
            due: 'Vadeli',
            status: 'Cari Bakiye',
            branch: 'Merkez'
        }));

        const custs = customers.filter(c => Number(c.balance) < 0).map(c => ({
            id: `cust-${c.id}`,
            title: `${c.name} (Müşteri)`,
            date: c.lastVisit || new Date().toLocaleDateString('tr-TR'),
            amount: Math.abs(Number(c.balance)),
            due: 'Fazla Ödeme / İade',
            status: 'Müşteri Alacağı',
            branch: c.branch || 'Merkez'
        }));

        return [...sups, ...custs].sort((a, b) => b.amount - a.amount);
    }, [suppliers, customers]);

    const filterByBranch = (list: any[]) => {
        const isAdmin = isSystemAdmin || !hasPermission('branch_isolation');
        // "Merkez" sees everything.
        if (isAdmin && activeBranchName === 'Merkez') return list;

        const targetBranch = isAdmin ? activeBranchName : (currentUser?.branch || 'Merkez');
        return list.filter(item => (item.branch || 'Merkez') === targetBranch);
    };

    useEffect(() => {
        // Only restrict if absolutely necessary, but typically finance view should see all tabs
        // if (!isSystemAdmin && (activeTab === 'payables' || activeTab === 'checks')) {
        //     setActiveTab('receivables');
        // }
    }, [activeTab, isSystemAdmin]);

    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState<'receivable' | 'payable'>('receivable');

    const expenses = useMemo(() => {
        return transactions.filter(t => t.type === 'Expense').map(t => ({
            id: t.id,
            title: t.description?.replace('Gider: ', '').split(' (')[0] || t.description,
            category: t.description?.match(/\((.*?)\)/)?.[1] || 'Genel',
            date: new Date(t.date).toLocaleDateString('tr-TR'),
            rawDate: t.date,
            amount: t.amount,
            method: kasalar.find(k => k.id.toString() === t.kasaId.toString())?.name || 'Bilinmiyor'
        }));
    }, [transactions, kasalar]);

    // Financial Dashboard Stats
    const [editingKasa, setEditingKasa] = useState<any>(null);
    const [showKasaEditModal, setShowKasaEditModal] = useState(false);

    const [showCheckCollectModal, setShowCheckCollectModal] = useState(false);
    const [activeCheck, setActiveCheck] = useState<any>(null);
    const [targetKasaId, setTargetKasaId] = useState('');
    const [installmentLabel, setInstallmentLabel] = useState('');

    // --- SCHEDULED PAYMENTS LOGIC ---
    const [scheduledPayments, setScheduledPayments] = useState<any[]>([]);

    // Financial Dashboard Stats
    const stats = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        // Receivables Stats (Customer balances are current snapshots, installments have dates)
        let receivablesToday = 0;
        let receivablesThisMonth = 0;

        // From installments (IN)
        scheduledPayments.forEach(plan => {
            if (plan.direction === 'IN') {
                plan.installments.forEach((inst: any) => {
                    if (inst.status !== 'Paid') {
                        const dueDate = new Date(inst.dueDate);
                        if (dueDate.getTime() <= today.getTime() + 86400000) {
                            receivablesToday += Number(inst.amount);
                        }
                        if (dueDate >= firstDayOfMonth) {
                            receivablesThisMonth += Number(inst.amount);
                        }
                    }
                });
            }
        });

        // From Checks (IN)
        checks.forEach(c => {
            if (c.type.includes('Alınan') && c.status === 'Beklemede') {
                const dueDate = new Date(c.dueDate);
                if (dueDate.getTime() <= today.getTime() + 86400000) {
                    receivablesToday += Number(c.amount);
                }
                if (dueDate >= firstDayOfMonth) {
                    receivablesThisMonth += Number(c.amount);
                }
            }
        });

        const netKasa = kasalar.reduce((a, b) => a + Number(b.balance), 0);

        return { receivablesToday, receivablesThisMonth, netKasa };
    }, [scheduledPayments, checks, kasalar]);

    const [showScheduledModal, setShowScheduledModal] = useState(false);
    const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);
    const [payingInstallmentId, setPayingInstallmentId] = useState<string | null>(null);
    const [installmentKasaId, setInstallmentKasaId] = useState<string>('');

    const filterByTime = (list: any[]) => {
        if (timeFilter === 'all') return list;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const nextDay = new Date(today.getTime() + 86400000);
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        return list.filter(item => {
            if (!item.date) return true;
            let d: Date;
            if (item.date.includes('.')) {
                const parts = item.date.split('.');
                d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
            } else {
                d = new Date(item.rawDate || item.date);
            }

            if (timeFilter === 'today') {
                return d.getTime() >= today.getTime() && d.getTime() < nextDay.getTime();
            }
            if (timeFilter === 'this_month') {
                return d.getTime() >= startOfMonth.getTime();
            }
            return true;
        });
    };

    // PAGINATION
    const itemsPerPage = 10;
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab]);

    const activeListLength = useMemo(() => {
        if (activeTab === 'receivables') return filterByTime([...filterByBranch(receivables), ...customerReceivables]).length;
        if (activeTab === 'payables') return filterByTime([...filterByBranch(payables), ...supplierPayables]).length;
        if (activeTab === 'checks') return filterByTime(checks).length;
        if (activeTab === 'expenses') return filterByTime(expenses).length;
        if (activeTab === 'transactions_list') return filterByTime(transactions).length;
        return 0;
    }, [activeTab, receivables, customerReceivables, payables, supplierPayables, checks, expenses, transactions, timeFilter]);

    const totalPages = Math.ceil(activeListLength / itemsPerPage);

    const paginate = (list: any[]) => {
        return list.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    };

    const [newItem, setNewItem] = useState({
        title: '',
        entityId: '',
        amount: '',
        due: '',
        isCollected: false,
        cashAmount: '0',
        cardAmount: '0',
        selectedCashboxId: '',
        selectedCardBankId: ''
    });

    useEffect(() => {
        if (kasalar.length > 0) {
            setNewItem(prev => ({
                ...prev,
                selectedCashboxId: kasalar.find(k => k.type === 'Nakit')?.id.toString() || kasalar[0].id.toString(),
                selectedCardBankId: kasalar.find(k => k.type === 'Banka')?.id.toString() || kasalar[0].id.toString()
            }));
        }
    }, [kasalar]);

    const [branchKasaMappings, setBranchKasaMappings] = useState<Record<string, string[]>>({});

    useEffect(() => {
        const fetchBranchSettings = async () => {
            try {
                const res = await fetch('/api/settings');
                const data = await res.json();
                if (data && data.branchKasaMappings) {
                    setBranchKasaMappings(data.branchKasaMappings);
                }
            } catch (err) {
                console.error('Settings fetch failed:', err);
            }
        };
        fetchBranchSettings();
    }, []);

    // Filtered Kasa List based on Active Branch
    const filteredKasalar = useMemo(() => {
        if (!activeBranchName || activeBranchName === 'all' || isSystemAdmin && activeBranchName === 'Tümü') return kasalar;

        const allowedIds = branchKasaMappings[activeBranchName];
        if (!allowedIds || allowedIds.length === 0) return kasalar; // Fallback if no mapping exists

        return kasalar.filter(k => allowedIds.includes(k.id.toString()));
    }, [kasalar, activeBranchName, branchKasaMappings, isSystemAdmin]);

    const [showPayModal, setShowPayModal] = useState(false);
    const [activePayItem, setActivePayItem] = useState<any>(null);
    const [payDetails, setPayDetails] = useState({
        cash: '0',
        card: '0',
        cashboxId: '',
        bankId: ''
    });

    const [showAddBank, setShowAddBank] = useState(false);
    const [newBank, setNewBank] = useState({ name: '', type: 'Nakit Kasa' });

    const [showVirmanModal, setShowVirmanModal] = useState(false);
    const [virmanData, setVirmanData] = useState({ fromKasaId: '', toKasaId: '', amount: '', description: '' });

    const [showCheckModal, setShowCheckModal] = useState(false);
    const [newCheck, setNewCheck] = useState({ type: 'Alınan Çek', number: '', bank: '', dueDate: '', amount: '', entityId: '', description: '' });

    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [newExpense, setNewExpense] = useState({ id: '', title: '', category: 'Diğer', amount: '', date: new Date().toISOString().split('T')[0], method: 'Nakit', kasaId: '' });
    const [isEditingExpense, setIsEditingExpense] = useState(false);

    useEffect(() => {
        if (activeTab === 'receivables' || activeTab === 'payables') {
            const fetchScheduled = async () => {
                try {
                    const res = await fetch('/api/financials/payment-plans');
                    const data = await res.json();
                    if (data.success) setScheduledPayments(data.plans);
                } catch (e) { console.error(e) }
            };
            fetchScheduled();
        }
    }, [activeTab]);

    const [newPlan, setNewPlan] = useState({
        title: '', totalAmount: '', installmentCount: '', startDate: '', type: 'Kredi',
        direction: 'OUT', customerId: '', supplierId: '', isExisting: false
    });

    const saveNewPlan = async () => {
        if (!newPlan.title || !newPlan.totalAmount || !newPlan.installmentCount || !newPlan.startDate) {
            showWarning("Eksik Bilgi", "Lütfen tüm alanları doldurunuz.");
            return;
        }
        setIsProcessing(true);
        try {
            const res = await fetch('/api/financials/payment-plans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newPlan,
                    branch: currentUser?.branch || 'Merkez'
                })
            });
            const data = await res.json();
            if (data.success) {
                showSuccess("Başarılı", "Ödeme Planı oluşturuldu.");
                setShowScheduledModal(false);
                setNewPlan({
                    title: '', totalAmount: '', installmentCount: '', startDate: '', type: 'Kredi',
                    direction: 'OUT', customerId: '', supplierId: '', isExisting: false
                });
                // Re-fetch
                const res2 = await fetch('/api/financials/payment-plans');
                const data2 = await res2.json();
                if (data2.success) setScheduledPayments(data2.plans);
            } else {
                showError("Hata", data.error || 'Oluşturulamadı');
            }
        } catch (e) {
            showError("Hata", "Bir hata oluştu");
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePayInstallment = async (inst: any, kasaId: string, installmentLabel?: string) => {
        setIsProcessing(true);
        try {
            const res = await fetch('/api/financials/payment-plans/pay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ installmentId: inst.id, kasaId, installmentLabel })
            });
            const data = await res.json();
            if (data.success) {
                showSuccess("Ödendi", "Taksit ödemesi başarıyla yapıldı.");
                // Refresh plans
                const res2 = await fetch('/api/financials/payment-plans');
                const data2 = await res2.json();
                if (data2.success) setScheduledPayments(data2.plans);

                // CRITICAL: Refresh all related data so movements & balances are visible immediately!
                refreshTransactions();
                refreshKasalar();
                refreshCustomers();
                refreshSuppliers();
            } else {
                showError("Hata", data.error || 'Ödenemedi');
            }
        } catch (e) {
            showError("Hata", "Bir sorun oluştu");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCollect = (item: any) => {
        router.push(`/payment?amount=${Math.abs(item.amount)}&title=${encodeURIComponent(item.title)}&ref=ACC-${item.id}`);
    };

    const handlePay = (item: any) => {
        setActivePayItem(item);
        setPayDetails({
            cash: Math.abs(item.amount).toString(),
            card: '0',
            cashboxId: kasalar.find(k => k.type === 'Nakit')?.id.toString() || '',
            bankId: kasalar.find(k => k.type === 'Banka')?.id.toString() || ''
        });
        setShowPayModal(true);
    };

    const handleExecuteCheckCollect = async () => {
        if (!activeCheck || !targetKasaId) return;
        setIsProcessing(true);
        try {
            const res = await collectCheck(activeCheck.id, targetKasaId);
            if (res?.success) {
                showSuccess("Başarılı", `${activeCheck.type.includes('Alınan') ? 'Tahsilat' : 'Ödeme'} işlemi tamamlandı.`);
                setShowCheckCollectModal(false);
                setActiveCheck(null);
            } else {
                showError("Hata", res?.error || "İşlem başarısız.");
            }
        } catch (e) {
            showError("Hata", "Bir hata oluştu.");
        } finally {
            setIsProcessing(false);
        }
    };

    const finalizePayment = async () => {
        if (!activePayItem) return;
        if (isProcessing) return;
        setIsProcessing(true);
        try {
            const cashAmt = parseFloat(payDetails.cash) || 0;
            const cardAmt = parseFloat(payDetails.card) || 0;

            // Parse entity ID from activePayItem.id (format: sup-123 or cust-123)
            let supplierId: string | undefined;
            let customerId: string | undefined;

            if (activePayItem.id.toString().startsWith('sup-')) {
                supplierId = activePayItem.id.split('sup-')[1];
            } else if (activePayItem.id.toString().startsWith('cust-')) {
                customerId = activePayItem.id.split('cust-')[1];
            }

            if (cashAmt > 0) {
                await addFinancialTransaction({
                    type: 'Payment',
                    amount: cashAmt,
                    description: `Borç Ödemesi (Nakit): ${activePayItem.title}`,
                    kasaId: payDetails.cashboxId,
                    supplierId,
                    customerId
                });
            }
            if (cardAmt > 0) {
                await addFinancialTransaction({
                    type: 'Payment',
                    amount: cardAmt,
                    description: `Borç Ödemesi (Banka): ${activePayItem.title}`,
                    kasaId: payDetails.bankId,
                    supplierId,
                    customerId
                });
            }
            setShowPayModal(false);
            setActivePayItem(null);
        } finally {
            setIsProcessing(false);
        }
    };

    const openModal = (type: 'receivable' | 'payable') => {
        const list = type === 'receivable' ? customers : suppliers;
        setModalType(type);
        const defaultEntityId = list.length > 0 ? list[0].id.toString() : '';
        setNewItem({
            title: '',
            entityId: defaultEntityId,
            amount: '',
            due: '',
            isCollected: false,
            cashAmount: '0',
            cardAmount: '0',
            selectedCashboxId: kasalar.find(k => k.type === 'Nakit')?.id.toString() || '',
            selectedCardBankId: kasalar.find(k => k.type === 'Banka')?.id.toString() || ''
        });
        setShowModal(true);
    };

    const saveNewItem = async () => {
        if (!newItem.entityId || !newItem.amount) {
            showWarning("Eksik Bilgi", "Lütfen bir cari seçiniz ve tutar giriniz.");
            return;
        }

        if (isProcessing) return;
        setIsProcessing(true);
        try {
            const totalAmount = parseFloat(newItem.amount);
            const cashAmt = parseFloat(newItem.cashAmount);
            const cardAmt = parseFloat(newItem.cardAmount);
            const selectedEntity = (modalType === 'receivable' ? customers : suppliers).find(c => c.id.toString() === newItem.entityId.toString());

            if (newItem.isCollected) {
                if (cashAmt > 0) {
                    await addFinancialTransaction({
                        type: modalType === 'receivable' ? 'Collection' : 'Payment',
                        amount: cashAmt,
                        description: `${modalType === 'receivable' ? 'Tahsilat' : 'Ödeme'} (Nakit): ${selectedEntity?.name}`,
                        kasaId: newItem.selectedCashboxId,
                        customerId: modalType === 'receivable' ? newItem.entityId : undefined,
                        supplierId: modalType === 'payable' ? newItem.entityId : undefined
                    });
                }
                if (cardAmt > 0) {
                    await addFinancialTransaction({
                        type: modalType === 'receivable' ? 'Collection' : 'Payment',
                        amount: cardAmt,
                        description: `${modalType === 'receivable' ? 'Tahsilat' : 'Ödeme'} (Kart): ${selectedEntity?.name}`,
                        kasaId: newItem.selectedCardBankId,
                        customerId: modalType === 'receivable' ? newItem.entityId : undefined,
                        supplierId: modalType === 'payable' ? newItem.entityId : undefined
                    });
                }
                showSuccess("Başarılı", "İşlem başarıyla kaydedildi.");

            } else {
                const addedItem = {
                    id: `manual-${Date.now()}`,
                    title: selectedEntity?.name || 'Yeni Kayıt',
                    date: new Date().toLocaleDateString('tr-TR'),
                    amount: modalType === 'receivable' ? -totalAmount : totalAmount,
                    due: newItem.due || 'Vadesiz',
                    status: 'Bekliyor',
                    branch: currentUser?.branch || 'Merkez'
                };
                if (modalType === 'receivable') setReceivables(prev => [addedItem, ...prev]);
                else setPayables(prev => [addedItem, ...prev]);
                showSuccess("Başarılı", "Kayıt eklendi.");

            }
            setShowModal(false);
        } finally {
            setIsProcessing(false);
        }
    };

    const saveNewCheck = async () => {
        if (!newCheck.entityId || !newCheck.amount || !newCheck.dueDate) {
            showWarning("Eksik Bilgi", "Lütfen tüm alanları doldurunuz.");
            return;
        }

        if (isProcessing) return;
        setIsProcessing(true);
        try {
            // Determine document category (Customer doc vs Supplier doc)
            const isAlinan = newCheck.type.includes('Alınan');

            await addCheck({
                type: newCheck.type,
                number: newCheck.number,
                bank: newCheck.bank,
                dueDate: newCheck.dueDate,
                amount: parseFloat(newCheck.amount),
                customerId: isAlinan ? newCheck.entityId : undefined,
                supplierId: !isAlinan ? newCheck.entityId : undefined,
                description: newCheck.description
            });
            setShowCheckModal(false);
            setNewCheck({ type: 'Alınan Çek', number: '', bank: '', dueDate: '', amount: '', entityId: '', description: '' });
            showSuccess("Başarılı", "Evrak başarıyla kaydedildi.");

        } catch (error) {
            showError("Hata", "Evrak kaydedilemedi.");
        } finally {
            setIsProcessing(false);
        }
    };

    const saveNewExpense = async () => {
        if (!newExpense.title || !newExpense.amount || !newExpense.kasaId) {
            showWarning("Eksik Bilgi", "Lütfen tüm alanları (Açıklama, Tutar, Kasa) doldurunuz.");
            return;
        }
        if (isProcessing) return;
        setIsProcessing(true);
        try {
            const amt = parseFloat(newExpense.amount);
            const kId = newExpense.kasaId;

            if (isEditingExpense && newExpense.id) {
                // UPDATE EXISTING
                await fetch(`/api/financials/transactions/${newExpense.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: newExpense.title,
                        category: newExpense.category,
                        amount: amt,
                        date: newExpense.date
                    })
                });
                showSuccess("Başarılı", "Gider güncellendi.");
            } else {
                // CREATE NEW
                await addFinancialTransaction({
                    type: 'Expense',
                    description: `Gider: ${newExpense.title} (${newExpense.category})`,
                    amount: amt,
                    kasaId: kId?.toString() || kasalar[0]?.id.toString() || ''
                });
                showSuccess("Başarılı", "Gider kaydedildi.");
            }

            setShowExpenseModal(false);
            setNewExpense({ id: '', title: '', category: 'Diğer', amount: '', date: new Date().toISOString().split('T')[0], method: 'Nakit', kasaId: '' });
            setIsEditingExpense(false);

            // Force refresh transactions
            window.location.reload();

        } catch (e) {
            showError("Hata", "İşlem başarısız.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleEditExpense = (e: any) => {
        setNewExpense({
            id: e.id,
            title: e.title,
            category: e.category,
            amount: e.amount.toString(),
            date: e.date.split('.').reverse().join('-'), // DD.MM.YYYY -> YYYY-MM-DD
            method: e.method || 'Nakit',
            kasaId: e.kasaId?.toString() || ''
        });
        setIsEditingExpense(true);
        setShowExpenseModal(true);
    };

    const handleDeleteExpense = (id: string) => {
        showConfirm('Gider Silinecek', 'Bu gider kaydını silmek istediğinize emin misiniz? Bakiye geri yüklenecektir.', async () => {
            setIsProcessing(true);
            try {
                await fetch(`/api/financials/transactions/${id}`, { method: 'DELETE' });
                showSuccess("Başarılı", "Gider silindi ve bakiye güncellendi.");
                window.location.reload();
            } catch (e) {
                showError("Hata", "Silme işlemi başarısız.");
            } finally {
                setIsProcessing(false);
            }
        });
    };

    const handleEditKasa = (k: any) => {
        setEditingKasa({ ...k });
        setShowKasaEditModal(true);
    };

    const handleSaveKasaEdit = async () => {
        if (!editingKasa) return;
        setIsProcessing(true);
        try {
            await fetch(`/api/kasalar/${editingKasa.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: editingKasa.name, type: editingKasa.type })
            });
            showSuccess("Başarılı", "Kasa bilgileri güncellendi.");
            setShowKasaEditModal(false);
            setEditingKasa(null);

            // Force reload to ensure context sync
            window.location.reload();

        } catch (e) {
            showError("Hata", "Güncelleme başarısız.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDeleteKasa = (id: string, balance: number) => {
        // Floating point tolerance (e.g. 0.00001 should be treated as 0)
        // CHANGE: Allow deletion even if minor balance (e.g. < 1 TL) or prompt user better
        if (Math.abs(balance) > 0.5) {
            showWarning("Silinemez", `Kasada bakiye var (${balance.toLocaleString()} ₺). Lütfen önce bakiyeyi sıfırlayın.`);
            return;
        }

        // CONFIRMATION DIALOG FOR DELETE
        showConfirm('Kasa Silinecek', 'Bu kasayı silmek istediğinize emin misiniz?', async () => {
            setIsProcessing(true);
            try {
                const res = await fetch(`/api/kasalar/${id}`, { method: 'DELETE' });
                const result = await res.json();

                if (result.success) {
                    // Update Local State IMMEDIATELY
                    setKasalar(kasalar.filter(k => k.id.toString() !== id.toString()));
                    showSuccess("Başarılı", "Kasa silindi.");
                } else {
                    showError("Hata", "Silme başarısız: " + result.error);
                }
            } catch (e) {
                showError("Hata", "Silme işlemi sırasında ağ hatası oluştu.");
            } finally {
                setIsProcessing(false);
            }
        });
    };

    const addNewBank = async () => {
        if (!newBank.name) return;
        if (isProcessing) return;
        setIsProcessing(true);
        try {
            const res = await fetch('/api/kasalar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newBank.name.toUpperCase(), type: newBank.type === 'Nakit Kasa' ? 'Nakit' : 'Banka', balance: 0 })
            });
            const data = await res.json();
            if (data.success) {
                // IMPORTANT: Automatically assign this new kasa to the active branch if one is selected
                if (activeBranchName && activeBranchName !== 'all' && data.kasa?.id) {
                    try {
                        const settingsRes = await fetch('/api/settings');
                        const settingsData = await settingsRes.json();
                        const currentMappings = settingsData.branchKasaMappings || {};
                        const branchList = currentMappings[activeBranchName] || [];

                        if (!branchList.includes(data.kasa.id)) {
                            currentMappings[activeBranchName] = [...branchList, data.kasa.id];
                            await fetch('/api/settings', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ branchKasaMappings: currentMappings })
                            });
                        }
                    } catch (err) {
                        console.error('Auto-mapping failed', err);
                    }
                }

                // Refresh Kasalar list
                const kRes = await fetch('/api/kasalar');
                const kData = await kRes.json();
                if (kData.success) {
                    setKasalar(kData.kasalar);
                }

                setShowAddBank(false);
                setNewBank({ name: '', type: 'Nakit Kasa' });
                showSuccess("Başarılı", "Kasa/Banka başarıyla oluşturuldu.");
            } else {
                showError("Hata", data.error || 'Oluşturulamadı');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsProcessing(false);
        }
    };

    const executeVirman = async () => {
        if (!virmanData.fromKasaId || !virmanData.toKasaId || !virmanData.amount) return;
        if (isProcessing) return;
        setIsProcessing(true);
        try {
            const amount = parseFloat(virmanData.amount);
            await addFinancialTransaction({ type: 'Transfer', amount, description: virmanData.description || 'Virman', kasaId: virmanData.fromKasaId, targetKasaId: virmanData.toKasaId });
            setShowVirmanModal(false);
            setVirmanData({ fromKasaId: '', toKasaId: '', amount: '', description: '' });
            showSuccess("Başarılı", "Virman tamamlandı.");

        } finally {
            setIsProcessing(false);
        }
    };

    if (!hasPermission('finance_view')) return <div className="container p-20 text-center"><h1>Yetkisiz Erişim</h1></div>;

    useEffect(() => {
        // Reset all modals when tab changes
        setShowModal(false);
        setShowPayModal(false);
        setShowCheckModal(false);
        setShowExpenseModal(false);
        setShowAddBank(false);
        setShowVirmanModal(false);
    }, [activeTab]);

    return (
        <div className="container p-4 md:p-8 animate-in">
            <header className="flex-between mb-8">
                <div>
                    <h1 className="text-4xl font-black text-gradient">Muhasebe & Finans</h1>
                    <p className="text-muted">Nakit akışı, alacak/borç ve kasa yönetimi</p>
                </div>
                <div className="flex gap-4">
                    <button onClick={() => { refreshCustomers(); refreshTransactions(); refreshKasalar(); refreshSuppliers(); }} className="btn btn-outline text-xs">🔄 Yenile</button>
                </div>
            </header>

            {/* DASHBOARD STATS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="card glass-plus p-5 flex flex-col justify-between border-l-4 border-primary">
                    <div className="flex-between mb-2">
                        <span className="text-xs font-bold text-muted uppercase tracking-wider">Bugünkü Alacaklar</span>
                        <div className="p-2 bg-primary/10 rounded-lg text-primary text-xl">📅</div>
                    </div>
                    <div>
                        <div className="text-3xl font-black text-white">{stats.receivablesToday.toLocaleString()} ₺</div>
                        <div className="text-[10px] text-muted mt-1">Vadesi bugün veya geçmiş olanlar</div>
                    </div>
                </div>

                <div className="card glass-plus p-5 flex flex-col justify-between border-l-4 border-accent">
                    <div className="flex-between mb-2">
                        <span className="text-xs font-bold text-muted uppercase tracking-wider">Bu Ayki Alacaklar</span>
                        <div className="p-2 bg-accent/10 rounded-lg text-accent text-xl">⏳</div>
                    </div>
                    <div>
                        <div className="text-3xl font-black text-white">{stats.receivablesThisMonth.toLocaleString()} ₺</div>
                        <div className="text-[10px] text-muted mt-1">{new Date().toLocaleString('tr-TR', { month: 'long' })} ayı toplamı</div>
                    </div>
                </div>

                <div className="card glass-plus p-5 flex flex-col justify-between border-l-4 border-success">
                    <div className="flex-between mb-2">
                        <span className="text-xs font-bold text-muted uppercase tracking-wider">Net Kasa Durumu</span>
                        <div className="p-2 bg-success/10 rounded-lg text-success text-xl">💰</div>
                    </div>
                    <div>
                        <div className="text-3xl font-black text-success">{stats.netKasa.toLocaleString()} ₺</div>
                        <div className="text-[10px] text-muted mt-1">Tüm kasa ve bankaların toplamı</div>
                    </div>
                </div>

                <div className="card glass-plus p-5 flex flex-col justify-between border-l-4 border-warning">
                    <div className="flex-between mb-2">
                        <span className="text-xs font-bold text-muted uppercase tracking-wider">Zaman Filtresi</span>
                        <div className="p-2 bg-warning/10 rounded-lg text-warning text-xl">🔍</div>
                    </div>
                    <div className="flex gap-1 mt-2">
                        {['all', 'today', 'this_month'].map(f => (
                            <button
                                key={f}
                                onClick={() => setTimeFilter(f as any)}
                                className={`flex-1 text-[10px] font-bold py-2 rounded-md transition-all ${timeFilter === f ? 'bg-primary text-white' : 'bg-white/5 text-muted hover:bg-white/10'}`}
                            >
                                {f === 'all' ? 'TÜMÜ' : f === 'today' ? 'BUGÜN' : 'BU AY'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
                {['Alacaklar', 'Borçlar', 'Çek & Senet', 'Banka & Kasa', 'Giderler', 'Finansal Hareketler'].map((label, i) => {
                    const keys = ['receivables', 'payables', 'checks', 'banks', 'expenses', 'transactions_list'];
                    const key = keys[i];
                    return (
                        <button
                            key={key}
                            onClick={() => setActiveTab(key)}
                            className={`btn ${activeTab === key ? 'btn-primary' : 'btn-outline'} whitespace-nowrap`}
                        >
                            {label}
                        </button>
                    );
                })}
            </div>

            <div className="card glass min-height-[500px]">
                {activeTab === 'receivables' && (
                    <div>
                        <div className="flex-between mb-4"><h3>Tahsil Edilecekler</h3><button onClick={() => openModal('receivable')} className="btn btn-primary">+ Tahsilat Ekle</button></div>
                        <table className="w-full text-left">
                            <thead className="text-muted text-xs border-b border-main"><tr><th className="p-3">Cari Bilgisi</th><th>Vade</th><th>Kalan Tutar</th><th>Durum</th><th></th></tr></thead>
                            <tbody>
                                {paginate(filterByTime([...filterByBranch(receivables), ...customerReceivables])).map(item => (
                                    <tr key={item.id} className="border-b border-subtle hover-bg transition-colors">
                                        <td className="p-4"><div>{item.title}</div><div className="text-xs text-muted">{item.date}</div></td>
                                        <td>{item.due}</td><td className="font-bold">{Math.abs(item.amount).toLocaleString()} ₺</td>
                                        <td><span className="text-xs bg-subtle px-2 py-1 rounded">{item.status}</span></td>
                                        <td className="text-right">
                                            <button onClick={() => handleCollect(item)} className="btn btn-outline text-xs mr-2 border-primary text-primary hover:bg-primary hover:text-white">Tahsil Et</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

                        {/* PLANLI ALACAKLAR & ÇEKLER */}
                        <div className="mt-8 pt-6 border-t border-subtle">
                            <div className="flex-between mb-4">
                                <h3 className="text-lg font-bold">📆 Planlı Alacaklar & Vadeli Satışlar</h3>
                                <button onClick={() => { setNewPlan({ ...newPlan, direction: 'IN', type: 'Taksitli Satış' }); setShowScheduledModal(true); }} className="btn btn-outline btn-sm text-xs">+ Plan Oluştur</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {/* Çekler (Alınan) */}
                                {checks.filter(c => c.type.includes('Alınan')).map(c => (
                                    <div key={c.id} className="card glass-plus p-4 text-sm relative group">
                                        <div className="absolute top-2 right-2 text-xs bg-subtle px-2 py-0.5 rounded">{c.status}</div>
                                        <div className="font-bold mb-1">Cari: {c.customer?.name || '-'}</div>
                                        <div className="text-xs text-muted">Vade: {new Date(c.dueDate).toLocaleDateString()}</div>
                                        <div className="mt-2 font-black text-lg text-success">+{Number(c.amount).toLocaleString()} ₺</div>
                                        <div className="text-[10px] text-muted">Belge: {c.type} / {c.bank}</div>
                                        {c.status === 'Beklemede' && <button onClick={() => { setActiveCheck(c); setTargetKasaId(kasalar[0]?.id.toString() || ''); setShowCheckCollectModal(true); }} className="btn btn-xs btn-primary mt-2 w-full">Tahsil Et</button>}
                                    </div>
                                ))}

                                {/* Planlı Alacaklar (IN) */}
                                {scheduledPayments.filter(p => p.direction === 'IN' || (!p.direction && p.type !== 'Kredi')).map(plan => {
                                    const paid = plan.installments.filter((i: any) => i.status === 'Paid').length;
                                    const progress = (paid / plan.installments.length) * 100;
                                    return (
                                        <div key={plan.id} className="card glass-plus p-4 text-sm relative cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setExpandedPlanId(expandedPlanId === plan.id ? null : plan.id)}>
                                            <div className="flex-between">
                                                <div className="font-bold">{plan.title}</div>
                                                <div className="text-xs bg-subtle px-2 rounded">{plan.type}</div>
                                            </div>
                                            <div className="text-xs text-muted mb-2">{plan.installmentCount} Taksit / {new Date(plan.startDate).toLocaleDateString()}</div>
                                            <div className="w-full bg-subtle h-1.5 rounded-full overflow-hidden mt-1"><div className="bg-success h-full" style={{ width: `${progress}%` }}></div></div>
                                            <div className="mt-2 flex-between items-end">
                                                <div className="font-black text-lg text-success">{Number(plan.totalAmount).toLocaleString()} ₺</div>
                                                <div className="text-[10px] text-muted">Detay ▼</div>
                                            </div>

                                            {/* Mini Installments Dropdown */}
                                            {expandedPlanId === plan.id && (
                                                <div className="absolute top-full left-0 right-0 z-10 bg-main border border-subtle shadow-xl rounded-b-xl p-2 mt-[-4px] animate-in fade-in zoom-in-95">
                                                    <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
                                                        {plan.installments.map((inst: any) => (
                                                            <div key={inst.id} className="flex-between p-2 border-b border-white/5 text-xs hover:bg-white/5">
                                                                ```
                                                                <div>{inst.installmentNo}. Taksit <span className="text-muted ml-1">{new Date(inst.dueDate).toLocaleDateString()}</span></div>
                                                                <div className="text-right">
                                                                    <div className="font-bold">{Number(inst.amount).toLocaleString()}</div>
                                                                    {inst.status !== 'Paid' ? (
                                                                        <div className="flex flex-col gap-1 items-end">
                                                                            {payingInstallmentId === inst.id ? (
                                                                                <div className="flex flex-col gap-1 items-end animate-in slide-in-from-right-2">
                                                                                    <div className="flex gap-1">
                                                                                        <select
                                                                                            value={installmentKasaId}
                                                                                            onChange={e => {
                                                                                                setInstallmentKasaId(e.target.value);
                                                                                                setInstallmentLabel(''); // Reset label on kasa change
                                                                                            }}
                                                                                            className="bg-subtle text-[10px] border border-white/10 rounded px-1 h-6 outline-none"
                                                                                            onClick={e => e.stopPropagation()}
                                                                                        >
                                                                                            <option value="">Seç...</option>
                                                                                            {kasalar.filter(k => k.name !== 'ÇEK / SENET PORTFÖYÜ').map(k => (
                                                                                                <option key={k.id} value={k.id.toString()}>{k.name}</option>
                                                                                            ))}
                                                                                        </select>
                                                                                        <button
                                                                                            style={{ display: 'none' }}
                                                                                            id={`hidden-submit-${inst.id}`}
                                                                                            onClick={(e) => { e.stopPropagation(); handlePayInstallment(inst, installmentKasaId, installmentLabel); setPayingInstallmentId(null); }}
                                                                                        ></button>
                                                                                        <button
                                                                                            disabled={!installmentKasaId || isProcessing}
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                document.getElementById(`hidden-submit-${inst.id}`)?.click();
                                                                                            }}
                                                                                            className="bg-primary text-white text-[10px] px-2 rounded h-6 font-bold"
                                                                                        >Onayla</button>
                                                                                        <button
                                                                                            onClick={(e) => { e.stopPropagation(); setPayingInstallmentId(null); }}
                                                                                            className="bg-subtle text-white text-[10px] px-2 rounded h-6"
                                                                                        >X</button>
                                                                                    </div>
                                                                                    {/* Show installment options if selected kasa is POS/Card */}
                                                                                    {installmentKasaId && kasalar.find(k => k.id.toString() === installmentKasaId)?.type.match(/POS|Kredi|Banka/) && (
                                                                                        <select
                                                                                            value={installmentLabel}
                                                                                            onChange={e => setInstallmentLabel(e.target.value)}
                                                                                            className="bg-subtle text-[9px] border border-white/10 rounded px-1 h-5 w-full outline-none mt-0.5"
                                                                                            onClick={e => e.stopPropagation()}
                                                                                        >
                                                                                            <option value="">Tek Çekim</option>
                                                                                            {(salesExpenses?.posCommissions || []).map((comm: any, idx: number) => (
                                                                                                <option key={idx} value={comm.installment}>{comm.installment}</option>
                                                                                            ))}
                                                                                        </select>
                                                                                    )}
                                                                                </div>
                                                                            ) : (
                                                                                <button onClick={(e) => { e.stopPropagation(); setPayingInstallmentId(inst.id); setInstallmentKasaId(kasalar.find(k => k.type === 'Nakit')?.id.toString() || ''); }} className="text-primary hover:underline">Tahsil Et</button>
                                                                            )}
                                                                        </div>
                                                                    ) : <span className="text-success">Ödendi</span>}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                            {(checks.filter(c => c.type.includes('Alınan')).length === 0 && scheduledPayments.filter(p => p.direction === 'IN').length === 0) && <div className="text-center text-muted text-xs p-4">Planlı alacak bulunmuyor.</div>}
                        </div>
                    </div>
                )}

                {activeTab === 'payables' && (
                    <div>
                        <div className="flex-between mb-4"><h3>Ödemeler</h3><button onClick={() => openModal('payable')} className="btn btn-primary">+ Ödeme Ekle</button></div>
                        <table className="w-full text-left">
                            <thead className="text-muted text-xs border-b border-main"><tr><th className="p-3">Cari Bilgisi</th><th>Vade</th><th>Borç Tutarı</th><th>Durum</th><th></th></tr></thead>
                            <tbody>
                                {paginate(filterByTime([...filterByBranch(payables), ...supplierPayables])).map(item => (
                                    <tr key={item.id} className="border-b border-subtle hover-bg transition-colors">
                                        <td className="p-4"><div>{item.title}</div><div className="text-xs text-muted">{item.date}</div></td>
                                        <td>{item.due}</td><td className="font-bold text-danger">{item.amount.toLocaleString()} ₺</td>
                                        <td><span className="text-xs bg-subtle px-2 py-1 rounded">{item.status}</span></td>
                                        <td className="text-right">
                                            <button onClick={() => handlePay(item)} className="btn btn-outline text-xs mr-2 border-primary text-primary hover:bg-primary hover:text-white">Öde</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

                        {/* PLANLI BORÇLAR (Krediler) & VERİLEN ÇEKLER */}
                        <div className="mt-8 pt-6 border-t border-subtle">
                            <div className="flex-between mb-4">
                                <h3 className="text-lg font-bold">📤 Planlı Borçlar & Krediler</h3>
                                <button onClick={() => { setNewPlan({ ...newPlan, direction: 'OUT', type: 'Kredi' }); setShowScheduledModal(true); }} className="btn btn-outline btn-sm text-xs">+ Plan Oluştur</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {/* Çekler (Verilen) */}
                                {checks.filter(c => c.type.includes('Verilen')).map(c => (
                                    <div key={c.id} className="card glass-plus p-4 text-sm relative group">
                                        <div className="absolute top-2 right-2 text-xs bg-subtle px-2 py-0.5 rounded">{c.status}</div>
                                        <div className="font-bold mb-1">Cari: {c.supplier?.name || '-'}</div>
                                        <div className="text-xs text-muted">Vade: {new Date(c.dueDate).toLocaleDateString()}</div>
                                        <div className="mt-2 font-black text-lg text-danger">-{Number(c.amount).toLocaleString()} ₺</div>
                                        <div className="text-[10px] text-muted">Belge: {c.type} / {c.bank}</div>
                                        {c.status === 'Beklemede' && <button onClick={() => { setActiveCheck(c); setTargetKasaId(kasalar[0]?.id.toString() || ''); setShowCheckCollectModal(true); }} className="btn btn-xs btn-primary mt-2 w-full">Ödemeyi Onayla</button>}
                                    </div>
                                ))}

                                {/* Planlı Borçlar (OUT) */}
                                {scheduledPayments.filter(p => !p.direction || p.direction === 'OUT').map(plan => {
                                    const paid = plan.installments.filter((i: any) => i.status === 'Paid').length;
                                    const progress = (paid / plan.installments.length) * 100;
                                    return (
                                        <div key={plan.id} className="card glass-plus p-4 text-sm relative cursor-pointer hover:border-danger/50 transition-colors" onClick={() => setExpandedPlanId(expandedPlanId === plan.id ? null : plan.id)}>
                                            <div className="flex-between">
                                                <div className="font-bold">{plan.title}</div>
                                                <div className="text-xs bg-subtle px-2 rounded">{plan.type}</div>
                                            </div>
                                            <div className="text-xs text-muted mb-2">{plan.installmentCount} Taksit / {new Date(plan.startDate).toLocaleDateString()}</div>
                                            <div className="w-full bg-subtle h-1.5 rounded-full overflow-hidden mt-1"><div className="bg-danger h-full" style={{ width: `${progress}%` }}></div></div>
                                            <div className="mt-2 flex-between items-end">
                                                <div className="font-black text-lg text-danger">{Number(plan.totalAmount).toLocaleString()} ₺</div>
                                                <div className="text-[10px] text-muted">Detay ▼</div>
                                            </div>

                                            {/* Mini Installments Dropdown */}
                                            {expandedPlanId === plan.id && (
                                                <div className="absolute top-full left-0 right-0 z-10 bg-main border border-subtle shadow-xl rounded-b-xl p-2 mt-[-4px] animate-in fade-in zoom-in-95">
                                                    <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
                                                        {plan.installments.map((inst: any) => (
                                                            <div key={inst.id} className="flex-between p-2 border-b border-white/5 text-xs hover:bg-white/5">
                                                                <div>{inst.installmentNo}. Taksit <span className="text-muted ml-1">{new Date(inst.dueDate).toLocaleDateString()}</span></div>
                                                                <div className="text-right">
                                                                    <div className="font-bold">{Number(inst.amount).toLocaleString()}</div>
                                                                    {inst.status !== 'Paid' ? (
                                                                        <div className="flex flex-col gap-1 items-end">
                                                                            {payingInstallmentId === inst.id ? (
                                                                                <div className="flex gap-1 animate-in slide-in-from-right-2">
                                                                                    <select
                                                                                        value={installmentKasaId}
                                                                                        onChange={e => setInstallmentKasaId(e.target.value)}
                                                                                        className="bg-subtle text-[10px] border border-white/10 rounded px-1 h-6 outline-none"
                                                                                        onClick={e => e.stopPropagation()}
                                                                                    >
                                                                                        <option value="">Seç...</option>
                                                                                        {kasalar.filter(k => k.name !== 'ÇEK / SENET PORTFÖYÜ').map(k => (
                                                                                            <option key={k.id} value={k.id}>{k.name}</option>
                                                                                        ))}
                                                                                    </select>
                                                                                    <button
                                                                                        disabled={!installmentKasaId || isProcessing}
                                                                                        onClick={(e) => { e.stopPropagation(); handlePayInstallment(inst, installmentKasaId); setPayingInstallmentId(null); }}
                                                                                        className="bg-danger text-white text-[10px] px-2 rounded h-6 font-bold"
                                                                                    >Onayla</button>
                                                                                    <button
                                                                                        onClick={(e) => { e.stopPropagation(); setPayingInstallmentId(null); }}
                                                                                        className="bg-subtle text-white text-[10px] px-2 rounded h-6"
                                                                                    >X</button>
                                                                                </div>
                                                                            ) : (
                                                                                <button onClick={(e) => { e.stopPropagation(); setPayingInstallmentId(inst.id); setInstallmentKasaId(kasalar.find(k => k.type === 'Nakit')?.id.toString() || ''); }} className="text-danger hover:underline">Öde</button>
                                                                            )}
                                                                        </div>
                                                                    ) : <span className="text-success">Ödendi</span>}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                            {(checks.filter(c => c.type.includes('Verilen')).length === 0 && scheduledPayments.filter(p => !p.direction || p.direction === 'OUT').length === 0) && <div className="text-center text-muted text-xs p-4">Planlı borç bulunmuyor.</div>}
                        </div>
                    </div>
                )}

                {activeTab === 'checks' && (
                    <div>
                        <div className="flex-between mb-4"><h3>Çek & Senet Portföyü</h3><button onClick={() => setShowCheckModal(true)} className="btn btn-primary">+ Ekle</button></div>
                        <table className="w-full text-left">
                            <thead className="text-muted text-xs border-b border-main"><tr><th className="p-3">Tür</th><th>Muhatap</th><th>Vade</th><th>Banka</th><th>Branch</th><th>Tutar</th><th>Durum</th><th></th></tr></thead>
                            <tbody>
                                {checks.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-muted">Kayıtlı evrak bulunmuyor.</td></tr>}
                                {paginate(filterByTime(checks)).map(c => (
                                    <tr key={c.id} className="border-b border-subtle hover-bg transition-colors">
                                        <td className="p-4"><b>{c.type}</b></td>
                                        <td>{c.customer?.name || c.supplier?.name || '-'}</td>
                                        <td>{new Date(c.dueDate).toLocaleDateString('tr-TR')}</td>
                                        <td className="text-muted">{c.bank}</td>
                                        <td className="text-xs text-muted">{c.branch || 'Merkez'}</td>
                                        <td className="font-bold">{Number(c.amount).toLocaleString()} ₺</td>
                                        <td><span className="text-xs bg-subtle px-2 py-1 rounded">{c.status}</span></td>
                                        <td className="text-right">
                                            {c.status === 'Beklemede' && (
                                                <button
                                                    onClick={() => {
                                                        setActiveCheck(c);
                                                        setTargetKasaId(kasalar[0]?.id.toString() || '');
                                                        setShowCheckCollectModal(true);
                                                    }}
                                                    className="btn btn-outline text-xs mr-2 border-primary text-primary hover:bg-primary hover:text-white"
                                                >
                                                    {c.type.includes('Alınan') ? 'Tahsil Et' : 'Öde'}
                                                </button>
                                            )}
                                            {canDelete && <button disabled={isProcessing} onClick={() => {
                                                if (isProcessing) return;
                                                showConfirm(
                                                    'Emin misiniz?',
                                                    'Bu evrak kaydını silmek istediğinize emin misiniz?',
                                                    async () => {
                                                        setIsProcessing(true);
                                                        try {
                                                            const res = await fetch(`/api/checks/${c.id}`, { method: 'DELETE' });
                                                            const data = await res.json();
                                                            if (data.success) {
                                                                showSuccess("Silindi", "Evrak başarıyla silindi.");
                                                                window.location.reload();
                                                            } else {
                                                                showError("Hata", data.error || "Silinemedi.");
                                                            }
                                                        } catch (err) {
                                                            console.error(err);
                                                            showError("Hata", "Silme işlemi sırasında bir hata oluştu.");
                                                        } finally {
                                                            setIsProcessing(false);
                                                        }
                                                    }
                                                );
                                            }} className="btn btn-outline text-xs text-danger border-danger hover:bg-danger hover:text-white">{isProcessing ? 'SİLİNİYOR...' : 'Sil'}</button>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                    </div>
                )}

                {activeTab === 'scheduled' && (
                    <div className="animate-in">
                        <div className="flex-between mb-4"><h3>Planlı Ödemeler & Krediler</h3><button onClick={() => setShowScheduledModal(true)} className="btn btn-primary">+ Yeni Plan Oluştur</button></div>
                        <div className="flex flex-col gap-4">
                            {scheduledPayments.map(plan => {
                                const paidInstallments = plan.installments.filter((i: any) => i.status === 'Paid').length;
                                const progress = (paidInstallments / plan.installments.length) * 100;

                                return (
                                    <div key={plan.id} className="card glass-plus p-4">
                                        <div className="flex-between items-center cursor-pointer select-none" onClick={() => setExpandedPlanId(expandedPlanId === plan.id ? null : plan.id)}>
                                            <div>
                                                <h4 className="font-bold text-lg">{plan.title}</h4>
                                                <div className="text-sm text-muted">{plan.branch || 'Merkez'} - {new Date(plan.startDate).toLocaleDateString()} Başlangıç</div>
                                                <div className="text-xs text-muted mt-1 bg-subtle w-fit px-2 rounded">{plan.type}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-black text-xl">{Number(plan.totalAmount).toLocaleString()} ₺</div>
                                                <div className="text-xs text-muted">{plan.installmentCount} Taksit</div>
                                                <div className="text-[10px] text-muted">{expandedPlanId === plan.id ? '🔼 Kapat' : '🔽 Detay'}</div>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="mt-3 w-full bg-subtle/30 h-2 rounded-full overflow-hidden">
                                            <div className="bg-primary/80 h-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                                        </div>
                                        <div className="text-xs text-muted text-right mt-1">
                                            %{Math.round(progress)} Ödendi ({paidInstallments}/{plan.installments.length})
                                            {plan.status === 'Completed' && <span className="ml-2 text-success font-bold">TAMAMLANDI</span>}
                                        </div>

                                        {/* Installments Accordion */}
                                        {expandedPlanId === plan.id && (
                                            <div className="mt-4 border-t border-subtle/20 pt-4 animate-in fade-in zoom-in-95 duration-200">
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-sm">
                                                        <thead><tr className="text-left text-muted text-xs border-b border-subtle/10"><th className="pb-2">No</th><th>Vade</th><th>Tutar</th><th>Durum</th><th></th></tr></thead>
                                                        <tbody>
                                                            {plan.installments.map((inst: any) => (
                                                                <tr key={inst.id} className="hover:bg-white/5 border-b border-white/5 transition-colors">
                                                                    <td className="p-2 py-3 font-bold text-accent">{inst.installmentNo}</td>
                                                                    <td>{new Date(inst.dueDate).toLocaleDateString()}</td>
                                                                    <td className="font-bold">{Number(inst.amount).toLocaleString()} ₺</td>
                                                                    <td>
                                                                        <span className={`px-2 py-0.5 rounded text-[10px] ${inst.status === 'Paid' ? 'bg-success/20 text-success' : 'bg-warning/10 text-warningBorder text-warning'}`}>
                                                                            {inst.status === 'Paid' ? 'Ödendi' : 'Bekliyor'}
                                                                        </span>
                                                                        {inst.paidAt && <div className="text-[8px] text-muted mt-0.5">{new Date(inst.paidAt).toLocaleDateString()}</div>}
                                                                    </td>
                                                                    <td className="text-right">
                                                                        {inst.status !== 'Paid' && (
                                                                            <div className="flex justify-end gap-1">
                                                                                {payingInstallmentId === inst.id ? (
                                                                                    <div className="flex flex-col gap-1 items-end animate-in slide-in-from-right-2">
                                                                                        <div className="flex gap-1">
                                                                                            <select
                                                                                                value={installmentKasaId}
                                                                                                onChange={e => {
                                                                                                    setInstallmentKasaId(e.target.value);
                                                                                                    setInstallmentLabel('');
                                                                                                }}
                                                                                                className="bg-subtle text-[10px] border border-white/10 rounded px-1 h-8 outline-none"
                                                                                                onClick={e => e.stopPropagation()}
                                                                                            >
                                                                                                <option value="">Seç...</option>
                                                                                                {kasalar.filter(k => k.name !== 'ÇEK / SENET PORTFÖYÜ').map(k => (
                                                                                                    <option key={k.id} value={k.id.toString()}>{k.name}</option>
                                                                                                ))}
                                                                                            </select>
                                                                                            <button
                                                                                                style={{ display: 'none' }}
                                                                                                id={`hidden-submit-plan-${inst.id}`}
                                                                                                onClick={(e) => { e.stopPropagation(); handlePayInstallment(inst, installmentKasaId, installmentLabel); setPayingInstallmentId(null); }}
                                                                                            ></button>
                                                                                            <button
                                                                                                disabled={!installmentKasaId || isProcessing}
                                                                                                onClick={(e) => {
                                                                                                    e.stopPropagation();
                                                                                                    document.getElementById(`hidden-submit-plan-${inst.id}`)?.click();
                                                                                                }}
                                                                                                className="btn btn-xs btn-primary h-8"
                                                                                            >Onayla</button>
                                                                                            <button
                                                                                                onClick={(e) => { e.stopPropagation(); setPayingInstallmentId(null); }}
                                                                                                className="btn btn-xs btn-outline h-8"
                                                                                            >X</button>
                                                                                        </div>
                                                                                        {/* Show installment options if selected kasa is POS/Card */}
                                                                                        {installmentKasaId && kasalar.find(k => k.id.toString() === installmentKasaId)?.type.match(/POS|Kredi|Banka/) && (
                                                                                            <select
                                                                                                value={installmentLabel}
                                                                                                onChange={e => setInstallmentLabel(e.target.value)}
                                                                                                className="bg-subtle text-[9px] border border-white/10 rounded px-1 h-6 w-full outline-none mt-0.5"
                                                                                                onClick={e => e.stopPropagation()}
                                                                                            >
                                                                                                <option value="">Tek Çekim</option>
                                                                                                {(salesExpenses?.posCommissions || []).map((comm: any, idx: number) => (
                                                                                                    <option key={idx} value={comm.installment}>{comm.installment}</option>
                                                                                                ))}
                                                                                            </select>
                                                                                        )}
                                                                                    </div>
                                                                                ) : (
                                                                                    <button
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            setPayingInstallmentId(inst.id);
                                                                                            setInstallmentKasaId(kasalar.find(k => k.type === 'Nakit')?.id.toString() || kasalar[0]?.id.toString() || '');
                                                                                        }}
                                                                                        className="btn btn-xs btn-outline border-primary/50 text-primary hover:bg-primary hover:text-white"
                                                                                    >
                                                                                        {plan.direction === 'IN' ? 'Tahsil Et' : 'Öde'}
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            {scheduledPayments.length === 0 && <div className="text-center p-12 text-muted border border-dashed border-subtle rounded-xl">Henüz planlı bir ödeme bulunmuyor.</div>}
                        </div>
                    </div>
                )}

                {activeTab === 'banks' && (
                    <div>
                        <div className="flex-between mb-4"><h3>Kasa & Banka Hesapları</h3><div className="flex gap-2">
                            <button onClick={() => setShowVirmanModal(true)} className="btn btn-outline text-xs">Virman</button>
                            {hasPermission('create_bank') && <button onClick={() => setShowAddBank(true)} className="btn btn-primary">+ Yeni Hesap</button>}
                        </div></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredKasalar.map(k => (
                                <div key={k.id} className="card glass-plus relative overflow-hidden group">
                                    <div className="flex-between mb-2">
                                        <span className="text-[10px] tracking-widest uppercase text-muted bg-subtle px-2 py-1 rounded">{k.type}</span>
                                        <div className="flex gap-2">
                                            {canDelete && <button onClick={() => handleEditKasa(k)} className="text-muted hover:text-primary transition-colors">✏️</button>}
                                            {canDelete && <button onClick={() => handleDeleteKasa(k.id.toString(), k.balance)} className="text-muted hover:text-danger transition-colors">🗑️</button>}
                                        </div>
                                    </div>
                                    <h4 className="text-xl font-bold mb-1">{k.name}</h4>
                                    <div className="text-3xl font-black text-secondary">₺ {Number(k.balance).toLocaleString()}</div>
                                    <div className="absolute -bottom-4 -right-4 text-6xl opacity-10 grayscale group-hover:scale-110 transition-transform">{k.type === 'Nakit' ? '💵' : '🏦'}</div>
                                </div>
                            ))}
                        </div>

                    </div>
                )}

                {activeTab === 'expenses' && (
                    <div>
                        <div className="flex-between mb-4"><h3>Gider Kayıtları</h3><button onClick={() => { setIsEditingExpense(false); setShowExpenseModal(true); }} className="btn btn-primary">+ Gider Ekle</button></div>
                        <table className="w-full text-left">
                            <thead className="text-muted text-xs border-b border-main"><tr><th className="p-3">Açıklama</th><th>Kategori</th><th>Tarih</th><th>Tutar</th><th>Ödeme</th><th></th></tr></thead>
                            <tbody>
                                {paginate(filterByTime(expenses)).map(e => (
                                    <tr key={e.id} className="border-b border-subtle hover-bg transition-colors">
                                        <td className="p-4"><b>{e.title}</b></td>
                                        <td><span className="text-xs bg-subtle px-2 py-1 rounded">{e.category}</span></td>
                                        <td className="text-muted">{e.date}</td>
                                        <td className="font-bold text-danger">{e.amount.toLocaleString()} ₺</td>
                                        <td className="text-xs text-muted">{e.method}</td>
                                        <td className="text-right">
                                            <button onClick={() => handleEditExpense(e)} className="btn btn-ghost text-xs">Düzenle</button>
                                            {canDelete && <button onClick={() => handleDeleteExpense(e.id)} className="btn btn-ghost text-xs text-danger">Sil</button>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                    </div>
                )}

                {activeTab === 'transactions_list' && (
                    <div className="animate-in">
                        <div className="flex-between mb-4">
                            <h3>Tüm Finansal Hareketler</h3>
                            <div className="flex gap-2">
                                <button onClick={() => { refreshTransactions(); refreshKasalar(); }} className="btn btn-outline text-xs">🔄 Yenile</button>
                            </div>
                        </div>
                        <div className="card glass-plus overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="text-muted text-xs border-b border-white/10">
                                    <tr>
                                        <th className="p-3">Tarih</th>
                                        <th>Tür</th>
                                        <th>Cari / Açıklama</th>
                                        <th>Kasa / Banka</th>
                                        <th>Şube</th>
                                        <th className="text-right">Tutar</th>
                                        <th className="text-right p-3">İşlem</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted">İşlem kaydı bulunmuyor.</td></tr>}
                                    {paginate(filterByTime([...transactions]).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())).map(t => {
                                        const cust = customers.find(c => c.id === t.customerId);
                                        const supp = suppliers.find(s => s.id === t.supplierId);
                                        const entityName = cust ? cust.name : (supp ? supp.name : 'Genel');
                                        const kasa = kasalar.find(k => k.id === t.kasaId);
                                        const isInflow = t.type === 'Sales' || t.type === 'Collection';

                                        return (
                                            <tr key={t.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                <td className="p-4 text-xs text-muted">{new Date(t.date).toLocaleString('tr-TR')}</td>
                                                <td>
                                                    <span style={{
                                                        fontSize: '10px',
                                                        padding: '2px 6px',
                                                        borderRadius: '4px',
                                                        background: isInflow ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                        color: isInflow ? '#10b981' : '#ef4444',
                                                        border: `1px solid ${isInflow ? '#10b981' : '#ef4444'}`
                                                    }}>
                                                        {t.type === 'Sales' ? 'SATIŞ' : t.type === 'Collection' ? 'TAHSİLAT' : t.type === 'Payment' ? 'ÖDEME' : (t.type === 'Transfer' ? 'VİRMAN' : 'GİDER')}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="font-bold text-sm">{entityName}</div>
                                                    <div className="text-[10px] text-muted truncate max-w-[200px]">{t.description}</div>
                                                </td>
                                                <td className="text-xs">{kasa ? kasa.name : '-'}</td>
                                                <td className="text-[10px] text-muted">{t.branch || 'Merkez'}</td>
                                                <td className={`text-right font-bold ${isInflow ? 'text-success' : 'text-danger'}`}>
                                                    {isInflow ? '+' : '-'} {t.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                                </td>
                                                <td className="text-right p-3">
                                                    <button onClick={() => {
                                                        showConfirm(
                                                            'İşlem Silinecek',
                                                            'Bu finansal hareketi silmek istediğinize emin misiniz? Cari bakiye ve kasa bakiyesi GERİ ALINACAKTIR.',
                                                            async () => {
                                                                setIsProcessing(true);
                                                                try {
                                                                    const res = await fetch(`/api/financials/transactions/${t.id}`, { method: 'DELETE' });
                                                                    const data = await res.json();
                                                                    if (data.success) {
                                                                        showSuccess("Başarılı", "İşlem ve finansal etkileri silindi.");
                                                                        window.location.reload();
                                                                    } else {
                                                                        showError("Hata", data.error || "Silinemedi.");
                                                                    }
                                                                } catch (err) {
                                                                    showError("Hata", "Bağlantı hatası.");
                                                                } finally {
                                                                    setIsProcessing(false);
                                                                }
                                                            }
                                                        );
                                                    }} className="btn btn-ghost text-xs text-danger">Sil</button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                        </div>
                    </div>
                )}
            </div>

            {/* MODALS */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="card glass animate-in modal-content">
                        <div className="flex-between mb-6"><h3>{modalType === 'receivable' ? '📥 Yeni Tahsilat' : '📤 Yeni Borç'} Kaydı</h3><button onClick={() => setShowModal(false)} className="close-btn">&times;</button></div>
                        <div className="flex flex-col gap-4">
                            <div className="form-group">
                                <label>Cari (Müşteri/Tedarikçi)</label>
                                <select value={newItem.entityId} onChange={e => setNewItem({ ...newItem, entityId: e.target.value })} className="input-field">
                                    <option value="">Seçiniz...</option>
                                    {(modalType === 'receivable' ? customers : suppliers).map(c => <option key={c.id} value={c.id.toString()}>{c.name} (Bakiye: {c.balance.toLocaleString()} ₺)</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label>Tutar</label>
                                    <input type="number" placeholder="0.00" value={newItem.amount} onChange={e => setNewItem({ ...newItem, amount: e.target.value })} className="input-field" />
                                </div>
                                <div className="form-group">
                                    <label>Vade / Not</label>
                                    <input type="text" placeholder="Gelecek Ay" value={newItem.due} onChange={e => setNewItem({ ...newItem, due: e.target.value })} className="input-field" />
                                </div>
                            </div>
                            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                                <div className="flex-between mb-4"><span>Finansal kayıt oluşturulsun mu?</span><input type="checkbox" checked={newItem.isCollected} onChange={e => setNewItem({ ...newItem, isCollected: e.target.checked })} /></div>
                                {newItem.isCollected && (
                                    <div className="flex flex-col gap-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="form-group"><label className="text-[10px] text-muted">Nakit</label><input type="number" value={newItem.cashAmount} onChange={e => setNewItem({ ...newItem, cashAmount: e.target.value })} className="input-field" /></div>
                                            <div className="form-group"><label className="text-[10px] text-muted">Kasa</label><select value={newItem.selectedCashboxId} onChange={e => setNewItem({ ...newItem, selectedCashboxId: e.target.value })} className="input-field">{kasalar.filter(k => k.type === 'Nakit').map(k => <option key={k.id} value={k.id}>{k.name}</option>)}</select></div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="form-group"><label className="text-[10px] text-muted">Banka</label><input type="number" value={newItem.cardAmount} onChange={e => setNewItem({ ...newItem, cardAmount: e.target.value })} className="input-field" /></div>
                                            <div className="form-group"><label className="text-[10px] text-muted">Banka Hesabı</label><select value={newItem.selectedCardBankId} onChange={e => setNewItem({ ...newItem, selectedCardBankId: e.target.value })} className="input-field">{kasalar.filter(k => k.type === 'Banka').map(k => <option key={k.id} value={k.id}>{k.name}</option>)}</select></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <button onClick={saveNewItem} disabled={isProcessing} className="btn btn-primary w-full p-4 font-bold mt-2">
                                {isProcessing ? 'İŞLENİYOR...' : 'KAYDET'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showCheckModal && (
                <div className="modal-overlay">
                    <div className="card glass animate-in modal-content">
                        <div className="flex-between mb-6"><h3>🏷️ Yeni Çek / Senet Girişi</h3><button onClick={() => setShowCheckModal(false)} className="close-btn">&times;</button></div>
                        <div className="flex flex-col gap-4">
                            <div className="form-group">
                                <label>Evrak Türü</label>
                                <select value={newCheck.type} onChange={e => setNewCheck({ ...newCheck, type: e.target.value })} className="input-field">
                                    <option>Alınan Çek</option><option>Verilen Çek</option><option>Alınan Senet</option><option>Verilen Senet</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Evrak Numarası</label>
                                <input type="text" placeholder="Poliçe/Bono No" value={newCheck.number} onChange={e => setNewCheck({ ...newCheck, number: e.target.value })} className="input-field" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label>Tutar</label>
                                    <input type="number" placeholder="0.00" value={newCheck.amount} onChange={e => setNewCheck({ ...newCheck, amount: e.target.value })} className="input-field" />
                                </div>
                                <div className="form-group">
                                    <label>Vade Tarihi</label>
                                    <input type="date" value={newCheck.dueDate} onChange={e => setNewCheck({ ...newCheck, dueDate: e.target.value })} className="input-field" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>İlgili Cari (Müşteri/Tedarikçi)</label>
                                <select value={newCheck.entityId} onChange={e => setNewCheck({ ...newCheck, entityId: e.target.value })} className="input-field">
                                    <option value="">Cari Seçin...</option>
                                    {(newCheck.type.includes('Alınan') ? customers : suppliers).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Açıklama</label>
                                <input type="text" placeholder="Giriş Notu" value={newCheck.description} onChange={e => setNewCheck({ ...newCheck, description: e.target.value })} className="input-field" />
                            </div>
                            <button onClick={saveNewCheck} disabled={isProcessing} className="btn btn-primary w-full p-4 font-bold mt-2">
                                {isProcessing ? 'İŞLENİYOR...' : 'EVRAKI KAYDET'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showExpenseModal && (
                <div className="modal-overlay">
                    <div className="card glass animate-in modal-content">
                        <div className="flex-between mb-6"><h3>{isEditingExpense ? '✏️ Gider Düzenle' : '💸 Yeni Gider Kaydı'}</h3><button onClick={() => setShowExpenseModal(false)} className="close-btn">&times;</button></div>
                        <div className="flex flex-col gap-4">
                            <div className="form-group">
                                <label>Gider Açıklaması</label>
                                <input type="text" placeholder="Örn: Elektrik Faturası vb." value={newExpense.title} onChange={e => setNewExpense({ ...newExpense, title: e.target.value })} className="input-field" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label>Kategori</label>
                                    <select value={newExpense.category} onChange={e => setNewExpense({ ...newExpense, category: e.target.value })} className="input-field">
                                        <option>Diğer</option><option>Kira</option><option>Maaş</option><option>Fatura</option><option>Malzeme</option><option>Yemek</option><option>Yakıt</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Ödeme Yapılacak Kasa</label>
                                    <select value={newExpense.kasaId} onChange={e => setNewExpense({ ...newExpense, kasaId: e.target.value })} className="input-field">
                                        <option value="">Seçiniz...</option>
                                        {filteredKasalar.map(k => (
                                            <option key={k.id} value={k.id}>{k.name} ({Number(k.balance).toLocaleString()} ₺)</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Tutar (₺)</label>
                                <input type="number" placeholder="0.00" value={newExpense.amount} onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })} className="input-field" style={{ border: '1px solid var(--danger)', color: 'var(--danger)' }} />
                            </div>
                            <button onClick={saveNewExpense} disabled={isProcessing} className="btn-danger w-full p-4 font-bold mt-2">
                                {isProcessing ? 'İŞLENİYOR...' : 'GİDERİ KAYDET'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showPayModal && (
                <div className="modal-overlay">
                    <div className="card glass animate-in modal-content border border-danger/30">
                        <div className="flex-between mb-6"><h3>💸 Ödeme Formu</h3><button onClick={() => setShowPayModal(false)} className="close-btn">&times;</button></div>
                        <div className="flex flex-col gap-4">
                            <div className="p-4 bg-danger/10 rounded-xl border border-danger/20 text-center">
                                <div className="text-[10px] text-muted tracking-widest uppercase mb-1">ÖDENECEK TUTAR</div>
                                <div className="text-xl font-bold mb-1">{activePayItem.title}</div>
                                <div className="text-3xl font-black text-danger">₺ {Math.abs(activePayItem.amount).toLocaleString()}</div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label>Nakit Ödeme</label>
                                    <input type="number" value={payDetails.cash} onChange={e => setPayDetails({ ...payDetails, cash: e.target.value })} className="input-field" />
                                </div>
                                <div className="form-group">
                                    <label>Kasa</label>
                                    <select value={payDetails.cashboxId} onChange={e => setPayDetails({ ...payDetails, cashboxId: e.target.value })} className="input-field">
                                        {kasalar.filter(k => k.type === 'Nakit').map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label>Banka Ödeme</label>
                                    <input type="number" value={payDetails.card} onChange={e => setPayDetails({ ...payDetails, card: e.target.value })} className="input-field" />
                                </div>
                                <div className="form-group">
                                    <label>Banka Hesabı</label>
                                    <select value={payDetails.bankId} onChange={e => setPayDetails({ ...payDetails, bankId: e.target.value })} className="input-field">
                                        {kasalar.filter(k => k.type === 'Banka').map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <button onClick={finalizePayment} disabled={isProcessing} className="btn-danger w-full p-4 font-bold mt-2">
                                {isProcessing ? 'HARCA / ÖDE' : 'KAYDET'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* KASA EDIT MODAL */}
            {showKasaEditModal && editingKasa && (
                <div className="modal-overlay">
                    <div className="card glass animate-in modal-content" style={{ width: '400px' }}>
                        <div className="flex-between mb-4"><h3>Hesap Düzenle</h3><button onClick={() => setShowKasaEditModal(false)} className="close-btn">&times;</button></div>
                        <div className="flex flex-col gap-4">
                            <div className="form-group">
                                <label>Hesap Tipi</label>
                                <select className="input-field" value={editingKasa.type} onChange={e => setEditingKasa({ ...editingKasa, type: e.target.value })}>
                                    {(kasaTypes && kasaTypes.length > 0 ? kasaTypes : ['Nakit', 'Banka', 'POS', 'Kredi Kartı']).map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Hesap Adı</label>
                                <input className="input-field" value={editingKasa.name} onChange={e => setEditingKasa({ ...editingKasa, name: e.target.value })} />
                            </div>
                            <button onClick={handleSaveKasaEdit} disabled={isProcessing} className="btn btn-primary w-full p-3 font-bold">Kaydet</button>
                        </div>
                    </div>
                </div>
            )}

            {/* CHECK COLLECT MODAL */}
            {showCheckCollectModal && activeCheck && (
                <div className="modal-overlay">
                    <div className="card glass animate-in modal-content" style={{ width: '400px' }}>
                        <div className="flex-between mb-4">
                            <h3>{activeCheck.type.includes('Alınan') ? '📥 Tahsilat Onayı' : '📤 Ödeme Onayı'}</h3>
                            <button onClick={() => setShowCheckCollectModal(false)} className="close-btn">&times;</button>
                        </div>
                        <div className="flex flex-col gap-4">
                            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                                <div className="text-xs text-muted tracking-widest uppercase mb-1">{activeCheck.type}</div>
                                <div className="text-xl font-bold">{Number(activeCheck.amount).toLocaleString()} ₺</div>
                                <div className="text-sm opacity-70 mt-1">{activeCheck.bank} - {activeCheck.number}</div>
                            </div>

                            <div className="form-group">
                                <label>{activeCheck.type.includes('Alınan') ? 'Tahsilatın Yapılacağı' : 'Ödemenin Yapılacağı'} Kasa / Banka</label>
                                <select
                                    className="input-field"
                                    value={targetKasaId}
                                    onChange={e => setTargetKasaId(e.target.value)}
                                >
                                    <option value="">Seçiniz...</option>
                                    {kasalar.filter(k => k.name !== 'ÇEK / SENET PORTFÖYÜ').map(k => (
                                        <option key={k.id} value={k.id}>{k.name} ({Number(k.balance).toLocaleString()} ₺)</option>
                                    ))}
                                </select>
                            </div>

                            <button
                                onClick={handleExecuteCheckCollect}
                                disabled={isProcessing || !targetKasaId}
                                className="btn btn-primary w-full p-4 font-bold"
                            >
                                {isProcessing ? 'İŞLENİYOR...' : 'İŞLEMİ TAMAMLA'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ADD BANK MODAL */}
            {showAddBank && (
                <div className="modal-overlay">
                    <div className="card glass animate-in modal-content" style={{ width: '400px' }}>
                        <div className="flex-between mb-4"><h3>Yeni Hesap Ekle</h3><button onClick={() => setShowAddBank(false)} className="close-btn">&times;</button></div>
                        <div className="flex-col gap-4">
                            <div className="form-group">
                                <label>Hesap Tipi</label>
                                <select className="input-field" value={newBank.type} onChange={e => setNewBank({ ...newBank, type: e.target.value })}>
                                    {(kasaTypes && kasaTypes.length > 0 ? kasaTypes : ['Nakit', 'Banka', 'POS', 'Kredi Kartı']).map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Hesap Adı</label>
                                <input className="input-field" placeholder={newBank.type === 'Nakit Kasa' ? 'Örn: Şube Kasası' : 'Örn: Ziraat Bankası'} value={newBank.name} onChange={e => setNewBank({ ...newBank, name: e.target.value })} />
                            </div>
                            <button onClick={addNewBank} disabled={isProcessing} className="btn btn-primary">Oluştur</button>
                        </div>
                    </div>
                </div>
            )}

            {/* VIRMAN MODAL */}
            {showVirmanModal && (
                <div className="modal-overlay">
                    <div className="card glass animate-in modal-content" style={{ width: '500px' }}>
                        <div className="flex-between mb-4"><h3>Virman (Hesaplar Arası Transfer)</h3><button onClick={() => setShowVirmanModal(false)} className="close-btn">&times;</button></div>
                        <div className="flex-col gap-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label>Hangi Hesaptan (Çıkış)</label>
                                    <select className="input-field" value={virmanData.fromKasaId} onChange={e => setVirmanData({ ...virmanData, fromKasaId: e.target.value })}>
                                        <option value="">Seçiniz...</option>
                                        {kasalar.map(k => <option key={k.id} value={k.id}>{k.name} ({k.balance} ₺)</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Hangi Hesaba (Giriş)</label>
                                    <select className="input-field" value={virmanData.toKasaId} onChange={e => setVirmanData({ ...virmanData, toKasaId: e.target.value })}>
                                        <option value="">Seçiniz...</option>
                                        {kasalar.filter(k => k.id.toString() !== virmanData.fromKasaId).map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Transfer Tutarı</label>
                                <input type="number" className="input-field font-bold text-lg" placeholder="0.00" value={virmanData.amount} onChange={e => setVirmanData({ ...virmanData, amount: e.target.value })} />
                            </div>
                            <button onClick={executeVirman} disabled={isProcessing} className="btn btn-primary h-12">Transferi Gerçekleştir</button>
                        </div>
                    </div>
                </div>
            )}

            {/* SCHEDULED PLAN MODAL */}
            {showScheduledModal && (
                <div className="modal-overlay">
                    <div className="card glass animate-in modal-content">
                        <div className="flex-between mb-6">
                            <h3>{newPlan.direction === 'IN' ? '📥 Yeni Vadeli Satış / Alacak Planı' : '📤 Yeni Kredi / Borç Planı'}</h3>
                            <button onClick={() => setShowScheduledModal(false)} className="close-btn">&times;</button>
                        </div>
                        <div className="flex flex-col gap-4">
                            <div className="form-group">
                                <label>Plan Adı / Açıklama</label>
                                <input type="text" placeholder="Örn: X Müşteri Taksitli Satış" value={newPlan.title} onChange={e => setNewPlan({ ...newPlan, title: e.target.value })} className="input-field" />
                            </div>

                            {newPlan.type !== 'Kredi' ? (
                                <div className="form-group">
                                    <label>İlgili Cari (Opsiyonel)</label>
                                    <select
                                        className="input-field"
                                        value={newPlan.direction === 'IN' ? newPlan.customerId : newPlan.supplierId}
                                        onChange={e => setNewPlan({
                                            ...newPlan,
                                            customerId: newPlan.direction === 'IN' ? e.target.value : '',
                                            supplierId: newPlan.direction === 'OUT' ? e.target.value : ''
                                        })}
                                    >
                                        <option value="">Cari Seçiniz...</option>
                                        {(newPlan.direction === 'IN' ? customers : suppliers).map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>

                                    {(newPlan.direction === 'IN' ? newPlan.customerId : newPlan.supplierId) && (
                                        <div className="mt-2 bg-subtle/50 p-3 rounded border border-white/5 text-xs">
                                            <div className="flex justify-between items-center mb-2 pb-2 border-b border-white/5">
                                                <span className="text-muted">Mevcut Bakiye:</span>
                                                <span className="font-bold">
                                                    {Number((newPlan.direction === 'IN' ? customers : suppliers).find(c => c.id === (newPlan.direction === 'IN' ? newPlan.customerId : newPlan.supplierId))?.balance || 0).toLocaleString()} ₺
                                                </span>
                                            </div>
                                            <label className="flex items-center gap-2 cursor-pointer select-none hover:text-white transition-colors">
                                                <input type="checkbox" checked={newPlan.isExisting} onChange={e => setNewPlan({ ...newPlan, isExisting: e.target.checked })} className="checkbox checkbox-xs checkbox-primary rounded-sm" />
                                                <span>Mevcut Bakiyeden Dönüştür (Yeni borç ekleme)</span>
                                            </label>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="p-3 bg-white/5 border border-white/10 rounded-lg text-xs text-muted mb-4">
                                    ℹ️ <b>Banka Kredisi</b> için cari seçimi zorunlu değildir. Banka adını üstteki "Plan Adı" alanına yazabilirsiniz.
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label>Toplam Tutar</label>
                                    <input type="number" value={newPlan.totalAmount} onChange={e => setNewPlan({ ...newPlan, totalAmount: e.target.value })} className="input-field" />
                                </div>
                                <div className="form-group">
                                    <label>Taksit Sayısı</label>
                                    <input type="number" value={newPlan.installmentCount} onChange={e => setNewPlan({ ...newPlan, installmentCount: e.target.value })} className="input-field" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label>Başlangıç Tarihi</label>
                                    <input type="date" value={newPlan.startDate} onChange={e => setNewPlan({ ...newPlan, startDate: e.target.value })} className="input-field" />
                                </div>
                                <div className="form-group">
                                    <label>Plan Türü</label>
                                    <select value={newPlan.type} onChange={e => setNewPlan({ ...newPlan, type: e.target.value })} className="input-field">
                                        <option value="Kredi">Kredi</option>
                                        <option value="Taksitli Satış">Taksitli Satış</option>
                                        <option value="Senet">Senet</option>
                                        <option value="Diğer">Diğer</option>
                                    </select>
                                </div>
                            </div>

                            <button onClick={saveNewPlan} disabled={isProcessing} className="btn btn-primary w-full p-4 font-bold mt-2">
                                {isProcessing ? 'İŞLENİYOR...' : 'PLANI OLUŞTUR'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
