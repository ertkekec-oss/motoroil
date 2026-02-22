export default function Announcement() {
    return (
        <section id="duyuru-section" className="px-6 py-6" aria-label="Duyurular">
            <div className="max-w-4xl mx-auto">
                <div className="p-4 rounded-2xl border border-blue-500/20 flex items-start gap-4"
                    style={{ backgroundColor: 'rgba(59,130,246,0.06)' }}>
                    <span className="text-2xl flex-shrink-0">📣</span>
                    <div>
                        <div className="font-bold text-white text-sm mb-0.5">Yeni: Saha Satış & Kampanya Modülü</div>
                        <p className="text-xs text-gray-400 font-medium">
                            Saha ekipleriniz için rota planlama, ziyaret takibi ve kampanya yönetimi artık Periodya'da.
                            Tüm hesaplarda varsayılan olarak aktif.
                        </p>
                    </div>
                    <a href="#ozellikler" className="ml-auto flex-shrink-0 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors whitespace-nowrap">
                        İncele →
                    </a>
                </div>
            </div>
        </section>
    );
}
