"use client";

import { useState, useEffect } from 'react';

interface LedgerDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    account: { id: string; code: string; name: string } | null;
}

export default function LedgerDetailModal({ isOpen, onClose, account }: LedgerDetailModalProps) {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [openingBalance, setOpeningBalance] = useState({ money: 0, debt: 0, credit: 0 });

    // Date Filters (Default to this year)
    const [dates, setDates] = useState({
        start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        if (isOpen && account) {
            fetchLedger();
        }
    }, [isOpen, account, dates]);

    const fetchLedger = async () => {
        if (!account) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/financials/accounts/${account.id}/ledger?startDate=${dates.start}&endDate=${dates.end}`);
            const json = await res.json();
            if (json.success) {
                setItems(json.items);
                setOpeningBalance(json.openingBalance || { money: 0, debt: 0, credit: 0 });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !account) return null;

    // --- Calculation of Running Balance ---
    let runningBalance = openingBalance.money;
    const computedItems = items.map(item => {
        const debt = Number(item.debt);
        const credit = Number(item.credit);

        // This is a naive calculation. A smarter one would consider Account Orientation (Debit/Credit).
        // But traditionally: Balance = Previous + Debit - Credit
        runningBalance = runningBalance + (debt - credit); // Standard Accounting Equation for Asset/Expense

        // However, for display, we usually format it signed-less and show B/A
        const absBalance = Math.abs(runningBalance);
        const direction = runningBalance > 0.009 ? '(B)' : (runningBalance < -0.009 ? '(A)' : '-');

        return {
            ...item,
            debt,
            credit,
            runningBalance: absBalance,
            direction
        };
    });

    const formatMoney = (val: number) => val.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('tr-TR');

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-[#121212] border border-white/10 rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95">

                {/* HEADER */}
                <div className="flex-none p-6 border-b border-white/10 flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-3">
                            <span className="bg-blue-600/20 text-blue-400 px-3 py-1 rounded-lg font-mono font-bold text-lg">{account.code}</span>
                            <h2 className="text-2xl font-bold">{account.name}</h2>
                        </div>
                        <p className="text-gray-400 text-sm mt-1">Muavin Defter Ekstresi</p>
                    </div>

                    <div className="flex items-end gap-2">
                        <div className="flex flex-col">
                            <label className="text-[10px] text-gray-500 font-bold mb-1">BAŞLANGIÇ</label>
                            <input type="date" value={dates.start} onChange={e => setDates(prev => ({ ...prev, start: e.target.value }))} className="bg-white/5 border border-white/10 rounded px-3 py-1.5 text-xs text-white outline-none focus:border-blue-500" />
                        </div>
                        <div className="text-gray-500 pb-2">-</div>
                        <div className="flex flex-col">
                            <label className="text-[10px] text-gray-500 font-bold mb-1">BİTİŞ</label>
                            <input type="date" value={dates.end} onChange={e => setDates(prev => ({ ...prev, end: e.target.value }))} className="bg-white/5 border border-white/10 rounded px-3 py-1.5 text-xs text-white outline-none focus:border-blue-500" />
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 ml-4">✕</button>
                    </div>
                </div>

                {/* CONTENT */}
                <div className="flex-1 overflow-auto p-0 custom-scrollbar relative">
                    {loading ? (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-500">Yükleniyor...</div>
                    ) : (
                        <table className="w-full text-left font-mono text-xs md:text-sm">
                            <thead className="text-[10px] uppercase text-gray-500 bg-white/5 sticky top-0 z-10 backdrop-blur-md">
                                <tr>
                                    <th className="p-4 w-[120px]">Tarih</th>
                                    <th className="p-4 w-[100px]">Fiş No</th>
                                    <th className="p-4">Açıklama</th>
                                    <th className="p-4 text-right w-[150px]">Borç</th>
                                    <th className="p-4 text-right w-[150px]">Alacak</th>
                                    <th className="p-4 text-right w-[180px]">Bakiye</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {/* OPENING BALANCE ROW */}
                                <tr className="bg-blue-900/10 italic">
                                    <td className="p-4 text-gray-400">{formatDate(dates.start)}</td>
                                    <td className="p-4 text-gray-400">DEVİR</td>
                                    <td className="p-4 text-gray-400">Dönem Başı Devreden Bakiye</td>
                                    <td className="p-4 text-right text-gray-300">{formatMoney(openingBalance.debt)}</td>
                                    <td className="p-4 text-right text-gray-300">{formatMoney(openingBalance.credit)}</td>
                                    <td className="p-4 text-right font-bold text-blue-200">
                                        {formatMoney(Math.abs(openingBalance.money))}
                                        <span className="text-[10px] ml-1 opacity-60 text-gray-400">{openingBalance.money > 0 ? '(B)' : openingBalance.money < 0 ? '(A)' : ''}</span>
                                    </td>
                                </tr>

                                {/* ITEMS */}
                                {computedItems.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-white/5 transition-colors group">
                                        <td className="p-4 text-gray-300 whitespace-nowrap">{formatDate(item.journal.date)}</td>
                                        <td className="p-4 text-blue-400 group-hover:underline cursor-pointer">{item.journal.fisNo}</td>
                                        <td className="p-4 text-gray-300">
                                            <div>{item.journal.description}</div>
                                            <div className="text-[10px] text-gray-500 mt-0.5">{item.journal.type} ({item.journal.sourceType})</div>
                                        </td>
                                        <td className="p-4 text-right text-emerald-400 font-bold">{item.debt > 0 ? formatMoney(item.debt) : '-'}</td>
                                        <td className="p-4 text-right text-rose-400 font-bold">{item.credit > 0 ? formatMoney(item.credit) : '-'}</td>
                                        <td className="p-4 text-right text-white">
                                            {formatMoney(item.runningBalance)}
                                            <span className="text-[10px] ml-1 opacity-60 text-gray-400">{item.direction}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-white/5 sticky bottom-0 z-10 backdrop-blur-md font-bold text-white border-t border-white/10">
                                <tr>
                                    <td colSpan={3} className="p-4 text-right text-gray-400 uppercase tracking-widest text-[10px]">Genel Toplam</td>
                                    <td className="p-4 text-right text-emerald-500">
                                        {formatMoney(computedItems.reduce((acc, i) => acc + i.debt, 0) + openingBalance.debt)}
                                    </td>
                                    <td className="p-4 text-right text-rose-500">
                                        {formatMoney(computedItems.reduce((acc, i) => acc + i.credit, 0) + openingBalance.credit)}
                                    </td>
                                    <td className="p-4 text-right text-blue-300">
                                        {formatMoney(Math.abs(runningBalance))} {runningBalance > 0 ? '(B)' : '(A)'}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    )}
                </div>

                {/* FOOTER ACTIONS */}
                <div className="p-4 border-t border-white/10 flex justify-end gap-2">
                    <button className="btn btn-outline text-xs">🖨️ Yazdır</button>
                    <button className="btn btn-outline text-xs">📥 Excel İndir</button>
                </div>
            </div>
        </div>
    );
}
