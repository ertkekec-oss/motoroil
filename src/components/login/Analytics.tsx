const METRICS = [
    { label: 'Muhasebe İşlemleri', before: 25, after: 92, unit: '% otomasyon' },
    { label: 'Sipariş İşleme Hızı', before: 20, after: 95, unit: '% daha hızlı' },
    { label: 'Hata Oranı', before: 78, after: 8, unit: '% azalma' },
    { label: 'Maliyet Tasarrufu', before: 0, after: 35, unit: '% ortalama' },
];

export default function Analytics() {
    return (
        <section className="py-20 px-6" aria-labelledby="analytics-heading">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <span className="text-xs font-black text-orange-400 uppercase tracking-[0.3em]">Veri</span>
                    <h2 id="analytics-heading" className="text-3xl font-black text-white mt-2 mb-3">Rakamlar konuşuyor</h2>
                    <p className="text-gray-400">Geçiş yapan işletmelerin 6 ay sonra ölçtüğü sonuçlar</p>
                </div>
                <div className="space-y-5">
                    {METRICS.map(m => (
                        <div key={m.label} className="p-5 rounded-2xl border border-white/5" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-sm font-bold text-white">{m.label}</span>
                                <span className="text-xs font-black text-orange-400">{m.after}{m.unit.replace('%', '').trim() !== 'azalma' ? '+' : ''} {m.unit}</span>
                            </div>
                            <div className="relative h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                                <div
                                    className="absolute left-0 top-0 h-full rounded-full transition-all"
                                    style={{ width: `${m.after}%`, background: 'linear-gradient(90deg,#FF5500,#FF8C42)' }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
