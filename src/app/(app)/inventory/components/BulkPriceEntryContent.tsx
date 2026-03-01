
import React, { useState, useEffect } from 'react';
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
    const [adjValue, setAdjValue] = useState<number>(0);
    const [adjType, setAdjType] = useState<'percent' | 'amount'>('percent');
    const [adjTarget, setAdjTarget] = useState<'buy' | 'sell' | 'both'>('sell');

    // Initialize local state with current product data
    useEffect(() => {
        const initialData: Record<string, any> = {};
        products.forEach(p => {
            initialData[p.id] = {
                id: p.id,
                buyPrice: p.buyPrice || 0,
                price: p.price || 0,
                purchaseVatIncluded: p.purchaseVatIncluded ?? true,
                salesVatIncluded: p.salesVatIncluded ?? true,
                purchaseVat: p.purchaseVat ?? 20,
                salesVat: p.salesVat ?? 20,
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

    const applyWizard = () => {
        if (!adjValue) return;
        const newData = { ...priceData };
        Object.keys(newData).forEach(id => {
            const current = newData[id];
            if (adjTarget === 'buy' || adjTarget === 'both') {
                const diff = adjType === 'percent' ? (current.buyPrice * adjValue / 100) : adjValue;
                current.buyPrice = Math.max(0, Number((current.buyPrice + diff).toFixed(2)));
            }
            if (adjTarget === 'sell' || adjTarget === 'both') {
                const diff = adjType === 'percent' ? (current.price * adjValue / 100) : adjValue;
                current.price = Math.max(0, Number((current.price + diff).toFixed(2)));
            }
        });
        setPriceData(newData);
        setAdjValue(0);
    };

    const handleSaveAll = async () => {
        const updates = Object.values(priceData);
        await onSave(updates);
    };

    return (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Wizard Box */}
            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-[24px] p-6 shadow-sm">
                <div className="flex flex-wrap items-center gap-6 justify-between">
                    <div className="flex flex-col">
                        <h3 className="text-[18px] font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 text-[16px]">⚡</span> Akıllı Fiyat Sihirbazı
                        </h3>
                        <p className="text-[11px] text-slate-500 font-medium tracking-wider mt-1">
                            Listelenen {products.length} ürüne toplu kural uygula
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 bg-slate-50 dark:bg-[#1e293b] p-2 rounded-[16px] border border-slate-200 dark:border-white/10">
                        <select
                            className="bg-transparent text-slate-700 dark:text-slate-300 text-[12px] font-semibold tracking-wider px-3 py-2 outline-none cursor-pointer"
                            value={adjTarget}
                            onChange={e => setAdjTarget(e.target.value as any)}
                        >
                            <option value="sell">SATIŞ FİYATLARI</option>
                            <option value="buy">ALIŞ FİYATLARI</option>
                            <option value="both">TÜM FİYATLAR</option>
                        </select>
                        <div className="w-px h-6 bg-slate-200 dark:bg-white/10"></div>
                        <select
                            className="bg-transparent text-slate-700 dark:text-slate-300 text-[12px] font-medium px-3 py-2 outline-none cursor-pointer"
                            value={adjType}
                            onChange={e => setAdjType(e.target.value as any)}
                        >
                            <option value="percent">Yüzde (%)</option>
                            <option value="amount">Tutar (₺)</option>
                        </select>
                        <div className="w-px h-6 bg-slate-200 dark:bg-white/10"></div>
                        <input
                            type="number"
                            placeholder="Değer..."
                            className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 w-28 px-3 py-2 rounded-[10px] text-[13px] font-semibold text-center text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-300 shadow-sm"
                            value={adjValue || ''}
                            onChange={e => setAdjValue(parseFloat(e.target.value) || 0)}
                        />
                        <button
                            onClick={applyWizard}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-[10px] text-[12px] font-semibold tracking-wider transition-all shadow-sm"
                        >
                            UYGULA
                        </button>
                    </div>
                </div>
            </div>

            {/* Price Table */}
            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-[24px] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-[#1e293b] border-b border-slate-200 dark:border-white/10">
                                <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ürün Detayı</th>
                                <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Alış Fiyatı</th>
                                <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Alış KDV</th>
                                <th className="px-6 py-4 text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Satış Fiyatı</th>
                                <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Satış KDV</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {products.map(product => {
                                const current = priceData[product.id] || {};
                                return (
                                    <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-slate-900 dark:text-white text-[13px] mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{product.name}</div>
                                            <div className="text-[11px] text-slate-500 flex items-center gap-2">
                                                <span className="font-medium tracking-wider">{product.code}</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-white/20"></span>
                                                <span className="tracking-wider uppercase font-medium">{product.category}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 min-w-[140px]">
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={current.buyPrice || ''}
                                                    onChange={e => handleUpdate(product.id, 'buyPrice', parseFloat(e.target.value) || 0)}
                                                    className="w-full bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-[10px] p-2.5 text-[13px] font-semibold text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors pr-8"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold pointer-events-none">₺</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <select
                                                    value={current.purchaseVat || 20}
                                                    onChange={e => handleUpdate(product.id, 'purchaseVat', parseInt(e.target.value))}
                                                    className="bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-[10px] px-2.5 py-2.5 text-[13px] font-medium text-slate-700 dark:text-slate-300 outline-none cursor-pointer focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                                                >
                                                    <option value="1">%1</option>
                                                    <option value="10">%10</option>
                                                    <option value="20">%20</option>
                                                </select>
                                                <button
                                                    onClick={() => handleUpdate(product.id, 'purchaseVatIncluded', !current.purchaseVatIncluded)}
                                                    className={`px-3 py-2.5 rounded-[10px] text-[10px] font-semibold uppercase tracking-wider transition-colors ${current.purchaseVatIncluded
                                                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                                                        : 'bg-slate-50 text-slate-500 border border-slate-200 dark:bg-white/5 dark:text-slate-400 dark:border-white/10'
                                                        }`}
                                                >
                                                    {current.purchaseVatIncluded ? 'KDV DAHİL' : 'KDV HARİÇ'}
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 min-w-[140px]">
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={current.price || ''}
                                                    onChange={e => handleUpdate(product.id, 'price', parseFloat(e.target.value) || 0)}
                                                    className="w-full bg-blue-50/50 dark:bg-blue-500/5 hover:bg-blue-50 dark:hover:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-[10px] p-2.5 text-[13px] font-bold text-blue-600 dark:text-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors pr-8 placeholder:text-blue-300 dark:placeholder:text-blue-800"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 dark:text-blue-500 text-xs font-bold pointer-events-none">₺</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <select
                                                    value={current.salesVat || 20}
                                                    onChange={e => handleUpdate(product.id, 'salesVat', parseInt(e.target.value))}
                                                    className="bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-[10px] px-2.5 py-2.5 text-[13px] font-medium text-slate-700 dark:text-slate-300 outline-none cursor-pointer focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                                                >
                                                    <option value="1">%1</option>
                                                    <option value="10">%10</option>
                                                    <option value="20">%20</option>
                                                </select>
                                                <button
                                                    onClick={() => handleUpdate(product.id, 'salesVatIncluded', !current.salesVatIncluded)}
                                                    className={`px-3 py-2.5 rounded-[10px] text-[10px] font-semibold uppercase tracking-wider transition-colors ${current.salesVatIncluded
                                                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                                                        : 'bg-slate-50 text-slate-500 border border-slate-200 dark:bg-white/5 dark:text-slate-400 dark:border-white/10'
                                                        }`}
                                                >
                                                    {current.salesVatIncluded ? 'KDV DAHİL' : 'KDV HARİÇ'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {products.length === 0 && (
                    <div className="p-16 text-center text-slate-400 dark:text-slate-500 italic font-medium">
                        Kriterlere uygun ürün bulunamadı. Lütfen filtreleri kontrol edin.
                    </div>
                )}
            </div>

            {/* Footer Save Area */}
            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[4000] w-full max-w-3xl px-4 animate-in slide-in-from-bottom-10 duration-500">
                <div className="bg-white/95 dark:bg-[#0f172a]/95 border border-slate-200 dark:border-white/10 rounded-[20px] p-5 shadow-xl backdrop-blur-md flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Bekleyen Değişiklikler</span>
                        <div className="text-slate-900 dark:text-white text-[16px] font-semibold">
                            <span className="text-blue-600 dark:text-blue-400">{Object.keys(priceData).length}</span> Ürün Güncelleniyor
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button
                            disabled={isProcessing}
                            className="px-8 py-3.5 rounded-[12px] bg-blue-600 hover:bg-blue-700 text-white font-semibold tracking-wider text-[13px] transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={handleSaveAll}
                        >
                            {isProcessing ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    KAYDEDİLİYOR...
                                </>
                            ) : (
                                <>TÜMÜNÜ SİSTEME İŞLE</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
