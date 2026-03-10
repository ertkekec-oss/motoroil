"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight, ShieldCheck, Loader2, Building2 } from "lucide-react";

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
        <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4 sm:p-6 lg:p-8 font-sans selection:bg-blue-100 selection:text-blue-900 relative">
            
            {/* Subtle Enterprise Background Decor */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[10%] left-[10%] w-[30%] h-[30%] rounded-full bg-blue-50 blur-[100px]" />
                <div className="absolute bottom-[10%] right-[10%] w-[30%] h-[30%] rounded-full bg-slate-100 blur-[100px]" />
            </div>

            {/* Central Corporate Card */}
            <div className="w-full max-w-[460px] bg-white rounded-[24px] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.06)] border border-slate-100 p-8 sm:p-12 relative z-10 flex flex-col">
                
                {/* Logo & Header */}
                <div className="flex flex-col items-center justify-center mb-10">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-[14px] flex items-center justify-center shadow-[0_8px_16px_-6px_rgba(37,99,235,0.4)] mb-5">
                        <span className="text-white font-black text-2xl leading-none">P</span>
                    </div>
                    <div className="text-center">
                        <h1 className="text-slate-900 font-extrabold text-[28px] tracking-tight mb-1">
                            PERIODY<span className="text-blue-600">A</span>
                        </h1>
                        <div className="flex items-center justify-center gap-2">
                            <span className="text-slate-500 text-[13px] font-medium tracking-wide">Business To Business</span>
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[10px] font-bold tracking-widest uppercase border border-blue-100">
                                Portal
                            </span>
                        </div>
                    </div>
                </div>

                {/* Alerts */}
                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                        <div className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                            <span className="text-red-800 text-[11px] font-bold">!</span>
                        </div>
                        <p className="text-[13.px] text-red-800 font-semibold leading-relaxed">
                            {error}
                        </p>
                    </div>
                )}

                {success && (
                    <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                        <ShieldCheck className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                        <p className="text-[13.5px] text-emerald-800 font-semibold leading-relaxed">
                            {success}
                        </p>
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                    
                    {/* Email Input */}
                    <div className="space-y-1.5">
                        <label className="text-[12px] font-bold text-slate-500 uppercase tracking-widest ml-1" htmlFor="email">Kurumsal E-Posta</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" strokeWidth={2} />
                            </div>
                            <input
                                id="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white border border-transparent focus:border-blue-500 rounded-xl pl-12 pr-4 py-3.5 text-[15px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                                placeholder="E-posta adresiniz"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {/* Password Input */}
                    <div className="space-y-1.5 pt-2">
                        <div className="flex items-center justify-between ml-1">
                            <label className="text-[12px] font-bold text-slate-500 uppercase tracking-widest" htmlFor="password">Güvenlik Şifresi</label>
                            <a href="#" className="text-[12px] text-blue-600 font-bold hover:text-blue-700 transition-colors">
                                Şifremi unuttum
                            </a>
                        </div>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" strokeWidth={2} />
                            </div>
                            <input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white border border-transparent focus:border-blue-500 rounded-xl pl-12 pr-4 py-3.5 text-[15px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all tracking-wide"
                                placeholder="••••••••"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !tenantId}
                        className="w-full h-[52px] bg-slate-900 hover:bg-slate-800 text-white font-bold text-[14px] uppercase tracking-wider rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-6 flex items-center justify-center gap-2 shadow-[0_6px_20px_rgba(15,23,42,0.15)] active:scale-[0.98] border border-slate-900"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin text-white" />
                                <span>Giriş Yapılıyor...</span>
                            </>
                        ) : (
                            <>
                                <span>PORTALA GİRİŞ YAP</span>
                                <ArrowRight className="w-4 h-4 ml-1 opacity-80" strokeWidth={2.5} />
                            </>
                        )}
                    </button>

                </form>

                {/* Footer text */}
                <div className="mt-10 pt-6 border-t border-slate-100 text-center">
                    <p className="text-[12px] text-slate-400 flex items-center justify-center gap-1.5 font-semibold">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" /> Uçtan uca şifrelenmiş B2B bağlantısı
                    </p>
                </div>

            </div>
        </div>
    );
}
