
import React from 'react';

interface Product {
    id: string | number;
    name: string;
    code: string;
    brand?: string;
    category?: string;
    type?: string;
    stock: number;
    price: number;
    branch?: string;
    unit?: string;
    status?: 'out' | 'low' | 'ok' | 'warning';
    _restricted?: boolean;
    [key: string]: any;
}

interface InventoryTableProps {
    products: Product[];
    allProducts: Product[];
    isCounting: boolean;
    selectedIds: (string | number)[];
    onSelectionChange: (ids: (string | number)[]) => void;
    countValues: Record<string | number, number>;
    onCountChange: (id: string | number, val: number) => void;
    onProductClick: (product: Product) => void;
}

const InventoryTable: React.FC<InventoryTableProps> = ({
    products,
    allProducts,
    isCounting,
    selectedIds,
    onSelectionChange,
    countValues,
    onCountChange,
    onProductClick
}) => {
    const handleHeaderCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            onSelectionChange(products.map(p => p.id));
        } else {
            onSelectionChange([]);
        }
    };

    return (
        <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-sm relative z-0" style={{ height: 'calc(100vh - 300px)', minHeight: '600px' }}>
            {/* Header Sticky Container */}
            <div className="shrink-0 bg-slate-50 dark:bg-[#1e293b] border-b border-slate-200 dark:border-white/10 px-4 h-11 flex items-center text-[11px] font-semibold text-slate-500 dark:text-slate-400 z-20 uppercase tracking-[0.08em] sticky top-0 rounded-t-xl">
                <div className="w-10">
                    <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-slate-300 dark:border-white/20 bg-white dark:bg-white/5 checked:bg-blue-600 transition-all cursor-pointer"
                        onChange={handleHeaderCheckboxChange}
                        checked={selectedIds.length === products.length && products.length > 0}
                    />
                </div>
                <div className="flex-[2] px-3">Ürün Detayı</div>
                <div className="flex-1 px-3">Kategori</div>
                {isCounting ? (
                    <>
                        <div className="w-32 px-3">Sistem Stok</div>
                        <div className="w-48 px-3 text-amber-600 dark:text-amber-500">Sayılan</div>
                    </>
                ) : (
                    <>
                        <div className="flex-1 px-3">Şube Stokları</div>
                        <div className="w-40 px-3 text-right">Fiyat</div>
                        <div className="w-20 px-3 text-right">İşlem</div>
                    </>
                )}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scroll mt-2">
                {products.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-40 py-24 space-y-4">
                        <div className="text-4xl text-slate-400">📦</div>
                        <div className="text-center">
                            <h3 className="text-[14px] font-semibold text-slate-700 dark:text-slate-300">Kayıt Bulunamadı</h3>
                            <p className="text-[13px] text-slate-500 mt-1">Arama kriterlerinize uygun ürün yok.</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {products.map((item) => {
                            const isSelected = selectedIds.includes(item.id);
                            const branchStocks = allProducts
                                .filter((p) => p.code === item.code && p.id !== item.id)
                                .map((p) => ({ branch: p.branch || 'Merkez', stock: p.stock }));

                            return (
                                <div
                                    key={item.id}
                                    onClick={() => onProductClick(item)}
                                    className={`
                                        flex items-center min-h-[52px] px-4 border-b border-slate-100 dark:border-white/5 transition-colors cursor-pointer group hover:bg-slate-50/50 dark:hover:bg-white/5
                                        ${isSelected ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}
                                    `}
                                >
                                    {/* 1. Selection */}
                                    <div className="w-10 shrink-0 flex items-center" onClick={e => e.stopPropagation()}>
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-slate-300 dark:border-white/20 bg-white dark:bg-white/5 checked:bg-blue-600 transition-all cursor-pointer"
                                            checked={isSelected}
                                            onChange={() => isSelected ? onSelectionChange(selectedIds.filter(id => id !== item.id)) : onSelectionChange([...selectedIds, item.id])}
                                        />
                                    </div>

                                    {/* 2. Main Info */}
                                    <div className="flex-[2] px-3 overflow-hidden">
                                        <div className="font-medium text-[14px] text-slate-900 dark:text-slate-100 truncate">{item.name}</div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{item.code}</span>
                                            {item.brand && <span className="text-[11px] text-slate-400 dark:text-slate-500">• {item.brand}</span>}
                                        </div>
                                    </div>

                                    {/* 3. Category */}
                                    <div className="flex-1 px-3 overflow-hidden">
                                        <div className="text-[13px] text-slate-700 dark:text-slate-300 truncate">{item.category || '-'}</div>
                                        {item.type && <div className="text-[11px] text-slate-500 dark:text-slate-500 truncate">{item.type}</div>}
                                    </div>

                                    {/* 4. Action Specific */}
                                    {isCounting ? (
                                        <>
                                            <div className="w-32 px-3 flex flex-col justify-center">
                                                <div className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold mb-0.5">Sistem</div>
                                                <div className="text-[14px] font-medium text-slate-700 dark:text-slate-300 tabular-nums">{item.stock} <span className="text-[11px] text-slate-400">{item.unit || 'Adet'}</span></div>
                                            </div>
                                            <div className="w-64 px-3" onClick={e => e.stopPropagation()}>
                                                <div className="relative group/input">
                                                    <input
                                                        type="number" min="0" autoFocus={isSelected}
                                                        value={countValues[item.id] !== undefined ? countValues[item.id] : ''}
                                                        onChange={(e) => onCountChange(item.id, parseInt(e.target.value) || 0)}
                                                        placeholder="Miktar"
                                                        className={`
                                                            w-full bg-white dark:bg-[#0f172a] border rounded-lg px-3 py-2 text-slate-900 dark:text-white font-medium text-[14px] outline-none transition-colors
                                                            ${countValues[item.id] !== undefined ? 'border-amber-400 focus:border-amber-500 dark:border-amber-500/50' : 'border-slate-300 dark:border-white/20 focus:border-blue-500'}
                                                        `}
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex-1 px-3">
                                                <div className="flex items-center gap-1.5">
                                                    <div className={`w-2 h-2 rounded-full ${item.stock <= 0 ? 'bg-red-500' :
                                                        item.stock <= (item.minStock || 5) ? 'bg-amber-500' : 'bg-emerald-500'
                                                        }`}></div>
                                                    <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300 tabular-nums">{item.stock} <span className="text-slate-400 text-[11px]">{item.unit || 'Adet'}</span></span>
                                                    <span className="text-[11px] text-slate-400 dark:text-slate-500 ml-1 truncate max-w-[80px]">{item.branch || 'Merkez'}</span>
                                                </div>
                                            </div>
                                            <div className="w-40 px-3 text-right">
                                                {item._restricted ? (
                                                    <span className="text-[11px] text-slate-400 italic">Gizli</span>
                                                ) : (
                                                    <div className="flex flex-col items-end">
                                                        <div className="text-slate-900 dark:text-slate-100 font-medium text-[14px] tabular-nums">
                                                            {Number(item.price).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                                            <span className="ml-1 text-[11px] text-slate-500">
                                                                {item.currency === 'USD' ? '$' : item.currency === 'EUR' ? '€' : item.currency === 'GBP' ? '£' : '₺'}
                                                            </span>
                                                        </div>
                                                        {item.salesVat > 0 && <div className="text-[10px] text-slate-400 dark:text-slate-500 tabular-nums">+{item.salesVat}% KDV</div>}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="w-20 px-3 text-right">
                                                <div className="w-8 h-8 rounded-lg bg-transparent hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center text-slate-400 group-hover:text-blue-600 dark:text-slate-500 dark:group-hover:text-blue-400 transition-colors ml-auto">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default InventoryTable;
