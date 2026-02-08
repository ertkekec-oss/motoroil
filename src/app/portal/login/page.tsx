
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PortalLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/portal/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();
            if (res.ok) {
                router.push('/portal/dashboard');
            } else {
                setError(data.error || 'Giriş başarısız.');
            }
        } catch (err) {
            setError('Bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0f111a] p-4 font-sans">
            <div className="w-full max-w-md bg-[#161b22] border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>

                <div className="text-center mb-8">
                    <div className="text-4xl mb-4">🌍</div>
                    <h1 className="text-2xl font-black text-white mb-2">Müşteri Portalı</h1>
                    <p className="text-sm text-gray-400">Finansal durumunuzu ve servis geçmişinizi görüntüleyin.</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg mb-6 flex items-center gap-2">
                        <span>⚠️</span> {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">E-Posta Adresi</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 focus:outline-none transition-colors"
                            placeholder="ornek@sirket.com"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Şifre</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 focus:outline-none transition-colors"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 shadow-lg shadow-blue-900/20"
                    >
                        {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap →'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <a href="/" className="text-xs text-gray-500 hover:text-white transition-colors">Ana Sayfaya Dön</a>
                </div>
            </div>
        </div>
    );
}
