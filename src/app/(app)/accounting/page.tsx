"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useFinancials } from "@/contexts/FinancialContext";
import { useCRM } from "@/contexts/CRMContext";
import { formatCurrency } from "@/lib/utils";
import { ChevronDown, Plus, RefreshCw, CalendarDays, Inbox } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useModal } from "@/contexts/ModalContext";
import { useTheme } from "@/contexts/ThemeContext";
import AccountingModals from "./components/AccountingModals";

export default function AccountingPage() {
    const searchParams = useSearchParams();
    const initialTab = searchParams.get('tab') || 'receivables';

    const { user } = useAuth();
    const { showSuccess, showError, showConfirm } = useModal();
    const {
        transactions,
        checks,
        kasalar,
        refreshTransactions,
        refreshKasalar,
        refreshChecks,
        refreshBankTransactions,
        isInitialLoading
    } = useFinancials();

    const { customers, suppliers, refreshCustomers, refreshSuppliers } = useCRM();

    const [activeTab, setActiveTab] = useState(initialTab);
    const [modalType, setModalType] = useState<string | null>(null);
    const [syncStates, setSyncStates] = useState<Record<string, 'IDLE' | 'SYNCING' | 'DONE' | 'ERROR'>>({});
    const [duplicates, setDuplicates] = useState<any[]>([]);

    const isAdmin = user?.role === 'SUPER_ADMIN' || (user?.role?.toLowerCase().includes('admin'));

    const findDuplicates = async () => {
        try {
            const res = await fetch('/api/fintech/banking/duplicates');
            const data = await res.json();
            if (data.success) setDuplicates(data.duplicates);
        } catch (e) { console.error(e); }
    };

    const handleMerge = async (duplicate: any) => {
        showConfirm('Hesapları Birleştir', 'Bu manuel hesabı open banking bağlantısı ile birleştirmek istediğinize emin misiniz?', async () => {
            try {
                const res = await fetch('/api/fintech/banking/merge', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ kasaId: duplicate.kasaId, connectionId: duplicate.connectionId })
                });
                const data = await res.json();
                if (data.success) {
                    showSuccess('Başarılı', 'Hesaplar başarıyla birleştirildi.');
                    setDuplicates(prev => prev.filter(d => d.kasaId !== duplicate.kasaId));
                    refreshData();
                } else {
                    showError('Hata', data.error || 'İşlem başarısız.');
                }
            } catch (e) { showError('Hata', 'Bağlantı hatası oluştu'); }
        });
    };

    const syncAccount = async (connectionId?: string) => {
        const key = connectionId || 'GLOBAL';
        setSyncStates(prev => ({ ...prev, [key]: 'SYNCING' }));
        try {
            const res = await fetch('/api/fintech/banking/sync', {
                method: 'POST',
                body: JSON.stringify({ connectionId })
            });
            const data = await res.json();
            setSyncStates(prev => ({ ...prev, [key]: data.success ? 'DONE' : 'ERROR' }));
            if (data.success) {
                refreshData();
                setTimeout(() => setSyncStates(prev => ({ ...prev, [key]: 'IDLE' })), 3000);
            }
        } catch (e) {
            setSyncStates(prev => ({ ...prev, [key]: 'ERROR' }));
        }
    };

    const { theme } = useTheme();

    useEffect(() => {
        if (theme === 'light') {
            document.body.style.background = '#F8FAFC'; // updated bg
            document.body.style.color = '#0F172A';
        } else {
            document.body.style.background = '#0F172A';
            document.body.style.color = '#F8FAFC';
        }
    }, [theme]);

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab) setActiveTab(tab);
        if (tab === 'banks') findDuplicates();
    }, [searchParams]);

    const stats = useMemo(() => {
        const checkReceivables = checks.filter(c => c.type === 'In' && c.status !== 'Tahsil Edildi').reduce((sum, c) => sum + c.amount, 0);
        const customerReceivables = customers.reduce((sum, c) => sum + (Number(c.balance) > 0 ? Number(c.balance) : 0), 0);
        const supplierReceivables = suppliers.reduce((sum, s) => sum + (Number(s.balance) > 0 ? Number(s.balance) : 0), 0);
        const totalReceivables = checkReceivables + customerReceivables + supplierReceivables;

        const checkPayables = checks.filter(c => c.type === 'Out' && c.status !== 'Ödendi').reduce((sum, c) => sum + c.amount, 0);
        const supplierPayables = suppliers.reduce((sum, s) => sum + (Number(s.balance) < 0 ? Math.abs(Number(s.balance)) : 0), 0);
        const customerPayables = customers.reduce((sum, c) => sum + (Number(c.balance) < 0 ? Math.abs(Number(c.balance)) : 0), 0);
        const totalPayables = checkPayables + supplierPayables + customerPayables;

        const totalExpenses = transactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0);
        const netCash = kasalar.reduce((sum, k) => sum + k.balance, 0);

        return { totalReceivables, totalPayables, totalExpenses, netCash };
    }, [transactions, checks, kasalar, customers, suppliers]);

    const refreshData = async () => {
        await Promise.all([
            refreshTransactions(),
            refreshKasalar(),
            refreshChecks(),
            refreshBankTransactions(),
            refreshCustomers(),
            refreshSuppliers()
        ]);
    };

    // Colors according to discipline: Blue, Green, Amber, Red, Slate
    const LIGHT_GRADIENT = "linear-gradient(180deg, rgba(255,255,255,0.95), rgba(248,250,252,0.85))";
    const DARK_GRADIENT = "linear-gradient(180deg, rgba(15,23,42,0.75), rgba(15,23,42,0.55))";

    const glassStyle = theme === 'light' ? {
        background: LIGHT_GRADIENT,
        border: '1px solid rgba(15,23,42,0.06)',
    } : {
        background: DARK_GRADIENT,
        border: '1px solid rgba(96,165,250,0.15)',
    };

    const tabs = [
        { id: 'receivables', label: 'Alacaklar' },
        { id: 'payables', label: 'Borçlar' },
        { id: 'checks', label: 'Çek / Senet' },
        { id: 'banks', label: 'Banka' },
        { id: 'expenses', label: 'Giderler' },
        { id: 'transactions', label: 'Hareketler' }
    ];

    const renderCell = (content: React.ReactNode, align = "text-left", highlightClass = "") => (
        <td className={`px-4 align-middle h-[56px] text-[14px] font-medium ${theme === 'light' ? 'text-slate-800' : 'text-slate-200'} ${align} ${highlightClass}`}>
            {content}
        </td>
    );

    const renderBadge = (label: string, colorClass: string) => {
        // Soft tint badges matching discipline
        const bg = theme === 'light' ? `${colorClass}/10` : `${colorClass}/20`;
        const text = colorClass; // expects Tailwind text color class like 'text-blue-600' or 'text-emerald-500'
        return <span className={`px-2.5 py-1 rounded-[6px] text-[11px] font-bold tracking-[0.08em] uppercase inline-flex ${bg} ${text}`}>{label}</span>;
    };

    return (
        <div data-pos-theme={theme} className="w-full min-h-[100vh] px-8 py-8 space-y-10 transition-colors duration-300 font-sans">
            <AccountingModals
                isOpen={!!modalType}
                onClose={() => setModalType(null)}
                type={modalType || ''}
                theme={theme}
            />

            {/* 1. Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className={`text-[22px] font-semibold tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                    Financial Control Workspace
                </h1>
                <button onClick={refreshData} className={`px-4 h-[36px] flex justify-center items-center gap-2 rounded-[10px] text-[13px] font-semibold transition-all ${theme === 'light' ? 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50' : 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700'}`}>
                    <RefreshCw className={`w-4 h-4 ${isInitialLoading ? 'animate-spin' : ''}`} />
                    Yenile
                </button>
            </div>

            {/* 2. Top KPI Area (Horizontal Insight Panel) */}
            <div style={glassStyle} className="rounded-[20px] p-[28px] shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[rgba(15,23,42,0.06)] dark:divide-[rgba(96,165,250,0.15)]">
                    {/* TOPLAM ALACAK */}
                    <div className="px-6 first:pl-0 last:pr-0 pb-4 md:pb-0 pt-4 md:pt-0">
                        <div className="text-[11px] uppercase tracking-[0.08em] font-semibold text-slate-500 dark:text-slate-400 mb-2">Toplam Alacak</div>
                        <div className={`text-[34px] font-semibold tracking-tight ${theme === 'light' ? 'text-blue-600' : 'text-blue-400'}`}>{formatCurrency(stats.totalReceivables)}</div>
                        <div className="text-[12px] opacity-70 text-slate-500 mt-1 font-medium">Cari hesaplar ve alacaklar</div>
                    </div>
                    {/* TOPLAM ÖDEME */}
                    <div className="px-6 pb-4 md:pb-0 pt-4 md:pt-0">
                        <div className="text-[11px] uppercase tracking-[0.08em] font-semibold text-slate-500 dark:text-slate-400 mb-2">Toplam Ödeme</div>
                        <div className={`text-[34px] font-semibold tracking-tight ${theme === 'light' ? 'text-slate-800' : 'text-slate-200'}`}>{formatCurrency(stats.totalPayables)}</div>
                        <div className="text-[12px] opacity-70 text-slate-500 mt-1 font-medium">Tedarikçi borçları</div>
                    </div>
                    {/* TOPLAM GİDER */}
                    <div className="px-6 pb-4 md:pb-0 pt-4 md:pt-0">
                        <div className="text-[11px] uppercase tracking-[0.08em] font-semibold text-slate-500 dark:text-slate-400 mb-2">Toplam Gider</div>
                        <div className={`text-[34px] font-semibold tracking-tight ${theme === 'light' ? 'text-red-500' : 'text-red-400'}`}>{formatCurrency(stats.totalExpenses)}</div>
                        <div className="text-[12px] opacity-70 text-slate-500 mt-1 font-medium">İşletme giderleri</div>
                    </div>
                    {/* NET KASA */}
                    <div className="px-6 last:pr-0 pt-4 md:pt-0">
                        <div className="text-[11px] uppercase tracking-[0.08em] font-semibold text-slate-500 dark:text-slate-400 mb-2">Net Kasa</div>
                        <div className={`text-[34px] font-semibold tracking-tight ${theme === 'light' ? 'text-emerald-600' : 'text-emerald-400'}`}>{formatCurrency(stats.netCash)}</div>
                        <div className="text-[12px] opacity-70 text-slate-500 mt-1 font-medium">Banka ve genel kasa</div>
                    </div>
                </div>
            </div>

            {/* 3. Filter Area */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className={`flex items-center h-[44px] px-4 rounded-[14px] cursor-pointer ${theme === 'light' ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'} border shadow-sm transition-colors`}>
                    <CalendarDays className="w-4 h-4 mr-2 text-slate-400" />
                    <span className="text-[13px] font-medium mr-4">Tüm Zamanlar</span>
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                </div>

                <div className={`flex items-center h-[44px] p-1 rounded-[14px] border ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700/50'} shadow-sm`}>
                    {tabs.map(tab => {
                        const isActive = activeTab === tab.id;
                        const activeLightClasses = "bg-slate-200/50 text-blue-700"; // tinted background, minimal
                        const activeDarkClasses = "bg-slate-700/50 text-blue-400";
                        const idleLightClasses = "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50";
                        const idleDarkClasses = "text-slate-400 hover:text-slate-300 hover:bg-slate-700/50";

                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`h-[34px] px-4 rounded-[10px] text-[13px] font-semibold transition-colors ${isActive ? (theme === 'light' ? activeLightClasses : activeDarkClasses) : (theme === 'light' ? idleLightClasses : idleDarkClasses)}`}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 4. Main Table Area */}
            <div className="space-y-6">
                {/* Optional Toolbar Area above Table if needed */}
                <div className="flex justify-between items-center">
                    <h3 className={`text-[18px] font-semibold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                        {activeTab === 'receivables' ? 'Alacak Yönetimi' :
                            activeTab === 'payables' ? 'Borç Yönetimi' :
                                activeTab === 'checks' ? 'Çek & Senetler' :
                                    activeTab === 'banks' ? 'Banka Hareketleri' :
                                        activeTab === 'expenses' ? 'Gider Takibi' : 'Tüm Hareketler'}
                    </h3>

                    {activeTab === 'receivables' && (
                        <button onClick={() => setModalType('collection')} className="h-[44px] px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-[14px] font-medium text-[14px] shadow-sm transition-colors flex items-center justify-center gap-2">
                            + Tahsilat Ekle
                        </button>
                    )}
                    {activeTab === 'payables' && (
                        <button onClick={() => setModalType('debt')} className="h-[44px] px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-[14px] font-medium text-[14px] shadow-sm transition-colors flex items-center justify-center gap-2">
                            + Borç Ekle
                        </button>
                    )}
                    {activeTab === 'checks' && (
                        <button onClick={() => setModalType('check')} className="h-[44px] px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-[14px] font-medium text-[14px] shadow-sm transition-colors flex items-center justify-center gap-2">
                            + Çek/Senet Ekle
                        </button>
                    )}
                    {activeTab === 'expenses' && (
                        <div className="flex gap-3">
                            <button onClick={() => setModalType('statement')} className={`h-[44px] px-6 rounded-[14px] font-medium text-[14px] border transition-colors flex items-center justify-center gap-2 ${theme === 'light' ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}>
                                Ekstre Yükle
                            </button>
                            <button onClick={() => setModalType('expense')} className="h-[44px] px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-[14px] font-medium text-[14px] shadow-sm transition-colors flex items-center justify-center gap-2">
                                + Gider Ekle
                            </button>
                        </div>
                    )}
                    {activeTab === 'banks' && (
                        <div className="flex gap-3">
                            <button onClick={() => syncAccount()} disabled={syncStates['GLOBAL'] === 'SYNCING'} className={`h-[44px] px-6 rounded-[14px] font-medium text-[14px] border transition-colors flex items-center justify-center gap-2 ${theme === 'light' ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}>
                                {syncStates['GLOBAL'] === 'SYNCING' ? 'Güncelleniyor...' : 'Senkronize Et'}
                            </button>
                            <button onClick={() => setModalType('account')} className="h-[44px] px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-[14px] font-medium text-[14px] shadow-sm transition-colors flex items-center justify-center gap-2">
                                + Manuel Hesap
                            </button>
                        </div>
                    )}
                </div>

                {/* Table Container */}
                <div style={glassStyle} className="rounded-[24px] p-6 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead className="sticky top-0 bg-transparent">
                                <tr className={`border-b ${theme === 'light' ? 'border-slate-200' : 'border-[rgba(96,165,250,0.15)]'}`}>
                                    <th className="h-[56px] px-4 text-left text-[11px] uppercase tracking-[0.08em] font-bold text-slate-500 align-middle">Müşteri / Cari</th>
                                    <th className="h-[56px] px-4 text-left text-[11px] uppercase tracking-[0.08em] font-bold text-slate-500 align-middle">Tip</th>
                                    <th className="h-[56px] px-4 text-left text-[11px] uppercase tracking-[0.08em] font-bold text-slate-500 align-middle">Vade / Tarih</th>
                                    <th className="h-[56px] px-4 text-right text-[11px] uppercase tracking-[0.08em] font-bold text-slate-500 align-middle">Tutar</th>
                                    <th className="h-[56px] px-4 text-right text-[11px] uppercase tracking-[0.08em] font-bold text-slate-500 align-middle">Durum</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[rgba(15,23,42,0.04)] dark:divide-[rgba(96,165,250,0.05)]">
                                {activeTab === 'receivables' && (
                                    <>
                                        {customers.filter(c => Number(c.balance) > 0).map((customer, i) => (
                                            <tr key={`cust-${i}`} className={`h-[56px] transition-colors ${theme === 'light' ? 'hover:bg-slate-50/50' : 'hover:bg-blue-500/5'}`}>
                                                {renderCell(customer.name)}
                                                {renderCell(renderBadge('Cari Alacak', 'bg-blue-500/10 text-blue-600 dark:text-blue-400'))}
                                                {renderCell(<span className="opacity-60">Açık Hesap</span>)}
                                                {renderCell(formatCurrency(customer.balance), "text-right", "font-semibold")}
                                                {renderCell(renderBadge('Tahsilat Bekliyor', 'bg-amber-500/10 text-amber-600 dark:text-amber-500'), "text-right")}
                                            </tr>
                                        ))}
                                        {suppliers.filter(s => Number(s.balance) > 0).map((supplier, i) => (
                                            <tr key={`supp-pos-${i}`} className={`h-[56px] transition-colors ${theme === 'light' ? 'hover:bg-slate-50/50' : 'hover:bg-blue-500/5'}`}>
                                                {renderCell(supplier.name)}
                                                {renderCell(renderBadge('Tedarikçi Fazlası', 'bg-slate-500/10 text-slate-600 dark:text-slate-400'))}
                                                {renderCell(<span className="opacity-60">Bakiye Fazlası</span>)}
                                                {renderCell(formatCurrency(supplier.balance), "text-right", "font-semibold")}
                                                {renderCell(renderBadge('Alacak', 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500'), "text-right")}
                                            </tr>
                                        ))}
                                        {checks.filter(c => c.type === 'In').map((check, i) => (
                                            <tr key={`check-${i}`} className={`h-[56px] transition-colors ${theme === 'light' ? 'hover:bg-slate-50/50' : 'hover:bg-blue-500/5'}`}>
                                                {renderCell(check.description || 'Çek/Senet')}
                                                {renderCell(renderBadge('Çek/Senet', 'bg-blue-500/10 text-blue-600 dark:text-blue-400'))}
                                                {renderCell(new Date(check.dueDate).toLocaleDateString('tr-TR'))}
                                                {renderCell(formatCurrency(check.amount), "text-right", "font-semibold")}
                                                {renderCell(renderBadge(check.status, 'bg-slate-500/10 text-slate-500 dark:text-slate-400'), "text-right")}
                                            </tr>
                                        ))}
                                    </>
                                )}

                                {activeTab === 'payables' && (
                                    <>
                                        {suppliers.filter(s => Number(s.balance) < 0).map((supplier, i) => (
                                            <tr key={`supp-${i}`} className={`h-[56px] transition-colors ${theme === 'light' ? 'hover:bg-slate-50/50' : 'hover:bg-blue-500/5'}`}>
                                                {renderCell(supplier.name)}
                                                {renderCell(renderBadge('Tedarikçi Kaydı', 'bg-slate-500/10 text-slate-600 dark:text-slate-400'))}
                                                {renderCell(<span className="opacity-60">Borç Bakiyesi</span>)}
                                                {renderCell(formatCurrency(Math.abs(Number(supplier.balance))), "text-right", "font-semibold")}
                                                {renderCell(renderBadge('Ödeme Yapılacak', 'bg-red-500/10 text-red-500 dark:text-red-400'), "text-right")}
                                            </tr>
                                        ))}
                                        {customers.filter(c => Number(c.balance) < 0).map((customer, i) => (
                                            <tr key={`cust-neg-${i}`} className={`h-[56px] transition-colors ${theme === 'light' ? 'hover:bg-slate-50/50' : 'hover:bg-blue-500/5'}`}>
                                                {renderCell(customer.name)}
                                                {renderCell(renderBadge('Müşteri Emaneti', 'bg-slate-500/10 text-slate-600 dark:text-slate-400'))}
                                                {renderCell(<span className="opacity-60">Müşteri Alacaklı</span>)}
                                                {renderCell(formatCurrency(Math.abs(Number(customer.balance))), "text-right", "font-semibold")}
                                                {renderCell(renderBadge('Ödeme Yapılacak', 'bg-red-500/10 text-red-500 dark:text-red-400'), "text-right")}
                                            </tr>
                                        ))}
                                        {checks.filter(c => c.type === 'Out').map((check, i) => (
                                            <tr key={`check-${i}`} className={`h-[56px] transition-colors ${theme === 'light' ? 'hover:bg-slate-50/50' : 'hover:bg-blue-500/5'}`}>
                                                {renderCell(check.description || 'Borç Çeki')}
                                                {renderCell(renderBadge('Çek/Senet', 'bg-slate-500/10 text-slate-600 dark:text-slate-400'))}
                                                {renderCell(new Date(check.dueDate).toLocaleDateString('tr-TR'))}
                                                {renderCell(formatCurrency(check.amount), "text-right", "font-semibold")}
                                                {renderCell(renderBadge(check.status, check.status === 'Ödendi' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500' : 'bg-red-500/10 text-red-500 dark:text-red-400'), "text-right")}
                                            </tr>
                                        ))}
                                    </>
                                )}

                                {activeTab === 'expenses' && (
                                    <>
                                        {transactions.filter(t => t.type === 'Expense').map((tx, i) => (
                                            <tr key={`exp-${i}`} className={`h-[56px] transition-colors ${theme === 'light' ? 'hover:bg-slate-50/50' : 'hover:bg-blue-500/5'}`}>
                                                {renderCell(tx.description)}
                                                {renderCell(renderBadge(tx.category || 'Genel Gider', 'bg-slate-500/10 text-slate-600 dark:text-slate-400'))}
                                                {renderCell(new Date(tx.date).toLocaleDateString('tr-TR'))}
                                                {renderCell(formatCurrency(tx.amount), "text-right", "font-semibold")}
                                                {renderCell(renderBadge('Gider', 'bg-red-500/10 text-red-500 dark:text-red-400'), "text-right")}
                                            </tr>
                                        ))}
                                    </>
                                )}

                                {activeTab === 'checks' && (
                                    <>
                                        {checks.map((check, i) => (
                                            <tr key={`ch-${i}`} className={`h-[56px] transition-colors ${theme === 'light' ? 'hover:bg-slate-50/50' : 'hover:bg-blue-500/5'}`}>
                                                {renderCell(check.description || 'Çek')}
                                                {renderCell(renderBadge(check.type === 'In' ? 'Alacak' : 'Borç', check.type === 'In' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'bg-slate-500/10 text-slate-600 dark:text-slate-400'))}
                                                {renderCell(new Date(check.dueDate).toLocaleDateString('tr-TR'))}
                                                {renderCell(formatCurrency(check.amount), "text-right", "font-semibold")}
                                                {renderCell(renderBadge(check.status, 'bg-slate-500/10 text-slate-500 dark:text-slate-400'), "text-right")}
                                            </tr>
                                        ))}
                                    </>
                                )}

                                {activeTab === 'banks' && (
                                    <>
                                        {kasalar.map((kasa, i) => (
                                            <tr key={`bn-${i}`} className={`h-[56px] transition-colors ${theme === 'light' ? 'hover:bg-slate-50/50' : 'hover:bg-blue-500/5'}`}>
                                                {renderCell(kasa.name)}
                                                {renderCell(renderBadge(kasa.type === 'bank' ? 'Banka' : 'Nakit', 'bg-slate-500/10 text-slate-600 dark:text-slate-400'))}
                                                {renderCell(kasa.branch || 'Merkez', "text-left opacity-60")}
                                                {renderCell(formatCurrency(kasa.balance), "text-right", "font-semibold")}
                                                {renderCell(renderBadge(kasa.bankConnectionId ? 'Bağlı' : 'Manuel', kasa.bankConnectionId ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500' : 'bg-slate-500/10 text-slate-500 dark:text-slate-400'), "text-right")}
                                            </tr>
                                        ))}
                                    </>
                                )}

                                {activeTab === 'transactions' && (
                                    <>
                                        {transactions.map((tx: any, i) => {
                                            const isIncome = ['Sales', 'Collection', 'SalesInvoice'].includes(tx.type);
                                            return (
                                                <tr key={`tx-${i}`} className={`h-[56px] transition-colors ${theme === 'light' ? 'hover:bg-slate-50/50' : 'hover:bg-blue-500/5'}`}>
                                                    {renderCell(tx.description || tx.type, "text-left align-middle max-w-[200px] truncate")}
                                                    {renderCell(renderBadge(isIncome ? 'Gelir' : 'Gider', isIncome ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500' : 'bg-slate-500/10 text-slate-600 dark:text-slate-400'))}
                                                    {renderCell(new Date(tx.date).toLocaleDateString('tr-TR'))}
                                                    {renderCell(formatCurrency(tx.amount), "text-right", "font-semibold")}
                                                    {renderCell(renderBadge('Onaylı', 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500'), "text-right")}
                                                </tr>
                                            );
                                        })}
                                    </>
                                )}

                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* 6. Bottom Panel (Planlı Alacaklar) */}
            <div style={glassStyle} className="w-full rounded-[24px] p-6 shadow-sm flex flex-col items-center justify-center min-h-[160px] relative">
                <div className="absolute top-6 left-6 right-6 flex justify-between items-center px-4">
                    <h3 className={`text-[16px] font-semibold tracking-tight ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>Planlı Alacaklar</h3>
                    <button className={`text-[13px] font-semibold transition-colors flex items-center gap-2 ${theme === 'light' ? 'text-blue-600 hover:text-blue-700' : 'text-blue-400 hover:text-blue-300'}`}>
                        + Planla
                    </button>
                </div>
                <div className="flex flex-col items-center mt-10">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${theme === 'light' ? 'bg-slate-100/50 text-slate-400' : 'bg-[rgba(96,165,250,0.1)] text-slate-500'}`}>
                        <Inbox className="w-5 h-5" />
                    </div>
                    <p className={`text-[13px] font-medium ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>Planlı alacak bulunmuyor.</p>
                </div>
            </div>
        </div>
    );
}
