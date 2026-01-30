
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
        <div className="mb-8 p-6 bg-gradient-to-r from-red-500/10 via-amber-500/5 to-transparent rounded-3xl border border-red-500/20 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                <span className="text-8xl">🚨</span>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-red-500 flex items-center justify-center text-2xl shadow-lg shadow-red-500/40 shrink-0">
                        ⚠️
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white mb-1">
                            Akıllı Kritik Stok Uyarı Sistemi
                        </h3>
                        <p className="text-[13px] text-white/50 font-medium max-w-xl leading-relaxed">
                            <span className="text-red-400 font-bold">{criticalProducts.length} ürün</span> kritik seviyenin altında, bunlardan <span className="text-red-400 font-bold">{outOfStock.length} tanesi</span> tamamen tükenmiş durumda.
                            Satış kaybını önlemek için tedarik sürecini başlatmanız önerilir.
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={onFilterCritical}
                        className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[13px] font-black transition-all flex items-center gap-2"
                    >
                        🔍 KRİTİK ÜRÜNLERİ LİSTELE
                    </button>
                    <button
                        onClick={onProcurement}
                        className="px-6 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white text-[13px] font-black transition-all shadow-lg shadow-red-500/20 flex items-center gap-2 active:scale-95"
                    >
                        📋 TEDARİK LİSTESİ OLUŞTUR
                    </button>
                </div>
            </div>

            {/* Micro Pulse Indicators */}
            <div className="absolute bottom-4 left-24 flex gap-1.5 opacity-40">
                {criticalProducts.slice(0, 10).map((_, i) => (
                    <span key={i} className="w-1 h-3 rounded-full bg-red-500 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }}></span>
                ))}
                {criticalProducts.length > 10 && <span className="text-[9px] font-black text-red-500 ml-1">+{criticalProducts.length - 10}</span>}
            </div>
        </div>
    );
}
