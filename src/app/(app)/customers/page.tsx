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
        if (activeTab === 'eticaret' && cust.category !== 'E-ticaret') return false;

        if (branchFilter !== 'all' && (cust.branch || 'Merkez') !== branchFilter) return false;

        return true;
    });

    const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE);
    const paginatedCustomers = filteredCustomers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const tabs = [
        { id: 'all', label: 'Tümü' },
        { id: 'borclular', label: 'Borçlular' },
        { id: 'alacaklilar', label: 'Alacaklılar' },
        { id: 'eticaret', label: 'E-Ticaret' },
        { id: 'kurumsal', label: 'Kurumsal' },
        { id: 'vip', label: 'VIP' }
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
                setEditCustomer({ id: '', name: '', phone: '', email: '', address: '', city: '', district: '', taxNumber: '', taxOffice: '', contactPerson: '', iban: '', customerClass: '', referredByCode: '' });
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
                    referredByCode: (customerToEdit as any).referredByCode || ''
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

    const totalReceivable = customers.reduce((sum, c) => {
        const netBalance = Number(c.balance);
        const portfolioChecks = (c.checks || [])
            .filter((check: any) => check.type.includes('Alınan'))
            .reduce((acc: number, curr: any) => acc + Number(curr.amount), 0);

        return sum + (netBalance > 0 ? netBalance : 0) + portfolioChecks;
    }, 0);
    const totalPayable = customers.filter(c => Number(c.balance) < 0).reduce((sum, c) => sum + Math.abs(Number(c.balance)), 0);

    const cardClass = isLight
        ? "bg-white border border-slate-200 shadow-sm"
        : "bg-slate-900 border border-slate-800";

    const textLabelClass = isLight ? "text-slate-500" : "text-slate-400";
    const textValueClass = isLight ? "text-slate-900" : "text-white";

    return (
        <div data-pos-theme={theme} className="w-full min-h-[100vh] px-8 py-8 space-y-6 transition-colors duration-300 font-sans" style={{ background: isLight ? '#FAFAFA' : undefined }}>

            <div className="flex justify-between items-start mb-2">
                <div>
                    <h1 className={`text-[24px] font-semibold tracking-tight ${textValueClass}`}>Müşteri Kontrol Konsolu</h1>
                    <p className={`text-[13px] mt-1 font-medium ${textLabelClass}`}>Portföy, bakiyeler ve hesap hareketleri</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className={`h-[40px] px-5 flex items-center gap-2 rounded-[12px] font-medium text-[13px] transition-all shadow-sm ${isLight ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-600 text-white hover:bg-blue-500'
                            }`}
                    >
                        <Plus className="w-4 h-4" />
                        Yeni Müşteri
                    </button>
                </div>
            </div>

            {/* KPI Banner */}
            <div className={`flex rounded-[14px] border overflow-hidden ${cardClass}`}>
                <div className={`flex-1 p-5 border-r ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                    <div className="flex items-center gap-2 mb-2">
                        <Users className={`w-4 h-4 ${isLight ? 'text-blue-500' : 'text-blue-400'}`} />
                        <span className={`text-[11px] font-semibold uppercase tracking-wide ${textLabelClass}`}>Toplam Müşteri</span>
                    </div>
                    <div className={`text-[28px] font-semibold tracking-tight ${textValueClass}`}>
                        {customers.length}
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

            {/* Controls */}
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center gap-4">
                    <div className="relative flex-1 max-w-[600px]">
                        <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            placeholder="Müşteri adı, telefon, vergi no veya e-posta..."
                            className={`w-full h-[40px] pl-[38px] pr-4 rounded-[10px] text-[13px] font-medium border outline-none transition-all ${isLight
                                    ? 'bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                                    : 'bg-slate-900 border-slate-800 text-slate-200 placeholder:text-slate-500 focus:border-blue-500'
                                }`}
                        />
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`h-[40px] px-4 rounded-[10px] text-[13px] font-semibold border flex items-center gap-2 transition-all ${showFilters
                                    ? (isLight ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-blue-900/20 border-blue-800/50 text-blue-400')
                                    : (isLight ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50' : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800')
                                }`}
                        >
                            <Filter className="w-4 h-4" />
                            Filtreler
                        </button>
                        <div className={`flex p-1 rounded-[10px] border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/50 border-slate-800'}`}>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`w-8 h-8 flex items-center justify-center rounded-[6px] transition-colors ${viewMode === 'grid'
                                        ? (isLight ? 'bg-white shadow-sm text-blue-600' : 'bg-slate-800 text-blue-400')
                                        : (isLight ? 'text-slate-400 hover:text-slate-600' : 'text-slate-500 hover:text-slate-300')
                                    }`}
                            >
                                <Grid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`w-8 h-8 flex items-center justify-center rounded-[6px] transition-colors ${viewMode === 'list'
                                        ? (isLight ? 'bg-white shadow-sm text-blue-600' : 'bg-slate-800 text-blue-400')
                                        : (isLight ? 'text-slate-400 hover:text-slate-600' : 'text-slate-500 hover:text-slate-300')
                                    }`}
                            >
                                <List className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filters Collapse */}
                {showFilters && (
                    <div className={`p-5 rounded-[12px] border flex flex-wrap gap-8 animate-in slide-in-from-top-2 overflow-hidden ${cardClass}`}>
                        <div>
                            <div className={`text-[11px] font-semibold uppercase tracking-wide mb-3 ${textLabelClass}`}>Kategori</div>
                            <div className="flex flex-wrap gap-2">
                                {tabs.map(tab => {
                                    const isActive = activeTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => handleTabChange(tab.id)}
                                            className={`h-[32px] px-4 rounded-[10px] text-[12px] font-medium border transition-colors ${isActive
                                                    ? (isLight ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-blue-900/20 border-blue-800/50 text-blue-400')
                                                    : (isLight ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50' : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800')
                                                }`}
                                        >
                                            {tab.label}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                        <div className="flex-1 min-w-[200px] max-w-[300px]">
                            <div className={`text-[11px] font-semibold uppercase tracking-wide mb-3 ${textLabelClass}`}>Şube</div>
                            <select
                                value={branchFilter}
                                onChange={(e) => setBranchFilter(e.target.value)}
                                disabled={!hasPermission('branch_administration')}
                                className={`w-full h-[36px] px-3 rounded-[10px] text-[13px] font-medium border outline-none ${isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-slate-900 border-slate-800 text-slate-300'
                                    }`}
                            >
                                {hasPermission('branch_administration') && <option value="all">Tüm Şubeler</option>}
                                {branches.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {/* List View */}
            {viewMode === 'list' && (
                <div className={`rounded-[16px] border p-0 overflow-hidden ${cardClass}`}>
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-transparent border-b">
                            <tr className={isLight ? 'border-slate-200' : 'border-slate-800'}>
                                <th className={`h-[48px] px-6 text-[11px] uppercase tracking-wide font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Müşteri</th>
                                <th className={`h-[48px] px-4 text-[11px] uppercase tracking-wide font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>İletişim</th>
                                <th className={`h-[48px] px-4 text-[11px] uppercase tracking-wide font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Kategori</th>
                                <th className={`h-[48px] px-4 text-[11px] uppercase tracking-wide font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Bakiye</th>
                                <th className={`h-[48px] px-6 text-right text-[11px] uppercase tracking-wide font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${isLight ? 'divide-slate-100' : 'divide-slate-800/50'}`}>
                            {paginatedCustomers.map(cust => {
                                const portfolioChecks = (cust.checks || [])
                                    .filter((c: any) => c.type.includes('Alınan') && ['Portföyde', 'Beklemede'].includes(c.status))
                                    .reduce((acc: number, curr: any) => acc + Number(curr.amount), 0);
                                const rawBalance = Number(cust.balance);
                                const effectiveBalance = rawBalance + portfolioChecks;

                                return (
                                    <tr key={cust.id} className={`h-[60px] transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/50'}`}>
                                        <td className="px-6 py-3 align-middle">
                                            <div className={`font-semibold text-[14px] ${textValueClass}`}>{cust.name}</div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`text-[11px] font-medium ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`}>⭐ {Number(cust.points || 0).toFixed(0)}</span>
                                                {(cust as any).taxNumber && (
                                                    <span className={`text-[11px] ${textLabelClass}`}>VKN: {(cust as any).taxNumber}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 align-middle">
                                            <div className={`text-[13px] font-medium ${textValueClass}`}>{cust.phone || '-'}</div>
                                            <div className={`text-[12px] truncate max-w-[150px] ${textLabelClass}`}>{cust.email || '-'}</div>
                                        </td>
                                        <td className="px-4 py-3 align-middle">
                                            <span className={`px-2 py-1 text-[11px] font-medium border rounded-[6px] inline-block ${isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-800 border-slate-700 text-slate-300'
                                                }`}>
                                                {cust.category || 'Genel'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 align-middle">
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
                                        <td className="px-6 py-3 align-middle text-right flex gap-2 justify-end items-center h-full pt-4">
                                            <Link href={`/customers/${cust.id}`} className={`h-[32px] px-3 flex items-center rounded-[8px] text-[12px] font-medium transition-colors ${isLight ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-600 text-white hover:bg-blue-500'}`}>
                                                Detay
                                            </Link>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Grid View */}
            {viewMode === 'grid' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {paginatedCustomers.map(cust => {
                        const portfolioChecks = (cust.checks || [])
                            .filter((c: any) => c.type.includes('Alınan') && ['Portföyde', 'Beklemede'].includes(c.status))
                            .reduce((acc: number, curr: any) => acc + Number(curr.amount), 0);
                        const rawBalance = Number(cust.balance);
                        const effectiveBalance = rawBalance + portfolioChecks;

                        return (
                            <div key={cust.id} className={`rounded-[14px] border overflow-hidden flex flex-col ${cardClass}`}>
                                <div className={`p-5 flex-1 ${isLight ? 'bg-white' : 'bg-slate-900'}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center text-[16px] font-bold text-white shadow-sm ${isLight ? 'bg-blue-600' : 'bg-blue-600'
                                            }`}>
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
                                            {cust.category || 'Genel'}
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

                                <div className={`p-4 flex gap-2 border-t ${isLight ? 'bg-slate-50/50 border-slate-200' : 'bg-slate-900/50 border-slate-800'}`}>
                                    <Link href={`/customers/${cust.id}`} className={`flex-1 h-[36px] flex items-center justify-center rounded-[10px] text-[13px] font-medium transition-colors ${isLight ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-600 text-white hover:bg-blue-500'}`}>
                                        Detay
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {filteredCustomers.length === 0 && (
                <div className={`py-16 text-center rounded-[16px] border border-dashed ${isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'}`}>
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className={`w-full max-w-[600px] max-h-[90vh] overflow-y-auto rounded-[16px] shadow-2xl animate-in fade-in zoom-in-95 ${cardClass}`}>
                        <div className={`p-6 border-b flex justify-between items-center sticky top-0 bg-inherit z-10 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                            <h3 className={`text-[18px] font-semibold ${textValueClass}`}>Yeni Müşteri Ekle</h3>
                            <button onClick={() => setIsModalOpen(false)} className={`text-[20px] leading-none ${textLabelClass} hover:${textValueClass}`}>&times;</button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>Ad Soyad / Unvan <span className="text-red-500">*</span></label>
                                    <input type="text" value={newCustomer.name} onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })} className={`w-full px-3 py-2 rounded-[8px] text-[13px] border outline-none ${isLight ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-500' : 'bg-slate-900 border-slate-700 text-slate-200 focus:border-blue-500'}`} />
                                </div>
                                <div>
                                    <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>Yetkili Kişi</label>
                                    <input type="text" value={newCustomer.contactPerson} onChange={e => setNewCustomer({ ...newCustomer, contactPerson: e.target.value })} className={`w-full px-3 py-2 rounded-[8px] text-[13px] border outline-none ${isLight ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-500' : 'bg-slate-900 border-slate-700 text-slate-200 focus:border-blue-500'}`} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>Telefon</label>
                                    <input type="text" value={newCustomer.phone} onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })} className={`w-full px-3 py-2 rounded-[8px] text-[13px] border outline-none ${isLight ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-500' : 'bg-slate-900 border-slate-700 text-slate-200 focus:border-blue-500'}`} />
                                </div>
                                <div>
                                    <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>E-Posta</label>
                                    <input type="email" value={newCustomer.email} onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })} className={`w-full px-3 py-2 rounded-[8px] text-[13px] border outline-none ${isLight ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-500' : 'bg-slate-900 border-slate-700 text-slate-200 focus:border-blue-500'}`} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>Vergi No / TC</label>
                                    <input type="text" value={newCustomer.taxNumber} onChange={e => setNewCustomer({ ...newCustomer, taxNumber: e.target.value })} className={`w-full px-3 py-2 rounded-[8px] text-[13px] border outline-none ${isLight ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-500' : 'bg-slate-900 border-slate-700 text-slate-200 focus:border-blue-500'}`} />
                                </div>
                                <div>
                                    <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>Vergi Dairesi</label>
                                    <input type="text" value={newCustomer.taxOffice} onChange={e => setNewCustomer({ ...newCustomer, taxOffice: e.target.value })} className={`w-full px-3 py-2 rounded-[8px] text-[13px] border outline-none ${isLight ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-500' : 'bg-slate-900 border-slate-700 text-slate-200 focus:border-blue-500'}`} />
                                </div>
                            </div>
                            <div>
                                <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>IBAN</label>
                                <input type="text" placeholder="TR..." value={newCustomer.iban} onChange={e => setNewCustomer({ ...newCustomer, iban: e.target.value })} className={`w-full px-3 py-2 rounded-[8px] text-[13px] border outline-none ${isLight ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-500' : 'bg-slate-900 border-slate-700 text-slate-200 focus:border-blue-500'}`} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>Sınıf</label>
                                    <select value={newCustomer.customerClass} onChange={e => setNewCustomer({ ...newCustomer, customerClass: e.target.value })} className={`w-full px-3 py-2 rounded-[8px] text-[13px] border outline-none ${isLight ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-500' : 'bg-slate-900 border-slate-700 text-slate-200 focus:border-blue-500'}`}>
                                        <option value="">Seçiniz...</option>
                                        {(custClasses || []).map(cls => <option key={cls} value={cls}>{cls}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>Şube <span className="text-red-500">*</span></label>
                                    <select value={newCustomer.branch} onChange={e => setNewCustomer({ ...newCustomer, branch: e.target.value })} className={`w-full px-3 py-2 rounded-[8px] text-[13px] border outline-none ${isLight ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-500' : 'bg-slate-900 border-slate-700 text-slate-200 focus:border-blue-500'}`}>
                                        {(branches || []).map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>İl</label>
                                    <select value={newCustomer.city} onChange={e => setNewCustomer({ ...newCustomer, city: e.target.value, district: '' })} className={`w-full px-3 py-2 rounded-[8px] text-[13px] border outline-none ${isLight ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-500' : 'bg-slate-900 border-slate-700 text-slate-200 focus:border-blue-500'}`}>
                                        <option value="">Seçiniz...</option>
                                        {TURKISH_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>İlçe</label>
                                    <select value={newCustomer.district} onChange={e => setNewCustomer({ ...newCustomer, district: e.target.value })} disabled={!newCustomer.city} className={`w-full px-3 py-2 rounded-[8px] text-[13px] border outline-none ${isLight ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-500' : 'bg-slate-900 border-slate-700 text-slate-200 focus:border-blue-500'}`}>
                                        <option value="">Seçiniz...</option>
                                        {(TURKISH_DISTRICTS[newCustomer.city] || []).map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>Açık Adres</label>
                                <textarea row={3} value={newCustomer.address} onChange={e => setNewCustomer({ ...newCustomer, address: e.target.value })} className={`w-full px-3 py-2 rounded-[8px] text-[13px] border outline-none resize-none ${isLight ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-500' : 'bg-slate-900 border-slate-700 text-slate-200 focus:border-blue-500'}`} />
                            </div>
                            <button onClick={handleAddCustomer} disabled={isProcessing} className={`w-full py-3 rounded-[10px] text-[14px] font-semibold text-white transition-colors ${isLight ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-500'} ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''}`}>
                                {isProcessing ? 'Kaydediliyor...' : 'Müşteriyi Kaydet'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className={`w-full max-w-[600px] max-h-[90vh] overflow-y-auto rounded-[16px] shadow-2xl animate-in fade-in zoom-in-95 ${cardClass}`}>
                        <div className={`p-6 border-b flex justify-between items-center sticky top-0 bg-inherit z-10 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                            <h3 className={`text-[18px] font-semibold ${textValueClass}`}>Müşteri Düzenle</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className={`text-[20px] leading-none ${textLabelClass} hover:${textValueClass}`}>&times;</button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>Müşteri Adı <span className="text-red-500">*</span></label>
                                    <input type="text" value={editCustomer.name} onChange={e => setEditCustomer({ ...editCustomer, name: e.target.value })} className={`w-full px-3 py-2 rounded-[8px] text-[13px] border outline-none ${isLight ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-500' : 'bg-slate-900 border-slate-700 text-slate-200 focus:border-blue-500'}`} />
                                </div>
                                <div>
                                    <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>Telefon</label>
                                    <input type="text" value={editCustomer.phone} onChange={e => setEditCustomer({ ...editCustomer, phone: e.target.value })} className={`w-full px-3 py-2 rounded-[8px] text-[13px] border outline-none ${isLight ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-500' : 'bg-slate-900 border-slate-700 text-slate-200 focus:border-blue-500'}`} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>E-Posta</label>
                                    <input type="email" value={editCustomer.email} onChange={e => setEditCustomer({ ...editCustomer, email: e.target.value })} className={`w-full px-3 py-2 rounded-[8px] text-[13px] border outline-none ${isLight ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-500' : 'bg-slate-900 border-slate-700 text-slate-200 focus:border-blue-500'}`} />
                                </div>
                                <div>
                                    <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>Sınıf</label>
                                    <select value={editCustomer.customerClass} onChange={e => setEditCustomer({ ...editCustomer, customerClass: e.target.value })} className={`w-full px-3 py-2 rounded-[8px] text-[13px] border outline-none ${isLight ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-500' : 'bg-slate-900 border-slate-700 text-slate-200 focus:border-blue-500'}`}>
                                        <option value="">Seçiniz...</option>
                                        {(custClasses || []).map(cls => <option key={cls} value={cls}>{cls}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>Vergi No / TC</label>
                                    <input type="text" value={editCustomer.taxNumber} onChange={e => setEditCustomer({ ...editCustomer, taxNumber: e.target.value })} className={`w-full px-3 py-2 rounded-[8px] text-[13px] border outline-none ${isLight ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-500' : 'bg-slate-900 border-slate-700 text-slate-200 focus:border-blue-500'}`} />
                                </div>
                                <div>
                                    <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>Vergi Dairesi</label>
                                    <input type="text" value={editCustomer.taxOffice} onChange={e => setEditCustomer({ ...editCustomer, taxOffice: e.target.value })} className={`w-full px-3 py-2 rounded-[8px] text-[13px] border outline-none ${isLight ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-500' : 'bg-slate-900 border-slate-700 text-slate-200 focus:border-blue-500'}`} />
                                </div>
                            </div>
                            <div>
                                <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>Yetkili Kişi</label>
                                <input type="text" value={editCustomer.contactPerson} onChange={e => setEditCustomer({ ...editCustomer, contactPerson: e.target.value })} className={`w-full px-3 py-2 rounded-[8px] text-[13px] border outline-none ${isLight ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-500' : 'bg-slate-900 border-slate-700 text-slate-200 focus:border-blue-500'}`} />
                            </div>
                            <div>
                                <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>IBAN</label>
                                <input type="text" placeholder="TR..." value={editCustomer.iban} onChange={e => setEditCustomer({ ...editCustomer, iban: e.target.value })} className={`w-full px-3 py-2 rounded-[8px] text-[13px] border outline-none ${isLight ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-500' : 'bg-slate-900 border-slate-700 text-slate-200 focus:border-blue-500'}`} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>İl</label>
                                    <select value={editCustomer.city} onChange={e => setEditCustomer({ ...editCustomer, city: e.target.value, district: '' })} className={`w-full px-3 py-2 rounded-[8px] text-[13px] border outline-none ${isLight ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-500' : 'bg-slate-900 border-slate-700 text-slate-200 focus:border-blue-500'}`}>
                                        <option value="">Seçiniz...</option>
                                        {TURKISH_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>İlçe</label>
                                    <select value={editCustomer.district} onChange={e => setEditCustomer({ ...editCustomer, district: e.target.value })} disabled={!editCustomer.city} className={`w-full px-3 py-2 rounded-[8px] text-[13px] border outline-none ${isLight ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-500' : 'bg-slate-900 border-slate-700 text-slate-200 focus:border-blue-500'}`}>
                                        <option value="">Seçiniz...</option>
                                        {(TURKISH_DISTRICTS[editCustomer.city] || []).map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>Adres</label>
                                <textarea row={3} value={editCustomer.address} onChange={e => setEditCustomer({ ...editCustomer, address: e.target.value })} className={`w-full px-3 py-2 rounded-[8px] text-[13px] border outline-none resize-none ${isLight ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-500' : 'bg-slate-900 border-slate-700 text-slate-200 focus:border-blue-500'}`} />
                            </div>
                            <button onClick={handleEditCustomer} disabled={isProcessing} className={`w-full py-3 rounded-[10px] text-[14px] font-semibold text-white transition-colors ${isLight ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-500'} ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''}`}>
                                {isProcessing ? 'Güncelleniyor...' : 'Değişiklikleri Kaydet'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
