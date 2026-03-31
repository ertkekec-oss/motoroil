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
    };

    return (
        <div className="relative flex gap-3 items-center z-20">
            {/* SEARCH BAR */}
            <div className="relative group w-[240px]">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </span>
                <input
                    type="text"
                    placeholder="Envanterde Ara..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full h-[46px] bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 pl-11 pr-4 rounded-full text-slate-900 dark:text-white text-[13px] font-bold placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm"
                />
            </div>

            {/* FILTER BUTTON */}
            <div className="relative">
                <button
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className={`
                        flex items-center gap-2 px-6 h-[46px] rounded-full text-[12px] font-black uppercase tracking-widest transition-all shadow-sm border border-slate-200 dark:border-slate-800
                        ${isFilterOpen
                            ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
                            : 'bg-white dark:bg-[#0f172a] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        }
                    `}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    <span>Filtre</span>
                </button>

                {/* DROPDOWN MENU */}
                {isFilterOpen && (
                    <div className="absolute top-[52px] right-0 w-[400px] bg-white dark:bg-[#0f172a] rounded-[24px] p-6 z-[1000] shadow-2xl border border-slate-200 dark:border-slate-800 animate-in slide-in-from-top-2">
                        <div className="flex flex-col gap-6">
                            {/* Category Select */}
                            <div className="flex flex-col gap-2">
                                <label className="text-slate-500 dark:text-slate-400 text-[11px] font-black uppercase tracking-widest px-1">Kategori</label>
                                <div className="relative">
                                    <select
                                        className="w-full bg-slate-50 dark:bg-slate-900 px-4 py-3.5 pr-10 rounded-[14px] border border-slate-200 dark:border-slate-700 text-[13px] font-bold text-slate-900 dark:text-white outline-none appearance-none cursor-pointer focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors shadow-inner"
                                        value={filterCategory}
                                        onChange={e => { setFilterCategory(e.target.value); setIsFilterOpen(false); }}
                                    >
                                        <option value="all">Tüm Kategoriler</option>
                                        <option value="uncategorized">Kategorisiz Ürünler</option>
                                        {categories.filter(c => c).map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Brand Select */}
                            <div className="flex flex-col gap-2">
                                <label className="text-slate-500 dark:text-slate-400 text-[11px] font-black uppercase tracking-widest px-1">Marka</label>
                                <div className="relative">
                                    <select
                                        className="w-full bg-slate-50 dark:bg-slate-900 px-4 py-3.5 pr-10 rounded-[14px] border border-slate-200 dark:border-slate-700 text-[13px] font-bold text-slate-900 dark:text-white outline-none appearance-none cursor-pointer focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors shadow-inner"
                                        value={filterBrand}
                                        onChange={e => { setFilterBrand(e.target.value); setIsFilterOpen(false); }}
                                    >
                                        <option value="all">Tüm Markalar</option>
                                        {brands.filter(b => b && b !== 'Belirtilmemiş').map(b => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Stock Sort Buttons */}
                            <div className="flex flex-col gap-2">
                                <label className="text-slate-500 dark:text-slate-400 text-[11px] font-black uppercase tracking-widest px-1">Sıralama</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { id: 'asc', label: 'Azdan Çoğa' },
                                        { id: 'desc', label: 'Çoktan Aza' }
                                    ].map(opt => (
                                        <button
                                            key={opt.id}
                                            onClick={() => { setStockSort(opt.id as any); setIsFilterOpen(false); }}
                                            className={`
                                                py-3 rounded-[12px] text-[12px] font-black uppercase tracking-wide transition-all border shadow-sm
                                                ${stockSort === opt.id
                                                    ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30'
                                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
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
                                <label className="text-slate-500 dark:text-slate-400 text-[11px] font-black uppercase tracking-widest px-1">Akıllı Filtre</label>
                                <div className="relative">
                                    <select
                                        className="w-full bg-slate-50 dark:bg-slate-900 px-4 py-3.5 pr-10 rounded-[14px] border border-slate-200 dark:border-slate-700 text-[13px] font-bold text-slate-900 dark:text-white outline-none appearance-none cursor-pointer focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors shadow-inner"
                                        value={specialFilter}
                                        onChange={e => { setSpecialFilter(e.target.value as any); setIsFilterOpen(false); }}
                                    >
                                        <option value="none">Seçiniz...</option>
                                        <option value="critical-stock">Kritik Stoktakiler</option>
                                        <option value="top-seller">En Çok Satanlar</option>
                                        <option value="no-move">Hareket Görmeyenler</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleReset}
                                className="w-full py-3.5 rounded-[12px] border-2 border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-red-500 dark:hover:text-red-400 transition-colors text-[12px] font-black uppercase tracking-widest mt-2"
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
