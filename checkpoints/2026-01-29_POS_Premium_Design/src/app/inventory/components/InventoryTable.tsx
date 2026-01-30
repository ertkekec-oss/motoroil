
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
        <div className={`glass rounded-[32px] overflow-hidden border border-white/10 flex flex-col shadow-2xl relative z-0 ${isCounting ? 'ring-2 ring-warning/50' : ''}`} style={{ height: 'calc(100vh - 250px)', minHeight: '600px' }}>
            {/* Header Sticky Container */}
            <div className="shrink-0 bg-white/5 backdrop-blur-md border-b border-white/10 px-6 h-14 flex items-center text-[11px] font-black uppercase tracking-[2px] text-white/50 z-20">
                <div className="w-12">
                    <input
                        type="checkbox"
                        className="w-5 h-5 rounded-lg border-white/10 bg-white/5 checked:bg-primary transition-all cursor-pointer"
                        onChange={handleHeaderCheckboxChange}
                        checked={selectedIds.length === products.length && products.length > 0}
                    />
                </div>
                <div className="flex-[2] px-4">Ürün Bilgisi</div>
                <div className="flex-1 px-4">Kategori & Tip</div>
                {isCounting ? (
                    <>
                        <div className="w-32 px-4">Sistem</div>
                        <div className="w-48 px-4 text-warning">🔍 Sayılan</div>
                    </>
                ) : (
                    <>
                        <div className="flex-1 px-4">Depo Dağılımı</div>
                        <div className="w-44 px-4 text-right">Fiyatlandırma</div>
                        <div className="w-24 px-4 text-right">Yönet</div>
                    </>
                )}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scroll px-4 pb-8">
                {products.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-30 py-32 space-y-6">
                        <div className="text-8xl animate-bounce">📦</div>
                        <div className="text-center">
                            <h3 className="text-2xl font-black">Stok Bulunmuyor</h3>
                            <p className="text-sm font-medium">Filtreleri değiştirerek tekrar deneyin.</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2 mt-4">
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
                                        flex items-center min-h-[90px] px-4 rounded-[24px] border border-white/0 transition-all cursor-pointer group hover:bg-white/[0.04]
                                        ${isSelected ? 'bg-primary/10 border-primary/20 scale-[1.005] z-10' : 'hover:scale-[1.002]'}
                                    `}
                                >
                                    {/* 1. Selection */}
                                    <div className="w-12 shrink-0 flex justify-center" onClick={e => e.stopPropagation()}>
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 rounded-lg border-white/10 bg-white/5 checked:bg-primary transition-all cursor-pointer"
                                            checked={isSelected}
                                            onChange={() => isSelected ? onSelectionChange(selectedIds.filter(id => id !== item.id)) : onSelectionChange([...selectedIds, item.id])}
                                        />
                                    </div>

                                    {/* 2. Main Info */}
                                    <div className="flex-[2] px-4 overflow-hidden">
                                        <div className="font-black text-[15px] text-white group-hover:text-primary transition-colors truncate mb-1.5">{item.name}</div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-black bg-white/5 border border-white/5 px-2 py-0.5 rounded-md text-white/50 uppercase tracking-wider">{item.code}</span>
                                            {item.brand && <span className="text-[10px] text-primary/70 font-black uppercase tracking-[1px]">{item.brand}</span>}
                                        </div>
                                    </div>

                                    {/* 3. Category */}
                                    <div className="flex-1 px-4 overflow-hidden">
                                        <div className="text-[11px] font-black text-white/80 truncate mb-1 uppercase tracking-tight">{item.category || 'DİĞER'}</div>
                                        <div className="text-[10px] text-white/30 font-bold uppercase truncate">{item.type || 'HİZMET'}</div>
                                    </div>

                                    {/* 4. Action Specific */}
                                    {isCounting ? (
                                        <>
                                            <div className="w-32 px-4 font-black text-white/40 text-sm tracking-tighter">{item.stock} ADET</div>
                                            <div className="w-48 px-4" onClick={e => e.stopPropagation()}>
                                                <div className="relative">
                                                    <input
                                                        type="number" min="0" autoFocus={isSelected}
                                                        value={countValues[item.id] !== undefined ? countValues[item.id] : ''}
                                                        onChange={(e) => onCountChange(item.id, parseInt(e.target.value) || 0)}
                                                        placeholder="0"
                                                        className="w-full bg-black/60 border-2 border-warning/20 rounded-2xl px-4 py-3 text-white font-black text-center focus:border-warning outline-none transition-all text-lg shadow-xl"
                                                    />
                                                    <div className="absolute -top-2 -right-2 w-5 h-5 bg-warning rounded-full flex items-center justify-center text-[10px] font-black text-black">!</div>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex-1 px-4">
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-center gap-3">
                                                        <span className={`badge ${item.stock <= 0 ? 'badge-danger' :
                                                            item.stock <= 5 ? 'badge-warning' : 'badge-success'
                                                            }`}>
                                                            {item.stock} STOK
                                                        </span>
                                                        <span className="text-[10px] text-white/20 font-black tracking-widest">{item.branch || 'MERKEZ'}</span>
                                                    </div>
                                                    {branchStocks.length > 0 && (
                                                        <div className="flex flex-wrap gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                                            {branchStocks.map((bs, idx) => (
                                                                <span key={idx} className="text-[9px] font-black uppercase bg-white/5 border border-white/5 px-2 py-0.5 rounded-[4px] text-white/30">
                                                                    {bs.branch}: {bs.stock}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="w-44 px-4 text-right">
                                                {item._restricted ? (
                                                    <span className="text-[10px] font-black text-white/5 tracking-[3px] uppercase italic">Gizli Veri</span>
                                                ) : (
                                                    <div className="space-y-1">
                                                        <div className="text-white font-black text-lg tracking-tighter">{Number(item.price).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</div>
                                                        <div className="text-[9px] text-white/20 font-black tracking-[1.5px] uppercase">KDV Dahil</div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="w-24 px-4 text-right">
                                                <button className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary/50 transition-all group-hover:shadow-glow active:scale-90">
                                                    <span className="text-xl">➔</span>
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
