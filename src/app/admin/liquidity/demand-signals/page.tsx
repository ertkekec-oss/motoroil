"use client";

import React, { useEffect, useState } from "react";

export default function DemandSignalsAdminPage() {
    const [signals, setSignals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSignals();
    }, []);

    const fetchSignals = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/admin/liquidity/demand-signals");
            const data = await res.json();
            setSignals(data);
        } catch (error) {
            console.error("Failed to fetch demand signals", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (action: string) => {
        try {
            await fetch(`/api/admin/liquidity/${action}`, { method: "POST" });
            alert(`${action} job started in background.`);
        } catch (error) {
            console.error(`Failed to execute ${action}`, error);
        }
    };

    const getTypeBadge = (type: string) => {
        switch (type) {
            case "STOCKOUT_RISK": return <span className="text-red-600 font-bold">{type}</span>;
            case "DEMAND_SPIKE": return <span className="text-purple-600 font-bold">{type}</span>;
            case "FAST_MOVING_PRODUCT": return <span className="text-green-600 font-bold">{type}</span>;
            default: return <span className="text-gray-800 font-bold">{type}</span>;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "OPEN": return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-semibold">OPEN</span>;
            case "RESOLVED": return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-semibold">RESOLVED</span>;
            case "EXPIRED": return <span className="px-2 py-1 bg-gray-200 text-gray-800 text-xs rounded-full font-semibold">EXPIRED</span>;
            default: return <span className="bg-gray-100 px-2 py-1 text-xs rounded-full font-semibold">{status}</span>;
        }
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Demand Signals</h1>
                <div className="flex space-x-3">
                    <button
                        onClick={() => handleAction('rebuild-demand-forecasts')}
                        className="bg-black text-white px-4 py-2 rounded-md font-medium text-sm flex items-center justify-center hover:bg-gray-800 transition-colors"
                    >
                        Rebuild Forecasts
                    </button>
                    <button
                        onClick={() => handleAction('expire-demand-signals')}
                        className="bg-white border text-gray-900 border-gray-300 px-4 py-2 rounded-md font-medium text-sm flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                        Expire Old Signals
                    </button>
                </div>
            </div>

            <div className="card bg-white p-4 rounded-xl border border-gray-200 shadow-sm overflow-hidden text-sm">
                {loading ? (
                    <p className="p-4 text-gray-500">Loading demand signals...</p>
                ) : signals.length === 0 ? (
                    <p className="p-4 text-gray-500">No demand signals found.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 text-left">
                                <tr>
                                    <th className="px-6 py-3 font-medium text-gray-500 uppercase tracking-wider text-xs">Tenant / Product</th>
                                    <th className="px-6 py-3 font-medium text-gray-500 uppercase tracking-wider text-xs">Signal Source</th>
                                    <th className="px-6 py-3 font-medium text-gray-500 uppercase tracking-wider text-xs">Strength / Conf</th>
                                    <th className="px-6 py-3 font-medium text-gray-500 uppercase tracking-wider text-xs">Action Req.</th>
                                    <th className="px-6 py-3 font-medium text-gray-500 uppercase tracking-wider text-xs">Detected At</th>
                                    <th className="px-6 py-3 font-medium text-gray-500 uppercase tracking-wider text-xs">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {signals.map((s) => (
                                    <tr key={s.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-semibold text-gray-900 truncate max-w-[200px]" title={s.productId}>{s.productId}</div>
                                            <div className="text-gray-500 text-xs truncate max-w-[200px]" title={s.tenantId}>{s.tenantId}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm">{getTypeBadge(s.signalType)}</div>
                                            <div className="text-xs text-gray-500">Stockout in {s.projectedDaysToStockout ?? '?'} days</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-gray-900 font-bold text-sm">{(s.signalStrength * 100).toFixed(0)}%</div>
                                            <div className="text-gray-400 text-xs">Conf: {(s.confidenceScore * 100).toFixed(0)}%</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-medium text-blue-600">Reorder: {s.reorderRecommendation} units</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-xs">
                                            {new Date(s.detectedAt).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(s.status)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
