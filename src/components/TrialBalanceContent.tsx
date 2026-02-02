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
        <div className="animate-fade-in-up">
            <div className="card glass mb-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-600">
                            ⚖️ Genel Geçici Mizan
                        </h2>
                        <p className="text-muted text-sm mt-1">
                            Hesapların dönem sonu borç/alacak toplamları ve bakiyeleri.
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-gray-300 hover:text-white transition-colors">
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
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 pl-12 focus:outline-none focus:border-green-500 transition-colors"
                    />
                    <span className="absolute left-4 top-3.5 text-gray-400">🔍</span>
                </div>
            </div>

            <div className="card glass overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                        <thead className="bg-white/5 text-gray-400 border-b border-white/5 font-bold">
                            <tr>
                                <th className="p-4 w-32">KOD</th>
                                <th className="p-4">HESAP ADI</th>
                                <th className="p-4 text-right w-32 bg-white/[0.02]">TOPLAM BORÇ</th>
                                <th className="p-4 text-right w-32 bg-white/[0.02]">TOPLAM ALACAK</th>
                                <th className="p-4 text-right w-32 text-red-300">BORÇ BAKİYESİ</th>
                                <th className="p-4 text-right w-32 text-blue-300">ALACAK BAKİYESİ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="p-8 text-center text-gray-500">Mizan hesaplanıyor...</td></tr>
                            ) : filteredData.length === 0 ? (
                                <tr><td colSpan={6} className="p-8 text-center text-gray-500">Kayıt bulunamadı.</td></tr>
                            ) : (
                                filteredData.map(row => (
                                    <tr
                                        key={row.id}
                                        onClick={() => openLedger(row)}
                                        className="border-b border-white/5 hover:bg-white/5 transition-colors group cursor-pointer"
                                        title="Ekstre için tıklayın"
                                    >
                                        <td className="p-3 font-mono text-gray-300 group-hover:text-white transition-colors">
                                            {row.code}
                                        </td>
                                        <td className="p-3 font-bold text-gray-200 group-hover:text-white">
                                            {row.name}
                                        </td>

                                        {/* Tutarlar */}
                                        <td className="p-3 text-right font-mono bg-white/[0.01] group-hover:bg-white/[0.03]">
                                            {row.totalDebt > 0 ? formatMoney(row.totalDebt) : '-'}
                                        </td>
                                        <td className="p-3 text-right font-mono bg-white/[0.01] group-hover:bg-white/[0.03]">
                                            {row.totalCredit > 0 ? formatMoney(row.totalCredit) : '-'}
                                        </td>

                                        {/* Bakiyeler */}
                                        <td className="p-3 text-right font-mono text-red-300 font-bold bg-red-500/[0.02]">
                                            {row.balanceDirection === 'Borç' ? formatMoney(row.balance) : '-'}
                                        </td>
                                        <td className="p-3 text-right font-mono text-blue-300 font-bold bg-blue-500/[0.02]">
                                            {row.balanceDirection === 'Alacak' ? formatMoney(row.balance) : '-'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        {/* DİP TOPLAM */}
                        {!loading && filteredData.length > 0 && (
                            <tfoot className="bg-[#0f0f1a] border-t-2 border-white/10 text-white font-bold sticky bottom-0">
                                <tr>
                                    <td colSpan={2} className="p-4 text-right uppercase tracking-wider text-gray-400">Genel Toplam</td>
                                    <td className="p-4 text-right font-mono text-lg">{formatMoney(totals.debt)}</td>
                                    <td className="p-4 text-right font-mono text-lg">{formatMoney(totals.credit)}</td>
                                    <td className="p-4 text-right font-mono text-lg text-red-400">{formatMoney(totals.balanceDebt)}</td>
                                    <td className="p-4 text-right font-mono text-lg text-blue-400">{formatMoney(totals.balanceCredit)}</td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>

            {/* Mizan Denge Kontrolü */}
            {!loading && Math.abs(totals.debt - totals.credit) > 0.05 && (
                <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-center gap-4 text-red-200 animate-pulse">
                    <div className="text-3xl">⚠️</div>
                    <div>
                        <h4 className="font-bold text-lg">Mizan Dengesi Bozuk!</h4>
                        <p className="text-sm">Borç ve Alacak toplamları eşit değil. Fark: {formatMoney(Math.abs(totals.debt - totals.credit))} ₺. Lütfen Yevmiye Fişlerini kontrol edin.</p>
                    </div>
                </div>
            )}
            {!loading && Math.abs(totals.debt - totals.credit) <= 0.05 && (
                <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex justify-center text-green-400 text-sm font-bold">
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
