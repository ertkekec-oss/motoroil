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
        <div className="min-h-screen flex items-center justify-center bg-[#f1f5f9] p-4 sm:p-6 lg:p-8 font-sans selection:bg-blue-100 selection:text-blue-900 relative">
            
            {/* Background Decor */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/5 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/5 blur-[120px]" />
            </div>

            {/* Main Floating Container */}
            <div className="w-full max-w-[1040px] bg-white rounded-[24px] sm:rounded-[32px] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col md:flex-row min-h-[620px] relative z-10 border border-slate-200/60">
                
                {/* LEFT SIDE - Brand & Pitch */}
                <div className="w-full md:w-[45%] bg-[#0a1124] p-10 lg:p-14 flex flex-col justify-between relative overflow-hidden hidden md:flex">
                    {/* Deep Grid Background */}
                    <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-600/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-600/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-16">
                            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                                <span className="text-white font-bold text-lg leading-none">P</span>
                            </div>
                            <span className="text-white font-bold text-xl tracking-wide">
                                PERIODY<span className="text-blue-500">A</span>
                                <span className="ml-2 text-xs opacity-60 font-medium tracking-[0.2em] uppercase">B2B</span>
                            </span>
                        </div>

                        <div className="space-y-6">
                            <h1 className="text-[32px] lg:text-[40px] font-semibold text-white leading-[1.15] tracking-tight">
                                Operasyonu değil,<br />büyümeyi düşünün.
                            </h1>
                            <p className="text-slate-400 text-[15px] leading-relaxed max-w-[300px]">
                                Kurumsal ticaret merkezimizle ödemelerinizi, siparişlerinizi ve envanterinizi saniyeler içinde yönetin.
                            </p>
                        </div>
                    </div>

                    <div className="relative z-10 mt-12 bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 backdrop-blur-md">
                        <div className="flex items-center gap-3 mb-3">
                            <ShieldCheck className="w-5 h-5 text-blue-400" />
                            <span className="text-white font-medium text-sm">Uçtan Uca Şifreleme</span>
                        </div>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Verileriniz KVKK standartlarına uygun olarak en üst düzey bulut güvenliğiyle korunmaktadır.
                        </p>
                    </div>
                </div>

                {/* RIGHT SIDE - Form */}
                <div className="w-full md:w-[55%] p-8 sm:p-12 lg:p-16 flex flex-col justify-center bg-white relative">
                    
                    {/* Mobile Header (Only visible on small screens) */}
                    <div className="flex items-center gap-2 mb-10 md:hidden">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-base leading-none">P</span>
                        </div>
                        <span className="text-slate-900 font-bold text-lg tracking-wide">
                            PERIODY<span className="text-blue-600">A</span>
                            <span className="ml-2 text-[10px] text-slate-500 font-bold tracking-widest uppercase">B2B</span>
                        </span>
                    </div>

                    <div className="w-full max-w-[380px] mx-auto">
                        <div className="mb-10">
                            <h2 className="text-[28px] font-bold text-slate-900 mb-3 tracking-tight">Hoş Geldiniz</h2>
                            <p className="text-slate-500 text-[15px]">Tedarikçi portalına erişmek için giriş yapın.</p>
                        </div>

                        {/* Alerts */}
                        {error && (
                            <div className="mb-6 p-4 rounded-xl bg-red-50/80 border border-red-100 flex items-start gap-3">
                                <div className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                                    <span className="text-red-600 text-[11px] font-bold">!</span>
                                </div>
                                <p className="text-sm text-red-700 font-medium leading-relaxed">
                                    {error}
                                </p>
                            </div>
                        )}

                        {success && (
                            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start gap-3">
                                <ShieldCheck className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                                <p className="text-sm text-emerald-700 font-medium leading-relaxed">
                                    {success}
                                </p>
                            </div>
                        )}

                        <form onSubmit={handleLogin} className="space-y-6">
                            
                            {/* Email Input */}
                            <div className="space-y-2">
                                <label className="text-[13px] font-bold text-slate-700 uppercase tracking-wide" htmlFor="email">E-Posta Adresi</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail className="h-[18px] w-[18px] text-slate-400 group-focus-within:text-blue-600 transition-colors" strokeWidth={2} />
                                    </div>
                                    <input
                                        id="email"
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-3.5 text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                                        placeholder="ornek@sirket.com"
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            {/* Password Input */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-[13px] font-bold text-slate-700 uppercase tracking-wide" htmlFor="password">Şifre</label>
                                    <a href="#" className="text-[13px] text-blue-600 font-medium hover:text-blue-700 transition-colors">
                                        Şifremi unuttum
                                    </a>
                                </div>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock className="h-[18px] w-[18px] text-slate-400 group-focus-within:text-blue-600 transition-colors" strokeWidth={2} />
                                    </div>
                                    <input
                                        id="password"
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-3.5 text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium tracking-wide shadow-sm"
                                        placeholder="••••••••"
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !tenantId}
                                className="w-full h-[52px] bg-slate-900 hover:bg-slate-800 text-white font-medium text-[15px] rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-2 flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20 active:scale-[0.98]"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin text-white" />
                                        <span>Giriş Yapılıyor...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Giriş Yap</span>
                                        <ArrowRight className="w-4 h-4 ml-1 opacity-80" strokeWidth={2.5} />
                                    </>
                                )}
                            </button>

                        </form>

                        {/* Footer text */}
                        <div className="mt-10 text-center">
                            <p className="text-[13px] text-slate-500 flex items-center justify-center gap-1.5 font-medium">
                                <Building2 className="w-4 h-4" /> B2B Portal Altyapısı
                            </p>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}
