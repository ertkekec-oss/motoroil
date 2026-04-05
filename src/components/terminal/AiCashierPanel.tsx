import React, { useState } from 'react';
import { Sparkles, TrendingUp, AlertTriangle } from 'lucide-react';

export default function AiCashierPanel({ cartItems, onAddSuggested }: { cartItems: any[], onAddSuggested: (prod: any) => void }) {
    const isAiEnabled = process.env.NEXT_PUBLIC_POS_AI_CASHIER !== 'false';
    const [isCollapsed, setIsCollapsed] = useState(false);

    if (!isAiEnabled) return null;

    // Simulate heuristics
    const latestItems = cartItems.slice(-3);
    const hasDrinks = latestItems.some(i => i.categoryId === 'drinks' || i.name.toLowerCase().includes('cola'));

    return (
        <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-4 shadow-sm mb-4 transition-all overflow-hidden duration-300">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsCollapsed(!isCollapsed)}>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <Sparkles size={18} className={cartItems.length > 0 ? "animate-pulse" : ""} />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white">Akıllı Kasiyer (AI)</h3>
                </div>
                <button className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors">
                    {isCollapsed ? 'GÖSTER' : 'GİZLE'}
                </button>
            </div>

            {!isCollapsed && (
                <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl justify-center">
                        {cartItems.length > 0 ? (
                            <div className="flex flex-col items-center gap-2">
                                <div className="flex gap-1 mb-1">
                                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Sepet Analiz Ediliyor</span>
                            </div>
                        ) : (
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Öneri İçin Ürün Ekleyin</span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
