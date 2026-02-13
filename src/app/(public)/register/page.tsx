"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Layout, User, Mail, Phone, Building2, Lock, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        companyName: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // CMS Data
    const [cmsData, setCmsData] = useState<any>(null);

    useEffect(() => {
        const fetchCms = async () => {
            try {
                const res = await fetch('/api/public/cms/page/register');
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();

            if (res.ok) {
                router.push('/login?registered=true');
            } else {
                setError(data.error || 'Kayıt sırasında bir hata oluştu.');
            }
        } catch (e) {
            setError('Sunucu bağlantısı kurulamadı.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid lg:grid-cols-2 bg-[#050510] overflow-hidden">
            {/* Left Column: Marketing (Hidden on Mobile) */}
            <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden border-r border-white/5">
                {/* Background effects */}
                <div className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay transition-transform duration-[20s] hover:scale-110"
                    style={{ backgroundImage: `url(${cmsData?.visualUrl || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1200'})` }} />
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-transparent to-blue-600/20" />
                <div className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[160px]" />

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

                <div className="relative z-10 max-w-xl animate-in fade-in slide-in-from-left-8 duration-700">
                    {cmsData?.badgeText && (
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-bold text-white mb-6 border border-white/10">
                            <Zap className="w-3 h-3 text-blue-400 fill-blue-400" />
                            {cmsData.badgeText}
                        </div>
                    )}
                    <h1 className="text-5xl font-black text-white leading-[1.1] mb-6 tracking-tight"
                        dangerouslySetInnerHTML={{ __html: cmsData?.title || 'İşinizi <span class="grad-text">Periodya</span> ile Büyütün' }} />
                    <p className="text-lg text-slate-300 mb-8 leading-relaxed">
                        {cmsData?.subtitle || 'Modern, hızlı ve bulut tabanlı yeni nesil ERP çözümü ile tanışın. 14 gün ücretsiz deneyin.'}
                    </p>

                    <ul className="space-y-4 pt-8 border-t border-white/5">
                        {[
                            'Kredi kartı gerekmez',
                            '14 gün sınırsız kullanım',
                            'Anında kurulum ve aktivasyon',
                            '7/24 Teknik destek ekibi'
                        ].map((item, i) => (
                            <li key={i} className="flex items-center gap-3 text-slate-400 text-sm font-medium">
                                <ShieldCheck className="w-5 h-5 text-blue-500" />
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="relative z-10 text-slate-500 text-xs font-medium">
                    © 2026 Periodya Cloud. Join 20,000+ businesses today.
                </div>
            </div>

            {/* Right Column: Register Form */}
            <div className="relative flex flex-col justify-center items-center p-8 py-16 lg:py-8 overflow-y-auto">
                <div className="w-full max-w-[480px] animate-in fade-in slide-in-from-bottom-8 duration-700">
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
                        <h2 className="text-3xl font-black text-white mb-2">Hesabınızı Oluşturun</h2>
                        <p className="text-slate-400">Ücretsiz denemeniz için formu doldurun.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Ad Soyad</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Örn: Ahmet Yılmaz"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">E-Posta</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <input
                                        type="email"
                                        required
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="ahmet@sirket.com"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Telefon (WhatsApp)</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <input
                                        type="tel"
                                        required
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="05XX XXX XX XX"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Firma Adı</label>
                            <div className="relative">
                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                                    value={formData.companyName}
                                    onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                                    placeholder="Örn: Periodya Teknoloji"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Şifre</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="••••••••"
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
                                {loading ? 'HESAP OLUŞTURULUYOR...' : 'ÜCRETSİZ BAŞLAT'}
                                {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-white/5 text-center">
                        <p className="text-slate-400 text-sm">
                            Zaten hesabınız var mı?{' '}
                            <Link href="/login" className="text-white font-black hover:text-blue-500 transition-colors uppercase tracking-tight">
                                Giriş Yap
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
