"use client";

import { useState, useEffect } from "react";
import FinanceStatusBanner from "@/components/FinanceStatusBanner";

export default function TrustScorePage() {
    const [loading, setLoading] = useState(true);
    const [scoreData, setScoreData] = useState<any>(null);

    useEffect(() => {
        setLoading(true);
        fetch("/api/company/trust")
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data && data.status !== "NO_PROFILE") {
                    setScoreData({
                        score: data.overallScore,
                        tier: data.trustLevel,
                        lastCalculatedAt: data.lastCalculatedAt,
                        components: {
                            onTimeRatio: { value: data.metrics?.shippingScore + "%", weight: 20, status: data.metrics?.shippingScore > 80 ? "EXCELLENT" : "AVERAGE" },
                            disputeRate: { value: data.metrics?.disputeScore + "%", weight: 10, status: data.metrics?.disputeScore > 80 ? "EXCELLENT" : "POOR" },
                            slaBreachCount: { value: data.metrics?.identityScore === 100 ? "Verified" : "Unverified", weight: 35, status: data.metrics?.identityScore === 100 ? "EXCELLENT" : "POOR" },
                            chargebackRate: { value: data.metrics?.paymentScore + "%", weight: 10, status: data.metrics?.paymentScore > 80 ? "EXCELLENT" : "AVERAGE" },
                            overrideCount: { value: data.metrics?.tradeScore + "%", weight: 25, status: data.metrics?.tradeScore > 80 ? "EXCELLENT" : "AVERAGE" }
                        }
                    });
                } else {
                    setScoreData(null);
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const formatDate = (dateString: string | null | undefined) => {
        if (!dateString) return "Bilinmiyor";
        try {
            return new Intl.DateTimeFormat("tr-TR", { dateStyle: "long", timeStyle: "short" }).format(new Date(dateString));
        } catch {
            return "Geçersiz Tarih";
        }
    };

    const getTierBadge = (tier: string) => {
        switch (tier) {
            case "A": return "bg-emerald-100 text-emerald-800 border-emerald-500 shadow-sm";
            case "B": return "bg-blue-100 text-blue-800 border-blue-500 shadow-sm";
            case "C": return "bg-amber-100 text-amber-800 border-amber-500 shadow-sm";
            case "D": return "bg-red-100 text-red-800 border-red-500 shadow-sm";
            default: return "bg-slate-100 text-slate-800 border-slate-300 shadow-sm";
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case "EXCELLENT": return "text-emerald-700 bg-emerald-50 border-emerald-200";
            case "GOOD": return "text-blue-700 bg-blue-50 border-blue-200";
            case "AVERAGE": return "text-amber-700 bg-amber-50 border-amber-200";
            case "POOR": return "text-red-700 bg-red-50 border-red-200";
            default: return "text-slate-700 bg-slate-50 border-slate-200";
        }
    };

    return (
        <div className="bg-slate-50 min-h-screen dark:bg-[#0f172a] pb-16 w-full font-sans">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight mb-2">Satıcı Güven Skoru (Trust Score)</h1>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Platform içerisindeki performansınızı ve finansal itibarınızı belirleyen temel metrikler.</p>
                </div>

                <div className="mb-8">
                    <FinanceStatusBanner />
                </div>

                {loading ? (
                    <div className="bg-white dark:bg-[#0f172a] p-12 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm flex flex-col justify-center items-center">
                        <div className="w-8 h-8 border-4 border-slate-200 dark:border-white/5 border-t-slate-900 rounded-full animate-spin mb-4"></div>
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest">GÜVEN VERİLERİ SORGULANIYOR...</span>
                    </div>
                ) : !scoreData ? (
                    <div className="bg-white dark:bg-[#0f172a] p-16 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm flex flex-col justify-center items-center text-center">
                        <div className="w-16 h-16 bg-slate-50 dark:bg-[#1e293b] rounded-2xl flex items-center justify-center text-3xl mb-4 border border-slate-200 dark:border-white/5 shadow-sm">
                            📊
                        </div>
                        <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white">Güven Skoru Bekliyor</h2>
                        <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-2 max-w-md">
                            Yeterli ağ hareketi olmadığından henüz skorunuz hesaplanmamış. İlerleyen günlerde yeni sipariş ve teslimat verileriyle birlikte oluşacaktır.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Sol Panel: Main Score Card */}
                        <div className="lg:col-span-4 flex flex-col gap-6">
                            <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-8 border border-slate-200 dark:border-white/5 shadow-sm relative flex flex-col items-center justify-center min-h-[360px]">
                                <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-8">GLOBAL İTİBAR İNDEKSİ</h2>

                                <div className="relative flex items-center justify-center mb-8">
                                    <svg className="w-48 h-48 transform -rotate-90">
                                        <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                                        <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray="553" strokeDashoffset={553 - (553 * scoreData.score) / 100} className={scoreData.score >= 80 ? "text-emerald-500 transition-all duration-1000" : scoreData.score >= 50 ? "text-amber-500 transition-all duration-1000" : "text-red-500 transition-all duration-1000"} />
                                    </svg>
                                    <div className="absolute flex flex-col items-center justify-center">
                                        <span className={`text-[56px] font-bold tracking-tighter ${scoreData.score >= 80 ? 'text-emerald-600' : scoreData.score >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{scoreData.score}</span>
                                        <span className="text-sm font-semibold text-slate-400">/ 100</span>
                                    </div>
                                </div>

                                <div className="w-full flex items-center justify-between px-2 py-4 bg-slate-50 dark:bg-[#1e293b] rounded-xl border border-slate-100 mb-4">
                                    <span className="text-slate-600 dark:text-slate-400 font-semibold text-[13px] ml-2">Risk Segmenti:</span>
                                    <span className={`px-4 py-1.5 rounded-lg text-lg font-black tracking-wider border mr-2 ${getTierBadge(scoreData.tier)}`}>Segment {scoreData.tier}</span>
                                </div>
                                <div className="w-full text-center">
                                    <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Son Değerleme</p>
                                    <p className="text-[13px] font-medium text-slate-700 mt-1">{formatDate(scoreData.lastCalculatedAt)}</p>
                                </div>
                            </div>

                            {/* Avantaj Durumu Modülü */}
                            <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-6 border border-slate-200 dark:border-white/5 shadow-sm text-center">
                                <h3 className="text-[13px] font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-widest">Ayrıcalık Statüsü</h3>
                                {scoreData.tier === 'A' || scoreData.tier === 'B' ? (
                                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl py-6 px-4">
                                        <div className="w-12 h-12 bg-white dark:bg-[#0f172a] rounded-full flex items-center justify-center mx-auto mb-3 shadow-[0_2px_10px_rgba(16,185,129,0.2)]">
                                            <span className="text-emerald-600 text-xl font-black">✓</span>
                                        </div>
                                        <p className="text-[15px] font-bold text-emerald-800">Tam Yetkili Erişim Aktif</p>
                                        <p className="text-[12px] text-emerald-600 mt-2 font-medium">B2B avantajları ve erken finansman seçenekleri firmanız için onaylandı.</p>
                                    </div>
                                ) : (
                                    <div className="bg-red-50 border border-red-200 rounded-xl py-6 px-4">
                                        <div className="w-12 h-12 bg-white dark:bg-[#0f172a] rounded-full flex items-center justify-center mx-auto mb-3 shadow-[0_2px_10px_rgba(239,68,68,0.2)]">
                                            <span className="text-red-600 text-xl font-black">✗</span>
                                        </div>
                                        <p className="text-[15px] font-bold text-red-800">Sınırlı Erişim</p>
                                        <p className="text-[12px] text-red-600 mt-2 font-medium">Skorunuz düşük olduğu için erken finansman (Early Payout) kapalı.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sağ Panel: Breakdown List */}
                        <div className="lg:col-span-8 flex flex-col gap-6">
                            <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
                                <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 dark:bg-[#1e293b]/50">
                                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">Algoritma Metrikleri & Bileşen İncelemesi</h3>
                                    <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">Sistem tarafından hesaplanan operasyonel sağlık değişkenleriniz.</p>
                                </div>

                                <div className="p-6">
                                    <div className="grid grid-cols-1 gap-4">
                                        {[
                                            {
                                                title: "Şirket Kimlik Doğrulaması (KYB)",
                                                weight: scoreData.components.slaBreachCount.weight,
                                                val: scoreData.components.slaBreachCount.value,
                                                status: scoreData.components.slaBreachCount.status,
                                                icon: "🛡️"
                                            },
                                            {
                                                title: "Kargo ve Operasyonel Başarı (Shipping)",
                                                weight: scoreData.components.onTimeRatio.weight,
                                                val: scoreData.components.onTimeRatio.value,
                                                status: scoreData.components.onTimeRatio.status,
                                                icon: "📦"
                                            },
                                            {
                                                title: "Ticari İşlem Tamamlama (Trade Completion)",
                                                weight: scoreData.components.overrideCount.weight,
                                                val: scoreData.components.overrideCount.value,
                                                status: scoreData.components.overrideCount.status,
                                                icon: "🤝"
                                            },
                                            {
                                                title: "Finansal İtibar & Ödeme Disiplini",
                                                weight: scoreData.components.chargebackRate.weight,
                                                val: scoreData.components.chargebackRate.value,
                                                status: scoreData.components.chargebackRate.status,
                                                icon: "💳"
                                            },
                                            {
                                                title: "İhtilaf ve Anlaşmazlık Oranı (Dispute Scale)",
                                                weight: scoreData.components.disputeRate.weight,
                                                val: scoreData.components.disputeRate.value,
                                                status: scoreData.components.disputeRate.status,
                                                icon: "⚖️"
                                            }
                                        ]?.map((item, idx) => (
                                            <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white dark:bg-[#0f172a] p-5 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm hover:border-slate-300 transition-colors gap-4">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-10 h-10 bg-slate-50 dark:bg-[#1e293b] border border-slate-100 rounded-lg flex items-center justify-center text-lg shrink-0 mt-0.5">
                                                        {item.icon}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-slate-900 dark:text-white text-[14px]">{item.title}</h4>
                                                        <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mt-1">Platform Etki Ağırlığı: <span className="text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded ml-1">% {item.weight}</span></p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 border-t border-slate-100 pt-3 sm:border-0 sm:pt-0">
                                                    <div className="text-right">
                                                        <div className="text-[20px] font-bold text-slate-900 dark:text-white">{item.val}</div>
                                                    </div>
                                                    <div className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${getStatusStyle(item.status)}`}>
                                                        {item.status}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Ekstra Bilgi Modülü - Semantic Nötr Info (Blue) */}
                            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 shadow-sm">
                                <h3 className="text-[15px] font-bold text-blue-900 mb-3 flex items-center gap-2">
                                    <span>💡</span> Bilgilendirme: Skor Politikası ve Etkileri
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                    <div className="bg-white dark:bg-[#0f172a] border border-blue-100 rounded-xl p-4">
                                        <p className="text-[13px] font-bold text-slate-800 mb-1">Katalog Görünürlüğü</p>
                                        <p className="text-[12px] text-slate-600 dark:text-slate-400 leading-relaxed">Özellikle "A" ve "B" segment satıcıların ürünleri B2B arama dizininde Boost özelliğine bağımsız olarak %40 daha fazla organik gösterim alır.</p>
                                    </div>
                                    <div className="bg-white dark:bg-[#0f172a] border border-blue-100 rounded-xl p-4">
                                        <p className="text-[13px] font-bold text-slate-800 mb-1">Finansman Limitleri</p>
                                        <p className="text-[12px] text-slate-600 dark:text-slate-400 leading-relaxed">Early Payout (Erken Fon Çekimi) işlem maliyetleri, yüksek güven skoruna sahip tedarikçiler için daha düşük faiz bareminden hesaplanır.</p>
                                    </div>
                                    <div className="bg-white dark:bg-[#0f172a] border border-blue-100 rounded-xl p-4">
                                        <p className="text-[13px] font-bold text-slate-800 mb-1">Escrow Bekleme Süresi</p>
                                        <p className="text-[12px] text-slate-600 dark:text-slate-400 leading-relaxed">Kargo tesliminden sonra havuzda bekleyen paranın serbest hesabınıza düşmesi (Auto-Release) skor durumuna göre kısaltılır.</p>
                                    </div>
                                    <div className="bg-white dark:bg-[#0f172a] border border-blue-100 rounded-xl p-4">
                                        <p className="text-[13px] font-bold text-slate-800 mb-1">SLA Limitleri</p>
                                        <p className="text-[12px] text-slate-600 dark:text-slate-400 leading-relaxed">Art arda sipariş reddeden veya gönderim tarihini aksatan firmaların skoru 24 saat içerisinde "D" segmentine degrade edilir.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
}
