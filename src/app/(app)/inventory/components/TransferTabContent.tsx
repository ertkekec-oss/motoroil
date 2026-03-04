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

            {/* SAĞ KOLON: YENİ TRANSFER MOTORU */}
            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 shadow-sm rounded-[20px] flex flex-col p-6 h-[calc(100vh-200px)] sticky top-6">
                <div className="mb-6 border-b border-slate-100 dark:border-white/5 pb-4">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <ArrowRightLeft className="w-5 h-5 text-indigo-600" />
                        Yeni Transfer (Hızlı Sevkiyat)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Ürün barkodu okutun veya listeden arayın.</p>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6 bg-slate-50 dark:bg-[#1e293b] p-4 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">ÇIKIŞ (KAYNAK)</label>
                        <select className="w-full h-10 px-3 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-colors shadow-sm cursor-pointer"
                            value={transferData.from}
                            onChange={(e) => setTransferData({ ...transferData, from: e.target.value })}
                        >
                            {branches.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">VARIŞ (HEDEF)</label>
                        <select className="w-full h-10 px-3 bg-blue-50 border border-blue-200 rounded-xl text-xs font-bold text-blue-800 outline-none focus:border-blue-500 transition-colors shadow-sm cursor-pointer"
                            value={transferData.to}
                            onChange={(e) => setTransferData({ ...transferData, to: e.target.value })}
                        >
                            {branches.filter(b => b !== transferData.from).map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>
                </div>

                <div className="relative mb-6">
                    <input type="text" placeholder="Ürün Ara (Ad, Kod, Barkod)..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-12 pl-12 pr-4 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-2xl text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all shadow-sm placeholder-slate-400"
                    />
                    <div className="absolute left-4 top-3.5 text-slate-400">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                </div>

                {searchTerm && filteredProducts.length > 0 && (
                    <div className="mb-4 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-xl shadow-xl max-h-60 overflow-y-auto z-20 absolute w-[calc(100%-48px)] top-[270px]">
                        {filteredProducts.slice(0, 10).map(product => (
                            <div key={product.id} className="flex justify-between items-center p-3 border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:bg-[#1e293b] cursor-pointer transition-colors"
                                onClick={() => {
                                    const exists = transferCart.find((item: any) => item.id === product.id);
                                    if (exists) { showWarning('Zaten Ekli', 'Bu ürün zaten transfer listesinde.'); }
                                    else if (product.stock <= 0) { showError('Stok Yok', 'Bu ürünün stoğu tükendiği için transfer edilemez.'); }
                                    else { setTransferCart([...transferCart, { ...product, qty: 1 }]); setSearchTerm(''); }
                                }}
                            >
                                <div>
                                    <div className="text-[13px] font-bold text-slate-900 dark:text-white">{product.name}</div>
                                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{product.code} • Mevcut: <span className="font-bold text-slate-700 dark:text-slate-300">{product.stock}</span></div>
                                </div>
                                <div className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 shadow-sm hover:bg-blue-100">Seç</div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex-1 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                    <div className="bg-slate-50 dark:bg-[#1e293b] px-5 py-3 border-b border-slate-200 dark:border-white/5 flex justify-between items-center h-[52px]">
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px]">{transferCart.length}</div> Transfer Listesi</span>
                        {transferCart.length > 0 && <button onClick={() => setTransferCart([])} className="text-[11px] font-bold text-red-500 uppercase hover:underline">Temizle</button>}
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scroll">
                        {transferCart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-[12px] font-semibold text-slate-400 gap-3 opacity-60">
                                <PackageOpen className="w-10 h-10 text-slate-300" />
                                <div className="text-center">
                                    <p className="text-sm font-bold text-slate-600 dark:text-slate-400">Henüz ürün eklenmedi</p>
                                    <p className="text-xs mt-1">Arama kutusundan ürün seçerek transfer listesini oluşturun.</p>
                                </div>
                            </div>
                        ) : (
                            transferCart.map((item: any, idx: number) => (
                                <div key={idx} className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 p-4 rounded-xl flex items-center justify-between shadow-sm hover:border-blue-300 transition-colors gap-3">
                                    <div className="flex-1 overflow-hidden pr-3">
                                        <div className="text-sm font-bold text-slate-900 dark:text-white truncate">{item.name}</div>
                                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1 uppercase">MAX DEPO: {item.stock} ADET</div>
                                    </div>
                                    <div className="flex items-center bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-xl p-1 shrink-0 shadow-sm">
                                        <button onClick={() => {
                                            const newCart = [...transferCart];
                                            newCart[idx].qty = Math.max(1, item.qty - 1);
                                            setTransferCart(newCart);
                                        }} className="w-8 h-8 flex items-center justify-center hover:bg-white dark:bg-[#0f172a] rounded-lg text-slate-600 dark:text-slate-400 font-bold border border-transparent hover:border-slate-200 dark:border-white/5 shadow-sm transition-all">-</button>
                                        <input type="number" className="w-12 bg-transparent text-center text-sm font-black text-slate-900 dark:text-white outline-none" value={item.qty} onChange={(e) => {
                                            const val = Math.max(1, Math.min(item.stock, parseInt(e.target.value) || 1));
                                            const newCart = [...transferCart];
                                            newCart[idx].qty = val;
                                            setTransferCart(newCart);
                                        }} />
                                        <button onClick={() => {
                                            const newCart = [...transferCart];
                                            newCart[idx].qty = Math.min(item.stock, item.qty + 1);
                                            setTransferCart(newCart);
                                        }} className="w-8 h-8 flex items-center justify-center hover:bg-white dark:bg-[#0f172a] rounded-lg text-slate-600 dark:text-slate-400 font-bold border border-transparent hover:border-slate-200 dark:border-white/5 shadow-sm transition-all">+</button>
                                    </div>
                                    <button onClick={() => setTransferCart(transferCart.filter((_, i) => i !== idx))} className="ml-1 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-rose-500 rounded-lg transition-colors font-black">✕</button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="mt-6">
                    <button
                        onClick={handleStartShipment}
                        disabled={transferCart.length === 0}
                        className={`w-full h-[52px] rounded-xl text-[13px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center justify-center gap-2 ${transferCart.length > 0 ? 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-md hover:scale-[1.02]' : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'}`}
                    >
                        SEVKİYATI BAŞLAT <span className="text-white/70 bg-black/20 px-2 py-0.5 rounded-full ml-1">({transferCart.reduce((acc, i) => acc + i.qty, 0)})</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
