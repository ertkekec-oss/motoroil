'use client';

import React, { useState, useEffect } from 'react';

export function TradeProposalBoard() {
    const [proposals, setProposals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/network/trade/proposals')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setProposals(data.proposals);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    if (loading) return <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm animate-pulse h-32"></div>;

    if (proposals.length === 0) {
        return (
            <div className="p-6 bg-white rounded-xl border border-gray-100 flex items-center justify-center text-gray-500">
                <span>No trade proposals generated yet. Waiting for liquidity matches...</span>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Incoming Trade Proposals</h3>
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded font-medium">{proposals.length} Actionable</span>
            </div>

            <div className="divide-y divide-gray-50 flex flex-col">
                {proposals.map(prop => (
                    <div key={prop.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex flex-col">
                                <span className="font-semibold text-gray-900 leading-tight">
                                    {prop.categoryId || 'General Commodity'}
                                </span>
                                <span className="text-sm text-gray-500 mt-0.5">
                                    Proposed Vol: {prop.proposedQuantityLow} - {prop.proposedQuantityHigh} Units
                                </span>
                            </div>
                            <div className={`px-2 py-1 rounded text-xs font-medium border ${prop.status === 'ACCEPTED' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                                {prop.status.replace(/_/g, ' ')}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 my-3 text-sm">
                            <div className="bg-gray-50 p-2 rounded border border-gray-100">
                                <span className="text-gray-500 block text-xs">Target Price</span>
                                <span className="font-semibold text-gray-800">{prop.proposedPriceLow.toLocaleString()} - {prop.proposedPriceHigh.toLocaleString()} {prop.currency}</span>
                            </div>
                            <div className="bg-gray-50 p-2 rounded border border-gray-100">
                                <span className="text-gray-500 block text-xs">Fulfillment</span>
                                <span className="font-semibold text-gray-800">{prop.shippingMode} | {prop.escrowRequired ? 'Escrow Protected' : 'Open Terms'}</span>
                            </div>
                        </div>

                        <div className="flex gap-2 justify-end mt-4">
                            {['PROPOSED', 'SUGGESTION'].includes(prop.status) && (
                                <>
                                    <button className="px-4 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium transition-colors">
                                        Accept & Convert
                                    </button>
                                    <button className="px-4 py-1.5 text-sm bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded transition-colors">
                                        Negotiate Terms
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
