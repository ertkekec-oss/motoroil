const STATS = [
    { val: '2.500+', label: 'Aktif İşletme', icon: '🏢' },
    { val: '₺1.2 Milyar', label: 'İşlenen İşlem Hacmi', icon: '💳' },
    { val: '%99.9', label: 'Uptime SLA', icon: '⚡' },
    { val: '4.8/5', label: 'Müşteri Memnuniyeti', icon: '⭐' },
];

export default function Stats() {
    return (
        <section className="py-16 px-6" aria-label="Platform İstatistikleri">
            <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {STATS.map(s => (
                        <div key={s.label}
                            className="text-center p-6 rounded-2xl border border-white/5 hover:border-orange-500/20 transition-all group"
                            style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                            <div className="text-2xl mb-2">{s.icon}</div>
                            <div className="text-3xl font-black text-white mb-1 group-hover:text-orange-400 transition-colors">{s.val}</div>
                            <div className="text-xs text-gray-500 font-bold">{s.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
