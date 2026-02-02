"use client";

import { useState, useEffect } from 'react';

// Card Component for each Ratio
const RatioCard = ({ title, value, unit, status, description, color, ideal }: any) => (
    <div className="card glass p-6 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
        <div className={`absolute top-0 right-0 w-24 h-24 ${color} opacity-10 rounded-bl-full -mr-4 -mt-4 transition-all group-hover:opacity-20`} />

        <div className="relative">
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">{title}</h3>

            <div className="flex items-baseline gap-2 mb-4">
                <span className={`text-4xl font-black ${color.replace('bg-', 'text-')}`}>
                    {value}
                </span>
                <span className="text-gray-500 font-bold">{unit}</span>
            </div>

            {/* Health Status Bar */}
            <div className="w-full h-1.5 bg-gray-800 rounded-full mb-3 overflow-hidden">
                <div
                    className={`h-full ${color} rounded-full transition-all duration-1000`}
                    style={{ width: `${Math.min(Math.max((status === 'good' ? 80 : (status === 'warning' ? 50 : 20)), 0), 100)}%` }}
                />
            </div>

            <div className="flex items-center gap-2 mb-3">
                <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${status === 'good' ? 'bg-green-500/20 text-green-400' :
                        status === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                    }`}>
                    {status === 'good' ? 'İYİ DURUMDA' : (status === 'warning' ? 'DİKKAT' : 'RİSKLİ')}
                </div>
                <span className="text-[10px] text-gray-500">Hedef: {ideal}</span>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed border-t border-white/5 pt-3">
                {description}
            </p>
        </div>
    </div>
);

export default function FinancialHealthContent() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        const fetchHealth = async () => {
            try {
                const res = await fetch('/api/financials/reports/health');
                const json = await res.json();
                if (json.success) setData(json);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchHealth();
    }, []);

    if (loading) return <div className="p-12 text-center text-gray-500 animate-pulse">Analiz yapılıyor...</div>;
    if (!data) return <div className="p-12 text-center text-gray-500">Veri alınamadı.</div>;

    const { ratios, data: financials } = data;

    // --- EVALUATION LOGIC ---

    // 1. Current Ratio (Cari Oran): Ideal 1.5 - 2.0
    const cr = ratios.currentRatio;
    const crStatus = cr >= 1.5 ? 'good' : (cr >= 1.0 ? 'warning' : 'bad');
    const crMsg = crStatus === 'good'
        ? "Kısa vadeli borçlarınızı rahatça ödeyebilecek güce sahipsiniz."
        : (crStatus === 'warning' ? "Borç ödeme gücünüz sınırda. Nakit akışına dikkat edin." : "Likidite riski yüksek! Borçları çevirmekte zorlanabilirsiniz.");

    // 2. Profit Margin: Depends on sector, but >%5 is usually ok dashboard default
    const pm = ratios.profitMargin * 100; // Percentage
    const pmStatus = pm >= 20 ? 'good' : (pm >= 5 ? 'warning' : 'bad');
    const pmMsg = pmStatus === 'good'
        ? "Mükemmel karlılık! İşletme verimli çalışıyor."
        : (pmStatus === 'warning' ? "Karlılık makul seviyede ancak maliyetler optimize edilebilir." : "Şirket karsız veya zararda çalışıyor. Acil maliyet analizi gerekli.");

    // 3. Debt Ratio (Kaldıraç): Ideal < 50%
    const dr = ratios.debtRatio * 100;
    const drStatus = dr <= 50 ? 'good' : (dr <= 75 ? 'warning' : 'bad');
    const drMsg = drStatus === 'good'
        ? "Şirket finansal açıdan bağımsız, borçluluk düşük."
        : (drStatus === 'warning' ? "Borç yükü artıyor, finansman giderleri takip edilmeli." : "Şirket yüksek borç riski altında! Özkaynak yetersiz kalabilir.");

    // 4. Cash Ratio: Ideal > 0.20
    const car = ratios.cashRatio;
    const carStatus = car >= 0.2 ? 'good' : 'bad'; // Simple logic
    const carMsg = carStatus === 'good'
        ? "Acil nakit ihtiyacını karşılayacak kadar hazır paranız var."
        : "Nakit rezervleriniz çok düşük. Ani ödemelerde sıkışabilirsiniz.";


    return (
        <div className="animate-fade-in-up">
            <div className="card glass mb-6">
                <div>
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-cyan-500">
                        🩺 Finansal Sağlık Karnesi
                    </h2>
                    <p className="text-muted text-sm mt-1">
                        İşletmenizin finansal röntgeni ve kritik performans göstergeleri.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <RatioCard
                    title="CARİ ORAN (LİKİDİTE)"
                    value={cr.toFixed(2)}
                    unit=""
                    status={crStatus}
                    color={crStatus === 'good' ? 'bg-emerald-500' : (crStatus === 'warning' ? 'bg-amber-500' : 'bg-red-500')}
                    ideal="1.50 ve üzeri"
                    description={crMsg}
                />

                <RatioCard
                    title="NET KAR MARJI"
                    value={pm.toFixed(1)}
                    unit="%"
                    status={pmStatus}
                    color={pmStatus === 'good' ? 'bg-blue-500' : (pmStatus === 'warning' ? 'bg-indigo-400' : 'bg-rose-500')}
                    ideal="%20 ve üzeri"
                    description={pmMsg}
                />

                <RatioCard
                    title="KALDIRAÇ ORANI (BORÇ)"
                    value={dr.toFixed(0)}
                    unit="%"
                    status={drStatus}
                    color={drStatus === 'good' ? 'bg-cyan-500' : (drStatus === 'warning' ? 'bg-orange-400' : 'bg-red-600')}
                    ideal="%50 ve altı"
                    description={drMsg}
                />

                <RatioCard
                    title="NAKİT ORANI"
                    value={car.toFixed(2)}
                    unit=""
                    status={carStatus}
                    color={carStatus === 'good' ? 'bg-green-400' : 'bg-red-400'}
                    ideal="0.20 ve üzeri"
                    description={carMsg}
                />
            </div>

            {/* Detailed Data Summary */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card glass p-6">
                    <h4 className="text-gray-400 text-xs font-bold uppercase mb-4">VARLIK YAPISI</h4>
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-300">Dönen Varlıklar</span>
                            <span className="font-mono">{financials.currentAssets.toLocaleString('tr-TR')} ₺</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-300">Duran Varlıklar</span>
                            <span className="font-mono">{(financials.totalAssets - financials.currentAssets).toLocaleString('tr-TR')} ₺</span>
                        </div>
                        <div className="w-full h-px bg-white/10 my-2" />
                        <div className="flex justify-between text-sm font-bold text-white">
                            <span>TOPLAM</span>
                            <span className="font-mono">{financials.totalAssets.toLocaleString('tr-TR')} ₺</span>
                        </div>
                    </div>
                </div>

                <div className="card glass p-6">
                    <h4 className="text-gray-400 text-xs font-bold uppercase mb-4">KAYNAK YAPISI</h4>
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-300">Kısa Vadeli Borçlar</span>
                            <span className="font-mono">{financials.shortTermLiabilities.toLocaleString('tr-TR')} ₺</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-300">Uzun Vadeli Borçlar</span>
                            <span className="font-mono">{(financials.totalDebt - financials.shortTermLiabilities).toLocaleString('tr-TR')} ₺</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-300">Özkaynaklar</span>
                            <span className="font-mono">{(financials.totalAssets - financials.totalDebt).toLocaleString('tr-TR')} ₺</span>
                        </div>
                        <div className="w-full h-px bg-white/10 my-2" />
                        <div className="flex justify-between text-sm font-bold text-white">
                            <span>TOPLAM</span>
                            <span className="font-mono">{financials.totalAssets.toLocaleString('tr-TR')} ₺</span>
                        </div>
                    </div>
                </div>

                <div className="card glass p-6 bg-gradient-to-br from-blue-900/20 to-purple-900/20">
                    <h4 className="text-blue-300 text-xs font-bold uppercase mb-4">PERFORMANS ÖZETİ</h4>
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-300">Net Satışlar</span>
                            <span className="font-mono font-bold">{financials.netSales.toLocaleString('tr-TR')} ₺</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-300">Net Kar/Zarar</span>
                            <span className={`font-mono font-bold ${financials.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {financials.netProfit.toLocaleString('tr-TR')} ₺
                            </span>
                        </div>
                        <div className="mt-4 text-xs text-gray-400 italic">
                            * Veriler genel mizan ve gelir tablosu verilerinden anlık hesaplanmıştır.
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
