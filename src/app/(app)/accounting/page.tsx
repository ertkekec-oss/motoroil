"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useFinancials } from "@/contexts/FinancialContext";
import { useCRM } from "@/contexts/CRMContext"; // Added useCRM
import { formatCurrency } from "@/lib/utils";

import AccountingModals from "./components/AccountingModals";

export default function AccountingPage() {
    const { user } = useAuth();
    const {
        transactions,
        checks,
        kasalar,
        refreshTransactions,
        refreshKasalar,
        refreshChecks,
        isInitialLoading
    } = useFinancials();

    const { customers, suppliers, refreshCustomers, refreshSuppliers } = useCRM(); // Get CRM data

    const [activeTab, setActiveTab] = useState("receivables");
    const [modalType, setModalType] = useState<string | null>(null);

    // Calculate Stats
    const stats = React.useMemo(() => {
        // Alacaklar: Tahsil edilmemiş Çekler + Müşteri Bakiyeleri (Pozitif)
        const checkReceivables = checks.filter(c => c.type === 'In' && c.status !== 'Tahsil Edildi').reduce((sum, c) => sum + c.amount, 0);
        const customerReceivables = customers.reduce((sum, c) => sum + (Number(c.balance) > 0 ? Number(c.balance) : 0), 0);
        const totalReceivables = checkReceivables + customerReceivables;

        // Borçlar: Ödenmemiş Çekler + Tedarikçi Bakiyeleri (Pozitif - Borcumuz)
        const checkPayables = checks.filter(c => c.type === 'Out' && c.status !== 'Ödendi').reduce((sum, c) => sum + c.amount, 0);
        const supplierPayables = suppliers.reduce((sum, s) => sum + (Number(s.balance) > 0 ? Number(s.balance) : 0), 0);
        const totalPayables = checkPayables + supplierPayables;

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
        <div className="p-6 md:p-8 space-y-8 animate-in fade-in duration-500">
            <AccountingModals
                isOpen={!!modalType}
                onClose={() => setModalType(null)}
                type={modalType || ''}
            />

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Muhasebe & Finans</h1>
                    <p className="text-white/60">Nakit akışı, cari hesaplar ve kasa yönetimi</p>
                </div>
                <button
                    onClick={() => refreshData()}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white transition-all active:scale-95"
                >
                    {isInitialLoading ? "🔄 Yenileniyor..." : "🔄 Verileri Yenile"}
                </button>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, idx) => (
                    <div
                        key={idx}
                        className={`p-6 rounded-2xl border ${card.border} ${card.bg} backdrop-blur-sm relative overflow-hidden group hover:scale-[1.02] transition-all duration-300`}
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
                    { id: 'payables', label: 'Borçlar', color: 'bg-white/10' },
                    { id: 'checks', label: 'Çek & Senet', color: 'bg-white/10' },
                    { id: 'banks', label: 'Banka & Kasa', color: 'bg-white/10' },
                    { id: 'expenses', label: 'Giderler', color: 'bg-white/10' },
                    { id: 'transactions', label: 'Finansal Hareketler', color: 'bg-white/10' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === tab.id
                            ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/20 scale-105'
                            : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="bg-[#0f1115] border border-white/5 rounded-2xl p-6 min-h-[400px]">
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
                                    {/* Müşteri CARİLERİ */}
                                    {customers.filter(c => Number(c.balance) > 0).map((customer, i) => (
                                        <tr key={`cust-${i}`} className="hover:bg-white/5">
                                            <td className="py-3 font-bold text-white">{customer.name}</td>
                                            <td className="py-3"><span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-orange-500/10 text-orange-400 tracking-wide">CARİ HESAP</span></td>
                                            <td className="py-3 text-center opacity-50 text-xs">Güncel Bakiye</td>
                                            <td className="py-3 text-right font-black text-white">{formatCurrency(customer.balance)}</td>
                                            <td className="py-3 text-right"><span className="text-[10px] font-bold uppercase text-orange-400">ÖDEME BEKLİYOR</span></td>
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
                                    {/* Tedarikçi CARİLERİ */}
                                    {suppliers.filter(s => Number(s.balance) > 0).map((supplier, i) => (
                                        <tr key={`supp-${i}`} className="hover:bg-white/5">
                                            <td className="py-3 font-medium text-white">{supplier.name}</td>
                                            <td className="py-3"><span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-rose-500/10 text-rose-400 tracking-wide">CARİ HESAP</span></td>
                                            <td className="py-3 text-center opacity-50 text-xs">Güncel Bakiye</td>
                                            <td className="py-3 text-center font-bold text-rose-400">{formatCurrency(supplier.balance)}</td>
                                            <td className="py-3 text-right">
                                                <span className="text-[10px] font-bold uppercase text-rose-400">BORÇLUYUZ</span>
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
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white">Kasa & Banka Hesapları</h3>
                            <button
                                onClick={() => setModalType('account')}
                                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium text-sm transition-colors"
                            >
                                + Hesap Ekle
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {kasalar.map((kasa, i) => (
                                <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 flex justify-between items-center">
                                    <div>
                                        <div className="text-sm font-bold text-white uppercase tracking-wider">{kasa.name}</div>
                                        <div className="text-xs text-white/40 mt-1">{kasa.type === 'bank' ? '🏦 Banka Hesabı' : '💵 Nakit Kasa'}</div>
                                    </div>
                                    <div className={`text-xl font-black ${kasa.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {formatCurrency(kasa.balance)}
                                    </div>
                                </div>
                            ))}
                            {kasalar.length === 0 && (
                                <div className="col-span-2 text-center py-8 text-white/30">Kasa/Banka hesabı bulunamadı.</div>
                            )}
                        </div>
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
            <div className="bg-[#0f1115] border border-white/5 rounded-2xl p-6">
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
