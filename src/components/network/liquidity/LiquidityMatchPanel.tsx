'use client';

import React, { useState, useEffect } from 'react';

export function LiquidityMatchPanel() {
    const [matches, setMatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/network/liquidity/matches')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setMatches(data.matches);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    if (loading) return <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm animate-pulse h-32"></div>;

    if (matches.length === 0) {
        return (
            <div className="p-6 bg-white rounded-xl border border-gray-100 flex items-center justify-center text-gray-500">
                <span>No automated trade matches proposed yet. System is scanning...</span>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Trade Match Proposals</h3>
                <span className="text-xs bg-green-100 text-green-700 px-2 h-6 rounded flex items-center">{matches.length} Matches Found</span>
            </div>

            <div className="divide-y divide-gray-50 flex flex-col gap-2 p-4">
                {matches.map(match => (
                    <div key={match.id} className="p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200">
                        <div className="flex justify-between items-start">
                            <div className="flex flex-col">
                                <span className="font-semibold text-gray-900 leading-tight">Match for {match.categoryId || 'General'}</span>
                                <span className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                    Buyer: {match.buyerTenantId.substring(0, 8)} | Seller: {match.sellerTenantId.substring(0, 8)}
                                </span>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span className="font-bold text-gray-900 text-lg">Score: {Math.round(match.finalMatchScore)}</span>
                                <span className="text-xs text-gray-500 bg-white px-1.5 py-0.5 rounded border border-gray-200">
                                    Distance: {match.graphDistance}
                                </span>
                            </div>
                        </div>

                        {match.explainJson && match.explainJson.drivers && match.explainJson.drivers.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                                {match.explainJson.drivers.map((driver: string, idx: number) => (
                                    <span key={idx} className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded border border-green-100">{driver.replace(/_/g, ' ')}</span>
                                ))}
                                {match.explainJson.riskFlags?.map((flag: string, idx: number) => (
                                    <span key={`risk-${idx}`} className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded border border-red-100">{flag.replace(/_/g, ' ')}</span>
                                ))}
                            </div>
                        )}

                        <div className="mt-4 flex gap-2">
                            <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm py-2 rounded shadow-sm transition-colors">
                                Auto-Route RFQ
                            </button>
                            <button className="px-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium text-sm rounded transition-colors">
                                Dismiss
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
