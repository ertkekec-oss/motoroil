
import React, { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useInventory, Product, StockTransfer } from '@/contexts/InventoryContext';
import { useModal } from '@/contexts/ModalContext';

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

    const [isTransferMode, setIsTransferMode] = useState(false);
    const [transferCart, setTransferCart] = useState<any[]>([]);
    const [transferData, setTransferData] = useState({
        from: activeBranchName !== 'Tümü' ? activeBranchName : 'Merkez',
        to: branches.find(b => b !== activeBranchName) || 'Kadıköy'
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
            setIsTransferMode(false);
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

    // Filter transfers based on active branch
    const visibleTransfers = stockTransfers.filter(t =>
        activeBranchName === 'Tümü' || t.fromBranch === activeBranchName || t.toBranch === activeBranchName
    );

    const inTransitTransfers = visibleTransfers.filter(t => t.status === 'IN_TRANSIT');
    const recentTransfers = visibleTransfers.slice(0, 20);

    return (
        <div className="animate-fade-in pb-12">
            {/* TOP: IN TRANSIT / PENDING RECEIPT */}
            {inTransitTransfers.length > 0 && (
                <div className="mb-8 p-6 bg-blue-50 dark:bg-blue-500/5 rounded-[24px] border border-blue-200 dark:border-blue-500/20">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-[16px] font-semibold flex items-center gap-2 text-slate-800 dark:text-white">
                            <span className="animate-pulse flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 text-lg">🚚</span> Yoldaki Sevkiyatlar / Mal Kabul Bekleyenler ({inTransitTransfers.length})
                        </h3>
                    </div>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(380px,1fr))] gap-4">
                        {inTransitTransfers.map(t => (
                            <div key={t.id} className="bg-white dark:bg-[#0f172a] p-5 rounded-[16px] border border-slate-200 dark:border-white/10 hover:border-blue-300 dark:hover:border-blue-500/30 transition-colors shadow-sm">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <div className="text-[14px] font-semibold text-slate-900 dark:text-white">{t.productName}</div>
                                        <div className="text-[11px] text-slate-500 font-medium tracking-wider mt-0.5">{t.productCode}</div>
                                    </div>
                                    <div className="bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 text-[11px] font-semibold px-2 py-1 rounded-md">
                                        {t.qty} ADET
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 py-3 border-y border-slate-100 dark:border-white/5 my-3">
                                    <div className="flex-1 text-center">
                                        <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Kaynak</div>
                                        <div className="text-[13px] font-medium text-slate-900 dark:text-white">{t.fromBranch}</div>
                                    </div>
                                    <div className="text-slate-300 dark:text-slate-600">➔</div>
                                    <div className="flex-1 text-center">
                                        <div className="text-[10px] text-blue-500 uppercase font-semibold tracking-wider">Hedef</div>
                                        <div className="text-[13px] font-medium text-blue-600 dark:text-blue-400">{t.toBranch}</div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {t.toBranch === activeBranchName || activeBranchName === 'Tümü' || isSystemAdmin ? (
                                        <button
                                            onClick={() => handleReceive(t)}
                                            className="flex-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 text-[11px] font-semibold py-2.5 rounded-[10px] transition-colors border border-emerald-200 dark:border-emerald-500/20 shadow-sm"
                                        >
                                            ✅ MAL KABUL ET
                                        </button>
                                    ) : (
                                        <div className="flex-1 text-center py-2.5 text-[11px] text-slate-400 dark:text-slate-500 italic bg-slate-50 dark:bg-slate-800/50 rounded-[10px] border border-slate-200 dark:border-white/10">
                                            Kabul bekleniyor...
                                        </div>
                                    )}
                                    {(isSystemAdmin || t.fromBranch === activeBranchName) && (
                                        <button
                                            onClick={() => handleCancel(t)}
                                            className="px-4 bg-white/5 hover:bg-red-500/10 text-white/40 hover:text-red-500 text-[11px] font-black py-2.5 rounded-xl transition-all border border-transparent hover:border-red-500/20"
                                        >
                                            İPTAL
                                        </button>
                                    )}
                                </div>
                                <div className="mt-3 text-[9px] text-white/20 flex justify-between items-center italic">
                                    <span>🕒 {new Date(t.shippedAt).toLocaleString('tr-TR')}</span>
                                    <span>👤 {t.requestedBy}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* HEADER & ACTIONS */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-black mb-2">🚛 Stok Transfer Merkezi</h2>
                    <p className="text-muted text-[13px]">Şubeler arası ürün sevkiyatı ve mal kabul süreçlerini yönetin.</p>
                </div>
                <div className="flex items-center gap-4">
                    {isTransferMode ? (
                        <button onClick={() => { setIsTransferMode(false); setTransferCart([]); }} className="btn btn-ghost">← Listeye Dön</button>
                    ) : (
                        <button onClick={() => setIsTransferMode(true)} className="btn btn-primary px-6 py-3 text-sm font-extrabold shadow-xl shadow-primary/20">
                            + YENİ SEVKİYAT BAŞLAT
                        </button>
                    )}
                </div>
            </div>

            {isTransferMode ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* LEFT: SEARCH & ADD */}
                    <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 shadow-sm h-[600px] flex flex-col p-6 rounded-[24px]">
                        <h3 className="mb-6 text-[16px] font-semibold border-b border-slate-200 dark:border-white/10 pb-4 flex items-center gap-3 text-slate-900 dark:text-white">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 text-[13px]">1</span> Ürün Seçimi
                        </h3>

                        <input
                            type="text"
                            placeholder="Ürün Ara (Ad, Kod, Barkod)..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 px-4 h-[44px] rounded-[12px] mb-6 text-[13px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors shadow-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                            autoFocus
                        />

                        <div className="flex-1 overflow-y-auto custom-scroll pr-2 flex flex-col gap-2">
                            {filteredProducts && filteredProducts.slice(0, 20).map(product => (
                                <div key={product.id} className="flex justify-between items-center p-3 bg-white dark:bg-[#0f172a] rounded-[12px] border border-slate-200 dark:border-white/10 hover:border-blue-500 cursor-pointer transition-colors group shadow-sm"
                                    onClick={() => {
                                        const exists = transferCart.find((item: any) => item.id === product.id);
                                        if (exists) {
                                            showWarning('Zaten Ekli', 'Bu ürün zaten transfer listesinde.');
                                        } else if (product.stock <= 0) {
                                            showError('Stok Yok', 'Bu ürünün stoğu tükendiği için transfer edilemez.');
                                        } else {
                                            setTransferCart([...transferCart, { ...product, qty: 1 }]);
                                        }
                                    }}
                                >
                                    <div>
                                        <div className="font-semibold text-[13px] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-slate-900 dark:text-white">{product.name}</div>
                                        <div className="text-[11px] text-slate-500 mt-0.5 font-medium tracking-wider">{product.code} • MEVCUT: <span className="text-slate-700 dark:text-slate-300 font-bold">{product.stock}</span></div>
                                    </div>
                                    <button className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 dark:group-hover:bg-blue-500/10 dark:group-hover:text-blue-400 transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT: CART & CONFIRM */}
                    <div className="bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 shadow-sm h-[600px] flex flex-col p-6 rounded-[24px]">
                        <h3 className="mb-6 text-[16px] font-semibold border-b border-slate-200 dark:border-white/10 pb-4 flex items-center gap-3 text-slate-900 dark:text-white">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 text-[13px]">2</span> Sevkiyat Detayları
                        </h3>

                        {/* Source/Target Selection */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-slate-500 dark:text-slate-400 text-[11px] font-semibold tracking-wider uppercase">ÇIKIŞ DEPOSU (KAYNAK)</label>
                                <select
                                    className="h-[40px] px-3 bg-white dark:bg-[#1e293b] rounded-[10px] border border-slate-200 dark:border-white/10 text-[13px] font-medium text-slate-900 dark:text-white outline-none cursor-pointer focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                                    value={transferData.from}
                                    onChange={(e) => setTransferData({ ...transferData, from: e.target.value })}
                                >
                                    {branches.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-slate-500 dark:text-slate-400 text-[11px] font-semibold tracking-wider uppercase">VARIŞ DEPOSU (HEDEF)</label>
                                <select
                                    className="h-[40px] px-3 bg-white dark:bg-[#1e293b] rounded-[10px] border border-slate-200 dark:border-white/10 text-[13px] font-semibold text-blue-600 dark:text-blue-400 outline-none cursor-pointer focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                                    value={transferData.to}
                                    onChange={(e) => setTransferData({ ...transferData, to: e.target.value })}
                                >
                                    {branches.filter(b => b !== transferData.from).map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Cart Items */}
                        <div className="flex-1 overflow-y-auto mb-6 bg-white dark:bg-[#1e293b]/50 rounded-[12px] p-4 border border-slate-200 dark:border-white/10 custom-scroll">
                            {transferCart.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3 opacity-60">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    <div className="text-center">
                                        <div className="text-[14px] font-medium text-slate-600 dark:text-slate-300">Transfer listesi boş</div>
                                        <div className="text-[12px] mt-1 text-slate-400">Soldan ürün seçerek ekleyin</div>
                                    </div>
                                </div>
                            ) : (
                                <table className="w-full text-[13px] text-left">
                                    <thead>
                                        <tr className="text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/10">
                                            <th className="pb-3 pl-2 uppercase font-semibold text-[11px] tracking-wider">Ürün Bilgisi</th>
                                            <th className="pb-3 w-32 text-center uppercase font-semibold text-[11px] tracking-wider">Sevk Miktarı</th>
                                            <th className="pb-3 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transferCart.map((item: any, idx: number) => (
                                            <tr key={idx} className="border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                                                <td className="py-3 pl-2">
                                                    <div className="font-semibold text-slate-900 dark:text-white">{item.name}</div>
                                                    <div className="text-[11px] text-slate-500 mt-0.5">{item.code}</div>
                                                </td>
                                                <td className="py-3">
                                                    <div className="flex items-center justify-center bg-slate-50 dark:bg-[#0f172a] rounded-[10px] border border-slate-200 dark:border-white/10 p-1 gap-1">
                                                        <button
                                                            onClick={() => {
                                                                const newCart = [...transferCart];
                                                                newCart[idx].qty = Math.max(1, item.qty - 1);
                                                                setTransferCart(newCart);
                                                            }}
                                                            className="w-7 h-7 rounded-md hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                                                            </svg>
                                                        </button>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            max={item.stock}
                                                            value={item.qty}
                                                            onChange={(e) => {
                                                                const val = Math.max(1, Math.min(item.stock, parseInt(e.target.value) || 1));
                                                                const newCart = [...transferCart];
                                                                newCart[idx].qty = val;
                                                                setTransferCart(newCart);
                                                            }}
                                                            className="w-12 h-7 bg-transparent text-center font-semibold text-slate-900 dark:text-white outline-none"
                                                        />
                                                        <button
                                                            onClick={() => {
                                                                const newCart = [...transferCart];
                                                                newCart[idx].qty = Math.min(item.stock, item.qty + 1);
                                                                setTransferCart(newCart);
                                                            }}
                                                            className="w-7 h-7 rounded-md hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="py-3 text-right pr-2">
                                                    <button onClick={() => setTransferCart(transferCart.filter((_, i) => i !== idx))} className="w-8 h-8 flex items-center justify-center rounded-[10px] hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-4">
                            <div className="flex justify-between items-center px-4 h-[48px] bg-slate-50 dark:bg-white/5 rounded-[12px] border border-slate-200 dark:border-white/10">
                                <span className="text-slate-500 font-semibold text-[11px] tracking-wider uppercase">Toplam Kalem</span>
                                <span className="text-[16px] font-semibold text-slate-900 dark:text-white">{transferCart.length}</span>
                            </div>
                            <button
                                disabled={transferCart.length === 0}
                                onClick={handleStartShipment}
                                className={`
                                    w-full h-[48px] rounded-[12px] text-[13px] font-semibold transition-all flex items-center justify-center gap-2
                                    ${transferCart.length === 0
                                        ? 'bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-white/10'
                                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                                    }
                                `}
                            >
                                SEVKİYATI BAŞLAT ({transferCart.reduce((a: any, b: any) => a + b.qty, 0)} Ürün)
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                /* MODE 2: HISTORY LIST */
                <div className="flex flex-col gap-6">
                    {/* STATS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-[#0f172a] shadow-sm rounded-[16px] p-5 flex flex-col gap-1 border border-slate-200 dark:border-white/10 border-b-4 border-b-blue-500">
                            <div className="text-slate-400 dark:text-slate-500 text-[10px] font-semibold tracking-wider uppercase">BUGÜN YAPILAN</div>
                            <div className="text-[24px] font-semibold text-slate-900 dark:text-white">{visibleTransfers.filter(t => new Date(t.shippedAt).toDateString() === new Date().toDateString()).length}</div>
                            <div className="text-[11px] text-blue-600 dark:text-blue-400 font-medium mt-1">Tamamlanan Sevkiyat</div>
                        </div>
                        <div className="bg-white dark:bg-[#0f172a] shadow-sm rounded-[16px] p-5 flex flex-col gap-1 border border-slate-200 dark:border-white/10 border-b-4 border-b-amber-500">
                            <div className="text-slate-400 dark:text-slate-500 text-[10px] font-semibold tracking-wider uppercase">YOLDA / BEKLEYEN</div>
                            <div className="text-[24px] font-semibold text-amber-600 dark:text-amber-400">{inTransitTransfers.length}</div>
                            <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-1">Aktif Transfer</div>
                        </div>
                        <div className="bg-white dark:bg-[#0f172a] shadow-sm rounded-[16px] p-5 flex flex-col gap-1 border border-slate-200 dark:border-white/10 border-b-4 border-b-emerald-500">
                            <div className="text-slate-400 dark:text-slate-500 text-[10px] font-semibold tracking-wider uppercase">EN ÇOK SEVKİYAT</div>
                            <div className="text-[16px] font-semibold truncate text-slate-900 dark:text-white mt-2">Merkez Depo</div>
                            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">Ana Kaynak</div>
                        </div>
                        <div className="bg-white dark:bg-[#0f172a] shadow-sm rounded-[16px] p-5 flex flex-col gap-1 border border-slate-200 dark:border-white/10 border-b-4 border-b-purple-500">
                            <div className="text-slate-400 dark:text-slate-500 text-[10px] font-semibold tracking-wider uppercase">HEDEF ŞUBE</div>
                            <div className="text-[16px] font-semibold truncate text-slate-900 dark:text-white mt-2">Kadıköy Şube</div>
                            <div className="text-[11px] text-purple-600 dark:text-purple-400 font-medium mt-1">En Çok Kabul</div>
                        </div>
                    </div>

                    {/* LIST */}
                    <div className="bg-white dark:bg-[#0f172a] shadow-sm rounded-[16px] border border-slate-200 dark:border-white/10 overflow-hidden">
                        <div className="p-5 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                            <h3 className="text-[14px] font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                Son Transfer Hareketleri
                            </h3>
                            <button onClick={refreshStockTransfers} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 transition-colors text-slate-500 dark:text-slate-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </button>
                        </div>
                        <div className="max-h-[500px] overflow-y-auto custom-scroll">
                            <table className="w-full text-left text-[13px]">
                                <thead className="bg-slate-50 dark:bg-[#1e293b] sticky top-0 z-10">
                                    <tr className="text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/10">
                                        <th className="py-3 px-5 uppercase font-semibold text-[11px] tracking-wider text-center">TARİH</th>
                                        <th className="py-3 px-5 uppercase font-semibold text-[11px] tracking-wider">AKIŞ</th>
                                        <th className="py-3 px-5 uppercase font-semibold text-[11px] tracking-wider">ÜRÜN / MİKTAR</th>
                                        <th className="py-3 px-5 uppercase font-semibold text-[11px] tracking-wider text-center">DURUM</th>
                                        <th className="py-3 px-5 uppercase font-semibold text-[11px] tracking-wider text-right">İŞLEM</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentTransfers.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-12 text-center text-slate-400 dark:text-slate-500 font-medium">Henüz geçmiş transfer kaydı bulunmuyor.</td>
                                        </tr>
                                    ) : (
                                        recentTransfers.map(t => (
                                            <tr key={t.id} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                                                <td className="py-3 px-5 text-slate-600 dark:text-slate-400 text-center">
                                                    <div className="font-medium">{new Date(t.shippedAt).toLocaleDateString('tr-TR')}</div>
                                                    <div className="text-[11px]">{new Date(t.shippedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</div>
                                                </td>
                                                <td className="py-3 px-5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-slate-600 dark:text-slate-400">{t.fromBranch}</span>
                                                        <span className="text-slate-300 dark:text-slate-600">➔</span>
                                                        <span className="font-semibold text-slate-900 dark:text-white">{t.toBranch}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-5">
                                                    <div className="font-semibold text-slate-900 dark:text-white">{t.productName}</div>
                                                    <div className="text-[11px] text-slate-500 font-medium uppercase mt-0.5">{t.qty} ADET</div>
                                                </td>
                                                <td className="py-3 px-5 text-center">
                                                    <span className={`
                                                        py-1 px-2 rounded-md font-semibold text-[11px] tracking-wider
                                                        ${t.status === 'RECEIVED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' :
                                                            t.status === 'IN_TRANSIT' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' :
                                                                'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-500'}
                                                    `}>
                                                        {t.status === 'RECEIVED' ? 'TAMAMLANDI' :
                                                            t.status === 'IN_TRANSIT' ? 'YOLDA' :
                                                                'İPTAL EDİLDİ'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-5 text-right">
                                                    <div className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">👤 {t.requestedBy}</div>
                                                    {t.receivedBy && <div className="text-[10px] text-emerald-600 dark:text-emerald-500 mt-1">Ok: {t.receivedBy}</div>}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
