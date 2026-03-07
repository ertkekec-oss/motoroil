'use client';

import React, { useState, useEffect } from 'react';

export function CategoryLiquidityHeatmap() {
    const [snapshots, setSnapshots] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/admin/network/liquidity/snapshots')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setSnapshots(data.snapshots);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    if (loading) return <div className="p-4 bg-gray-50 animate-pulse h-24 rounded-lg">Loading Heatmap...</div>;

    if (snapshots.length === 0) {
        return <div className="p-4 bg-white border border-gray-100 rounded-lg text-gray-500 text-sm">No categorical heatmap data yet. Run nightly snapshot generator.</div>;
    }

    return (
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm h-full">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 block"></span>
                Sector Liquidity Density
            </h3>

            <div className="space-y-4">
                {snapshots.slice(0, 5).map(snap => (
                    <div key={snap.id} className="group">
                        <div className="flex justify-between items-center text-sm font-medium mb-1.5">
                            <span className="text-gray-900">{snap.categoryId || 'General'}</span>
                            <span className="text-gray-500 font-normal">Gap Score: {snap.liquidityGapScore}</span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden flex">
                            <div
                                className="h-full bg-green-500 transition-all duration-500"
                                style={{ width: `${Math.min(100, snap.supplyVolumeScore)}%` }}
                                title={`Supply Volume: ${snap.supplyVolumeScore}`}
                            ></div>
                            <div
                                className="h-full bg-blue-500 transition-all duration-500 opacity-80"
                                style={{ width: `${Math.min(100, snap.demandVolumeScore)}%` }}
                                title={`Demand Volume: ${snap.demandVolumeScore}`}
                            ></div>
                        </div>
                        <div className="text-xs text-gray-400 mt-1.5 flex justify-between">
                            <span>S: {snap.activeSupplierCount} Nodes</span>
                            <span>B: {snap.activeBuyerCount} Nodes</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
