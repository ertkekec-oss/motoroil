
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
            <div className="bg-white/5 border border-white/10 rounded-[32px] p-8 backdrop-blur-xl shadow-2xl">
                <div className="flex flex-wrap items-center gap-6 justify-between">
                    <div className="flex flex-col">
                        <h3 className="text-xl font-black text-white flex items-center gap-2">
                            <span className="text-2xl">⚡</span> Akıllı Fiyat Sihirbazı
                        </h3>
                        <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">
                            Listelenen {products.length} ürüne toplu kural uygula
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 bg-black/40 p-2 rounded-2xl border border-white/5">
                        <select
                            className="bg-transparent text-white/80 text-xs font-black uppercase tracking-wider px-4 py-2 outline-none cursor-pointer"
                            value={adjTarget}
                            onChange={e => setAdjTarget(e.target.value as any)}
                        >
                            <option value="sell">SATIŞ FİYATLARI</option>
                            <option value="buy">ALIŞ FİYATLARI</option>
                            <option value="both">TÜM FİYATLAR</option>
                        </select>
                        <div className="w-px h-6 bg-white/10"></div>
                        <select
                            className="bg-transparent text-white/80 text-xs font-black uppercase tracking-wider px-4 py-2 outline-none cursor-pointer"
                            value={adjType}
                            onChange={e => setAdjType(e.target.value as any)}
                        >
                            <option value="percent">Yüzde (%)</option>
                            <option value="amount">Tutar (₺)</option>
                        </select>
                        <div className="w-px h-6 bg-white/10"></div>
                        <input
                            type="number"
                            placeholder="Değer..."
                            className="bg-white/5 border border-white/10 w-24 px-4 py-2 rounded-xl text-sm font-black text-center text-white focus:border-primary outline-none transition-all"
                            value={adjValue || ''}
                            onChange={e => setAdjValue(parseFloat(e.target.value) || 0)}
                        />
                        <button
                            onClick={applyWizard}
                            className="bg-primary hover:bg-primary/80 text-white px-6 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-primary/20"
                        >
                            UYGULA
                        </button>
                    </div>
                </div>
            </div>

            {/* Price Table */}
            <div className="bg-white/5 border border-white/10 rounded-[32px] overflow-hidden shadow-2xl backdrop-blur-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/[0.02]">
                                <th className="p-6 text-[10px] font-black text-white/30 uppercase tracking-[2px]">Ürün Detayı</th>
                                <th className="p-6 text-[10px] font-black text-white/30 uppercase tracking-[2px]">Alış Fiyatı</th>
                                <th className="p-6 text-[10px] font-black text-white/30 uppercase tracking-[2px]">Alış KDV</th>
                                <th className="p-6 text-[10px] font-black text-white/30 uppercase tracking-[2px] text-primary">Satış Fiyatı</th>
                                <th className="p-6 text-[10px] font-black text-white/30 uppercase tracking-[2px]">Satış KDV</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {products.map(product => {
                                const current = priceData[product.id] || {};
                                return (
                                    <tr key={product.id} className="hover:bg-white/[0.02] transition-all group">
                                        <td className="p-6">
                                            <div className="font-bold text-white text-sm mb-1 group-hover:text-primary transition-colors">{product.name}</div>
                                            <div className="text-[10px] text-white/30 font-mono flex items-center gap-2">
                                                <span>{product.code}</span>
                                                <span className="w-1 h-1 rounded-full bg-white/10"></span>
                                                <span>{product.category}</span>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="relative group/input max-w-[140px]">
                                                <input
                                                    type="number"
                                                    value={current.buyPrice || ''}
                                                    onChange={e => handleUpdate(product.id, 'buyPrice', parseFloat(e.target.value) || 0)}
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm font-bold text-white focus:border-white/30 outline-none transition-all pr-12"
                                                />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 text-xs font-bold pointer-events-none group-focus-within/input:text-white/40 transition-colors">₺</span>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-3">
                                                <select
                                                    value={current.purchaseVat || 20}
                                                    onChange={e => handleUpdate(product.id, 'purchaseVat', parseInt(e.target.value))}
                                                    className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white/60 outline-none cursor-pointer"
                                                >
                                                    <option value="1">%1</option>
                                                    <option value="10">%10</option>
                                                    <option value="20">%20</option>
                                                </select>
                                                <button
                                                    onClick={() => handleUpdate(product.id, 'purchaseVatIncluded', !current.purchaseVatIncluded)}
                                                    className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${current.purchaseVatIncluded
                                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                            : 'bg-white/5 text-white/30 border border-white/5'
                                                        }`}
                                                >
                                                    {current.purchaseVatIncluded ? 'KDV DAHİL' : 'KDV HARİÇ'}
                                                </button>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="relative group/input max-w-[140px]">
                                                <input
                                                    type="number"
                                                    value={current.price || ''}
                                                    onChange={e => handleUpdate(product.id, 'price', parseFloat(e.target.value) || 0)}
                                                    className="w-full bg-primary/5 border border-primary/20 rounded-xl p-3 text-sm font-black text-primary focus:border-primary outline-none transition-all pr-12 placeholder:text-primary/20"
                                                />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/30 text-xs font-black pointer-events-none group-focus-within/input:text-primary/60 transition-colors">₺</span>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-3">
                                                <select
                                                    value={current.salesVat || 20}
                                                    onChange={e => handleUpdate(product.id, 'salesVat', parseInt(e.target.value))}
                                                    className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white/60 outline-none cursor-pointer"
                                                >
                                                    <option value="1">%1</option>
                                                    <option value="10">%10</option>
                                                    <option value="20">%20</option>
                                                </select>
                                                <button
                                                    onClick={() => handleUpdate(product.id, 'salesVatIncluded', !current.salesVatIncluded)}
                                                    className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${current.salesVatIncluded
                                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                            : 'bg-white/5 text-white/30 border border-white/5'
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
                    <div className="p-20 text-center text-white/20 italic font-medium">
                        Kriterlere uygun ürün bulunamadı. Lütfen filtreleri kontrol edin.
                    </div>
                )}
            </div>

            {/* Footer Save Area */}
            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[4000] w-full max-w-4xl px-4 animate-in slide-in-from-bottom-10 duration-700">
                <div className="bg-[#080911]/90 border border-white/10 rounded-[30px] p-6 shadow-[0_40px_100px_rgba(0,0,0,0.8)] backdrop-blur-3xl flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Bekleyen Değişiklikler</span>
                        <div className="text-white text-lg font-black">
                            <span className="text-primary">{Object.keys(priceData).length}</span> Ürün Güncelleniyor
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button
                            disabled={isProcessing}
                            className="px-10 py-4 rounded-2xl bg-primary hover:bg-primary/80 text-white font-black tracking-widest text-sm transition-all shadow-xl shadow-primary/30 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={handleSaveAll}
                        >
                            {isProcessing ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    KAYDEDİLİYOR...
                                </>
                            ) : (
                                <>🚀 TÜMÜNÜ SİSTEME İŞLE</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
