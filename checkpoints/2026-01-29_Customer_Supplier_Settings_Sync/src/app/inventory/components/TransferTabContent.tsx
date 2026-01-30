
import React, { useState } from 'react';
import { useApp, Product } from '@/contexts/AppContext';
import { useModal } from '@/contexts/ModalContext';

interface TransferTabContentProps {
    isSystemAdmin: boolean;
    products: Product[];
    filteredProducts: Product[];
    branches: string[];
    searchTerm: string;
    setSearchTerm: (s: string) => void;
    onApproveTransfer: (data: any) => void;
}

export default function TransferTabContent({
    isSystemAdmin,
    products,
    filteredProducts,
    branches,
    searchTerm,
    setSearchTerm,
    onApproveTransfer
}: TransferTabContentProps) {
    const { pendingTransfers, approveTransfer, rejectTransfer } = useApp();
    const { showSuccess, showWarning } = useModal();

    const [isTransferMode, setIsTransferMode] = useState(false);
    const [transferCart, setTransferCart] = useState<any[]>([]);
    const [transferData, setTransferData] = useState({
        from: 'Merkez Depo',
        to: 'Kadıköy Şube'
    });

    const handleStartShipment = () => {
        if (transferCart.length === 0) return;

        // Create bulk transfer requests
        const requests = transferCart.map((item: any) => ({
            id: Date.now() + Math.random(),
            productId: item.id,
            productName: item.name,
            qty: item.qty,
            from: transferData.from,
            to: transferData.to,
            status: isSystemAdmin ? 'approved' : 'pending',
            date: new Date().toISOString()
        }));

        // Process each
        requests.forEach((req: any) => {
            if (isSystemAdmin) {
                onApproveTransfer(req);
            } else {
                // Since we simulate pending by using the same approve function in the demo logic (based on original file),
                // we will stick to calling the callback. 
                // However, in a real scenario, this should call an API or `addPendingTransfer`.
                // The original code passed `approveTransferDirectly` even for non-admins but showed a "Pending" msg?
                // Actually the original code had:
                /* 
                   if (isSystemAdmin) { approveTransferDirectly(req); }
                   else { approveTransferDirectly(req); } // It did the same!
                */
                // We will replicate that behavior but ideally this should be distinct.
                onApproveTransfer(req);
            }
        });

        showSuccess('Transfer İşleme Alındı', `${transferCart.length} kalem ürün transfer süreci başlatıldı.`);
        setIsTransferMode(false);
        setTransferCart([]);
    };

    return (
        <div className="animate-fade-in pb-12">
            {/* TOP: PENDING TRANSFERS (ADMIN) */}
            {isSystemAdmin && pendingTransfers.some(t => t.status === 'pending') && (
                <div className="mb-8 p-6 bg-blue-500/5 rounded-3xl border border-blue-500/20">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-base font-extrabold">📦 Onay Bekleyen Transferler ({pendingTransfers.filter(t => t.status === 'pending').length})</h3>
                    </div>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(350px,1fr))] gap-4">
                        {pendingTransfers.filter(t => t.status === 'pending').map(t => {
                            const product = products.find(p => p.id === t.productId);
                            return (
                                <div key={t.id} className="bg-[#0f172a]/60 p-4 rounded-2xl border border-white/5">
                                    <div className="flex justify-between items-center mb-3">
                                        <div className="text-[13px] font-extrabold">{product?.name || 'Bilinmeyen Ürün'}</div>
                                        <div className="text-[11px] text-primary">{t.qty} ADET</div>
                                    </div>
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-[11px] text-muted">{t.fromBranch} ➔ {t.toBranch}</span>
                                        <span className="text-[10px] opacity-50">Talep: {t.requestedBy}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button onClick={() => rejectTransfer(t.id)} className="btn btn-ghost text-[11px] p-2 text-red-400">Reddet</button>
                                        <button onClick={() => approveTransfer(t.id)} className="btn btn-primary text-[11px] p-2">Onayla</button>
                                    </div>
                                </div>
                            );
                        })}
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
                        <button onClick={() => setIsTransferMode(true)} className="btn btn-primary px-6 py-3 text-sm font-extrabold">
                            + YENİ TRANSFER FİŞİ
                        </button>
                    )}
                </div>
            </div>

            {/* MODE 1: NEW TRANSFER CART */}
            {isTransferMode ? (
                <div className="grid grid-cols-2 gap-8">
                    {/* LEFT: SEARCH & ADD */}
                    <div className="card glass h-full flex flex-col">
                        <h3 className="mb-4 text-base font-bold border-b border-white/10 pb-2">1. Ürün Seçimi</h3>

                        <input
                            type="text"
                            placeholder="Ürün Ara (Ad, Kod, Barkod)..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[#0f172a] border-none p-3 rounded-xl mb-4 text-sm"
                            autoFocus
                        />

                        <div className="flex-1 overflow-y-auto max-h-[400px] flex flex-col gap-2">
                            {filteredProducts && filteredProducts.slice(0, 20).map(product => (
                                <div key={product.id} className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-transparent hover:border-primary cursor-pointer transition-colors"
                                    onClick={() => {
                                        const exists = transferCart.find((item: any) => item.id === product.id);
                                        if (exists) {
                                            showWarning('Zaten Ekli', 'Bu ürün zaten transfer listesinde.');
                                        } else {
                                            setTransferCart([...transferCart, { ...product, qty: 1 }]);
                                        }
                                    }}
                                >
                                    <div>
                                        <div className="font-bold text-[13px]">{product.name}</div>
                                        <div className="text-[11px] text-muted">{product.code} • Stok: {product.stock}</div>
                                    </div>
                                    <button className="btn btn-ghost px-3 py-1 text-lg">+</button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT: CART & CONFIRM */}
                    <div className="card glass h-full flex flex-col border-l-4 border-l-primary">
                        <h3 className="mb-4 text-base font-bold border-b border-white/10 pb-2">2. Sevkiyat Detayları</h3>

                        {/* Source/Target Selection */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-muted text-[11px] font-bold">ÇIKIŞ DEPOSU (KAYNAK)</label>
                                <select
                                    className="p-3 bg-[#0f172a] rounded-lg border border-white/10 text-sm"
                                    value={transferData.from}
                                    onChange={(e) => setTransferData({ ...transferData, from: e.target.value })}
                                >
                                    {branches.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-muted text-[11px] font-bold">VARIŞ DEPOSU (HEDEF)</label>
                                <select
                                    className="p-3 bg-[#0f172a] rounded-lg border border-white/10 text-sm"
                                    value={transferData.to}
                                    onChange={(e) => setTransferData({ ...transferData, to: e.target.value })}
                                >
                                    {branches.filter(b => b !== transferData.from).map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Cart Items */}
                        <div className="flex-1 overflow-y-auto max-h-[300px] mb-5 bg-black/20 rounded-xl p-3">
                            {transferCart.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-muted gap-2">
                                    <span className="text-sm">🛒 Transfer listesi boş</span>
                                    <span className="text-[11px] opacity-50">Soldan ürün seçerek ekleyin</span>
                                </div>
                            ) : (
                                <table className="w-full text-[13px]">
                                    <thead>
                                        <tr className="text-muted text-left border-b border-white/10">
                                            <th className="pb-2 pl-2">Ürün</th>
                                            <th className="pb-2 w-20 text-center">Miktar</th>
                                            <th className="pb-2 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transferCart.map((item: any, idx: number) => (
                                            <tr key={idx} className="border-b border-white/5 last:border-0">
                                                <td className="py-3 pl-2">
                                                    <div className="font-bold">{item.name}</div>
                                                    <div className="text-[10px] opacity-60">{item.code}</div>
                                                </td>
                                                <td className="py-3">
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
                                                        className="w-16 p-2 rounded bg-black border border-white/10 text-center"
                                                    />
                                                </td>
                                                <td className="py-3 text-right">
                                                    <button onClick={() => setTransferCart(transferCart.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-400 font-bold p-1">×</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-3">
                            <div className="flex justify-between p-3 bg-white/5 rounded-lg">
                                <span className="text-muted text-sm">Toplam Kalem:</span>
                                <span className="font-bold">{transferCart.length}</span>
                            </div>
                            <button
                                disabled={transferCart.length === 0}
                                onClick={handleStartShipment}
                                className={`btn btn-primary w-full h-12 text-base font-bold ${transferCart.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                        <div className="card glass p-4 flex flex-col gap-1">
                            <div className="text-muted text-xs font-bold">BUGÜN YAPILAN</div>
                            <div className="text-2xl font-bold">12</div>
                            <div className="text-xs text-success">Transfer</div>
                        </div>
                        <div className="card glass p-4 flex flex-col gap-1">
                            <div className="text-muted text-xs font-bold">BEKLEYEN</div>
                            <div className="text-2xl font-bold text-warning">{pendingTransfers.filter(t => t.status === 'pending').length}</div>
                            <div className="text-xs text-muted">Talep</div>
                        </div>
                        <div className="card glass p-4 flex flex-col gap-1">
                            <div className="text-muted text-xs font-bold">EN ÇOK SEVKİYAT</div>
                            <div className="text-xl font-bold truncate">Kadıköy Şube</div>
                            <div className="text-xs text-muted">Hedef Depo</div>
                        </div>
                    </div>

                    {/* LIST */}
                    <div className="card glass">
                        <h3 className="mb-4 text-base font-bold">📜 Son Transfer Hareketleri</h3>
                        <table className="w-full text-left text-[13px]">
                            <thead>
                                <tr className="text-muted border-b border-white/10">
                                    <th className="py-3 px-2">TARİH</th>
                                    <th>TRANSFER TİPİ</th>
                                    <th>ÜRÜN / MİKTAR</th>
                                    <th>DURUM</th>
                                    <th>İŞLEM TARAFINDAN</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Dummy Data + Real Pending Data Mockup */}
                                <tr className="border-b border-white/5">
                                    <td className="py-3 px-2 text-muted">Bugün 14:30</td>
                                    <td><span className="text-[11px] font-bold text-primary">MERKEZ ➔ KADIKÖY</span></td>
                                    <td><span className="font-bold">Motul 7100 10w40</span> <span className="opacity-50">x24 Adet</span></td>
                                    <td><span className="bg-emerald-500/10 text-emerald-500 py-0.5 px-2 rounded font-bold text-[10px]">TAMAMLANDI</span></td>
                                    <td className="text-muted text-xs">Admin</td>
                                </tr>
                                <tr className="border-b border-white/5">
                                    <td className="py-3 px-2 text-muted">Bugün 11:15</td>
                                    <td><span className="text-[11px] font-bold text-primary">MERKEZ ➔ E-TİCARET</span></td>
                                    <td><span className="font-bold">Shimano Zincir Yağı</span> <span className="opacity-50">x50 Adet</span></td>
                                    <td><span className="bg-emerald-500/10 text-emerald-500 py-0.5 px-2 rounded font-bold text-[10px]">TAMAMLANDI</span></td>
                                    <td className="text-muted text-xs">Admin</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
