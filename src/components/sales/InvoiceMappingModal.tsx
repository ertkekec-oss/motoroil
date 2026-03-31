
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
        const key = item.code || item.barcode || item.name;
        return rawMappings[key] || { status: 'notFound', score: 0, suggestions: [], marketplaceName: item.name };
    };

    const allMapped = selectedOrder.items.every((i: any) => {
        const mapped = mappedItems[i.name];
        return mapped && mapped.productId;
    });

    const handleWizardSave = async () => {
        if (!wizardData?.name || !wizardItem) return;
        setIsCreating(wizardItem.name);
        try {
            const res = await apiFetch('/api/inventory', {
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
                setMappedItems({ ...mappedItems, [wizardItem.name]: { productId: data.product.id, status: 'new' } });
                setQuickCreate({ ...quickCreate, [wizardItem.name]: null }); // close quick form
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
                        <div className="space-y-3">
                            {selectedOrder.items?.map((item: any, idx: number) => {
                                const info = getMappingInfo(item);
                                const currentMap = mappedItems[item.name];
                                const isDone = !!(currentMap?.productId);
                                const statusColor = isDone ? 'text-emerald-600 dark:text-emerald-400' : (info.status === 'suggest' ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400');
                                const bgStyle = isDone ? 'bg-emerald-50/50 dark:bg-emerald-500/5' : (info.status === 'suggest' ? 'bg-amber-50/50 dark:bg-amber-500/5' : 'bg-rose-50/50 dark:bg-rose-500/5');
                                const borderStyle = isDone ? 'border-emerald-200 dark:border-emerald-500/20' : (info.status === 'suggest' ? 'border-amber-200 dark:border-amber-500/20' : 'border-rose-200 dark:border-rose-500/20');
                                const showCreate = quickCreate[item.name] !== undefined && quickCreate[item.name] !== null;

                                return (
                                    <div key={idx} className={`p-4 rounded-2xl border ${bgStyle} ${borderStyle}`}>
                                        {/* Row: marketplace item */}
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <div className="font-bold text-[14px] text-slate-800 dark:text-white mb-1">{item.name}</div>
                                                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                                    <span>Kod: {item.code || item.barcode || '—'}</span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                                                    <span>Adet: <strong className="font-black text-slate-700 dark:text-slate-200">x{item.qty || item.quantity || 1}</strong></span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className={`text-[10px] font-black uppercase tracking-widest ${statusColor}`}>
                                                    {isDone ? '✅ Eşleştirildi' : SCORE_LABELS[info.status]}
                                                </div>
                                                {info.score > 0 && <div className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-widest">Skor: {info.score}/100</div>}
                                            </div>
                                        </div>

                                        {/* Match selector */}
                                        {info.status === 'suggest' && !isDone && (
                                            <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/10 mb-3 px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-500/20">
                                                💡 AI Önerisi: <strong className="font-black">{info.internalProduct?.name}</strong> (Skor: {info.score}) — Lütfen doğrulayın veya listeden başka bir ürün seçin.
                                            </div>
                                        )}

                                        {info.status !== 'notFound' || isDone ? (
                                            <select
                                                className={`w-full px-4 py-3 rounded-xl text-[13px] font-bold outline-none border transition-colors ${isDone ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-400' : 'bg-white dark:bg-[#1e293b] border-amber-300 dark:border-amber-500/30 text-slate-800 dark:text-white'}`}
                                                value={currentMap?.productId || ''}
                                                onChange={e => setMappedItems({ ...mappedItems, [item.name]: { productId: e.target.value, status: 'manual' } })}
                                            >
                                                <option value="">— Stok Kartı Seçin —</option>
                                                {(info.suggestions || []).length > 0 && (
                                                    <optgroup label={`🤖 AI Önerileri (en iyi ${info.suggestions.length})`}>
                                                        {(info.suggestions as any[])?.map((s: any) => (
                                                            <option key={s.product.id} value={s.product.id}>
                                                                {s.product.name} — Stok: {s.product.stock} — Skor: {s.score}
                                                            </option>
                                                        ))}
                                                    </optgroup>
                                                )}
                                                <optgroup label="📦 Tüm Stok Kartları">
                                                    {inventoryProducts?.map((inv: any) => (
                                                        <option key={inv.id} value={inv.id}>
                                                            {inv.name} ({inv.stock} Adet)
                                                        </option>
                                                    ))}
                                                </optgroup>
                                            </select>
                                        ) : (
                                            /* notFound — offer create */
                                            <div>
                                                {!showCreate ? (
                                                    <div className="flex gap-3">
                                                        <select
                                                            className="flex-1 bg-white dark:bg-[#1e293b] border border-rose-300 dark:border-rose-500/30 px-4 py-3 rounded-xl text-[13px] font-bold text-slate-800 dark:text-white outline-none"
                                                            value={currentMap?.productId || ''}
                                                            onChange={e => setMappedItems({ ...mappedItems, [item.name]: { productId: e.target.value, status: 'manual' } })}
                                                        >
                                                            <option value="">— Manuel Seçim Yap —</option>
                                                            {inventoryProducts?.map((inv: any) => (
                                                                <option key={inv.id} value={inv.id}>{inv.name} ({inv.stock} Adet)</option>
                                                            ))}
                                                        </select>
                                                        <button
                                                            onClick={() => setQuickCreate({ ...quickCreate, [item.name]: { name: item.name, code: item.code || '', stock: '0', price: '0' } })}
                                                            className="px-5 py-3 rounded-full border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[11px] font-black uppercase tracking-widest hover:bg-indigo-100 dark:hover:bg-indigo-500/20 active:scale-95 transition-all whitespace-nowrap"
                                                        >
                                                            + Yeni Kart Oluştur
                                                        </button>
                                                    </div>
                                                ) : (
                                                        <div className="bg-indigo-50/50 dark:bg-indigo-500/5 border border-indigo-200 dark:border-indigo-500/20 rounded-xl p-6 flex flex-col gap-4 items-center justify-center text-center">
                                                            <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2">
                                                                📦
                                                            </div>
                                                            <h4 className="font-black text-[15px] text-slate-800 dark:text-white uppercase tracking-widest">Gelişmiş Kart Oluşturucu</h4>
                                                            <p className="text-[12px] font-semibold text-slate-500 dark:text-slate-400 max-w-sm mb-2">Bu ürün için envanter modülündeki gelişmiş özelliklerle tam donanımlı bir stok kartı oluşturulacaktır.</p>
                                                            <div className="flex gap-3 mt-2 w-full max-w-sm">
                                                                <button onClick={() => {
                                                                    setWizardItem(item);
                                                                    setWizardData({
                                                                        name: item.name,
                                                                        code: item.code || item.barcode || '',
                                                                        stock: Number(item.qty || item.quantity || 1),
                                                                        price: Number(item.price || item.unitPrice || 0),
                                                                        buyPrice: 0,
                                                                        brand: item.brand || '',
                                                                        type: 'Stoklu Ürün',
                                                                        status: 'Aktif'
                                                                    });
                                                                }} className="flex-1 py-3.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[12px] uppercase tracking-widest transition-all shadow-md shadow-indigo-500/20 active:scale-95">
                                                                    🚀 Sihirbazı Başlat
                                                                </button>
                                                                <button onClick={() => setQuickCreate({ ...quickCreate, [item.name]: null })} className="px-6 py-3.5 rounded-full border border-slate-300 dark:border-white/10 bg-white dark:bg-[#0f172a] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 font-black text-[12px] uppercase tracking-widest transition-colors shadow-sm">
                                                                    İptal
                                                                </button>
                                                            </div>
                                                        </div>
                                                )}
                                            </div>
                                        )}
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
