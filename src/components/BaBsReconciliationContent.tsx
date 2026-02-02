"use client";

import { useState, useEffect } from 'react';

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

    const TableSection = ({ title, items, colorClass, emptyText }: any) => (
        <div className="card glass-plus p-0 overflow-hidden flex flex-col h-full border border-white/5 shadow-xl">
            <div className={`p-4 border-b border-white/10 ${colorClass} bg-white/5`}>
                <h3 className="text-xl font-bold flex justify-between items-center">
                    {title}
                    <span className="text-xs font-normal opacity-70 bg-black/20 px-2 py-1 rounded">
                        Limit: {formatMoney(filters.limit)} üzeri
                    </span>
                </h3>
            </div>
            <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-sm">
                    <thead className="bg-black/20 text-gray-400 font-bold text-xs uppercase">
                        <tr>
                            <th className="p-3 pl-4">Cari Hesap</th>
                            <th className="p-3 text-center">Belge Adedi</th>
                            <th className="p-3 text-right pr-4">Toplam Tutar</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {items?.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="p-8 text-center text-gray-500 italic">
                                    {emptyText}
                                </td>
                            </tr>
                        ) : (
                            items?.map((item: any) => (
                                <tr key={item.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-3 pl-4">
                                        <div className="font-bold text-gray-200">{item.name}</div>
                                        <div className="text-[10px] text-gray-500 font-mono">{item.code}</div>
                                    </td>
                                    <td className="p-3 text-center font-mono text-gray-300">
                                        {item.count} Adet
                                    </td>
                                    <td className={`p-3 text-right pr-4 font-mono font-bold ${colorClass.replace('text-', '') === 'rose-400' ? 'text-rose-300' : 'text-blue-300'}`}>
                                        {formatMoney(item.total)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <div className="p-3 bg-black/20 border-t border-white/10 text-right text-xs text-gray-400 font-mono">
                Toplam {items?.length || 0} kayıt
            </div>
        </div>
    );

    return (
        <div className="animate-fade-in-up">
            <div className="card glass mb-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
                            🤝 BA/BS Mutabakat Raporu
                        </h2>
                        <p className="text-muted text-sm mt-1">
                            Aylık alım ve satım bildirimleri için limit üstü carilerin listesi.
                        </p>
                    </div>

                    <div className="flex gap-2 items-center bg-white/5 p-1 rounded-xl">
                        <select
                            value={filters.month}
                            onChange={(e) => setFilters(prev => ({ ...prev, month: Number(e.target.value) }))}
                            className="bg-transparent text-sm font-bold p-2 outline-none text-center appearance-auto"
                        >
                            {months.map((m, i) => <option key={i} value={i + 1} className="bg-[#121212]">{m}</option>)}
                        </select>
                        <select
                            value={filters.year}
                            onChange={(e) => setFilters(prev => ({ ...prev, year: Number(e.target.value) }))}
                            className="bg-transparent text-sm font-bold p-2 outline-none text-center appearance-auto"
                        >
                            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y} className="bg-[#121212]">{y}</option>)}
                        </select>
                        <div className="w-[1px] h-6 bg-white/10 mx-1"></div>
                        <div className="flex items-center px-2">
                            <span className="text-xs text-gray-500 mr-2">Limit:</span>
                            <input
                                type="number"
                                value={filters.limit}
                                onChange={(e) => setFilters(prev => ({ ...prev, limit: Number(e.target.value) }))}
                                className="w-16 bg-transparent text-sm font-bold text-right outline-none"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center p-20 text-gray-500 animate-pulse">Analiz ediliyor...</div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px]">
                    {/* FORM BS (SATIŞLAR) */}
                    <TableSection
                        title="📜 FORM BS (Satış Bildirimi)"
                        items={data?.formBS}
                        colorClass="text-blue-400"
                        emptyText="Bu ay için limit üstü satış bulunamadı."
                    />

                    {/* FORM BA (ALIŞLAR) */}
                    <TableSection
                        title="🛍️ FORM BA (Alış Bildirimi)"
                        items={data?.formBA}
                        colorClass="text-rose-400"
                        emptyText="Bu ay için limit üstü alış bulunamadı."
                    />
                </div>
            )}
        </div>
    );
}
