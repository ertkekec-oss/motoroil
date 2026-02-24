"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useFinancials } from "@/contexts/FinancialContext";
import { useCRM } from "@/contexts/CRMContext";
import { formatCurrency } from "@/lib/utils";
import { Sun, Moon } from "lucide-react";

import { useSearchParams } from "next/navigation";
import { useModal } from "@/contexts/ModalContext";
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

    const { customers, suppliers, refreshCustomers, refreshSuppliers } = useCRM(); // Get CRM data

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

    const [posTheme, setPosTheme] = useState<'dark' | 'light'>('dark');

    // Theme Sync
    useEffect(() => {
        const savedTheme = localStorage.getItem('pos-theme') as 'dark' | 'light';
        if (savedTheme) setPosTheme(savedTheme);
    }, []);

    const togglePosTheme = () => {
        const newTheme = posTheme === 'dark' ? 'light' : 'dark';
        setPosTheme(newTheme);
        localStorage.setItem('pos-theme', newTheme);
    };

    useEffect(() => {
        if (posTheme === 'light') {
            document.body.style.background = '#F7F9FC';
            document.body.style.color = '#1A1F36';
        } else {
            document.body.style.background = 'var(--bg-deep)';
            document.body.style.color = 'var(--text-main)';
        }
        return () => {
            document.body.style.background = 'var(--bg-deep)';
            document.body.style.color = 'var(--text-main)';
        };
    }, [posTheme]);

    // Sync activeTab with URL is optional but helpful
    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab) setActiveTab(tab);
        if (tab === 'banks') findDuplicates();
    }, [searchParams]);

    // ... rest of the component ...
    // Note: I will only replace the banks tab content below

    // Calculate Stats
    const stats = React.useMemo(() => {
        // Alacaklar: Tahsil edilmemiş Çekler + Müşteri Bakiyeleri (Pozitif) + Tedarikçi Bakiyeleri (Pozitif - Fazla Ödediğimiz)
        const checkReceivables = checks.filter(c => c.type === 'In' && c.status !== 'Tahsil Edildi').reduce((sum, c) => sum + c.amount, 0);
        const customerReceivables = customers.reduce((sum, c) => sum + (Number(c.balance) > 0 ? Number(c.balance) : 0), 0);
        const supplierReceivables = suppliers.reduce((sum, s) => sum + (Number(s.balance) > 0 ? Number(s.balance) : 0), 0);
        const totalReceivables = checkReceivables + customerReceivables + supplierReceivables;

        // Borçlar: Ödenmemiş Çekler + Tedarikçi Bakiyeleri (Negatif - Borcumuz) + Müşteri Bakiyeleri (Negatif - Alacaklı Müşteri)
        const checkPayables = checks.filter(c => c.type === 'Out' && c.status !== 'Ödendi').reduce((sum, c) => sum + c.amount, 0);
        const supplierPayables = suppliers.reduce((sum, s) => sum + (Number(s.balance) < 0 ? Math.abs(Number(s.balance)) : 0), 0);
        const customerPayables = customers.reduce((sum, c) => sum + (Number(c.balance) < 0 ? Math.abs(Number(c.balance)) : 0), 0);
        const totalPayables = checkPayables + supplierPayables + customerPayables;

        const totalExpenses = transactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0);
        const netCash = kasalar.reduce((sum, k) => sum + k.balance, 0);

        return {
            totalReceivables,
            totalPayables,
            totalExpenses,
            netCash
        };
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

    const cards = [
        {
            title: "TOPLAM ALACAKLAR",
            value: stats.totalReceivables,
            desc: "Cari hesaplar ve planlı alacaklar", // Updated description
            icon: "🗓️",
            color: "text-blue-400",
            bg: "bg-blue-500/10",
            border: "border-blue-500/20"
        },
        {
            title: "TOPLAM ÖDEMELER",
            value: stats.totalPayables,
            desc: "Tedarikçi borçları ve ödemeler", // Updated description
            icon: "💸",
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
            border: "border-emerald-500/20"
        },
        {
            title: "TOPLAM GİDERLER",
            value: stats.totalExpenses,
            desc: "Kasa ve bankadan çıkan giderler",
            icon: "📉",
            color: "text-rose-400",
            bg: "bg-rose-500/10",
            border: "border-rose-500/20"
        },
        {
            title: "NET KASA DURUMU",
            value: stats.netCash,
            desc: "Anlık kasa ve banka toplamları",
            icon: "💰",
            color: "text-amber-400",
            bg: "bg-amber-500/10",
            border: "border-amber-500/20"
        }
    ];

    return (
        <div data-pos-theme={posTheme} className="w-full min-h-screen p-6 md:p-8 space-y-8 transition-colors duration-300">
            <AccountingModals
                isOpen={!!modalType}
                onClose={() => setModalType(null)}
                type={modalType || ''}
                posTheme={posTheme}
            />

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className={posTheme === 'light' ? "text-3xl font-black text-slate-800 mb-2" : "text-3xl font-bold text-white mb-2"}>Muhasebe & Finans</h1>
                    <p className={posTheme === 'light' ? "text-slate-500 font-medium" : "text-white/60"}>Nakit akışı, cari hesaplar ve kasa yönetimi</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={togglePosTheme}
                        className="p-3 rounded-xl glass border border-pos hover:bg-white/10 transition-all shadow-pos flex items-center justify-center bg-white/5"
                        title={posTheme === 'dark' ? 'Aydınlık Mod' : 'Karanlık Mod'}
                    >
                        {posTheme === 'dark' ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-primary" />}
                    </button>
                    <button
                        onClick={() => refreshData()}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white transition-all active:scale-95"
                    >
                        {isInitialLoading ? "🔄 Yenileniyor..." : "🔄 Verileri Yenile"}
                    </button>
                </div>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, idx) => (
                    <div
                        key={idx}
                        className={`p-6 rounded-2xl border ${card.border} ${card.bg} card glass backdrop-blur-sm relative overflow-hidden group hover:scale-[1.02] transition-all duration-300`}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-xs font-bold tracking-wider text-white/40">{card.title}</span>
                            <span className="text-2xl opacity-80 group-hover:scale-110 transition-transform">{card.icon}</span>
                        </div>
                        <div className={`text-3xl font-black mb-2 ${card.color}`}>
                            {formatCurrency(card.value)}
                        </div>
                        <p className="text-xs text-white/40">{card.desc}</p>
                    </div>
                ))}
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2 p-1 bg-white/5 rounded-xl border border-white/10 w-fit">
                {['TÜMÜ', 'BUGÜN', 'BU HAFTA', 'BU AY', 'ÖZEL TARİH'].map((filter) => (
                    <button
                        key={filter}
                        className="px-4 py-1.5 text-xs font-medium rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                    >
                        {filter}
                    </button>
                ))}
            </div>

            {/* Main Content Tabs */}
            <div className="flex flex-wrap gap-4 border-b border-white/10 pb-1">
                {[
                    { id: 'receivables', label: 'Alacaklar', color: 'bg-orange-600' },
                    { id: 'payables', label: 'Borçlar', color: 'bg-rose-600' },
                    { id: 'checks', label: 'Çek & Senet', color: 'bg-indigo-600' },
                    { id: 'banks', label: 'Banka & Kasa', color: 'bg-emerald-600' },
                    { id: 'expenses', label: 'Giderler', color: 'bg-rose-600' },
                    { id: 'transactions', label: 'Finansal Hareketler', color: 'bg-slate-600' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-sm ${activeTab === tab.id
                            ? `${tab.color} text-white shadow-lg scale-105`
                            : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="card glass border border-white/5 rounded-2xl p-6 min-h-[400px]">
                {activeTab === 'receivables' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white">Alacak Takibi (Cari & Çek)</h3>
                            <button
                                onClick={() => setModalType('collection')}
                                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium text-sm transition-colors shadow-lg shadow-orange-900/20"
                            >
                                + Tahsilat Ekle
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-white/70">
                                <thead className="text-xs font-bold text-white/30 uppercase border-b border-white/5">
                                    <tr>
                                        <th className="py-3">Müşteri / Açıklama</th>
                                        <th className="py-3">Tip</th>
                                        <th className="py-3 text-center">Vade / Son İşlem</th>
                                        <th className="py-3 text-right">Tutar</th>
                                        <th className="py-3 text-right">Durum</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {/* Müşteri CARİLERİ (Pozitif) */}
                                    {customers.filter(c => Number(c.balance) > 0).map((customer, i) => (
                                        <tr key={`cust-${i}`} className="hover:bg-white/5">
                                            <td className="py-3 font-bold text-white">{customer.name}</td>
                                            <td className="py-3"><span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-orange-500/10 text-orange-400 tracking-wide">MÜŞTERİ CARİ</span></td>
                                            <td className="py-3 text-center opacity-50 text-xs">Açık Hesap</td>
                                            <td className="py-3 text-right font-black text-white">{formatCurrency(customer.balance)}</td>
                                            <td className="py-3 text-right"><span className="text-[10px] font-bold uppercase text-orange-400">TAHSİLAT BEKLİYOR</span></td>
                                        </tr>
                                    ))}

                                    {/* Tedarikçi CARİLERİ (Pozitif - İade veya Fazla Ödeme) */}
                                    {suppliers.filter(s => Number(s.balance) > 0).map((supplier, i) => (
                                        <tr key={`supp-pos-${i}`} className="hover:bg-white/5">
                                            <td className="py-3 font-bold text-white">{supplier.name}</td>
                                            <td className="py-3"><span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-blue-500/10 text-blue-400 tracking-wide">TEDARİKÇİ CARİ</span></td>
                                            <td className="py-3 text-center opacity-50 text-xs">Alacak Bakiyesi</td>
                                            <td className="py-3 text-right font-black text-emerald-400">{formatCurrency(supplier.balance)}</td>
                                            <td className="py-3 text-right"><span className="text-[10px] font-bold uppercase text-emerald-400">ALACAĞIMIZ VAR</span></td>
                                        </tr>
                                    ))}

                                    {/* ÇEKLER */}
                                    {checks.filter(c => c.type === 'In').map((check, i) => (
                                        <tr key={`check-${i}`} className="hover:bg-white/5">
                                            <td className="py-3 font-medium text-white">{check.description || 'Çek/Senet'} {check.customer ? `(${check.customer.name})` : ''}</td>
                                            <td className="py-3"><span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-blue-500/10 text-blue-400 tracking-wide">ÇEK/SENET</span></td>
                                            <td className="py-3 text-center">{new Date(check.dueDate).toLocaleDateString('tr-TR')}</td>
                                            <td className="py-3 text-right font-black text-white">{formatCurrency(check.amount)}</td>
                                            <td className="py-3 text-right text-xs opacity-70">{check.status}</td>
                                        </tr>
                                    ))}

                                    {customers.filter(c => Number(c.balance) > 0).length === 0 && checks.filter(c => c.type === 'In').length === 0 && (
                                        <tr><td colSpan={5} className="text-center py-8 text-white/30">Alacak kaydı bulunamadı.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'payables' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white">Borç Takibi (Tedarikçi & Çek)</h3>
                            <button
                                onClick={() => setModalType('debt')}
                                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium text-sm transition-colors shadow-lg shadow-rose-900/20"
                            >
                                + Borç Ekle
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-white/70">
                                <thead className="text-xs font-bold text-white/30 uppercase border-b border-white/5">
                                    <tr>
                                        <th className="py-3">Tedarikçi / Açıklama</th>
                                        <th className="py-3">Tip</th>
                                        <th className="py-3 text-center">Vade / Son İşlem</th>
                                        <th className="py-3 text-center">Tutar</th>
                                        <th className="py-3 text-right">Durum</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {/* Tedarikçi CARİLERİ (Negatif) */}
                                    {suppliers.filter(s => Number(s.balance) < 0).map((supplier, i) => (
                                        <tr key={`supp-${i}`} className="hover:bg-white/5">
                                            <td className="py-3 font-medium text-white">{supplier.name}</td>
                                            <td className="py-3"><span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-rose-500/10 text-rose-400 tracking-wide">TEDARİKÇİ CARİ</span></td>
                                            <td className="py-3 text-center opacity-50 text-xs">Borç Bakiyesi</td>
                                            <td className="py-3 text-center font-bold text-rose-400">{formatCurrency(Math.abs(Number(supplier.balance)))}</td>
                                            <td className="py-3 text-right">
                                                <span className="text-[10px] font-bold uppercase text-rose-400">ÖDEME YAPILACAK</span>
                                            </td>
                                        </tr>
                                    ))}

                                    {/* Müşteri CARİLERİ (Negatif - Alacaklı Müşteri) */}
                                    {customers.filter(c => Number(c.balance) < 0).map((customer, i) => (
                                        <tr key={`cust-neg-${i}`} className="hover:bg-white/5">
                                            <td className="py-3 font-medium text-white">{customer.name}</td>
                                            <td className="py-3"><span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-amber-500/10 text-amber-400 tracking-wide">MÜŞTERİ CARİ</span></td>
                                            <td className="py-3 text-center opacity-50 text-xs">Emanet/Bakiye</td>
                                            <td className="py-3 text-center font-bold text-amber-400">{formatCurrency(Math.abs(Number(customer.balance)))}</td>
                                            <td className="py-3 text-right">
                                                <span className="text-[10px] font-bold uppercase text-amber-400">MÜŞTERİ ALACAKLI</span>
                                            </td>
                                        </tr>
                                    ))}

                                    {/* ÇEKLER */}
                                    {checks.filter(c => c.type === 'Out').map((check, i) => (
                                        <tr key={`check-${i}`} className="hover:bg-white/5">
                                            <td className="py-3 font-medium text-white">{check.description || 'Borç Kaydı'}</td>
                                            <td className="py-3"><span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-rose-500/10 text-rose-400 tracking-wide">ÇEK/SENET</span></td>
                                            <td className="py-3 text-center">{new Date(check.dueDate).toLocaleDateString('tr-TR')}</td>
                                            <td className="py-3 text-center font-bold text-rose-400">{formatCurrency(check.amount)}</td>
                                            <td className="py-3 text-right">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${check.status === 'Ödendi' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                                    {check.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}

                                    {suppliers.filter(s => Number(s.balance) > 0).length === 0 && checks.filter(c => c.type === 'Out').length === 0 && (
                                        <tr><td colSpan={5} className="text-center py-8 text-white/30">Borç kaydı bulunamadı.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'checks' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white">Çek & Senet Listesi</h3>
                            <button
                                onClick={() => setModalType('check')}
                                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium text-sm transition-colors"
                            >
                                + Çek/Senet Ekle
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-white/70">
                                <thead className="text-xs font-bold text-white/30 uppercase border-b border-white/5">
                                    <tr>
                                        <th className="py-3">Tip</th>
                                        <th className="py-3">Açıklama</th>
                                        <th className="py-3 text-center">Vade</th>
                                        <th className="py-3 text-center">Tutar</th>
                                        <th className="py-3 text-right">Durum</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {checks.map((check, i) => (
                                        <tr key={i} className="hover:bg-white/5">
                                            <td className="py-3">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${check.type === 'In' ? 'bg-blue-500/10 text-blue-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                                    {check.type === 'In' ? 'ALACAK' : 'BORÇ'}
                                                </span>
                                            </td>
                                            <td className="py-3 font-medium text-white">{check.description}</td>
                                            <td className="py-3 text-center">{new Date(check.dueDate).toLocaleDateString('tr-TR')}</td>
                                            <td className="py-3 text-center font-bold text-white">{formatCurrency(check.amount)}</td>
                                            <td className="py-3 text-right text-xs opacity-70">{check.status}</td>
                                        </tr>
                                    ))}
                                    {checks.length === 0 && (
                                        <tr><td colSpan={5} className="text-center py-8 text-white/30">Çek/Senet kaydı bulunamadı.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'banks' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                        {/* Merge Alerts */}
                        {duplicates.length > 0 && (
                            <div className="space-y-2">
                                {duplicates.map((dup, idx) => (
                                    <div key={idx} className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl flex items-center justify-between animate-pulse">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl">🔗</span>
                                            <div>
                                                <p className="text-sm font-bold text-amber-200">Duplicate IBAN Tespit Edildi!</p>
                                                <p className="text-xs text-amber-200/70">
                                                    <b>{dup.kasaName}</b> manuel hesabı, <b>{dup.bankName}</b> entegrasyonu ile aynı IBAN'a sahip.
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleMerge(dup)}
                                            className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/40 text-amber-400 text-xs font-black rounded-lg transition-all"
                                        >
                                            HESAPLARI BİRLEŞTİR
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <span className="bg-amber-500/10 p-2 rounded-lg text-amber-400">💰</span>
                                Kasa & Banka Merkezi
                            </h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => syncAccount()}
                                    disabled={syncStates['GLOBAL'] === 'SYNCING'}
                                    className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 border ${syncStates['GLOBAL'] === 'SYNCING' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                                        syncStates['GLOBAL'] === 'DONE' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                                            'bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border-emerald-500/30'
                                        }`}
                                >
                                    {syncStates['GLOBAL'] === 'SYNCING' ? '🔄 AKTARILIYOR...' : '🔄 TAMAMINI GÜNCELLE'}
                                </button>
                                <Link
                                    href="/fintech/open-banking"
                                    className="px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 border border-indigo-500/30 rounded-xl font-bold text-xs transition-all flex items-center gap-2"
                                >
                                    🔗 Banka Bağla
                                </Link>
                                <button
                                    onClick={() => setModalType('account')}
                                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl font-bold text-xs transition-all"
                                >
                                    + Manuel Hesap
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {kasalar.map((kasa, i) => (
                                <div
                                    key={i}
                                    className={`group relative p-6 rounded-2xl border transition-all duration-300 hover:scale-[1.02] ${kasa.bankConnectionId
                                        ? 'bg-emerald-500/5 border-emerald-500/20 shadow-lg shadow-emerald-500/5'
                                        : 'bg-white/5 border-white/10'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${kasa.bankConnectionId ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/40'
                                                }`}>
                                                {kasa.type === 'bank' ? '🏦' : '💵'}
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-white uppercase tracking-tight group-hover:text-emerald-400 transition-colors">
                                                    {kasa.name}
                                                </h4>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    {kasa.bankConnectionId ? (
                                                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase">
                                                            🔗 LIVE ACCOUNT
                                                        </span>
                                                    ) : (
                                                        <span className="px-1.5 py-0.5 rounded bg-white/5 text-white/30 text-[10px] font-black uppercase italic">
                                                            ✏️ MANUEL
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            {kasa.bankConnectionId && (
                                                <button
                                                    onClick={() => syncAccount(kasa.bankConnectionId)}
                                                    disabled={syncStates[kasa.bankConnectionId] === 'SYNCING'}
                                                    className={`p-2 rounded-lg transition-all ${syncStates[kasa.bankConnectionId] === 'SYNCING' ? 'bg-amber-500/20 text-amber-500 animate-spin' : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                                                        }`}
                                                    title="Sadece Bu Bankayı Güncelle"
                                                >
                                                    🔄
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className={`text-3xl font-black ${kasa.balance >= 0 ? 'text-white' : 'text-rose-500'}`}>
                                            {formatCurrency(kasa.balance)}
                                        </div>
                                        <div className="pt-4 border-t border-white/5 flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-white/30">
                                            <span>{kasa.branch || 'Merkez'} Şubesi</span>
                                            <span>{kasa.bankConnectionId ? 'LİVE SENKRON' : 'MANUEL KAYIT'}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Recent Bank Streams Integration */}
                        {(useFinancials as any)().bankTransactions?.length > 0 && (
                            <div className="mt-8 space-y-4">
                                <h4 className="text-xs font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    CANLI BANKA AKIŞLARI (HUB GÖRÜNÜMÜ)
                                </h4>
                                <div className="grid grid-cols-1 divide-y divide-white/5 bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
                                    {(useFinancials as any)().bankTransactions.slice(0, 10).map((bt: any) => (
                                        <div key={bt.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors group">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2 rounded-lg ${bt.direction === 'IN' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                                    {bt.direction === 'IN' ? '↓' : '↑'}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] font-bold text-indigo-500 bg-indigo-500/10 px-1.5 py-0.5 rounded">BANK</span>
                                                        <p className="text-xs font-bold text-white max-w-[300px] truncate">{bt.description}</p>
                                                    </div>
                                                    <p className="text-[10px] text-gray-500 font-medium uppercase">
                                                        {bt.connection?.bankName} • {new Date(bt.transactionDate).toLocaleString('tr-TR')}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <div className="text-right">
                                                    <p className={`text-sm font-black ${bt.direction === 'IN' ? 'text-white' : 'text-rose-400'}`}>
                                                        {bt.direction === 'IN' ? '+' : ''}{formatCurrency(bt.amount)}
                                                    </p>
                                                    <div className="flex items-center gap-1 justify-end">
                                                        <div className={`w-1.5 h-1.5 rounded-full ${bt.status === 'RECONCILED' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                                        <span className="text-[9px] text-gray-500 font-bold uppercase">{bt.status}</span>
                                                    </div>
                                                </div>
                                                {isAdmin && (
                                                    <button
                                                        onClick={async () => {
                                                            const res = await fetch('/api/fintech/banking/replay', {
                                                                method: 'POST',
                                                                body: JSON.stringify({ transactionId: bt.id })
                                                            });
                                                            const json = await res.json();
                                                            if (json.success) {
                                                                const message = json.mode === 'DRY_RUN'
                                                                    ? 'Simülasyon Tamamlandı (DRY_RUN): Kayıt atılmadı.'
                                                                    : 'İşlem Başarıyla Muhasebeleştirildi (LIVE).';
                                                                showSuccess('İşlem Tamamlandı', message);
                                                                refreshData();
                                                            } else {
                                                                showError('Hata', 'Hata: ' + json.error);
                                                            }
                                                        }}
                                                        className="p-2 opacity-0 group-hover:opacity-100 transition-opacity text-white/40 hover:text-white"
                                                        title="Yeniden İşlet (Admin Only)"
                                                    >
                                                        🔄
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'expenses' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white">Gider Listesi</h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setModalType('statement')}
                                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg font-medium text-sm transition-colors border border-white/10"
                                >
                                    📄 Ekstre Yükle
                                </button>
                                <button
                                    onClick={() => setModalType('expense')}
                                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium text-sm transition-colors shadow-lg shadow-rose-900/20"
                                >
                                    + Gider Ekle
                                </button>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-white/70">
                                <thead className="text-xs font-bold text-white/30 uppercase border-b border-white/5">
                                    <tr>
                                        <th className="py-3">Tarih</th>
                                        <th className="py-3">Açıklama</th>
                                        <th className="py-3">Kategori</th>
                                        <th className="py-3 text-right">Tutar</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {transactions.filter(t => t.type === 'Expense').map((tx, i) => (
                                        <tr key={i} className="hover:bg-white/5 opacity-80 hover:opacity-100">
                                            <td className="py-3">{new Date(tx.date).toLocaleDateString('tr-TR')}</td>
                                            <td className="py-3 font-medium text-white">{tx.description}</td>
                                            <td className="py-3 text-xs uppercase tracking-wide opacity-50">{tx.category || 'Genel'}</td>
                                            <td className="py-3 text-right font-bold text-rose-400">{formatCurrency(tx.amount)}</td>
                                        </tr>
                                    ))}
                                    {transactions.filter(t => t.type === 'Expense').length === 0 && (
                                        <tr><td colSpan={4} className="text-center py-8 text-white/30">Gider kaydı bulunamadı.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'transactions' && (
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold text-white">Tüm Finansal Hareketler</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-white/70">
                                <thead className="text-xs font-bold text-white/30 uppercase border-b border-white/5">
                                    <tr>
                                        <th className="py-3">Tarih / Saat</th>
                                        <th className="py-3">İşlem</th>
                                        <th className="py-3">Cari / Hesap</th>
                                        <th className="py-3">Açıklama</th>
                                        <th className="py-3 text-right">Tutar</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {transactions.map((tx: any, i) => {
                                        const isIncome = ['Sales', 'Collection', 'SalesInvoice'].includes(tx.type);

                                        // Helper for transaction type label
                                        const getTxLabel = (type: string) => {
                                            const labels: Record<string, string> = {
                                                'Sales': 'Satış',
                                                'SalesInvoice': 'Satış (Fatura)',
                                                'Collection': 'Tahsilat',
                                                'Payment': 'Ödeme',
                                                'Purchase': 'Alım / Borç',
                                                'Expense': 'Gider',
                                                'Transfer': 'Transfer'
                                            };
                                            return labels[type] || type;
                                        };

                                        // Helper for Cari name
                                        const getCariName = () => {
                                            if (tx.customerId) {
                                                const c = customers.find(x => String(x.id) === String(tx.customerId));
                                                return c ? c.name : `Müşteri (ID: ${tx.customerId})`;
                                            }
                                            if (tx.supplierId) {
                                                const s = suppliers.find(x => String(x.id) === String(tx.supplierId));
                                                return s ? s.name : `Tedarikçi (ID: ${tx.supplierId})`;
                                            }
                                            if (tx.description?.startsWith('POS:')) {
                                                return tx.description.replace('POS:', '').trim();
                                            }
                                            return "Genel / Kasa";
                                        };

                                        return (
                                            <tr key={i} className="hover:bg-white/5 border-b border-white/[0.02]">
                                                <td className="py-4 text-[11px] font-medium opacity-60">
                                                    {new Date(tx.date).toLocaleString('tr-TR', {
                                                        day: '2-digit', month: '2-digit', year: 'numeric',
                                                        hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </td>
                                                <td className="py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="font-bold text-white text-xs">{getTxLabel(tx.type)}</span>
                                                        <span className={`w-fit px-1.5 py-0.5 rounded text-[9px] font-black tracking-tighter ${isIncome ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                                            {isIncome ? 'GELİR' : 'GİDER'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-4 font-bold text-white/90 text-xs">
                                                    {getCariName()}
                                                </td>
                                                <td className="py-4 text-xs opacity-50 truncate max-w-[200px]" title={tx.description}>
                                                    {tx.description}
                                                </td>
                                                <td className={`py-4 text-right font-black ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                    {formatCurrency(tx.amount)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {transactions.length === 0 && (
                                        <tr><td colSpan={5} className="text-center py-8 text-white/30">İşlem kaydı bulunamadı.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Planner Section */}
            <div className="card glass border border-white/5 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <span className="text-xl">🗓️</span>
                        <h3 className="font-bold text-white">Planlı Alacaklar & Vadeli Satışlar</h3>
                    </div>
                    <button
                        onClick={() => setModalType('collection')}
                        className="px-3 py-1 bg-white/5 rounded-lg text-xs text-white/60 hover:bg-white/10"
                    >
                        + Planla
                    </button>
                </div>
                <div className="text-center py-8 text-white/20 text-sm">
                    Planlı alacak bulunmuyor.
                </div>
            </div>
        </div>
    );
}
