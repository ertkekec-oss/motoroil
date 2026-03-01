"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface LoginPanelProps {
    className?: string;
}

type FormState = 'idle' | 'loading' | 'error' | 'success';

export default function LoginPanel({ className = '' }: LoginPanelProps) {
    const router = useRouter();
    const { login } = useAuth();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [formState, setFormState] = useState<FormState>('idle');
    const [error, setError] = useState('');
    const [showPass, setShowPass] = useState(false);

    const [showForgot, setShowForgot] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotLoading, setForgotLoading] = useState(false);
    const [forgotMsg, setForgotMsg] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username || !password) {
            setError('E-posta ve şifre alanları zorunludur.');
            setFormState('error');
            return;
        }
        setError('');
        setFormState('loading');

        try {
            const success = await login(username, password);
            if (success) {
                setFormState('success');
            } else {
                setError('E-posta veya şifre hatalı. Lütfen tekrar deneyin.');
                setFormState('error');
            }
        } catch {
            setError('Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin.');
            setFormState('error');
        }
    };

    const handleForgot = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!forgotEmail) return;
        setForgotLoading(true);
        try {
            await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: forgotEmail }),
            });
            setForgotMsg('Sıfırlama bağlantısı e-posta adresinize gönderildi.');
        } catch {
            setForgotMsg('İşlem sırasında bir hata oluştu. Lütfen tekrar deneyin.');
        } finally {
            setForgotLoading(false);
        }
    };

    return (
        <div id="login" className={`flex flex-col justify-center px-8 py-10 ${className}`}>
            {!showForgot ? (
                <>
                    <h2 className="text-3xl font-black text-white mb-2 leading-tight">Hesabınıza giriş yapın</h2>
                    <p className="text-sm text-gray-500 font-medium mb-8">
                        Platformunuza devam edin.
                    </p>

                    <form onSubmit={handleLogin} className="space-y-4" noValidate aria-label="Giriş Formu">
                        {/* Email */}
                        <div>
                            <label htmlFor="login-email" className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                                E-posta / Kullanıcı Adı
                            </label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600 select-none">✉</span>
                                <input
                                    id="login-email"
                                    type="text"
                                    autoComplete="username"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    placeholder="ornek@firma.com"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm font-medium text-white placeholder-gray-600 outline-none transition-all focus:ring-2"
                                    style={{
                                        backgroundColor: 'var(--bg-primary, #ffffff)',
                                        border: formState === 'error' && !username ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.08)',
                                        // @ts-ignore
                                        '--tw-ring-color': '#FF5500',
                                    }}
                                    aria-required="true"
                                    aria-invalid={formState === 'error' && !username}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="login-password" className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                                Şifre
                            </label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600 select-none">🔒</span>
                                <input
                                    id="login-password"
                                    type={showPass ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-10 py-3 rounded-xl text-sm font-medium text-white placeholder-gray-600 outline-none transition-all focus:ring-2"
                                    style={{
                                        backgroundColor: 'var(--bg-primary, #ffffff)',
                                        border: formState === 'error' && !password ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.08)',
                                    }}
                                    aria-required="true"
                                    aria-invalid={formState === 'error' && !password}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(!showPass)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors text-xs px-1"
                                    aria-label={showPass ? 'Şifreyi gizle' : 'Şifreyi göster'}
                                >
                                    {showPass ? '🙈' : '👁'}
                                </button>
                            </div>
                        </div>

                        {/* Error */}
                        {formState === 'error' && error && (
                            <div className="flex items-start gap-2 p-3 rounded-xl text-xs font-medium text-red-400"
                                style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}
                                role="alert" aria-live="assertive">
                                <span className="flex-shrink-0">⚠</span>
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Success */}
                        {formState === 'success' && (
                            <div className="flex items-center gap-2 p-3 rounded-xl text-xs font-medium text-green-400"
                                style={{ backgroundColor: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}
                                role="status">
                                <span>✓</span> Giriş başarılı, yönlendiriliyorsunuz...
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={formState === 'loading' || formState === 'success'}
                            className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            style={{ background: 'linear-gradient(135deg,#FF5500,#E64A00)', boxShadow: '0 4px 20px rgba(255,85,0,0.25)' }}
                            aria-label="Giriş Yap"
                        >
                            {formState === 'loading' ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Giriş yapılıyor...
                                </>
                            ) : formState === 'success' ? (
                                '✓ Yönlendiriliyorsunuz...'
                            ) : (
                                'Giriş Yap →'
                            )}
                        </button>
                    </form>

                    {/* Forgot + Support */}
                    <div className="mt-4 flex flex-row gap-6 justify-center items-center text-center">
                        <button
                            onClick={() => { setShowForgot(true); setFormState('idle'); setError(''); }}
                            className="text-xs text-gray-500 hover:text-gray-300 transition-colors font-medium"
                        >
                            Şifremi Unuttum
                        </button>
                        <a href="mailto:destek@periodya.com"
                            className="text-xs text-gray-500 hover:text-orange-400 transition-colors font-medium">
                            Yardım & Destek →
                        </a>
                    </div>

                    {/* KVKK Note */}
                    <div className="mt-8 pt-6 border-t border-white/5">
                        <div className="flex items-start gap-2">
                            <span className="text-green-500 flex-shrink-0 mt-0.5">🔒</span>
                            <p className="text-[10px] text-gray-600 leading-relaxed font-medium">
                                Verileriniz KVKK'ya uygun şekilde korunur. SSL şifreli bağlantı. Üçüncü taraflarla paylaşılmaz.
                            </p>
                        </div>
                    </div>
                </>
            ) : (
                /* Şifremi Unuttum */
                <>
                    <button onClick={() => { setShowForgot(false); setForgotMsg(''); setForgotEmail(''); }}
                        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors mb-6 font-bold">
                        ← Geri Dön
                    </button>
                    <h2 className="text-xl font-black text-white mb-2">Şifre Sıfırlama</h2>
                    <p className="text-sm text-gray-500 font-medium mb-6">
                        E-posta adresinizi girin, sıfırlama bağlantısı göndereceğiz.
                    </p>
                    {forgotMsg ? (
                        <div className="p-4 rounded-xl text-sm text-green-400 font-medium"
                            style={{ backgroundColor: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
                            {forgotMsg}
                        </div>
                    ) : (
                        <form onSubmit={handleForgot} className="space-y-4">
                            <input
                                type="email"
                                value={forgotEmail}
                                onChange={e => setForgotEmail(e.target.value)}
                                placeholder="ornek@firma.com"
                                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-600 outline-none transition-all"
                                style={{ backgroundColor: 'var(--bg-primary, #ffffff)', border: '1px solid rgba(255,255,255,0.08)' }}
                                required
                            />
                            <button
                                type="submit"
                                disabled={forgotLoading}
                                className="w-full py-3.5 rounded-xl font-bold text-white text-sm disabled:opacity-60 flex items-center justify-center gap-2"
                                style={{ background: 'linear-gradient(135deg,#FF5500,#E64A00)' }}
                            >
                                {forgotLoading ? (
                                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Gönderiliyor...</>
                                ) : 'Sıfırlama Bağlantısı Gönder'}
                            </button>
                        </form>
                    )}
                </>
            )}

            {/* Footer */}
            <div className="mt-8 text-center">
                <p className="text-[10px] text-gray-700 font-bold">
                    © {new Date().getFullYear()} Periodya · Tüm hakları saklıdır
                </p>
            </div>
        </div>
    );
}
