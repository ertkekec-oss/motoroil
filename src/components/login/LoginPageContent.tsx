"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

import TopNav from './TopNav';
import Banner from './Banner';
import Hero from './Hero';
import Announcement from './Announcement';
import Partners from './Partners';
import BeforeAfter from './BeforeAfter';
import Stats from './Stats';
import Features from './Features';
import InfoBoxes from './InfoBoxes';
import Analytics from './Analytics';
import Roles from './Roles';
import Pricing from './Pricing';
import FAQ from './FAQ';
import CTA from './CTA';
import LoginPanel from './LoginPanel';

export default function LoginPageContent() {
    const router = useRouter();
    const { isAuthenticated, isLoading } = useAuth();

    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            router.push('/dashboard');
        }
    }, [isLoading, isAuthenticated, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#080911' }}>
                <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#080911', color: '#F8FAFC' }}>
            {/*
             * SOL PANEL — 65% genişlik, dikey scroll mümkün
             * İçinde Banner + sticky TopNav + tüm landing sections
             */}
            <div
                className="hidden lg:flex flex-col overflow-y-auto"
                style={{ width: '65%', minWidth: 0, borderRight: '1px solid rgba(255,255,255,0.05)' }}
            >
                {/* Banner en üstte, sayfayla birlikte kayar */}
                <Banner />

                {/* TopNav — sol panel içinde sticky */}
                <div className="sticky top-0 z-50">
                    <TopNav />
                </div>

                {/* Landing Content */}
                <main>
                    <Hero />
                    <Announcement />
                    <Partners />
                    <Stats />
                    <BeforeAfter />
                    <Features />
                    <InfoBoxes />
                    <Analytics />
                    <Roles />
                    <Pricing />
                    <FAQ />
                    <CTA />

                    {/* Footer */}
                    <footer className="py-10 px-6 border-t border-white/5">
                        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-600 font-bold">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs font-black"
                                    style={{ background: 'linear-gradient(135deg,#FF5500,#E64A00)' }}>P</div>
                                <span>Periodya Enterprise ERP</span>
                            </div>
                            <div className="flex flex-wrap items-center justify-center gap-4">
                                {['KVKK', 'Gizlilik', 'Kullanım Koşulları', 'Destek'].map(l => (
                                    <a key={l} href="#" className="hover:text-gray-400 transition-colors">{l}</a>
                                ))}
                            </div>
                            <span>© {new Date().getFullYear()} Periodya. Tüm hakları saklıdır.</span>
                        </div>
                    </footer>
                </main>
            </div>

            {/*
             * SAĞ PANEL — 35% genişlik, sticky (h-screen + sticky top-0)
             * Desktop'ta sabit, mobilde tek kolon olarak altta görünür
             */}
            <div
                className="lg:w-[35%] w-full flex flex-col"
                style={{ backgroundColor: '#0d0f1a', borderLeft: '1px solid rgba(255,255,255,0.04)' }}
            >
                {/* Ambient gradient */}
                <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 blur-3xl pointer-events-none"
                    style={{ background: 'radial-gradient(circle, #FF5500, transparent)' }} />

                {/* Mobilde Banner + Nav da burada gösterilir */}
                <div className="lg:hidden">
                    <Banner />
                    <TopNav />
                    {/* Mobilde landing content özetlemesi */}
                    <div className="px-6 py-8 text-center border-b border-white/5">
                        <h1 className="text-2xl font-black text-white mb-2">İşletmenizi <span style={{ color: '#FF5500' }}>büyütün.</span></h1>
                        <p className="text-sm text-gray-400 font-medium">ERP · Muhasebe · Stok · Pazaryeri</p>
                    </div>
                </div>

                {/* Login Paneli — dikey olarak ortalanmış */}
                <div className="flex-1 flex flex-col justify-center overflow-y-auto">
                    <LoginPanel />
                </div>

                {/* Mobilde CTA butonu */}
                <div className="lg:hidden px-8 pb-8 pt-4 border-t border-white/5">
                    <button
                        onClick={() => {
                            document.querySelector('#ozellikler')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="w-full py-3 rounded-xl border border-white/10 text-sm font-bold text-gray-400 hover:bg-white/5 transition-all"
                    >
                        Özellikleri Keşfet ↓
                    </button>
                </div>
            </div>
        </div>
    );
}
