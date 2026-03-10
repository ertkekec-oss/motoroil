"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight, ShieldCheck, Loader2, Check } from "lucide-react";

export default function DealerNetworkLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [tenantId, setTenantId] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        // Try to fetch the tenantId of the current platform/supplier
        fetch("/api/system/public/info")
            .then((res) => res.json())
            .then((data) => {
                if (data.tenantId) {
                    setTenantId(data.tenantId);
                } else {
                    setTenantId("motoroils"); // Hardcoded fallback for demo
                }
            })
            .catch(() => setTenantId("motoroils"));
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/network/auth/password/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: email.trim(),
                    password,
                    supplierTenantId: tenantId || "motoroils"
                })
            });

            const data = await res.json();

            if (data.ok) {
                setSuccess("Kimlik doğrulandı. Yönlendiriliyorsunuz...");
                setTimeout(() => {
                    const isCustomSubdomain = window.location.hostname !== 'periodya.com' && window.location.hostname !== 'www.periodya.com' && !window.location.hostname.includes('localhost') || window.location.hostname.includes('b2b.localhost');
                    router.push(isCustomSubdomain ? '/dashboard' : '/network/dashboard');
                }, 1000);
            } else {
                if (data.error === "NOT_FOUND_OR_NO_PASSWORD" || data.error === "INVALID_CREDENTIALS") {
                    setError("E-posta veya şifre hatalı. Lütfen bilgilerinizi kontrol edin.");
                } else if (data.error === "NO_ACTIVE_MEMBERSHIP_FOR_TENANT") {
                    setError("Bu platformda aktif bir yetkilendirmeniz bulunmuyor.");
                } else if (data.error === "RATE_LIMITED") {
                    setError(`Çok fazla deneme yaptınız. Lütfen ${data.retryAfterSec} saniye bekleyin.`);
                } else {
                    setError("Giriş reddedildi. [" + data.error + "]");
                }
            }
        } catch (err) {
            setError("Sunucu ile iletişim kurulamadı. Lütfen tekrar deneyin.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col md:flex-row min-h-screen md:h-screen w-full bg-[#f4f6fa] font-sans text-slate-900 md:overflow-hidden items-stretch">
            
            {/* SOL PANEL (Blue Panel) - Takes full height, fixed width on desktop */}
            <div className="flex-none w-full md:w-[40%] bg-gradient-to-br from-[#1753a8] to-[#0a2f6b] p-12 lg:p-20 relative flex flex-col justify-center border-r border-[#124283] overflow-hidden">
                
                {/* Subtle curve/mesh shapes for background */}
                <div className="absolute inset-x-0 bottom-0 h-2/3 pointer-events-none opacity-20">
                    <svg viewBox="0 0 800 600" preserveAspectRatio="none" className="w-full h-full">
                        <path d="M0,400 Q200,300 400,450 T800,350 L800,600 L0,600 Z" fill="rgba(255,255,255,0.1)"></path>
                        <path d="M0,500 Q250,400 500,500 T800,400 L800,600 L0,600 Z" fill="rgba(255,255,255,0.05)"></path>
                    </svg>
                </div>
                {/* Extra intersecting curved lines */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
                    <div className="absolute w-[150%] h-[150%] top-[-25%] left-[-25%] border-[1px] border-white rounded-[50%]" />
                    <div className="absolute w-[120%] h-[120%] top-[10%] left-[-10%] border-[1px] border-white rounded-[50%]" />
                </div>

                <div className="relative z-10 w-full max-w-[360px] mx-auto">
                    <h1 className="text-[34px] lg:text-[40px] font-semibold text-white tracking-tight leading-[1.2] mb-12">
                        Kurumsal<br/>Ticaret Altyapısı
                    </h1>
                    
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-[22px] h-[22px] rounded-full border border-white/50 flex items-center justify-center shrink-0">
                                <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                            </div>
                            <h3 className="font-medium text-[16px] text-white">Güvenli şirket ağı</h3>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="w-[22px] h-[22px] rounded-full border border-white/50 flex items-center justify-center shrink-0">
                                <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                            </div>
                            <h3 className="font-medium text-[16px] text-white">Akıllı ticaret eşleşmesi</h3>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="w-[22px] h-[22px] rounded-full border border-white/50 flex items-center justify-center shrink-0">
                                <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                            </div>
                            <h3 className="font-medium text-[16px] text-white">Kurumsal işlem altyapısı</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* SAĞ PANEL (Login Area) */}
            <div className="flex-1 relative flex flex-col justify-center items-center p-6 min-h-[600px] overflow-y-auto">
                
                {/* Dot Pattern Full Background */}
                <div 
                    className="absolute inset-0 opacity-[0.5] pointer-events-none" 
                    style={{ backgroundImage: "radial-gradient(#d1d5db 1.2px, transparent 1.2px)", backgroundSize: "24px 24px" }} 
                />

                <div className="w-full max-w-[420px] relative z-10 flex flex-col items-center">
                    
                    {/* Simulated Logo (To avoid broken image link) */}
                    <div className="mb-10 flex items-center gap-3 select-none">
                        {/* Logo Icon */}
                        <div className="w-[42px] h-[42px] bg-[#1a55a8] rounded-[10px] flex items-center justify-center shadow-md">
                            <div className="w-6 h-6 border-[2px] border-white/90 rounded-[4px] relative flex items-center justify-center">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                                </svg>
                            </div>
                        </div>
                        {/* Logo Text */}
                        <div className="flex flex-col justify-center">
                            <span className="text-[22px] font-black text-[#14234b] tracking-tight leading-none uppercase">Periodya</span>
                            <span className="text-[11px] font-bold text-[#2a68c4] tracking-[0.2em] leading-tight">ENTERPRISE</span>
                        </div>
                    </div>

                    {/* Main Login Card */}
                    <div className="w-full bg-white rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.06)] p-10 sm:p-12 border border-black/[0.03]">
                        
                        {/* Header Details */}
                        <div className="flex flex-col items-center text-center mb-8">
                            <div className="w-14 h-14 rounded-[14px] bg-[#1a55a8] flex items-center justify-center mb-5 shadow-[0_8px_16px_rgba(26,85,168,0.25)]">
                                <ShieldCheck className="w-[26px] h-[26px] text-white" strokeWidth={1.5} />
                            </div>
                            <h2 className="text-[22px] font-semibold text-slate-900 tracking-tight mb-1.5">
                                İşlem Merkezi
                            </h2>
                            <p className="text-[14px] text-slate-500 font-medium">
                                Kurumsal ticaret ağına güvenli erişim
                            </p>
                        </div>

                        {/* Alerts */}
                        {error && (
                            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200/60 flex items-start gap-3">
                                <div className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center">
                                    <span className="text-rose-600 text-[11px] font-bold">!</span>
                                </div>
                                <p className="text-[13px] text-rose-700 leading-relaxed font-medium">
                                    {error}
                                </p>
                            </div>
                        )}

                        {success && (
                            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-start gap-3">
                                <ShieldCheck className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                                <p className="text-[13px] text-emerald-700 leading-relaxed font-medium">
                                    {success}
                                </p>
                            </div>
                        )}

                        <form onSubmit={handleLogin} className="space-y-5">
                            
                            {/* Email Input */}
                            <div className="space-y-2">
                                <label className="text-[13px] font-bold text-slate-800 tracking-wide" htmlFor="email">E-Posta Adresi</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-[#1a55a8] transition-colors" strokeWidth={1.5} />
                                    </div>
                                    <input
                                        id="email"
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-[#f8f9fb] border border-slate-200 rounded-xl pl-11 pr-4 py-3.5 text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1a55a8] focus:ring-1 focus:ring-[#1a55a8] transition-all"
                                        placeholder="ornek@sirket.com"
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            {/* Password Input */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-[13px] font-bold text-slate-800 tracking-wide" htmlFor="password">Şifre</label>
                                    <a href="#" className="text-[12px] text-[#1a55a8] font-medium hover:text-[#0a2f6b] transition-colors">
                                        Şifremi unuttum
                                    </a>
                                </div>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-[#1a55a8] transition-colors" strokeWidth={1.5} />
                                    </div>
                                    <input
                                        id="password"
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-[#f8f9fb] border border-slate-200 rounded-xl pl-11 pr-4 py-3.5 text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1a55a8] focus:ring-1 focus:ring-[#1a55a8] transition-all tracking-wide"
                                        placeholder="••••••••"
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading || !tenantId}
                                className="w-full h-[52px] bg-[#1a55a8] hover:bg-[#124290] text-white font-medium text-[15px] rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 flex items-center justify-center gap-2 active:scale-[0.98] shadow-sm"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin text-white" />
                                        <span>Giriş Yapılıyor...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Sisteme Giriş Yap</span>
                                        <ArrowRight className="w-4 h-4 ml-1" strokeWidth={2} />
                                    </>
                                )}
                            </button>
                            
                            {/* Footer Badge inside card */}
                            <div className="pt-4 flex items-center justify-center gap-2">
                                <div className="w-[18px] h-[18px] rounded-full bg-[#1b93f1] flex items-center justify-center shadow-sm">
                                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                                </div>
                                <span className="text-[13px] font-medium text-slate-600">Kurumsal B2B</span>
                            </div>

                        </form>
                    </div>

                </div>
            </div>
        </div>
    );
}
