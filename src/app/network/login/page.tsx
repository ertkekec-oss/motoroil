"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';

export default function DealerNetworkLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [tenantId, setTenantId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        // Try to fetch the tenantId of the current platform/supplier
        fetch('/api/system/public/info')
            .then(res => res.json())
            .then(data => {
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
        setError('');

        try {
            const res = await fetch('/api/network/auth/password/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email.trim(),
                    password,
                    supplierTenantId: tenantId || "motoroils"
                })
            });

            const data = await res.json();

            if (data.ok) {
                setSuccess('Kimlik doğrulandı. İşlem merkezine yönlendiriliyorsunuz...');
                setTimeout(() => {
                    const isCustomSubdomain = window.location.hostname !== 'periodya.com' && window.location.hostname !== 'www.periodya.com' && !window.location.hostname.includes('localhost') || window.location.hostname.includes('b2b.localhost');
                    router.push(isCustomSubdomain ? '/dashboard' : '/network/dashboard');
                }, 1000);
            } else {
                if (data.error === 'NOT_FOUND_OR_NO_PASSWORD' || data.error === 'INVALID_CREDENTIALS') {
                    setError('E-posta veya şifre hatalı. Lütfen bilgilerinizi kontrol edin.');
                } else if (data.error === 'NO_ACTIVE_MEMBERSHIP_FOR_TENANT') {
                    setError('Bu platformda aktif bir yetkilendirmeniz bulunmuyor.');
                } else if (data.error === 'RATE_LIMITED') {
                    setError(`Çok fazla deneme yaptınız. Lütfen ${data.retryAfterSec} saniye bekleyin.`);
                } else {
                    setError('Giriş reddedildi. [' + data.error + ']');
                }
            }
        } catch (err) {
            setError('Sunucu ile iletişim kurulamadı. Lütfen tekrar deneyin.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] flex relative overflow-hidden font-sans selection:bg-blue-500/30">
            {/* Minimal Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[130px] rounded-full" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[130px] rounded-full" />
                <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] bg-sky-500/5 blur-[100px] rounded-full mix-blend-screen" />
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-6 z-10 w-full">
                
                {/* Main Card Container */}
                <div className="w-full max-w-[420px] animate-in fade-in slide-in-from-bottom-8 duration-700">
                    
                    {/* Header Details */}
                    <div className="mb-10 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#0f172a] border border-white/5 shadow-xl mb-6 ring-1 ring-white/10 relative group">
                            <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white relative z-10 shadow-inner">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                        </div>
                        <h1 className="text-[28px] font-semibold text-white tracking-tight mb-2">
                            İşlem Merkezi
                        </h1>
                        <p className="text-slate-400 text-[14px]">
                            Kurumsal hizmet ağına güvenle giriş yapın
                        </p>
                    </div>

                    {/* Login Card */}
                    <div className="bg-[#0f172a]/90 backdrop-blur-2xl rounded-[24px] p-8 shadow-2xl border border-white/[0.05] relative overflow-hidden ring-1 ring-white/[0.02]">
                        
                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.01] via-white/[0.03] to-transparent pointer-events-none" />

                        {error && (
                            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[13px] p-4 rounded-xl mb-6 flex items-start gap-3 animate-in fade-in zoom-in-95 backdrop-blur-md">
                                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <span className="leading-relaxed">{error}</span>
                            </div>
                        )}

                        {success && (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[13px] p-4 rounded-xl mb-6 flex items-start gap-3 animate-in fade-in zoom-in-95 backdrop-blur-md">
                                <ShieldCheck className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <span className="leading-relaxed">{success}</span>
                            </div>
                        )}

                        <form onSubmit={handleLogin} className="space-y-5 relative z-10">
                            
                            <div className="space-y-2">
                                <label className="text-[12px] font-medium text-slate-400 ml-1">E-Posta Adresi</label>
                                <div className="relative group/mail">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-slate-500 group-focus-within/mail:text-blue-500 transition-colors" />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-[#020617]/50 border border-slate-800 rounded-xl pl-11 pr-4 py-3.5 text-[14px] text-white placeholder-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:bg-[#020617] transition-all"
                                        placeholder="ornek@sirket.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between ml-1">
                                    <label className="text-[12px] font-medium text-slate-400">Şifre</label>
                                    <a href="#" className="text-[12px] text-blue-500 hover:text-blue-400 transition-colors opacity-80 hover:opacity-100">Şifremi unuttum</a>
                                </div>
                                <div className="relative group/lock">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-slate-500 group-focus-within/lock:text-blue-500 transition-colors" />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-[#020617]/50 border border-slate-800 rounded-xl pl-11 pr-4 py-3.5 text-[14px] text-white placeholder-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:bg-[#020617] transition-all tracking-wide"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !tenantId}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium text-[15px] py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 shadow-[0_0_20px_rgba(37,99,235,0.15)] hover:shadow-[0_0_25px_rgba(37,99,235,0.3)] flex items-center justify-center gap-2 group border border-blue-500/30"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Kimlik Doğrulanıyor...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Sisteme Giriş Yap</span>
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>

                    </div>

                    <div className="mt-8 text-center flex items-center justify-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
                        <ShieldCheck className="w-4 h-4 text-slate-400" />
                        <p className="text-[12px] text-slate-400 font-medium tracking-wide">GÜVENLİ B2B ALTYAPISI</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
