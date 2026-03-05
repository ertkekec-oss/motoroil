"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
                setSuccess('Giriş başarılı! Bayi paneline yönlendiriliyorsunuz...');
                setTimeout(() => {
                    router.push('/network/dashboard');
                }, 1000);
            } else {
                if (data.error === 'NOT_FOUND_OR_NO_PASSWORD' || data.error === 'INVALID_CREDENTIALS') {
                    setError('E-posta veya şifre hatalı. Lütfen tekrar deneyin.');
                } else if (data.error === 'NO_ACTIVE_MEMBERSHIP_FOR_TENANT') {
                    setError('Bu bayiye ait aktif bir üyeliğiniz bulunmamaktadır.');
                } else if (data.error === 'RATE_LIMITED') {
                    setError(`Çok fazla deneme yaptınız. Lütfen ${data.retryAfterSec} saniye bekleyin.`);
                } else {
                    setError('Giriş başarısız oldu. [' + data.error + ']');
                }
            }
        } catch (err) {
            setError('Bir bağlantı hatası oluştu.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 selection:bg-blue-500/30 font-sans relative overflow-hidden">

            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-[10%] -right-[10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full" />
                <div className="absolute -bottom-[10%] -left-[10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[120px] rounded-full" />
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] mix-blend-overlay"></div>
            </div>

            <div className="max-w-[420px] w-full z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/20 border border-white/10">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2L2 7l10 5 10-5-10-5z" />
                            <path d="M2 17l10 5 10-5" />
                            <path d="M2 12l10 5 10-5" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Yetkili Bayi Portalı</h1>
                    <p className="text-slate-400 font-medium text-sm">B2B Yönetim Paneline Hoş Geldiniz</p>
                </div>

                <div className="bg-[#0f172a]/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/[0.05]">

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-4 rounded-2xl mb-6 flex items-start gap-3 animate-in fade-in zoom-in-95 font-medium">
                            <span className="text-lg leading-none">⚠️</span>
                            <span className="leading-snug">{error}</span>
                        </div>
                    )}

                    {success && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm p-4 rounded-2xl mb-6 flex items-start gap-3 animate-in fade-in zoom-in-95 font-medium">
                            <span className="text-lg leading-none">✅</span>
                            <span className="leading-snug">{success}</span>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-[13px] font-bold text-slate-400 uppercase tracking-wider ml-1">E-Posta Adresi</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-[#1e293b]/50 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all font-medium"
                                placeholder="bayi@sirket.com"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between ml-1">
                                <label className="text-[13px] font-bold text-slate-400 uppercase tracking-wider">Şifre</label>
                            </div>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-[#1e293b]/50 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all font-medium"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !tenantId}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:shadow-[0_0_30px_rgba(37,99,235,0.4)] flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Doğrulanıyor...
                                </>
                            ) : 'Bayi Ağına Giriş Yap'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
