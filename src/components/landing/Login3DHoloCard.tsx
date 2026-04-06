'use client';
import React, { useRef, useState, MouseEvent } from 'react';
import { Fingerprint, ArrowRight, ScanFace } from 'lucide-react';

export default function Login3DHoloCard() {
    const cardRef = useRef<HTMLDivElement>(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -10; // Max 10 deg rotation
        const rotateY = ((x - centerX) / centerX) * 10;
        
        cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    };

    const handleMouseLeave = () => {
        if (!cardRef.current) return;
        cardRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    };

    return (
        <div style={{ perspective: '1000px' }} className="w-full max-w-[320px] mx-auto z-40 relative group">
            {/* Holographic Glowing Base behind the card */}
            <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 rounded-3xl" />
            
            <div 
                ref={cardRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-2xl p-6 shadow-[0_30px_60px_rgba(37,99,235,0.15)] transition-all ease-out duration-200 w-full relative overflow-hidden"
                style={{ transformStyle: 'preserve-3d' }}
            >
                {/* Decorative UI elements for a "Smart Card" feel */}
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Fingerprint className="w-24 h-24" />
                </div>
                <div className="w-10 h-10 bg-[#0E1528] text-white rounded-[10px] flex items-center justify-center mb-6 shadow-md" style={{ transform: 'translateZ(30px)' }}>
                    <ScanFace className="w-5 h-5" />
                </div>

                <div style={{ transform: 'translateZ(20px)' }}>
                    <h3 className="text-[22px] font-bold text-[#0E1528] leading-tight mb-1">Kimlik Doğrulama</h3>
                    <p className="text-slate-500 text-[13px] font-medium mb-6">Kurumsal buluta bağlan.</p>
                </div>

                <form className="space-y-4 relative z-10" style={{ transform: 'translateZ(30px)' }} onSubmit={e => e.preventDefault()}>
                    <div>
                        <input 
                            type="email" 
                            placeholder="E-posta" 
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full bg-slate-50/50 border border-slate-200/60 rounded-md px-4 py-2.5 text-sm outline-none focus:border-[#2563EB] transition-colors"
                        />
                    </div>
                    <div>
                        <input 
                            type="password" 
                            placeholder="Şifre" 
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full bg-slate-50/50 border border-slate-200/60 rounded-md px-4 py-2.5 text-sm outline-none focus:border-[#2563EB] transition-colors"
                        />
                    </div>
                    <button className="w-full mt-2 bg-[#2563EB] text-white font-bold py-3 rounded-sm shadow-md hover:bg-blue-700 transition-colors flex justify-center items-center gap-2 text-[14px]">
                        Giriş Yap <ArrowRight className="w-4 h-4" />
                    </button>
                </form>

                {/* Laser/Holo shine overlay line */}
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            
            <div className="text-center mt-3 text-[10px] uppercase tracking-widest text-[#2563EB] font-bold opacity-60">
                Test. Konsept 3: 3D Holo Kart
            </div>
        </div>
    );
}
