"use client";

import React, { useEffect, useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { UPGRADE_CATALOG, FeatureAddonKey, CatalogItem } from '@/lib/constants/upgradeCatalog';
import { useSearchParams } from 'next/navigation';
import { 
    CheckCircle2, Store, CreditCard, Sparkles, AlertCircle, ChevronRight,
    Map, Wrench, Smartphone, ChefHat, ShoppingBag, Receipt, Building2, Handshake,
    ShieldCheck, Zap, Server
} from 'lucide-react';
import { toast } from 'sonner';

// Map icon strings to actual lucide components dynamically if needed, 
// but direct switch is safer in React context.
const IconMap: Record<string, React.FC<any>> = {
    Map: Map,
    Wrench: Wrench,
    Smartphone: Smartphone,
    ChefHat: ChefHat,
    ShoppingBag: ShoppingBag,
    Receipt: Receipt,
    Building2: Building2,
    Handshake: Handshake,
};

export default function AppStoreClient() {
    const { hasFeature, subscription } = useApp();
    const searchParams = useSearchParams();
    const highlightedFeature = searchParams.get('highlight');
    
    // State to simulate buying processing
    const [purchasingLoading, setPurchasingLoading] = useState<string | null>(null);

    // Get all catalog entries
    const items: CatalogItem[] = Object.values(UPGRADE_CATALOG);

    // Scroll to highlighted element on load
    useEffect(() => {
        if (highlightedFeature) {
            setTimeout(() => {
                const el = document.getElementById(`module-${highlightedFeature}`);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    // Adına dikkat çekmek için ufak bir animasyon uygulayabiliriz CSS tarafında
                }
            }, 300);
        }
    }, [highlightedFeature]);

    const handlePurchase = async (moduleKey: string) => {
        setPurchasingLoading(moduleKey);
        
        // Asıl mimari: Burada /api/billing/purchase-addon rotasına istek atılmalı ve PayTR iFrame döndürülmeli.
        // Şimdilik Simülasyon
        setTimeout(() => {
            setPurchasingLoading(null);
            toast.success("Ödeme Sayfasına Yönlendiriliyorsunuz", {
                description: "Satın alma işlemi başlatıldı."
            });
        }, 1200);
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#070b14] pb-24">
            {/* HEROS SECTION */}
            <div className="relative bg-white dark:bg-[#0b101b] border-b border-slate-200 dark:border-slate-800/80 pt-16 pb-12 px-6 sm:px-12 overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />
                
                <div className="relative z-10 max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50/50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold tracking-wide text-xs mb-6 border border-indigo-100 dark:border-indigo-500/20">
                            <Store className="w-4 h-4" />
                            <span>PERİODYA APP STORE</span>
                        </div>
                        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-4">
                            Ekosisteminizi Büyütün
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 max-w-xl text-sm sm:text-base leading-relaxed">
                            Aylık paketinizi değiştirmeden, işletmenizin tam da o an ihtiyacı olan özellikleri tek bir tıkla sisteminize dahil edin. Yalnızca kullandığınız kadar ödeyin.
                        </p>
                    </div>
                    
                    <div className="hidden md:flex flex-col gap-3 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800 shrink-0 w-80 shadow-inner">
                        <div className="flex items-center gap-3">
                            <ShieldCheck className="w-8 h-8 text-emerald-500" />
                            <div>
                                <h4 className="text-sm font-bold text-slate-800 dark:text-white">Şeffaf Lisanslama</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Gizli ücret veya sürpriz kesinti yok.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                            <Zap className="w-8 h-8 text-amber-500" />
                            <div>
                                <h4 className="text-sm font-bold text-slate-800 dark:text-white">Anında Aktivasyon</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Satın alımdan saniyeler sonra aktif olur.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODULES GRID */}
            <div className="max-w-5xl mx-auto px-6 sm:px-12 mt-12 gap-6 grid grid-cols-1 lg:grid-cols-2">
                {items.map((module) => {
                    const isUnlocked = hasFeature(module.id);
                    const Icon = IconMap[module.iconName] || Sparkles;
                    const isHighlighted = highlightedFeature === module.id;

                    return (
                        <div 
                            key={module.id} 
                            id={`module-${module.id}`}
                            className={`group relative flex flex-col bg-white dark:bg-[#0b101b] rounded-3xl border transition-all duration-300 ${
                                isHighlighted 
                                    ? 'border-indigo-500 dark:border-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.15)] scale-[1.02]' 
                                    : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:shadow-xl'
                            } overflow-hidden`}
                        >
                            {/* Card Header (Gradient & Icon) */}
                            <div className="relative h-24 p-6 overflow-hidden flex items-start justify-between">
                                <div className={`absolute inset-0 bg-gradient-to-r opacity-10 dark:opacity-20 ${module.colorClass}`} />
                                
                                <div className={`relative z-10 w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br shadow-inner ${module.colorClass}`}>
                                    <Icon className="w-6 h-6 text-white drop-shadow-md" />
                                </div>

                                {isUnlocked && (
                                    <div className="relative z-10 flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 text-xs font-bold rounded-full border border-emerald-200 dark:border-emerald-500/30">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        AKTİF
                                    </div>
                                )}
                            </div>

                            {/* Card Body */}
                            <div className="p-6 flex-1 flex flex-col">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{module.title}</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 flex-1">
                                    {module.shortDescription}
                                </p>

                                <div className="space-y-2 mb-8">
                                    {module.fullDescription.map((desc, idx) => (
                                        <div key={idx} className="flex items-start gap-2.5">
                                            <CheckCircle2 className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0 mt-0.5" />
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{desc}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Divider */}
                                <div className="w-full h-px bg-slate-100 dark:bg-slate-800/80 mb-6" />

                                {/* Card Footer (Price & Action) */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                                            {module.price} ₺
                                        </div>
                                        <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                            / {module.interval}
                                        </div>
                                    </div>

                                    {isUnlocked ? (
                                        <button disabled className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold text-sm cursor-not-allowed">
                                            Pakete Dahil
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => handlePurchase(module.id)}
                                            disabled={purchasingLoading === module.id}
                                            className={`group/btn flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md ${
                                                isHighlighted 
                                                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/25'
                                                    : 'bg-slate-900 hover:bg-slate-800 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white dark:shadow-indigo-500/20'
                                            }`}
                                        >
                                            {purchasingLoading === module.id ? (
                                                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin mx-4" />
                                            ) : (
                                                <>
                                                    KİLİDİ AÇ
                                                    <ChevronRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            <div className="max-w-3xl mx-auto mt-20 text-center flex flex-col items-center">
                 <Server className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-4" />
                 <p className="text-sm font-semibold text-slate-500">Özel donanım veya Enterprise paket entegrasyonu (VPN/On-Premise) için lütfen müşteri temsilcinize ulaşın.</p>
            </div>
        </div>
    );
}
