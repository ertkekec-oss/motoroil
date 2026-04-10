"use client";

import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useCRM } from '@/contexts/CRMContext';
import { useModal } from '@/contexts/ModalContext';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import Pagination from '@/components/Pagination';
import { useSearchParams } from 'next/navigation';
import { TURKISH_CITIES, TURKISH_DISTRICTS } from '@/lib/constants';
import { useTheme } from '@/contexts/ThemeContext';
import { Search, Filter, Grid, List, Plus, Percent, Users, DollarSign, Wallet } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

export default function CustomersPage() {
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState('all');
    const [classFilter, setClassFilter] = useState('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const { currentUser, hasPermission, branches, activeBranchName } = useApp();
    const { customers, suppClasses, custClasses } = useCRM();
    const { showSuccess, showError, showWarning, showConfirm } = useModal();
    const canDelete = hasPermission('delete_records');

    const { theme } = useTheme();
    const isLight = theme === 'light';

    const [isProcessing, setIsProcessing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (activeBranchName) {
            setBranchFilter(activeBranchName);
            setNewCustomer(prev => ({ ...prev, branch: activeBranchName }));
            setCurrentPage(1);
        }
    }, [activeBranchName]);

    const initialBranch = currentUser?.branch || 'all';
    const [branchFilter, setBranchFilter] = useState(initialBranch);

    const [showFilters, setShowFilters] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    const handleSearchChange = (val: string) => { setSearchTerm(val); setCurrentPage(1); };
    const handleTabChange = (val: string) => { setActiveTab(val); setCurrentPage(1); };

    // Filter Logic
    const filteredCustomers = customers.filter(cust => {
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            const searchMatch =
                (cust.name || '').toLowerCase().includes(lowerTerm) ||
                (cust.phone || '').includes(searchTerm) ||
                (cust.email || '').toLowerCase().includes(lowerTerm) ||
                (cust.city || '').toLowerCase().includes(lowerTerm) ||
                ((cust as any).taxNumber || '').includes(searchTerm);
            if (!searchMatch) return false;
        }

        if (activeTab === 'borclular' && cust.balance <= 0) return false;
        if (activeTab === 'alacaklilar' && cust.balance >= 0) return false;
        
        // Filter by dynamic category class
        if (classFilter !== 'all') {
            if (cust.customerClass !== classFilter && cust.category !== classFilter) return false;
        }

        // Removed local branch filtering. The API handles it via Sidebar context.

        return true;
    });

    const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE);
    const paginatedCustomers = filteredCustomers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const tabs = [
        { id: 'all', label: 'Tümü' },
        { id: 'borclular', label: 'Borçlular' },
        { id: 'alacaklilar', label: 'Alacaklılar' }
    ];

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [newCustomer, setNewCustomer] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        city: 'İstanbul',
        district: '',
        taxNumber: '',
        taxOffice: '',
        contactPerson: '',
        iban: '',
        customerClass: '',
        referredByCode: '',
        branch: activeBranchName || currentUser?.branch || 'Merkez'
    });
    const [editCustomer, setEditCustomer] = useState<any>({
        id: '',
        name: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        district: '',
        taxNumber: '',
        taxOffice: '',
        contactPerson: '',
        iban: '',
        customerClass: '',
        referredByCode: '',
        branch: ''
    });

    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isBulkCategoryModal, setIsBulkCategoryModal] = useState(false);
    const [bulkCategory, setBulkCategory] = useState('');
    const handleAddCustomer = async () => {
        if (!newCustomer.name) {
            showWarning("Eksik Bilgi", "İsim zorunludur!");
            return;
        }

        if (isProcessing) return;

        setIsProcessing(true);
        try {
            const res = await fetch('/api/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newCustomer)
            });
            const data = await res.json();
            if (data.success) {
                showSuccess("Başarılı", "Müşteri başarıyla oluşturuldu.");
                setIsModalOpen(false);

                setNewCustomer({ name: '', phone: '', email: '', address: '', city: 'İstanbul', district: '', taxNumber: '', taxOffice: '', contactPerson: '', iban: '', customerClass: '', referredByCode: '', branch: activeBranchName || currentUser?.branch || 'Merkez' });
                window.location.reload();
            } else {
                showError("Hata", data.error || "Beklenmedik bir hata oluştu.");
            }

        } catch (error: any) {
            console.error(error);
            showError("Hata", "Müşteri eklenirken bir hata oluştu.");
        } finally {

            setIsProcessing(false);
        }
    };

    const handleEditCustomer = async () => {
        if (!editCustomer.name) {
            showWarning("Eksik Bilgi", "İsim zorunludur!");
            return;
        }

        if (isProcessing) return;

        setIsProcessing(true);
        try {
            const res = await fetch(`/api/customers/${editCustomer.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editCustomer)
            });
            const data = await res.json();
            if (data.success) {
                showSuccess("Başarılı", "Müşteri başarıyla güncellendi.");
                setIsEditModalOpen(false);
                setEditCustomer({ id: '', name: '', phone: '', email: '', address: '', city: '', district: '', taxNumber: '', taxOffice: '', contactPerson: '', iban: '', customerClass: '', referredByCode: '', branch: '' });
                window.location.reload();
            } else {
                showError("Hata", data.error || "Beklenmedik bir hata oluştu.");
            }

        } catch (error: any) {
            console.error(error);
            showError("Hata", "Müşteri güncellenirken bir hata oluştu.");
        } finally {
            setIsProcessing(false);
        }
    };

    useEffect(() => {
        const editId = searchParams.get('edit');
        if (editId && customers.length > 0) {
            const customerToEdit = customers.find(c => c.id === editId);
            if (customerToEdit) {
                setEditCustomer({
                    id: customerToEdit.id,
                    name: customerToEdit.name || '',
                    phone: customerToEdit.phone || '',
                    email: customerToEdit.email || '',
                    address: customerToEdit.address || '',
                    city: (customerToEdit as any).city || '',
                    district: (customerToEdit as any).district || '',
                    taxNumber: (customerToEdit as any).taxNumber || '',
                    taxOffice: (customerToEdit as any).taxOffice || '',
                    contactPerson: (customerToEdit as any).contactPerson || '',
                    iban: (customerToEdit as any).iban || '',
                    customerClass: (customerToEdit as any).customerClass || '',
                    referredByCode: (customerToEdit as any).referredByCode || '',
                    branch: (customerToEdit as any).branch || ''
                });
                setIsEditModalOpen(true);
                window.history.replaceState({}, '', '/customers');
            }
        }
    }, [searchParams, customers]);

    const handleDeleteCustomer = (id: string | number) => {
        if (!canDelete) return;
        if (isProcessing) return;

        showConfirm(
            'Emin misiniz?',
            'Bu müşteriyi (cari) silmek istediğinize emin misiniz? Bu işlem geri alınamaz.',
            async () => {
                setIsProcessing(true);
                try {
                    const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
                    const data = await res.json();
                    if (data.success) {
                        showSuccess("Başarılı", "Müşteri kaydı silindi.");
                        window.location.reload();
                    } else {
                        showError("İşlem Başarısız", data.error || "Silme işlemi sırasında bir hata oluştu.");
                    }
                } catch (error: any) {
                    showError("Hata", "Müşteri silinirken bir hata oluştu.");
                } finally {
                    setIsProcessing(false);
                }
            }
        );
    };

    const totalReceivable = filteredCustomers.reduce((sum, c) => {
        const netBalance = Number(c.balance);
        return sum + (netBalance > 0 ? netBalance : 0);
    }, 0);
    const totalPayable = filteredCustomers.filter(c => Number(c.balance) < 0).reduce((sum, c) => sum + Math.abs(Number(c.balance)), 0);

    const cardClass = isLight
        ? "bg-white border border-slate-200 shadow-sm"
        : "bg-slate-900 border border-slate-800";

    const textLabelClass = isLight ? "text-slate-500" : "text-slate-400";
    const textValueClass = isLight ? "text-slate-900" : "text-white";

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(paginatedCustomers.map(c => c.id as string));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
        if (e.target.checked) {
            setSelectedIds(prev => [...prev, id]);
        } else {
            setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
        }
    };

    const handleBulkDelete = async () => {
        if (!canDelete || selectedIds.length === 0) return;
        
        showConfirm(
            'Toplu Silme',
            `Seçili ${selectedIds.length} müşteriyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
            async () => {
                try {
                    const res = await fetch('/api/customers/bulk', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'delete', customerIds: selectedIds })
                    });
                    const data = await res.json();
                    if (data.success) {
                        showSuccess("Başarılı", data.message);
                        setSelectedIds([]);
                        window.location.reload();
                    } else {
                        showError("Hata", data.error);
                    }
                } catch {
                    showError("Hata", "Toplu silme sırasında sistem hatası.");
                }
            }
        );
    };

    const handleBulkCategoryUpdate = async () => {
        if (!bulkCategory || selectedIds.length === 0) return;

        try {
            const res = await fetch('/api/customers/bulk', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'update_category', customerIds: selectedIds, data: { categoryClass: bulkCategory } })
            });
            const data = await res.json();
            if (data.success) {
                showSuccess("Başarılı", data.message);
                setIsBulkCategoryModal(false);
                setSelectedIds([]);
                window.location.reload();
            } else {
                showError("Hata", data.error);
            }
        } catch {
            showError("Hata", "Toplu kategori atama sırasında sistem hatası.");
        }
    };

    return (
        <div data-pos-theme={theme} className="w-full min-h-[100vh] px-8 py-8 space-y-6 transition-colors duration-300 font-sans" style={{ background: isLight ? '#FAFAFA' : undefined }}>
            {/* Staff-Style Top Tabs */}
            <div className="mb-6 flex w-full lg:w-max whitespace-nowrap overflow-x-auto items-center gap-6 px-1 custom-scroll select-none pb-1">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-slate-100/50 dark:bg-slate-800/30 p-1 rounded-lg border border-slate-200/50 dark:border-white/5">
                        {tabs.map(tab => {
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabChange(tab.id)}
                                    className={isActive
                                        ? "px-6 py-2.5 text-[12px] font-bold text-slate-900 dark:text-white bg-white dark:bg-[#0f172a] shadow-sm border border-slate-200/50 dark:border-white/10 rounded-[6px] transition-all"
                                        : "px-6 py-2.5 text-[12px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-all rounded-[6px]"
                                    }
                                >
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* KPI Banner */}
            <div className={`flex rounded-[24px] border overflow-hidden ${cardClass}`}>
                <div className={`flex-1 p-5 border-r ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                    <div className="flex items-center gap-2 mb-2">
                        <Users className={`w-4 h-4 ${isLight ? 'text-blue-500' : 'text-blue-400'}`} />
                        <span className={`text-[11px] font-semibold uppercase tracking-wide ${textLabelClass}`}>Toplam Müşteri</span>
                    </div>
                    <div className={`text-[28px] font-semibold tracking-tight ${textValueClass}`}>
                        {filteredCustomers.length}
                    </div>
                    <div className={`text-[12px] mt-1 font-medium ${textLabelClass}`}>Aktif Müşteri</div>
                </div>
                <div className={`flex-1 p-5 border-r ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                    <div className="flex items-center gap-2 mb-2">
                        <DollarSign className={`w-4 h-4 ${isLight ? 'text-blue-500' : 'text-blue-400'}`} />
                        <span className={`text-[11px] font-semibold uppercase tracking-wide ${textLabelClass}`}>Toplam Alacak</span>
                    </div>
                    <div className={`text-[28px] font-semibold tracking-tight ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>
                        {formatCurrency(totalReceivable)}
                    </div>
                    <div className={`text-[12px] mt-1 font-medium ${textLabelClass}`}>Borçlu müşterilerden</div>
                </div>
                <div className={`flex-1 p-5 border-r ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                    <div className="flex items-center gap-2 mb-2">
                        <Wallet className={`w-4 h-4 ${isLight ? 'text-emerald-500' : 'text-emerald-400'}`} />
                        <span className={`text-[11px] font-semibold uppercase tracking-wide ${textLabelClass}`}>Toplam Borç</span>
                    </div>
                    <div className={`text-[28px] font-semibold tracking-tight ${isLight ? 'text-emerald-600' : 'text-emerald-500'}`}>
                        {formatCurrency(totalPayable)}
                    </div>
                    <div className={`text-[12px] mt-1 font-medium ${textLabelClass}`}>Alacaklı müşterilere</div>
                </div>
                <div className="flex-1 p-5">
                    <div className="flex items-center gap-2 mb-2">
                        <Percent className={`w-4 h-4 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
                        <span className={`text-[11px] font-semibold uppercase tracking-wide ${textLabelClass}`}>Net Durum</span>
                    </div>
                    <div className={`text-[28px] font-semibold tracking-tight ${textValueClass}`}>
                        {formatCurrency(totalReceivable - totalPayable)}
                    </div>
                    <div className={`text-[12px] mt-1 font-medium ${textLabelClass}`}>Genel Bakiye</div>
                </div>
            </div>

            {/* Branch Filters (Eskiden Controls içinde select olan filte) */}
            {/* Branch Filters removed because they conflict with Global Context */}

            {/* List/Grid Container */}
            <div className={`mt-6 rounded-[24px] border border-slate-200 dark:border-white/5 flex flex-col overflow-hidden shadow-sm bg-white dark:bg-[#0f172a]`}>
                {/* ═══════════════ LİSTE BAŞLIĞI VE ARAMA ═══════════════ */}
                <div className="p-4 flex flex-wrap justify-between items-center gap-4 border-b border-slate-200 dark:border-white/5">
                    <div className="flex items-center gap-4">
                        <h3 className="text-[13px] font-black text-slate-800 dark:text-white uppercase tracking-widest hidden sm:block">Kayıt Listesi</h3>
                        <div className={`flex p-1 rounded-full border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/50 border-slate-800'}`}>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`w-7 h-7 flex items-center justify-center rounded-[6px] transition-colors ${viewMode === 'grid'
                                    ? (isLight ? 'bg-white shadow-sm text-blue-600' : 'bg-slate-800 text-blue-400')
                                    : (isLight ? 'text-slate-400 hover:text-slate-600' : 'text-slate-500 hover:text-slate-300')
                                    }`}
                            >
                                <Grid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`w-7 h-7 flex items-center justify-center rounded-[6px] transition-colors ${viewMode === 'list'
                                    ? (isLight ? 'bg-white shadow-sm text-blue-600' : 'bg-slate-800 text-blue-400')
                                    : (isLight ? 'text-slate-400 hover:text-slate-600' : 'text-slate-500 hover:text-slate-300')
                                    }`}
                            >
                                <List className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 flex-1 sm:flex-none justify-start sm:justify-end">
                        <select
                            value={classFilter}
                            onChange={(e) => setClassFilter(e.target.value)}
                            className="h-[36px] bg-white dark:bg-[#0f172a] border border-slate-200/50 dark:border-white/10 text-slate-700 dark:text-slate-200 rounded-[8px] text-[12px] font-bold px-3 outline-none focus:border-blue-500 transition-all cursor-pointer shadow-sm w-auto min-w-[120px]"
                        >
                            <option value="all">Sınıf Seç</option>
                            {custClasses.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        
                        <div className="relative w-full sm:w-[240px] shrink-0 min-w-[150px] flex-1 sm:flex-none">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                placeholder="Ara..."
                                className="w-full pl-9 pr-4 h-[36px] bg-white dark:bg-black/20 rounded-[8px] border border-slate-200 dark:border-white/10 text-[12px] font-bold outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 shadow-sm text-slate-800 dark:text-white"
                            />
                        </div>
                        
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="h-[36px] px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-[8px] font-bold text-[12px] flex items-center justify-center gap-1.5 transition-colors shadow-sm whitespace-nowrap"
                        >
                            <Plus className="w-4 h-4" />
                            YENİ
                        </button>
                    </div>
                </div>

                {/* Bulk Actions Banner (Sadece List View) */}
                {viewMode === 'list' && selectedIds.length > 0 && (
                    <div className={`flex items-center justify-between px-6 py-3 border-b ${isLight ? 'bg-blue-50/50 border-slate-200' : 'bg-blue-900/10 border-slate-800'}`}>
                        <div className="flex items-center gap-3">
                            <span className={`text-[13px] font-semibold ${isLight ? 'text-blue-700' : 'text-blue-400'}`}>
                                {selectedIds.length} müşteri seçildi
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsBulkCategoryModal(true)}
                                className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase transition-colors ${isLight ? 'bg-white border text-slate-700 hover:bg-slate-50' : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'}`}
                            >
                                Sınıf Ata
                            </button>
                            {canDelete && (
                                <button
                                    onClick={handleBulkDelete}
                                    className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase transition-colors border ${isLight ? 'bg-white border-red-200 text-red-600 hover:bg-red-50' : 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'}`}
                                >
                                    Toplu Sil
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* GÖRÜNÜM: LİSTE VEYA GRİD */}
                {viewMode === 'list' ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 dark:bg-[#1e293b] text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest sticky top-0 z-20">
                            <tr>
                                <th className="px-5 py-4 font-bold border-b border-slate-200 dark:border-white/5 whitespace-nowrap w-[48px] text-center">
                                    <input 
                                        type="checkbox" 
                                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        checked={selectedIds.length > 0 && selectedIds.length === paginatedCustomers.length}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                                <th className="px-5 py-4 font-bold border-b border-slate-200 dark:border-white/5 whitespace-nowrap">Müşteri</th>
                                <th className="px-5 py-4 font-bold border-b border-slate-200 dark:border-white/5 whitespace-nowrap">İletişim</th>
                                <th className="px-5 py-4 font-bold border-b border-slate-200 dark:border-white/5 whitespace-nowrap">Kategori</th>
                                <th className="px-5 py-4 font-bold border-b border-slate-200 dark:border-white/5 whitespace-nowrap">Bakiye</th>
                                <th className="px-5 py-4 font-bold border-b border-slate-200 dark:border-white/5 whitespace-nowrap text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {paginatedCustomers.map(cust => {
                                const rawBalance = Number(cust.balance);
                                const effectiveBalance = rawBalance;
                                const isSelected = selectedIds.includes(cust.id as string);

                                return (
                                    <tr key={cust.id} className={`h-[48px] transition-colors group ${isSelected ? "bg-slate-50 dark:bg-white/5" : "hover:bg-slate-50 dark:hover:bg-[#1e293b]/80"}`}>
                                        <td className="px-5 py-3 align-middle text-[12px] text-center font-semibold text-slate-600 dark:text-slate-400">
                                            <input 
                                                type="checkbox" 
                                                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                checked={isSelected}
                                                onChange={(e) => handleSelectOne(e, cust.id as string)}
                                            />
                                        </td>
                                        <td className="px-5 py-3 align-middle text-[12px] font-semibold text-slate-600 dark:text-slate-400">
                                            <div className={`font-semibold text-[14px] ${textValueClass}`}>{cust.name}</div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`text-[11px] font-medium ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`}>⭐ {Number(cust.points || 0).toFixed(0)}</span>
                                                {(cust as any).taxNumber && (
                                                    <span className={`text-[11px] ${textLabelClass}`}>VKN: {(cust as any).taxNumber}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 align-middle text-[12px] font-semibold text-slate-600 dark:text-slate-400">
                                            <div className={`text-[13px] font-medium ${textValueClass}`}>{cust.phone || '-'}</div>
                                            <div className={`text-[12px] truncate max-w-[150px] ${textLabelClass}`}>{cust.email || '-'}</div>
                                        </td>
                                        <td className="px-5 py-3 align-middle text-[12px] font-semibold text-slate-600 dark:text-slate-400">
                                            <span className={`px-2 py-1 text-[11px] font-medium border rounded-[6px] inline-block ${isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-800 border-slate-700 text-slate-300'
                                                }`}>
                                                {cust.customerClass || cust.category || 'Genel'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 align-middle text-[12px] font-semibold text-slate-600 dark:text-slate-400">
                                            <div className={`font-semibold text-[14px] ${effectiveBalance > 0 ? (isLight ? 'text-blue-600' : 'text-blue-400')
                                                : effectiveBalance < 0 ? (isLight ? 'text-emerald-600' : 'text-emerald-500')
                                                    : textLabelClass
                                                }`}>
                                                {formatCurrency(Math.abs(effectiveBalance))}
                                            </div>
                                            <div className={`text-[11px] font-semibold tracking-wide uppercase mt-0.5 ${effectiveBalance > 0 ? (isLight ? 'text-blue-600/70' : 'text-blue-400/80')
                                                : effectiveBalance < 0 ? (isLight ? 'text-emerald-600/70' : 'text-emerald-500/80')
                                                    : textLabelClass
                                                }`}>
                                                {effectiveBalance > 0 ? 'Borçlu' : effectiveBalance < 0 ? 'Alacaklı' : 'Dengeli'}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 align-middle text-[12px] font-semibold text-slate-600 dark:text-slate-400 text-right">
                                            <Link href={`/customers/${cust.id}`} className="px-4 py-1.5 h-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 rounded-[6px] font-bold text-[11px] flex items-center justify-center transition-all whitespace-nowrap shadow-sm">Detay</Link>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                    </div>
                ) : (
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 bg-slate-50/50 dark:bg-[#0f172a]/20">
                        {paginatedCustomers.map(cust => {
                            const rawBalance = Number(cust.balance);
                            const effectiveBalance = rawBalance;

                            return (
                                <div key={cust.id} className={`rounded-[24px] border overflow-hidden flex flex-col ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'}`}>
                                    <div className="p-5 flex-1">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-[16px] font-bold text-white shadow-sm bg-blue-600">
                                                {cust.name?.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="text-right">
                                                <div className={`text-[16px] font-bold ${effectiveBalance > 0 ? (isLight ? 'text-blue-600' : 'text-blue-400')
                                                    : effectiveBalance < 0 ? (isLight ? 'text-emerald-600' : 'text-emerald-500')
                                                        : textLabelClass
                                                    }`}>
                                                    {formatCurrency(Math.abs(effectiveBalance))}
                                                </div>
                                                <div className={`text-[10px] font-bold uppercase tracking-wide mt-0.5 ${effectiveBalance > 0 ? (isLight ? 'text-blue-600/70' : 'text-blue-400/80')
                                                    : effectiveBalance < 0 ? (isLight ? 'text-emerald-600/70' : 'text-emerald-500/80')
                                                        : textLabelClass
                                                    }`}>
                                                    {effectiveBalance > 0 ? '● Borçlu' : effectiveBalance < 0 ? '● Alacaklı' : '● Dengeli'}
                                                </div>
                                            </div>
                                        </div>
                                        <h3 className={`font-semibold text-[15px] leading-tight mb-2 truncate ${textValueClass}`}>{cust.name}</h3>

                                        <div className="flex gap-2 flex-wrap mb-4">
                                            <span className={`px-2 py-1 text-[10px] font-semibold border rounded-[6px] ${isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                }`}>
                                                ⭐ Puan: {Number(cust.points || 0).toFixed(0)}
                                            </span>
                                            <span className={`px-2 py-1 text-[10px] font-semibold border rounded-[6px] ${isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-800 border-slate-700 text-slate-300'
                                                }`}>
                                                {cust.customerClass || cust.category || 'Genel'}
                                            </span>
                                        </div>

                                        <div className="space-y-1.5 mt-auto">
                                            <div className={`text-[12px] font-medium flex gap-2 items-center ${textLabelClass}`}>
                                                <span>📞</span> <span className={textValueClass}>{cust.phone || '-'}</span>
                                            </div>
                                            <div className={`text-[12px] font-medium flex gap-2 items-center truncate ${textLabelClass}`}>
                                                <span>📧</span> <span className={textValueClass}>{cust.email || '-'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={`p-4 flex gap-2 border-t flex-shrink-0 ${isLight ? 'bg-slate-50/50 border-slate-200' : 'bg-slate-900/50 border-slate-800'}`}>
                                        <Link href={`/customers/${cust.id}`} className="w-full h-[36px] flex items-center justify-center rounded-full text-[10px] uppercase tracking-widest font-black transition-colors bg-blue-600 text-white hover:bg-blue-700 shadow-sm">
                                            DETAY
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {filteredCustomers.length === 0 && (
                <div className={`py-16 text-center rounded-[24px] border border-dashed ${isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'}`}>
                    <div className={`text-[32px] mb-4 opacity-50`}>🔍</div>
                    <h3 className={`text-[16px] font-semibold mb-1 ${textValueClass}`}>Kayıt Bulunamadı</h3>
                    <p className={`text-[14px] font-medium ${textLabelClass}`}>Arama kriterlerinize uygun müşteri bulunmuyor.</p>
                </div>
            )}

            <div className={`pt-4 border-t ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>

            {/* MODALS */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm z-[9999]">
                    <div className={`w-full max-w-[600px] max-h-[90vh] overflow-y-auto rounded-[24px] shadow-2xl animate-in fade-in zoom-in-95 ${cardClass}`}>
                        <div className={`p-6 border-b flex justify-between items-center sticky top-0 bg-inherit z-10 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                            <h3 className={`text-[18px] font-semibold ${textValueClass}`}>Yeni Müşteri Ekle</h3>
                            <button onClick={() => setIsModalOpen(false)} className={`text-[20px] leading-none ${textLabelClass} hover:${textValueClass}`}>&times;</button>
                        </div>
                        <div className="p-6 space-y-0 grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="md:col-span-1">
                                <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>Ad Soyad / Unvan <span className="text-red-500">*</span></label>
                                <input type="text" value={newCustomer.name} onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })} className={`w-full px-3 py-2.5 rounded-[24px] text-[13px] border outline-none ${isLight ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-500' : 'bg-[#0f172a] border-slate-700 text-slate-200 focus:border-blue-500'}`} />
                            </div>
                            <div className="md:col-span-1">
                                <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>Yetkili Kişi</label>
                                <input type="text" value={newCustomer.contactPerson} onChange={e => setNewCustomer({ ...newCustomer, contactPerson: e.target.value })} className={`w-full px-3 py-2.5 rounded-[24px] text-[13px] border outline-none ${isLight ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-500' : 'bg-[#0f172a] border-slate-700 text-slate-200 focus:border-blue-500'}`} />
                            </div>

                            <div className="md:col-span-1">
                                <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>Telefon</label>
                                <input type="text" value={newCustomer.phone} onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })} className={`w-full px-3 py-2.5 rounded-[24px] text-[13px] border outline-none ${isLight ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-500' : 'bg-[#0f172a] border-slate-700 text-slate-200 focus:border-blue-500'}`} />
                            </div>
                            <div className="md:col-span-1">
                                <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>E-Posta</label>
                                <input type="email" value={newCustomer.email} onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })} className={`w-full px-3 py-2.5 rounded-[24px] text-[13px] border outline-none ${isLight ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-500' : 'bg-[#0f172a] border-slate-700 text-slate-200 focus:border-blue-500'}`} />
                            </div>

                            <div className="md:col-span-1">
                                <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>Sınıf</label>
                                <select value={newCustomer.customerClass} onChange={e => setNewCustomer({ ...newCustomer, customerClass: e.target.value })} className={`w-full px-3 py-2.5 rounded-[24px] text-[13px] border outline-none ${isLight ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-500' : 'bg-[#0f172a] border-slate-700 text-slate-200 focus:border-blue-500'}`}>
                                    <option value="">Seçiniz...</option>
                                    {(custClasses || []).map(cls => <option key={cls} value={cls}>{cls}</option>)}
                                </select>
                            </div>
                            <div className="md:col-span-1">
                                <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>Şube <span className="text-red-500">*</span></label>
                                <select value={newCustomer.branch} onChange={e => setNewCustomer({ ...newCustomer, branch: e.target.value })} className={`w-full px-3 py-2.5 rounded-[24px] text-[13px] border outline-none ${isLight ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-500' : 'bg-[#0f172a] border-slate-700 text-slate-200 focus:border-blue-500'}`}>
                                    <option value="">-- Şube Seçiniz --</option>
                                    {(branches || []).map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
                                </select>
                            </div>

                            <div className="md:col-span-1">
                                <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>Vergi No / TC</label>
                                <input type="text" value={newCustomer.taxNumber} onChange={e => setNewCustomer({ ...newCustomer, taxNumber: e.target.value })} className={`w-full px-3 py-2.5 rounded-[24px] text-[13px] border outline-none ${isLight ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-500' : 'bg-[#0f172a] border-slate-700 text-slate-200 focus:border-blue-500'}`} />
                            </div>
                            <div className="md:col-span-1">
                                <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>Vergi Dairesi</label>
                                <input type="text" value={newCustomer.taxOffice} onChange={e => setNewCustomer({ ...newCustomer, taxOffice: e.target.value })} className={`w-full px-3 py-2.5 rounded-[24px] text-[13px] border outline-none ${isLight ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-500' : 'bg-[#0f172a] border-slate-700 text-slate-200 focus:border-blue-500'}`} />
                            </div>

                            <div className="md:col-span-2">
                                <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>IBAN</label>
                                <input type="text" placeholder="TR..." value={newCustomer.iban} onChange={e => setNewCustomer({ ...newCustomer, iban: e.target.value })} className={`w-full px-3 py-2.5 rounded-[24px] text-[13px] border outline-none ${isLight ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-500' : 'bg-[#0f172a] border-slate-700 text-slate-200 focus:border-blue-500'}`} />
                            </div>

                            <div className="md:col-span-1">
                                <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>İl</label>
                                <select value={newCustomer.city} onChange={e => setNewCustomer({ ...newCustomer, city: e.target.value, district: '' })} className={`w-full px-3 py-2.5 rounded-[24px] text-[13px] border outline-none ${isLight ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-500' : 'bg-[#0f172a] border-slate-700 text-slate-200 focus:border-blue-500'}`}>
                                    <option value="">Seçiniz...</option>
                                    {TURKISH_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="md:col-span-1">
                                <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>İlçe</label>
                                <select value={newCustomer.district} onChange={e => setNewCustomer({ ...newCustomer, district: e.target.value })} disabled={!newCustomer.city} className={`w-full px-3 py-2.5 rounded-[24px] text-[13px] border outline-none ${isLight ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-500' : 'bg-[#0f172a] border-slate-700 text-slate-200 focus:border-blue-500'}`}>
                                    <option value="">Seçiniz...</option>
                                    {(TURKISH_DISTRICTS[newCustomer.city] || []).map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>Açık Adres</label>
                                <textarea rows={3} value={newCustomer.address} onChange={e => setNewCustomer({ ...newCustomer, address: e.target.value })} className={`w-full px-3 py-2.5 rounded-[24px] text-[13px] border outline-none resize-none ${isLight ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-500' : 'bg-[#0f172a] border-slate-700 text-slate-200 focus:border-blue-500'}`} />
                            </div>

                            <div className="md:col-span-2 pt-2">
                                <button onClick={handleAddCustomer} disabled={isProcessing} className={`w-full py-3.5 rounded-full text-[14px] font-semibold text-white transition-colors shadow-sm ${isLight ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-500'} ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''}`}>
                                    {isProcessing ? 'Kaydediliyor...' : 'Müşteriyi Kaydet'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm z-[9999]">
                    <div className={`w-full max-w-[600px] max-h-[90vh] overflow-y-auto rounded-[24px] shadow-2xl animate-in fade-in zoom-in-95 ${cardClass}`}>
                        <div className={`p-6 border-b flex justify-between items-center sticky top-0 bg-inherit z-10 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                            <h3 className={`text-[18px] font-semibold ${textValueClass}`}>Müşteri Düzenle</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className={`text-[20px] leading-none ${textLabelClass} hover:${textValueClass}`}>&times;</button>
                        </div>
                        <div className="p-6 space-y-0 grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="md:col-span-1">
                                <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>Ad Soyad / Unvan <span className="text-red-500">*</span></label>
                                <input type="text" value={editCustomer.name} onChange={e => setEditCustomer({ ...editCustomer, name: e.target.value })} className={`w-full px-3 py-2.5 rounded-[24px] text-[13px] border outline-none ${isLight ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-500' : 'bg-[#0f172a] border-slate-700 text-slate-200 focus:border-blue-500'}`} />
                            </div>
                            <div className="md:col-span-1">
                                <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>Yetkili Kişi</label>
                                <input type="text" value={editCustomer.contactPerson} onChange={e => setEditCustomer({ ...editCustomer, contactPerson: e.target.value })} className={`w-full px-3 py-2.5 rounded-[24px] text-[13px] border outline-none ${isLight ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-500' : 'bg-[#0f172a] border-slate-700 text-slate-200 focus:border-blue-500'}`} />
                            </div>

                            <div className="md:col-span-1">
                                <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>Telefon</label>
                                <input type="text" value={editCustomer.phone} onChange={e => setEditCustomer({ ...editCustomer, phone: e.target.value })} className={`w-full px-3 py-2.5 rounded-[24px] text-[13px] border outline-none ${isLight ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-500' : 'bg-[#0f172a] border-slate-700 text-slate-200 focus:border-blue-500'}`} />
                            </div>
                            <div className="md:col-span-1">
                                <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>E-Posta</label>
                                <input type="email" value={editCustomer.email} onChange={e => setEditCustomer({ ...editCustomer, email: e.target.value })} className={`w-full px-3 py-2.5 rounded-[24px] text-[13px] border outline-none ${isLight ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-500' : 'bg-[#0f172a] border-slate-700 text-slate-200 focus:border-blue-500'}`} />
                            </div>

                            <div className="md:col-span-1">
                                <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>Sınıf</label>
                                <select value={editCustomer.customerClass} onChange={e => setEditCustomer({ ...editCustomer, customerClass: e.target.value })} className={`w-full px-3 py-2.5 rounded-[24px] text-[13px] border outline-none ${isLight ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-500' : 'bg-[#0f172a] border-slate-700 text-slate-200 focus:border-blue-500'}`}>
                                    <option value="">Seçiniz...</option>
                                    {(custClasses || []).map(cls => <option key={cls} value={cls}>{cls}</option>)}
                                </select>
                            </div>
                            <div className="md:col-span-1">
                                <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>Şube <span className="text-red-500">*</span></label>
                                <select value={editCustomer.branch || ''} onChange={e => setEditCustomer({ ...editCustomer, branch: e.target.value })} className={`w-full px-3 py-2.5 rounded-[24px] text-[13px] border outline-none ${isLight ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-500' : 'bg-[#0f172a] border-slate-700 text-slate-200 focus:border-blue-500'}`}>
                                    <option value="">-- Şube Seçiniz --</option>
                                    {(branches || []).map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
                                </select>
                            </div>

                            <div className="md:col-span-1">
                                <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>Vergi No / TC</label>
                                <input type="text" value={editCustomer.taxNumber} onChange={e => setEditCustomer({ ...editCustomer, taxNumber: e.target.value })} className={`w-full px-3 py-2.5 rounded-[24px] text-[13px] border outline-none ${isLight ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-500' : 'bg-[#0f172a] border-slate-700 text-slate-200 focus:border-blue-500'}`} />
                            </div>
                            <div className="md:col-span-1">
                                <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>Vergi Dairesi</label>
                                <input type="text" value={editCustomer.taxOffice} onChange={e => setEditCustomer({ ...editCustomer, taxOffice: e.target.value })} className={`w-full px-3 py-2.5 rounded-[24px] text-[13px] border outline-none ${isLight ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-500' : 'bg-[#0f172a] border-slate-700 text-slate-200 focus:border-blue-500'}`} />
                            </div>

                            <div className="md:col-span-2">
                                <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>IBAN</label>
                                <input type="text" placeholder="TR..." value={editCustomer.iban} onChange={e => setEditCustomer({ ...editCustomer, iban: e.target.value })} className={`w-full px-3 py-2.5 rounded-[24px] text-[13px] border outline-none ${isLight ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-500' : 'bg-[#0f172a] border-slate-700 text-slate-200 focus:border-blue-500'}`} />
                            </div>

                            <div className="md:col-span-1">
                                <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>İl</label>
                                <select value={editCustomer.city} onChange={e => setEditCustomer({ ...editCustomer, city: e.target.value, district: '' })} className={`w-full px-3 py-2.5 rounded-[24px] text-[13px] border outline-none ${isLight ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-500' : 'bg-[#0f172a] border-slate-700 text-slate-200 focus:border-blue-500'}`}>
                                    <option value="">Seçiniz...</option>
                                    {TURKISH_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="md:col-span-1">
                                <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>İlçe</label>
                                <select value={editCustomer.district} onChange={e => setEditCustomer({ ...editCustomer, district: e.target.value })} disabled={!editCustomer.city} className={`w-full px-3 py-2.5 rounded-[24px] text-[13px] border outline-none ${isLight ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-500' : 'bg-[#0f172a] border-slate-700 text-slate-200 focus:border-blue-500'}`}>
                                    <option value="">Seçiniz...</option>
                                    {(TURKISH_DISTRICTS[editCustomer.city] || []).map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>Adres</label>
                                <textarea rows={3} value={editCustomer.address} onChange={e => setEditCustomer({ ...editCustomer, address: e.target.value })} className={`w-full px-3 py-2.5 rounded-[24px] text-[13px] border outline-none resize-none ${isLight ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-500' : 'bg-[#0f172a] border-slate-700 text-slate-200 focus:border-blue-500'}`} />
                            </div>
                            <div className="md:col-span-2 pt-2">
                                <button onClick={handleEditCustomer} disabled={isProcessing} className={`w-full py-3.5 rounded-full text-[14px] font-semibold text-white transition-colors shadow-sm ${isLight ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-500'} ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''}`}>
                                    {isProcessing ? 'Güncelleniyor...' : 'Değişiklikleri Kaydet'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Category Assignment Modal */}
            {isBulkCategoryModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm z-[9999]">
                    <div className={`w-full max-w-[400px] rounded-[24px] shadow-2xl animate-in fade-in zoom-in-95 ${cardClass}`}>
                        <div className={`p-6 border-b flex justify-between items-center ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                            <h3 className={`text-[18px] font-semibold ${textValueClass}`}>Toplu Sınıf Ata</h3>
                            <button onClick={() => setIsBulkCategoryModal(false)} className={`text-[20px] leading-none ${textLabelClass} hover:${textValueClass}`}>&times;</button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>Cari Sınıfı Seçin</label>
                                <select 
                                    value={bulkCategory} 
                                    onChange={e => setBulkCategory(e.target.value)} 
                                    className={`w-full px-3 py-2.5 rounded-[24px] text-[13px] border outline-none ${isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#0f172a] border-slate-700 text-slate-200'}`}
                                >
                                    <option value="">Seçiniz...</option>
                                    {(custClasses || []).map(cls => <option key={cls} value={cls}>{cls}</option>)}
                                </select>
                            </div>
                            <div className="pt-2">
                                <button 
                                    onClick={handleBulkCategoryUpdate} 
                                    disabled={!bulkCategory} 
                                    className={`w-full py-3 rounded-full text-[14px] font-semibold text-white transition-colors shadow-sm ${isLight ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-500'} ${!bulkCategory ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    {selectedIds.length} Müşteriyi Güncelle
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
