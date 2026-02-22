export default function CTA() {
    return (
        <section className="py-20 px-6" aria-label="Son Çağrı">
            <div className="max-w-3xl mx-auto">
                <div className="relative p-10 md:p-14 rounded-3xl border border-orange-500/20 text-center overflow-hidden"
                    style={{ background: 'radial-gradient(ellipse at center top, rgba(255,85,0,0.12) 0%, rgba(8,9,17,0) 70%), rgba(255,255,255,0.02)' }}>
                    <div className="absolute inset-0 rounded-3xl" style={{ border: '1px solid rgba(255,85,0,0.15)' }} />
                    <div className="relative z-10">
                        <div className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight">
                            İşletmenizi büyütmeye<br />
                            <span style={{ background: 'linear-gradient(135deg,#FF5500,#FF8C42)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                bugün başlayın.
                            </span>
                        </div>
                        <p className="text-gray-400 mb-8 max-w-md mx-auto font-medium">
                            30 gün ücretsiz deneyin. Kurulum yok, risk yok. Sadece büyüme.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <button
                                onClick={() => document.querySelector('#login')?.scrollIntoView({ behavior: 'smooth' })}
                                className="px-8 py-3.5 rounded-2xl font-bold text-white text-sm transition-all hover:scale-105 hover:shadow-xl"
                                style={{ background: 'linear-gradient(135deg,#FF5500,#E64A00)', boxShadow: '0 8px 30px rgba(255,85,0,0.3)' }}
                            >
                                Ücretsiz Başla →
                            </button>
                            <a href="mailto:demo@periodya.com"
                                className="px-8 py-3.5 rounded-2xl font-bold text-gray-300 text-sm border border-white/10 hover:bg-white/5 transition-all">
                                Demo Talep Et
                            </a>
                        </div>
                        <p className="mt-6 text-xs text-gray-600 font-bold">
                            Kredi kartı gerekmez · İstediğinde iptal et · KVKK uyumlu
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
