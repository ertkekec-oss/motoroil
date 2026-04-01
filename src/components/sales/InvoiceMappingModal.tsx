
"use client";

import { Fragment, useState } from 'react';
import { apiFetch } from '@/lib/api-client';
import { useModal } from '@/contexts/ModalContext';
import ProductWizardModal from '@/app/(app)/inventory/components/ProductWizardModal';

interface InvoiceMappingModalProps {
    selectedOrder: any;
    setSelectedOrder: (order: any) => void;
    isLoadingMapping: boolean;
    mappedItems: { [key: string]: any }; // itemName → { productId, status }
    setMappedItems: (items: any) => void;
    inventoryProducts: any[];
    finalizeInvoice: () => void;
    // New: raw API mapping results (keyed by item code)
    rawMappings?: Record<string, any>;
}

// Inline "New Product" quick-create form state (per item)
interface QuickCreateState {
    name: string;
    code: string;
    stock: string;
    price: string;
}

const SCORE_COLORS: Record<string, string> = {
    mapped: '#02C951',  // green
    suggest: '#F59E0B',  // amber
    notFound: '#E53E3E',  // red
};
const SCORE_LABELS: Record<string, string> = {
    mapped: '✅ Otomatik Eşleşti',
    suggest: '⚠️ Öneri — Doğrula',
    notFound: '❌ Stokta Bulunamadı',
};

