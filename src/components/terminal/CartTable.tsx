import React from 'react';
import { ShoppingCart, Minus, Plus, X } from 'lucide-react';

export default function CartTable({ cart, setCart, getPrice }: { cart: any[], setCart: any, getPrice: (p: any) => number }) {

    if (cart.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center opacity-40 py-20">
                <ShoppingCart size={80} className="mb-6 text-slate-300 dark:text-slate-600" />
                <span className="text-xl font-bold tracking-tight text-slate-500 dark:text-slate-400">Sepet Boş</span>
                <span className="text-sm mt-2 text-slate-400 dark:text-slate-500">Ürün okutarak veya arayarak ekleyin</span>
            </div>
        );
    }

    return (
        <div className="w-full overflow-x-auto overflow-y-auto max-h-[calc(100vh-250px)] relative bg-[#FFFFFF] dark:bg-[#0B1220] rounded-2xl border border-[#D0D5DD] dark:border-white/5 shadow-[0_1px_2px_rgba(16,24,40,0.06)]">
            <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-[#F8FAFC] dark:bg-slate-900 border-b border-[#D0D5DD] dark:border-white/10 z-10">
                    <tr>
                        <th className="py-3 px-4 text-xs font-bold text-[#4B5563] dark:text-slate-400 uppercase tracking-widest w-[40%]">Ürün</th>
                        <th className="py-3 px-4 text-xs font-bold text-[#4B5563] dark:text-slate-400 uppercase tracking-widest w-[15%] text-center">Birim Fiyat</th>
                        <th className="py-3 px-4 text-xs font-bold text-[#4B5563] dark:text-slate-400 uppercase tracking-widest w-[20%] text-center">Adet</th>
                        <th className="py-3 px-4 text-xs font-bold text-[#4B5563] dark:text-slate-400 uppercase tracking-widest w-[15%] text-right">Ara Toplam</th>
                        <th className="py-3 px-4 text-xs font-bold text-[#4B5563] dark:text-slate-400 uppercase tracking-widest w-[10%] text-center">Sil</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E9F0] dark:divide-white/5">
                    {cart?.map((item, idx) => (
                        <tr key={idx} className="hover:bg-[#EEF2F7] dark:hover:bg-white/5 transition-colors group">
                            <td className="py-4 px-4 min-w-[200px]">
                                <div className="font-bold text-sm text-[#111827] dark:text-white truncate max-w-[300px]">{item.name}</div>
                                <div className="text-[10px] text-[#9CA3AF] opacity-80 mt-0.5">{item.barcode || item.code}</div>
                            </td>
                            <td className="py-4 px-4 text-center">
                                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                                    ₺{Number(getPrice(item)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </td>
                            <td className="py-4 px-4">
                                <div className="flex items-center justify-center gap-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 w-fit mx-auto border border-slate-200 dark:border-white/5">
                                    <button
                                        onClick={() => setCart((c: any) => c?.map((x: any, i: number) => i === idx ? { ...x, qty: Math.max(1, x.qty - 1) } : x))}
                                        className="w-8 h-8 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center justify-center shadow-sm text-slate-600 dark:text-slate-300"
                                    >
                                        <Minus size={16} strokeWidth={2.5} />
                                    </button>
                                    <span className="w-8 flex items-center justify-center font-bold text-sm text-slate-900 dark:text-white select-none">
                                        {item.qty}
                                    </span>
                                    <button
                                        onClick={() => setCart((c: any) => c?.map((x: any, i: number) => i === idx ? { ...x, qty: x.qty + 1 } : x))}
                                        className="w-8 h-8 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center justify-center shadow-sm text-slate-600 dark:text-slate-300"
                                    >
                                        <Plus size={16} strokeWidth={2.5} />
                                    </button>
                                </div>
                            </td>
                            <td className="py-4 px-4 text-right">
                                <span className="font-black text-[#DC2626] dark:text-rose-400 text-lg tracking-tight">
                                    ₺{(Number(getPrice(item)) * item.qty).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </td>
                            <td className="py-4 px-4 text-center">
                                <button
                                    onClick={() => setCart((c: any) => c.filter((_: any, i: number) => i !== idx))}
                                    className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 w-10 h-10 rounded-xl flex items-center justify-center transition-all mx-auto"
                                >
                                    <X size={20} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
