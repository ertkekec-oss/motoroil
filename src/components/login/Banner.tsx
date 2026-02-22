export default function Banner() {
    return (
        <div id="duyuru" className="w-full py-2.5 px-4 text-center text-xs font-bold tracking-wide"
            style={{ background: 'linear-gradient(90deg,#FF5500,#FF8C42)', color: 'white' }}>
            🚀 <strong>Yeni:</strong> Trendyol, Hepsiburada ve Pazarama entegrasyonları artık canlıda! &nbsp;
            <a href="#fiyatlama" className="underline underline-offset-2 opacity-90 hover:opacity-100">Planları incele →</a>
        </div>
    );
}
