"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/contexts/AppContext';
import { useModal } from '@/contexts/ModalContext';
import Pagination from '@/components/Pagination';


export default function AccountingPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('receivables'); // receivables, payables, banks, expenses, checks
    const { kasalar, setKasalar, addTransaction, currentUser, hasPermission, customers, suppliers, addFinancialTransaction, checks, addCheck, collectCheck, transactions, refreshCustomers, kasaTypes, activeBranchName } = useApp();
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
            amount: t.amount,
            method: kasalar.find(k => k.id.toString() === t.kasaId.toString())?.name || 'Bilinmiyor'
        }));
    }, [transactions, kasalar]);

    // PAGINATION
    const itemsPerPage = 10;
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab]);

    const activeListLength = useMemo(() => {
        if (activeTab === 'receivables') return [...filterByBranch(receivables), ...customerReceivables].length;
        if (activeTab === 'payables') return [...filterByBranch(payables), ...supplierPayables].length;
        if (activeTab === 'checks') return checks.length;
        if (activeTab === 'expenses') return expenses.length;
        if (activeTab === 'transactions_list') return transactions.length;
        return 0;
    }, [activeTab, receivables, customerReceivables, payables, supplierPayables, checks, expenses, transactions]);

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

    const [editingKasa, setEditingKasa] = useState<any>(null);
    const [showKasaEditModal, setShowKasaEditModal] = useState(false);

    const [showCheckCollectModal, setShowCheckCollectModal] = useState(false);
    const [activeCheck, setActiveCheck] = useState<any>(null);
    const [targetKasaId, setTargetKasaId] = useState('');

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
                    <button onClick={() => { refreshCustomers(); window.location.reload(); }} className="btn btn-outline text-xs">🔄 Yenile</button>
                    <div className="card glass-plus flex-col items-end">
                        <span className="text-[10px] text-muted tracking-widest uppercase">Net Kasa</span>
                        <span className="text-3xl font-black text-success">
                            {kasalar.reduce((a, b) => a + Number(b.balance), 0).toLocaleString()} ₺
                        </span>
                    </div>
                </div>
            </header>

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
                                {paginate([...filterByBranch(receivables), ...customerReceivables]).map(item => (
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
                    </div>
                )}

                {activeTab === 'payables' && (
                    <div>
                        <div className="flex-between mb-4"><h3>Ödemeler</h3><button onClick={() => openModal('payable')} className="btn btn-primary">+ Ödeme Ekle</button></div>
                        <table className="w-full text-left">
                            <thead className="text-muted text-xs border-b border-main"><tr><th className="p-3">Cari Bilgisi</th><th>Vade</th><th>Borç Tutarı</th><th>Durum</th><th></th></tr></thead>
                            <tbody>
                                {paginate([...filterByBranch(payables), ...supplierPayables]).map(item => (
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
                    </div>
                )}

                {activeTab === 'checks' && (
                    <div>
                        <div className="flex-between mb-4"><h3>Çek & Senet Portföyü</h3><button onClick={() => setShowCheckModal(true)} className="btn btn-primary">+ Ekle</button></div>
                        <table className="w-full text-left">
                            <thead className="text-muted text-xs border-b border-main"><tr><th className="p-3">Tür</th><th>Muhatap</th><th>Vade</th><th>Banka</th><th>Branch</th><th>Tutar</th><th>Durum</th><th></th></tr></thead>
                            <tbody>
                                {checks.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-muted">Kayıtlı evrak bulunmuyor.</td></tr>}
                                {paginate(checks).map(c => (
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
                                {paginate(expenses).map(e => (
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
                                <button onClick={() => window.location.reload()} className="btn btn-outline text-xs">🔄 Yenile</button>
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
                                    {paginate([...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())).map(t => {
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
        </div>
    );
}
