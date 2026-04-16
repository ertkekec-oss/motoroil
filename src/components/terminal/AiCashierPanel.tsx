import React, { useState, useMemo } from 'react';
import { Sparkles, PackagePlus } from 'lucide-react';

export default function AiCashierPanel({ cartItems, onAddSuggested, allProducts = [] }: { cartItems: any[], onAddSuggested: (prod: any) => void, allProducts?: any[] }) {
    import { useLanguage } from '@/contexts/LanguageContext';

const isAiEnabled = process.env.NEXT_PUBLIC_POS_AI_CASHIER !== 'false';
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { t } = useLanguage();

    // AI Heuristic: Find products related to the cart's latest item, or random "bestsellers"
    const suggestedProducts = useMemo(() => {
        if (!cartItems || cartItems.length === 0 || !allProducts || allProducts.length === 0) return [];
        
        const cartIds = new Set(cartItems.map(i => i.id));
        const lastItem = cartItems[cartItems.length - 1];
        const categoryId = lastItem.categoryId;

        // Try to find products in the same category that are NOT in the cart
        let candidates = allProducts.filter(p => p.categoryId === categoryId && !cartIds.has(p.id));

        // If no items in same category, just pick some other random items not in cart
        if (candidates.length === 0) {
            candidates = allProducts.filter(p => !cartIds.has(p.id));
        }

        // Return up to 2 suggestions
        return candidates.slice(0, 2);
    }, [cartItems, allProducts]);


    if (!isAiEnabled) return null;

    return (
        <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-4 shadow-sm mb-4 transition-all overflow-hidden duration-300">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsCollapsed(!isCollapsed)}>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <Sparkles size={18} className={cartItems.length > 0 ? "animate-pulse" : ""} />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white">{t('ai.cashier')}</h3>
                </div>
                <button className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors">
                    {isCollapsed ? t('ai.show') : t('ai.hide')}
                </button>
            </div>

            {!isCollapsed && (
                <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2">
                    {cartItems.length === 0 ? (
                        <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl justify-center">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">{t('ai.addForSuggestion')}</span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {suggestedProducts.length > 0 ? suggestedProducts.map(prod => (
                                <div key={prod.id} className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/50 dark:hover:bg-slate-800 rounded-xl transition-colors border border-slate-100 dark:border-white/5">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 shrink-0">
                                            <PackagePlus size={14} />
                                        </div>
                                        <div className="truncate pr-2">
                                            <p className="text-[10px] font-bold text-indigo-500 mb-0.5 uppercase tracking-widest">{t('ai.boughtTogether')}</p>
                                            <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{prod.name}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onAddSuggested(prod); }}
                                        className="shrink-0 px-3 py-1.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/30 transition-colors rounded-lg text-[11px] font-black tracking-widest shadow-sm"
                                    >
                                        {t('ai.add')}
                                    </button>
                                </div>
                            )) : (
                                <div className="col-span-1 md:col-span-2 flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl justify-center">
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">{t('ai.noSuggestion')}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
