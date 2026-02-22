"use client";
import { useState } from 'react';

const NAV_LINKS = [
    { label: 'Ürün', href: '#urun' },
    { label: 'Özellikler', href: '#ozellikler' },
    { label: 'Fiyatlama', href: '#fiyatlama' },
    { label: 'SSS', href: '#sss' },
    { label: 'Destek', href: '#destek' },
];

interface TopNavProps {
    onDemoClick?: () => void;
}

export default function TopNav({ onDemoClick }: TopNavProps) {
    const scrollTo = (id: string) => {
        document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <nav
            className="sticky top-0 z-50 w-full border-b border-white/5"
            style={{ backgroundColor: 'rgba(8,9,17,0.88)', backdropFilter: 'blur(20px)' }}
            aria-label="Ana Navigasyon"
        >
            <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
                {/* Logo */}
                <a href="#" className="flex items-center gap-2 flex-shrink-0" aria-label="Periodya Ana Sayfa">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-white text-sm"
                        style={{ background: 'linear-gradient(135deg,#FF5500,#E64A00)' }}>
                        P
                    </div>
                    <span className="font-black text-white text-lg tracking-tight">Periodya</span>
                </a>

                {/* Desktop Links */}
                <div className="flex items-center gap-1">
                    {NAV_LINKS.map(link => (
                        <button
                            key={link.href}
                            onClick={() => scrollTo(link.href)}
                            className="px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                        >
                            {link.label}
                        </button>
                    ))}
                    <button
                        onClick={() => scrollTo('#login')}
                        className="ml-2 px-3 py-2 rounded-lg text-sm font-medium text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 transition-all"
                    >
                        Giriş
                    </button>
                </div>

                {/* CTA */}
                <button
                    onClick={onDemoClick}
                    className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold text-white border border-white/10 hover:bg-white/5 transition-all"
                    aria-label="Ücretsiz deneme başlat"
                >
                    Demo Talep Et
                </button>
            </div>
        </nav>
    );
}
