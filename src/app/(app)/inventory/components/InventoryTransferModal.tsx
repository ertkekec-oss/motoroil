
import React, { useState, useEffect } from 'react';
import { Product } from '@/contexts/AppContext';

interface TransferData {
    productId: number;
    from: string;
    to: string;
    qty: number;
}

interface InventoryTransferModalProps {
    isOpen: boolean;
    onClose: () => void;
    products: Product[];
    branches: string[];
    isSystemAdmin: boolean;
    isProcessing: boolean;
    onTransfer: (data: TransferData) => void;
    filteredProducts: Product[];
}

export default function InventoryTransferModal({
    isOpen,
    onClose,
    products,
    branches,
    isSystemAdmin,
    isProcessing,
    onTransfer,
    filteredProducts
}: InventoryTransferModalProps) {
    const [transferData, setTransferData] = useState<TransferData>({
        productId: 0,
        from: branches[0] || '',
        to: branches[1] || branches[0] || '',
        qty: 0
    });

    useEffect(() => {
        if (isOpen) {
            setTransferData({
                productId: 0,
                from: branches[0] || '',
                to: branches[1] || branches[0] || '',
                qty: 0
            });
        }
    }, [isOpen, branches]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        onTransfer(transferData);
    };

    const selectedProduct = products.find(p => p.id === transferData.productId);

    return (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-6 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-[#0f172a] w-full max-w-lg rounded-[24px] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col animate-in">
                <div className="px-8 py-6 border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-[#1e293b]/50 flex justify-between items-center">
                    <div>
                        <h2 className="text-[20px] font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
                            <span>📦 Stok Transferi</span>
                        </h2>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></span>
                            <p className="text-slate-500 text-[11px] font-medium uppercase tracking-wider">Şubeler Arası Güvenli Taşıma</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/10 transition-colors text-slate-500 font-medium">✕</button>
                </div>

                <div className="p-8 flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                        <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ürün Seçimi</label>
                        <select
                            className="w-full bg-white dark:bg-[#0f172a] p-3 text-[13px] font-semibold text-slate-900 dark:text-white rounded-[12px] border border-slate-200 dark:border-white/10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                            value={transferData.productId}
                            onChange={e => setTransferData({ ...transferData, productId: parseInt(e.target.value) })}
                        >
                            <option value="0">--- Bir ürün seçin ---</option>
                            {filteredProducts.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.name} ({p.branch} - Stok: {p.stock})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                        <div className="flex flex-col gap-2">
                            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Kaynak</label>
                            <div className="w-full bg-slate-50 dark:bg-[#1e293b] p-3 text-[13px] font-semibold text-slate-500 dark:text-slate-400 rounded-[12px] border border-slate-200 dark:border-white/10 shadow-sm flex items-center">
                                {selectedProduct?.branch || '-'}
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Hedef</label>
                            <select
                                className="w-full bg-white dark:bg-[#0f172a] p-3 text-[13px] font-semibold text-slate-900 dark:text-white rounded-[12px] border border-slate-200 dark:border-white/10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                                value={transferData.to}
                                onChange={e => setTransferData({ ...transferData, to: e.target.value })}
                            >
                                {branches.map(branch => (
                                    <option key={branch} value={branch}>{branch}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Miktar</label>
                        <div className="relative">
                            <input
                                type="number"
                                className="w-full bg-white dark:bg-[#1e293b] py-4 px-6 text-[24px] font-bold text-slate-900 dark:text-white rounded-[16px] border border-slate-200 dark:border-white/10 text-center focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors shadow-inner"
                                value={transferData.qty}
                                onChange={e => setTransferData({ ...transferData, qty: parseInt(e.target.value) || 0 })}
                                placeholder="0"
                            />
                            <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-semibold text-[11px] uppercase tracking-wider pointer-events-none">ADET</div>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#1e293b] flex flex-col gap-3">
                    <button
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-[12px] font-semibold text-[14px] tracking-wider transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        onClick={handleSubmit}
                        disabled={isProcessing || !transferData.productId || transferData.qty <= 0}
                    >
                        {isProcessing ? 'İŞLENİYOR...' : (isSystemAdmin ? 'TRANSFERİ TAMAMLA' : 'ONAY TALEBİ GÖNDER')}
                    </button>
                    <button
                        className="w-full py-2.5 text-[12px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                        onClick={onClose}
                        disabled={isProcessing}
                    >
                        VAZGEÇ
                    </button>
                </div>
            </div>
        </div>
    );
}
