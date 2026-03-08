"use client";

import React, { useEffect, useState } from "react";

export default function DemandForecastsAdminPage() {
    const [forecasts, setForecasts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchForecasts();
    }, []);

    const fetchForecasts = async () => {
        try {
            setLoading(true);
            // Let's use the local API if available, else we can simulate.
            // Wait, there's no dedicated GET all forecasts admin endpoint yet, 
            // let's fetch signals instead or simulate if the endpoint isn't wired.
            // If we don't have the endpoint defined, I will use demand-signals as a proxy or 
            // create it if needed. The prompt requests it.
            const res = await fetch("/api/liquidity/demand-forecasts");
            const data = await res.json();
            setForecasts(data || []);
        } catch (error) {
            console.error("Failed to fetch demand forecasts", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Demand Forecasts</h1>
            </div>

            <div className="card bg-white p-4 rounded-xl border border-gray-200 shadow-sm overflow-hidden text-sm">
                {loading ? (
                    <p className="p-4 text-gray-500">Loading demand forecasts...</p>
                ) : forecasts.length === 0 ? (
                    <p className="p-4 text-gray-500">No demand forecasts found.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 text-left">
                                <tr>
                                    <th className="px-6 py-3 font-medium text-gray-500 uppercase tracking-wider text-xs">Product</th>
                                    <th className="px-6 py-3 font-medium text-gray-500 uppercase tracking-wider text-xs">Sales V. (Daily)</th>
                                    <th className="px-6 py-3 font-medium text-gray-500 uppercase tracking-wider text-xs">Stock Level</th>
                                    <th className="px-6 py-3 font-medium text-gray-500 uppercase tracking-wider text-xs">Days to Stockout</th>
                                    <th className="px-6 py-3 font-medium text-gray-500 uppercase tracking-wider text-xs">Suggested Reorder</th>
                                    <th className="px-6 py-3 font-medium text-gray-500 uppercase tracking-wider text-xs">Snapshot Date</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {forecasts.map((f: any) => (
                                    <tr key={f.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-semibold text-gray-900 truncate max-w-[200px]" title={f.productId}>{f.productId}</div>
                                            <div className="text-gray-500 text-xs truncate max-w-[200px]" title={f.tenantId}>{f.tenantId}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-purple-600">
                                            {(f.avgDailySales || 0).toFixed(2)} units
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-bold">
                                            {f.stockLevel}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-red-600 font-bold">
                                            {f.daysToStockout ? Math.floor(f.daysToStockout) : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-blue-600 font-bold">
                                            {f.recommendedReorderQty} units
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-xs">
                                            {new Date(f.snapshotDate).toLocaleString()}
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
