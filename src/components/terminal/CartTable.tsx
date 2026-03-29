import React from 'react';
import { ShoppingCart, Minus, Plus, X } from 'lucide-react';

export default function CartTable({ cart, setCart, getPrice }: { cart: any[], setCart: any, getPrice: (p: any) => number }) {

    if (cart.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center opacity-40 py-20">
                <ShoppingCart size={80} className="mb-6 text-text-muted dark:text-slate-600" />
                <span className="text-xl font-bold tracking-tight text-text-secondary dark:text-slate-400">Sepet Boş</span>
                <span className="text-sm mt-2 text-text-muted dark:text-slate-500">Ürün okutarak veya arayarak ekleyin</span>
            </div>
        );
    }

    return (
        <div className="w-full overflow-x-auto overflow-y-auto max-h-[calc(100vh-250px)] relative bg-surface dark:bg-[#0B1220] rounded-2xl border border-default dark:border-white/5 shadow-enterprise">
            <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-surface-secondary dark:bg-slate-900 border-b border-default dark:border-white/10 z-10">
                    <tr>
                        <th className="py-3 px-4 text-xs font-bold text-text-secondary dark:text-slate-400 uppercase tracking-widest w-[40%]">Ürün</th>
                        <th className="py-3 px-4 text-xs font-bold text-text-secondary dark:text-slate-400 uppercase tracking-widest w-[15%] text-center">Birim Fiyat</th>
                        <th className="py-3 px-4 text-xs font-bold text-text-secondary dark:text-slate-400 uppercase tracking-widest w-[20%] text-center">Adet</th>
                        <th className="py-3 px-4 text-xs font-bold text-text-secondary dark:text-slate-400 uppercase tracking-widest w-[15%] text-right">Ara Toplam</th>
                        <th className="py-3 px-4 text-xs font-bold text-text-secondary dark:text-slate-400 uppercase tracking-widest w-[10%] text-center">Sil</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border-divider dark:divide-white/5">
                    {cart?.map((item, idx) => (
                        <tr key={idx} className="hover:bg-surface-tertiary dark:hover:bg-white/5 transition-colors group">
                            <td className="py-4 px-4 min-w-[200px]">
                                <div className="font-bold text-sm text-text-primary dark:text-white truncate max-w-[300px]">{item.name}</div>
                                <div className="text-[10px] text-text-muted opacity-80 mt-0.5">{item.barcode || item.code}</div>
                            </td>
                            <td className="py-4 px-4 text-center">
                                <span className="text-sm font-semibold text-text-secondary dark:text-slate-300">
                                    ₺{Number(getPrice(item)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </td>
                            <td className="py-4 px-4">
                                <div className="flex items-center justify-center gap-1.5 bg-surface-tertiary dark:bg-slate-800 rounded-xl p-1 w-fit mx-auto border border-default dark:border-white/5">
                                    <button
                                        onClick={() => setCart((c: any) => c?.map((x: any, i: number) => i === idx ? { ...x, qty: Math.max(1, x.qty - 1) } : x))}
                                        className="w-8 h-8 hover:bg-surface dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center justify-center shadow-sm text-text-secondary dark:text-slate-300"
                                    >
                                        <Minus size={16} strokeWidth={2.5} />
                                    </button>
                                    <span className="w-8 flex items-center justify-center font-bold text-sm text-text-primary dark:text-white select-none">
                                        {item.qty}
                                    </span>
                                    <button
                                        onClick={() => setCart((c: any) => c?.map((x: any, i: number) => i === idx ? { ...x, qty: x.qty + 1 } : x))}
                                        className="w-8 h-8 hover:bg-surface dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center justify-center shadow-sm text-text-secondary dark:text-slate-300"
                                    >
                                        <Plus size={16} strokeWidth={2.5} />
                                    </button>
                                </div>
                            </td>
                            <td className="py-4 px-4 text-right">
                                <span className="font-black text-state-alert-text dark:text-rose-400 text-lg tracking-tight">
                                    ₺{(Number(getPrice(item)) * item.qty).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </td>
                            <td className="py-4 px-4 text-center">
                                <button
                                    onClick={() => setCart((c: any) => c.filter((_: any, i: number) => i !== idx))}
                                    className="text-text-muted hover:text-state-error-text hover:bg-state-error-bg dark:hover:bg-red-500/10 w-10 h-10 rounded-xl flex items-center justify-center transition-all mx-auto"
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
