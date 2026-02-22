"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

import TopNav from './TopNav';
import Banner from './Banner';
import Hero from './Hero';
import Announcement from './Announcement';
import Partners from './Partners';
import BeforeAfter from './BeforeAfter';
import Stats from './Stats';
import Features from './Features';
import InfoBoxes from './InfoBoxes';
import Analytics from './Analytics';
import Roles from './Roles';
import Pricing from './Pricing';
import FAQ from './FAQ';
import CTA from './CTA';
import LoginPanel from './LoginPanel';

/* ── Ücretsiz Deneme / Demo Kayıt Modalı ── */
function DemoModal({ onClose }: { onClose: () => void }) {
    const router = useRouter();
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', companyName: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (res.ok) {
                setSuccess(true);
                setTimeout(() => {
                    onClose();
                    router.push('/login?registered=true');
                }, 2000);
            } else {
                setError(data.error || 'Kayıt sırasında bir hata oluştu.');
            }
        } catch {
            setError('Sunucu bağlantısı kurulamadı.');
        } finally {
            setLoading(false);
        }
    };

    const field = (
        id: string,
        label: string,
        type: string,
        placeholder: string,
        key: keyof typeof formData,
        icon: string
    ) => (
        <div>
            <label htmlFor={id} className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                {label}
            </label>
            <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600 text-base select-none">{icon}</span>
                <input
                    id={id}
                    type={type}
                    required
                    value={formData[key]}
                    onChange={e => setFormData({ ...formData, [key]: e.target.value })}
                    placeholder={placeholder}
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm font-medium text-white placeholder-gray-600 outline-none transition-all focus:ring-2"
                    style={{
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.08)',
                    }}
                />
            </div>
        </div>
    );

    return (
        /* Backdrop */
        <div
            className="fixed inset-0 z-[999] flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(12px)' }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
            aria-modal="true"
            role="dialog"
            aria-labelledby="demo-modal-title"
        >
            <div
                className="relative w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
                style={{ backgroundColor: '#0d0f1a', border: '1px solid rgba(255,255,255,0.08)' }}
            >
                {/* Kapat */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-all text-lg z-10"
                    aria-label="Kapat"
                >
                    ×
                </button>

                <div className="p-8">
                    {/* Başlık */}
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-white text-sm"
                                style={{ background: 'linear-gradient(135deg,#FF5500,#E64A00)' }}>P</div>
                            <span className="text-xs font-black text-orange-400 uppercase tracking-widest">30 Gün Ücretsiz</span>
                        </div>
                        <h2 id="demo-modal-title" className="text-2xl font-black text-white mb-1">
                            Hesabınızı Oluşturun
                        </h2>
                        <p className="text-sm text-gray-500 font-medium">
                            Kredi kartı gerekmez · Anında aktivasyon · 30 gün sınırsız kullanım
                        </p>
                    </div>

                    {/* Başarı */}
                    {success ? (
                        <div className="py-8 text-center">
                            <div className="text-5xl mb-4">✅</div>
                            <div className="text-lg font-black text-white mb-2">Hesabınız oluşturuldu!</div>
                            <p className="text-sm text-gray-400">Giriş sayfasına yönlendiriliyorsunuz...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                            {field('demo-name', 'Ad Soyad', 'text', 'Ahmet Yılmaz', 'name', '👤')}

                            <div className="grid grid-cols-2 gap-3">
                                {field('demo-email', 'E-Posta', 'email', 'ahmet@sirket.com', 'email', '✉')}
                                {field('demo-phone', 'Telefon', 'tel', '05XX XXX XX XX', 'phone', '📱')}
                            </div>

                            {field('demo-company', 'Firma Adı', 'text', 'Şirket Adı A.Ş.', 'companyName', '🏢')}
                            {field('demo-password', 'Şifre', 'password', '••••••••', 'password', '🔒')}

                            {error && (
                                <div className="p-3 rounded-xl text-xs font-medium text-red-400 flex items-start gap-2"
                                    style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}
                                    role="alert">
                                    <span>⚠</span><span>{error}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                                style={{ background: 'linear-gradient(135deg,#FF5500,#E64A00)', boxShadow: '0 4px 20px rgba(255,85,0,0.25)' }}
                            >
                                {loading ? (
                                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Hesap oluşturuluyor...</>
                                ) : 'Ücretsiz Başlat →'}
                            </button>

                            <p className="text-center text-[10px] text-gray-600 font-medium">
                                Kaydolarak{' '}
                                <a href="#" className="text-gray-500 hover:text-gray-300 transition-colors">Kullanım Koşulları</a>
                                {' '}ve{' '}
                                <a href="#" className="text-gray-500 hover:text-gray-300 transition-colors">Gizlilik Politikası</a>'nı
                                kabul etmiş olursunuz.
                            </p>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ── Ana Layout ── */
export default function LoginPageContent() {
    const router = useRouter();
    const { isAuthenticated, isLoading } = useAuth();
    const [showDemo, setShowDemo] = useState(false);

    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            router.push('/dashboard');
        }
    }, [isLoading, isAuthenticated, router]);

    // URL'de ?demo=true varsa direkt modal aç
    useEffect(() => {
        if (typeof window !== 'undefined' && window.location.search.includes('demo=true')) {
            setShowDemo(true);
        }
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#080911' }}>
                <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#080911', color: '#F8FAFC' }}>

            {/* Demo Modal */}
            {showDemo && <DemoModal onClose={() => setShowDemo(false)} />}

            {/* SOL PANEL — 65% */}
            <div
                className="hidden lg:flex flex-col overflow-y-auto"
                style={{ width: '65%', minWidth: 0, borderRight: '1px solid rgba(255,255,255,0.05)' }}
            >
                <Banner />
                <div className="sticky top-0 z-50">
                    <TopNav onDemoClick={() => setShowDemo(true)} />
                </div>

                <main>
                    <Hero onDemoClick={() => setShowDemo(true)} />
                    <Announcement />
                    <Partners />
                    <Stats />
                    <BeforeAfter />
                    <Features />
                    <InfoBoxes />
                    <Analytics />
                    <Roles />
                    <Pricing onDemoClick={() => setShowDemo(true)} />
                    <FAQ />
                    <CTA onDemoClick={() => setShowDemo(true)} />

                    <footer className="py-10 px-6 border-t border-white/5">
                        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-600 font-bold">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs font-black"
                                    style={{ background: 'linear-gradient(135deg,#FF5500,#E64A00)' }}>P</div>
                                <span>Periodya Enterprise ERP</span>
                            </div>
                            <div className="flex flex-wrap items-center justify-center gap-4">
                                {['KVKK', 'Gizlilik', 'Kullanım Koşulları', 'Destek'].map(l => (
                                    <a key={l} href="#" className="hover:text-gray-400 transition-colors">{l}</a>
                                ))}
                            </div>
                            <span>© {new Date().getFullYear()} Periodya. Tüm hakları saklıdır.</span>
                        </div>
                    </footer>
                </main>
            </div>

            {/* SAĞ PANEL — 35% login */}
            <div
                className="lg:w-[35%] w-full flex flex-col"
                style={{ backgroundColor: '#0d0f1a', borderLeft: '1px solid rgba(255,255,255,0.04)' }}
            >
                <div className="lg:hidden">
                    <Banner />
                    <TopNav onDemoClick={() => setShowDemo(true)} />
                    <div className="px-6 py-8 text-center border-b border-white/5">
                        <h1 className="text-2xl font-black text-white mb-2">
                            İşletmenizi <span style={{ color: '#FF5500' }}>büyütün.</span>
                        </h1>
                        <p className="text-sm text-gray-400 font-medium">ERP · Muhasebe · Stok · Pazaryeri</p>
                    </div>
                </div>

                <div className="flex-1 flex flex-col justify-center overflow-y-auto">
                    <LoginPanel />
                </div>

                <div className="lg:hidden px-8 pb-8 pt-4 border-t border-white/5">
                    <button
                        onClick={() => setShowDemo(true)}
                        className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                        style={{ background: 'linear-gradient(135deg,#FF5500,#E64A00)' }}
                    >
                        Ücretsiz Dene →
                    </button>
                </div>
            </div>
        </div>
    );
}
