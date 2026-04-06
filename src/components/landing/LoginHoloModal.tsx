'use client';
import React, { useRef, useState, MouseEvent, useEffect } from 'react';
import { Fingerprint, ArrowRight, ScanFace, X } from 'lucide-react';

interface LoginHoloModalProps {
    isOpen: boolean;
    setIsOpen: (val: boolean) => void;
}

export default function LoginHoloModal({ isOpen, setIsOpen }: LoginHoloModalProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [setIsOpen]);

    const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -10; 
        const rotateY = ((x - centerX) / centerX) * 10;
        
        cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    };

    const handleMouseLeave = () => {
        if (!cardRef.current) return;
        cardRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop with strong blur */}
            <div 
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity duration-300"
                onClick={() => setIsOpen(false)}
            />

            {/* 3D Holo Card Container */}
            <div style={{ perspective: '1000px' }} className="w-full max-w-[360px] mx-auto z-40 relative group animate-in fade-in zoom-in-95 duration-300">
                {/* Holographic Glowing Base behind the card */}
                <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 rounded-3xl" />
                
                <div 
                    ref={cardRef}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    className="bg-white/90 backdrop-blur-2xl border border-white/60 rounded-xl p-8 shadow-[0_40px_80px_rgba(37,99,235,0.2)] transition-all ease-out duration-200 w-full relative overflow-hidden"
                    style={{ transformStyle: 'preserve-3d' }}
                >
                    {/* Close Button */}
                    <button 
                        onClick={() => setIsOpen(false)}
                        className="absolute top-4 right-4 z-50 text-slate-400 hover:text-[#0E1528] transition-colors p-1"
                        style={{ transform: 'translateZ(40px)' }}
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Decorative UI elements for a "Smart Card" feel */}
                    <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                        <Fingerprint className="w-32 h-32" />
                    </div>
                    <div className="w-12 h-12 bg-[#0E1528] text-white rounded-lg flex items-center justify-center mb-6 shadow-md" style={{ transform: 'translateZ(30px)' }}>
                        <ScanFace className="w-6 h-6" />
                    </div>

                    <div style={{ transform: 'translateZ(20px)' }}>
                        <h3 className="text-[26px] font-black text-[#0E1528] leading-tight mb-1">Kimlik Doğrulama</h3>
                        <p className="text-slate-500 text-[14px] font-medium mb-8">Kurumsal buluta bağlan.</p>
                    </div>

                    <form className="space-y-4 relative z-10" style={{ transform: 'translateZ(30px)' }} onSubmit={e => { e.preventDefault(); setIsOpen(false); }}>
                        <div>
                            <input 
                                type="email" 
                                placeholder="E-posta adresiniz" 
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full bg-white/50 border border-slate-200/80 rounded-md px-4 py-3 text-sm outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/20 transition-all font-medium text-[#0E1528]"
                            />
                        </div>
                        <div>
                            <input 
                                type="password" 
                                placeholder="Şifreniz" 
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full bg-white/50 border border-slate-200/80 rounded-md px-4 py-3 text-sm outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/20 transition-all font-medium text-[#0E1528]"
                            />
                        </div>
                        <button className="w-full mt-4 bg-[#2563EB] text-white font-bold py-3.5 rounded-sm shadow-lg hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-xl transition-all flex justify-center items-center gap-2 text-[14px]">
                            Sisteme Giriş Yap <ArrowRight className="w-4 h-4" />
                        </button>
                    </form>

                    {/* Laser/Holo shine overlay line */}
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
            </div>
        </div>
    );
}
