const PLANS = [
    {
        name: 'Başlangıç', price: '₺990', period: '/ay',
        desc: 'Küçük işletmeler için temel modüller',
        features: ['Muhasebe & Fatura', 'Stok Yönetimi', 'POS Terminali', '1 Kullanıcı', 'E-posta Destek'],
        cta: 'Başla', accent: false,
    },
    {
        name: 'Büyüme', price: '₺2.490', period: '/ay',
        desc: 'Büyüyen işletmeler için tam paket',
        features: ['Tüm Başlangıç Özellikleri', 'Pazaryeri Entegrasyonu', 'CRM & Müşteri Takibi', 'PDKS & Personel', '5 Kullanıcı', 'Öncelikli Destek'],
        cta: 'Demo Al', accent: true,
        badge: 'En Popüler',
    },
    {
        name: 'Kurumsal', price: 'Özel', period: '',
        desc: 'Büyük kurumlar için esnek çözüm',
        features: ['Sınırsız Kullanıcı', 'Saha Satış Modülü', 'Özel Entegrasyonlar', 'API Erişimi', 'SLA Garantisi', 'Dedicated Destek'],
        cta: 'İletişime Geç', accent: false,
    },
];

export default function Pricing({ onDemoClick }: { onDemoClick?: () => void }) {
    return (
        <section id="fiyatlama" className="py-20 px-6" aria-labelledby="pricing-heading">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-14">
                    <span className="text-xs font-black text-orange-400 uppercase tracking-[0.3em]">Fiyatlama</span>
                    <h2 id="pricing-heading" className="text-3xl font-black text-white mt-2 mb-3">
                        Büyüklüğünüze uygun plan
                    </h2>
                    <p className="text-gray-400">İlk 30 gün ücretsiz deneyin. Kredi kartı gerekmez.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {PLANS.map(p => (
                        <div key={p.name}
                            className={`relative p-6 rounded-2xl border transition-all flex flex-col ${p.accent
                                ? 'border-orange-500/40'
                                : 'border-white/5 hover:border-white/10'}`}
                            style={{ backgroundColor: p.accent ? 'rgba(255,85,0,0.06)' : 'rgba(255,255,255,0.02)' }}>
                            {p.badge && (
                                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white"
                                    style={{ background: 'linear-gradient(135deg,#FF5500,#E64A00)' }}>
                                    {p.badge}
                                </span>
                            )}
                            <div className="mb-4">
                                <div className="font-black text-white text-base">{p.name}</div>
                                <div className="text-xs text-gray-500 mt-0.5">{p.desc}</div>
                            </div>
                            <div className="mb-5">
                                <span className="text-4xl font-black text-white">{p.price}</span>
                                <span className="text-sm text-gray-500 font-bold">{p.period}</span>
                            </div>
                            <ul className="space-y-2 mb-6 flex-1">
                                {p.features.map(f => (
                                    <li key={f} className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                                        <span className="text-green-500 flex-shrink-0">✓</span> {f}
                                    </li>
                                ))}
                            </ul>
                            <button
                                onClick={onDemoClick}
                                className={`block w-full py-3 rounded-xl text-sm font-bold text-center transition-all ${p.accent
                                    ? 'text-white hover:opacity-90'
                                    : 'text-gray-300 border border-white/10 hover:bg-white/5'}`}
                                style={p.accent ? { background: 'linear-gradient(135deg,#FF5500,#E64A00)' } : {}}>
                                {p.cta}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
