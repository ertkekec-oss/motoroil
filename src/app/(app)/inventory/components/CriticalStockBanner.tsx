
import React from 'react';
import { Product } from '@/contexts/AppContext';

interface CriticalStockBannerProps {
    products: Product[];
    onFilterCritical: () => void;
    onProcurement: () => void;
}

export default function CriticalStockBanner({ products, onFilterCritical, onProcurement }: CriticalStockBannerProps) {
    const criticalProducts = products.filter(p => (p.stock || 0) <= (p.minStock || 5));
    const outOfStock = criticalProducts.filter(p => (p.stock || 0) <= 0);

    if (criticalProducts.length === 0) return null;

    return (
        <div className="mb-8 p-6 rounded-2xl border bg-red-50/50 border-red-200 dark:bg-red-950/20 dark:border-red-900/40 relative overflow-hidden group">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/50 flex flex-shrink-0 items-center justify-center text-red-600 dark:text-red-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-[15px] font-semibold text-slate-900 dark:text-slate-100 mb-0.5">
                            Kritik Stok Uyarı Sistemi
                        </h3>
                        <p className="text-[13px] text-slate-500 dark:text-slate-400 max-w-xl">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{criticalProducts.length} ürün</span> kritik seviyenin altında, bunlardan <span className="font-semibold text-slate-700 dark:text-slate-300">{outOfStock.length} tanesi</span> tamamen tükenmiş durumda.
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={onFilterCritical}
                        className="px-4 h-[36px] rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-transparent hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 text-[13px] font-medium transition-colors"
                    >
                        Listele
                    </button>
                    <button
                        onClick={onProcurement}
                        className="px-4 h-[36px] rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-medium transition-colors shadow-sm"
                    >
                        Tedarik Listesi Oluştur
                    </button>
                </div>
            </div>
        </div>
    );
}
