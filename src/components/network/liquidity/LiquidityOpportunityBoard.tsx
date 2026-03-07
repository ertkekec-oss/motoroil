'use client';

import React, { useState, useEffect } from 'react';

export function LiquidityOpportunityBoard() {
    const [opportunities, setOpportunities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/network/liquidity/opportunities')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setOpportunities(data.opportunities);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    if (loading) return <div className="p-4 rounded-xl border border-gray-100 bg-white">Loading Opportunities...</div>;

    if (opportunities.length === 0) {
        return (
            <div className="p-6 rounded-xl border border-gray-100 bg-white flex flex-col items-center justify-center text-gray-500">
                <span className="text-xl mb-2">🔍</span>
                <p>No active liquidity opportunities discovered at the moment.</p>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h3 className="font-medium text-gray-900">Active Trade Opportunities</h3>
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-lg">{opportunities.length} Total</span>
            </div>
            <div className="divide-y divide-gray-100">
                {opportunities.map(opp => (
                    <div key={opp.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold text-gray-900">
                                {opp.opportunityType === 'SUPPLY_SURPLUS' ? 'Excess Supply' : 'Demand Shortage'} : {opp.categoryId || 'General'}
                            </span>
                            <span className="text-xs text-gray-500 mt-1">
                                Volume Score: {opp.liquidityVolumeScore.toFixed(1)} | Location: {opp.regionCode || 'N/A'}
                            </span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className={`text-xs px-2 py-1 rounded-lg ${opp.status === 'RANKED' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                                {opp.status}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
