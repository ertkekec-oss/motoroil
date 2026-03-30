"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useFinancials } from "@/contexts/FinancialContext";
import { useCRM } from "@/contexts/CRMContext";
import { formatCurrency } from "@/lib/utils";
import { ChevronDown, Plus, RefreshCw, CalendarDays, Inbox, ArrowDownLeft, ArrowUpRight, CopyPlus, Landmark, CreditCard, Activity, Send, Wallet, Settings2, FileText, CheckCircle2, Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useModal } from "@/contexts/ModalContext";
import AccountingModals from "./components/AccountingModals";

const TopPills = ({ pills }: any) => (
    <div className="flex flex-wrap items-center justify-center gap-4 mb-6 w-full">
        {pills.map((p: any, i: number) => (
            <div key={i} className={`flex items-center gap-3 bg-white dark:bg-[#0f172a] rounded-[24px] px-6 py-4 border border-slate-200 dark:border-white/5 shadow-sm min-w-[200px] shrink-0`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${p.bg} ${p.color}`}>
                    {p.icon}
                </div>
                <div className="flex flex-col justify-center">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-widest uppercase leading-tight mb-0.5">{p.title}</span>
                    <span className={`text-[18px] font-black truncate ${p.valueColor || 'text-slate-800 dark:text-white'} leading-tight`}>{p.value}</span>
                </div>
            </div>
        ))}
    </div>
);

const SoftContainer = ({ title, icon, children, className="", action }: any) => (
    <div className={`bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[24px] shadow-sm overflow-hidden flex flex-col ${className}`}>
        {title && (
            <div className="bg-[#f8fafc] dark:bg-[#1e293b]/50 text-[11px] font-bold text-slate-500 dark:text-slate-300 uppercase tracking-widest px-6 py-4 border-b border-slate-200 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {icon && <span className="opacity-70 text-slate-400">{icon}</span>}
                    {title}
                </div>
                {action && <div>{action}</div>}
            </div>
        )}
        <div className="flex-1 w-full relative">
            {children}
        </div>
    </div>
);

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

    const tabs = [
        { id: 'receivables', label: 'Alacaklar' },
        { id: 'payables', label: 'Borçlar' },
        { id: 'checks', label: 'Çek / Senet' },
        { id: 'banks', label: 'Banka' },
        { id: 'expenses', label: 'Giderler' },
        { id: 'transactions', label: 'Hareketler' }
    ];

    const handleCheckImageUpload = async (checkId: string, file: File) => {
        const loadingStr = 'upload_' + checkId;
        setSyncStates(prev => ({ ...prev, [loadingStr]: 'SYNCING' }));
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const res = await fetch(`/api/financials/checks/${checkId}/image`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.ok) {
                showSuccess('Başarılı', 'Görsel yüklendi');
                refreshData();
            } else {
                showError('Hata', data.error);
            }
        } catch (e) {
            showError('Hata', 'Görsel yüklenemedi');
        } finally {
            setSyncStates(prev => ({ ...prev, [loadingStr]: 'IDLE' }));
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 text-slate-900 dark:text-white pb-24 font-sans">
            <AccountingModals
                isOpen={!!modalType}
                onClose={() => setModalType(null)}
                type={modalType || ''}
            />

            <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-6 animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-white/5 pb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20">
                            <Landmark className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">FİNANSAL YÖNETİM</h1>
                             <div className="flex items-center gap-2 mt-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Mali Durum & Nakit Akışı</p>
                            </div>
                        </div>
                    </div>
                    
                    <button onClick={refreshData} className="px-5 py-2.5 bg-white dark:bg-[#1e293b]/50 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-full text-[11px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-2 outline-none">
                        <RefreshCw className={`w-3.5 h-3.5 ${isInitialLoading ? 'animate-spin' : ''}`} /> YENİLE
                    </button>
                </div>

                <TopPills pills={[
                    { title: 'TOPLAM ALACAK', value: formatCurrency(stats.totalReceivables), icon: <ArrowDownLeft className="w-5 h-5"/>, bg: 'bg-emerald-50 dark:bg-emerald-500/10', color: 'text-emerald-500', valueColor: 'text-emerald-600 dark:text-emerald-400' },
                    { title: 'TOPLAM BORÇ (ÖDEME)', value: formatCurrency(stats.totalPayables), icon: <ArrowUpRight className="w-5 h-5"/>, bg: 'bg-rose-50 dark:bg-rose-500/10', color: 'text-rose-500', valueColor: 'text-rose-600 dark:text-rose-400' },
                    { title: 'NET KASA DEĞERİ', value: formatCurrency(stats.netCash), icon: <Landmark className="w-5 h-5"/>, bg: 'bg-blue-50 dark:bg-blue-500/10', color: 'text-blue-500', valueColor: 'text-blue-600 dark:text-blue-400' },
                    { title: 'İŞLETME GİDERİ', value: formatCurrency(stats.totalExpenses), icon: <CreditCard className="w-5 h-5"/>, bg: 'bg-slate-100 dark:bg-slate-800/80', color: 'text-slate-500', valueColor: 'text-slate-700 dark:text-slate-300' }
                ]} />

                {/* Centered Actions Row */}
                <div className="flex items-center justify-center flex-wrap gap-3 mb-6 w-full">
                    {activeTab === 'receivables' && (
                        <button onClick={() => setModalType('collection')} className="h-[40px] px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-[12px] font-semibold text-[13px] shadow-sm transition-all flex items-center gap-2">
                            <Plus className="w-4 h-4"/> Tahsilat Ekle
                        </button>
                    )}
                    {activeTab === 'payables' && (
                        <button onClick={() => setModalType('debt')} className="h-[40px] px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-[12px] font-semibold text-[13px] shadow-sm transition-all flex items-center gap-2">
                            <Plus className="w-4 h-4"/> Ödeme Yap (Borç)
                        </button>
                    )}
                    {activeTab === 'checks' && (
                        <button onClick={() => setModalType('check')} className="h-[40px] px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-[12px] font-semibold text-[13px] shadow-sm transition-all flex items-center gap-2">
                            <Plus className="w-4 h-4"/> Çek / Senet Ekle
                        </button>
                    )}
                    {activeTab === 'expenses' && (
                        <>
                            <button onClick={() => setModalType('expense')} className="h-[40px] px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-[12px] font-semibold text-[13px] shadow-sm transition-all flex items-center gap-2">
                                <Plus className="w-4 h-4"/> Gider Ekle
                            </button>
                            <button onClick={() => setModalType('statement')} className="h-[40px] px-5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-[12px] font-semibold text-[13px] shadow-sm transition-all flex items-center gap-2">
                                <FileText className="w-4 h-4"/> Ekstre Yükle
                            </button>
                        </>
                    )}
                    {activeTab === 'banks' && (
                        <>
                            <button onClick={() => setModalType('account')} className="h-[40px] px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-[12px] font-semibold text-[13px] shadow-sm transition-all flex items-center gap-2">
                                <Plus className="w-4 h-4"/> Yeni Hesap Ekle
                            </button>
                            <button onClick={() => setModalType('transfer')} className="h-[40px] px-5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 hover:bg-slate-50 rounded-[12px] font-semibold text-[13px] transition-all flex items-center gap-2">
                                <Send className="w-4 h-4"/> Virman (Transfer)
                            </button>
                            <button onClick={() => syncAccount()} disabled={syncStates['GLOBAL'] === 'SYNCING'} className="h-[40px] px-5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-[12px] font-semibold text-[13px] shadow-sm transition-all flex items-center gap-2 disabled:opacity-50">
                                <RefreshCw className={`w-4 h-4 ${syncStates['GLOBAL'] === 'SYNCING' ? 'animate-spin' : ''}`}/> Aktarım
                            </button>
                        </>
                    )}
                    <button className="h-[40px] px-5 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 rounded-[12px] font-semibold text-[13px] transition-all flex items-center gap-2">
                        Dışa Aktar
                    </button>
                </div>

                {/* Centered Tabs Row */}
                <div className="flex flex-wrap items-center justify-center gap-1 mb-8 w-full border-b border-slate-200 dark:border-white/5 pb-6">
                    {tabs.map(tab => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-5 py-2 rounded-[16px] text-[13px] transition-all outline-none ${isActive ? 'bg-white font-bold text-slate-800 shadow-sm border border-slate-200 dark:bg-slate-800 dark:text-white dark:border-slate-700' : 'font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-[#1e293b]'}`}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Centered Search Bar & Filters */}
                <div className="flex items-center justify-center gap-3 w-full mb-8">
                    <div className="relative w-full max-w-[320px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input type="text" placeholder="Kayıt ara..." className="w-full h-[40px] pl-10 pr-4 rounded-[12px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-700 dark:text-slate-200 transition-shadow hover:shadow-sm" />
                    </div>
                    <div className="relative w-[140px]">
                        <select className="w-full h-[40px] pl-4 pr-10 rounded-[12px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[13px] font-medium text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer transition-shadow hover:shadow-sm">
                            <option>Tüm Dept.</option>
                            <option>Alacaklar</option>
                            <option>Borçlar</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                </div>

                <SoftContainer>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead className="bg-white dark:bg-[#0f172a] text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-4 w-12 border-b border-slate-200 dark:border-white/5">
                                        <div className="w-4 h-4 rounded-[6px] border-2 border-slate-200 dark:border-slate-700 bg-transparent"></div>
                                    </th>
                                    <th className="px-6 py-4 font-bold border-b border-slate-200 dark:border-white/5">MÜŞTERİ / CARİ / AÇIKLAMA</th>
                                    <th className="px-6 py-4 font-bold border-b border-slate-200 dark:border-white/5">DURUM TİPİ</th>
                                    <th className="px-6 py-4 font-bold border-b border-slate-200 dark:border-white/5">VADE / TARİH</th>
                                    <th className="px-6 py-4 font-bold text-right border-b border-slate-200 dark:border-white/5">TUTAR</th>
                                    <th className="px-6 py-4 font-bold text-right border-b border-slate-200 dark:border-white/5">MEVCUT DURUM</th>
                                    {activeTab === 'checks' && <th className="px-6 py-4 pr-8 font-bold text-right border-b border-slate-200 dark:border-white/5">AKSİYON</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {activeTab === 'receivables' && (
                                    <>
                                        {customers.filter(c => Number(c.balance) > 0).map((customer, i) => (
                                            <tr key={`cust-${i}`} className="hover:bg-slate-50 dark:hover:bg-[#1e293b]/80 transition-colors h-[72px] group">
                                                <td className="px-6 py-3 align-middle w-12">
                                                    <div className="w-4 h-4 rounded-[4px] border-2 border-slate-200 dark:border-slate-700 group-hover:border-slate-300 dark:group-hover:border-slate-600 transition-colors"></div>
                                                </td>
                                                <td className="px-6 py-3 align-middle whitespace-nowrap">
                                                    <div className="text-[13px] font-black text-slate-800 dark:text-white mb-0.5">{customer.name}</div>
                                                    <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Açık Hesap Carisi</div>
                                                </td>
                                                <td className="px-6 py-3 align-middle">
                                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">Cari Alacak</span>
                                                </td>
                                                <td className="px-6 py-3 text-[11px] font-bold tracking-widest text-slate-500">Açık Vade</td>
                                                <td className="px-6 py-3 text-[14px] font-black text-emerald-600 dark:text-emerald-400 text-right">{formatCurrency(customer.balance)}</td>
                                                <td className="px-6 py-3 text-right">
                                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">Tahsilat Bekliyor</span>
                                                </td>
                                            </tr>
                                        ))}
                                        {suppliers.filter(s => Number(s.balance) > 0).map((supplier, i) => (
                                            <tr key={`supp-pos-${i}`} className="hover:bg-slate-50 dark:hover:bg-[#1e293b]/80 transition-colors h-[72px] group">
                                                <td className="px-6 py-3 align-middle w-12">
                                                    <div className="w-4 h-4 rounded-[4px] border-2 border-slate-200 dark:border-slate-700 group-hover:border-slate-300 dark:group-hover:border-slate-600 transition-colors"></div>
                                                </td>
                                                <td className="px-6 py-3 align-middle whitespace-nowrap">
                                                    <div className="text-[13px] font-black text-slate-800 dark:text-white mb-0.5">{supplier.name}</div>
                                                    <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Fazla Gönderim (Emanet)</div>
                                                </td>
                                                <td className="px-6 py-3 align-middle">
                                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Tedarikçi Fazlası</span>
                                                </td>
                                                <td className="px-6 py-3 text-[11px] font-bold tracking-widest text-slate-500">Bakiye Fazlası</td>
                                                <td className="px-6 py-3 text-[14px] font-black text-blue-600 dark:text-blue-400 text-right">{formatCurrency(supplier.balance)}</td>
                                                <td className="px-6 py-3 text-right">
                                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">Alacaklı Konumundasınız</span>
                                                </td>
                                            </tr>
                                        ))}
                                        {checks.filter(c => c.type === 'In').map((check, i) => (
                                            <tr key={`check-${i}`} className="hover:bg-slate-50 dark:hover:bg-[#1e293b]/80 transition-colors h-[72px] group">
                                                <td className="px-6 py-3 align-middle w-12">
                                                    <div className="w-4 h-4 rounded-[4px] border-2 border-slate-200 dark:border-slate-700 group-hover:border-slate-300 dark:group-hover:border-slate-600 transition-colors"></div>
                                                </td>
                                                <td className="px-6 py-3 align-middle whitespace-nowrap">
                                                    <div className="text-[13px] font-black text-slate-800 dark:text-white mb-0.5">{check.description || 'Çek/Senet Kaydı'}</div>
                                                    <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Portföydeki Evrak</div>
                                                </td>
                                                <td className="px-6 py-3 align-middle">
                                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">Çek/Senet (Alınan)</span>
                                                </td>
                                                <td className="px-6 py-3 text-[11px] font-bold tracking-widest text-slate-500">{new Date(check.dueDate).toLocaleDateString('tr-TR')}</td>
                                                <td className="px-6 py-3 text-[14px] font-black text-emerald-600 dark:text-emerald-400 text-right">{formatCurrency(check.amount)}</td>
                                                <td className="px-6 py-3 text-right">
                                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">{check.status}</span>
                                                </td>
                                            </tr>
                                        ))}
                                        {(customers.filter(c => Number(c.balance) > 0).length + suppliers.filter(s => Number(s.balance) > 0).length + checks.filter(c => c.type === 'In').length) === 0 && (
                                            <tr><td colSpan={6} className="py-16 text-center text-[11px] font-bold uppercase tracking-widest text-slate-400">Alacak kaydı bulunmuyor.</td></tr>
                                        )}
                                    </>
                                )}

                                {activeTab === 'payables' && (
                                    <>
                                        {suppliers.filter(s => Number(s.balance) < 0).map((supplier, i) => (
                                            <tr key={`supp-${i}`} className="hover:bg-slate-50 dark:hover:bg-[#1e293b]/80 transition-colors h-[72px] group">
                                                <td className="px-6 py-3 align-middle w-12">
                                                    <div className="w-4 h-4 rounded-[4px] border-2 border-slate-200 dark:border-slate-700 group-hover:border-slate-300 dark:group-hover:border-slate-600 transition-colors"></div>
                                                </td>
                                                <td className="px-6 py-3 align-middle whitespace-nowrap">
                                                    <div className="text-[13px] font-black text-slate-800 dark:text-white mb-0.5">{supplier.name}</div>
                                                    <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Tedarikçi Borcu</div>
                                                </td>
                                                <td className="px-6 py-3 align-middle">
                                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">Tedarikçi Kaydı</span>
                                                </td>
                                                <td className="px-6 py-3 text-[11px] font-bold tracking-widest text-slate-500">Açık Vade</td>
                                                <td className="px-6 py-3 text-[14px] font-black text-rose-500 dark:text-rose-400 text-right">{formatCurrency(Math.abs(Number(supplier.balance)))}</td>
                                                <td className="px-6 py-3 text-right">
                                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">Ödeme Yapılacak</span>
                                                </td>
                                            </tr>
                                        ))}
                                        {customers.filter(c => Number(c.balance) < 0).map((customer, i) => (
                                            <tr key={`cust-neg-${i}`} className="hover:bg-slate-50 dark:hover:bg-[#1e293b]/80 transition-colors h-[72px] group">
                                                <td className="px-6 py-3 align-middle w-12">
                                                    <div className="w-4 h-4 rounded-[4px] border-2 border-slate-200 dark:border-slate-700 group-hover:border-slate-300 dark:group-hover:border-slate-600 transition-colors"></div>
                                                </td>
                                                <td className="px-6 py-3 align-middle whitespace-nowrap">
                                                    <div className="text-[13px] font-black text-slate-800 dark:text-white mb-0.5">{customer.name}</div>
                                                    <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Alınan Avans/Fazladan Ödeme</div>
                                                </td>
                                                <td className="px-6 py-3 align-middle">
                                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Müşteri Emaneti</span>
                                                </td>
                                                <td className="px-6 py-3 text-[11px] font-bold tracking-widest text-slate-500">Müşteri Alacaklı</td>
                                                <td className="px-6 py-3 text-[14px] font-black text-orange-500 dark:text-orange-400 text-right">{formatCurrency(Math.abs(Number(customer.balance)))}</td>
                                                <td className="px-6 py-3 text-right">
                                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">İade veya Mahsuplaşma</span>
                                                </td>
                                            </tr>
                                        ))}
                                        {checks.filter(c => c.type === 'Out').map((check, i) => (
                                            <tr key={`check-${i}`} className="hover:bg-slate-50 dark:hover:bg-[#1e293b]/80 transition-colors h-[72px] group">
                                                <td className="px-6 py-3 align-middle w-12">
                                                    <div className="w-4 h-4 rounded-[4px] border-2 border-slate-200 dark:border-slate-700 group-hover:border-slate-300 dark:group-hover:border-slate-600 transition-colors"></div>
                                                </td>
                                                <td className="px-6 py-3 align-middle whitespace-nowrap">
                                                    <div className="text-[13px] font-black text-slate-800 dark:text-white mb-0.5">{check.description || 'Borç Çeki'}</div>
                                                    <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Verilen Evrak</div>
                                                </td>
                                                <td className="px-6 py-3 align-middle">
                                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Çek/Senet (Verilen)</span>
                                                </td>
                                                <td className="px-6 py-3 text-[11px] font-bold tracking-widest text-slate-500">{new Date(check.dueDate).toLocaleDateString('tr-TR')}</td>
                                                <td className="px-6 py-3 text-[14px] font-black text-rose-500 dark:text-rose-400 text-right">{formatCurrency(check.amount)}</td>
                                                <td className="px-6 py-3 text-right">
                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase ${check.status === 'Ödendi' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'}`}>{check.status}</span>
                                                </td>
                                            </tr>
                                        ))}
                                        {(suppliers.filter(s => Number(s.balance) < 0).length + customers.filter(c => Number(c.balance) < 0).length + checks.filter(c => c.type === 'Out').length) === 0 && (
                                            <tr><td colSpan={6} className="py-16 text-center text-[11px] font-bold uppercase tracking-widest text-slate-400">Ödenecek borç kaydı bulunmuyor.</td></tr>
                                        )}
                                    </>
                                )}

                                {activeTab === 'expenses' && (
                                    <>
                                        {transactions.filter(t => t.type === 'Expense').map((tx, i) => (
                                            <tr key={`exp-${i}`} className="hover:bg-slate-50 dark:hover:bg-[#1e293b]/80 transition-colors h-[72px] group">
                                                <td className="px-6 py-3 align-middle w-12">
                                                    <div className="w-4 h-4 rounded-[4px] border-2 border-slate-200 dark:border-slate-700 group-hover:border-slate-300 dark:group-hover:border-slate-600 transition-colors"></div>
                                                </td>
                                                <td className="px-6 py-3 align-middle whitespace-nowrap">
                                                    <div className="text-[13px] font-black text-slate-800 dark:text-white mb-0.5">{tx.description}</div>
                                                    <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Dışarıya Nakit Çıkışı</div>
                                                </td>
                                                <td className="px-6 py-3 align-middle">
                                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">{tx.category || 'Genel Gider'}</span>
                                                </td>
                                                <td className="px-6 py-3 text-[11px] font-bold tracking-widest text-slate-500">{new Date(tx.date).toLocaleDateString('tr-TR')}</td>
                                                <td className="px-6 py-3 text-[14px] font-black text-rose-500 dark:text-rose-400 text-right">{formatCurrency(tx.amount)}</td>
                                                <td className="px-6 py-3 text-right">
                                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">GİDER</span>
                                                </td>
                                            </tr>
                                        ))}
                                        {transactions.filter(t => t.type === 'Expense').length === 0 && (
                                            <tr><td colSpan={6} className="py-16 text-center text-[11px] font-bold uppercase tracking-widest text-slate-400">Kaydedilmiş gider bulunmuyor.</td></tr>
                                        )}
                                    </>
                                )}

                                {activeTab === 'checks' && (
                                    <>
                                        {checks.map((check, i) => (
                                            <tr key={`ch-${i}`} className="hover:bg-slate-50 dark:hover:bg-[#1e293b]/80 transition-colors h-[72px] group">
                                                <td className="px-6 py-3 align-middle w-12">
                                                    <div className="w-4 h-4 rounded-[4px] border-2 border-slate-200 dark:border-slate-700 group-hover:border-slate-300 dark:group-hover:border-slate-600 transition-colors"></div>
                                                </td>
                                                <td className="px-6 py-3 align-middle whitespace-nowrap">
                                                    <div className="text-[13px] font-black text-slate-800 dark:text-white mb-0.5">{check.description || 'Kimliksiz Evrak'}</div>
                                                    <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{(check.type === 'In' || check.type.includes('Alınan')) ? 'Müşteriden Alınan' : 'Tedarikçiye Verilen'}</div>
                                                </td>
                                                <td className="px-6 py-3 align-middle">
                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase border ${
                                                        (check.type === 'In' || check.type.includes('Alınan')) 
                                                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' 
                                                        : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'
                                                    }`}>
                                                        {(check.type === 'In' || check.type.includes('Alınan')) ? 'ALINACAK BELGE (ALACAK)' : 'VERİLEN BELGE (BORÇ)'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3 text-[11px] font-bold tracking-widest text-slate-500">{new Date(check.dueDate).toLocaleDateString('tr-TR')}</td>
                                                <td className="px-6 py-3 text-[14px] font-black text-slate-800 dark:text-white text-right">{formatCurrency(check.amount)}</td>
                                                <td className="px-6 py-3 text-right">
                                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">{check.status}</span>
                                                </td>
                                                <td className="px-6 py-3 pr-8 align-middle text-right">
                                                    <div className="flex gap-2 justify-end items-center">
                                                        {check.type?.includes('Senet') ? (
                                                            (check as any).signatureStatus === 'İmzalandı' ? (
                                                                <button onClick={() => window.open((check as any).signedDocumentUrl, '_blank')} className="px-3 py-1.5 text-[9px] bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black tracking-widest rounded-full border border-emerald-200 dark:border-emerald-500/20 uppercase">İmzalı Belge (PDF)</button>
                                                            ) : (
                                                                <button onClick={() => window.open(`/signatures/envelopes/new?ref=${check.id}`, '_blank')} className="px-3 py-1.5 text-[9px] bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-black tracking-widest rounded-full border border-blue-200 dark:border-blue-500/20 uppercase whitespace-nowrap">İmzaya Sun (OTP)</button>
                                                            )
                                                        ) : (
                                                            <>
                                                                {(check as any).imageUrl && (
                                                                    <button onClick={() => window.open((check as any).imageUrl, '_blank')} className="px-3 py-1.5 text-[9px] bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-black tracking-widest rounded-full border border-indigo-200 dark:border-indigo-500/20 uppercase">Çek Resmi</button>
                                                                )}
                                                                {!((check as any).imageUrl) && (
                                                                    <>
                                                                        <input type="file" id={`upload-${check.id}`} className="hidden" accept="image/*,.pdf" onChange={(e) => { if (e.target.files?.[0]) handleCheckImageUpload(check.id, e.target.files[0]) }} />
                                                                        <label htmlFor={`upload-${check.id}`} className="cursor-pointer px-3 py-1.5 text-[9px] bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-black tracking-widest rounded-full border border-amber-200 dark:border-amber-500/20 uppercase whitespace-nowrap inline-flex items-center gap-1">
                                                                            {syncStates['upload_' + check.id] === 'SYNCING' ? 'YÜKLENİYOR...' : 'GÖRSEL YÜKLE'}
                                                                        </label>
                                                                    </>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {checks.length === 0 && (
                                            <tr><td colSpan={7} className="py-16 text-center text-[11px] font-bold uppercase tracking-widest text-slate-400">Çek veya senet kaydı bulunmuyor.</td></tr>
                                        )}
                                    </>
                                )}

                                {activeTab === 'banks' && (
                                    <>
                                        {kasalar.map((kasa, i) => (
                                            <tr key={`bn-${i}`} onClick={() => window.location.href = `/accounting/kasalar/${kasa.id}`} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-[#1e293b]/80 transition-colors h-[72px] group">
                                                <td className="px-6 py-3 align-middle w-12">
                                                    <div className="w-4 h-4 rounded-[4px] border-2 border-slate-200 dark:border-slate-700 group-hover:border-slate-300 dark:group-hover:border-slate-600 transition-colors"></div>
                                                </td>
                                                <td className="px-6 py-3 align-middle whitespace-nowrap">
                                                    <div className="text-[13px] font-black text-slate-800 dark:text-white mb-0.5">{kasa.name}</div>
                                                    <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{kasa.branch || 'Merkez Kasası'}</div>
                                                </td>
                                                <td className="px-6 py-3 align-middle">
                                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">{kasa.type === 'bank' ? 'Banka Hesabı' : 'Nakit Kasa'}</span>
                                                </td>
                                                <td className="px-6 py-3 text-[11px] font-bold tracking-widest text-slate-500">Mevcut Bakiye</td>
                                                <td className="px-6 py-3 text-[14px] font-black text-emerald-600 dark:text-emerald-400 text-right">{formatCurrency(kasa.balance)}</td>
                                                <td className="px-6 py-3 pr-8 text-right">
                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase border ${
                                                        kasa.bankConnectionId 
                                                        ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20' 
                                                        : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                                                    }`}>
                                                        {kasa.bankConnectionId ? 'Açık Bankacılık' : 'Manuel Hesap'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {kasalar.length === 0 && (
                                            <tr><td colSpan={6} className="py-16 text-center text-[11px] font-bold uppercase tracking-widest text-slate-400">Kasa veya banka tanımlı değil.</td></tr>
                                        )}
                                    </>
                                )}

                                {activeTab === 'transactions' && (
                                    <>
                                        {transactions.map((tx: any, i) => {
                                            const isIncome = ['Sales', 'Collection', 'SalesInvoice'].includes(tx.type);
                                            return (
                                                <tr key={`tx-${i}`} className="hover:bg-slate-50 dark:hover:bg-[#1e293b]/80 transition-colors h-[72px] group">
                                                    <td className="px-6 py-3 align-middle w-12">
                                                        <div className="w-4 h-4 rounded-[4px] border-2 border-slate-200 dark:border-slate-700 group-hover:border-slate-300 dark:group-hover:border-slate-600 transition-colors"></div>
                                                    </td>
                                                    <td className="px-6 py-3 align-middle whitespace-nowrap">
                                                        <div className="text-[13px] font-black text-slate-800 dark:text-white mb-0.5 truncate max-w-[300px]">{tx.description || tx.type}</div>
                                                        <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Genel Hareket</div>
                                                    </td>
                                                    <td className="px-6 py-3 align-middle">
                                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase border ${
                                                            isIncome 
                                                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' 
                                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                                        }`}>
                                                            {isIncome ? 'TAHSİLAT (GELİR)' : 'GİDER / ÇIKIŞ'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3 text-[11px] font-bold tracking-widest text-slate-500">{new Date(tx.date).toLocaleDateString('tr-TR')}</td>
                                                    <td className="px-6 py-3 text-[14px] font-black text-slate-800 dark:text-white text-right">{formatCurrency(tx.amount)}</td>
                                                    <td className="px-6 py-3 pr-8 text-right">
                                                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">Onaylı</span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {transactions.length === 0 && (
                                            <tr><td colSpan={6} className="py-16 text-center text-[11px] font-bold uppercase tracking-widest text-slate-400">Son hareket bulunmuyor.</td></tr>
                                        )}
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>
                </SoftContainer>
            </div>
        </div>
    );
}
