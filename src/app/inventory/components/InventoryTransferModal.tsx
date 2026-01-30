
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
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-6 bg-black/85 backdrop-blur-xl animate-fade-in">
            <div className="w-full max-w-xl glass-plus rounded-[40px] p-12 border border-primary/30 shadow-[0_50px_100px_rgba(0,0,0,0.9)] animate-in">
                <div className="flex justify-between items-start mb-10">
                    <div>
                        <h2 className="text-3xl font-black bg-gradient-to-br from-white to-white/50 bg-clip-text text-transparent mb-2">
                            📦 Stok Transferi
                        </h2>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_var(--primary)]"></span>
                            <p className="text-muted text-xs font-bold uppercase tracking-widest">Şubeler Arası Güvenli Taşıma</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors text-xl font-light">&times;</button>
                </div>

                <div className="flex flex-col gap-8">
                    <div className="flex flex-col gap-3">
                        <label className="text-primary text-[10px] font-black tracking-[3px] uppercase">Ürün Seçimi</label>
                        <select
                            className="w-full bg-black/40 p-4.5 text-base font-bold rounded-2xl border border-white/10 focus:border-primary outline-none accent-primary transition-all cursor-pointer"
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

                    <div className="grid grid-cols-2 gap-6">
                        <div className="flex flex-col gap-3">
                            <label className="text-primary text-[10px] font-black tracking-[3px] uppercase">Kaynak</label>
                            <div className="w-full bg-white/5 p-4.5 text-sm font-bold rounded-2xl border border-white/5 text-white/50">
                                {selectedProduct?.branch || '-'}
                            </div>
                        </div>
                        <div className="flex flex-col gap-3">
                            <label className="text-primary text-[10px] font-black tracking-[3px] uppercase">Hedef</label>
                            <select
                                className="w-full bg-black/40 p-4.5 text-sm font-bold rounded-2xl border border-white/10 focus:border-primary outline-none cursor-pointer"
                                value={transferData.to}
                                onChange={e => setTransferData({ ...transferData, to: e.target.value })}
                            >
                                {branches.map(branch => (
                                    <option key={branch} value={branch}>{branch}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <label className="text-primary text-[10px] font-black tracking-[3px] uppercase">Miktar</label>
                        <div className="relative">
                            <input
                                type="number"
                                className="w-full bg-black/60 p-6 text-4xl font-black rounded-3xl border border-white/10 text-center focus:border-primary outline-none transition-all"
                                value={transferData.qty}
                                onChange={e => setTransferData({ ...transferData, qty: parseInt(e.target.value) || 0 })}
                                placeholder="0"
                            />
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 text-muted font-black text-xs uppercase">ADET</div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 mt-6">
                        <button
                            className="btn-primary w-full py-5 text-lg font-black tracking-[2px]"
                            onClick={handleSubmit}
                            disabled={isProcessing || !transferData.productId || transferData.qty <= 0}
                        >
                            {isProcessing ? 'İŞLENİYOR...' : (isSystemAdmin ? '🚀 TRANSFERİ TAMAMLA' : '🏁 ONAY TALEBİ GÖNDER')}
                        </button>
                        <button
                            className="w-full py-4 text-xs font-black uppercase tracking-[3px] text-muted hover:text-white transition-colors"
                            onClick={onClose}
                            disabled={isProcessing}
                        >
                            VAZGEÇ
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
