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
                setSuccess("Kimlik doğrulandı. İşlem merkezine yönlendiriliyorsunuz...");
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
        <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#f6f8fb] font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900 items-stretch">
            {/* SOL PANEL (Blue Gradient Background) - 40% */}
            <div className="hidden md:flex flex-col w-[35%] lg:w-[40%] bg-gradient-to-b from-[#1a55a8] to-[#0a2f6b] p-12 lg:p-16 relative justify-center border-r border-[#144283] overflow-hidden">
                {/* Abstract Background Elements mimicking the image */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-400/20 via-transparent to-transparent pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 h-1/2 opacity-30 bg-gradient-to-t from-white/10 to-transparent pointer-events-none" />
                
                {/* Network / Glow lines simulation via CSS */}
                <div className="absolute bottom-[0%] left-[-20%] w-[140%] h-[60%] border-t-[2px] border-white/5 rounded-[100%] pointer-events-none transform rotate-12" />
                <div className="absolute bottom-[5%] left-[-10%] w-[120%] h-[50%] border-t-[1px] border-white/10 rounded-[100%] pointer-events-none transform -rotate-6" />
                <div className="absolute bottom-[15%] left-[-30%] w-[150%] h-[40%] border-t-[1px] border-white/5 rounded-[100%] pointer-events-none transform -rotate-2" />

                <div className="relative z-10 max-w-[340px]">
                    <h1 className="text-3xl lg:text-4xl font-semibold text-white tracking-tight leading-snug mb-10">
                        Kurumsal<br/>Ticaret Altyapısı
                    </h1>
                    
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-6 h-6 rounded-full bg-transparent border border-white/40 flex items-center justify-center shrink-0">
                                <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                            </div>
                            <h3 className="font-medium text-[16px] text-white/95">Güvenli şirket ağı</h3>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="w-6 h-6 rounded-full bg-transparent border border-white/40 flex items-center justify-center shrink-0">
                                <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                            </div>
                            <h3 className="font-medium text-[16px] text-white/95">Akıllı ticaret eşleşmesi</h3>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="w-6 h-6 rounded-full bg-transparent border border-white/40 flex items-center justify-center shrink-0">
                                <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                            </div>
                            <h3 className="font-medium text-[16px] text-white/95">Kurumsal işlem altyapısı</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* SAĞ PANEL (Login Form) - 60% */}
            <div className="flex-1 flex flex-col justify-center items-center p-6 relative">
                
                {/* Subtle Dot Pattern */}
                <div 
                    className="absolute inset-0 opacity-[0.4] pointer-events-none" 
                    style={{ backgroundImage: "radial-gradient(#cbd5e1 1.2px, transparent 1.2px)", backgroundSize: "24px 24px" }} 
                />

                {/* Logo Top Center */}
                <div className="relative z-10 mb-8 mt-[-20px] bg-white/50 px-6 py-2 rounded-xl backdrop-blur-md border border-white/20">
                    <img 
                        src="/periodya-enterprise-logo.png" 
                        alt="Periodya Enterprise" 
                        className="h-7 sm:h-8 w-auto mix-blend-multiply" 
                    />
                </div>

                {/* Login Card */}
                <div className="w-full max-w-[420px] bg-white rounded-[24px] shadow-[0_15px_50px_rgba(0,0,0,0.06)] border border-white/50 p-8 sm:p-10 relative z-10">
                    
                    {/* Header Details */}
                    <div className="flex flex-col items-center text-center mb-8">
                        <div className="w-[60px] h-[60px] rounded-[18px] bg-gradient-to-br from-[#2a68c4] to-[#124290] flex items-center justify-center mb-5 shadow-[0_8px_16px_rgba(42,104,196,0.3)] border border-[#3a78eb] relative">
                             {/* Glimmer effect inside shield box */}
                             <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 rounded-[18px] opacity-50" />
                            <ShieldCheck className="w-8 h-8 text-white relative z-10" strokeWidth={1.5} />
                        </div>
                        <h2 className="text-[22px] font-semibold text-slate-800 tracking-tight mb-1.5">
                            İşlem Merkezi
                        </h2>
                        <p className="text-[14px] text-slate-500 font-medium tracking-wide">
                            Kurumsal ticaret ağına güvenli erişim
                        </p>
                    </div>

                    {/* Alerts (Error/Success rendering above the inner grey box if needed) */}
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

                    {/* Inner Grey Form Box container as in image */}
                    <div className="bg-[#f8f9fb] rounded-[20px] p-6 sm:p-7 border border-slate-100/80">
                        <form onSubmit={handleLogin} className="space-y-4">
                            
                            {/* Email Input */}
                            <div className="space-y-1.5">
                                <label className="text-[12px] font-bold text-slate-800 tracking-wide" htmlFor="email">E-Posta Adresi</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <Mail className="h-[18px] w-[18px] text-slate-400 group-focus-within:text-[#2a68c4] transition-colors" strokeWidth={2} />
                                    </div>
                                    <input
                                        id="email"
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-transparent border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#2a68c4] focus:ring-1 focus:ring-[#2a68c4] transition-all"
                                        placeholder="ornek@sirket.com"
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            {/* Password Input */}
                            <div className="space-y-1.5 pt-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-[12px] font-bold text-slate-800 tracking-wide" htmlFor="password">Şifre</label>
                                    <a href="#" className="text-[12px] text-[#2a68c4] font-medium hover:text-[#124290] transition-colors">
                                        Şifremi unuttum
                                    </a>
                                </div>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <Lock className="h-[18px] w-[18px] text-slate-400 group-focus-within:text-[#2a68c4] transition-colors" strokeWidth={2} />
                                    </div>
                                    <input
                                        id="password"
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-transparent border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#2a68c4] focus:ring-1 focus:ring-[#2a68c4] transition-all tracking-wide"
                                        placeholder="••••••••"
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !tenantId}
                                className="w-full h-[48px] bg-[#316ec5] hover:bg-[#124290] text-white font-medium text-[14px] rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6 flex items-center justify-center gap-2 shadow-md focus:ring-2 focus:ring-[#2a68c4] focus:ring-offset-2 active:scale-[0.98]"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                                        <span>Giriş Yapılıyor...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Sisteme Giriş Yap</span>
                                        <ArrowRight className="w-4 h-4 ml-1" strokeWidth={2.5} />
                                    </>
                                )}
                            </button>

                            {/* Footer Badge inside inner box */}
                            <div className="pt-4 flex items-center justify-center gap-2">
                                <div className="w-[18px] h-[18px] rounded-full bg-[#316ec5] flex items-center justify-center">
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
