import React, { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useInventory, Product, StockTransfer } from '@/contexts/InventoryContext';
import { useModal } from '@/contexts/ModalContext';
import { Truck, ArrowRight, ArrowRightLeft, PackageOpen, AlertTriangle } from 'lucide-react';

interface TransferTabContentProps {
    isSystemAdmin: boolean;
    products: Product[];
    filteredProducts: Product[];
    branches: string[];
    searchTerm: string;
    setSearchTerm: (s: string) => void;
}

export default function TransferTabContent({
    isSystemAdmin,
    products,
    filteredProducts,
    branches,
    searchTerm,
    setSearchTerm
}: TransferTabContentProps) {
    const { currentUser, activeBranchName } = useApp();
    const {
        stockTransfers,
        refreshStockTransfers,
        startStockTransfer,
        finalizeTransfer,
    } = useInventory();
    const { showSuccess, showWarning, showError, showConfirm } = useModal();

    const [transferCart, setTransferCart] = useState<any[]>([]);
    const [transferData, setTransferData] = useState({
        from: activeBranchName !== 'Tümü' ? activeBranchName : 'Merkez',
        to: branches.find(b => b !== activeBranchName) || (branches[0] === 'Merkez' ? branches[1] : branches[0])
    });
    const [viewMode, setViewMode] = useState<'cart' | 'products'>('products');

    const handleStartShipment = async () => {
        if (transferCart.length === 0) return;

        let successCount = 0;
        for (const item of transferCart) {
            const ok = await startStockTransfer({
                productId: String(item.id),
                productName: item.name,
                productCode: item.code,
                qty: item.qty,
                fromBranch: transferData.from,
                toBranch: transferData.to,
                requestedBy: currentUser?.name || 'Sistem',
                notes: 'Hızlı Transfer'
            });
            if (ok) successCount++;
        }

        if (successCount > 0) {
            showSuccess('Sevkiyat Başlatıldı', `${successCount} kalem ürün yola çıktı.`);
            setTransferCart([]);
        } else {
            showError('Hata', 'Transfer başlatılamadı.');
        }
    };

    const handleReceive = (transfer: StockTransfer) => {
        showConfirm(
            'Mal Kabul',
            `${transfer.productName} (${transfer.qty} adet) stoklarınıza eklenecek. Emin misiniz?`,
            async () => {
                const ok = await finalizeTransfer(transfer.id, 'RECEIVE');
                if (ok) showSuccess('Başarılı', 'Ürün stoklarınıza eklendi.');
            }
        );
    };

    const handleCancel = (transfer: StockTransfer) => {
        showConfirm(
            'Transfer İptali',
            `Bu transferi iptal etmek istediğinize emin misiniz? Stoklar kaynak depoya iade edilecek.`,
            async () => {
                const ok = await finalizeTransfer(transfer.id, 'CANCEL');
                if (ok) showSuccess('İptal Edildi', 'Ürün kaynak depoya iade edildi.');
            }
        );
    };

    const visibleTransfers = stockTransfers.filter(t =>
        activeBranchName === 'Tümü' || t.fromBranch === activeBranchName || t.toBranch === activeBranchName
    );

    const inTransitTransfers = visibleTransfers.filter(t => t.status === 'IN_TRANSIT');

    return (
        <div className="animate-in fade-in grid grid-cols-1 lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_500px] gap-6">
            {/* SOL KOLON: BEKLEYEN/YOLDAKİ TRANSFERLER */}
            <div className="flex flex-col gap-6">
                <div className="bg-white dark:bg-[#0f172a] rounded-[20px] border border-slate-200 dark:border-white/5 shadow-sm p-6">
                    <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-white/5 pb-4">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                                <Truck className="w-5 h-5 text-blue-600" />
                                Bekleyen / Yoldaki Transferler
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Kabul bekleyen aktif stok hareketleri ({inTransitTransfers.length})</p>
                        </div>
                        <button onClick={refreshStockTransfers} className="px-5 py-2.5 border border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300 font-semibold rounded-lg text-xs hover:bg-slate-50 transition-colors bg-white dark:bg-[#0f172a] shadow-sm flex items-center gap-2">
                            Yenile
                        </button>
                    </div>

                    <div className="space-y-4">
                        {inTransitTransfers.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-2xl bg-slate-50 dark:bg-[#1e293b]">
                                <PackageOpen className="mx-auto h-8 w-8 text-slate-400 mb-3" />
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Bekleyen transfer yok</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Şu anda yolda olan veya kabul bekleyen ürün bulunmuyor.</p>
                            </div>
                        ) : (
                            inTransitTransfers.map(t => (
                                <div key={t.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-2xl hover:shadow-md transition-shadow shadow-sm gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-bold uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded flex items-center gap-1"><Truck className="w-3 h-3" /> YOLDA</span>
                                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{`${new Date(t.shippedAt).toLocaleDateString('tr-TR')} ${new Date(t.shippedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`}</span>
                                        </div>
                                        <div className="font-bold text-sm text-slate-900 dark:text-white">{t.productName}</div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t.productCode}</div>
                                        <div className="flex items-center gap-2 mt-3 p-2 bg-slate-50 dark:bg-[#1e293b] rounded-xl border border-slate-100 dark:border-white/5 w-max">
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{t.fromBranch}</span>
                                            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                                            <span className="text-xs font-black text-blue-600">{t.toBranch}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3">
                                        <div className="text-right">
                                            <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Miktar</div>
                                            <div className="text-xl font-black text-slate-900 dark:text-white">{t.qty} <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">ADET</span></div>
                                        </div>
                                        <div className="flex gap-2">
                                            {(isSystemAdmin || t.fromBranch === activeBranchName) && (
                                                <button onClick={() => handleCancel(t)} className="px-4 py-2 border border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold transition-colors">
                                                    İptal
                                                </button>
                                            )}
                                            {t.toBranch === activeBranchName || activeBranchName === 'Tümü' || isSystemAdmin ? (
                                                <button onClick={() => handleReceive(t)} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors">
                                                    Kabul Et
                                                </button>
                                            ) : (
                                                <div className="px-4 py-2 bg-slate-50 dark:bg-[#1e293b] text-slate-400 border border-slate-100 dark:border-white/5 rounded-lg text-xs font-bold italic">
                                                    Kabul Bekleniyor
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="bg-white dark:bg-[#0f172a] rounded-[20px] border border-slate-200 dark:border-white/5 shadow-sm p-6">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-500" /> Otonom Transfer Önerileri (What-If)</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Ağ bazlı stok analizleri sonucu önerilen otomatik transferler.</p>
                    <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/50 flex justify-between items-center group hover:bg-blue-50 transition-colors">
                        <div>
                            <div className="text-sm font-bold text-blue-900 mb-1">Ağır Vasıta Filtre Seti (10 Adet)</div>
                            <div className="text-[11px] font-bold text-blue-600 flex items-center gap-1.5"><span className="text-blue-800 bg-blue-100/50 px-1 py-0.5 rounded">Kadıköy (Fazla Stok)</span> <ArrowRight className="w-3 h-3" /> <span className="text-blue-800 bg-blue-100/50 px-1 py-0.5 rounded">Ümraniye (Yok Satma Riski)</span></div>
                        </div>
                        <button className="px-4 py-2 bg-white dark:bg-[#0f172a] border border-blue-200 text-blue-700 hover:bg-blue-600 hover:text-white rounded-lg text-xs font-bold transition-all shadow-sm">
                            Hemen Başlat
                        </button>
                    </div>
                </div>
            </div>

            {/* SAĞ KOLON: YENİ TRANSFER MOTORU (ENTERPRISE REDESIGN) */}
            <div className="bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-slate-800 shadow-xl rounded-[24px] flex flex-col p-6 h-[calc(100vh-120px)] sticky top-6 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <ArrowRightLeft className="w-5 h-5 text-indigo-500" />
                            Yeni Transfer Motoru
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-semibold uppercase tracking-wider">Hızlı ve Otonom Sevkiyat</p>
                    </div>
                </div>

                {/* Compact Source/Target Selection */}
                <div className="flex items-center gap-3 mb-6 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner">
                    <div className="flex-1">
                        <label className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest px-2 block mb-1">KAYNAK DEPO</label>
                        <select className="w-full bg-transparent border-none text-sm font-bold text-slate-900 dark:text-white outline-none px-2 cursor-pointer appearance-none"
                            value={transferData.from}
                            onChange={(e) => setTransferData({ ...transferData, from: e.target.value })}
                        >
                            {branches.map(b => <option key={b} value={b} className="text-black">{b}</option>)}
                        </select>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-sm z-10">
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="flex-1 text-right">
                        <label className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest px-2 block mb-1">HEDEF DEPO</label>
                        <select className="w-full bg-transparent border-none text-sm font-bold text-indigo-600 dark:text-indigo-400 outline-none px-2 cursor-pointer appearance-none text-right"
                            value={transferData.to}
                            onChange={(e) => setTransferData({ ...transferData, to: e.target.value })}
                        >
                            {branches.filter(b => b !== transferData.from).map(b => <option key={b} value={b} className="text-black">{b}</option>)}
                        </select>
                    </div>
                </div>

                {/* Switcher Tabs */}
                <div className="flex p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl mb-4 border border-slate-200 dark:border-slate-700/50">
                    <button 
                        onClick={() => setViewMode('products')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${viewMode === 'products' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        Ürün Ekle
                    </button>
                    <button 
                        onClick={() => setViewMode('cart')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${viewMode === 'cart' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        Transfer Sepeti
                        {transferCart.length > 0 && (
                            <span className={`px-1.5 py-0.5 rounded text-[10px] ${viewMode === 'cart' ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400'}`}>
                                {transferCart.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* Active View */}
                <div className="flex-1 bg-slate-50 dark:bg-[#0f172a]/50 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden flex flex-col">
                    {viewMode === 'products' ? (
                        <>
                            <div className="relative border-b border-slate-200 dark:border-slate-800/80 bg-white dark:bg-transparent">
                                <input type="text" placeholder="Ad, Kod veya Barkod ara..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full h-12 pl-11 pr-4 bg-transparent border-none text-sm font-semibold text-slate-900 dark:text-white outline-none placeholder-slate-400"
                                />
                                <div className="absolute left-4 top-3.5 text-slate-400">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 custom-scroll">
                                {filteredProducts.length === 0 ? (
                                    <div className="h-full flex items-center justify-center text-sm font-medium text-slate-400">Sonuç bulunamadı</div>
                                ) : (
                                    filteredProducts.map(product => {
                                        const exists = transferCart.find((item: any) => item.id === product.id);
                                        return (
                                            <div key={product.id} 
                                                onClick={() => {
                                                    if (exists) {
                                                        setTransferCart(transferCart.filter((item: any) => item.id !== product.id));
                                                    } else if (product.stock <= 0) {
                                                        showError('Stok Yok', 'Bu ürünün stoğu tükendiği için transfer edilemez.');
                                                    } else {
                                                        setTransferCart([...transferCart, { ...product, qty: 1 }]);
                                                        showSuccess('Eklendi', `${product.name} sepete eklendi.`);
                                                    }
                                                }}
                                                className={`flex items-center justify-between p-3 rounded-xl border ${exists ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10' : 'border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-600'} cursor-pointer transition-all`}
                                            >
                                                <div>
                                                    <div className={`text-[13px] font-bold ${exists ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-900 dark:text-white'}`}>{product.name}</div>
                                                    <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">{product.code} • Stok: <span className={`font-bold ${product.stock > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{product.stock}</span></div>
                                                </div>
                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${exists ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-300 dark:border-slate-600 bg-transparent'}`}>
                                                    {exists && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                                    {!exists && <span className="text-slate-400 text-sm font-black leading-none">+</span>}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 custom-scroll">
                            {transferCart.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-[12px] font-medium text-slate-400 gap-3 opacity-80">
                                    <PackageOpen className="w-12 h-12 text-slate-300 dark:text-slate-600" />
                                    <div className="text-center">
                                        <p className="text-sm font-bold text-slate-600 dark:text-slate-400">Sepetiniz Boş</p>
                                        <p className="text-[11px] mt-1 text-slate-500">Ürün Ekle bölümünden listeye parça ekleyin.</p>
                                    </div>
                                    <button onClick={() => setViewMode('products')} className="mt-2 text-xs font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-4 py-2 rounded-lg border border-indigo-100 dark:border-indigo-500/20">Ürün Listesine Git</button>
                                </div>
                            ) : (
                                transferCart.map((item: any, idx: number) => (
                                    <div key={idx} className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-3 rounded-xl flex flex-col shadow-sm group hover:border-indigo-400 transition-colors gap-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 overflow-hidden pr-2">
                                                <div className="text-[13px] font-bold text-slate-900 dark:text-white truncate" title={item.name}>{item.name}</div>
                                                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-1 uppercase">MAX DEPO: {item.stock} ADET</div>
                                            </div>
                                            <button onClick={() => setTransferCart(transferCart.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-rose-500 bg-slate-50 hover:bg-rose-50 dark:bg-slate-900/50 dark:hover:bg-rose-500/20 p-1.5 rounded-lg transition-colors">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        </div>
                                        <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 px-2 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700/50">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">MİKTAR:</span>
                                            <div className="flex items-center">
                                                <button onClick={() => {
                                                    const newCart = [...transferCart];
                                                    newCart[idx].qty = Math.max(1, item.qty - 1);
                                                    setTransferCart(newCart);
                                                }} className="w-7 h-7 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-600 dark:text-slate-300 font-bold shadow-sm">-</button>
                                                <input type="number" className="w-12 bg-transparent text-center text-[13px] font-black text-slate-900 dark:text-white outline-none" value={item.qty} onChange={(e) => {
                                                    const val = Math.max(1, Math.min(item.stock, parseInt(e.target.value) || 1));
                                                    const newCart = [...transferCart];
                                                    newCart[idx].qty = val;
                                                    setTransferCart(newCart);
                                                }} />
                                                <button onClick={() => {
                                                    const newCart = [...transferCart];
                                                    newCart[idx].qty = Math.min(item.stock, item.qty + 1);
                                                    setTransferCart(newCart);
                                                }} className="w-7 h-7 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-600 dark:text-slate-300 font-bold shadow-sm">+</button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Final Action */}
                <div className="mt-5">
                    <button
                        onClick={handleStartShipment}
                        disabled={transferCart.length === 0}
                        className={`w-full h-[52px] rounded-2xl text-[13px] font-black uppercase tracking-widest transition-all outline-none flex items-center justify-center gap-2 ${transferCart.length > 0 ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-[0_8px_20px_-6px_rgba(79,70,229,0.5)] transform hover:-translate-y-0.5' : 'bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-600 cursor-not-allowed'}`}
                    >
                        SEVKİYATI BAŞLAT 
                        {transferCart.length > 0 && (
                            <span className="text-white/90 bg-black/20 px-2 py-0.5 rounded ml-1 text-[11px] font-bold">
                                {transferCart.reduce((acc, i) => acc + i.qty, 0)} PÇ
                            </span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
