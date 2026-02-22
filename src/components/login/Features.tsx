const FEATURES = [
    { icon: '📊', title: 'Gerçek Zamanlı Muhasebe', desc: 'Her işlem anında kayıt altına alınır. Mizan, bilanço, gelir tablosu — her an hazır.' },
    { icon: '🛒', title: 'Pazaryeri Entegrasyonu', desc: 'Trendyol, Hepsiburada, Pazarama, n11 — siparişler, iadeler, faturalamalar tek merkezde.' },
    { icon: '📦', title: 'Stok & Depo Yönetimi', desc: 'Çok depolu yapı, barkod, lot takibi, kritik stok uyarıları ve transfer işlemleri.' },
    { icon: '👥', title: 'CRM & Müşteri Takibi', desc: 'Müşteri kartları, borç/alacak takibi, iletişim geçmişi ve segmentasyon.' },
    { icon: '🕐', title: 'PDKS & Personel', desc: 'Giriş-çıkış takibi, puantaj, maaş hesaplama, özlük dosyası ve dijital arşiv.' },
    { icon: '🚀', title: 'Saha Satış', desc: 'Mobil CRM, rota planlama, ziyaret takibi ve anlık sipariş alma.' },
    { icon: '📄', title: 'E-Fatura & E-Arşiv', desc: 'GİB entegrasyonu ile e-fatura, e-arşiv ve e-irsaliye tek tıkla.' },
    { icon: '📈', title: 'İleri Raporlama', desc: 'Ciro, kâr-zarar, kategori analizi, kariyer grafikleri ve özelleştirilebilir raporlar.' },
];

export default function Features() {
    return (
        <section id="ozellikler" className="py-20 px-6" aria-labelledby="features-heading">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-14">
                    <span className="text-xs font-black text-orange-400 uppercase tracking-[0.3em]">Modüller</span>
                    <h2 id="features-heading" className="text-3xl font-black text-white mt-2 mb-3">
                        İhtiyacınız olan her şey
                    </h2>
                    <p className="text-gray-400 max-w-xl mx-auto">
                        Ayrı ayrı program yerine tek entegre sistem. Tüm verileriniz birbirine bağlı.
                    </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {FEATURES.map(f => (
                        <div key={f.title}
                            className="p-5 rounded-2xl border border-white/5 hover:border-orange-500/20 transition-all group cursor-default"
                            style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                            <div className="text-2xl mb-3">{f.icon}</div>
                            <h3 className="font-bold text-white text-sm mb-1.5 group-hover:text-orange-400 transition-colors">{f.title}</h3>
                            <p className="text-xs text-gray-500 leading-relaxed font-medium">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
