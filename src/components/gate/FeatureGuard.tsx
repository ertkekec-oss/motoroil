// src/components/gate/FeatureGuard.tsx
"use client";

import React, { ReactNode } from 'react';
import { useApp } from '@/contexts/AppContext';
import { UPGRADE_CATALOG, FeatureAddonKey } from '@/lib/constants/upgradeCatalog';
import { Lock, Sparkles, CheckCircle2, Crown } from 'lucide-react';
import Link from 'next/link';

interface FeatureGuardProps {
    featureKey: string;
    children: ReactNode;
    // Tweak to render either full page blocker or inline content blocker
    variant?: 'full-page' | 'inline';
}

export function FeatureGuard({ featureKey, children, variant = 'full-page' }: FeatureGuardProps) {
    const { hasFeature, isInitialLoading } = useApp();

    if (isInitialLoading) {
        // While loading the feature check, render a subtle pulse to not flash the lock screen erroneously
        return (
            <div className={`flex items-center justify-center ${variant === 'full-page' ? 'h-full min-h-[60vh]' : 'h-64'}`}>
                <div className="w-8 h-8 rounded-full border-2 border-slate-200 dark:border-slate-800 border-t-indigo-500 animate-spin" />
            </div>
        );
    }

    if (hasFeature(featureKey)) {
        return <>{children}</>;
    }

    // Attempt to map the requested feature to our Upgrade Catalog
    // If not in catalog, fallback to a generic message.
    const catalogItem = UPGRADE_CATALOG[featureKey as FeatureAddonKey];

    const LockScreen = (
        <div className="relative overflow-hidden bg-white/40 dark:bg-[#0b101b]/40 backdrop-blur-3xl border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-8 max-w-2xl mx-auto text-center shadow-2xl flex flex-col items-center">
            
            {/* Soft Glow Background Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px]" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px]" />

            {/* Lock Icon Badge */}
            <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/30 to-purple-500/30 rounded-full blur-xl animate-pulse" />
                <div className="relative w-20 h-20 bg-gradient-to-br from-slate-100 to-white dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center shadow-lg">
                    <Lock className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-[#0b101b]">
                        <Crown className="w-3.5 h-3.5 text-amber-900" />
                    </div>
                </div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
                {catalogItem ? catalogItem.title : 'Bu Özellik Kilitli'}
            </h2>
            
            <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md text-sm sm:text-base leading-relaxed">
                {catalogItem 
                    ? catalogItem.shortDescription 
                    : 'İşletmenizin ufkunu genişletmek ve bu gelişmiş aracı kullanmak için planınıza yeni bir eklenti dahil etmelisiniz.'}
            </p>

            {catalogItem && (
                <div className="w-full bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-5 mb-8 border border-slate-100 dark:border-slate-800/80 text-left">
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-4 h-4 text-indigo-500" />
                        <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Modül Kazançları</span>
                    </div>
                    <ul className="space-y-3">
                        {catalogItem.fullDescription.map((benefit, idx) => (
                            <li key={idx} className="flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                <span className="text-sm text-slate-600 dark:text-slate-400 leading-snug">{benefit}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                <Link href={`/billing/store?highlight=${featureKey}`} className="group relative w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 px-8 py-3.5 rounded-2xl font-bold transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(0,0,0,0.1)] dark:shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                    <span>Modül Mağazasına Git</span>
                    {catalogItem && (
                        <span className="bg-slate-700 dark:bg-slate-200 text-slate-100 dark:text-slate-800 px-2 py-0.5 rounded-lg text-xs font-black">
                            +{catalogItem.price}₺/{catalogItem.interval}
                        </span>
                    )}
                </Link>
                <button className="text-sm font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-colors">
                    Daha Fazla Bilgi
                </button>
            </div>
        </div>
    );

    if (variant === 'full-page') {
        return (
            <div className="w-full h-full min-h-[80vh] flex items-center justify-center p-4">
                {/* 
                    Behind the lock screen, we can render the children blurred out heavily 
                    with pointer-events-none to give the impression of teasing the UI.
                */}
                <div className="absolute inset-0 overflow-hidden select-none pointer-events-none opacity-20 dark:opacity-[0.03] blur-[8px] z-0">
                    <div className="scale-95 origin-top translate-y-10 filter grayscale">
                        {children}
                    </div>
                </div>
                
                <div className="relative z-10 w-full">
                    {LockScreen}
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full z-10 my-4">
            {LockScreen}
        </div>
    );
}
