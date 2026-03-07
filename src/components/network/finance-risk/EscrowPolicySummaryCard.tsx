"use client";

import { useEffect, useState } from 'react';

export function EscrowPolicySummaryCard() {
    const [policy, setPolicy] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/network/finance-risk/policy')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    setPolicy(data[0]); // Using the most recent dynamic decision
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    if (loading) return null;
    if (!policy) return null;

    return (
        <div className="rounded-xl border shadow-sm p-4 bg-white mt-4">
            <h3 className="font-semibold text-lg pb-2 border-b mb-4">Mevcut Escrow Kural Seti</h3>

            <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-medium text-gray-700">Otonom Karar Modeli</span>
                <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded-md border">
                    {policy.decision.replace(/_/g, ' ')}
                </span>
            </div>

            <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg flex items-center justify-between">
                <div>
                    <p className="text-xs text-blue-800 font-semibold mb-1 uppercase">Varsayılan Blokaj (Hold)</p>
                    <p className="text-xl font-bold text-blue-900">{policy.holdDays} Gün</p>
                </div>
                <div className="h-8 border-r border-blue-200 mx-4"></div>
                <div>
                    <p className="text-xs text-blue-800 font-semibold mb-1 uppercase">İtiraz Süresi</p>
                    <p className="text-xl font-bold text-blue-900">{policy.disputeWindow} Saat</p>
                </div>
            </div>

            <p className="text-xs text-gray-500 mt-4 leading-relaxed bg-gray-50 p-2 rounded border border-gray-100">
                Bu policy firmanın anlık Network Trade Risk modeline göre dinamik hesaplanmıştır. Yeni işlem ve repütasyon değişimlerinde güncellenir.
            </p>
        </div>
    );
}
