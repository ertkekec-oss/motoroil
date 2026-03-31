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
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-6 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-[#0f172a] w-full max-w-lg rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-8 zoom-in-95 duration-500">
                <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] flex justify-between items-start relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                    <div className="relative z-10">
                        <h2 className="text-[20px] font-black text-slate-900 dark:text-white flex items-center gap-2 mb-1 tracking-tight">
                            Stok Transferi
                        </h2>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)] animate-pulse"></span>
                            <p className="text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-widest">Şubeler Arası Güvenli Taşıma</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-500 dark:text-slate-400 relative z-10 border border-slate-200 dark:border-slate-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-8 flex flex-col gap-6 bg-slate-50/50 dark:bg-[#0f172a]/50">
                    <div className="flex flex-col gap-2 relative z-10">
                        <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest px-1">Transfer Edilecek Ürün</label>
                        <select
                            className="w-full bg-white dark:bg-[#1e293b] p-3 text-[13px] font-bold text-slate-900 dark:text-white rounded-[16px] border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors cursor-pointer shadow-sm disabled:opacity-50"
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

                    <div className="grid grid-cols-2 gap-5 relative z-10">
                        <div className="flex flex-col gap-2">
                            <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest px-1">Çıkış Şubesi</label>
                            <div className="w-full h-[46px] bg-slate-100 dark:bg-slate-800/50 px-4 text-[13px] font-bold text-slate-500 dark:text-slate-400 rounded-[16px] border border-slate-200 dark:border-slate-700/50 shadow-inner flex items-center">
                                {selectedProduct?.branch || '-'}
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest px-1">Varış Şubesi</label>
                            <select
                                className="w-full h-[46px] bg-white dark:bg-[#1e293b] px-4 text-[13px] font-bold text-slate-900 dark:text-white rounded-[16px] border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                                value={transferData.to}
                                onChange={e => setTransferData({ ...transferData, to: e.target.value })}
                            >
                                {branches.map(branch => (
                                    <option key={branch} value={branch}>{branch}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 relative z-10">
                        <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest px-1">Transfer Miktarı</label>
                        <div className="relative">
                            <input
                                type="number"
                                className="w-full bg-white dark:bg-[#1e293b] py-5 px-6 text-[32px] font-black text-slate-900 dark:text-white rounded-[20px] border-2 border-slate-200 dark:border-slate-700 focus:border-indigo-500 outline-none transition-colors shadow-sm text-center tabular-nums"
                                value={transferData.qty || ''}
                                onChange={e => setTransferData({ ...transferData, qty: parseInt(e.target.value) || 0 })}
                                placeholder="0"
                            />
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-bold text-[12px] uppercase tracking-widest pointer-events-none bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">ADET</div>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0f172a] flex flex-col gap-3 relative z-10">
                    <button
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-[16px] font-black text-[14px] uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98] flex items-center justify-center gap-2 border border-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                        onClick={handleSubmit}
                        disabled={isProcessing || !transferData.productId || transferData.qty <= 0}
                    >
                        {isProcessing ? 'İŞLENİYOR...' : (isSystemAdmin ? 'TRANSFERİ TAMAMLA' : 'ONAY TALEBİ GÖNDER')}
                    </button>
                    <button
                        className="w-full py-3 text-[12px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                        onClick={onClose}
                        disabled={isProcessing}
                    >
                        İptal Et
                    </button>
                </div>
            </div>
        </div>
    );
}
