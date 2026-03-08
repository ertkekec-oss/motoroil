"use client";

import { useEffect, useState } from 'react';

export function ReputationOverviewCard() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/network/reputation')
            .then(res => res.json())
            .then(data => {
                if (data && data.overallScore) {
                    setStats(data);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    if (loading) return <div>Yükleniyor...</div>;

    if (!stats) return (
        <div className="rounded-xl border shadow-sm p-4 bg-white">
            <h3 className="font-semibold text-lg pb-2 border-b mb-4">Ağ İtibarı</h3>
            <p className="text-sm">Henüz sistemde yeterli itibar verisi oluşmadı.</p>
        </div>
    );

    const getTierColor = (tier: string) => {
        if (tier === 'PREMIUM' || tier === 'HIGH_CONFIDENCE') return 'bg-purple-100 text-purple-700';
        if (tier === 'WATCHLIST' || tier === 'RESTRICTED') return 'bg-red-100 text-red-700';
        return 'bg-blue-100 text-blue-700';
    };

    return (
        <div className="rounded-xl border shadow-sm bg-white p-4">
            <div className="flex flex-row items-center justify-between pb-2 border-b mb-4">
                <h3 className="font-semibold text-lg">Periodya Ticari İtibar Statüsü</h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTierColor(stats.reputationTier)}`}>
                    {stats.reputationTier.replace(/_/g, ' ')}
                </span>
            </div>

            <div className="space-y-4">
                <div className="flex items-center space-x-4 mb-4">
                    <div className="text-3xl font-bold">{stats.overallScore}</div>
                    <div className="text-sm text-gray-500">
                        {stats.trendDirection === 'UP' ? 'Yükselişte' : stats.trendDirection === 'DOWN' ? 'Düşüşte' : 'Stabil'}
                    </div>
                </div>

                <p className="text-sm text-gray-600 mb-2">
                    {stats.explanation}
                </p>

                <div className="grid grid-cols-3 gap-2">
                    <div className="bg-gray-50 border p-2 rounded-md text-center">
                        <p className="text-xs text-gray-500">Tedarikçi Kapasitesi</p>
                        <p className="text-sm font-semibold">{stats.roleSummaries.supplier}</p>
                    </div>
                    <div className="bg-gray-50 border p-2 rounded-md text-center">
                        <p className="text-xs text-gray-500">Alım Kapasitesi</p>
                        <p className="text-sm font-semibold">{stats.roleSummaries.buyer}</p>
                    </div>
                    <div className="bg-gray-50 border p-2 rounded-md text-center">
                        <p className="text-xs text-gray-500">Partner Kapasitesi</p>
                        <p className="text-sm font-semibold">{stats.roleSummaries.partner}</p>
                    </div>
                </div>

                {stats.topPositives.length > 0 && (
                    <div className="mt-4">
                        <h4 className="text-xs font-semibold text-gray-600 mb-1">Pozitif Etkenler</h4>
                        <ul className="text-xs text-green-700 space-y-1 pl-4 list-disc">
                            {stats.topPositives?.map((p: string, i: number) => <li key={i}>{p}</li>)}
                        </ul>
                    </div>
                )}

                {stats.topNegatives.length > 0 && (
                    <div className="mt-2">
                        <h4 className="text-xs font-semibold text-gray-600 mb-1">Dikkat Noktaları</h4>
                        <ul className="text-xs text-red-600 space-y-1 pl-4 list-disc">
                            {stats.topNegatives?.map((n: string, i: number) => <li key={i}>{n}</li>)}
                        </ul>
                    </div>
                )}

                <p className="text-xs text-gray-400 mt-4">
                    Son Güncelleme: {new Date(stats.lastUpdated).toLocaleString()}
                </p>
            </div>
        </div>
    );
}
