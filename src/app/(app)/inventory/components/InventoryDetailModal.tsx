
import React, { useState, useEffect } from 'react';
import { Product } from '@/contexts/InventoryContext';

interface InventoryDetailModalProps {
    isOpen: boolean;
    product: Product | null;
    onClose: () => void;
    onSave: (e: any) => void; // Passed from page (handleSaveProduct)
    canEdit: boolean;
    canDelete?: boolean;
    onDelete?: () => void;
    selectedProductState: [any, any]; // [selectedProduct, setSelectedProduct] to allow local mutation
    categories?: string[];
}

export default function InventoryDetailModal({
    isOpen,
    onClose,
    onSave,
    canEdit,
    canDelete,
    onDelete,
    selectedProductState,
    categories = []
}: InventoryDetailModalProps) {
    const [selectedProduct, setSelectedProduct] = selectedProductState;
    const [detailTab, setDetailTab] = useState('general');

    if (!isOpen || !selectedProduct) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-[#0f172a] w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl border border-white/10 shadow-2xl flex flex-col">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-white/5 bg-white/5">
                    <div>
                        <h2 className="text-xl font-black text-white flex items-center gap-2">
                            ✏️ Ürün Düzenle <span className="text-muted font-normal text-sm">#{selectedProduct.code}</span>
                        </h2>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                        &times;
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Tabs */}
                    <div className="flex gap-2 mb-6 border-b border-white/10 pb-1">
                        <button
                            onClick={() => setDetailTab('general')}
                            className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors ${detailTab === 'general' ? 'bg-primary text-white' : 'text-muted hover:text-white'}`}
                        >
                            Genel Bilgiler
                        </button>
                        <button
                            onClick={() => setDetailTab('pricing')}
                            className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors ${detailTab === 'pricing' ? 'bg-primary text-white' : 'text-muted hover:text-white'}`}
                        >
                            Fiyat & Vergi
                        </button>
                    </div>

                    <form id="product-edit-form" onSubmit={onSave} className="space-y-6">
                        {detailTab === 'general' && (
                            <div className="grid grid-cols-2 gap-6 animate-fade-in">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-muted uppercase mb-1 block">Ürün Adı</label>
                                        <input
                                            type="text"
                                            value={selectedProduct.name}
                                            onChange={(e) => setSelectedProduct({ ...selectedProduct, name: e.target.value })}
                                            disabled={!canEdit}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:border-primary outline-none text-white transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-muted uppercase mb-1 block">Stok Kodu</label>
                                        <input
                                            type="text"
                                            value={selectedProduct.code}
                                            onChange={(e) => setSelectedProduct({ ...selectedProduct, code: e.target.value })}
                                            disabled={!canEdit}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:border-primary outline-none text-white transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-muted uppercase mb-1 block">Barkod</label>
                                        <input
                                            type="text"
                                            value={selectedProduct.barcode}
                                            onChange={(e) => setSelectedProduct({ ...selectedProduct, barcode: e.target.value })}
                                            disabled={!canEdit}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:border-primary outline-none text-white transition-colors"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-muted uppercase mb-1 block">Marka</label>
                                        <input
                                            type="text"
                                            value={selectedProduct.brand}
                                            onChange={(e) => setSelectedProduct({ ...selectedProduct, brand: e.target.value })}
                                            disabled={!canEdit}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:border-primary outline-none text-white transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-muted uppercase mb-1 block">Kategori</label>
                                        <select
                                            value={selectedProduct.category}
                                            onChange={(e) => setSelectedProduct({ ...selectedProduct, category: e.target.value })}
                                            disabled={!canEdit}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:border-primary outline-none text-white transition-colors appearance-none"
                                        >
                                            {categories.length > 0 ? (
                                                categories.map(cat => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))
                                            ) : (
                                                <>
                                                    <option value="Genel">Genel</option>
                                                    <option value="Motosiklet">Motosiklet</option>
                                                    <option value="Otomobil">Otomobil</option>
                                                    <option value="Aksesuar">Aksesuar</option>
                                                    <option value="Yedek Parça">Yedek Parça</option>
                                                </>
                                            )}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-muted uppercase mb-1 block">Stok Miktarı</label>
                                        <input
                                            type="number"
                                            value={selectedProduct.stock}
                                            onChange={(e) => setSelectedProduct({ ...selectedProduct, stock: parseFloat(e.target.value) })}
                                            disabled={!canEdit}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:border-primary outline-none text-white transition-colors font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-muted uppercase mb-1 block">Satış Birimi</label>
                                        <select
                                            value={selectedProduct.unit || 'Adet'}
                                            onChange={(e) => setSelectedProduct({ ...selectedProduct, unit: e.target.value })}
                                            disabled={!canEdit}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:border-primary outline-none text-white transition-colors appearance-none"
                                        >
                                            <option value="Adet">Adet</option>
                                            <option value="KG">Kilogram (KG)</option>
                                            <option value="Litre">Litre (L)</option>
                                            <option value="Metre">Metre (M)</option>
                                            <option value="Paket">Paket</option>
                                            <option value="Koli">Koli</option>
                                            <option value="Set">Set</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="col-span-2">
                                    <label className="text-xs font-bold text-muted uppercase mb-1 block">Açıklama</label>
                                    <textarea
                                        rows={3}
                                        value={selectedProduct.description || ''}
                                        onChange={(e) => setSelectedProduct({ ...selectedProduct, description: e.target.value })}
                                        disabled={!canEdit}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:border-primary outline-none text-white transition-colors resize-none"
                                    />
                                </div>
                            </div>
                        )}

                        {detailTab === 'pricing' && (
                            <div className="grid grid-cols-2 gap-6 animate-fade-in">
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                    <h3 className="tex-sm font-bold text-muted mb-4 border-b border-white/10 pb-2">Alış Fiyatlandırması</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-muted uppercase mb-1 block">Alış Fiyatı (Net)</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="number"
                                                    value={selectedProduct.buyPrice}
                                                    onChange={(e) => setSelectedProduct({ ...selectedProduct, buyPrice: parseFloat(e.target.value) })}
                                                    disabled={!canEdit}
                                                    className="flex-[2] bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:border-primary outline-none text-white transition-colors font-mono"
                                                />
                                                <select
                                                    value={selectedProduct.purchaseCurrency || 'TRY'}
                                                    onChange={(e) => setSelectedProduct({ ...selectedProduct, purchaseCurrency: e.target.value })}
                                                    disabled={!canEdit}
                                                    className="flex-1 bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:border-primary outline-none text-white transition-colors appearance-none"
                                                >
                                                    <option value="TRY">₺ TRY</option>
                                                    <option value="USD">$ USD</option>
                                                    <option value="EUR">€ EUR</option>
                                                    <option value="GBP">£ GBP</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1">
                                                <label className="text-xs font-bold text-muted uppercase mb-1 block">KDV Oranı</label>
                                                <select
                                                    value={selectedProduct.purchaseVat}
                                                    onChange={(e) => setSelectedProduct({ ...selectedProduct, purchaseVat: parseInt(e.target.value) })}
                                                    disabled={!canEdit}
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:border-primary outline-none text-white transition-colors"
                                                >
                                                    <option value="0">%0</option>
                                                    <option value="1">%1</option>
                                                    <option value="10">%10</option>
                                                    <option value="20">%20</option>
                                                </select>
                                            </div>
                                            <div className="flex items-center gap-2 pt-6">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedProduct.purchaseVatIncluded}
                                                    onChange={(e) => setSelectedProduct({ ...selectedProduct, purchaseVatIncluded: e.target.checked })}
                                                    disabled={!canEdit}
                                                    className="w-5 h-5 accent-primary"
                                                />
                                                <span className="text-sm">KDV Dahil</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                    <h3 className="tex-sm font-bold text-muted mb-4 border-b border-white/10 pb-2">Satış Fiyatlandırması</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-muted uppercase mb-1 block">Satış Fiyatı (Net)</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="number"
                                                    value={selectedProduct.price}
                                                    onChange={(e) => setSelectedProduct({ ...selectedProduct, price: parseFloat(e.target.value) })}
                                                    disabled={!canEdit}
                                                    className="flex-[2] bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:border-primary outline-none text-white transition-colors font-mono"
                                                />
                                                <select
                                                    value={selectedProduct.currency || 'TRY'}
                                                    onChange={(e) => setSelectedProduct({ ...selectedProduct, currency: e.target.value })}
                                                    disabled={!canEdit}
                                                    className="flex-1 bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:border-primary outline-none text-white transition-colors appearance-none"
                                                >
                                                    <option value="TRY">₺ TRY</option>
                                                    <option value="USD">$ USD</option>
                                                    <option value="EUR">€ EUR</option>
                                                    <option value="GBP">£ GBP</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1">
                                                <label className="text-xs font-bold text-muted uppercase mb-1 block">KDV Oranı</label>
                                                <select
                                                    value={selectedProduct.salesVat}
                                                    onChange={(e) => setSelectedProduct({ ...selectedProduct, salesVat: parseInt(e.target.value) })}
                                                    disabled={!canEdit}
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:border-primary outline-none text-white transition-colors"
                                                >
                                                    <option value="0">%0</option>
                                                    <option value="1">%1</option>
                                                    <option value="10">%10</option>
                                                    <option value="20">%20</option>
                                                </select>
                                            </div>
                                            <div className="flex items-center gap-2 pt-6">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedProduct.salesVatIncluded}
                                                    onChange={(e) => setSelectedProduct({ ...selectedProduct, salesVatIncluded: e.target.checked })}
                                                    disabled={!canEdit}
                                                    className="w-5 h-5 accent-primary"
                                                />
                                                <span className="text-sm">KDV Dahil</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 bg-black/20 flex justify-between items-center">
                    <div>
                        {canDelete && onDelete && (
                            <button
                                type="button"
                                onClick={onDelete}
                                className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-sm font-bold rounded-xl transition-colors"
                            >
                                🗑️ Ürünü Sil
                            </button>
                        )}
                    </div>
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors"
                        >
                            Vazgeç
                        </button>
                        {canEdit && (
                            <button
                                type="button"
                                onClick={onSave}
                                className="px-8 py-3 bg-primary hover:bg-primary/80 text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all hover:-translate-y-1"
                            >
                                Değişiklikleri Kaydet
                            </button>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
