"use client";

import { useState, useEffect, useMemo } from 'react';
import { Scale, RefreshCw, Printer, Search, AlertCircle, CheckCircle2 } from 'lucide-react';
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
        <div className="animate-in fade-in duration-500 space-y-6">
            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[24px] shadow-sm p-6 overflow-hidden flex flex-col">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                            <Scale className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                                Genel Geçici Mizan
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">
                                Hesapların dönem sonu borç/alacak toplamları ve bakiyeleri.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer select-none text-[13px] font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors bg-slate-50 dark:bg-[#1e293b]/50 px-3 h-[44px] rounded-[14px] border border-slate-200 dark:border-white/5">
                            <input
                                type="checkbox"
                                checked={hideZero}
                                onChange={e => setHideZero(e.target.checked)}
                                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600 outline-none"
                            />
                            <span>Hareketsizleri Gizle</span>
                        </label>
                        <button 
                            onClick={fetchReport} 
                            className="px-5 h-[44px] rounded-[14px] font-bold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 transition-all bg-white dark:bg-[#1e293b] shadow-sm text-[13px]"
                        >
                            <RefreshCw className="w-4 h-4" /> 
                            <span className="hidden sm:inline">Yenile</span>
                        </button>
                        <button className="px-5 h-[44px] rounded-[14px] font-bold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 transition-all bg-white dark:bg-[#1e293b] shadow-sm text-[13px]">
                            <Printer className="w-4 h-4" /> 
                            <span className="hidden sm:inline">Yazdır</span>
                        </button>
                    </div>
                </div>

                <div className="mt-6 relative group">
                    <Search className="w-5 h-5 absolute left-4 top-[14px] text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Mizan hesaplarında hızlı ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-[#1e293b]/50 border border-slate-200 dark:border-white/5 rounded-[14px] px-4 py-3 text-[13px] font-semibold h-[48px] pl-11 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-slate-900 dark:text-white"
                    />
                </div>
            </div>

            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[24px] shadow-sm overflow-hidden p-0 flex flex-col">
                <div className="overflow-x-auto custom-scroll w-full">
                    <table className="w-full text-left border-collapse text-sm">
                        <thead className="bg-slate-50 dark:bg-[#1e293b] border-b border-slate-200 dark:border-white/5 font-bold sticky top-0 z-10">
                            <tr>
                                <th className="p-4 w-32 tracking-widest uppercase text-[10px] font-bold text-slate-500 dark:text-slate-400">KOD</th>
                                <th className="p-4 tracking-widest uppercase text-[10px] font-bold text-slate-500 dark:text-slate-400">HESAP ADI</th>
                                <th className="p-4 text-right w-36 tracking-widest uppercase text-[10px] font-bold text-slate-500 dark:text-slate-400">TOPLAM BORÇ</th>
                                <th className="p-4 text-right w-36 tracking-widest uppercase text-[10px] font-bold text-slate-500 dark:text-slate-400">TOPLAM ALACAK</th>
                                <th className="p-4 text-right w-36 tracking-widest uppercase text-[10px] font-bold text-slate-500 dark:text-slate-400">BORÇ BAKİYESİ</th>
                                <th className="p-4 text-right w-36 tracking-widest uppercase text-[10px] font-bold text-slate-500 dark:text-slate-400">ALACAK BAKİYESİ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="p-8 text-center text-[13px] font-semibold text-slate-400 animate-pulse">Mizan hesaplanıyor, lütfen bekleyin...</td></tr>
                            ) : filteredData.length === 0 ? (
                                <tr><td colSpan={6} className="p-8 text-center text-slate-500 dark:text-slate-400">Kayıt bulunamadı.</td></tr>
                            ) : (
                                filteredData?.map(row => (
                                    <tr
                                        key={row.id}
                                        onClick={() => openLedger(row)}
                                        className="h-[52px] border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
                                        title="Ekstre için tıklayın"
                                    >
                                        <td className="px-4 py-2 font-mono text-[13px] font-semibold text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
                                            {row.code}
                                        </td>
                                        <td className="px-4 py-2 font-semibold text-[13px] text-slate-900 dark:text-white">
                                            {row.name}
                                        </td>

                                        {/* Tutarlar */}
                                        <td className="px-4 py-2 text-[13px] text-right font-mono font-medium text-slate-600 dark:text-slate-400">
                                            {row.totalDebt > 0 ? formatMoney(row.totalDebt) : <span className="text-slate-300 dark:text-slate-600">-</span>}
                                        </td>
                                        <td className="px-4 py-2 text-[13px] text-right font-mono font-medium text-slate-600 dark:text-slate-400">
                                            {row.totalCredit > 0 ? formatMoney(row.totalCredit) : <span className="text-slate-300 dark:text-slate-600">-</span>}
                                        </td>

                                        {/* Bakiyeler */}
                                        <td className="px-4 py-2 text-[13px] text-right font-mono font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50/30 dark:bg-indigo-500/5 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10 transition-colors">
                                            {row.balanceDirection === 'Borç' ? formatMoney(row.balance) : <span className="text-slate-300 dark:text-slate-600">-</span>}
                                        </td>
                                        <td className="px-4 py-2 text-[13px] text-right font-mono font-black text-rose-600 dark:text-rose-400 bg-rose-50/30 dark:bg-rose-500/5 group-hover:bg-rose-50 dark:group-hover:bg-rose-500/10 transition-colors">
                                            {row.balanceDirection === 'Alacak' ? formatMoney(row.balance) : <span className="text-slate-300 dark:text-slate-600">-</span>}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        {/* DİP TOPLAM */}
                        {!loading && filteredData.length > 0 && (
                            <tfoot className="bg-slate-50 dark:bg-[#0f172a] border-t border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-bold sticky bottom-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                                <tr className="h-14">
                                    <td colSpan={2} className="p-4 text-right uppercase tracking-[0.2em] text-[10px] font-black text-slate-500 dark:text-slate-400">GENEL TOPLAM</td>
                                    <td className="p-4 text-right font-mono text-[14px] text-slate-700 dark:text-slate-300">{formatMoney(totals.debt)}</td>
                                    <td className="p-4 text-right font-mono text-[14px] text-slate-700 dark:text-slate-300">{formatMoney(totals.credit)}</td>
                                    <td className="p-4 text-right font-mono text-[14px] font-black text-indigo-600 dark:text-indigo-400">{formatMoney(totals.balanceDebt)}</td>
                                    <td className="p-4 text-right font-mono text-[14px] font-black text-rose-600 dark:text-rose-400">{formatMoney(totals.balanceCredit)}</td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>

            {/* Mizan Denge Kontrolü */}
            {!loading && Math.abs(totals.debt - totals.credit) > 0.05 && (
                <div className="mt-4 p-4 border rounded-2xl flex items-start gap-4 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 animate-in slide-in-from-bottom-2 fade-in">
                    <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-bold text-[15px] tracking-tight">Mizan Dengesi Bozuk!</h4>
                        <p className="text-[13px] font-medium leading-relaxed opacity-90 mt-1">Borç ve Alacak toplamları eşit değil. Fark: <span className="font-mono font-bold">{formatMoney(Math.abs(totals.debt - totals.credit))} ₺</span>. Lütfen kaydedilmiş son Yevmiye Fişlerindeki dengeyi kontrol edin.</p>
                    </div>
                </div>
            )}
            {!loading && Math.abs(totals.debt - totals.credit) <= 0.05 && filteredData.length > 0 && (
                <div className="mt-4 p-4 border rounded-2xl flex items-center justify-center gap-2 bg-emerald-50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/10 text-emerald-600 dark:text-emerald-400 animate-in slide-in-from-bottom-2 fade-in">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-[13px] font-bold">Mizan Dengeli (Borç = Alacak)</span>
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
