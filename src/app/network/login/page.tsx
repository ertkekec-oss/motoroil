"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight, ShieldCheck, Loader2, Server, Network } from "lucide-react";

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
        <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#f8fafc] font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
            {/* SOL PANEL (Brand & Info) - 40% */}
            <div className="hidden md:flex flex-col w-[40%] bg-slate-900 p-12 relative overflow-hidden justify-between border-r border-slate-800">
                {/* Subtle Grid Background */}
                <div 
                    className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                    style={{ backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}
                    aria-hidden="true" 
                />
                
                {/* Brand Logo Top */}
                <div className="relative z-10">
                    <img 
                        src="/periodya-enterprise-logo.png" 
                        alt="Periodya Enterprise" 
                        className="h-10 w-auto" 
                    />
                </div>

                {/* Main Content */}
                <div className="relative z-10 max-w-sm mt-12 mb-auto">
                    <h1 className="text-3xl font-semibold text-white tracking-tight mb-8">
                        Kurumsal Ticaret Altyapısı
                    </h1>
                    
                    <div className="space-y-6">
                        <div className="flex items-start gap-4">
                            <div className="mt-1 w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                                <ShieldCheck className="w-5 h-5 text-blue-400" strokeWidth={1.5} />
                            </div>
                            <div>
                                <h3 className="font-medium text-slate-200">Güvenli şirket ağı</h3>
                                <p className="text-sm text-slate-400 mt-1">Uçtan uca doğrulanmış bayi ve distribütör ekosistemi.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="mt-1 w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                                <Network className="w-5 h-5 text-blue-400" strokeWidth={1.5} />
                            </div>
                            <div>
                                <h3 className="font-medium text-slate-200">Akıllı ticaret eşleşmesi</h3>
                                <p className="text-sm text-slate-400 mt-1">Özelleştirilmiş fiyatlamalar ve kapasite bazlı routing.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="mt-1 w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                                <Server className="w-5 h-5 text-blue-400" strokeWidth={1.5} />
                            </div>
                            <div>
                                <h3 className="font-medium text-slate-200">Kurumsal işlem altyapısı</h3>
                                <p className="text-sm text-slate-400 mt-1">Sınırsız ölçeklenebilir altyapı ile kesintisiz B2B ticaret.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Left */}
                <div className="relative z-10 text-xs text-slate-500">
                    {new Date().getFullYear()} © Periodya Enterprise. Tüm hakları saklıdır.
                </div>
            </div>

            {/* SAĞ PANEL (Login Form) - 60% */}
            <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 relative bg-[#f8fafc]">
                
                {/* Mobile/Top Logo */}
                <div className="md:absolute md:top-12 md:left-12 mb-8 md:mb-0">
                    <img 
                        src="/periodya-enterprise-logo.png" 
                        alt="Periodya Enterprise" 
                        className="h-8 w-auto md:opacity-40 md:grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300" 
                    />
                </div>

                {/* Login Card */}
                <div className="w-full max-w-[440px] bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 p-8 sm:p-10 relative">
                    
                    {/* Header Details */}
                    <div className="mb-8">
                        <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-6 shadow-sm">
                            <ShieldCheck className="w-6 h-6 text-blue-600" strokeWidth={1.5} />
                        </div>
                        <h2 className="text-2xl font-semibold text-slate-900 tracking-tight mb-2">
                            İşlem Merkezi
                        </h2>
                        <p className="text-[15px] text-slate-500">
                            Kurumsal ticaret ağına güvenli erişim
                        </p>
                    </div>

                    {/* Alerts */}
                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200/60 flex items-start gap-3">
                            <div className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center">
                                <span className="text-rose-600 text-[11px] font-bold">!</span>
                            </div>
                            <p className="text-[14px] text-rose-700 leading-relaxed font-medium">
                                {error}
                            </p>
                        </div>
                    )}

                    {success && (
                        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-start gap-3">
                            <ShieldCheck className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                            <p className="text-[14px] text-emerald-700 leading-relaxed font-medium">
                                {success}
                            </p>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[13px] font-medium text-slate-700" htmlFor="email">E-Posta Adresi</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" strokeWidth={1.5} />
                                </div>
                                <input
                                    id="email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-white border border-slate-300 rounded-xl pl-11 pr-4 py-3 text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all shadow-sm"
                                    placeholder="ornek@sirket.com"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-[13px] font-medium text-slate-700" htmlFor="password">Şifre</label>
                                <a href="#" className="text-[13px] text-blue-600 font-medium hover:text-blue-700 transition-colors">
                                    Şifremi unuttum
                                </a>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" strokeWidth={1.5} />
                                </div>
                                <input
                                    id="password"
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-white border border-slate-300 rounded-xl pl-11 pr-4 py-3 text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all shadow-sm tracking-wide"
                                    placeholder="••••••••"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !tenantId}
                            className="w-full h-[52px] bg-blue-600 hover:bg-blue-700 text-white font-medium text-[15px] rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6 flex items-center justify-center gap-2 group active:scale-[0.98]"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                                    <span>Kimlik Doğrulanıyor...</span>
                                </>
                            ) : (
                                <>
                                    <span>Sisteme Giriş Yap</span>
                                    <ArrowRight className="w-4 h-4 text-white/80 group-hover:translate-x-1 group-hover:text-white transition-all" />
                                </>
                            )}
                        </button>
                    </form>
                    
                    {/* B2B Status under form */}
                    <div className="mt-8 flex items-center justify-center gap-2 text-slate-400">
                        <ShieldCheck className="w-4 h-4" strokeWidth={2} />
                        <span className="text-[13px] font-medium">Kurumsal B2B</span>
                    </div>

                </div>

                {/* Optional Mobile Footer */}
                <div className="mt-10 md:hidden text-center text-xs text-slate-500">
                    {new Date().getFullYear()} © Periodya Enterprise. Tüm hakları saklıdır.
                </div>
            </div>
        </div>
    );
}
