"use client";

import React, { useEffect, useState } from "react";

export default function SuggestionsAdminPage() {
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSuggestions();
    }, []);

    const fetchSuggestions = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/admin/product-intelligence/suggestions");
            const data = await res.json();
            setSuggestions(data);
        } catch (error) {
            console.error("Failed to load suggestions", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Product Suggestions (Review Queue)</h1>
            </div>

            <div className="card bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                {loading ? (
                    <p className="text-sm text-gray-500">Loading...</p>
                ) : suggestions.length === 0 ? (
                    <p className="text-sm text-gray-500">No suggestions pending review.</p>
                ) : (
                    <div className="overflow-x-auto text-sm">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Tenant / Product ID</th>
                                    <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Canonical Target</th>
                                    <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Score</th>
                                    <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {suggestions.map((sug) => (
                                    <tr key={sug.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-medium text-gray-900">{sug.productId}</div>
                                            <div className="text-xs text-gray-500">{sug.tenantId}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-indigo-600 cursor-pointer">
                                            {sug.canonicalProductId}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-orange-500 font-medium">
                                            {(sug.suggestedScore * 100).toFixed(1)}%
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${sug.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {sug.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                            {new Date(sug.createdAt).toLocaleDateString()}
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
