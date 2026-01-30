
import React, { useState } from 'react';
import { useApp, Product, StockTransfer } from '@/contexts/AppContext';
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
    const {
        stockTransfers,
        refreshStockTransfers,
        startStockTransfer,
        finalizeTransfer,
        currentUser,
        activeBranchName
    } = useApp();
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
    const pastTransfers = visibleTransfers.filter(t => t.status !== 'IN_TRANSIT').slice(0, 10);

    return (
        <div className="animate-fade-in pb-12">
            {/* TOP: IN TRANSIT / PENDING RECEIPT */}
            {inTransitTransfers.length > 0 && (
                <div className="mb-8 p-6 bg-blue-500/5 rounded-3xl border border-blue-500/20">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-base font-extrabold flex items-center gap-2">
                            <span className="animate-pulse">🚚</span> Yoldaki Sevkiyatlar / Mal Kabul Bekleyenler ({inTransitTransfers.length})
                        </h3>
                    </div>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(380px,1fr))] gap-4">
                        {inTransitTransfers.map(t => (
                            <div key={t.id} className="bg-[#0f172a]/60 p-5 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-all">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <div className="text-[13px] font-black">{t.productName}</div>
                                        <div className="text-[10px] text-white/40 font-mono mt-0.5">{t.productCode}</div>
                                    </div>
                                    <div className="bg-blue-500 text-white text-[11px] font-black px-2 py-1 rounded-lg">
                                        {t.qty} ADET
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 py-3 border-y border-white/5 my-3">
                                    <div className="flex-1 text-center">
                                        <div className="text-[9px] text-white/30 uppercase font-black">Kaynak</div>
                                        <div className="text-[11px] font-bold">{t.fromBranch}</div>
                                    </div>
                                    <div className="text-blue-500/30">➔</div>
                                    <div className="flex-1 text-center font-black text-blue-400">
                                        <div className="text-[9px] text-white/30 uppercase font-black">Hedef</div>
                                        <div className="text-[11px] font-bold">{t.toBranch}</div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {t.toBranch === activeBranchName || activeBranchName === 'Tümü' || isSystemAdmin ? (
                                        <button
                                            onClick={() => handleReceive(t)}
                                            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-black py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                                        >
                                            ✅ MAL KABUL ET
                                        </button>
                                    ) : (
                                        <div className="flex-1 text-center py-2.5 text-[10px] text-white/30 italic">
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

            {/* MODE 1: NEW TRANSFER CART */}
            {isTransferMode ? (
                <div className="grid grid-cols-2 gap-8">
                    {/* LEFT: SEARCH & ADD */}
                    <div className="card glass h-[600px] flex flex-col p-6">
                        <h3 className="mb-6 text-base font-black border-b border-white/10 pb-4 flex items-center gap-2">
                            <span className="text-primary text-xl">1.</span> Ürün Seçimi
                        </h3>

                        <input
                            type="text"
                            placeholder="Ürün Ara (Ad, Kod, Barkod)..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[#0f172a] border border-white/10 p-4 rounded-2xl mb-6 text-sm outline-none focus:border-primary transition-all"
                            autoFocus
                        />

                        <div className="flex-1 overflow-y-auto custom-scroll pr-2 flex flex-col gap-2">
                            {filteredProducts && filteredProducts.slice(0, 20).map(product => (
                                <div key={product.id} className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-transparent hover:border-primary/40 cursor-pointer transition-all group"
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
                                        <div className="font-bold text-[13px] group-hover:text-primary transition-colors">{product.name}</div>
                                        <div className="text-[11px] text-muted mt-1 uppercase font-black">{product.code} • MEVCUT: <span className="text-white">{product.stock}</span></div>
                                    </div>
                                    <button className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-lg font-black group-hover:bg-primary group-hover:text-white transition-all">+</button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT: CART & CONFIRM */}
                    <div className="card glass h-[600px] flex flex-col border-l-4 border-l-primary p-6">
                        <h3 className="mb-6 text-base font-black border-b border-white/10 pb-4 flex items-center gap-2">
                            <span className="text-primary text-xl">2.</span> Sevkiyat Detayları
                        </h3>

                        {/* Source/Target Selection */}
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="flex flex-col gap-2">
                                <label className="text-white/40 text-[9px] font-black tracking-widest uppercase">ÇIKIŞ DEPOSU (KAYNAK)</label>
                                <select
                                    className="p-3 bg-[#0f172a] rounded-xl border border-white/10 text-sm font-bold"
                                    value={transferData.from}
                                    onChange={(e) => setTransferData({ ...transferData, from: e.target.value })}
                                >
                                    {branches.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-white/40 text-[9px] font-black tracking-widest uppercase">VARIŞ DEPOSU (HEDEF)</label>
                                <select
                                    className="p-3 bg-[#0f172a] rounded-xl border border-white/10 text-sm font-bold text-primary"
                                    value={transferData.to}
                                    onChange={(e) => setTransferData({ ...transferData, to: e.target.value })}
                                >
                                    {branches.filter(b => b !== transferData.from).map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Cart Items */}
                        <div className="flex-1 overflow-y-auto mb-6 bg-black/20 rounded-2xl p-4 custom-scroll">
                            {transferCart.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-muted gap-4 opacity-30">
                                    <span className="text-4xl">🛒</span>
                                    <div className="text-center">
                                        <div className="text-sm font-black">Transfer listesi boş</div>
                                        <div className="text-[11px] mt-1">Soldan ürün seçerek ekleyin</div>
                                    </div>
                                </div>
                            ) : (
                                <table className="w-full text-[13px]">
                                    <thead>
                                        <tr className="text-white/30 text-left border-b border-white/10">
                                            <th className="pb-3 pl-2 uppercase font-black text-[9px] tracking-widest">Ürün Bilgisi</th>
                                            <th className="pb-3 w-28 text-center uppercase font-black text-[9px] tracking-widest">Sevk Miktarı</th>
                                            <th className="pb-3 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transferCart.map((item: any, idx: number) => (
                                            <tr key={idx} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-all">
                                                <td className="py-4 pl-2">
                                                    <div className="font-bold">{item.name}</div>
                                                    <div className="text-[10px] text-white/30 mt-0.5">{item.code}</div>
                                                </td>
                                                <td className="py-4">
                                                    <div className="flex items-center justify-center bg-black/40 rounded-xl border border-white/5 p-1 gap-2">
                                                        <button
                                                            onClick={() => {
                                                                const newCart = [...transferCart];
                                                                newCart[idx].qty = Math.max(1, item.qty - 1);
                                                                setTransferCart(newCart);
                                                            }}
                                                            className="w-6 h-6 rounded-lg hover:bg-white/10"
                                                        >-</button>
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
                                                            className="w-12 bg-transparent text-center font-black outline-none"
                                                        />
                                                        <button
                                                            onClick={() => {
                                                                const newCart = [...transferCart];
                                                                newCart[idx].qty = Math.min(item.stock, item.qty + 1);
                                                                setTransferCart(newCart);
                                                            }}
                                                            className="w-6 h-6 rounded-lg hover:bg-white/10"
                                                        >+</button>
                                                    </div>
                                                </td>
                                                <td className="py-4 text-right pr-2">
                                                    <button onClick={() => setTransferCart(transferCart.filter((_, i) => i !== idx))} className="w-8 h-8 rounded-full hover:bg-red-500/10 text-white/20 hover:text-red-500 transition-all font-black">×</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-4">
                            <div className="flex justify-between items-center px-4 py-3 bg-white/5 rounded-xl border border-white/5">
                                <span className="text-white/40 text-[11px] font-black uppercase tracking-widest">Toplam Kalem</span>
                                <span className="text-xl font-black text-primary">{transferCart.length}</span>
                            </div>
                            <button
                                disabled={transferCart.length === 0}
                                onClick={handleStartShipment}
                                className={`
                                    w-full h-14 rounded-2xl text-base font-black transition-all flex items-center justify-center gap-3
                                    ${transferCart.length === 0
                                        ? 'bg-white/5 text-white/20 cursor-not-allowed'
                                        : 'bg-primary hover:bg-orange-500 text-white shadow-xl shadow-primary/20 active:scale-95'
                                    }
                                `}
                            >
                                🚀 SEVKİYATI BAŞLAT ({transferCart.reduce((a: any, b: any) => a + b.qty, 0)} Ürün)
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                /* MODE 2: HISTORY LIST */
                <div className="flex flex-col gap-6">
                    {/* STATS */}
                    <div className="grid grid-cols-4 gap-4">
                        <div className="card glass p-5 flex flex-col gap-1 border-b-4 border-b-primary shadow-xl">
                            <div className="text-white/40 text-[9px] font-black tracking-widest uppercase">BUGÜN YAPILAN</div>
                            <div className="text-3xl font-black">{pastTransfers.filter(t => new Date(t.shippedAt).toDateString() === new Date().toDateString()).length}</div>
                            <div className="text-[10px] text-primary font-bold">Tamamlanan Sevkiyat</div>
                        </div>
                        <div className="card glass p-5 flex flex-col gap-1 border-b-4 border-b-blue-500 shadow-xl">
                            <div className="text-white/40 text-[9px] font-black tracking-widest uppercase">YOLDA / BEKLEYEN</div>
                            <div className="text-3xl font-black text-blue-400">{inTransitTransfers.length}</div>
                            <div className="text-[10px] text-blue-500 font-bold">Aktif Transfer</div>
                        </div>
                        <div className="card glass p-5 flex flex-col gap-1 border-b-4 border-b-emerald-500 shadow-xl">
                            <div className="text-white/40 text-[9px] font-black tracking-widest uppercase">EN ÇOK SEVKİYAT</div>
                            <div className="text-xl font-black truncate text-emerald-400">Merkez Depo</div>
                            <div className="text-[10px] text-emerald-500 font-bold">Ana Kaynak</div>
                        </div>
                        <div className="card glass p-5 flex flex-col gap-1 border-b-4 border-b-amber-500 shadow-xl">
                            <div className="text-white/40 text-[9px] font-black tracking-widest uppercase">HEDEF ŞUBE</div>
                            <div className="text-xl font-black truncate text-amber-400">Kadıköy Şube</div>
                            <div className="text-[10px] text-amber-500 font-bold">En Çok Kabul</div>
                        </div>
                    </div>

                    {/* LIST */}
                    <div className="card glass p-0 overflow-hidden">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center">
                            <h3 className="text-base font-black uppercase tracking-widest flex items-center gap-2">
                                <span className="text-primary">📜</span> Son Transfer Hareketleri
                            </h3>
                            <button onClick={refreshStockTransfers} className="p-2 hover:bg-white/5 rounded-full transition-all text-white/30 hover:text-white">🔄</button>
                        </div>
                        <div className="max-h-[500px] overflow-y-auto custom-scroll">
                            <table className="w-full text-left text-[13px]">
                                <thead className="bg-black/20 sticky top-0 z-10">
                                    <tr className="text-white/30 border-b border-white/10">
                                        <th className="py-4 px-6 uppercase font-black text-[9px] tracking-widest text-center">TARİH</th>
                                        <th className="py-4 px-6 uppercase font-black text-[9px] tracking-widest">AKIŞ</th>
                                        <th className="py-4 px-6 uppercase font-black text-[9px] tracking-widest">ÜRÜN / MİKTAR</th>
                                        <th className="py-4 px-6 uppercase font-black text-[9px] tracking-widest text-center">DURUM</th>
                                        <th className="py-4 px-6 uppercase font-black text-[9px] tracking-widest text-right">İŞLEM</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pastTransfers.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-12 text-center text-white/20 italic">Henüz geçmiş transfer kaydı bulunmuyor.</td>
                                        </tr>
                                    ) : (
                                        pastTransfers.map(t => (
                                            <tr key={t.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                                <td className="py-4 px-6 text-white/40 text-[11px] text-center">
                                                    {new Date(t.shippedAt).toLocaleDateString('tr-TR')}
                                                    <div className="text-[9px] opacity-50">{new Date(t.shippedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[11px] font-bold text-white/60">{t.fromBranch}</span>
                                                        <span className="text-primary opacity-30">➔</span>
                                                        <span className="text-[11px] font-bold text-white/90">{t.toBranch}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="font-bold text-white/90">{t.productName}</div>
                                                    <div className="text-[10px] text-primary font-black uppercase">{t.qty} ADET</div>
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <span className={`
                                                        py-1 px-3 rounded-lg font-black text-[9px] uppercase tracking-widest
                                                        ${t.status === 'RECEIVED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}
                                                    `}>
                                                        {t.status === 'RECEIVED' ? 'TAMAMLANDI' : 'İPTAL EDİLDİ'}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <div className="text-white/30 text-[11px]">👤 {t.requestedBy}</div>
                                                    {t.receivedBy && <div className="text-[9px] text-emerald-500/40">Ok: {t.receivedBy}</div>}
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
