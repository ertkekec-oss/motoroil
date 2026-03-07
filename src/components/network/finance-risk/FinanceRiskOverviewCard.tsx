"use client";

import { useEffect, useState } from 'react';

export function FinanceRiskOverviewCard() {
    const [riskInfo, setRiskInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/network/finance-risk')
            .then(res => res.json())
            .then(data => {
                if (data && data.overallRiskTier) {
                    setRiskInfo(data);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    if (loading) return <div>Yükleniyor...</div>;

    if (!riskInfo) return (
        <div className="rounded-xl border shadow-sm p-4 bg-white">
            <h3 className="font-semibold text-lg pb-2 border-b mb-4">Ticari Finansman Riski</h3>
            <p className="text-sm text-gray-500">Hesaplanan risk verisi bulunmuyor.</p>
        </div>
    );

    const getTierColor = (tier: string) => {
        if (tier === 'VERY_LOW' || tier === 'LOW') return 'bg-green-100 text-green-700';
        if (tier === 'MEDIUM') return 'bg-blue-100 text-blue-700';
        if (tier === 'HIGH' || tier === 'VERY_HIGH') return 'bg-orange-100 text-orange-700';
        return 'bg-red-100 text-red-700';
    };

    return (
        <div className="rounded-xl border shadow-sm bg-white p-4">
            <div className="flex flex-row items-center justify-between pb-2 border-b mb-4">
                <h3 className="font-semibold text-lg">Finansal Risk Profili</h3>
                <span className={`px-2 py-1 text-xs font-semibold rounded-md ${getTierColor(riskInfo.overallRiskTier)}`}>
                    {riskInfo.overallRiskTier.replace(/_/g, ' ')}
                </span>
            </div>

            <p className="text-sm text-gray-600 mb-6 border-l-2 border-gray-300 pl-3">
                {riskInfo.shortExplanation}
            </p>

            <div className="grid grid-cols-2 gap-4">
                <div className="border border-gray-100 bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 uppercase font-medium tracking-wide">Ödeme Başarısı</p>
                    <p className="text-xl font-bold mt-1 text-gray-800">
                        {Math.round(riskInfo.paymentReliabilitySummary.successfulRatio)}%
                    </p>
                    <p className="text-xs text-blue-600 mt-1">Güven Skoru: {riskInfo.paymentReliabilitySummary.score}</p>
                </div>
                <div className="border border-gray-100 bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 uppercase font-medium tracking-wide">Uyuşmazlık Riski</p>
                    <p className={`text-xl font-bold mt-1 ${riskInfo.disputeRiskSummary === 'HIGH' ? 'text-orange-600' : 'text-green-600'}`}>
                        {riskInfo.disputeRiskSummary}
                    </p>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t flex flex-col items-center justify-center">
                <p className="text-xs font-semibold uppercase text-gray-400">Önerilen Trade Finance Modu</p>
                <span className="mt-1 px-3 py-1 bg-indigo-50 text-indigo-700 font-bold rounded-lg text-sm border border-indigo-100">
                    {riskInfo.recommendedFinanceMode.replace(/_/g, ' ')}
                </span>
            </div>
        </div>
    );
}
