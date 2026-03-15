"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useModal } from "@/contexts/ModalContext";

export default function CompanyTrustAdminPage() {
    const { showSuccess, showError, showWarning } = useModal();
    const [profiles, setProfiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProfiles();
    }, []);

    const fetchProfiles = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/admin/company-trust");
            const data = await res.json();
            setProfiles(data);
        } catch (error) {
            console.error("Failed to fetch trust profiles", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRecalculateAll = async () => {
        try {
            await fetch("/api/admin/company-trust/recalculate-all", { method: "POST" });
            showSuccess("Bilgi", "Batch recalculation started. Check back later.");
        } catch (error) {
            console.error("Failed to trigger recalculation", error);
        }
    };

    const getTrustBadge = (level: string) => {
        switch (level) {
            case "VERIFIED_HIGH": return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded font-bold">VERIFIED HIGH</span>;
            case "HIGH": return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded font-bold">HIGH</span>;
            case "MEDIUM": return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded font-bold">MEDIUM</span>;
            case "LOW": return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded font-bold">LOW</span>;
            default: return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded font-bold">{level}</span>;
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Company Trust Engine</h1>
                <button
                    onClick={handleRecalculateAll}
                    className="bg-black text-white px-4 py-2 rounded-md font-medium text-sm flex items-center justify-center hover:bg-gray-800 transition-colors"
                >
                    Recalculate All Profiles
                </button>
            </div>

            <div className="card bg-white p-4 rounded-xl border border-gray-200 shadow-sm overflow-hidden text-sm">
                {loading ? (
                    <p className="p-4 text-gray-500">Loading trust profiles...</p>
                ) : profiles.length === 0 ? (
                    <p className="p-4 text-gray-500">No trust profiles found.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 text-left">
                                <tr>
                                    <th className="px-6 py-3 font-medium text-gray-500 uppercase tracking-wider text-xs">Tenant / Company</th>
                                    <th className="px-6 py-3 font-medium text-gray-500 uppercase tracking-wider text-xs">KYB Status</th>
                                    <th className="px-6 py-3 font-medium text-gray-500 uppercase tracking-wider text-xs">Overall Score</th>
                                    <th className="px-6 py-3 font-medium text-gray-500 uppercase tracking-wider text-xs">Trust Level</th>
                                    <th className="px-6 py-3 font-medium text-gray-500 uppercase tracking-wider text-xs">Last Calculated</th>
                                    <th className="px-6 py-3 font-medium text-gray-500 uppercase tracking-wider text-xs">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {profiles.map((p) => (
                                    <tr key={p.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-semibold text-gray-900">{p.companyIdentity?.legalName || 'Unknown Identity'}</div>
                                            <div className="text-gray-500 text-xs">{p.tenantId}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-xs font-semibold text-gray-600">{p.companyIdentity?.verificationStatus || "UNVERIFIED"}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-bold text-lg text-gray-800">{(p.overallScore * 100).toFixed(1)}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getTrustBadge(p.trustLevel)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-xs">
                                            {p.lastCalculatedAt ? new Date(p.lastCalculatedAt).toLocaleString() : 'Never'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Link href={`/admin/company-trust/${p.tenantId}`} className="text-blue-600 font-medium hover:underline text-xs">
                                                View Details
                                            </Link>
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
