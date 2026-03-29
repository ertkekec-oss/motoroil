import React, { useState } from 'react';
import { Sparkles, TrendingUp, AlertTriangle } from 'lucide-react';

export default function AiCashierPanel({ cartItems, onAddSuggested }: { cartItems: any[], onAddSuggested: (prod: any) => void }) {
    const isAiEnabled = process.env.NEXT_PUBLIC_POS_AI_CASHIER !== 'false';
    const [isCollapsed, setIsCollapsed] = useState(false);

    if (!isAiEnabled) return null;

    // Simulate heuristics
    const latestItems = cartItems.slice(-3);
    const hasDrinks = latestItems.some(i => i.categoryId === 'drinks' || i.name.toLowerCase().includes('cola'));

    const suggested = !hasDrinks && cartItems.length > 0
        ? { id: 's1', name: 'Coca Cola 330ml', price: 25, category: 'Tamamlayıcı Ürün', icon: '🥤' }
        : null;

    return (
        <div className="bg-[#FFFFFF] dark:bg-[#0f172a] border border-[#D9DEE5] dark:border-white/10 rounded-2xl p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] mb-4 transition-all overflow-hidden duration-300">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsCollapsed(!isCollapsed)}>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <Sparkles size={18} />
                    </div>
                    <h3 className="text-sm font-bold text-[#111827] dark:text-white">Akıllı Kasiyer (AI)</h3>
                </div>
                <button className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors">
                    {isCollapsed ? 'GÖSTER' : 'GİZLE'}
                </button>
            </div>

            {!isCollapsed && (
                <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2">
                    {suggested && (
                        <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 rounded-xl">
                            <div className="flex items-center gap-3">
                                <span className="text-xl">{suggested.icon}</span>
                                <div>
                                    <p className="text-xs font-bold text-[#2563EB] dark:text-indigo-400 mb-0.5">{suggested.category}</p>
                                    <p className="text-sm font-semibold text-[#111827] dark:text-white">{suggested.name}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => onAddSuggested(suggested)}
                                className="px-3 py-1.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 hover:bg-indigo-100 hover:text-indigo-700 transition-colors rounded-lg text-xs font-bold"
                            >
                                + EKLE
                            </button>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                        <div className="p-3 bg-[#ECFDF3] dark:bg-emerald-500/10 border border-[#ECFDF3] dark:border-emerald-500/20 rounded-xl">
                            <div className="flex items-center gap-1.5 text-[#027A48] dark:text-emerald-400 mb-1">
                                <TrendingUp size={14} /> <span className="text-[10px] font-bold uppercase tracking-widest">Çok Satan</span>
                            </div>
                            <p className="text-xs font-semibold text-[#111827] dark:text-white truncate">Ayçiçek Yağı 5L</p>
                        </div>
                        <div className="p-3 bg-[#FEF3F2] dark:bg-rose-500/10 border border-[#FEF3F2] dark:border-rose-500/20 rounded-xl">
                            <div className="flex items-center gap-1.5 text-[#DC2626] dark:text-rose-400 mb-1">
                                <AlertTriangle size={14} /> <span className="text-[10px] font-bold uppercase tracking-widest">Kritik Stok</span>
                            </div>
                            <p className="text-xs font-semibold text-[#111827] dark:text-white truncate">Un 10Kg</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
