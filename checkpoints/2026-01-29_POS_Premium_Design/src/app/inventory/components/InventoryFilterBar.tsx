
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
    specialFilter: 'none' | 'no-move' | 'top-seller';
    setSpecialFilter: (s: 'none' | 'no-move' | 'top-seller') => void;
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
        <div className="relative mb-8 flex gap-6 items-center z-20">
            {/* SEARCH BAR */}
            <div className="relative flex-1 group">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 opacity-30 group-focus-within:opacity-100 transition-opacity text-xl">🔍</span>
                <input
                    type="text"
                    placeholder="Ürün adı, kod veya barkod ile hızlı arama..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/10 py-5 pl-16 pr-8 rounded-[24px] text-white text-[15px] font-medium outline-none transition-all duration-300 focus:border-primary/50 focus:bg-white/[0.06] focus:ring-4 focus:ring-primary/5"
                />
            </div>

            {/* FILTER BUTTON */}
            <div className="relative">
                <button
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className={`
                        flex items-center gap-4 px-10 py-5 rounded-[24px] font-black text-[11px] uppercase tracking-[2px] transition-all duration-500
                        ${isFilterOpen
                            ? 'bg-primary text-white shadow-2xl shadow-primary/40'
                            : 'bg-white/[0.03] border border-white/5 text-white/70 hover:text-white hover:bg-white/[0.08]'
                        }
                    `}
                >
                    <span className="text-lg">⚡</span>
                    <span>Gelişmiş Filtrele</span>
                    <span className={`transform transition-transform duration-500 ${isFilterOpen ? 'rotate-180' : ''}`}>▼</span>
                </button>

                {/* DROPDOWN MENU */}
                {isFilterOpen && (
                    <div className="animate-in absolute top-[85px] right-0 w-[400px] glass-plus rounded-[40px] p-10 z-[1000] shadow-[0_40px_100px_rgba(0,0,0,0.9)] border border-white/10">
                        <div className="flex flex-col gap-8">
                            {/* Category Select */}
                            <div className="flex flex-col gap-3">
                                <label className="text-primary text-[10px] font-black tracking-[3px] uppercase px-1">📁 Kategori</label>
                                <div className="relative">
                                    <select
                                        className="w-full bg-black/40 p-4 rounded-2xl border border-white/5 text-sm font-bold text-white outline-none appearance-none cursor-pointer focus:border-primary/40 transition-all"
                                        value={filterCategory}
                                        onChange={e => { setFilterCategory(e.target.value); setIsFilterOpen(false); }}
                                    >
                                        <option value="all">Tüm Kategoriler</option>
                                        <option value="uncategorized">📁 Kategorisiz Ürünler</option>
                                        {categories.filter(c => c).map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-20">▼</div>
                                </div>
                            </div>

                            {/* Brand Select */}
                            <div className="flex flex-col gap-3">
                                <label className="text-primary text-[10px] font-black tracking-[3px] uppercase px-1">🛡️ Marka</label>
                                <div className="relative">
                                    <select
                                        className="w-full bg-black/40 p-4 rounded-2xl border border-white/5 text-sm font-bold text-white outline-none appearance-none cursor-pointer focus:border-primary/40 transition-all"
                                        value={filterBrand}
                                        onChange={e => { setFilterBrand(e.target.value); setIsFilterOpen(false); }}
                                    >
                                        <option value="all">Tüm Markalar</option>
                                        {brands.filter(b => b && b !== 'Belirtilmemiş').map(b => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-20">▼</div>
                                </div>
                            </div>

                            {/* Stock Sort Buttons */}
                            <div className="flex flex-col gap-4">
                                <label className="text-primary text-[10px] font-black tracking-[3px] uppercase px-1">📊 Stok Sıralaması</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { id: 'asc', label: '📉 Azdan Çoğa' },
                                        { id: 'desc', label: '📈 Çoktan Aza' }
                                    ].map(opt => (
                                        <button
                                            key={opt.id}
                                            onClick={() => { setStockSort(opt.id as any); setIsFilterOpen(false); }}
                                            className={`
                                                py-4 rounded-2xl text-[11px] font-black uppercase tracking-[1px] border transition-all
                                                ${stockSort === opt.id
                                                    ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-[1.02]'
                                                    : 'bg-white/5 border-white/5 text-muted hover:bg-white/10 hover:text-white'
                                                }
                                            `}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Intelligent Filter Select */}
                            <div className="flex flex-col gap-3">
                                <label className="text-primary text-[10px] font-black tracking-[3px] uppercase px-1">💡 Akıllı Filtre</label>
                                <div className="relative">
                                    <select
                                        className="w-full bg-black/40 p-4 rounded-2xl border border-white/5 text-sm font-bold text-white outline-none appearance-none cursor-pointer focus:border-primary/40 transition-all"
                                        value={specialFilter}
                                        onChange={e => { setSpecialFilter(e.target.value as any); setIsFilterOpen(false); }}
                                    >
                                        <option value="none">Filtre Uygulanmasın</option>
                                        <option value="top-seller">🔥 En Çok Satan Ürünler</option>
                                        <option value="no-move">🧊 Hareket Görmeyenler</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-20">▼</div>
                                </div>
                            </div>

                            {/* Reset Button */}
                            <button
                                onClick={handleReset}
                                className="mt-4 btn bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white py-5 text-[11px] font-black"
                            >
                                ✕ Filtreleri Sıfırla
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
