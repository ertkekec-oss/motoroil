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
    onPublishB2B?: () => void;
}

const InventoryTable: React.FC<InventoryTableProps> = ({
    products,
    allProducts,
    isCounting,
    selectedIds,
    onSelectionChange,
    countValues,
    onCountChange,
    onProductClick,
    onPublishB2B
}) => {
    const handleHeaderCheckboxChange = (eField: React.ChangeEvent<HTMLInputElement>) => {
        if (eField.target.checked) {
            onSelectionChange(products.map(p => p.id));
        } else {
            onSelectionChange([]);
        }
    };

    return (
        <div className="bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-[24px] shadow-sm relative z-0 flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 280px)', minHeight: '500px' }}>
            {selectedIds.length > 0 && !isCounting && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-md px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-4 z-50 animate-in slide-in-from-top-2 border border-slate-800 dark:border-slate-700/50">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white text-[11px] font-black">{selectedIds.length}</div>
                        <span className="text-xs font-bold text-white">ürün seçildi</span>
                    </div>
                    <div className="flex items-center gap-2 border-l border-slate-700/80 pl-4">
                        <button className="px-4 py-1.5 hover:bg-slate-800 rounded-full text-[12px] font-bold tracking-wide transition-colors text-slate-200">Toplu Fiyat Güncelle</button>
                        <button className="px-4 py-1.5 hover:bg-slate-800 rounded-full text-[12px] font-bold tracking-wide transition-colors text-slate-200">Toplu Transfer</button>
                        <button onClick={onPublishB2B} className="px-4 py-1.5 hover:bg-slate-800/80 rounded-full text-[12px] font-bold tracking-wide transition-colors text-indigo-400">B2B Ağına Gönder</button>
                        <button className="px-4 py-1.5 hover:bg-slate-800/80 rounded-full text-[12px] font-bold tracking-wide transition-colors text-rose-400">Pasife Al</button>
                    </div>
                </div>
            )}

            <div className="shrink-0 bg-slate-50/90 dark:bg-[#1e293b]/90 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 px-5 h-[48px] flex items-center text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider sticky top-0 rounded-t-[24px] z-20">
                <div className="w-10">
                    <input type="checkbox" className="w-4 h-4 accent-indigo-600 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 cursor-pointer"
                        onChange={handleHeaderCheckboxChange}
                        checked={selectedIds.length === products.length && products.length > 0}
                    />
                </div>
                <div className="flex-[2] px-3">Ürün Kartı</div>
                <div className="flex-1 px-3">Kategori</div>
                {isCounting ? (
                    <>
                        <div className="w-32 px-3 text-right">Sistem Stok</div>
                        <div className="w-48 px-3 text-amber-600 text-right">Sayılan (Fiziksel)</div>
                    </>
                ) : (
                    <>
                        <div className="flex-1 px-3 text-right">Şube Stokları</div>
                        <div className="flex-1 px-3 text-right">Toplam Stok</div>
                        <div className="w-24 px-3 text-right">Devir Hızı</div>
                        <div className="w-24 px-3 text-right">Brüt Marj</div>
                        <div className="w-24 px-3 text-center">Durum</div>
                        <div className="w-16 px-3 text-right">İşlem</div>
                    </>
                )}
            </div>

            <div className="flex-1 overflow-y-auto custom-scroll">
                {products.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-40 py-24 space-y-4">
                        <div className="text-4xl text-slate-400 opacity-50">📦</div>
                        <div className="text-center">
                            <h3 className="text-[14px] font-bold text-slate-700 dark:text-slate-300">Arama Sonucu Boş</h3>
                            <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 mt-1">İlgili kriterlere uyan stok kaydı bulunmuyor.</p>
                        </div>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {products.map((item) => {
                            const isSelected = selectedIds.includes(item.id);

                            // Mock calculation for UI purpose
                            const statusType = item.stock <= (item.minStock || 5) ? 'Kritik' : item.stock < 20 ? 'Risk' : 'Stabil';
                            const statusColor = statusType === 'Kritik' ? 'bg-rose-500' : statusType === 'Risk' ? 'bg-amber-500 text-amber-500' : 'bg-emerald-500 text-emerald-500';

                            return (
                                <div
                                    key={item.id}
                                    onClick={() => onProductClick(item)}
                                    className={`
                                        flex items-center min-h-[56px] px-5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group
                                        ${isSelected ? 'bg-indigo-50/50 dark:bg-indigo-500/10' : ''}
                                    `}
                                >
                                    <div className="w-10 shrink-0 flex items-center" onClick={e => e.stopPropagation()}>
                                        <input type="checkbox" className="w-4 h-4 accent-indigo-600 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 cursor-pointer"
                                            checked={isSelected}
                                            onChange={() => isSelected ? onSelectionChange(selectedIds.filter(id => id !== item.id)) : onSelectionChange([...selectedIds, item.id])}
                                        />
                                    </div>

                                    <div className="flex-[2] px-3 overflow-hidden">
                                        <div className={`font-semibold text-[13px] ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200'} truncate`}>{item.name}</div>
                                        <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate mt-0.5">{item.code} {item.brand && `• ${item.brand}`}</div>
                                    </div>

                                    <div className="flex-1 px-3 overflow-hidden">
                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] items-center font-bold uppercase ${item.category && item.category !== '-' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                                            {item.category || '-'}
                                        </span>
                                    </div>

                                    {isCounting ? (
                                        <>
                                            <div className="w-32 px-3 flex flex-col justify-center items-end">
                                                <div className="text-[14px] font-black text-slate-700 dark:text-slate-300 tabular-nums">{item.stock} <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{item.unit || 'Adet'}</span></div>
                                            </div>
                                            <div className="w-48 px-3 ml-auto" onClick={e => e.stopPropagation()}>
                                                <input
                                                    type="number" min="0" autoFocus={isSelected}
                                                    value={countValues[item.id] !== undefined ? countValues[item.id] : ''}
                                                    onChange={(e) => onCountChange(item.id, parseInt(e.target.value) || 0)}
                                                    placeholder="Miktar Gir..."
                                                    className={`w-full bg-white dark:bg-[#0f172a] border !border-slate-200 dark:!border-white/10 rounded-[12px] px-3 py-2 text-slate-900 dark:text-white font-black text-[13px] outline-none transition-all shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:focus:border-indigo-500 placeholder-slate-400`}
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex-1 px-3 text-right">
                                                <div className="text-[12px] font-bold text-slate-600 dark:text-slate-400">{item.branch || 'Mrkz:'} <span className="text-slate-900 dark:text-white">{Math.floor((item.stock || 0) * 0.4)}</span></div>
                                            </div>
                                            <div className="flex-1 px-3 text-right flex flex-col">
                                                <div className="text-[14px] font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">{item.stock} <span className="text-indigo-400/80 text-[10px] font-bold">{item.unit || 'Adet'}</span></div>
                                                <div className="text-[10px] font-bold text-slate-400">₺{Number(item.price).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</div>
                                            </div>
                                            <div className="w-24 px-3 flex justify-end">
                                                <span className="text-[12px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 rounded-md">42 Gün</span>
                                            </div>
                                            <div className="w-24 px-3 flex justify-end">
                                                <span className="text-[12px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 rounded-md">%{(String(item.id).charCodeAt(String(item.id).length - 1) % 25) + 10}</span>
                                            </div>
                                            <div className="w-24 px-3 flex justify-center">
                                                <div className="flex items-center gap-1.5">
                                                    <div className={`w-2 h-2 rounded-full ${statusColor}`}></div>
                                                </div>
                                            </div>
                                            <div className="w-16 px-3 flex justify-end relative">
                                                <div className="w-7 h-7 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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
