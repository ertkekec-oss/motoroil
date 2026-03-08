"use client";

import React, { useEffect, useState } from "react";

export default function ClustersAdminPage() {
    const [clusters, setClusters] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [rebuildLoading, setRebuildLoading] = useState(false);

    useEffect(() => {
        fetchClusters();
    }, []);

    const fetchClusters = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/admin/product-intelligence/clusters");
            const data = await res.json();
            setClusters(data);
        } catch (error) {
            console.error("Failed to load clusters", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRebuild = async () => {
        try {
            setRebuildLoading(true);
            await fetch("/api/admin/product-intelligence/rebuild-clusters", { method: "POST" });
            await fetchClusters();
        } catch (error) {
            console.error("Failed to rebuild clusters", error);
        } finally {
            setRebuildLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Product Clusters</h1>
                <button
                    onClick={handleRebuild}
                    disabled={rebuildLoading}
                    className="bg-black text-white px-4 py-2 rounded-md font-medium text-sm disabled:opacity-50"
                >
                    {rebuildLoading ? "Rebuilding..." : "Rebuild Clusters"}
                </button>
            </div>

            <div className="card bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                {loading ? (
                    <p className="text-sm text-gray-500">Loading...</p>
                ) : clusters.length === 0 ? (
                    <p className="text-sm text-gray-500">No clusters found.</p>
                ) : (
                    <div className="overflow-x-auto text-sm">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Cluster Key</th>
                                    <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Canonical Product</th>
                                    <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Confidence</th>
                                    <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Linked Similarities</th>
                                    <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {clusters.map((cluster) => (
                                    <tr key={cluster.id}>
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{cluster.clusterKey}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{cluster.canonicalProduct?.name || "N/A"}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-green-600 font-medium">{(cluster.confidenceScore * 100).toFixed(0)}%</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="bg-gray-100 text-gray-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                                                {cluster._count?.similarities || 0} items
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                            {new Date(cluster.createdAt).toLocaleDateString()}
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
