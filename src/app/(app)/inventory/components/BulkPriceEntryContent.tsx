import React, { useState, useEffect, useMemo } from 'react';
import { Product } from '@/contexts/AppContext';

interface BulkPriceEntryContentProps {
    products: Product[];
    onSave: (updates: any[]) => Promise<void>;
    isProcessing: boolean;
}

export default function BulkPriceEntryContent({
    products,
    onSave,
    isProcessing
}: BulkPriceEntryContentProps) {
    const [priceData, setPriceData] = useState<Record<string, any>>({});
    const [selectedRows, setSelectedRows] = useState<string[]>([]);

    useEffect(() => {
        const initialData: Record<string, any> = {};
        products.forEach(p => {
            initialData[p.id] = {
                id: p.id,
                buyPrice: p.buyPrice || 0,
                price: p.price || 0,
                newPrice: p.price || 0 // Initial new price same as current
            };
        });
        setPriceData(initialData);
    }, [products]);

    const handleUpdate = (id: string | number, field: string, value: any) => {
        setPriceData(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                [field]: value
            }
        }));
    };

    const handleSaveList = async () => {
        if (selectedRows.length === 0) return;
        const updates = selectedRows.map(id => priceData[id]);
        await onSave(updates);
    };

    const toggleRow = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedRows(prev => [...prev, id]);
        } else {
            setSelectedRows(prev => prev.filter(rId => rId !== id));
        }
    };

    const toggleAll = (checked: boolean) => {
        if (checked) {
            setSelectedRows(products.map(p => String(p.id)));
        } else {
            setSelectedRows([]);
        }
    };

    return (
        <div className="flex flex-col gap-4 animate-in fade-in h-[calc(100vh-240px)] min-h-[500px]">
            {/* Top Toolbar */}
            <div className="bg-white dark:bg-[#0f172a] rounded-[20px] border border-slate-200 dark:border-white/5 shadow-sm p-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <h3 className="text-[14px] font-bold text-slate-900 dark:text-white">Fiyat Yönetim Çizelgesi</h3>
                    <div className="h-6 w-px bg-slate-200"></div>
                    <span className="text-[12px] font-semibold text-slate-500 dark:text-slate-400">
                        Seçilen: <strong className="text-blue-600">{selectedRows.length}</strong> / {products.length}
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    <button className="px-4 py-2 bg-slate-100 dark:bg-[#334155]/50 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition-colors">Yüzde/Tutar Uygula</button>
                    <button className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors text-blue-400">Pazaryerlerine Gönder</button>
                    <button
                        onClick={handleSaveList}
                        disabled={selectedRows.length === 0 || isProcessing}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 shadow-sm
                            ${selectedRows.length === 0 ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}
                        `}
                    >
                        {isProcessing ? 'Kaydediliyor...' : 'Liste Olarak Kaydet'}
                    </button>
                </div>
            </div>

            {/* Price Table - Spreadsheet Style */}
            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] flex-1 overflow-hidden shadow-sm flex flex-col">
                <div className="flex-1 overflow-y-auto custom-scroll relative z-0">
                    <table className="w-full text-left border-collapse text-[12px] relative">
                        <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-[#1e293b] border-b border-slate-200 dark:border-white/5 shadow-sm">
                            <tr>
                                <th className="px-3 py-2 w-10 text-center">
                                    <input
                                        type="checkbox"
                                        className="w-3.5 h-3.5 rounded border-slate-300 dark:border-white/10 accent-blue-600 cursor-pointer"
                                        checked={selectedRows.length === products.length && products.length > 0}
                                        onChange={(e) => toggleAll(e.target.checked)}
                                    />
                                </th>
                                <th className="px-3 py-2 font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest min-w-[200px]">Ürün</th>
                                <th className="px-3 py-2 font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest text-right w-28">Alış Fiyatı</th>
                                <th className="px-3 py-2 font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest text-right w-28">KKM <span className="text-[10px] lowercase font-normal">(Tahmini)</span></th>
                                <th className="px-3 py-2 font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest text-right w-28">Tavsiye Fiyat</th>
                                <th className="px-3 py-2 font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest text-right w-28">Mevcut Fiyat</th>
                                <th className="px-3 py-2 font-bold text-blue-600 uppercase tracking-widest text-right w-36 bg-blue-50/50">Yeni Fiyat</th>
                                <th className="px-3 py-2 font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest text-center w-24">Marj Etkisi</th>
                                <th className="px-3 py-2 font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest text-center w-20">Durum</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {products.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="py-12 text-center text-slate-400 font-medium bg-slate-50/50 dark:bg-[#1e293b]/50">Listelenecek ürün bulanamadı.</td>
                                </tr>
                            ) : (
                                products.map(product => {
                                    const current = priceData[product.id] || { buyPrice: 0, price: 0, newPrice: 0 };
                                    const isSelected = selectedRows.includes(String(product.id));

                                    // Mocks for spreadsheet metrics
                                    const kkm = current.buyPrice * 1.05;
                                    const suggested = kkm * 1.4;

                                    const diff = current.newPrice - current.price;
                                    const marginChange = current.price > 0 ? (diff / current.price) * 100 : 0;

                                    const hasChange = current.newPrice !== current.price;

                                    return (
                                        <tr key={product.id} className={`h-[36px] hover:bg-slate-50 transition-colors group ${isSelected ? 'bg-blue-50/20' : ''}`}>
                                            <td className="px-3 text-center border-r border-slate-100 dark:border-white/5">
                                                <input
                                                    type="checkbox"
                                                    className="w-3.5 h-3.5 rounded border-slate-300 dark:border-white/10 accent-blue-600 cursor-pointer"
                                                    checked={isSelected}
                                                    onChange={(e) => toggleRow(String(product.id), e.target.checked)}
                                                />
                                            </td>
                                            <td className="px-3 border-r border-slate-100 dark:border-white/5">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-bold text-slate-900 dark:text-white truncate max-w-[200px]">{product.name}</span>
                                                    <span className="text-[10px] text-slate-400 font-mono ml-2">{product.code}</span>
                                                </div>
                                            </td>
                                            <td className="px-3 text-right border-r border-slate-100 dark:border-white/5">
                                                <span className="font-semibold text-slate-600 dark:text-slate-400 tabular-nums">₺{Number(current.buyPrice).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </td>
                                            <td className="px-3 text-right border-r border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-[#1e293b]/30">
                                                <span className="font-bold text-indigo-600 tabular-nums">₺{Number(kkm).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </td>
                                            <td className="px-3 text-right border-r border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-[#1e293b]/30">
                                                <span className="font-bold text-emerald-600 tabular-nums">₺{Number(suggested).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </td>
                                            <td className="px-3 text-right border-r border-slate-100 dark:border-white/5">
                                                <span className={`font-semibold tabular-nums ${hasChange ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                                                    ₺{Number(current.price).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </td>
                                            <td className="p-0 border-r border-slate-100 dark:border-white/5 bg-blue-50/20 relative">
                                                <input
                                                    type="number"
                                                    className={`w-full h-[35px] text-right px-3 font-bold bg-transparent outline-none focus:bg-white focus:ring-1 focus:ring-inset focus:ring-blue-500 tabular-nums
                                                        ${hasChange ? 'text-blue-600' : 'text-slate-900'}
                                                    `}
                                                    value={current.newPrice === 0 ? '' : current.newPrice}
                                                    onChange={e => {
                                                        const val = parseFloat(e.target.value) || 0;
                                                        handleUpdate(product.id, 'newPrice', val);
                                                        if (val !== current.price && !isSelected) {
                                                            toggleRow(String(product.id), true);
                                                        } else if (val === current.price && isSelected) {
                                                            toggleRow(String(product.id), false);
                                                        }
                                                    }}
                                                />
                                            </td>
                                            <td className="px-3 text-center border-r border-slate-100 dark:border-white/5">
                                                {hasChange ? (
                                                    <span className={`font-bold tabular-nums text-[11px] px-1.5 py-0.5 rounded ${marginChange > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                        {marginChange > 0 ? '+' : ''}{marginChange.toFixed(1)}%
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-300">-</span>
                                                )}
                                            </td>
                                            <td className="px-3 text-center">
                                                {hasChange ? (
                                                    <div className="w-2 h-2 rounded-full bg-blue-500 mx-auto"></div>
                                                ) : (
                                                    <div className="w-2 h-2 rounded-full bg-slate-200 mx-auto"></div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
