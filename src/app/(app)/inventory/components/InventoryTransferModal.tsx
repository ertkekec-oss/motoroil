import React, { useState, useEffect } from 'react';
import { Product } from '@/contexts/AppContext';
import { EnterpriseInput, EnterpriseSelect, EnterpriseButton } from '@/components/ui/enterprise';

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
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/5 flex items-center justify-center dark:hover:bg-white/10 transition-colors text-slate-500 dark:text-slate-400 font-medium">✕</button>
                </div>

                <div className="p-8 flex flex-col gap-6 bg-slate-50/50 dark:bg-[#0f172a]/50">
                    <div className="flex flex-col gap-2 relative z-10">
                        <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest px-1">Transfer Edilecek Ürün</label>
                        <EnterpriseSelect value={transferData.productId} onChange={e => setTransferData({ ...transferData, productId: parseInt(e.target.value) || 0 })}>

                            <option value="0">--- Bir ürün seçin ---</option>
                            {filteredProducts.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.name} ({p.branch} - Stok: {p.stock})
                                </option>
                            ))}
                        
                        </EnterpriseSelect>
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
                            <EnterpriseSelect value={transferData.to} onChange={e => setTransferData({ ...transferData, to: e.target.value })}>

                                {branches.map(branch => (
                                    <option key={branch} value={branch}>{branch}</option>
                                ))}
                            
                        </EnterpriseSelect>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 relative z-10">
                        <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest px-1">Transfer Miktarı</label>
                        <EnterpriseInput type="number" value={transferData.qty || ''} onChange={e => setTransferData({ ...transferData, qty: parseInt(e.target.value) || 0 })} placeholder="0" className="text-center font-black text-[24px]" />
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0f172a] flex flex-col gap-3 relative z-10">
                    <EnterpriseButton className="w-full h-14" onClick={handleSubmit} disabled={isProcessing || !transferData.productId || transferData.qty <= 0}>
                        {isProcessing ? 'İŞLENİYOR...' : (isSystemAdmin ? 'TRANSFERİ TAMAMLA' : 'ONAY TALEBİ GÖNDER')}
                    </EnterpriseButton>
                    <EnterpriseButton variant="secondary" className="w-full" onClick={onClose} disabled={isProcessing}>
                        İptal Et
                    </EnterpriseButton>
                </div>
            </div>
        </div>
    );
}
