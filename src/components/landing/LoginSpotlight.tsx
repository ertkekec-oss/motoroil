'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Search, ArrowRight, Lock, Command, Mail, ArrowLeft, Loader2, KeyRound } from 'lucide-react';

interface LoginSpotlightProps {
    isOpen: boolean;
    setIsOpen: (val: boolean) => void;
}

export default function LoginSpotlight({ isOpen, setIsOpen }: LoginSpotlightProps) {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Close on escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsOpen(false);
                setTimeout(() => { setStep(1); setEmail(''); setPassword(''); }, 300);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [setIsOpen]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [isOpen, step]);

    const handleNextStep = (e: React.FormEvent) => {
        e.preventDefault();
        if (step === 1 && email) {
            setStep(2);
        } else if (step === 2 && password) {
            // Fake login process
            setIsLoading(true);
            setTimeout(() => {
                setIsLoading(false);
                setIsOpen(false);
                alert("Giriş Başarılı! (Animasyon Simülasyonu)");
            }, 1500);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh] px-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300"
                onClick={() => setIsOpen(false)}
            />

            {/* Spotlight Modal */}
            <div className={`relative w-full max-w-[640px] bg-white/95 backdrop-blur-2xl rounded-2xl shadow-[0_40px_80px_rgba(0,0,0,0.15)] border border-white overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] transform scale-100 ${isLoading ? 'opacity-80 scale-95 pointer-events-none' : ''}`}>
                
                {/* Header / Current State Info */}
                {step === 2 && (
                    <div className="px-6 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between text-sm animate-in fade-in slide-in-from-top-2 duration-300">
                        <button 
                            type="button" 
                            onClick={() => setStep(1)}
                            className="flex items-center gap-1.5 text-slate-500 hover:text-[#0E1528] transition-colors font-medium"
                        >
                            <ArrowLeft className="w-4 h-4" /> Geri
                        </button>
                        <div className="flex items-center gap-2 font-medium text-[#0E1528]">
                            <div className="w-5 h-5 rounded-full bg-[#2563EB]/10 flex items-center justify-center">
                                <Mail className="w-3 h-3 text-[#2563EB]" />
                            </div>
                            {email}
                        </div>
                    </div>
                )}

                <form onSubmit={handleNextStep} className="relative flex items-center p-2">
                    {/* Icon */}
                    <div className="pl-4 pr-2 shrink-0">
                        {isLoading ? (
                            <Loader2 className="w-6 h-6 text-[#2563EB] animate-spin" />
                        ) : step === 1 ? (
                            <Command className="w-6 h-6 text-slate-400" />
                        ) : (
                            <KeyRound className="w-6 h-6 text-[#2563EB]" />
                        )}
                    </div>

                    {/* Dynamic Input */}
                    <input 
                        ref={inputRef}
                        type={step === 1 ? "email" : "password"}
                        value={step === 1 ? email : password}
                        onChange={(e) => step === 1 ? setEmail(e.target.value) : setPassword(e.target.value)}
                        placeholder={step === 1 ? "Sisteme girmek için e-posta adresiniz..." : "Şifrenizi girin..."}
                        className="w-full bg-transparent text-xl md:text-2xl lg:text-[26px] font-light text-[#0E1528] placeholder:text-slate-300 outline-none py-4 px-2"
                        required
                        disabled={isLoading}
                    />

                    {/* Submit Button */}
                    <div className="pr-2 shrink-0 hidden sm:block">
                        <button 
                            type="submit"
                            disabled={isLoading || (step === 1 && !email) || (step === 2 && !password)}
                            className="h-10 px-4 bg-[#0E1528] text-white rounded-lg font-bold text-[13px] flex items-center gap-2 hover:bg-[#2563EB] transition-colors disabled:opacity-50 disabled:hover:bg-[#0E1528]"
                        >
                            {step === 1 ? 'Devam' : 'Giriş Yap'} <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </form>

                {/* Footer hints */}
                <div className="px-6 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium tracking-wide">
                    <div className="flex flex-wrap gap-4">
                        <span className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 rounded border border-slate-200 bg-white font-sans shadow-sm">Enter</kbd> onayla</span>
                        <span className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 rounded border border-slate-200 bg-white font-sans shadow-sm">Esc</kbd> kapat</span>
                    </div>
                    <div className="hidden sm:block">
                        Periodya Güvenli Erişim
                    </div>
                </div>

            </div>
        </div>
    );
}
