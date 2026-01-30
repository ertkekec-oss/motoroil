
import React from 'react';

interface Product {
    id: string;
    name: string;
    code: string;
    brand?: string;
    category?: string;
    type?: string;
    stock: number;
    price: number;
    branch?: string;
    status?: 'out' | 'low' | 'normal' | 'ok';
    _restricted?: boolean;
    [key: string]: any;
}

interface InventoryTableProps {
    products: Product[];
    allProducts: Product[];
    isCounting: boolean;
    selectedIds: string[];
    onSelectionChange: (ids: string[]) => void;
    countValues: Record<string, number>;
    onCountChange: (id: string, val: number) => void;
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
        <div className="card glass p-0 overflow-hidden border border-white/10 shadow-2xl relative z-0" style={{ height: 'calc(100vh - 300px)', minHeight: '600px' }}>
            {/* Header Sticky Container */}
            <div className="shrink-0 bg-[#0f172a]/80 backdrop-blur-md border-b border-white/5 px-6 h-12 flex items-center text-[11px] font-bold text-white/50 z-20 uppercase tracking-wider">
                <div className="w-12">
                    <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-white/10 bg-white/5 checked:bg-primary transition-all cursor-pointer opacity-50 hover:opacity-100"
                        onChange={handleHeaderCheckboxChange}
                        checked={selectedIds.length === products.length && products.length > 0}
                    />
                </div>
                <div className="flex-[2] px-4">Ürün Detayı</div>
                <div className="flex-1 px-4">Kategori</div>
                {isCounting ? (
                    <>
                        <div className="w-32 px-4">Sistem Stok</div>
                        <div className="w-48 px-4 text-warning">Sayılan</div>
                    </>
                ) : (
                    <>
                        <div className="flex-1 px-4">Şube Stokları</div>
                        <div className="w-44 px-4 text-right">Fiyat</div>
                        <div className="w-24 px-4 text-right">İşlem</div>
                    </>
                )}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scroll p-4">
                {products.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-30 py-32 space-y-6">
                        <div className="text-6xl grayscale opacity-50">📦</div>
                        <div className="text-center">
                            <h3 className="text-lg font-bold text-white/70">Kayıt Bulunamadı</h3>
                            <p className="text-xs font-medium text-white/40 mt-2">Arama kriterlerinize uygun ürün yok.</p>
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
                                        flex items-center min-h-[64px] px-4 rounded-lg border border-transparent transition-all cursor-pointer group hover:bg-white/[0.03]
                                        ${isSelected ? 'bg-primary/10 border-primary/20' : 'hover:border-white/5'}
                                    `}
                                >
                                    {/* 1. Selection */}
                                    <div className="w-12 shrink-0 flex justify-center" onClick={e => e.stopPropagation()}>
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-white/10 bg-white/5 checked:bg-primary transition-all cursor-pointer opacity-50 hover:opacity-100"
                                            checked={isSelected}
                                            onChange={() => isSelected ? onSelectionChange(selectedIds.filter(id => id !== item.id)) : onSelectionChange([...selectedIds, item.id])}
                                        />
                                    </div>

                                    {/* 2. Main Info */}
                                    <div className="flex-[2] px-4 overflow-hidden">
                                        <div className="font-bold text-[13px] text-white/90 group-hover:text-primary transition-colors truncate mb-0.5">{item.name}</div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-white/50 font-mono tracking-wide">{item.code}</span>
                                            {item.brand && <span className="text-[10px] text-white/40 font-medium">{item.brand}</span>}
                                        </div>
                                    </div>

                                    {/* 3. Category */}
                                    <div className="flex-1 px-4 overflow-hidden">
                                        <div className="text-[12px] font-medium text-white/70 truncate">{item.category || '-'}</div>
                                        {item.type && <div className="text-[9px] text-white/30 truncate mt-0.5">{item.type}</div>}
                                    </div>

                                    {/* 4. Action Specific */}
                                    {isCounting ? (
                                        <>
                                            <div className="w-32 px-4 text-sm font-medium text-white/50">{item.stock}</div>
                                            <div className="w-48 px-4" onClick={e => e.stopPropagation()}>
                                                <input
                                                    type="number" min="0" autoFocus={isSelected}
                                                    value={countValues[item.id] !== undefined ? countValues[item.id] : ''}
                                                    onChange={(e) => onCountChange(item.id, parseInt(e.target.value) || 0)}
                                                    placeholder="0"
                                                    className="w-full bg-[#0f172a] border border-white/10 rounded-lg px-3 py-2 text-white font-bold text-center focus:border-warning/50 focus:bg-warning/5 outline-none transition-all"
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex-1 px-4">
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-1.5 h-1.5 rounded-full ${item.stock <= 0 ? 'bg-red-500' :
                                                            item.stock <= 5 ? 'bg-amber-500' : 'bg-emerald-500'
                                                            }`}></div>
                                                        <span className="text-[12px] font-medium text-white/80">{item.stock} Stok</span>
                                                        <span className="text-[10px] text-white/30 ml-1">{item.branch || 'Merkez'}</span>
                                                    </div>
                                                    {branchStocks.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                                            {branchStocks.map((bs, idx) => (
                                                                <span key={idx} className="text-[9px] bg-white/5 px-1.5 rounded-[3px] text-white/40">
                                                                    {bs.branch}: {bs.stock}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="w-44 px-4 text-right">
                                                {item._restricted ? (
                                                    <span className="text-[10px] text-white/20 italic">Gizli</span>
                                                ) : (
                                                    <div className="flex flex-col items-end">
                                                        <div className="text-white/90 font-bold text-[14px] tabular-nums">{Number(item.price).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</div>
                                                        {item.salesVat > 0 && <div className="text-[9px] text-white/30 tabular-nums">+{item.salesVat}% KDV</div>}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="w-24 px-4 text-right">
                                                <button className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all ml-auto">
                                                    <span className="text-lg leading-none mb-0.5">›</span>
                                                </button>
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