export function InvoiceMappingModal({
    selectedOrder,
    setSelectedOrder,
    isLoadingMapping,
    mappedItems,
    setMappedItems,
    inventoryProducts,
    finalizeInvoice,
    rawMappings = {},
}: InvoiceMappingModalProps) {
    if (!selectedOrder) return null;

    const [quickCreate, setQuickCreate] = useState<Record<string, QuickCreateState | null>>({});
    const [isCreating, setIsCreating] = useState<string | null>(null);
    const { showError, showSuccess } = useModal();

    // Wizard State
    const [wizardItem, setWizardItem] = useState<any>(null);
    const [wizardData, setWizardData] = useState<any>(null);

    // Get the mapping status for a given item
    const getMappingInfo = (item: any) => {
        const key = item.sku || item.code || item.barcode || item.productName || item.name;
        return rawMappings[key] || { status: 'notFound', score: 0, suggestions: [], marketplaceName: item.productName || item.name };
    };

    const allMapped = selectedOrder.items.every((i: any) => {
        const itemName = i.productName || i.name || 'İsimsiz Ürün';
        const mapped = mappedItems[itemName];
        return mapped && mapped.productId;
    });

    const handleWizardSave = async () => {
        if (!wizardData?.name || !wizardItem) return;
        const itemName = wizardItem.productName || wizardItem.name || 'İsimsiz Ürün';
        setIsCreating(itemName);
        try {
            const res = await apiFetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    // Destructure everything carefully, matching the API expectations
                    ...wizardData,
                    stock: parseFloat(wizardData.stock) || 0,
                    price: parseFloat(wizardData.price) || 0,
                    buyPrice: parseFloat(wizardData.buyPrice) || 0,
                    source: 'marketplace_mapping_wizard',
                })
            });
            const data = await res.json();
            if (data.success && data.product) {
                setMappedItems({ ...mappedItems, [itemName]: { productId: data.product.id, status: 'new' } });
                setQuickCreate({ ...quickCreate, [itemName]: null }); // close quick form
                inventoryProducts.push(data.product); // optimistic push
                showSuccess('Başarılı', 'Stok kartı sihirbaz başarıyla kullanılarak oluşturuldu.');
                setWizardData(null);
                setWizardItem(null);
            } else {
                showError('Hata', 'Stok kartı oluşturulamadı: ' + (data.error || 'Bilinmeyen hata'));
            }
        } catch (e: any) {
            showError('Hata', 'İşlem Başarısız: ' + e.message);
        } finally {
            setIsCreating(null);
        }
    };

    return (

        <div style={{ position: 'fixed', inset: 0, zIndex: 1000 }} className="flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[24px] shadow-2xl w-full max-w-4xl relative animate-in zoom-in-95 duration-200 flex flex-col overflow-hidden max-h-[90vh]">
                
                {/* Header */}
                <div className="bg-[#f8fafc] dark:bg-[#1e293b]/50 border-b border-slate-200 dark:border-white/5 px-6 py-5 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-lg">
                            📑
                        </div>
                        <div>
                            <h2 className="text-[16px] font-black text-slate-800 dark:text-white tracking-tight leading-none mb-1">
                                Akıllı Ürün Eşleştirme
                            </h2>
                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                Sipariş #{selectedOrder.orderNumber} · {selectedOrder.marketplace}
                            </p>
                        </div>
                    </div>
                    <button onClick={() => setSelectedOrder(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors">
                        ✕
                    </button>
                </div>

                {isLoadingMapping ? (
                    <div className="p-16 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 gap-4">
                        <div className="text-4xl animate-bounce">🤖</div>
                        <p className="text-[14px] font-bold">AI ürünleri tarıyor ve eşleştiriyor...</p>
                        <p className="text-[11px] font-semibold opacity-60 uppercase tracking-widest">Stok veritabanınızla karşılaştırılıyor</p>
                    </div>
                ) : (
                    <div className="p-6 overflow-y-auto w-full space-y-4 flex flex-col custom-scroll">
                        {/* Legend */}
                        <div className="flex gap-4 items-center text-[10px] font-black uppercase tracking-widest px-4 py-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5">
                            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Otomatik eşleşti</span>
                            <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Öneri var — doğrula</span>
                            <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500"></span> Bulunamadı — kart oluştur</span>
                        </div>

                        {/* Items */}
                        <div className="space-y-4">
                            {selectedOrder.items?.map((item: any, idx: number) => {
                                const itemName = item.productName || item.name || 'İsimsiz Ürün';
                                const itemCode = item.sku || item.code || item.barcode || item.stockCode || '—';
                                const itemQty = item.quantity || item.qty || 1;
                                const itemPrice = item.price || item.unitPrice || 0;

                                const info = getMappingInfo(item);
                                const currentMap = mappedItems[itemName];
                                const isDone = !!(currentMap?.productId);
                                const statusColor = isDone ? 'text-emerald-600 dark:text-emerald-400' : (info.status === 'suggest' ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400');
                                const borderStyle = isDone ? 'border-emerald-200 dark:border-emerald-500/20' : (info.status === 'suggest' ? 'border-amber-200 dark:border-amber-500/20' : 'border-slate-200 dark:border-white/10');
                                const bgStyle = isDone ? 'bg-white dark:bg-[#1e293b]' : 'bg-slate-50 dark:bg-slate-900/50';

                                const handleNewItemClick = () => {
                                    setWizardItem(item);
                                    setWizardData({
                                        name: itemName,
                                        code: itemCode !== '—' ? itemCode : '',
                                        stock: Number(itemQty),
                                        price: Number(itemPrice),
                                        buyPrice: 0,
                                        brand: item.brand || '',
                                        type: 'Stoklu Ürün',
                                        status: 'Aktif'
                                    });
                                };

                                return (
                                    <div key={idx} className={`p-5 rounded-2xl border transition-all ${bgStyle} ${borderStyle} shadow-sm group`}>
                                        {/* Row: marketplace item */}
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                                            <div className="flex-1">
                                                <div className="font-bold text-[15px] text-slate-800 dark:text-white mb-1.5">{itemName}</div>
                                                <div className="text-[12px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-3">
                                                    <span className="bg-white dark:bg-[#0f172a] px-2 py-1 rounded shadow-sm border border-slate-200 dark:border-white/5 font-mono">Kod: <span className="text-slate-700 dark:text-slate-300">{itemCode}</span></span>
                                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                                                    <span className="bg-white dark:bg-[#0f172a] px-2 py-1 rounded shadow-sm border border-slate-200 dark:border-white/5">Adet: <strong className="font-black text-slate-700 dark:text-slate-200 text-indigo-600 dark:text-indigo-400">x{itemQty}</strong></span>
                                                </div>
                                            </div>
                                            <div className="text-left md:text-right shrink-0">
                                                <div className={`text-[11px] inline-flex px-3 py-1.5 rounded-full border border-current font-black uppercase tracking-widest ${statusColor} bg-white dark:bg-[#0f172a] shadow-sm`}>
                                                    {isDone ? '✅ Eşleştirildi' : SCORE_LABELS[info.status]}
                                                </div>
                                                {info.score > 0 && <div className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">AI Güven Skoru: {info.score}%</div>}
                                            </div>
                                        </div>

                                        {/* Match selector */}
                                        {info.status === 'suggest' && !isDone && (
                                            <div className="text-[12px] font-medium text-amber-700 dark:text-amber-400/90 bg-amber-50 dark:bg-amber-500/5 mb-4 px-4 py-3 rounded-xl border border-amber-200 dark:border-amber-500/20 flex items-start sm:items-center gap-3 shadow-sm">
                                                <span className="text-base leading-none mt-0.5 sm:mt-0">💡</span>
                                                <span>Yapay zeka tavsiyesi: <strong className="font-black">{info.internalProduct?.name}</strong>. Doğruluyorsanız <span className="hidden sm:inline">aşağıdaki</span> listeden seçin.</span>
                                            </div>
                                        )}

                                        <div className="w-full flex flex-col md:flex-row gap-3">
                                            <div className="relative flex-1">
                                                <input 
                                                    list={`inventory-list-${idx}`} 
                                                    placeholder="🔎 Stok Ürün Adı Ara veya Eşleştir..."
                                                    className={`w-full h-12 px-5 rounded-xl text-[13px] font-bold outline-none border transition-all ${isDone ? 'bg-emerald-50 dark:bg-emerald-500/5 border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'bg-white dark:bg-[#0f172a] border-slate-300 dark:border-white/10 text-slate-800 dark:text-white hover:border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-sm'}`}
                                                    value={inventoryProducts?.find((p: any) => p.id === currentMap?.productId)?.name || currentMap?.productName || ''}
                                                    onChange={e => {
                                                        const val = e.target.value;
                                                        const found = inventoryProducts?.find((p: any) => p.name === val);
                                                        if (found) {
                                                            setMappedItems({ ...mappedItems, [itemName]: { productId: found.id, status: 'manual' } });
                                                        } else {
                                                            setMappedItems({ ...mappedItems, [itemName]: { productId: '', status: 'manual', productName: val } });
                                                        }
                                                    }}
                                                />
                                                <datalist id={`inventory-list-${idx}`}>
                                                    {inventoryProducts?.map((inv: any) => (
                                                        <option key={inv.id} value={inv.name}>
                                                            SKU: {inv.code} | Stok: {inv.stock} 
                                                        </option>
                                                    ))}
                                                </datalist>
                                            </div>
                                            {!isDone && (
                                                <button
                                                    onClick={handleNewItemClick}
                                                    className="h-12 px-6 rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-[12px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white hover:border-indigo-600 dark:hover:bg-indigo-500 dark:hover:text-white transition-all shadow-sm shrink-0 flex items-center justify-center group-hover:shadow-md"
                                                >
                                                    + Yeni Kart Aç
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {/* Finalize button */}
                        <div className="pt-2 mt-auto">
                            <button
                                onClick={finalizeInvoice}
                                disabled={isLoadingMapping || !allMapped}
                                className={`w-full h-14 rounded-full font-black text-[13px] uppercase tracking-widest transition-all ${allMapped ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 active:scale-[0.98]' : 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-500 cursor-not-allowed'}`}
                            >
                                {isLoadingMapping ? 'İŞLENİYOR...' : (allMapped ? '✅ Eşleştirmeyi Kaydet ve Faturayı Oluştur' : `⚠️ Lütfen Tüm Ürünleri Eşleştirin (${selectedOrder.items.filter((i: any) => !mappedItems[i.name]?.productId).length} eksik)`)}
                            </button>
                        </div>
                    </div>
                )}
            </div>
            
            <ProductWizardModal
                isOpen={!!wizardData}
                mode="create"
                data={wizardData}
                onChange={setWizardData}
                onClose={() => { setWizardData(null); setWizardItem(null); setQuickCreate({}); }}
                onSave={handleWizardSave}
                isProcessing={isCreating !== null}
                categories={[]}
                allProducts={inventoryProducts}
                priceLists={[]}
                productPrices={{}}
                setProductPrices={() => {}}
                showOtherPrices={false}
                setShowOtherPrices={() => {}}
                useVariants={false}
                setUseVariants={() => {}}
                variantAttributes={[]}
                selectedAttributes={[]}
                setSelectedAttributes={() => {}}
                generatedVariants={[]}
                setGeneratedVariants={() => {}}
                generateCombinations={() => {}}
            />
        </div>
    );
}
