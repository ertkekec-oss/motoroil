
import React from 'react';

interface InventoryFilterBarProps {
    searchTerm: string;
    setSearchTerm: (s: string) => void;
    isFilterOpen: boolean;
    setIsFilterOpen: (b: boolean) => void;
    filterCategory: string;
    setFilterCategory: (s: string) => void;
    categories: string[];
    filterBrand: string;
    setFilterBrand: (s: string) => void;
    brands: string[];
    stockSort: 'none' | 'asc' | 'desc';
    setStockSort: (s: 'none' | 'asc' | 'desc') => void;
    specialFilter: 'none' | 'no-move' | 'top-seller' | 'critical-stock';
    setSpecialFilter: (s: 'none' | 'no-move' | 'top-seller' | 'critical-stock') => void;
}

export default function InventoryFilterBar({
    searchTerm,
    setSearchTerm,
    isFilterOpen,
    setIsFilterOpen,
    filterCategory,
    setFilterCategory,
    categories,
    filterBrand,
    setFilterBrand,
    brands,
    stockSort,
    setStockSort,
    specialFilter,
    setSpecialFilter
}: InventoryFilterBarProps) {
    const handleReset = () => {
        setFilterCategory('all');
        setFilterBrand('all');
        setStockSort('none');
        setSpecialFilter('none');
        setSearchTerm('');
        setIsFilterOpen(false);
    };

    return (
        <div className="relative flex gap-3 items-center z-20">
            {/* SEARCH BAR */}
            <div className="relative group w-[220px]">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40 group-focus-within:opacity-100 transition-opacity text-sm">🔍</span>
                <input
                    type="text"
                    placeholder="Ara..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/10 py-2.5 pl-10 pr-3 rounded-xl text-white/90 text-[13px] font-medium placeholder-white/20 outline-none transition-all duration-300 focus:border-primary/40 focus:bg-white/[0.06] focus:ring-4 focus:ring-primary/5 shadow-sm"
                />
            </div>

            {/* FILTER BUTTON */}
            <div className="relative">
                <button
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className={`
                        flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-[11px] tracking-wide transition-all duration-300 shadow-sm
                        ${isFilterOpen
                            ? 'bg-primary text-white shadow-primary/25 ring-2 ring-primary/20'
                            : 'bg-white/[0.03] border border-white/10 text-white/70 hover:text-white hover:bg-white/[0.08] hover:border-white/20'
                        }
                    `}
                >
                    <span className="text-sm">⚡</span>
                    <span>Filtre</span>
                    <span className={`transform transition-transform duration-300 text-[9px] opacity-60 ${isFilterOpen ? 'rotate-180' : ''}`}>▼</span>
                </button>

                {/* DROPDOWN MENU */}
                {isFilterOpen && (
                    <div className="animate-in absolute top-[60px] right-0 w-[400px] glass-plus rounded-2xl p-6 z-[1000] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10">
                        <div className="flex flex-col gap-6">
                            {/* Category Select */}
                            <div className="flex flex-col gap-2">
                                <label className="text-white/50 text-[11px] font-semibold uppercase tracking-wider px-1">Kategori</label>
                                <div className="relative">
                                    <select
                                        className="w-full bg-black/20 hover:bg-black/30 p-3 pr-10 rounded-lg border border-white/5 text-sm font-medium text-white outline-none appearance-none cursor-pointer focus:border-primary/40 transition-all"
                                        value={filterCategory}
                                        onChange={e => { setFilterCategory(e.target.value); setIsFilterOpen(false); }}
                                    >
                                        <option value="all">Tüm Kategoriler</option>
                                        <option value="uncategorized">Kategorisiz Ürünler</option>
                                        {categories.filter(c => c).map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 text-xs">▼</div>
                                </div>
                            </div>

                            {/* Brand Select */}
                            <div className="flex flex-col gap-2">
                                <label className="text-white/50 text-[11px] font-semibold uppercase tracking-wider px-1">Marka</label>
                                <div className="relative">
                                    <select
                                        className="w-full bg-black/20 hover:bg-black/30 p-3 pr-10 rounded-lg border border-white/5 text-sm font-medium text-white outline-none appearance-none cursor-pointer focus:border-primary/40 transition-all"
                                        value={filterBrand}
                                        onChange={e => { setFilterBrand(e.target.value); setIsFilterOpen(false); }}
                                    >
                                        <option value="all">Tüm Markalar</option>
                                        {brands.filter(b => b && b !== 'Belirtilmemiş').map(b => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 text-xs">▼</div>
                                </div>
                            </div>

                            {/* Stock Sort Buttons */}
                            <div className="flex flex-col gap-3">
                                <label className="text-white/50 text-[11px] font-semibold uppercase tracking-wider px-1">Sıralama</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { id: 'asc', label: 'Azdan Çoğa' },
                                        { id: 'desc', label: 'Çoktan Aza' }
                                    ].map(opt => (
                                        <button
                                            key={opt.id}
                                            onClick={() => { setStockSort(opt.id as any); setIsFilterOpen(false); }}
                                            className={`
                                                py-2.5 rounded-lg text-xs font-semibold transition-all
                                                ${stockSort === opt.id
                                                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                                    : 'bg-white/5 border border-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                                                }
                                            `}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Intelligent Filter Select */}
                            <div className="flex flex-col gap-2">
                                <label className="text-white/50 text-[11px] font-semibold uppercase tracking-wider px-1">Akıllı Filtre</label>
                                <div className="relative">
                                    <select
                                        className="w-full bg-black/20 hover:bg-black/30 p-3 pr-10 rounded-lg border border-white/5 text-sm font-medium text-white outline-none appearance-none cursor-pointer focus:border-primary/40 transition-all"
                                        value={specialFilter}
                                        onChange={e => { setSpecialFilter(e.target.value as any); setIsFilterOpen(false); }}
                                    >
                                        <option value="none">Seçiniz...</option>
                                        <option value="critical-stock">🚨 Kritik Stoktakiler</option>
                                        <option value="top-seller">🔥 En Çok Satanlar</option>
                                        <option value="no-move">🧊 Hareket Görmeyenler</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 text-xs">▼</div>
                                </div>
                            </div>

                            {/* Reset Button */}
                            <button
                                onClick={handleReset}
                                className="mt-2 w-full py-3 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors text-xs font-semibold tracking-wide"
                            >
                                Filtreleri Temizle
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
