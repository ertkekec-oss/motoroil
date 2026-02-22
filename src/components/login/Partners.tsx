const PARTNERS = [
    'Trendyol', 'Hepsiburada', 'Pazarama', 'n11', 'Nilvera', 'Garanti BBVA',
    'İş Bankası', 'Ziraat', 'E-Fatura', 'GİB',
];

export default function Partners() {
    return (
        <section className="py-16 px-6 border-y border-white/5" aria-label="Entegrasyon Ortakları">
            <div className="max-w-4xl mx-auto">
                <p className="text-center text-xs font-black text-gray-600 uppercase tracking-[0.3em] mb-8">
                    Entegrasyonlar & Ortaklar
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4">
                    {PARTNERS.map(p => (
                        <div key={p}
                            className="px-4 py-2 rounded-xl border border-white/5 text-xs font-bold text-gray-500 hover:text-gray-300 hover:border-white/15 transition-all"
                            style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                            {p}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
