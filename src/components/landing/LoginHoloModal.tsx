import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface LoginHoloModalProps {
    isOpen: boolean;
    setIsOpen: (val: boolean) => void;
}

export default function LoginHoloModal({ isOpen, setIsOpen }: LoginHoloModalProps) {
    const { login } = useAuth();

    // Form Inputs
    const [termInput, setTermInput] = useState('');
    const [termPassword, setTermPassword] = useState('');
    
    // Terminal Flow State
    const [logs, setLogs] = useState<string[]>(['> CONNECTING TO PERIODYANET...']);
    const [step, setStep] = useState(0); 
    // 0: Init, 1: Request Email, 2: Waiting Email, 3: Request Pwd, 4: Waiting Pwd, 5: Auth

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [setIsOpen]);

    // Reset sequences when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setLogs(['> AĞ BAĞLANTISI BAŞLATILIYOR...']);
            setStep(0);
            setTermInput('');
            setTermPassword('');

            setTimeout(() => {
                setLogs(p => [...p, '> GÜVENLİ KANAL AÇILDI. ONAY BEKLENİYOR.']);
                setStep(1);
                setTimeout(() => {
                    setLogs(p => [...p, '> PERİODYA_ID (KULLANICI ADI):']);
                    setStep(2);
                }, 800);
            }, 1000);
        } else {
            // Reset when closed
            setStep(0);
        }
    }, [isOpen]);

    const handleTerminalKeyDown = async (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            if (step === 2 && termInput.trim()) {
                setLogs(p => [...p, `> ${termInput}`, '> PROTOCOL ACCEPTED. PASSWORD:']);
                setStep(4);
            } else if (step === 4) {
                const val = termPassword.trim().toUpperCase();
                if (['RESET', 'FORGOT', 'ŞİFRE', 'SIFRE', 'YARDIM', 'HELP'].includes(val)) {
                    setLogs(p => [...p, `> ${val}`, '> RECOVERY PROTOCOL OVERRIDE INITIATED...', '> ŞİFRE SIFIRLAMA BAĞLANTISI GÜVENLİ E-POSTA KANALCILIĞIYLA İLETİLDİ.']);
                    setStep(6);
                    setTermPassword('');
                    setTimeout(() => {
                        setIsOpen(false);
                    }, 4000);
                } else if (termPassword.trim()) {
                    setLogs(p => [...p, `> ********`, '> AUTHENTICATING BİOMETRIC HASH...']);
                    setStep(5);
                    
                    const success = await login(termInput, termPassword);
                    
                    if (success) {
                        setLogs(p => [...p, '> ACCESS GRANTED. WELCOME!']);
                        setTimeout(() => setIsOpen(false), 1200);
                    } else {
                        setLogs(p => [...p, '> ACCESS DENIED: INVALID CREDENTIALS.', '> PASSWORD:']);
                        setStep(4);
                        setTermPassword('');
                    }
                }
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            
            {/* Dark/Cyan Ambient Backdrop */}
            <div 
                className="absolute inset-0 bg-[#020617]/90 backdrop-blur-xl transition-all duration-300"
                onClick={() => setIsOpen(false)}
            />

            {/* Modal Container */}
            <div className="w-full max-w-[750px] mx-auto z-40 relative group animate-in fade-in zoom-in-95 duration-300">
                
                {/* Background Core Glow */}
                <div className="absolute inset-0 bg-cyan-600 blur-[100px] opacity-10 rounded-full pointer-events-none" />

                {/* THE TERMINAL CARD */}
                <div 
                    className="bg-[#030614]/95 backdrop-blur-2xl border border-cyan-500/20 rounded-xl p-8 shadow-[0_0_60px_rgba(6,182,212,0.15)] font-mono text-cyan-400 relative overflow-hidden"
                >
                    {/* Top Right Close */}
                    <button 
                        onClick={() => setIsOpen(false)}
                        className="absolute top-4 right-4 z-50 text-cyan-500/40 hover:text-cyan-400 transition-colors p-1"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="text-sm md:text-base leading-relaxed tracking-wide min-h-[340px] flex flex-col justify-end relative z-10 w-full">
                        
                        {/* Mac-like Window Controls (But Sci-Fi) */}
                        <div className="absolute top-0 left-0 flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-rose-500/60 shadow-[0_0_8px_rgba(244,63,94,0.4)]"></div>
                            <div className="w-3 h-3 rounded-full bg-amber-500/60 shadow-[0_0_8px_rgba(245,158,11,0.4)]"></div>
                            <div className="w-3 h-3 rounded-full bg-cyan-400/80 shadow-[0_0_12px_#22d3ee] animate-pulse"></div>
                        </div>
                        
                        {/* Terminal Header */}
                        <div className="mb-6 mt-10 text-cyan-500/60 font-bold border-b border-cyan-500/20 pb-3 uppercase tracking-[0.1em]">
                            PERIODYANET SYSTEM SHELL v2.1.0<br/>
                            <span className="text-xs tracking-[0.2em] font-normal opacity-80 mt-1 block">YÜKSEK GÜVENLİKLİ KURUMSAL AĞ BAĞLANTISI</span>
                        </div>
                        
                        {/* Logs Output */}
                        <div className="space-y-1.5 overflow-hidden">
                            {logs.map((log, i) => (
                                <div key={i} className="animate-in slide-in-from-bottom-2 fade-in">{log}</div>
                            ))}
                        </div>
                        
                        {/* Interactive Username Input */}
                        {step === 2 && (
                            <div className="flex animate-pulse items-center mt-1.5">
                                <span className="mr-3 font-black text-cyan-300">&gt;</span>
                                <input 
                                    autoFocus
                                    type="text" 
                                    autoComplete="off"
                                    spellCheck="false"
                                    className="bg-transparent border-none outline-none text-cyan-300 w-full font-bold tracking-wider placeholder-cyan-900/50 selection:bg-cyan-500/30"
                                    value={termInput}
                                    placeholder="ornek@sirket.com"
                                    onChange={e => setTermInput(e.target.value)}
                                    onKeyDown={handleTerminalKeyDown}
                                />
                                <span className="w-3 h-5 bg-cyan-400 ml-1 block animate-[blink_1s_infinite]"></span>
                            </div>
                        )}

                        {/* Interactive Password Input */}
                        {step === 4 && (
                            <div className="flex flex-col mt-1.5 animate-in fade-in">
                                <div className="flex items-center">
                                    <span className="mr-3 font-black text-cyan-300">&gt;</span>
                                    <input 
                                        autoFocus
                                        type={termPassword.toUpperCase() === 'RESET' || termPassword.toUpperCase() === 'SIFRE' || termPassword.toUpperCase() === 'FORGOT' ? 'text' : 'password'} 
                                        autoComplete="off"
                                        className="bg-transparent border-none outline-none text-cyan-300 w-full tracking-[0.4em] font-black selection:bg-cyan-500/30"
                                        value={termPassword}
                                        onChange={e => setTermPassword(e.target.value)}
                                        onKeyDown={handleTerminalKeyDown}
                                    />
                                    <span className="w-3 h-5 bg-cyan-400 ml-1 block animate-[blink_1s_infinite]"></span>
                                </div>
                                <div className="ml-6 mt-3 text-[10px] text-cyan-500/50 font-medium tracking-[0.15em] uppercase pointer-events-none">
                                    * Şifreyi mi unuttunuz? Kurtarmak için 'RESET' yazıp ENTER'a basın.
                                </div>
                            </div>
                        )}

                        {/* Authenticating Loading Spinner */}
                        {step === 5 && (
                            <div className="mt-8 text-center text-cyan-400 mix-blend-screen flex flex-col items-center justify-center">
                                <div className="relative w-20 h-20">
                                    <div className="absolute inset-0 border-2 border-t-cyan-400 border-r-cyan-400 border-b-transparent border-l-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(34,211,238,0.5)]"></div>
                                    <div className="absolute inset-2 border border-b-cyan-500 border-l-cyan-500 border-t-transparent border-r-transparent rounded-full animate-[spin_2s_linear_infinite_reverse]"></div>
                                </div>
                                <div className="mt-6 font-bold tracking-[0.3em] text-sm animate-pulse">GÜVENLİK PROTOKOLÜ DOĞRULANIYOR...</div>
                            </div>
                        )}

                        {/* Recovery Loading Spinner */}
                        {step === 6 && (
                            <div className="mt-8 text-center text-amber-400 mix-blend-screen flex flex-col items-center justify-center">
                                <div className="relative w-16 h-16">
                                    <div className="absolute inset-0 border-[3px] border-amber-400 border-b-transparent border-t-transparent rounded-full animate-[spin_1.5s_linear_infinite]"></div>
                                </div>
                                <div className="mt-6 font-bold tracking-[0.2em] text-xs animate-pulse text-amber-500">AĞ İLETİŞİMİ BEKLENİYOR...</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Scanline Animation Overlay */}
                <div className="absolute top-0 left-0 w-full h-[2px] bg-cyan-400 opacity-20 shadow-[0_0_15px_#22d3ee] pointer-events-none z-50 animate-[scan_3s_ease-in-out_infinite_alternate]" />
                
                <style>{`
                    @keyframes scan {
                        0% { transform: translateY(0); }
                        100% { transform: translateY(400px); }
                    }
                    @keyframes blink {
                        0%, 100% { opacity: 1; }
                        50% { opacity: 0; }
                    }
                `}</style>
            </div>
        </div>
    );
}
