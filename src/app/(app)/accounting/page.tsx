"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useFinancials } from "@/contexts/FinancialContext";
import { useCRM } from "@/contexts/CRMContext";
import { formatCurrency } from "@/lib/utils";
import { ChevronDown, Plus, RefreshCw, CalendarDays, Inbox, ArrowDownLeft, ArrowUpRight, CopyPlus, Landmark, CreditCard, Activity, Send, Wallet, Settings2, FileText, CheckCircle2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useModal } from "@/contexts/ModalContext";
import AccountingModals from "./components/AccountingModals";

const TopPills = ({ pills }: any) => (
    <div className="flex flex-wrap items-center gap-4 shrink-0 mb-8 w-full overflow-x-auto pb-2 custom-scroll">
        {pills.map((p: any, i: number) => (
            <div key={i} className={`flex flex-1 min-w-[220px] bg-white dark:bg-[#0f172a] rounded-[24px] pl-4 pr-6 py-4 items-center gap-4 transition-transform hover:-translate-y-1 hover:shadow-md border border-slate-200 dark:border-white/5 shadow-sm group shrink-0`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${p.bg} ${p.color} transition-colors`}>
                    {p.icon}
                </div>
                <div className="flex flex-col justify-center overflow-hidden">
                    <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 tracking-widest uppercase mb-1 line-clamp-1">{p.title}</span>
                    <span className={`text-[16px] xl:text-[20px] font-black truncate ${p.valueColor || 'text-slate-800 dark:text-white'} leading-tight`}>{p.value}</span>
                </div>
            </div>
        ))}
    </div>
);

const SoftContainer = ({ title, icon, children, className="", action }: any) => (
    <div className={`bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[24px] shadow-sm overflow-hidden flex flex-col ${className}`}>
        {title && (
            <div className="bg-[#f8fafc] dark:bg-[#1e293b]/50 text-[11px] font-bold text-slate-500 dark:text-slate-300 uppercase tracking-widest px-6 py-4 border-b border-slate-200 dark:border-white/5 sticky top-0 z-20 flex items-center justify-between relative">
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

                <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-[#0f172a] p-2 rounded-[20px] border border-slate-200 dark:border-white/5 shadow-sm">
                    <div className="flex bg-slate-100 dark:bg-[#1e293b]/50 p-1.5 rounded-full w-full md:w-auto overflow-x-auto shadow-inner border border-slate-200/50 dark:border-white/5 custom-scroll">
                    {tabs.map(tab => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 min-w-[120px] h-11 rounded-full text-[11px] font-black uppercase tracking-widest transition-all outline-none ${isActive ? 'bg-white text-indigo-600 shadow-sm dark:bg-indigo-500/20 dark:text-indigo-400 border border-slate-200 dark:border-indigo-500/30' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 border border-transparent'}`}
                            >
                                {tab.label}
                            </button>
                            );
                        })}
                    </div>
                    
                    <div className="flex items-center pr-2">
                        {activeTab === 'receivables' && (
                            <button onClick={() => setModalType('collection')} className="h-[38px] px-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-sm shadow-emerald-500/20 transition-all flex items-center gap-2">
                                <ArrowDownLeft className="w-3.5 h-3.5"/> TAHSİLAT EKLE
                            </button>
                        )}
                        {activeTab === 'payables' && (
                            <button onClick={() => setModalType('debt')} className="h-[38px] px-6 bg-rose-500 hover:bg-rose-600 text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-sm shadow-rose-500/20 transition-all flex items-center gap-2">
                                <ArrowUpRight className="w-3.5 h-3.5"/> ÖDEME YAP (BORÇ)
                            </button>
                        )}
                        {activeTab === 'checks' && (
                            <button onClick={() => setModalType('check')} className="h-[38px] px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-sm shadow-blue-500/20 transition-all flex items-center gap-2">
                                <CopyPlus className="w-3.5 h-3.5"/> ÇEK / SENET EKLE
                            </button>
                        )}
                        {activeTab === 'expenses' && (
                            <div className="flex gap-2">
                                <button onClick={() => setModalType('statement')} className="h-[38px] px-5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-full font-black text-[10px] uppercase tracking-widest shadow-sm transition-all flex items-center gap-2">
                                    <FileText className="w-3.5 h-3.5"/> EKSTRE YÜKLE
                                </button>
                                <button onClick={() => setModalType('expense')} className="h-[38px] px-6 bg-orange-500 hover:bg-orange-600 text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-sm shadow-orange-500/20 transition-all flex items-center gap-2">
                                    <Plus className="w-3.5 h-3.5"/> GİDER EKLE
                                </button>
                            </div>
                        )}
                        {activeTab === 'banks' && (
                            <div className="flex gap-2">
                                <button onClick={() => setModalType('transfer')} className="h-[38px] px-5 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-full font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 border border-indigo-200 dark:border-indigo-500/20">
                                    <Send className="w-3.5 h-3.5"/> VİRMAN (TRANSFER)
                                </button>
                                <button onClick={() => syncAccount()} disabled={syncStates['GLOBAL'] === 'SYNCING'} className="h-[38px] px-5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-full font-black text-[10px] uppercase tracking-widest shadow-sm transition-all flex items-center gap-2 disabled:opacity-50">
                                    <RefreshCw className={`w-3.5 h-3.5 ${syncStates['GLOBAL'] === 'SYNCING' ? 'animate-spin' : ''}`}/> AKTARIM
                                </button>
                                <button onClick={() => setModalType('account')} className="h-[38px] px-6 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-sm transition-all flex items-center gap-2">
                                    <Plus className="w-3.5 h-3.5"/> YENİ HESAP EKLE
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <SoftContainer title="FİNANSAL VERİ LİSTESİ" icon={<Settings2 className="w-4 h-4"/>}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead className="bg-[#f8fafc] dark:bg-[#1e293b]/50 text-[10px] font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-widest sticky top-0 z-10">
                                <tr>
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
                                            <tr><td colSpan={5} className="py-16 text-center text-[11px] font-bold uppercase tracking-widest text-slate-400">Alacak kaydı bulunmuyor.</td></tr>
                                        )}
                                    </>
                                )}

                                {activeTab === 'payables' && (
                                    <>
                                        {suppliers.filter(s => Number(s.balance) < 0).map((supplier, i) => (
                                            <tr key={`supp-${i}`} className="hover:bg-slate-50 dark:hover:bg-[#1e293b]/80 transition-colors h-[72px] group">
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
                                            <tr><td colSpan={5} className="py-16 text-center text-[11px] font-bold uppercase tracking-widest text-slate-400">Ödenecek borç kaydı bulunmuyor.</td></tr>
                                        )}
                                    </>
                                )}

                                {activeTab === 'expenses' && (
                                    <>
                                        {transactions.filter(t => t.type === 'Expense').map((tx, i) => (
                                            <tr key={`exp-${i}`} className="hover:bg-slate-50 dark:hover:bg-[#1e293b]/80 transition-colors h-[72px] group">
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
                                            <tr><td colSpan={5} className="py-16 text-center text-[11px] font-bold uppercase tracking-widest text-slate-400">Kaydedilmiş gider bulunmuyor.</td></tr>
                                        )}
                                    </>
                                )}

                                {activeTab === 'checks' && (
                                    <>
                                        {checks.map((check, i) => (
                                            <tr key={`ch-${i}`} className="hover:bg-slate-50 dark:hover:bg-[#1e293b]/80 transition-colors h-[72px] group">
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
                                            <tr><td colSpan={6} className="py-16 text-center text-[11px] font-bold uppercase tracking-widest text-slate-400">Çek veya senet kaydı bulunmuyor.</td></tr>
                                        )}
                                    </>
                                )}

                                {activeTab === 'banks' && (
                                    <>
                                        {kasalar.map((kasa, i) => (
                                            <tr key={`bn-${i}`} onClick={() => window.location.href = `/accounting/kasalar/${kasa.id}`} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-[#1e293b]/80 transition-colors h-[72px] group">
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
                                            <tr><td colSpan={5} className="py-16 text-center text-[11px] font-bold uppercase tracking-widest text-slate-400">Kasa veya banka tanımlı değil.</td></tr>
                                        )}
                                    </>
                                )}

                                {activeTab === 'transactions' && (
                                    <>
                                        {transactions.map((tx: any, i) => {
                                            const isIncome = ['Sales', 'Collection', 'SalesInvoice'].includes(tx.type);
                                            return (
                                                <tr key={`tx-${i}`} className="hover:bg-slate-50 dark:hover:bg-[#1e293b]/80 transition-colors h-[72px] group">
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
                                            <tr><td colSpan={5} className="py-16 text-center text-[11px] font-bold uppercase tracking-widest text-slate-400">Son hareket bulunmuyor.</td></tr>
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
