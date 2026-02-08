
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
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-6 bg-black/85 backdrop-blur-xl animate-fade-in">
            <div
                className={`glass-plus overflow-hidden flex flex-col border border-white/20 rounded-[40px] shadow-[0_50px_100px_rgba(0,0,0,0.9)] animate-in ${(mode === 'barcode' || mode === 'price') ? 'w-full max-w-7xl h-[85vh]' : 'w-full max-w-lg'
                    }`}
            >
                <div className="px-10 py-8 border-b border-white/5 flex gap-10 justify-between items-center bg-white/5">
                    <div>
                        <h3 className="text-3xl font-black bg-gradient-to-br from-white to-white/50 bg-clip-text text-transparent mb-1">
                            {mode === 'category' ? '📁 Kategori Taşıma' :
                                mode === 'vat' ? '🏛️ Vergi Yapılandırma' :
                                    mode === 'price' ? '💰 Fiyat Revizyonu' : '🔍 Barkod Terminali'}
                        </h3>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                            <p className="text-muted text-[10px] font-black uppercase tracking-widest leading-none">Seçili {selectedIds.length} ürün işleme hazır</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary transition-all text-xl font-light">&times;</button>
                </div>

                <div className="p-10 overflow-y-auto flex-1 custom-scroll bg-black/20">
                    {mode === 'category' && (
                        <div className="flex flex-col gap-6 py-4">
                            <label className="text-primary text-[10px] font-black tracking-[3px] uppercase">Yeni Kategori Hedefi</label>
                            <select
                                className="w-full bg-black/40 p-5 rounded-2xl border border-white/10 text-base font-bold focus:border-primary outline-none appearance-none cursor-pointer"
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
                        <div className="grid grid-cols-2 gap-8 py-4">
                            <div className="flex flex-col gap-4">
                                <label className="text-primary text-[10px] font-black tracking-[3px] uppercase">Satış KDV (%)</label>
                                <input
                                    type="number"
                                    placeholder="20"
                                    className="w-full bg-black/40 p-5 rounded-2xl border border-white/10 text-2xl font-black text-center focus:border-primary outline-none"
                                    onChange={e => setBulkValues({ ...bulkValues, salesVat: parseInt(e.target.value) })}
                                />
                            </div>
                            <div className="flex flex-col gap-4">
                                <label className="text-primary text-[10px] font-black tracking-[3px] uppercase">Alış KDV (%)</label>
                                <input
                                    type="number"
                                    placeholder="20"
                                    className="w-full bg-black/40 p-5 rounded-2xl border border-white/10 text-2xl font-black text-center focus:border-primary outline-none"
                                    onChange={e => setBulkValues({ ...bulkValues, purchaseVat: parseInt(e.target.value) })}
                                />
                            </div>
                        </div>
                    )}

                    {mode === 'barcode' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {selectedProducts.map(product => (
                                <div key={product.id} className="bg-white/5 border border-white/5 rounded-3xl p-6 flex flex-col gap-4 hover:bg-white/[0.08] transition-colors group">
                                    <div className="flex flex-col">
                                        <div className="text-xs font-black text-white/90 truncate mb-1">{product.name}</div>
                                        <div className="text-[10px] text-muted font-mono tracking-wider opacity-60">{product.code}</div>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Barkodu okutun..."
                                        defaultValue={product.barcode}
                                        onChange={(e) => setBulkValues({ ...bulkValues, [product.id]: e.target.value })}
                                        autoFocus={selectedIds[0] === product.id}
                                        className="bg-black/60 border border-white/10 p-4 rounded-xl text-primary font-black text-sm focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none transition-all"
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {mode === 'price' && (
                        <div className="flex flex-col gap-8">
                            {/* Wizard Bar */}
                            <div className="sticky top-0 z-10 flex justify-center pb-6">
                                <div className="bg-slate-900/90 border border-primary/40 rounded-3xl py-3 px-8 flex items-center gap-6 shadow-2xl backdrop-blur-2xl">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-primary tracking-[3px] uppercase leading-none mb-1">Akıllı Sihirbaz</span>
                                        <div className="text-white text-xs font-bold leading-none italic opacity-50">Tümüne Uygula</div>
                                    </div>
                                    <div className="w-px h-8 bg-white/10"></div>
                                    <select
                                        className="bg-transparent text-white border-none text-xs font-black uppercase tracking-wider cursor-pointer outline-none"
                                        value={adjTarget}
                                        onChange={e => setAdjTarget(e.target.value as any)}
                                    >
                                        <option value="sell">Satış Fiyatları</option>
                                        <option value="buy">Alış Fiyatları</option>
                                        <option value="both">Tüm Fiyatlar</option>
                                    </select>
                                    <select
                                        className="bg-transparent text-white border-none text-xs font-black uppercase tracking-wider cursor-pointer outline-none"
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
                                        className="bg-black/60 border border-white/10 w-24 py-2 px-4 text-white rounded-xl text-sm font-black text-center focus:border-primary outline-none"
                                    />
                                    <button
                                        onClick={applyAdjustmentRule}
                                        className="bg-primary text-white border-none py-2.5 px-6 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-primary/80 transition-all shadow-lg shadow-primary/40"
                                    >
                                        Hepsini Güncelle
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-10">
                                {selectedProducts.map((product) => {
                                    const currentValues = bulkValues[product.id] || { buyPrice: product.buyPrice, price: product.price };
                                    return (
                                        <div key={product.id} className="bg-white/5 border border-white/5 rounded-3xl p-6 hover:bg-white/[0.08] transition-all group">
                                            <div className="flex flex-col mb-4">
                                                <div className="text-[11px] font-black text-white/90 truncate mb-1 leading-tight" title={product.name}>{product.name}</div>
                                                <div className="text-[9px] text-muted font-bold uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-opacity">{product.code}</div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="flex flex-col gap-1.5">
                                                    <label className="text-[9px] text-muted font-black tracking-widest uppercase">ALIŞ</label>
                                                    <input
                                                        type="number"
                                                        className="w-full bg-black/40 border border-white/10 p-2.5 rounded-xl text-xs font-bold focus:border-white/30 outline-none"
                                                        value={currentValues.buyPrice}
                                                        onChange={(e) => {
                                                            const newVals = { ...bulkValues, [product.id]: { ...currentValues, buyPrice: parseFloat(e.target.value) } };
                                                            setBulkValues(newVals);
                                                        }}
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-1.5">
                                                    <label className="text-primary text-[9px] font-black tracking-widest uppercase">SATIŞ</label>
                                                    <input
                                                        type="number"
                                                        className="w-full bg-primary/10 border border-primary/20 p-2.5 rounded-xl text-xs font-black text-primary focus:border-primary outline-none"
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

                <div className="p-10 border-t border-white/10 bg-white/5 flex justify-end gap-6 items-center">
                    <button className="text-[11px] font-black uppercase tracking-[3px] text-muted hover:text-white transition-colors" onClick={onClose} disabled={isProcessing}>VAZGEÇ</button>
                    <button className="btn-primary px-12 py-5 text-base font-black tracking-[2px]" onClick={handleApply} disabled={isProcessing}>
                        {isProcessing ? 'SİSTEME İŞLENİYOR...' : '🚀 ONAYLA'}
                    </button>
                </div>
            </div>
        </div>
    );
}
