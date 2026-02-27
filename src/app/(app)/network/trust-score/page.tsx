"use client";

import { useState, useEffect } from "react";
import FinanceStatusBanner from "@/components/FinanceStatusBanner";

export default function TrustScorePage() {
    const [loading, setLoading] = useState(true);
    const [scoreData, setScoreData] = useState<any>(null);

    useEffect(() => {
        setLoading(true);
        fetch("/api/network/trust-score")
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data && data.score) {
                    setScoreData({
                        score: data.score.value,
                        tier: data.score.tier,
                        lastCalculatedAt: data.score.computedAt,
                        components: data.components || {
                            onTimeRatio: { value: "100%", weight: 40, status: "EXCELLENT" },
                            disputeRate: { value: "0%", weight: 30, status: "EXCELLENT" },
                            slaBreachCount: { value: 0, weight: 10, status: "EXCELLENT" },
                            chargebackRate: { value: "0%", weight: 20, status: "EXCELLENT" },
                            overrideCount: { value: 0, weight: 0, status: "NEUTRAL" }
                        }
                    });
                } else {
                    setScoreData(null);
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const formatDate = (dateString: string) => new Intl.DateTimeFormat("tr-TR", { dateStyle: "long", timeStyle: "short" }).format(new Date(dateString));

    const getTierBadge = (tier: string) => {
        switch (tier) {
            case "A": return "bg-green-100 text-green-800 border-green-500 shadow-green-100";
            case "B": return "bg-blue-100 text-blue-800 border-blue-500 shadow-blue-100";
            case "C": return "bg-amber-100 text-amber-800 border-amber-500 shadow-amber-100";
            case "D": return "bg-red-100 text-red-800 border-red-500 shadow-red-100";
            default: return "bg-slate-100 text-slate-800 border-slate-500 shadow-slate-100";
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case "EXCELLENT": return "text-green-600 bg-green-50";
            case "GOOD": return "text-blue-600 bg-blue-50";
            case "AVERAGE": return "text-amber-600 bg-amber-50";
            case "POOR": return "text-red-600 bg-red-50";
            default: return "text-slate-600 bg-slate-50";
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">⭐ Güven Skorum (Trust Score)</h1>
            <FinanceStatusBanner />

            {loading ? (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center py-12 text-slate-500">
                    Skor verileriniz yükleniyor...
                </div>
            ) : !scoreData ? (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center py-12 text-slate-500">
                    Henüz güven skorunuz hesaplanmamış. İlerleyen günlerde tekrar kontrol ediniz.
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Main Score Card */}
                    <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col items-center justify-center min-h-[300px]">
                        <div className="absolute top-0 w-full h-2 bg-gradient-to-r from-blue-400 via-indigo-500 to-green-400"></div>
                        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-6">Mevcut Skorum</h2>

                        <div className="relative flex items-center justify-center">
                            {/* Circular progress simulated */}
                            <svg className="w-48 h-48 transform -rotate-90">
                                <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                                <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray="553" strokeDashoffset={553 - (553 * scoreData.score) / 100} className="text-indigo-600 transition-all duration-1000 ease-in-out" />
                            </svg>
                            <div className="absolute flex flex-col items-center justify-center">
                                <span className="text-5xl font-black text-slate-900">{scoreData.score}</span>
                                <span className="text-sm font-medium text-slate-400">/ 100</span>
                            </div>
                        </div>

                        <div className="mt-8 flex items-center gap-3">
                            <span className="text-slate-600 font-semibold text-sm">Seviye:</span>
                            <span className={`px-4 py-1.5 rounded-full text-lg font-black tracking-wider border-2 shadow-sm ${getTierBadge(scoreData.tier)}`}>Segment {scoreData.tier}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-6 bg-slate-50 px-3 py-1 rounded w-full text-center truncate">Son Güncelleme: {formatDate(scoreData.lastCalculatedAt)}</p>
                    </div>

                    {/* Breakdown List */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm mb-6">
                            <h3 className="text-lg font-bold text-slate-800 mb-5">📈 Skor Bileşenleri</h3>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-indigo-100 transition-colors">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-800">Zamanında Teslimat (On-Time Ratio)</span>
                                        <span className="text-xs text-slate-500 mt-0.5">Ağırlık: %{scoreData.components.onTimeRatio.weight}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg font-black text-slate-900">{scoreData.components.onTimeRatio.value}</span>
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${getStatusStyle(scoreData.components.onTimeRatio.status)}`}>{scoreData.components.onTimeRatio.status}</span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-indigo-100 transition-colors">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-800">İhtilaf Oranı (Dispute Rate)</span>
                                        <span className="text-xs text-slate-500 mt-0.5">Ağırlık: %{scoreData.components.disputeRate.weight}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg font-black text-slate-900">{scoreData.components.disputeRate.value}</span>
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${getStatusStyle(scoreData.components.disputeRate.status)}`}>{scoreData.components.disputeRate.status}</span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-indigo-100 transition-colors">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-800">SLA İhlali (SLA Breach Count)</span>
                                        <span className="text-xs text-slate-500 mt-0.5">Ağırlık: %{scoreData.components.slaBreachCount.weight}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg font-black text-slate-900">{scoreData.components.slaBreachCount.value}</span>
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${getStatusStyle(scoreData.components.slaBreachCount.status)}`}>{scoreData.components.slaBreachCount.status}</span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-indigo-100 transition-colors">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-800">Chargeback / İade Risk Oranı</span>
                                        <span className="text-xs text-slate-500 mt-0.5">Ağırlık: %{scoreData.components.chargebackRate.weight}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg font-black text-slate-900">{scoreData.components.chargebackRate.value}</span>
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${getStatusStyle(scoreData.components.chargebackRate.status)}`}>{scoreData.components.chargebackRate.status}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bu Skor Neyi Etkiler? */}
                        <div className="bg-indigo-50 rounded-3xl p-8 border border-indigo-100 shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-indigo-900 mb-2">Bu Skor Neyi Etkiler?</h3>
                                <div className="space-y-2">
                                    <div className="flex items-start gap-2">
                                        <span className="text-indigo-500 mt-0.5">✅</span>
                                        <p className="text-sm text-indigo-800 font-medium">B2B Kataloğunda "Güvenilir Tedarikçi" olarak üst sıralarda listelenme.</p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <span className="text-indigo-500 mt-0.5">✅</span>
                                        <p className="text-sm text-indigo-800 font-medium">Escrow serbest bırakma süreleri (Hold Days) skorunuza göre otomatik düşürülür.</p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <span className="text-indigo-500 mt-0.5">✅</span>
                                        <p className="text-sm text-indigo-800 font-medium">Erken ödeme işlemi (Early Release) kesinti komisyonları A seviyesinde çok uygundur.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-shrink-0 bg-white p-4 rounded-xl border border-indigo-200 text-center shadow-lg shadow-indigo-100/50">
                                <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-1">Avantaj Durumu</p>
                                {scoreData.tier === 'A' || scoreData.tier === 'B' ? (
                                    <p className="text-xl font-black text-green-600">AKTİF</p>
                                ) : (
                                    <p className="text-xl font-black text-red-600">PASİF</p>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}
