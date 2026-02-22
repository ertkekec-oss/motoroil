export default function Hero() {
    const scrollTo = () => document.querySelector('#login')?.scrollIntoView({ behavior: 'smooth' });

    return (
        <section id="urun" className="relative py-20 px-6 overflow-hidden" aria-labelledby="hero-heading">
            {/* Ambient glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-20 blur-[120px] pointer-events-none"
                style={{ background: 'radial-gradient(circle, #FF5500 0%, transparent 70%)' }} />

            <div className="relative z-10 max-w-4xl mx-auto text-center">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-orange-500/20 bg-orange-500/10 text-orange-400 text-xs font-bold uppercase tracking-widest mb-8">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                    Türkiye'nin ERP Çözümü
                </div>

                <h1 id="hero-heading" className="text-4xl md:text-6xl font-black text-white leading-tight mb-6 tracking-tight">
                    İşletmenizi dijitalleştirin,{' '}
                    <span style={{ background: 'linear-gradient(135deg,#FF5500,#FF8C42)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        büyütün.
                    </span>
                </h1>

                <p className="text-lg text-gray-400 leading-relaxed max-w-2xl mx-auto mb-10 font-medium">
                    Muhasebe, stok, satış, PDKS, pazaryeri entegrasyonları ve raporlama — tek platformda.
                    Kurulum yok, server yok, sorunsuz çalışır.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                        onClick={scrollTo}
                        className="px-8 py-3.5 rounded-2xl font-bold text-white text-sm transition-all hover:scale-105 hover:shadow-xl"
                        style={{ background: 'linear-gradient(135deg,#FF5500,#E64A00)', boxShadow: '0 8px 30px rgba(255,85,0,0.3)' }}
                        aria-label="Hesabınıza giriş yapın"
                    >
                        Hemen Giriş Yap →
                    </button>
                    <a href="mailto:demo@periodya.com"
                        className="px-8 py-3.5 rounded-2xl font-bold text-gray-300 text-sm border border-white/10 hover:bg-white/5 transition-all">
                        Demo Talep Et
                    </a>
                </div>

                {/* Trust signals */}
                <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-gray-500 font-bold uppercase tracking-widest">
                    {['KVKK Uyumlu', 'SSL Şifreli', '7/24 Destek', 'Bulut Tabanlı'].map(t => (
                        <span key={t} className="flex items-center gap-1.5">
                            <span className="text-green-500">✓</span> {t}
                        </span>
                    ))}
                </div>

                {/* Mockup */}
                <div className="mt-16 relative max-w-3xl mx-auto">
                    <div className="rounded-2xl border border-white/10 overflow-hidden shadow-2xl" style={{ boxShadow: '0 40px 80px -20px rgba(0,0,0,0.8)' }}>
                        {/* Browser bar */}
                        <div className="h-10 flex items-center gap-2 px-4 border-b border-white/5" style={{ backgroundColor: '#161b22' }}>
                            <div className="w-3 h-3 rounded-full bg-red-500/60" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                            <div className="w-3 h-3 rounded-full bg-green-500/60" />
                            <div className="flex-1 mx-4 h-5 rounded bg-white/5 flex items-center px-2">
                                <span className="text-[10px] text-gray-500">app.periodya.com/dashboard</span>
                            </div>
                        </div>
                        {/* Dashboard preview */}
                        <div className="h-48 md:h-64" style={{ backgroundColor: '#0f111a' }}>
                            <div className="p-4 grid grid-cols-4 gap-3">
                                {[
                                    { label: 'Bugünkü Satış', val: '₺24.850', color: '#FF5500' },
                                    { label: 'Bekleyen Sipariş', val: '37', color: '#3B82F6' },
                                    { label: 'Aktif Müşteri', val: '1.204', color: '#10B981' },
                                    { label: 'Stok Uyarısı', val: '12', color: '#F59E0B' },
                                ].map(s => (
                                    <div key={s.label} className="rounded-xl p-3 border border-white/5" style={{ backgroundColor: '#161b22' }}>
                                        <div className="text-[10px] text-gray-500 font-bold mb-1">{s.label}</div>
                                        <div className="text-lg font-black" style={{ color: s.color }}>{s.val}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="px-4 grid grid-cols-3 gap-3">
                                {[65, 40, 80].map((h, i) => (
                                    <div key={i} className="rounded-xl border border-white/5 p-3" style={{ backgroundColor: '#161b22' }}>
                                        <div className="h-16 flex items-end gap-1">
                                            {Array.from({ length: 7 }).map((_, j) => (
                                                <div key={j} className="flex-1 rounded-t"
                                                    style={{ height: `${Math.random() * h + 20}%`, background: `linear-gradient(to top, #FF5500, #FF8C42)`, opacity: 0.6 + j * 0.05 }} />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    {/* Glow beneath */}
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-20 blur-2xl opacity-30 rounded-full"
                        style={{ background: '#FF5500' }} />
                </div>
            </div>
        </section>
    );
}
