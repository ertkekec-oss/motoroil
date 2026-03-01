"use client";

import { useState, useEffect, useMemo } from 'react';
import LedgerDetailModal from './LedgerDetailModal';

interface MizanRow {
    id: string;
    code: string;
    name: string;
    type: string;
    totalDebt: number;
    totalCredit: number;
    balance: number;
    balanceDirection: 'Borç' | 'Alacak' | '-';
}

export default function TrialBalanceContent() {
    const [report, setReport] = useState<MizanRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [hideZero, setHideZero] = useState(false);

    // Ledger Modal State
    const [showLedgerModal, setShowLedgerModal] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<any>(null);

    useEffect(() => {
        fetchReport();
    }, []);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/financials/reports/trial-balance');
            const data = await res.json();
            if (data.success) {
                setReport(data.report);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const openLedger = (row: MizanRow) => {
        setSelectedAccount(row);
        setShowLedgerModal(true);
    };

    const filteredData = useMemo(() => {
        let data = report;

        // 1. Sıfır Bakiyelileri Gizle
        if (hideZero) {
            data = data.filter(r => r.totalDebt > 0 || r.totalCredit > 0);
        }

        // 2. Arama
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            data = data.filter(r => r.code.toLowerCase().includes(term) || r.name.toLowerCase().includes(term));
        }

        return data;
    }, [report, hideZero, searchTerm]);

    // Dip Toplamlar
    const totals = useMemo(() => {
        return filteredData.reduce((acc, row) => ({
            debt: acc.debt + row.totalDebt,
            credit: acc.credit + row.totalCredit,
            balanceDebt: acc.balanceDebt + (row.balanceDirection === 'Borç' ? row.balance : 0),
            balanceCredit: acc.balanceCredit + (row.balanceDirection === 'Alacak' ? row.balance : 0)
        }), { debt: 0, credit: 0, balanceDebt: 0, balanceCredit: 0 });
    }, [filteredData]);

    const formatMoney = (val: number) => val.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return (
        <div className="animate-in fade-in duration-500">
            <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-[24px] shadow-sm mb-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h2 className="text-[24px] font-bold text-slate-900 dark:text-white  bg-gradient-to-r from-green-400 to-emerald-600">
                            ⚖️ Genel Geçici Mizan
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                            Hesapların dönem sonu borç/alacak toplamları ve bakiyeleri.
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-slate-900 dark:text-white hover:text-slate-900 dark:text-white transition-colors">
                            <input
                                type="checkbox"
                                checked={hideZero}
                                onChange={e => setHideZero(e.target.checked)}
                                className="checkbox checkbox-xs checkbox-primary"
                            />
                            <span>Hareketsizleri Gizle</span>
                        </label>
                        <button onClick={fetchReport} className="btn btn-ghost btn-sm">🔄 Yenile</button>
                        <button className="btn btn-outline btn-sm">🖨️ Yazdır</button>
                    </div>
                </div>

                <div className="mt-6 relative">
                    <input
                        type="text"
                        placeholder="Hesap Ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-black/20 border border-slate-200 dark:border-slate-800 rounded-[12px] px-4 py-4 text-[13px] h-[52px] pl-12 focus:outline-none focus:border-green-500 transition-colors"
                    />
                    <span className="absolute left-4 top-3.5 text-slate-500 dark:text-slate-400">🔍</span>
                </div>
            </div>

            <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-[24px] shadow-sm overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                        <thead className="bg-[#F6F8FB] dark:bg-[#0F172A] border-b border-slate-200 dark:border-slate-800 font-bold sticky top-0 z-10">
                            <tr>
                                <th className="p-4 w-32 tracking-wider uppercase text-[12px] font-semibold text-slate-500 dark:text-slate-400">KOD</th>
                                <th className="p-4 tracking-wider uppercase text-[12px] font-semibold text-slate-500 dark:text-slate-400">HESAP ADI</th>
                                <th className="p-4 text-right w-32 tracking-wider uppercase text-[12px] font-semibold text-slate-500 dark:text-slate-400">TOPLAM BORÇ</th>
                                <th className="p-4 text-right w-32 tracking-wider uppercase text-[12px] font-semibold text-slate-500 dark:text-slate-400">TOPLAM ALACAK</th>
                                <th className="p-4 text-right w-32 tracking-wider uppercase text-[12px] font-semibold text-slate-500 dark:text-slate-400">BORÇ BAKİYESİ</th>
                                <th className="p-4 text-right w-32 tracking-wider uppercase text-[12px] font-semibold text-slate-500 dark:text-slate-400">ALACAK BAKİYESİ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="p-8 text-center text-slate-500 dark:text-slate-400">Mizan hesaplanıyor...</td></tr>
                            ) : filteredData.length === 0 ? (
                                <tr><td colSpan={6} className="p-8 text-center text-slate-500 dark:text-slate-400">Kayıt bulunamadı.</td></tr>
                            ) : (
                                filteredData.map(row => (
                                    <tr
                                        key={row.id}
                                        onClick={() => openLedger(row)}
                                        className="h-[52px] border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group cursor-pointer"
                                        title="Ekstre için tıklayın"
                                    >
                                        <td className="px-4 py-2 font-mono text-[13px] text-slate-900 dark:text-white">
                                            {row.code}
                                        </td>
                                        <td className="px-4 py-2 font-semibold text-[13px] text-slate-900 dark:text-white">
                                            {row.name}
                                        </td>

                                        {/* Tutarlar */}
                                        <td className="px-4 py-2 text-[13px] text-right font-mono text-slate-900 dark:text-white">
                                            {row.totalDebt > 0 ? formatMoney(row.totalDebt) : '-'}
                                        </td>
                                        <td className="px-4 py-2 text-[13px] text-right font-mono text-slate-900 dark:text-white">
                                            {row.totalCredit > 0 ? formatMoney(row.totalCredit) : '-'}
                                        </td>

                                        {/* Bakiyeler */}
                                        <td className="px-4 py-2 text-[13px] text-right font-mono font-bold text-slate-900 dark:text-white">
                                            {row.balanceDirection === 'Borç' ? formatMoney(row.balance) : '-'}
                                        </td>
                                        <td className="px-4 py-2 text-[13px] text-right font-mono font-bold text-slate-900 dark:text-white">
                                            {row.balanceDirection === 'Alacak' ? formatMoney(row.balance) : '-'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        {/* DİP TOPLAM */}
                        {!loading && filteredData.length > 0 && (
                            <tfoot className="bg-[#F6F8FB] dark:bg-[#0F172A] border-t-2 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold sticky bottom-0">
                                <tr>
                                    <td colSpan={2} className="p-4 text-right uppercase tracking-wider text-[12px] text-slate-500 dark:text-slate-400">Genel Toplam</td>
                                    <td className="p-4 text-right font-mono text-[14px] text-slate-900 dark:text-white">{formatMoney(totals.debt)}</td>
                                    <td className="p-4 text-right font-mono text-[14px] text-slate-900 dark:text-white">{formatMoney(totals.credit)}</td>
                                    <td className="p-4 text-right font-mono text-[14px] text-slate-900 dark:text-white">{formatMoney(totals.balanceDebt)}</td>
                                    <td className="p-4 text-right font-mono text-[14px] text-slate-900 dark:text-white">{formatMoney(totals.balanceCredit)}</td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>

            {/* Mizan Denge Kontrolü */}
            {!loading && Math.abs(totals.debt - totals.credit) > 0.05 && (
                <div className="mt-4 p-4 bg-rose-50 dark:bg-rose-500/10 border border-red-500/50 rounded-[12px] flex items-center gap-4 text-red-200 animate-pulse">
                    <div className="text-3xl">⚠️</div>
                    <div>
                        <h4 className="font-bold text-lg">Mizan Dengesi Bozuk!</h4>
                        <p className="text-sm">Borç ve Alacak toplamları eşit değil. Fark: {formatMoney(Math.abs(totals.debt - totals.credit))} ₺. Lütfen Yevmiye Fişlerini kontrol edin.</p>
                    </div>
                </div>
            )}
            {!loading && Math.abs(totals.debt - totals.credit) <= 0.05 && (
                <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-[12px] flex justify-center text-emerald-600 dark:text-emerald-400 text-sm font-bold">
                    ✅ Mizan Dengeli (Borç = Alacak)
                </div>
            )}

            {/* LEDGER MODAL */}
            <LedgerDetailModal
                isOpen={showLedgerModal}
                onClose={() => setShowLedgerModal(false)}
                account={selectedAccount}
            />
        </div>
    );
}
