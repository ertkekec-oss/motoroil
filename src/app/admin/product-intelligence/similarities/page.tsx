"use client";

import React, { useEffect, useState } from "react";

export default function SimilaritiesAdminPage() {
    const [similarities, setSimilarities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSimilarities();
    }, []);

    const fetchSimilarities = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/admin/product-intelligence/similarities");
            const data = await res.json();
            setSimilarities(data);
        } catch (error) {
            console.error("Failed to load similarities", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Product Similarities</h1>
            </div>

            <div className="card bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                {loading ? (
                    <p className="text-sm text-gray-500">Loading...</p>
                ) : similarities.length === 0 ? (
                    <p className="text-sm text-gray-500">No similarities found.</p>
                ) : (
                    <div className="overflow-x-auto text-sm">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Compared Name</th>
                                    <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Normalized Name</th>
                                    <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Score</th>
                                    <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Match Type</th>
                                    <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {similarities.map((sim) => (
                                    <tr key={sim.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">{sim.comparedName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{sim.normalizedName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-blue-600">{sim.similarityScore.toFixed(3)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                                                {sim.matchType}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                            {new Date(sim.createdAt).toLocaleDateString()}
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
