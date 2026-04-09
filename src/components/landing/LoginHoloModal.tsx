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
    const [variant, setVariant] = useState<'CLASSIC' | 'DARK_GLASS' | 'QUANTUM_HUD'>('QUANTUM_HUD');
    const [isConnecting, setIsConnecting] = useState(false);

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
        if (!cardRef.current || variant === 'CLASSIC') return;
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

    const handleLoginClick = (e: React.FormEvent) => {
        e.preventDefault();
        if (variant === 'QUANTUM_HUD' || variant === 'DARK_GLASS') {
            setIsConnecting(true);
            setTimeout(() => {
                setIsConnecting(false);
                setIsOpen(false);
            }, 3000);
        } else {
            setIsOpen(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className={`absolute inset-0 transition-opacity duration-300 ${variant === 'CLASSIC' ? 'bg-slate-900/40 backdrop-blur-md' : 'bg-[#030712]/80 backdrop-blur-xl'}`}
                onClick={() => setIsOpen(false)}
            />

            {/* DEV TOOL: Variant Selector */}
            <div className="absolute top-10 left-1/2 -translate-x-1/2 flex gap-2 bg-white/10 backdrop-blur-md p-2 rounded-full border border-white/20 z-50 shadow-2xl">
                <button onClick={() => setVariant('CLASSIC')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${variant === 'CLASSIC' ? 'bg-white text-black' : 'text-white/60 hover:text-white'}`}>V1: Klasik</button>
                <button onClick={() => setVariant('DARK_GLASS')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${variant === 'DARK_GLASS' ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'text-white/60 hover:text-white'}`}>V2: Dark Glass</button>
                <button onClick={() => setVariant('QUANTUM_HUD')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${variant === 'QUANTUM_HUD' ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'text-white/60 hover:text-white'}`}>V3: Quantum HUD</button>
            </div>

            {/* Card Container */}
            <div style={{ perspective: '1000px' }} className="w-full max-w-[380px] mx-auto z-40 relative group animate-in fade-in zoom-in-95 duration-300">
                
                {variant === 'CLASSIC' && (
                    <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 rounded-3xl" />
                )}
                {variant === 'DARK_GLASS' && (
                    <div className="absolute inset-0 bg-indigo-500 blur-[80px] opacity-40 group-hover:opacity-60 transition-opacity duration-500 rounded-full" />
                )}
                {variant === 'QUANTUM_HUD' && (
                    <>
                        {/* HUD Cyber Grid Background */}
                        <div className="absolute inset-[-50px] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
                        <div className="absolute inset-0 bg-emerald-500 blur-[100px] opacity-30 animate-pulse rounded-full" />
                    </>
                )}

                <div 
                    ref={cardRef}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    className={`transition-all ease-out duration-200 w-full relative overflow-hidden ${
                        variant === 'CLASSIC' 
                            ? 'bg-white/90 backdrop-blur-2xl border border-white/60 rounded-xl p-8 shadow-[0_40px_80px_rgba(37,99,235,0.2)]'
                            : variant === 'DARK_GLASS'
                            ? 'bg-[#0a0f1c]/70 backdrop-blur-3xl border border-white/10 rounded-2xl p-8 shadow-[0_0_50px_rgba(99,102,241,0.15)] ring-1 ring-white/5'
                            : 'bg-[#020617]/80 backdrop-blur-3xl border-t-2 border-t-emerald-500/50 border-x border-x-emerald-500/20 border-b border-b-emerald-500/10 rounded-3xl p-8 shadow-[0_0_50px_rgba(16,185,129,0.15)] clip-edges'
                    }`}
                    style={variant !== 'CLASSIC' ? { transformStyle: 'preserve-3d' } : {}}
                >
                    {/* Close Button */}
                    <button 
                        onClick={() => setIsOpen(false)}
                        className={`absolute top-4 right-4 z-50 transition-colors p-1 ${variant === 'CLASSIC' ? 'text-slate-400 hover:text-[#0E1528]' : 'text-slate-500 hover:text-white'}`}
                        style={variant !== 'CLASSIC' ? { transform: 'translateZ(40px)' } : {}}
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Header Graphics */}
                    {variant === 'CLASSIC' && (
                        <>
                            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                <Fingerprint className="w-32 h-32" />
                            </div>
                            <div className="w-12 h-12 bg-[#0E1528] text-white rounded-lg flex items-center justify-center mb-6 shadow-md">
                                <ScanFace className="w-6 h-6" />
                            </div>
                        </>
                    )}

                    {variant === 'DARK_GLASS' && (
                        <div className="flex justify-center mb-8" style={{ transform: 'translateZ(30px)' }}>
                            <div className="relative w-16 h-16 rounded-full flex items-center justify-center bg-indigo-500/10 border border-indigo-500/30 shadow-[0_0_30px_rgba(99,102,241,0.3)]">
                                <svg className="absolute inset-0 w-full h-full animate-[spin_4s_linear_infinite] opacity-60" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="48" fill="none" className="stroke-indigo-400/50" strokeWidth="1" />
                                    <path d="M 50 2 A 48 48 0 0 1 98 50" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                                <Fingerprint className="w-7 h-7 text-indigo-400" />
                            </div>
                        </div>
                    )}

                    {variant === 'QUANTUM_HUD' && (
                        <div className="flex flex-col items-center justify-center mb-6" style={{ transform: 'translateZ(40px)' }}>
                            <div className="relative w-20 h-20 flex items-center justify-center">
                                {/* Inner Rotating Target */}
                                <svg className="absolute inset-2 w-[calc(100%-16px)] h-[calc(100%-16px)] animate-[spin_3s_linear_infinite] opacity-80" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="48" fill="none" className="stroke-emerald-500/20" strokeWidth="2" strokeDasharray="10 10" />
                                    <path d="M 50 2 A 48 48 0 0 1 98 50" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
                                </svg>
                                {/* Outer Frame */}
                                <div className="absolute inset-0 border border-emerald-500/30 rounded-lg animate-[spin_10s_linear_infinite_reverse]"></div>
                                {/* Scanning Laser Line */}
                                <div className="absolute top-0 left-0 w-full h-[1px] bg-emerald-400 shadow-[0_0_10px_#34d399] animate-[scan_2s_ease-in-out_infinite_alternate]"></div>
                                
                                <ScanFace className="w-8 h-8 text-emerald-400 z-10" />
                            </div>
                            <div className="mt-3 text-[10px] uppercase font-mono text-emerald-500/70 tracking-widest animate-pulse">Biyometrik Kilit Devrede</div>
                        </div>
                    )}

                    <div style={variant !== 'CLASSIC' ? { transform: 'translateZ(20px)' } : {}} className={variant === 'QUANTUM_HUD' ? 'text-center' : ''}>
                        <h3 className={`text-[26px] font-black leading-tight mb-1 ${variant === 'CLASSIC' ? 'text-[#0E1528]' : 'text-white'}`}>
                            Kimlik Doğrulama
                        </h3>
                        <p className={`text-[14px] font-medium mb-8 ${variant === 'CLASSIC' ? 'text-slate-500' : 'text-slate-400'}`}>
                            Kurumsal buluta bağlan.
                        </p>
                    </div>

                    <form className="space-y-5 relative z-10" style={variant !== 'CLASSIC' ? { transform: 'translateZ(30px)' } : {}} onSubmit={handleLoginClick}>
                        
                        {/* Interactive UI based on state */}
                        {isConnecting ? (
                            <div className="py-10 flex flex-col items-center justify-center space-y-4">
                                <div className="w-12 h-12 rounded-full border border-white/10 bg-[#0a101d] flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                                    <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 via-blue-400 to-emerald-400 animate-pulse">P</span>
                                </div>
                                <div className="w-48 h-[2px] bg-slate-800 rounded-full overflow-hidden">
                                     <div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 w-[50%] animate-[loading-bar_1s_ease-in-out_infinite]"></div>
                                </div>
                                <p className={`text-xs font-mono uppercase tracking-widest ${variant === 'QUANTUM_HUD' ? 'text-emerald-400' : 'text-indigo-400'}`}>Senkronize Olunuyor...</p>
                            </div>
                        ) : (
                            <>
                                {/* Input Fields */}
                                <div className="space-y-4">
                                    <div>
                                        <input 
                                            type="email" 
                                            placeholder="E-posta adresiniz" 
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            className={`w-full px-4 py-3 text-sm outline-none transition-all font-medium ${
                                                variant === 'CLASSIC' 
                                                    ? 'bg-white/50 border border-slate-200/80 rounded-md focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/20 text-[#0E1528]'
                                                    : variant === 'DARK_GLASS'
                                                    ? 'bg-[#0f172a]/50 border border-white/10 rounded-xl focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 text-white placeholder-slate-500'
                                                    : 'bg-emerald-950/20 border-b border-b-emerald-500/30 rounded-none px-2 focus:border-b-emerald-400 text-emerald-100 placeholder-emerald-800/80'
                                            }`}
                                        />
                                    </div>
                                    <div>
                                        <input 
                                            type="password" 
                                            placeholder="Şifreniz" 
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            className={`w-full px-4 py-3 text-sm outline-none transition-all font-medium ${
                                                variant === 'CLASSIC' 
                                                    ? 'bg-white/50 border border-slate-200/80 rounded-md focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/20 text-[#0E1528]'
                                                    : variant === 'DARK_GLASS'
                                                    ? 'bg-[#0f172a]/50 border border-white/10 rounded-xl focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 text-white placeholder-slate-500'
                                                    : 'bg-emerald-950/20 border-b border-b-emerald-500/30 rounded-none px-2 focus:border-b-emerald-400 text-emerald-100 placeholder-emerald-800/80'
                                            }`}
                                        />
                                    </div>
                                </div>

                                <button className={`w-full font-bold py-3.5 transition-all outline-none flex justify-center items-center gap-2 text-[14px] ${
                                    variant === 'CLASSIC'
                                        ? 'bg-[#2563EB] text-white rounded-sm shadow-lg hover:bg-blue-700 hover:-translate-y-0.5'
                                        : variant === 'DARK_GLASS'
                                        ? 'bg-indigo-600 text-white rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:bg-indigo-500 border border-indigo-400/20 hover:-translate-y-1'
                                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/50 mt-6 rounded-md hover:bg-emerald-500/20 hover:text-emerald-300 font-mono tracking-wider shadow-[inset_0_0_15px_rgba(16,185,129,0.2)]'
                                }`}>
                                    {variant === 'QUANTUM_HUD' ? 'AĞA BAĞLAN' : 'Sisteme Giriş Yap'} <ArrowRight className="w-4 h-4" />
                                </button>
                            </>
                        )}
                    </form>

                    {/* Decorative Elements */}
                    {variant === 'CLASSIC' && (
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    )}
                    {variant === 'DARK_GLASS' && (
                        <div className="absolute inset-0 pointer-events-none rounded-2xl ring-1 ring-inset ring-white/10" />
                    )}
                </div>

                <style>{`
                    @keyframes scan {
                        0% { transform: translateY(0); }
                        100% { transform: translateY(60px); }
                    }
                    .clip-edges {
                        clip-path: polygon(5% 0%, 100% 0%, 100% 95%, 95% 100%, 0% 100%, 0% 5%);
                    }
                    @keyframes loading-bar {
                        0% { transform: translateX(-150%); }
                        50% { transform: translateX(50%); }
                        100% { transform: translateX(350%); }
                    }
                `}</style>
            </div>
        </div>
    );
}
