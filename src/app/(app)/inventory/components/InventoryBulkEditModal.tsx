
import React, { useState, useEffect } from 'react';
import { Product } from '@/contexts/AppContext';

interface InventoryBulkEditModalProps {
    isOpen: boolean;
    mode: 'category' | 'vat' | 'barcode' | 'price' | null;
    onClose: () => void;
    selectedIds: (string | number)[];
    products: Product[];
    categories: string[];
    onApply: (values: any) => void;
    isProcessing: boolean;
}

export default function InventoryBulkEditModal({
    isOpen,
    mode,
    onClose,
    selectedIds,
    products,
    categories,
    onApply,
    isProcessing
}: InventoryBulkEditModalProps) {
    const [bulkValues, setBulkValues] = useState<any>({});
    const [adjType, setAdjType] = useState<'percent' | 'amount'>('percent');
    const [adjTarget, setAdjTarget] = useState<'buy' | 'sell' | 'both'>('sell');
    const [adjValue, setAdjValue] = useState<number>(0);
    const [showCloseWarning, setShowCloseWarning] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setBulkValues({});
            setAdjValue(0);
        }
    }, [isOpen]);

    if (!isOpen || !mode) return null;

    const selectedProducts = (products || []).filter(p => selectedIds.includes(p.id));

    const applyAdjustmentRule = () => {
        if (!adjValue) return;
        const newBulkValues = { ...bulkValues };

        selectedIds.forEach(id => {
            const product = (products || []).find(p => p.id === id);
            if (!product) return;

            const current = newBulkValues[id] || { buyPrice: product.buyPrice, price: product.price };

            if (adjTarget === 'buy' || adjTarget === 'both') {
                const diff = adjType === 'percent' ? (current.buyPrice * adjValue / 100) : adjValue;
                current.buyPrice = Math.max(0, current.buyPrice + diff);
            }
            if (adjTarget === 'sell' || adjTarget === 'both') {
                const diff = adjType === 'percent' ? (current.price * adjValue / 100) : adjValue;
                current.price = Math.max(0, current.price + diff);
            }

            newBulkValues[id] = current;
        });

        setBulkValues(newBulkValues);
        setAdjValue(0);
    };

    const handleApply = () => {
        onApply(bulkValues);
    };

    return (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-6 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
            <div
                className={`bg-white dark:bg-[#0f172a] flex flex-col border border-slate-200 dark:border-white/10 rounded-[24px] shadow-2xl animate-in ${(mode === 'barcode' || mode === 'price') ? 'w-full max-w-7xl h-[85vh]' : 'w-full max-w-lg'
                    }`}
            >
                <div className="px-8 py-6 border-b border-slate-200 dark:border-white/10 flex gap-6 justify-between items-center">
                    <div>
                        <h3 className="text-[20px] font-semibold text-slate-900 dark:text-white mb-1">
                            {mode === 'category' ? '📁 Kategori Taşıma' :
                                mode === 'vat' ? '🏛️ Vergi Yapılandırma' :
                                    mode === 'price' ? '💰 Fiyat Revizyonu' : '🔍 Barkod Terminali'}
                        </h3>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                            <p className="text-slate-500 text-[11px] font-medium tracking-wider uppercase">Seçili {selectedIds.length} ürün işleme hazır</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/5 flex items-center justify-center dark:hover:bg-white/10 transition-colors text-slate-500 font-medium">✕</button>
                </div>

                <div className="p-8 overflow-y-auto flex-1 custom-scroll">
                    {mode === 'category' && (
                        <div className="flex flex-col gap-4 py-2">
                            <label className="text-slate-500 dark:text-slate-400 text-[11px] font-semibold tracking-wider uppercase">Yeni Kategori Hedefi</label>
                            <select
                                className="w-full bg-slate-50 dark:bg-[#1e293b] px-4 py-3 rounded-[12px] border border-slate-200 dark:border-white/10 text-[14px] font-semibold text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none appearance-none cursor-pointer transition-colors shadow-sm"
                                onChange={(e) => setBulkValues({ category: e.target.value })}
                            >
                                <option value="">--- Bir kategori seçin ---</option>
                                <option value="uncategorized">📁 Kategorisiz Olarak İşaretle</option>
                                {categories.filter(c => c).map(c => <option key={c} value={c}>{c}</option>)}
                                <option value="Yeni Kategori">➕ Yeni Kategori Oluştur...</option>
                            </select>
                        </div>
                    )}

                    {mode === 'vat' && (
                        <div className="grid grid-cols-2 gap-6 py-2">
                            <div className="flex flex-col gap-3">
                                <label className="text-slate-500 dark:text-slate-400 text-[11px] font-semibold tracking-wider uppercase">Satış KDV (%)</label>
                                <input
                                    type="number"
                                    placeholder="20"
                                    className="w-full bg-slate-50 dark:bg-[#1e293b] px-4 py-3 rounded-[12px] border border-slate-200 dark:border-white/10 text-[18px] font-semibold text-center text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors shadow-sm"
                                    onChange={e => setBulkValues({ ...bulkValues, salesVat: parseInt(e.target.value) })}
                                />
                            </div>
                            <div className="flex flex-col gap-3">
                                <label className="text-slate-500 dark:text-slate-400 text-[11px] font-semibold tracking-wider uppercase">Alış KDV (%)</label>
                                <input
                                    type="number"
                                    placeholder="20"
                                    className="w-full bg-slate-50 dark:bg-[#1e293b] px-4 py-3 rounded-[12px] border border-slate-200 dark:border-white/10 text-[18px] font-semibold text-center text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors shadow-sm"
                                    onChange={e => setBulkValues({ ...bulkValues, purchaseVat: parseInt(e.target.value) })}
                                />
                            </div>
                        </div>
                    )}

                    {mode === 'barcode' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {selectedProducts.map(product => (
                                <div key={product.id} className="bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-[16px] p-5 flex flex-col gap-3 hover:border-blue-500 transition-colors group shadow-sm">
                                    <div className="flex flex-col">
                                        <div className="text-[13px] font-semibold text-slate-900 dark:text-white truncate mb-0.5">{product.name}</div>
                                        <div className="text-[11px] text-slate-500 font-medium tracking-wider">{product.code}</div>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Barkodu okutun..."
                                        defaultValue={product.barcode}
                                        onChange={(e) => setBulkValues({ ...bulkValues, [product.id]: e.target.value })}
                                        autoFocus={selectedIds[0] === product.id}
                                        className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 px-3 py-2.5 rounded-[10px] text-blue-600 dark:text-blue-400 font-semibold text-[13px] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all shadow-sm"
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {mode === 'price' && (
                        <div className="flex flex-col gap-6">
                            {/* Wizard Bar */}
                            <div className="sticky top-0 z-10 flex justify-center pb-4">
                                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-[16px] py-2.5 px-6 flex items-center gap-4 shadow-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 text-[12px]">⚡</span>
                                        <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-300">Akıllı Sihirbaz</span>
                                    </div>
                                    <div className="w-px h-6 bg-slate-200 dark:bg-white/10"></div>
                                    <select
                                        className="bg-transparent text-slate-900 dark:text-white border-none text-[12px] font-semibold tracking-wider cursor-pointer outline-none"
                                        value={adjTarget}
                                        onChange={e => setAdjTarget(e.target.value as any)}
                                    >
                                        <option value="sell">Satış Fiyatları</option>
                                        <option value="buy">Alış Fiyatları</option>
                                        <option value="both">Tüm Fiyatlar</option>
                                    </select>
                                    <select
                                        className="bg-transparent text-slate-500 dark:text-slate-400 border-none text-[12px] font-medium tracking-wider cursor-pointer outline-none"
                                        value={adjType}
                                        onChange={e => setAdjType(e.target.value as any)}
                                    >
                                        <option value="percent">Yüzde (%)</option>
                                        <option value="amount">Tutar (₺)</option>
                                    </select>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={adjValue || ''}
                                        onChange={e => setAdjValue(parseFloat(e.target.value) || 0)}
                                        className="bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 w-20 py-1.5 px-3 text-slate-900 dark:text-white rounded-[8px] text-[13px] font-semibold text-center focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                                    />
                                    <button
                                        onClick={applyAdjustmentRule}
                                        className="bg-blue-600 text-white border-none py-1.5 px-4 rounded-[8px] text-[11px] font-semibold tracking-wider hover:bg-blue-700 transition-colors shadow-sm ml-2"
                                    >
                                        Hepsini Güncelle
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-10">
                                {selectedProducts.map((product) => {
                                    const currentValues = bulkValues[product.id] || { buyPrice: product.buyPrice, price: product.price };
                                    return (
                                        <div key={product.id} className="bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-[16px] p-5 hover:border-blue-500 transition-colors group shadow-sm">
                                            <div className="flex flex-col mb-4">
                                                <div className="text-[13px] font-semibold text-slate-900 dark:text-white truncate mb-0.5 leading-tight" title={product.name}>{product.name}</div>
                                                <div className="text-[11px] text-slate-500 font-medium tracking-wider">{product.code}</div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="flex flex-col gap-1.5">
                                                    <label className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold tracking-wider uppercase">ALIŞ</label>
                                                    <input
                                                        type="number"
                                                        className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 p-2 rounded-[8px] text-[12px] font-semibold text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors shadow-sm"
                                                        value={currentValues.buyPrice}
                                                        onChange={(e) => {
                                                            const newVals = { ...bulkValues, [product.id]: { ...currentValues, buyPrice: parseFloat(e.target.value) } };
                                                            setBulkValues(newVals);
                                                        }}
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-1.5">
                                                    <label className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold tracking-wider uppercase">SATIŞ</label>
                                                    <input
                                                        type="number"
                                                        className="w-full bg-blue-50/50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/20 p-2 rounded-[8px] text-[12px] font-bold text-blue-600 dark:text-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors shadow-sm"
                                                        value={currentValues.price}
                                                        onChange={(e) => {
                                                            const newVals = { ...bulkValues, [product.id]: { ...currentValues, price: parseFloat(e.target.value) } };
                                                            setBulkValues(newVals);
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#1e293b] flex justify-end gap-3 items-center rounded-b-[24px]">
                    <button className="text-[12px] font-semibold tracking-wider text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors px-4 py-2" onClick={onClose} disabled={isProcessing}>VAZGEÇ</button>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-[12px] text-[13px] font-semibold tracking-wider transition-colors shadow-sm disabled:opacity-50" onClick={handleApply} disabled={isProcessing}>
                        {isProcessing ? 'SİSTEME İŞLENİYOR...' : 'ONAYLA'}
                    </button>
                </div>
            </div>
        </div>
    );
}
