'use client';
import React, { useRef, useState, MouseEvent, useEffect } from 'react';
import { Fingerprint, ArrowRight, ScanFace, X, TerminalSquare, Key, ShieldCheck, Fingerprint as FingerprintIcon } from 'lucide-react';

interface LoginHoloModalProps {
    isOpen: boolean;
    setIsOpen: (val: boolean) => void;
}

type VariantType = 'CLASSIC' | 'DARK_GLASS' | 'QUANTUM_HUD' | 'TERMINAL' | 'BIOMETRIC_HOLD' | 'PASSKEY';

export default function LoginHoloModal({ isOpen, setIsOpen }: LoginHoloModalProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [variant, setVariant] = useState<VariantType>('TERMINAL');
    
    // Form Inputs
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);

    // Terminal State
    const [termLogs, setTermLogs] = useState<string[]>(['> CONNECTING TO PERIODYANET...']);
    const [termInput, setTermInput] = useState('');
    const [termPassword, setTermPassword] = useState('');
    const [termStep, setTermStep] = useState(0); // 0: Init, 1: Request Email, 2: Waiting Email, 3: Request Pwd, 4: Waiting Pwd, 5: Auth

    // Biometric State
    const [holdProgress, setHoldProgress] = useState(0);
    const [showNumpad, setShowNumpad] = useState(false);
    const [pinEntry, setPinEntry] = useState('');
    const holdTimer = useRef<NodeJS.Timeout | null>(null);

    // Passkey State
    const [passkeyStatus, setPasskeyStatus] = useState<'IDLE' | 'SCANNING' | 'SUCCESS'>('IDLE');

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [setIsOpen]);

    // Reset states when variant changes
    useEffect(() => {
        setIsConnecting(false);
        setTermLogs(['> AĞ BAĞLANTISI BAŞLATILIYOR...']);
        setTermStep(0);
        setHoldProgress(0);
        setShowNumpad(false);
        setPinEntry('');
        setPasskeyStatus('IDLE');

        if (variant === 'TERMINAL') {
            setTimeout(() => {
                setTermLogs(p => [...p, '> GÜVENLİ KANAL AÇILDI. ONAY BEKLENİYOR.']);
                setTermStep(1);
                setTimeout(() => {
                    setTermLogs(p => [...p, '> LOGIN USERNAME:']);
                    setTermStep(2);
                }, 800);
            }, 1000);
        }
    }, [variant, isOpen]);

    const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current || variant === 'CLASSIC' || variant === 'TERMINAL') return;
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

    const runAuthSequence = () => {
        setIsConnecting(true);
        setTimeout(() => {
            setIsConnecting(false);
            setIsOpen(false);
        }, 3000);
    };

    // Terminal Handlers
    const handleTerminalKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            if (termStep === 2 && termInput.trim()) {
                setTermLogs(p => [...p, `> ${termInput}`, '> PROTOCOL ACCEPTED. PASSWORD:']);
                setTermStep(4);
            } else if (termStep === 4 && termPassword.trim()) {
                setTermLogs(p => [...p, `> ********`, '> AUTHENTICATING...']);
                setTermStep(5);
                setTimeout(() => {
                    setTermLogs(p => [...p, '> ACCESS GRANTED. WELCOME!']);
                    setTimeout(() => setIsOpen(false), 1000);
                }, 1500);
            }
        }
    };

    // Biometric Handlers
    const startHold = () => {
        if (showNumpad) return;
        setHoldProgress(0);
        const interval = setInterval(() => {
            setHoldProgress(p => {
                if (p >= 100) {
                    clearInterval(interval);
                    setShowNumpad(true);
                    return 100;
                }
                return p + 2;
            });
        }, 30);
        holdTimer.current = interval;
    };
    const endHold = () => {
        if (holdTimer.current) clearInterval(holdTimer.current);
        if (holdProgress < 100 && !showNumpad) {
            setHoldProgress(0);
        }
    };

    const handleNumpad = (num: number) => {
        if (pinEntry.length < 4) {
            const newVal = pinEntry + num;
            setPinEntry(newVal);
            if (newVal.length === 4) {
                // Done
                runAuthSequence();
            }
        }
    };

    // Passkey Handler
    const triggerPasskey = () => {
        setPasskeyStatus('SCANNING');
        setTimeout(() => {
            setPasskeyStatus('SUCCESS');
            setTimeout(() => {
                setIsOpen(false);
            }, 1000);
        }, 2000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className={`absolute inset-0 transition-all duration-300 ${
                    variant === 'CLASSIC' ? 'bg-slate-900/40 backdrop-blur-md' : 
                    variant === 'TERMINAL' ? 'bg-black' :
                    variant === 'PASSKEY' ? 'bg-[#f4f7ff]/90 backdrop-blur-2xl' :
                    'bg-[#030712]/80 backdrop-blur-xl'
                }`}
                onClick={() => setIsOpen(false)}
            />

            {/* DEV TOOL: Variant Selector Matrix */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2 flex flex-wrap justify-center gap-2 bg-black/40 backdrop-blur-xl p-2 rounded-2xl border border-white/10 z-50 shadow-2xl max-w-3xl">
                <button onClick={() => setVariant('CLASSIC')} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${variant === 'CLASSIC' ? 'bg-white text-black' : 'text-white/60 hover:text-white'}`}>V1: Klasik Form</button>
                <button onClick={() => setVariant('DARK_GLASS')} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${variant === 'DARK_GLASS' ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'text-white/60 hover:text-white'}`}>V2: Dark Glass</button>
                <button onClick={() => setVariant('QUANTUM_HUD')} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${variant === 'QUANTUM_HUD' ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'text-white/60 hover:text-white'}`}>V3: Quantum HUD</button>
                <div className="w-[1px] h-6 bg-white/20 mx-1 self-center"></div>
                <button onClick={() => setVariant('TERMINAL')} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${variant === 'TERMINAL' ? 'bg-green-500 text-black shadow-[0_0_15px_rgba(34,197,94,0.5)]' : 'text-green-500/60 border border-green-500/20 hover:text-green-400'}`}>V4: Terminal</button>
                <button onClick={() => setVariant('BIOMETRIC_HOLD')} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${variant === 'BIOMETRIC_HOLD' ? 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.5)]' : 'text-rose-500/60 border border-rose-500/20 hover:text-rose-400'}`}>V5: Biyometrik (Formsuz)</button>
                <button onClick={() => setVariant('PASSKEY')} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${variant === 'PASSKEY' ? 'bg-black text-white ring-2 ring-blue-500 shadow-2xl' : 'text-slate-800 bg-white/80 hover:bg-white'}`}>V6: Passkey Auto</button>
            </div>

            {/* Modal Container */}
            <div style={{ perspective: '1000px' }} className={`w-full mx-auto z-40 relative group animate-in fade-in zoom-in-95 duration-300 ${variant === 'TERMINAL' ? 'max-w-[700px]' : 'max-w-[380px]'}`}>
                
                {/* Background Glows for certain variants */}
                {variant === 'CLASSIC' && <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 rounded-3xl" />}
                {variant === 'DARK_GLASS' && <div className="absolute inset-0 bg-indigo-500 blur-[80px] opacity-40 group-hover:opacity-60 transition-opacity duration-500 rounded-full" />}
                {variant === 'QUANTUM_HUD' && (
                    <>
                        <div className="absolute inset-[-50px] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
                        <div className="absolute inset-0 bg-emerald-500 blur-[100px] opacity-30 animate-pulse rounded-full" />
                    </>
                )}
                {variant === 'BIOMETRIC_HOLD' && <div className="absolute inset-0 bg-rose-500 blur-[100px] opacity-20 rounded-full" />}

                {/* THE CARD */}
                <div 
                    ref={cardRef}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    className={`transition-all ease-out duration-200 w-full relative overflow-hidden ${
                        variant === 'CLASSIC' ? 'bg-white/90 backdrop-blur-2xl border border-white/60 rounded-xl p-8 shadow-[0_40px_80px_rgba(37,99,235,0.2)]'
                        : variant === 'DARK_GLASS' ? 'bg-[#0a0f1c]/70 backdrop-blur-3xl border border-white/10 rounded-2xl p-8 shadow-[0_0_50px_rgba(99,102,241,0.15)] ring-1 ring-white/5'
                        : variant === 'QUANTUM_HUD' ? 'bg-[#020617]/80 backdrop-blur-3xl border-t-2 border-t-emerald-500/50 border-x border-x-emerald-500/20 border-b border-b-emerald-500/10 rounded-3xl p-8 shadow-[0_0_50px_rgba(16,185,129,0.15)] clip-edges'
                        : variant === 'TERMINAL' ? 'bg-black/80 backdrop-blur-md border border-green-500/30 rounded-lg p-6 shadow-[0_0_40px_rgba(34,197,94,0.1)] font-mono'
                        : variant === 'BIOMETRIC_HOLD' ? 'bg-black/40 backdrop-blur-3xl border top border-white/5 rounded-[40px] p-10 shadow-[0_0_60px_rgba(244,63,94,0.1)] flex flex-col items-center justify-center min-h-[460px]'
                        : 'bg-white rounded-[32px] p-8 shadow-[0_40px_100px_rgba(0,0,0,0.15)] border border-slate-100 flex flex-col items-center' // PASSKEY
                    }`}
                    style={(variant === 'DARK_GLASS' || variant === 'QUANTUM_HUD') ? { transformStyle: 'preserve-3d' } : {}}
                >
                    {/* Close Button */}
                    <button 
                        onClick={() => setIsOpen(false)}
                        className={`absolute top-4 right-4 z-50 transition-colors p-1 ${variant === 'CLASSIC' || variant === 'PASSKEY' ? 'text-slate-400 hover:text-[#0E1528]' : 'text-white/40 hover:text-white'}`}
                        style={(variant === 'DARK_GLASS' || variant === 'QUANTUM_HUD') ? { transform: 'translateZ(40px)' } : {}}
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* ============================== */}
                    {/* VARIANT 4: THE TERMINAL        */}
                    {/* ============================== */}
                    {variant === 'TERMINAL' && (
                        <div className="text-green-500 text-sm md:text-base leading-relaxed tracking-wide min-h-[300px] flex flex-col justify-end">
                            <div className="absolute top-4 left-4 flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                                <div className="w-3 h-3 rounded-full bg-green-500/80 shadow-[0_0_10px_#22c55e]"></div>
                            </div>
                            
                            <div className="mb-4 text-green-500/50 font-bold border-b border-green-500/20 pb-2">
                                PERIODYANET SYSTEM SHELL v1.0.4<br/>
                                CLASSIFIED NETWORK AUTHORIZATION
                            </div>
                            
                            <div className="space-y-1">
                                {termLogs.map((log, i) => (
                                    <div key={i} className="animate-in slide-in-from-bottom-2 fade-in">{log}</div>
                                ))}
                            </div>
                            
                            {/* Inputs */}
                            {termStep === 2 && (
                                <div className="flex animate-pulse">
                                    <span className="mr-2">&gt;</span>
                                    <input 
                                        autoFocus
                                        type="text" 
                                        className="bg-transparent border-none outline-none text-green-500 w-full"
                                        value={termInput}
                                        onChange={e => setTermInput(e.target.value.toUpperCase())}
                                        onKeyDown={handleTerminalKeyDown}
                                    />
                                    <span className="w-2.5 h-5 bg-green-500 ml-1 block animate-[blink_1s_infinite]"></span>
                                </div>
                            )}

                            {termStep === 4 && (
                                <div className="flex">
                                    <span className="mr-2">&gt;</span>
                                    <input 
                                        autoFocus
                                        type="password" 
                                        className="bg-transparent border-none outline-none text-green-500 w-full tracking-[0.3em]"
                                        value={termPassword}
                                        onChange={e => setTermPassword(e.target.value)}
                                        onKeyDown={handleTerminalKeyDown}
                                    />
                                </div>
                            )}

                            {termStep === 5 && (
                                <div className="mt-4 text-center text-green-400 mix-blend-screen">
                                    <div className="w-16 h-16 mx-auto border-4 border-t-green-500 border-green-500/20 rounded-full animate-spin"></div>
                                    <div className="mt-4 animate-pulse">BYPASSING FIREWALL...</div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ============================== */}
                    {/* VARIANT 5: BIOMETRIC & NUMPAD  */}
                    {/* ============================== */}
                    {variant === 'BIOMETRIC_HOLD' && (
                        <div className="w-full h-full flex flex-col items-center justify-center">
                            {!showNumpad ? (
                                <>
                                    <h3 className="text-white text-xl font-bold mb-10 tracking-widest text-center uppercase">Giriş Yapmak İçin<br/>Parmak İzinize Basılı Tutun</h3>
                                    <div 
                                        className="relative w-40 h-40 flex items-center justify-center rounded-full cursor-pointer group"
                                        onMouseDown={startHold}
                                        onMouseUp={endHold}
                                        onMouseLeave={endHold}
                                        onTouchStart={startHold}
                                        onTouchEnd={endHold}
                                    >
                                        <div className="absolute inset-0 border-2 border-slate-700 rounded-full pointer-events-none"></div>
                                        {/* Progress Circle (Sweep) */}
                                        <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 100 100">
                                            <circle cx="50" cy="50" r="48" fill="none" className="stroke-rose-500 transition-all duration-75" strokeWidth="4" strokeDasharray={`${holdProgress * 3.01} 301`} />
                                        </svg>
                                        
                                        <div className={`w-28 h-28 bg-rose-500/10 rounded-full flex items-center justify-center transition-all ${holdProgress > 0 ? 'scale-90 bg-rose-500/30' : 'group-hover:bg-rose-500/20'}`}>
                                            <FingerprintIcon className={`w-14 h-14 ${holdProgress > 0 ? 'text-rose-400' : 'text-slate-400 group-hover:text-rose-300'} transition-colors`} />
                                        </div>
                                        
                                        {/* Particles flying out when generating progress */}
                                        {holdProgress > 0 && holdProgress < 100 && (
                                            <div className="absolute inset-[-20%] border border-rose-500/40 rounded-full animate-[ping_1s_infinite]"></div>
                                        )}
                                    </div>
                                    <p className="mt-10 text-slate-500 text-xs uppercase tracking-[0.2em]">{holdProgress}% Tarandı</p>
                                </>
                            ) : (
                                // THE HOLO NUMPAD
                                <div className="w-full flex w-full flex-col items-center animate-in zoom-in-95 fade-in duration-300">
                                    <h3 className="text-slate-300 text-sm font-bold tracking-[0.2em] uppercase mb-6">PİN KODUNUZU GİRİN</h3>
                                    
                                    {/* 4 Dots indicator */}
                                    <div className="flex gap-4 mb-10">
                                        {[0,1,2,3].map((idx) => (
                                            <div key={idx} className={`w-4 h-4 rounded-full border border-rose-500/50 transition-colors ${pinEntry.length > idx ? 'bg-rose-500 shadow-[0_0_15px_#f43f5e]' : 'bg-transparent'}`}></div>
                                        ))}
                                    </div>
                                    
                                    {/* Big Dial Pad */}
                                    <div className="grid grid-cols-3 gap-6 w-full max-w-[240px]">
                                        {[1,2,3,4,5,6,7,8,9].map((num) => (
                                            <button 
                                                key={num} 
                                                onClick={() => handleNumpad(num)}
                                                className="w-16 h-16 rounded-full border border-slate-700/50 text-white text-2xl font-light tracking-tighter hover:bg-rose-500/20 hover:border-rose-500/50 hover:shadow-[0_0_20px_rgba(244,63,94,0.3)] transition-all active:scale-95 flex items-center justify-center"
                                            >{num}</button>
                                        ))}
                                        <div></div>
                                        <button 
                                            onClick={() => handleNumpad(0)}
                                            className="w-16 h-16 rounded-full border border-slate-700/50 text-white text-2xl font-light tracking-tighter hover:bg-rose-500/20 hover:border-rose-500/50 hover:shadow-[0_0_20px_rgba(244,63,94,0.3)] transition-all active:scale-95 flex items-center justify-center"
                                        >0</button>
                                        <div></div>
                                    </div>

                                    {isConnecting && (
                                        <div className="absolute inset-0 bg-black/80 backdrop-blur flex items-center justify-center rounded-[40px]">
                                            <div className="text-rose-500 font-mono animate-pulse tracking-[0.3em]">OTORİZASYON...</div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ============================== */}
                    {/* VARIANT 6: PASSKEY (APPLE ID)  */}
                    {/* ============================== */}
                    {variant === 'PASSKEY' && (
                        <div className="w-full text-center flex flex-col items-center">
                            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-blue-500/30">
                                <ShieldCheck className="w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Periodya Hesabı</h2>
                            <p className="text-slate-500 text-sm mb-10">Parola girmeden, sadece cihazınızdaki biyometrik güvenlik (Face ID / Touch ID) ile güvenle bağlanın.</p>

                            <button 
                                onClick={triggerPasskey}
                                disabled={passkeyStatus !== 'IDLE'}
                                className={`w-full py-4 rounded-xl flex items-center justify-center gap-3 transition-all ${
                                    passkeyStatus === 'IDLE' 
                                        ? 'bg-black text-white font-bold hover:scale-[1.02] hover:shadow-2xl'
                                        : passkeyStatus === 'SCANNING'
                                        ? 'bg-slate-100 text-slate-500'
                                        : 'bg-green-500 text-white'
                                }`}
                            >
                                {passkeyStatus === 'IDLE' && (
                                    <>
                                        <ScanFace className="w-5 h-5" /> Biyometrik Giriş Yap
                                    </>
                                )}
                                {passkeyStatus === 'SCANNING' && (
                                    <>
                                        <div className="w-5 h-5 border-2 border-slate-400 border-t-slate-700 rounded-full animate-spin"></div>
                                        Sensör Bekleniyor...
                                    </>
                                )}
                                {passkeyStatus === 'SUCCESS' && (
                                    <>
                                        <Check className="w-5 h-5" /> Doğrulandı
                                    </>
                                )}
                            </button>
                            <button className="mt-4 text-xs font-bold text-slate-400 hover:text-blue-600">Başka Yöntem Kullan</button>
                        </div>
                    )}


                    {/* ============================== */}
                    {/* CLASSIC / DARK / QUANTUM FORMS */}
                    {/* ============================== */}
                    {(variant === 'CLASSIC' || variant === 'DARK_GLASS' || variant === 'QUANTUM_HUD') && (
                        <>
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
                                        <svg className="absolute inset-2 w-[calc(100%-16px)] h-[calc(100%-16px)] animate-[spin_3s_linear_infinite] opacity-80" viewBox="0 0 100 100">
                                            <circle cx="50" cy="50" r="48" fill="none" className="stroke-emerald-500/20" strokeWidth="2" strokeDasharray="10 10" />
                                            <path d="M 50 2 A 48 48 0 0 1 98 50" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
                                        </svg>
                                        <div className="absolute inset-0 border border-emerald-500/30 rounded-lg animate-[spin_10s_linear_infinite_reverse]"></div>
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

                            <form className="space-y-5 relative z-10" style={variant !== 'CLASSIC' ? { transform: 'translateZ(30px)' } : {}} onSubmit={(e) => { e.preventDefault(); runAuthSequence(); }}>
                                
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
                                            variant === 'CLASSIC' ? 'bg-[#2563EB] text-white rounded-sm shadow-lg hover:bg-blue-700 hover:-translate-y-0.5'
                                            : variant === 'DARK_GLASS' ? 'bg-indigo-600 text-white rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:bg-indigo-500 border border-indigo-400/20 hover:-translate-y-1'
                                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/50 mt-6 rounded-md hover:bg-emerald-500/20 hover:text-emerald-300 font-mono tracking-wider shadow-[inset_0_0_15px_rgba(16,185,129,0.2)]'
                                        }`}>
                                            {variant === 'QUANTUM_HUD' ? 'AĞA BAĞLAN' : 'Sisteme Giriş Yap'} <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </>
                                )}
                            </form>

                            {variant === 'CLASSIC' && <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />}
                            {variant === 'DARK_GLASS' && <div className="absolute inset-0 pointer-events-none rounded-2xl ring-1 ring-inset ring-white/10" />}
                        </>
                    )}

                </div>

                <style>{`
                    @keyframes scan {
                        0% { transform: translateY(0); }
                        100% { transform: translateY(60px); }
                    }
                    @keyframes blink {
                        0%, 100% { opacity: 1; }
                        50% { opacity: 0; }
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
