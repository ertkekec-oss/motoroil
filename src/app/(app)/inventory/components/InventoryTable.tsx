
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
        <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm relative z-0 flex flex-col" style={{ height: 'calc(100vh - 280px)', minHeight: '500px' }}>
            {selectedIds.length > 0 && !isCounting && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-900 px-4 py-2 rounded-xl shadow-xl flex items-center gap-4 z-50 animate-in slide-in-from-top-2 text-white">
                    <span className="text-xs font-bold">{selectedIds.length} ürün seçildi</span>
                    <div className="flex items-center gap-2 border-l border-slate-700 pl-4">
                        <button className="px-3 py-1.5 hover:bg-slate-800 rounded-lg text-xs font-semibold transition-colors">Toplu Fiyat Güncelle</button>
                        <button className="px-3 py-1.5 hover:bg-slate-800 rounded-lg text-xs font-semibold transition-colors">Toplu Transfer</button>
                        <button onClick={onPublishB2B} className="px-3 py-1.5 hover:bg-slate-800 rounded-lg text-xs font-semibold transition-colors text-blue-400">B2B Ağına Gönder</button>
                        <button className="px-3 py-1.5 hover:bg-slate-800 rounded-lg text-xs font-semibold transition-colors text-rose-400">Pasife Al</button>
                    </div>
                </div>
            )}

            <div className="shrink-0 bg-slate-50 dark:bg-[#1e293b] border-b border-slate-200 dark:border-white/5 px-4 h-12 flex items-center text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest sticky top-0 rounded-t-2xl z-20">
                <div className="w-10">
                    <input type="checkbox" className="w-4 h-4 accent-blue-600 rounded border-slate-300 dark:border-white/10 cursor-pointer"
                        onChange={handleHeaderCheckboxChange}
                        checked={selectedIds.length === products.length && products.length > 0}
                    />
                </div>
                <div className="flex-[2] px-3">Ürün</div>
                <div className="flex-1 px-3">Kategori</div>
                {isCounting ? (
                    <>
                        <div className="w-32 px-3">Sistem Stok</div>
                        <div className="w-48 px-3 text-amber-600">Sayılan</div>
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
                        <div className="text-4xl text-slate-400">📦</div>
                        <div className="text-center">
                            <h3 className="text-[14px] font-semibold text-slate-700 dark:text-slate-300">Kayıt Bulunamadı</h3>
                            <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">Arama kriterlerinize uygun ürün yok.</p>
                        </div>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {products.map((item) => {
                            const isSelected = selectedIds.includes(item.id);

                            // Mock calculation for UI purpose based on prompt
                            const statusType = item.stock <= (item.minStock || 5) ? 'Kritik' : item.stock < 20 ? 'Risk' : 'Stabil';
                            const statusColor = statusType === 'Kritik' ? 'bg-rose-500' : statusType === 'Risk' ? 'bg-amber-500' : 'bg-emerald-500';

                            return (
                                <div
                                    key={item.id}
                                    onClick={() => onProductClick(item)}
                                    className={`
                                        flex items-center min-h-[48px] px-4 hover:bg-slate-50 transition-colors cursor-pointer group
                                        ${isSelected ? 'bg-blue-50/30' : ''}
                                    `}
                                >
                                    <div className="w-10 shrink-0 flex items-center" onClick={e => e.stopPropagation()}>
                                        <input type="checkbox" className="w-4 h-4 accent-blue-600 rounded border-slate-300 dark:border-white/10 cursor-pointer"
                                            checked={isSelected}
                                            onChange={() => isSelected ? onSelectionChange(selectedIds.filter(id => id !== item.id)) : onSelectionChange([...selectedIds, item.id])}
                                        />
                                    </div>

                                    <div className="flex-[2] px-3 overflow-hidden">
                                        <div className="font-bold text-[13px] text-slate-900 dark:text-white truncate">{item.name}</div>
                                        <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">{item.code} {item.brand && `• ${item.brand}`}</div>
                                    </div>

                                    <div className="flex-1 px-3 overflow-hidden">
                                        <div className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 truncate">{item.category || '-'}</div>
                                    </div>

                                    {isCounting ? (
                                        <>
                                            <div className="w-32 px-3 flex flex-col justify-center">
                                                <div className="text-[13px] font-bold text-slate-700 dark:text-slate-300 tabular-nums">{item.stock} <span className="text-[10px] text-slate-500 dark:text-slate-400">{item.unit || 'Adet'}</span></div>
                                            </div>
                                            <div className="w-48 px-3" onClick={e => e.stopPropagation()}>
                                                <input
                                                    type="number" min="0" autoFocus={isSelected}
                                                    value={countValues[item.id] !== undefined ? countValues[item.id] : ''}
                                                    onChange={(e) => onCountChange(item.id, parseInt(e.target.value) || 0)}
                                                    placeholder="Miktar"
                                                    className={`w-full bg-white border rounded-lg px-3 py-1.5 text-slate-900 font-bold text-[13px] outline-none transition-colors border-slate-300 focus:border-blue-500`}
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex-1 px-3 text-right">
                                                <span className="text-[12px] font-semibold text-slate-600 dark:text-slate-400">{item.branch || 'Mrkz:'} <span className="text-slate-900 dark:text-white">{Math.floor((item.stock || 0) * 0.4)}</span></span>
                                            </div>
                                            <div className="flex-1 px-3 text-right flex flex-col">
                                                <span className="text-[13px] font-bold text-blue-600 tabular-nums">{item.stock} <span className="text-blue-400 text-[10px]">{item.unit || 'Adet'}</span></span>
                                                <span className="text-[10px] text-slate-400">₺{Number(item.price).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span>
                                            </div>
                                            <div className="w-24 px-3 text-right">
                                                <span className="text-[12px] font-bold text-blue-600">42 Gün</span>
                                            </div>
                                            <div className="w-24 px-3 text-right">
                                                <span className="text-[12px] font-bold text-emerald-600">%{(Number(item.id) % 20) + 12}</span>
                                            </div>
                                            <div className="w-24 px-3 flex justify-center">
                                                <div className="flex items-center gap-1.5">
                                                    <div className={`w-2 h-2 rounded-full ${statusColor}`}></div>
                                                </div>
                                            </div>
                                            <div className="w-16 px-3 flex justify-end">
                                                <div className="w-6 h-6 rounded-md hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-colors">
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
