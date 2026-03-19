"use client";

import { useState, useEffect } from 'react';
import { Handshake, FileText, ShoppingBag, Loader2 } from 'lucide-react';

export default function BaBsReconciliationContent() {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>(null);
    const [filters, setFilters] = useState({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        limit: 5000
    });

    useEffect(() => {
        fetchReport();
    }, [filters]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/financials/reports/ba-bs?month=${filters.month}&year=${filters.year}&limit=${filters.limit}`);
            const json = await res.json();
            if (json.success) {
                setData(json);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const formatMoney = (val: number) => val.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺';

    const months = [
        'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];

    const TableSection = ({ title, icon: Icon, items, colorClass, borderClass, emptyText }: any) => (
        <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
            <div className={`p-5 border-b border-slate-100 dark:border-white/10 flex items-center justify-between ${colorClass.replace('text-', 'bg-').replace('600', '50')} dark:bg-slate-800/30`}>
                <h3 className={`text-[16px] font-black tracking-tight flex items-center gap-2 ${colorClass}`}>
                    <Icon className="w-5 h-5" />
                    {title}
                </h3>
                <span className="text-[11px] font-bold tracking-widest uppercase opacity-70 bg-black/5 dark:bg-black/20 px-2 py-1 rounded border border-black/5 dark:border-white/5">
                    Limit: {formatMoney(filters.limit)} üzeri
                </span>
            </div>
            <div className="overflow-x-auto flex-1">
                <table className="w-full text-left">
                    <thead className="bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-black tracking-widest text-[10px] uppercase border-b border-slate-100 dark:border-white/10">
                        <tr>
                            <th className="p-4">CARİ HESAP</th>
                            <th className="p-4 text-center">BELGE ADEDİ</th>
                            <th className="p-4 text-right">TOPLAM TUTAR</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {!items || items.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="p-12 text-center text-slate-500 dark:text-slate-400 text-[13px] font-medium italic">
                                    {emptyText}
                                </td>
                            </tr>
                        ) : (
                            items.map((item: any) => (
                                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-default">
                                    <td className="p-4">
                                        <div className="font-semibold text-[13px] text-slate-900 dark:text-white">{item.name}</div>
                                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">{item.code}</div>
                                    </td>
                                    <td className="p-4 text-center font-mono text-[13px] font-bold text-slate-700 dark:text-slate-300">
                                        {item.count} <span className="text-[10px] text-slate-400">Adet</span>
                                    </td>
                                    <td className={`p-4 text-right font-mono text-[14px] font-black ${colorClass}`}>
                                        {formatMoney(item.total)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-white/10 text-right text-[11px] font-bold text-slate-500 dark:text-slate-400 font-mono uppercase tracking-widest">
                TOPLAM {items?.length || 0} KAYIT
            </div>
        </div>
    );

    return (
        <div className="animate-in fade-in duration-500 space-y-6">
            <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm p-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-pink-50 dark:bg-pink-500/10 border border-pink-100 dark:border-pink-500/20 flex items-center justify-center text-pink-600 dark:text-pink-400 shrink-0">
                            <Handshake className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                                BA/BS Mutabakat Raporu
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">
                                Aylık alım ve satım bildirimleri için limit üstü carilerin listesi.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2 items-center bg-slate-50 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-white/5">
                        <select
                            value={filters.month}
                            onChange={(e) => setFilters(prev => ({ ...prev, month: Number(e.target.value) }))}
                            className="bg-transparent text-[13px] font-bold px-3 py-2 outline-none text-center appearance-auto text-slate-900 dark:text-white cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded-lg transition-colors border-r border-slate-200 dark:border-white/10"
                        >
                            {months?.map((m, i) => <option key={i} value={i + 1} className="dark:bg-[#1e293b]">{m}</option>)}
                        </select>
                        <select
                            value={filters.year}
                            onChange={(e) => setFilters(prev => ({ ...prev, year: Number(e.target.value) }))}
                            className="bg-transparent text-[13px] font-bold px-3 py-2 outline-none text-center appearance-auto text-slate-900 dark:text-white cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded-lg transition-colors border-r border-slate-200 dark:border-white/10"
                        >
                            {[2024, 2025, 2026, 2027]?.map(y => <option key={y} value={y} className="dark:bg-[#1e293b]">{y}</option>)}
                        </select>
                        <div className="flex items-center px-3 gap-2">
                            <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">LİMİT:</span>
                            <input
                                type="number"
                                value={filters.limit}
                                onChange={(e) => setFilters(prev => ({ ...prev, limit: Number(e.target.value) }))}
                                className="w-20 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1.5 text-[13px] font-bold font-mono text-center outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 text-slate-900 dark:text-white"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center p-20 text-[13px] font-semibold text-slate-400 flex flex-col items-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
                    BABS Analiz ediliyor...
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[500px]">
                    {/* FORM BS (SATIŞLAR) */}
                    <TableSection
                        title="FORM BS (Satış Bildirimi)"
                        icon={FileText}
                        items={data?.formBS}
                        colorClass="text-blue-600 dark:text-blue-400"
                        emptyText="Bu ay için limit üstü satış bulunamadı."
                    />

                    {/* FORM BA (ALIŞLAR) */}
                    <TableSection
                        title="FORM BA (Alış Bildirimi)"
                        icon={ShoppingBag}
                        items={data?.formBA}
                        colorClass="text-rose-600 dark:text-rose-400"
                        emptyText="Bu ay için limit üstü alış bulunamadı."
                    />
                </div>
            )}
        </div>
    );
}
