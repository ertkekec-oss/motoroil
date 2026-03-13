import React, { useState, useEffect } from 'react';
import { Product } from '@/contexts/AppContext';
import { toast } from 'sonner';

interface BulkPriceEntryContentProps {
    products: Product[];
    onSave: (payload: any) => Promise<void>;
    isProcessing: boolean;
}

export default function BulkPriceEntryContent({
    products,
    onSave,
    isProcessing
}: BulkPriceEntryContentProps) {
    const [activeTab, setActiveTab] = useState<'sync' | 'settings'>('sync');

    return (
        <div className="flex flex-col h-[calc(100vh-230px)] min-h-[500px]">
             {/* Navigation Tabs */}
             <div className="flex items-center gap-6 border-b border-slate-200 dark:border-white/10 px-4 pb-[0px] shrink-0">
                <button 
                    onClick={() => setActiveTab('sync')} 
                    className={`pb-3 font-semibold text-[13px] relative transition-colors ${activeTab === 'sync' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}
                >
                    Fiyat Senkronizasyon Konsolu
                    {activeTab === 'sync' && <div className="absolute bottom-[0px] left-0 w-full h-[2px] bg-blue-600 dark:bg-blue-400 rounded-t-full"></div>}
                </button>
                <button 
                    onClick={() => setActiveTab('settings')} 
                    className={`pb-3 font-semibold text-[13px] relative transition-colors ${activeTab === 'settings' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}
                >
                    Fiyat Listeleri & Kanal Yönetimi
                    {activeTab === 'settings' && <div className="absolute bottom-[0px] left-0 w-full h-[2px] bg-blue-600 dark:bg-blue-400 rounded-t-full"></div>}
                </button>
            </div>

            <div className="flex-1 mt-4 relative overflow-hidden flex flex-col">
                {activeTab === 'sync' ? (
                    <SyncView products={products} onSave={onSave} isProcessing={isProcessing} />
                ) : (
                    <SettingsView />
                )}
            </div>
        </div>
    );
}

// -------------------------------------------------------------------------------------
// 1. SYNC VIEW (Spreadsheet and Rules)
// -------------------------------------------------------------------------------------

function SyncView({ products, onSave, isProcessing }: any) {
    const [priceData, setPriceData] = useState<Record<string, any>>({});
    const [selectedRows, setSelectedRows] = useState<string[]>([]);
    const [priceLists, setPriceLists] = useState<any[]>([]);
    const [targetListId, setTargetListId] = useState<string>('default');
    
    // Filters States
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [filterBrand, setFilterBrand] = useState<string>('all');

    // Rule Engine States
    const [basePriceType, setBasePriceType] = useState<string>('buy_price');
    const [operator, setOperator] = useState<string>('percent_plus');
    const [modifierValue, setModifierValue] = useState<number>(0);
    const [isPanelOpen, setIsPanelOpen] = useState(false);

    useEffect(() => {
        fetch('/api/pricing/lists')
            .then(res => res.json())
            .then(data => {
                if (data.success && data.data) {
                    setPriceLists(data.data);
                }
            })
            .catch(err => console.error("Katalog yüklenemedi", err));
    }, []);

    useEffect(() => {
        const initialData: Record<string, any> = {};
        products.forEach((p: any) => {
            let currentTargetPrice = p.price || 0; 
            if (targetListId === 'buy_price') {
                currentTargetPrice = p.buyPrice || 0;
            } else if (targetListId !== 'default' && targetListId !== 'buy_price') {
                const pPrices: any[] = p.prices || [];
                const found = pPrices.find((pp: any) => pp.priceListId === targetListId);
                if (found) {
                    currentTargetPrice = parseFloat(found.price);
                }
            }

            initialData[p.id] = {
                id: p.id,
                buyPrice: p.buyPrice || 0,
                defaultPrice: p.price || 0,
                currentPrice: currentTargetPrice,
                newPrice: currentTargetPrice
            };
        });
        setPriceData(initialData);
    }, [products, targetListId]);

    const handleUpdate = (id: string | number, field: string, value: any) => {
        setPriceData(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
    };

    const toggleRow = (id: string, checked: boolean) => {
        setSelectedRows(prev => checked ? [...prev, id] : prev.filter(rId => rId !== id));
    };

    // Derived filtering logic
    const uniqueCategories = Array.from(new Set(products.map((p: any) => p.category).filter(Boolean))) as string[];
    const uniqueBrands = Array.from(new Set(products.map((p: any) => p.brand).filter(Boolean))) as string[];

    const filteredProducts = products.filter((p: any) => {
        let match = true;
        if (filterCategory !== 'all' && p.category !== filterCategory) match = false;
        if (filterBrand !== 'all' && p.brand !== filterBrand) match = false;
        return match;
    });

    const toggleAll = (checked: boolean) => {
        setSelectedRows(checked ? filteredProducts.map((p: any) => String(p.id)) : []);
    };

    const calculateRules = () => {
        const targetSelection = selectedRows.length > 0 ? selectedRows : filteredProducts.map((p: any) => String(p.id));
        if (targetSelection.length === 0) return;

        setPriceData(prev => {
            const nextData = { ...prev };
            targetSelection.forEach(id => {
                const row = nextData[id];
                if (!row) return;

                let baseValue = 0;
                if (basePriceType === 'buy_price') baseValue = row.buyPrice;
                else if (basePriceType === 'default_price') baseValue = row.defaultPrice;
                else if (basePriceType === 'current_list') baseValue = row.currentPrice;

                let finalValue = baseValue;
                const val = parseFloat(modifierValue.toString()) || 0;

                switch (operator) {
                    case 'percent_plus': finalValue = baseValue + (baseValue * (val / 100)); break;
                    case 'percent_minus': finalValue = baseValue - (baseValue * (val / 100)); break;
                    case 'amount_plus': finalValue = baseValue + val; break;
                    case 'amount_minus': finalValue = baseValue - val; break;
                    case 'set_fixed': finalValue = val; break;
                }

                if (finalValue < 0) finalValue = 0;
                nextData[id] = { ...row, newPrice: finalValue };
            });
            return nextData;
        });
        
        if (selectedRows.length === 0) setSelectedRows(filteredProducts.map((p: any) => String(p.id)));
    };

    const handleSaveList = async () => {
        if (selectedRows.length === 0) return;
        const pricesPayload: Record<string, number> = {};
        selectedRows.forEach(id => { pricesPayload[id] = parseFloat(priceData[id]?.newPrice || 0); });
        await onSave({ listId: targetListId, prices: pricesPayload });
    };

    return (
        <div className="flex flex-col gap-4 animate-in fade-in h-full flex-1 min-h-0">
            {/* Top Toolbar */}
            <div className="bg-white dark:bg-[#0f172a] rounded-[20px] border border-slate-200 dark:border-white/5 shadow-sm px-4 py-3 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 shrink-0 overflow-hidden">
                <div className="flex flex-wrap items-center gap-3 w-full justify-between">
                    
                    {/* Left: Selectors (Brand, Category, Target List) */}
                    <div className="flex flex-wrap items-center gap-3">
                        <select 
                            className="bg-slate-50 dark:bg-[#1e293b] font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[13px] rounded-lg px-2.5 py-2 w-[160px] outline-none hover:border-blue-400 focus:ring-1 focus:ring-blue-500 transition-colors"
                            value={filterCategory}
                            onChange={(e) => { setFilterCategory(e.target.value); setSelectedRows([]); }}
                        >
                            <option value="all">Tüm Kategoriler</option>
                            {uniqueCategories.map((c: string) => <option key={c} value={c}>{c}</option>)}
                        </select>
                        
                        <select 
                            className="bg-slate-50 dark:bg-[#1e293b] font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[13px] rounded-lg px-2.5 py-2 w-[160px] outline-none hover:border-blue-400 focus:ring-1 focus:ring-blue-500 transition-colors"
                            value={filterBrand}
                            onChange={(e) => { setFilterBrand(e.target.value); setSelectedRows([]); }}
                        >
                            <option value="all">Tüm Markalar</option>
                            {uniqueBrands.map((b: string) => <option key={b} value={b}>{b}</option>)}
                        </select>
                        
                        <div className="h-[28px] w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>

                        <select 
                            className="bg-slate-100 dark:bg-[#1e293b] font-bold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 text-[13px] rounded-lg px-3 py-2 outline-none hover:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                            value={targetListId}
                            onChange={e => { setTargetListId(e.target.value); setSelectedRows([]); }}
                        >
                            <option value="default" className="font-semibold">⚙ İşlem: Ana Satış Fprüsü</option>
                            <option value="buy_price" className="font-semibold text-rose-600">⚙ İşlem: Ana Alış Fiyatı (Maliyet)</option>
                            {priceLists.map(list => (
                                <option key={list.id} value={list.id}>⚙ İşlem: {list.name} Listesi</option>
                            ))}
                        </select>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-wrap items-center gap-3 ml-auto">
                        <span className="text-[12px] font-semibold text-slate-400 mr-2">
                            Seçili: <strong className="text-blue-600 dark:text-blue-400">{selectedRows.length}</strong> / {filteredProducts.length}
                        </span>

                        <button 
                            onClick={() => setIsPanelOpen(!isPanelOpen)}
                            className={`px-4 py-2 rounded-lg text-[13px] font-bold transition-all flex items-center justify-center gap-2 border w-full sm:w-auto
                                ${isPanelOpen ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-transparent dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'}
                            `}
                        >   
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            Fiyat Kuralları
                        </button>
                        
                        <button
                            onClick={handleSaveList}
                            disabled={selectedRows.length === 0 || isProcessing}
                            className={`px-5 py-2 rounded-lg text-[13px] font-bold transition-all flex items-center justify-center gap-2 shadow-sm w-full sm:w-auto
                                ${selectedRows.length === 0 ? 'bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'}
                            `}
                        >
                            {isProcessing ? 'Kaydediliyor...' : 'Değişimi Kaydet'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Rule Engine Panel */}
            {isPanelOpen && (
                <div className="bg-blue-50/50 dark:bg-[#1e293b]/50 border border-blue-100 dark:border-blue-900/30 rounded-[16px] p-4 animate-in slide-in-from-top-2 shrink-0">
                    <div className="flex items-end gap-4 flex-wrap">
                        <div className="flex flex-col gap-1.5 min-w-[180px]">
                            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Referans Fiyat (Neyin Üzerinden?)</label>
                            <select 
                                className="w-full bg-white dark:bg-[#0f172a] text-sm border-slate-200 dark:border-slate-700 outline-none rounded-lg p-2"
                                value={basePriceType} onChange={e => setBasePriceType(e.target.value)}
                            >
                                <option value="buy_price">Alış Fiyatı (Maliyet)</option>
                                <option value="default_price">Varsayılan Satış Fiyatı</option>
                                <option value="current_list">Şuan ki {targetListId === 'default' ? 'Satış' : targetListId === 'buy_price' ? 'Alış' : 'Liste'} Fiyatı</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-1.5 min-w-[200px]">
                            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">İşlem Türü</label>
                            <select 
                                className="w-full bg-white dark:bg-[#0f172a] text-sm border-slate-200 dark:border-slate-700 outline-none rounded-lg p-2"
                                value={operator} onChange={e => setOperator(e.target.value)}
                            >
                                <option value="percent_plus">Yüzde (%) Olarak Artır</option>
                                <option value="percent_minus">Yüzde (%) Olarak Eksilt</option>
                                <option value="amount_plus">Tutar (₺) Ekle</option>
                                <option value="amount_minus">Tutar (₺) Çıkar</option>
                                <option value="set_fixed">Sabit Bir Fiyata Eşitle</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-1.5 w-32">
                            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Değer</label>
                            <input 
                                type="number" 
                                className="w-full bg-white dark:bg-[#0f172a] text-sm border-slate-200 dark:border-slate-700 outline-none rounded-lg p-2 tabular-nums font-bold text-blue-600"
                                value={modifierValue}
                                onChange={e => setModifierValue(parseFloat(e.target.value) || 0)}
                            />
                        </div>
                        <div className="pb-0.5 pt-4">
                            <button 
                                onClick={calculateRules}
                                className="h-[38px] px-6 bg-slate-900 dark:bg-slate-200 text-white dark:text-slate-900 rounded-lg text-sm font-bold shadow-sm hover:opacity-90 transition-opacity"
                            >
                                Kuralı Uygula / Önizle
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Spreadsheet Table */}
            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] flex-1 overflow-hidden shadow-sm flex flex-col relative z-0">
                <div className="flex-1 overflow-auto custom-scroll relative">
                    <table className="w-full text-left border-collapse text-[12px] relative min-w-[800px]">
                        <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-[#1e293b] border-b border-slate-200 dark:border-white/5 shadow-sm">
                            <tr>
                                <th className="px-3 py-2 w-10 text-center">
                                    <input
                                        type="checkbox"
                                        className="w-3.5 h-3.5 rounded border-slate-300 dark:border-white/10 accent-blue-600 cursor-pointer"
                                        checked={selectedRows.length === filteredProducts.length && filteredProducts.length > 0}
                                        onChange={(e) => toggleAll(e.target.checked)}
                                    />
                                </th>
                                <th className="px-3 py-2 font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest min-w-[200px]">Ürün</th>
                                <th className="px-3 py-2 font-bold text-slate-400 uppercase tracking-widest text-right w-28">Alış/Maliyet</th>
                                
                                {/* REfERANS LİSTELER */}
                                {targetListId !== 'default' && (
                                    <th className="px-3 py-2 font-bold text-slate-400 uppercase tracking-widest text-right w-28 whitespace-nowrap overflow-hidden text-ellipsis">Ana Satış</th>
                                )}
                                {priceLists.filter(list => list.id !== targetListId).map(list => (
                                    <th key={list.id} className="px-3 py-2 font-bold text-slate-400 uppercase tracking-widest text-right w-28 whitespace-nowrap overflow-hidden text-ellipsis" title={list.name}>
                                        {list.name}
                                    </th>
                                ))}

                                <th className="px-3 py-2 font-bold text-amber-700 dark:text-amber-500 uppercase tracking-widest text-right w-32 bg-amber-50/50 dark:bg-amber-900/10 border-l border-amber-200/50 dark:border-amber-900/30">
                                    Şu anki {targetListId === 'default' ? 'Satış' : targetListId === 'buy_price' ? 'Alış' : priceLists.find(l => l.id === targetListId)?.name}
                                </th>
                                <th className="px-3 py-2 font-bold text-blue-600 uppercase tracking-widest text-right w-36 bg-blue-50/50 dark:bg-blue-900/10 border-l border-r border-blue-100 dark:border-blue-900/20">Uygulanan Yeni Fiyat</th>
                                <th className="px-3 py-2 font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest text-center w-24">Marj</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="py-12 text-center text-slate-400 font-medium bg-slate-50/50 dark:bg-[#1e293b]/50">Mevcut filtrelere uygun ürün bulunamadı.</td>
                                </tr>
                            ) : (
                                filteredProducts.map((product: any) => {
                                    const current = priceData[product.id] || { buyPrice: 0, defaultPrice: 0, currentPrice: 0, newPrice: 0 };
                                    const isSelected = selectedRows.includes(String(product.id));

                                    const diff = current.newPrice - current.currentPrice;
                                    const marginChange = current.currentPrice > 0 ? (diff / current.currentPrice) * 100 : 0;
                                    const hasChange = current.newPrice !== current.currentPrice;

                                    return (
                                        <tr key={product.id} className={`h-[38px] hover:bg-slate-50 dark:hover:bg-[#1e293b]/50 transition-colors group ${isSelected ? 'bg-blue-50/20 dark:bg-blue-900/10' : ''}`}>
                                            <td className="px-3 text-center border-r border-slate-100 dark:border-white/5">
                                                <input
                                                    type="checkbox"
                                                    className="w-3.5 h-3.5 rounded border-slate-300 dark:border-white/10 accent-blue-600 cursor-pointer"
                                                    checked={isSelected}
                                                    onChange={(e) => toggleRow(String(product.id), e.target.checked)}
                                                />
                                            </td>
                                            <td className="px-3 border-r border-slate-100 dark:border-white/5">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-bold text-slate-900 dark:text-white truncate lg:max-w-xs">{product.name}</span>
                                                    <span className="text-[10px] text-slate-400 font-mono ml-2 hidden sm:inline-block shrink-0">{product.code}</span>
                                                </div>
                                            </td>
                                            <td className="px-3 text-right border-r border-slate-100 dark:border-white/5 opacity-60 bg-slate-50/50 dark:bg-black/20">
                                                <span className="font-medium text-slate-500 tabular-nums">₺{Number(current.buyPrice).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </td>

                                            {/* DİĞER LİSTELER (Referans Olanlar) */}
                                            {targetListId !== 'default' && (
                                                <td className="px-3 text-right border-r border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-[#1e293b]/30">
                                                    <span className="font-medium text-slate-500 tabular-nums">₺{Number(product.price || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                </td>
                                            )}
                                            {priceLists.filter(list => list.id !== targetListId).map(list => {
                                                const foundListPrice = (product.prices || []).find((pp: any) => pp.priceListId === list.id);
                                                const val = foundListPrice ? parseFloat(foundListPrice.price) : 0;
                                                return (
                                                    <td key={list.id} className="px-3 text-right border-r border-slate-100 dark:border-white/5 opacity-70">
                                                        <span className="font-medium text-slate-500 tabular-nums flex items-center justify-end gap-1">
                                                            ₺{Number(val).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </span>
                                                    </td>
                                                );
                                            })}

                                            <td className="px-3 text-right border-r border-slate-100 dark:border-white/5 bg-amber-50/30 dark:bg-amber-900/5">
                                                <span className={`font-semibold tabular-nums ${hasChange ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-slate-200'}`}>
                                                    ₺{Number(current.currentPrice).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </td>
                                            <td className="p-0 border-r border-slate-100 dark:border-white/5 bg-blue-50/20 dark:bg-blue-900/10 relative">
                                                <input
                                                    type="number"
                                                    className={`w-full h-full min-h-[37px] text-right px-3 font-bold bg-transparent outline-none focus:bg-white dark:focus:bg-black focus:ring-1 focus:ring-inset focus:ring-blue-500 tabular-nums
                                                        ${hasChange ? 'text-blue-600 dark:text-blue-400' : 'text-slate-900 dark:text-slate-200'}
                                                    `}
                                                    value={current.newPrice === 0 ? '' : current.newPrice}
                                                    onChange={e => {
                                                        const val = parseFloat(e.target.value) || 0;
                                                        handleUpdate(product.id, 'newPrice', Math.max(0, val));
                                                        if (val !== current.currentPrice && !isSelected) {
                                                            toggleRow(String(product.id), true);
                                                        } else if (val === current.currentPrice && isSelected) {
                                                            toggleRow(String(product.id), false);
                                                        }
                                                    }}
                                                />
                                            </td>
                                            <td className="px-3 text-center border-r border-slate-100 dark:border-white/5">
                                                {hasChange ? (
                                                    <span className={`font-bold tabular-nums text-[10px] px-1.5 py-0.5 rounded ${marginChange > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                        {marginChange > 0 ? '+' : ''}{(marginChange !== Infinity && !isNaN(marginChange)) ? marginChange.toFixed(1) : '∞'}%
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-300 dark:text-slate-600">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// -------------------------------------------------------------------------------------
// 2. SETTINGS VIEW (Channels & Categories Mappings)
// -------------------------------------------------------------------------------------

function SettingsView() {
    const [lists, setLists] = useState<any[]>([]);
    const [settings, setSettings] = useState<Record<string, any>>({});
    const [categories, setCategories] = useState<any[]>([]);
    
    // Create states
    const [newListName, setNewListName] = useState('');
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryListId, setNewCategoryListId] = useState('');
    
    const [loading, setLoading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [resLists, resSettings, resCategories] = await Promise.all([
                fetch('/api/pricing/lists'),
                fetch('/api/settings'),
                fetch('/api/customers/categories')
            ]);
            const dLists = await resLists.json();
            const dSet = await resSettings.json();
            const dCats = await resCategories.json();
            
            if (dLists.data) setLists(dLists.data);
            if (dSet && !dSet.error) setSettings(dSet);
            if (dCats.data) setCategories(dCats.data);
        } catch (e) {
            toast.error("Ayarlar yüklenirken hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleCreateList = async () => {
        if (!newListName.trim()) return;
        try {
            const res = await fetch('/api/pricing/lists', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newListName, isDefault: false })
            });
            const d = await res.json();
            if (d.success || d.ok) {
                toast.success("Yeni fiyat listesi başarıyla oluşturuldu.");
                setNewListName('');
                fetchData();
            } else {
                toast.error(d.error || "Liste oluşturulamadı.");
            }
        } catch {
            toast.error("Sistem hatası");
        }
    };

    const handleDeleteList = async (id: string, name: string) => {
        if (!confirm(`"${name}" fiyat listesini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`)) return;
        try {
            const res = await fetch(`/api/pricing/lists/${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success("Fiyat listesi silindi.");
                fetchData();
            } else {
                toast.error("Silinemedi.");
            }
        } catch { toast.error("Sistem hatası"); }
    };

    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) return;
        try {
            const res = await fetch('/api/customers/categories', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newCategoryName, priceListId: newCategoryListId || null })
            });
            const d = await res.json();
            if (d.success || d.ok) {
                toast.success("Müşteri sınıfı başarıyla oluşturuldu.");
                setNewCategoryName('');
                setNewCategoryListId('');
                fetchData();
            } else {
                toast.error(d.error || "Sınıf oluşturulamadı.");
            }
        } catch { toast.error("Sistem hatası"); }
    };

    const handleDeleteCategory = async (id: string, name: string) => {
        if (!confirm(`"${name}" sınıfını silmek istediğinize emin misiniz?`)) return;
        try {
            const res = await fetch(`/api/customers/categories/${id}`, { method: 'DELETE' });
            if (res.ok || (await res.json()).ok) {
                toast.success("Sınıf silindi.");
                fetchData();
            } else {
                toast.error("Silinemedi.");
            }
        } catch { toast.error("Sistem hatası"); }
    };

    const saveChannelMap = async (key: string, listId: string) => {
        try {
            await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [key]: listId || 'default' })
            });
            setSettings(prev => ({ ...prev, [key]: listId }));
            toast.success("Kanal eşleştirmesi kaydedildi.");
        } catch {
            toast.error("Kayıt başarısız.");
        }
    };

    return (
        <div className="flex flex-col animate-in fade-in h-full overflow-y-auto px-1 py-1">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* L-Col: Create/Manage Lists */}
                <div className="flex flex-col gap-4">
                    <div className="p-5 bg-white dark:bg-[#0f172a] rounded-[20px] border border-slate-200 dark:border-white/5 shadow-sm h-full flex flex-col">
                        <div>
                            <h3 className="font-bold text-slate-800 dark:text-white text-base mb-1">Özel Fiyat Listeleri</h3>
                            <p className="text-sm text-slate-500 mb-6">Yeni bir hedef fiyat listesi oluşturun.</p>
                            
                            <div className="flex gap-2 mb-6">
                                <input 
                                    className="flex-1 bg-slate-50 dark:bg-[#1e293b] text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                                    placeholder="Yeni Liste Adı..."
                                    value={newListName}
                                    onChange={e => setNewListName(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleCreateList()}
                                />
                                <button 
                                    onClick={handleCreateList} 
                                    disabled={loading}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50"
                                >
                                    Ekle
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2 flex-1 overflow-y-auto custom-scroll pr-1 max-h-[400px]">
                            {lists.map(list => (
                                <div key={list.id} className="group flex justify-between items-center p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 hover:border-blue-200 dark:hover:border-blue-900/30 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors">
                                    <span className="font-semibold text-slate-700 dark:text-slate-300 text-[13px]">{list.name} Listesi</span>
                                    <button 
                                        onClick={() => handleDeleteList(list.id, list.name)}
                                        className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                            {lists.length === 0 && !loading && (
                                <div className="text-center py-6 text-slate-400 text-sm">Hiç özel fiyat listeniz bulunmuyor.</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* R-Col: Categories */}
                <div className="lg:col-span-1 flex flex-col gap-4">
                    <div className="p-5 bg-white dark:bg-[#0f172a] rounded-[20px] border border-slate-200 dark:border-white/5 shadow-sm h-full flex flex-col">
                        <div>
                            <h3 className="font-bold text-slate-800 dark:text-white text-base mb-1">Cari Sınıfları (Kategoriler)</h3>
                            <p className="text-sm text-slate-500 mb-6">Müşterileri ayırmak ve fiyat listeleri atamak için sınıflar oluşturun.</p>
                            
                            <div className="flex flex-col gap-2 mb-6">
                                <select 
                                    className="w-full bg-slate-50 dark:bg-[#1e293b] text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                                    value={newCategoryName}
                                    onChange={e => setNewCategoryName(e.target.value)}
                                >
                                    <option value="">Sistemden Bir Cari Sınıfı Seçin...</option>
                                    {(settings.custClasses || []).map((cls: string) => (
                                        <option key={cls} value={cls}>{cls}</option>
                                    ))}
                                </select>
                                <div className="flex gap-2">
                                    <select 
                                        className="flex-1 bg-slate-50 dark:bg-[#1e293b] text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-none focus:border-blue-500 truncate"
                                        value={newCategoryListId}
                                        onChange={e => setNewCategoryListId(e.target.value)}
                                    >
                                        <option value="">Fiyat Listesi Seç (Opsiyonel)</option>
                                        {lists.map(l => (
                                            <option key={l.id} value={l.id}>{l.name} Listesi</option>
                                        ))}
                                    </select>
                                    <button 
                                        onClick={handleCreateCategory} 
                                        disabled={loading || !newCategoryName}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50"
                                    >
                                        Eşleştir
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 flex-1 overflow-y-auto custom-scroll pr-1">
                            {(settings.custClasses || []).map((clsName: string) => {
                                // Find if this class has a mapping in categories DB
                                const matchedCat = categories.find(c => c.name === clsName);
                                const listName = matchedCat?.priceList?.name || 'Ana Satış Fiyatı (Standart)';
                                
                                return (
                                <div key={clsName} className="group flex justify-between items-center p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 hover:border-blue-200 dark:hover:border-blue-900/30 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors">
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-slate-700 dark:text-slate-300 text-[13px]">{clsName}</span>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Atanan Liste:</span>
                                            <span className={`text-[11px] font-semibold ${matchedCat?.priceList ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}>
                                                {listName}
                                            </span>
                                        </div>
                                    </div>
                                    {matchedCat && (
                                        <button 
                                            onClick={() => handleDeleteCategory(matchedCat.id, matchedCat.name)}
                                            title="Eşleştirmeyi Kaldır"
                                            className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            )})}
                            {categories.length === 0 && !loading && (
                                <div className="text-center py-6 text-slate-400 text-sm">Hiç müşteri sınıfı bulunmuyor.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
