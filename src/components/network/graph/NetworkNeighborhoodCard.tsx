"use client";

import { useEffect, useState } from 'react';

export function NetworkNeighborhoodCard() {
    const [summary, setSummary] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/network/graph/neighborhood')
            .then(res => res.json())
            .then(data => {
                if (data && data.totalReachableNodes !== undefined) {
                    setSummary(data);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    if (loading) return <div>Yükleniyor...</div>;

    if (!summary) return (
        <div className="rounded-xl border shadow-sm p-4 bg-white">
            <h3 className="font-semibold text-lg pb-2 border-b mb-4">Ağ Komşuluğunuz (Graph)</h3>
            <p className="text-sm">Yeterli ağ bağınız bulunmuyor.</p>
        </div>
    );

    return (
        <div className="rounded-xl border shadow-sm bg-white p-4">
            <div className="flex flex-row items-center justify-between pb-2 border-b mb-4">
                <h3 className="font-semibold text-lg">Yakın Ticaret Ağınız ({summary.hopDistance}-Hop)</h3>
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                    {summary.totalReachableNodes} Node Keşfedildi
                </span>
            </div>
            <div className="space-y-4">
                <p className="text-sm text-gray-600">
                    {summary.relevanceExplanation}
                </p>

                <div className="flex flex-wrap gap-2">
                    {summary.tags?.map((tag: string, i: number) => (
                        <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md border">
                            {tag.replace(/_/g, ' ')}
                        </span>
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="bg-gray-50 border p-3 rounded-md">
                        <p className="text-xs text-gray-500">Doğrudan Alıcılar</p>
                        <p className="text-lg font-semibold">{summary.directBuyerCount}</p>
                    </div>
                    <div className="bg-gray-50 border p-3 rounded-md">
                        <p className="text-xs text-gray-500">Doğrudan Satıcılar</p>
                        <p className="text-lg font-semibold">{summary.directSupplierCount}</p>
                    </div>
                </div>

                <p className="text-xs text-gray-400 mt-4">
                    Graph Materialization: {new Date(summary.lastUpdated).toLocaleString()}
                </p>
            </div>
        </div>
    );
}
