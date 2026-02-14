"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Mail, Lock, Layout, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function LoginPageContent() {
    const router = useRouter();
    const { login, isAuthenticated } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotLoading, setForgotLoading] = useState(false);
    const [forgotMessage, setForgotMessage] = useState('');

    // CMS Data
    const [cmsData, setCmsData] = useState<any>(null);

    useEffect(() => {
        const fetchCms = async () => {
            try {
                const res = await fetch('/api/public/cms/page/login');
                const data = await res.json();
                if (data.sections?.length > 0) {
                    setCmsData(data.sections[0].content);
                }
            } catch (e) {
                console.error("CMS fetch failed", e);
            }
        };
        fetchCms();
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const success = await login(username, password);
            if (success) {
                // Success handled by AuthContext
            } else {
                setError('E-Posta, kullanıcı adı veya şifre hatalı!');
            }
        } catch (err) {
            setError('Giriş sırasında bir hata oluştu. Lütfen tekrar deneyin.');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!forgotEmail) return;
        setForgotLoading(true);
        setForgotMessage('');
        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: forgotEmail })
            });
            const data = await res.json();
            if (res.ok) {
                setForgotMessage(data.message || 'Sıfırlama bağlantısı gönderildi.');
                setTimeout(() => {
                    setShowForgotModal(false);
                    setForgotMessage('');
                    setForgotEmail('');
                }, 3000);
            } else {
                setError(data.error || 'İşlem başarısız.');
            }
        } catch (e) {
            setError('Sunucu hatası.');
        } finally {
            setForgotLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid lg:grid-cols-2 bg-[#050510] overflow-hidden">
            {/* Left Column: Marketing Content (Hidden on Mobile) */}
            <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden border-r border-white/5">
                {/* Background Visuals */}
                <div className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay transition-transform duration-[20s] hover:scale-110"
                    style={{ backgroundImage: `url(${cmsData?.visualUrl || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1200'})` }} />
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-orange-600/20" />
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/30 rounded-full blur-[120px]" />
                <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-orange-600/20 rounded-full blur-[120px]" />

                {/* Top Content */}
                <div className="relative z-10">
                    <Link href="/" className="inline-flex items-center gap-2 mb-12 group">
                        <div className="p-2 bg-blue-600 rounded-lg group-hover:scale-110 transition-transform">
                            <Layout className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-black text-white tracking-tighter uppercase italic">
                            PERIOD<span className="text-blue-500">YA</span>
                        </span>
                    </Link>
                </div>

                {/* Main Content */}
                <div className="relative z-10 max-w-xl animate-in fade-in slide-in-from-left-8 duration-700">
                    {cmsData?.badgeText && (
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-bold text-white mb-6 border border-white/10">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                            {cmsData.badgeText}
                        </div>
                    )}
                    <h1 className="text-5xl font-black text-white leading-[1.1] mb-6 tracking-tight"
                        dangerouslySetInnerHTML={{ __html: cmsData?.title || 'Sektörün En Güçlü <span class="grad-text">Yönetim Paneli</span>' }} />
                    <p className="text-lg text-slate-300/80 mb-8 leading-relaxed">
                        {cmsData?.subtitle || 'Tüm süreçlerinizi tek noktadan yönetmenin keyfini çıkarın. Hemen giriş yapın ve farkı görün.'}
                    </p>

                    <div className="grid grid-cols-2 gap-6 pt-8 border-t border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                <ShieldCheck className="w-5 h-5 text-blue-400" />
                            </div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Uçtan Uca Güvenlik</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-500/10 rounded-lg border border-green-500/20">
                                <CheckCircle2 className="w-5 h-5 text-green-400" />
                            </div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">7/24 Aktif Sistem</span>
                        </div>
                    </div>
                </div>

                {/* Bottom Content */}
                <div className="relative z-10 text-slate-500 text-xs font-medium">
                    © 2026 Periodya Cloud. Modern Enterprise Solutions.
                </div>
            </div>

            {/* Right Column: Login Form */}
            <div className="relative flex flex-col justify-center items-center p-8">
                {/* Background accents for mobile */}
                <div className="lg:hidden absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-blue-600/10 to-transparent" />

                <div className="w-full max-w-[420px] animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="lg:hidden flex flex-col items-center mb-10">
                        <Link href="/" className="inline-flex items-center gap-2 mb-4">
                            <div className="p-2 bg-blue-600 rounded-lg">
                                <Layout className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-black text-white tracking-tighter uppercase italic">
                                PERIOD<span className="text-blue-500">YA</span>
                            </span>
                        </Link>
                    </div>

                    <div className="mb-10 text-center lg:text-left">
                        <h2 className="text-3xl font-black text-white mb-2">Hoş Geldiniz</h2>
                        <p className="text-slate-400">Devam etmek için hesabınıza erişin.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Kullanıcı Adı veya E-Posta</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="ornek@sirket.com"
                                    required
                                    autoFocus
                                    disabled={loading}
                                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-end ml-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Şifre</label>
                                <button
                                    type="button"
                                    onClick={() => setShowForgotModal(true)}
                                    className="text-[10px] font-bold text-blue-500 hover:text-blue-400 transition cursor-pointer"
                                >
                                    Şifremi Unuttum?
                                </button>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    disabled={loading}
                                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-sm font-bold animate-in zoom-in duration-300 text-center">
                                ⚠️ {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full group relative overflow-hidden rounded-2xl py-4 font-black transition-all ${loading ? 'bg-slate-700 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-900/40 hover:-translate-y-0.5'}`}
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2 uppercase tracking-widest">
                                {loading ? 'SİSTEME GİRİLİYOR...' : 'HESABA ERİŞ'}
                                {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        </button>
                    </form>

                    <div className="mt-10 pt-10 border-t border-white/5 text-center">
                        <p className="text-slate-400 text-sm">
                            Henüz bir hesabınız yok mu?{' '}
                            <Link href="/register" className="text-white font-black hover:text-blue-500 transition-colors uppercase tracking-tight">
                                Ücretsiz Deneme Başlat
                            </Link>
                        </p>
                    </div>

                    {/* Quick Demo Accounts Toggle */}
                    {process.env.NODE_ENV === 'development' && (
                        <div className="mt-8 p-4 bg-white/5 rounded-2xl border border-white/5">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Hızlı Erişim (Dev)</h4>
                            <div className="flex flex-wrap gap-2">
                                {['admin', 'kadikoy', 'besiktas', 'izmir'].map((acc) => (
                                    <button
                                        key={acc}
                                        onClick={() => { setUsername(acc); setPassword(acc + '123'); }}
                                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-bold text-slate-300 transition uppercase"
                                    >
                                        {acc}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Forgot Password Modal */}
            {showForgotModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#050510]/80 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="w-full max-w-[440px] bg-[#0A0A1F] border border-white/10 rounded-[32px] p-8 shadow-2xl animate-in zoom-in duration-300">
                        <div className="text-center mb-8">
                            <div className="inline-flex p-4 bg-blue-600/10 rounded-2xl mb-4 border border-blue-600/20">
                                <Lock className="w-8 h-8 text-blue-500" />
                            </div>
                            <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Şifre Kurtarma</h3>
                            <p className="text-slate-400 text-sm mt-2">Bağlantı göndermek için e-posta adresinizi girin.</p>
                        </div>

                        {forgotMessage ? (
                            <div className="p-6 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-500 text-center font-bold animate-bounce-in">
                                ✅ {forgotMessage}
                            </div>
                        ) : (
                            <form onSubmit={handleForgotPassword} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Kayıtlı E-Posta</label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-6 text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-bold"
                                        value={forgotEmail}
                                        onChange={e => setForgotEmail(e.target.value)}
                                        placeholder="ornek@sirket.com"
                                    />
                                </div>
                                <div className="flex gap-4 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowForgotModal(false)}
                                        className="flex-1 px-6 py-4 rounded-2xl font-black border border-white/5 text-slate-400 hover:bg-white/5 transition lowercase italic"
                                    >
                                        vazgeç
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={forgotLoading}
                                        className="flex-[1.5] px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl shadow-blue-900/20 transition-all hover:-translate-y-0.5"
                                    >
                                        {forgotLoading ? 'GÖNDERİLİYOR...' : 'BAĞLANTI GÖNDER'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
