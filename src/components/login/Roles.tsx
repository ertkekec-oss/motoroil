const ROLES = [
    { icon: '👔', title: 'İşletme Sahibi', desc: 'Tüm operasyonu tek panelden yönetin. Anlık kâr-zarar, nakit akışı ve performans raporu.' },
    { icon: '📋', title: 'Muhasebeci', desc: 'Döviz, KDV, e-fatura, mizan ve kapsamlı raporlama araçları ile hızlı muhasebe.' },
    { icon: '🏪', title: 'Mağaza Müdürü', desc: 'Stok uyarıları, POS terminali, müşteri yönetimi ve günlük satış özeti.' },
    { icon: '📱', title: 'Saha Satış Temsilcisi', desc: 'Mobil uygulama ile ziyaret planı, sipariş alma ve müşteri bilgilerine anında ulaşım.' },
    { icon: '🛒', title: 'E-Ticaret Sorumlusu', desc: 'Pazaryeri siparişleri, iade takibi, kargo entegrasyonu ve reklam performansı.' },
    { icon: '👤', title: 'İK & Bordro', desc: 'Personel özlük dosyası, puantaj, maaş bordrosu ve izin yönetimi.' },
];

export default function Roles() {
    return (
        <section className="py-20 px-6" aria-labelledby="roles-heading">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <span className="text-xs font-black text-orange-400 uppercase tracking-[0.3em]">Kim için?</span>
                    <h2 id="roles-heading" className="text-3xl font-black text-white mt-2 mb-3">Her role uygun araçlar</h2>
                    <p className="text-gray-400">Periodya; farklı departmanlara, tek platformda özel deneyim sunar.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {ROLES.map(r => (
                        <div key={r.title}
                            className="p-5 rounded-2xl border border-white/5 hover:border-orange-500/20 transition-all group"
                            style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                            <div className="text-3xl mb-3">{r.icon}</div>
                            <h3 className="font-bold text-white text-sm mb-1.5 group-hover:text-orange-400 transition-colors">{r.title}</h3>
                            <p className="text-xs text-gray-500 leading-relaxed">{r.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
