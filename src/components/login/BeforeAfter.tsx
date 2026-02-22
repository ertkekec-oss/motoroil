const BEFORE_AFTER = [
    { before: 'Farklı programlarda veri takibi, manuel hesaplama', after: 'Her şey tek ekranda — anlık senkron' },
    { before: 'Ay sonu muhasebe kapatma: 3–5 gün', after: 'Anlık muhasebe kaydı, anında raporlama' },
    { before: 'Pazaryeri siparişlerini tek tek girmek', after: 'Otomatik entegrasyon, sıfır manuel iş' },
    { before: 'PDKS için ayrı uygulama ve Excel', after: 'Dijital kartlı sisteme entegre PDKS' },
];

export default function BeforeAfter() {
    return (
        <section id="destek" className="py-20 px-6" aria-labelledby="ba-heading">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <h2 id="ba-heading" className="text-3xl font-black text-white mb-3">Eskiden mi, şimdi mi?</h2>
                    <p className="text-gray-400">Periodya'ya geçen işletmelerin gerçek farkı</p>
                </div>
                <div className="space-y-3">
                    {BEFORE_AFTER.map((item, i) => (
                        <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="p-4 rounded-2xl border border-red-500/10 flex items-start gap-3"
                                style={{ backgroundColor: 'rgba(239,68,68,0.04)' }}>
                                <span className="text-red-400 text-xl flex-shrink-0">✗</span>
                                <span className="text-sm text-gray-400 font-medium">{item.before}</span>
                            </div>
                            <div className="p-4 rounded-2xl border border-green-500/10 flex items-start gap-3"
                                style={{ backgroundColor: 'rgba(16,185,129,0.04)' }}>
                                <span className="text-green-400 text-xl flex-shrink-0">✓</span>
                                <span className="text-sm text-gray-300 font-medium">{item.after}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
