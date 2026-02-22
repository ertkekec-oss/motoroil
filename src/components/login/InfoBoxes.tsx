const INFO_BOXES = [
    {
        icon: '🔒', title: 'Güvenli & Uyumlu',
        desc: 'Tüm verileriniz ISO 27001 standartlarında korunur. KVKK uyumlu veri işleme. SSL şifreleme ile güvenli iletim.',
        color: '#3B82F6',
    },
    {
        icon: '☁️', title: 'Bulut Öncelikli Altyapı',
        desc: 'Sunucu kurulumu yok. Güncelleme derdi yok. Her cihazdan, her yerden erişim. Otomatik yedekleme.',
        color: '#10B981',
    },
    {
        icon: '🤝', title: 'Onboarding & Destek',
        desc: 'Geçiş danışmanı ataması, sınırsız onboarding seansı ve 7/24 teknik destek. İlk 30 gün tam refah.',
        color: '#F59E0B',
    },
];

export default function InfoBoxes() {
    return (
        <section className="py-16 px-6" aria-label="Platform Avantajları">
            <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {INFO_BOXES.map(b => (
                        <div key={b.title}
                            className="p-6 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-white/10 transition-all"
                            style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                            <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 blur-2xl -translate-y-1/2 translate-x-1/2"
                                style={{ background: b.color }} />
                            <div className="text-3xl mb-4">{b.icon}</div>
                            <h3 className="font-bold text-white text-sm mb-2">{b.title}</h3>
                            <p className="text-xs text-gray-500 leading-relaxed font-medium">{b.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
