import React, { forwardRef, useEffect, useState } from 'react';
import { Search, Camera, Mic } from 'lucide-react';
import VoiceControl from './VoiceControl';

export const PosSearchBar = forwardRef<HTMLInputElement, any>((props: any, ref) => {
    const { searchInput, setSearchInput, handleSearchSubmit, filteredProducts, addToCart, getPrice, onCameraClick, onVoiceCommand } = props;

    // Virtual search wrapper with enterprise padding and focus ring
    return (
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2 bg-surface dark:bg-[#0f172a] border border-default dark:border-white/10 p-2 rounded-2xl relative items-center min-w-[300px] overflow-visible shadow-enterprise focus-within:ring-4 focus-within:ring-primary/15 transition-all">
            <Search size={24} className="ml-4 text-text-muted shrink-0" />
            <input
                ref={ref}
                type="text"
                placeholder="Barkod okut veya ürün ara... (F3)"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                className="flex-1 bg-transparent border-none px-4 text-lg font-medium text-[#111827] dark:text-white focus:outline-none placeholder:text-[#9AA3AF] placeholder:font-normal h-14"
            />

            <div className="flex items-center gap-2 pr-2">
                {process.env.NEXT_PUBLIC_POS_VOICE !== 'false' && (
                    <VoiceControl onCommand={onVoiceCommand} />
                )}
                {process.env.NEXT_PUBLIC_POS_CAMERA_VISION !== 'false' && (
                    <button type="button" onClick={onCameraClick} className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface-secondary dark:bg-indigo-500/10 text-primary dark:text-indigo-400 hover:bg-surface-tertiary dark:hover:bg-indigo-500/20 transition-colors border border-default">
                        <Camera size={20} />
                    </button>
                )}

                <button type="submit" className="h-10 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-6 rounded-lg text-sm font-bold transition-all shadow-sm flex items-center gap-2">
                    Ekle <kbd className="hidden sm:inline-block font-sans text-[10px] bg-[#1D4ED8] px-1.5 py-0.5 rounded opacity-80 border border-[#2563EB]">ENTER</kbd>
                </button>
            </div>

            {/* DYNAMIC PRODUCT LIST */}
            {filteredProducts.length > 0 && (
                <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] z-[100] animate-in fade-in slide-in-from-top-2 duration-200 max-h-[350px] overflow-y-auto">
                    {filteredProducts?.map((p: any) => (
                        <div key={p.id} onClick={() => addToCart(p)} className="p-4 border-b last:border-b-0 border-slate-100 dark:border-white/5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer transition-colors group">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors shadow-sm">
                                    <Search size={18} />
                                </div>
                                <div>
                                    <div className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors tracking-tight">{p.name}</div>
                                    <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 tracking-widest uppercase">{p.barcode || p.code}</div>
                                </div>
                            </div>
                            <div className="font-black text-[#DC2626] dark:text-rose-400 text-lg">
                                ₺{Number(getPrice(p)).toLocaleString()}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </form>
    );
});

PosSearchBar.displayName = 'PosSearchBar';
export default PosSearchBar;
