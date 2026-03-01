
import React, { useState, useEffect } from 'react';
import { Product } from '@/contexts/InventoryContext';
import { ProductPricesTab } from '@/components/pricing/ProductPricesTab';

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
    allProducts?: any[];
}

export default function InventoryDetailModal({
    isOpen,
    onClose,
    onSave,
    canEdit,
    canDelete,
    onDelete,
    selectedProductState,
    categories = [],
    allProducts = []
}: InventoryDetailModalProps) {
    const [selectedProduct, setSelectedProduct] = selectedProductState;
    const [detailTab, setDetailTab] = useState('general');

    if (!isOpen || !selectedProduct) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[3000] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-[#0f172a] w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[24px] border border-slate-200 dark:border-white/10 shadow-2xl flex flex-col">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-[#1e293b]/50">
                    <div>
                        <h2 className="text-[20px] font-semibold text-slate-900 dark:text-white flex flex-col gap-1">
                            <span className="flex items-center gap-2">✏️ Ürün Düzenle <span className="text-slate-500 font-medium text-[13px]">(#{selectedProduct.code})</span></span>
                            {selectedProduct.parentId && allProducts && (
                                <button
                                    onClick={() => {
                                        const parent = allProducts.find(p => p.id === selectedProduct.parentId);
                                        if (parent) setSelectedProduct(parent);
                                    }}
                                    className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline text-left mt-1"
                                >
                                    ← Ana Ürüne Dön ({allProducts.find(p => p.id === selectedProduct.parentId)?.name || 'Parent'})
                                </button>
                            )}
                        </h2>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 flex items-center justify-center text-slate-500 transition-colors">
                        ✕
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Tabs */}
                    <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-white/10 pb-2 overflow-x-auto custom-scroll">
                        <button
                            onClick={() => setDetailTab('general')}
                            className={`px-4 py-2 text-[13px] font-semibold rounded-[10px] transition-colors whitespace-nowrap ${detailTab === 'general' ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'}`}
                        >
                            Genel Bilgiler
                        </button>
                        <button
                            type="button"
                            onClick={() => setDetailTab('pricing')}
                            className={`px-4 py-2 text-[13px] font-semibold rounded-[10px] transition-colors whitespace-nowrap ${detailTab === 'pricing' ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'}`}
                        >
                            Fiyat & Vergi
                        </button>
                        <button
                            type="button"
                            onClick={() => setDetailTab('multi-prices')}
                            className={`px-4 py-2 text-[13px] font-semibold rounded-[10px] transition-colors whitespace-nowrap ${detailTab === 'multi-prices' ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'}`}
                        >
                            Çoklu Fiyat
                        </button>
                        {selectedProduct && selectedProduct.isParent && (
                            <button
                                type="button"
                                onClick={() => setDetailTab('variants')}
                                className={`px-4 py-2 text-[13px] font-semibold rounded-[10px] transition-colors whitespace-nowrap ${detailTab === 'variants' ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'}`}
                            >
                                Varyantlar
                            </button>
                        )}
                    </div>

                    <form id="product-edit-form" onSubmit={onSave} className="space-y-6">
                        {detailTab === 'variants' && selectedProduct.isParent && (
                            <div className="space-y-4 animate-fade-in">
                                <div className="bg-slate-50 dark:bg-[#1e293b] rounded-[20px] p-6 border border-slate-200 dark:border-white/10 shadow-sm custom-scroll">
                                    <h3 className="text-[14px] font-semibold text-slate-800 dark:text-white mb-4 border-b border-slate-200 dark:border-white/10 pb-3 flex justify-between items-center">
                                        <span>Ürün Varyantları</span>
                                        <span className="text-[11px] font-medium text-slate-500 bg-white dark:bg-[#0f172a] px-3 py-1 rounded-[8px] border border-slate-200 dark:border-white/10 shadow-sm">Ana Ürün: {selectedProduct.code}</span>
                                    </h3>

                                    <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scroll pr-2">
                                        {(allProducts || []).filter(p => p.parentId === selectedProduct.id).length > 0 ? (
                                            (allProducts || []).filter(p => p.parentId === selectedProduct.id).map(variant => (
                                                <div key={variant.id}
                                                    className="flex justify-between items-center p-4 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-[12px] hover:border-blue-500 hover:shadow-sm transition-all cursor-pointer group"
                                                    onClick={() => {
                                                        setSelectedProduct(variant);
                                                        setDetailTab('general');
                                                    }}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-[10px] bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 flex items-center justify-center text-lg shadow-sm">
                                                            👕
                                                        </div>
                                                        <div>
                                                            <div className="text-[13px] font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center gap-2 mb-0.5">
                                                                {variant.name.replace(selectedProduct.name, '').trim() || variant.name}
                                                                <span className="text-[10px] px-2 py-0.5 rounded-[6px] bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400 font-medium">{variant.code}</span>
                                                            </div>
                                                            <div className="text-[11px] text-slate-500 flex items-center gap-2 font-medium">
                                                                <span>Stok: <b className={variant.stock <= 0 ? 'text-red-500' : 'text-emerald-500'}>{variant.stock}</b></span>
                                                                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-white/20"></span>
                                                                <span>Fiyat: <b className="text-slate-700 dark:text-slate-300">{Number(variant.price).toLocaleString('tr-TR')} ₺</b></span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 tracking-wider">DÜZENLE →</span>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-12 flex flex-col items-center justify-center text-slate-500">
                                                <span className="text-3xl opacity-50 mb-3">📦</span>
                                                <span className="text-[14px] font-semibold text-slate-700 dark:text-slate-300">Varyant Bulunamadı</span>
                                                <p className="text-[12px] opacity-70 mt-1.5 max-w-[200px] leading-relaxed">Bu ana ürüne bağlı alt varyantlar henüz oluşturulmamış.</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-5 pt-4 border-t border-slate-200 dark:border-white/10 text-center">
                                        <p className="text-[11px] font-medium text-slate-500 leading-relaxed">Yeni varyant eklemek için "Envanter → Yeni Ürün" menüsünü kullanın ve "Varyant Kullan" seçeneğini işaretleyin.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                        {detailTab === 'general' && (
                            <div className="grid grid-cols-2 gap-6 animate-fade-in">
                                <div className="space-y-5">
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">Ürün Adı</label>
                                        <input
                                            type="text"
                                            value={selectedProduct.name}
                                            onChange={(e) => setSelectedProduct({ ...selectedProduct, name: e.target.value })}
                                            disabled={!canEdit}
                                            className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-[12px] p-3 text-[13px] font-medium text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors shadow-sm disabled:opacity-50"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">Stok Kodu</label>
                                        <input
                                            type="text"
                                            value={selectedProduct.code}
                                            onChange={(e) => setSelectedProduct({ ...selectedProduct, code: e.target.value })}
                                            disabled={!canEdit}
                                            className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-[12px] p-3 text-[13px] font-medium text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors shadow-sm disabled:opacity-50"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">Barkod</label>
                                        <input
                                            type="text"
                                            value={selectedProduct.barcode}
                                            onChange={(e) => setSelectedProduct({ ...selectedProduct, barcode: e.target.value })}
                                            disabled={!canEdit}
                                            className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-[12px] p-3 text-[13px] font-medium text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors shadow-sm disabled:opacity-50"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-5">
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">Marka</label>
                                        <input
                                            type="text"
                                            value={selectedProduct.brand}
                                            onChange={(e) => setSelectedProduct({ ...selectedProduct, brand: e.target.value })}
                                            disabled={!canEdit}
                                            className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-[12px] p-3 text-[13px] font-medium text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors shadow-sm disabled:opacity-50"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">Kategori</label>
                                        <select
                                            value={selectedProduct.category}
                                            onChange={(e) => setSelectedProduct({ ...selectedProduct, category: e.target.value })}
                                            disabled={!canEdit}
                                            className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-[12px] p-3 text-[13px] font-medium text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors appearance-none shadow-sm disabled:opacity-50"
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
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">Stok Miktarı</label>
                                            <input
                                                type="number"
                                                value={selectedProduct.stock}
                                                onChange={(e) => setSelectedProduct({ ...selectedProduct, stock: parseFloat(e.target.value) })}
                                                disabled={!canEdit}
                                                className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-[12px] p-3 text-[13px] font-medium text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors shadow-sm disabled:opacity-50"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">Satış Birimi</label>
                                            <select
                                                value={selectedProduct.unit || 'Adet'}
                                                onChange={(e) => setSelectedProduct({ ...selectedProduct, unit: e.target.value })}
                                                disabled={!canEdit}
                                                className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-[12px] p-3 text-[13px] font-medium text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors appearance-none shadow-sm disabled:opacity-50"
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
                                </div>
                                <div className="col-span-2">
                                    <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">Açıklama</label>
                                    <textarea
                                        rows={3}
                                        value={selectedProduct.description || ''}
                                        onChange={(e) => setSelectedProduct({ ...selectedProduct, description: e.target.value })}
                                        disabled={!canEdit}
                                        className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-[12px] p-4 text-[13px] font-medium text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors resize-none shadow-sm disabled:opacity-50"
                                    />
                                </div>
                            </div>
                        )}

                        {detailTab === 'pricing' && (
                            <div className="grid grid-cols-2 gap-6 animate-fade-in">
                                <div className="p-5 rounded-[16px] bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 shadow-sm">
                                    <h3 className="text-[13px] font-semibold text-slate-800 dark:text-white mb-4 border-b border-slate-200 dark:border-white/10 pb-2">Alış Fiyatlandırması</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">Alış Fiyatı (Net)</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="number"
                                                    value={selectedProduct.buyPrice}
                                                    onChange={(e) => setSelectedProduct({ ...selectedProduct, buyPrice: parseFloat(e.target.value) })}
                                                    disabled={!canEdit}
                                                    className="flex-[2] bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-[12px] p-3 text-[13px] font-medium text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors shadow-sm disabled:opacity-50"
                                                />
                                                <select
                                                    value={selectedProduct.purchaseCurrency || 'TRY'}
                                                    onChange={(e) => setSelectedProduct({ ...selectedProduct, purchaseCurrency: e.target.value })}
                                                    disabled={!canEdit}
                                                    className="flex-1 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-[12px] p-3 text-[13px] font-medium text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors appearance-none shadow-sm disabled:opacity-50"
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
                                                <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">KDV Oranı</label>
                                                <select
                                                    value={selectedProduct.purchaseVat}
                                                    onChange={(e) => setSelectedProduct({ ...selectedProduct, purchaseVat: parseInt(e.target.value) })}
                                                    disabled={!canEdit}
                                                    className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-[12px] p-3 text-[13px] font-medium text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors appearance-none shadow-sm disabled:opacity-50"
                                                >
                                                    <option value="0">%0</option>
                                                    <option value="1">%1</option>
                                                    <option value="10">%10</option>
                                                    <option value="20">%20</option>
                                                </select>
                                            </div>
                                            <label className="flex items-center gap-2 pt-6 cursor-pointer opacity-90 hover:opacity-100 transition-opacity">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedProduct.purchaseVatIncluded}
                                                    onChange={(e) => setSelectedProduct({ ...selectedProduct, purchaseVatIncluded: e.target.checked })}
                                                    disabled={!canEdit}
                                                    className="w-4 h-4 text-blue-600 rounded border-slate-300 dark:border-white/20 focus:ring-blue-500 focus:ring-2"
                                                />
                                                <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300">KDV Dahil</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5 rounded-[16px] bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 shadow-sm">
                                    <h3 className="text-[13px] font-semibold text-blue-600 dark:text-blue-400 mb-4 border-b border-slate-200 dark:border-white/10 pb-2">Satış Fiyatlandırması</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">Satış Fiyatı (Net)</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="number"
                                                    value={selectedProduct.price}
                                                    onChange={(e) => setSelectedProduct({ ...selectedProduct, price: parseFloat(e.target.value) })}
                                                    disabled={!canEdit}
                                                    className="flex-[2] bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-[12px] p-3 text-[13px] font-bold text-blue-600 dark:text-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors shadow-sm disabled:opacity-50"
                                                />
                                                <select
                                                    value={selectedProduct.currency || 'TRY'}
                                                    onChange={(e) => setSelectedProduct({ ...selectedProduct, currency: e.target.value })}
                                                    disabled={!canEdit}
                                                    className="flex-1 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-[12px] p-3 text-[13px] font-medium text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors appearance-none shadow-sm disabled:opacity-50"
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
                                                <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">KDV Oranı</label>
                                                <select
                                                    value={selectedProduct.salesVat}
                                                    onChange={(e) => setSelectedProduct({ ...selectedProduct, salesVat: parseInt(e.target.value) })}
                                                    disabled={!canEdit}
                                                    className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-[12px] p-3 text-[13px] font-medium text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors appearance-none shadow-sm disabled:opacity-50"
                                                >
                                                    <option value="0">%0</option>
                                                    <option value="1">%1</option>
                                                    <option value="10">%10</option>
                                                    <option value="20">%20</option>
                                                </select>
                                            </div>
                                            <label className="flex items-center gap-2 pt-6 cursor-pointer opacity-90 hover:opacity-100 transition-opacity">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedProduct.salesVatIncluded}
                                                    onChange={(e) => setSelectedProduct({ ...selectedProduct, salesVatIncluded: e.target.checked })}
                                                    disabled={!canEdit}
                                                    className="w-4 h-4 text-blue-600 rounded border-slate-300 dark:border-white/20 focus:ring-blue-500 focus:ring-2"
                                                />
                                                <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300">KDV Dahil</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {detailTab === 'multi-prices' && (
                            <div className="animate-fade-in py-2">
                                <ProductPricesTab productId={selectedProduct.id} />
                            </div>
                        )}
                    </form>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#1e293b] flex justify-between items-center rounded-b-[24px]">
                    <div>
                        {canDelete && onDelete && (
                            <button
                                type="button"
                                onClick={onDelete}
                                className="px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:text-red-400 text-[13px] font-semibold rounded-[10px] transition-colors border border-red-200 dark:border-red-500/20"
                            >
                                Ürünü Sil
                            </button>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 bg-white dark:bg-[#0f172a] hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 font-semibold text-[13px] rounded-[10px] transition-colors border border-slate-200 dark:border-white/10"
                        >
                            Vazgeç
                        </button>
                        {canEdit && (
                            <button
                                type="button"
                                onClick={onSave}
                                className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[13px] rounded-[10px] shadow-sm transition-colors flex items-center gap-2"
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
