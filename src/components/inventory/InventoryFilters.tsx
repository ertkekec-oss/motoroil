import { Dispatch, SetStateAction } from 'react';

interface InventoryFiltersProps {
    searchTerm: string;
    setSearchTerm: Dispatch<SetStateAction<string>>;
    filterCategory: string;
    setFilterCategory: Dispatch<SetStateAction<string>>;
    filterBrand: string;
    setFilterBrand: Dispatch<SetStateAction<string>>;
    stockSort: 'none' | 'asc' | 'desc';
    setStockSort: Dispatch<SetStateAction<'none' | 'asc' | 'desc'>>;
    specialFilter: 'none' | 'no-move' | 'top-seller';
    setSpecialFilter: Dispatch<SetStateAction<'none' | 'no-move' | 'top-seller'>>;
    categories: string[];
    brands: string[];
    isFilterOpen: boolean;
    setIsFilterOpen: Dispatch<SetStateAction<boolean>>;
}

export function InventoryFilters({
    searchTerm,
    setSearchTerm,
    filterCategory,
    setFilterCategory,
    filterBrand,
    setFilterBrand,
    stockSort,
    setStockSort,
    specialFilter,
    setSpecialFilter,
    categories,
    brands,
    isFilterOpen,
    setIsFilterOpen
}: InventoryFiltersProps) {
    return (
        <div className="card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm mb-6" style={{ padding: '20px' }}>
            <div className="flex-between mb-4">
                <h3 style={{ fontSize: '16px', fontWeight: '800' }}>🔍 Gelişmiş Filtreler</h3>
                <button
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className="btn btn-ghost"
                    style={{ fontSize: '12px' }}
                >
                    {isFilterOpen ? 'Gizle' : 'Göster'}
                </button>
            </div>

            {isFilterOpen && (
                <div className="grid-cols-5 gap-4 animate-fade-in">
                    <div className="flex-col gap-2">
                        <label className="text-muted" style={{ fontSize: '10px', fontWeight: '800' }}>ARAMA</label>
                        <input
                            type="text"
                            placeholder="Ürün adı veya kod..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                padding: '12px',
                                background: 'var(--bg-deep)',
                                border: '1px solid var(--border-light)',
                                borderRadius: '8px',
                                color: 'white'
                            }}
                        />
                    </div>

                    <div className="flex-col gap-2">
                        <label className="text-muted" style={{ fontSize: '10px', fontWeight: '800' }}>KATEGORİ</label>
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            style={{
                                padding: '12px',
                                background: 'var(--bg-deep)',
                                border: '1px solid var(--border-light)',
                                borderRadius: '8px',
                                color: 'white'
                            }}
                        >
                            <option value="all">Tümü</option>
                            <option value="uncategorized">Kategorisiz</option>
                            {categories.filter(c => c).map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex-col gap-2">
                        <label className="text-muted" style={{ fontSize: '10px', fontWeight: '800' }}>MARKA</label>
                        <select
                            value={filterBrand}
                            onChange={(e) => setFilterBrand(e.target.value)}
                            style={{
                                padding: '12px',
                                background: 'var(--bg-deep)',
                                border: '1px solid var(--border-light)',
                                borderRadius: '8px',
                                color: 'white'
                            }}
                        >
                            <option value="all">Tümü</option>
                            {brands.map(b => (
                                <option key={b} value={b}>{b}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex-col gap-2">
                        <label className="text-muted" style={{ fontSize: '10px', fontWeight: '800' }}>STOK SIRALA</label>
                        <select
                            value={stockSort}
                            onChange={(e) => setStockSort(e.target.value as any)}
                            style={{
                                padding: '12px',
                                background: 'var(--bg-deep)',
                                border: '1px solid var(--border-light)',
                                borderRadius: '8px',
                                color: 'white'
                            }}
                        >
                            <option value="none">Sıralama Yok</option>
                            <option value="asc">Azdan Çoğa</option>
                            <option value="desc">Çoktan Aza</option>
                        </select>
                    </div>

                    <div className="flex-col gap-2">
                        <label className="text-muted" style={{ fontSize: '10px', fontWeight: '800' }}>ÖZEL FİLTRE</label>
                        <select
                            value={specialFilter}
                            onChange={(e) => setSpecialFilter(e.target.value as any)}
                            style={{
                                padding: '12px',
                                background: 'var(--bg-deep)',
                                border: '1px solid var(--border-light)',
                                borderRadius: '8px',
                                color: 'white'
                            }}
                        >
                            <option value="none">Filtre Yok</option>
                            <option value="top-seller">Kritik Stok ({"<"}10)</option>
                            <option value="no-move">Fazla Stok ({">"}100)</option>
                        </select>
                    </div>
                </div>
            )}
        </div>
    );
}
