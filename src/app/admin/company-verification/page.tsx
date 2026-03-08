"use client";

import React, { useEffect, useState } from "react";

export default function CompanyVerificationAdminPage() {
    const [companies, setCompanies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCompanies();
    }, []);

    const fetchCompanies = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/admin/company-identity");
            const data = await res.json();
            setCompanies(data);
        } catch (error) {
            console.error("Failed to fetch companies", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (companyId: string, action: "verify" | "reject") => {
        try {
            await fetch(`/api/admin/company-identity/${action}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ companyId }),
            });
            fetchCompanies(); // refresh list
        } catch (error) {
            console.error(`Failed to ${action} company`, error);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "VERIFIED": return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-lg font-semibold">VERIFIED</span>;
            case "REJECTED": return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-lg font-semibold">REJECTED</span>;
            case "PENDING": return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-lg font-semibold">PENDING</span>;
            default: return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-lg font-semibold">{status}</span>;
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">KYB / Company Identity Verification</h1>
            </div>

            <div className="card bg-white p-4 rounded-xl border border-gray-200 shadow-sm overflow-hidden text-sm">
                {loading ? (
                    <p className="p-4 text-gray-500">Loading companies...</p>
                ) : companies.length === 0 ? (
                    <p className="p-4 text-gray-500">No company identities found.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 text-left">
                                <tr>
                                    <th className="px-6 py-3 font-medium text-gray-500 uppercase tracking-wider text-xs">Company</th>
                                    <th className="px-6 py-3 font-medium text-gray-500 uppercase tracking-wider text-xs">Tax Details</th>
                                    <th className="px-6 py-3 font-medium text-gray-500 uppercase tracking-wider text-xs">Location</th>
                                    <th className="px-6 py-3 font-medium text-gray-500 uppercase tracking-wider text-xs">Status</th>
                                    <th className="px-6 py-3 font-medium text-gray-500 uppercase tracking-wider text-xs">Documents</th>
                                    <th className="px-6 py-3 font-medium text-gray-500 uppercase tracking-wider text-xs">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {companies.map((company) => (
                                    <tr key={company.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-semibold text-gray-900">{company.legalName}</div>
                                            <div className="text-gray-500 text-xs">{company.tenantId}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>VKN: {company.taxNumber}</div>
                                            {company.tradeRegistryNo && <div className="text-xs text-gray-400">Reg: {company.tradeRegistryNo}</div>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>{company.country}</div>
                                            <div className="text-xs text-gray-500">{company.city}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(company.verificationStatus)}
                                        </td>
                                        <td className="px-6 py-4">
                                            {company.documents?.length > 0 ? (
                                                <div className="space-y-1">
                                                    {company.documents.map((doc: any) => (
                                                        <a key={doc.id} href={doc.documentUrl} target="_blank" className="text-blue-600 hover:underline text-xs block truncate w-32" title={doc.documentType}>
                                                            {doc.documentType}
                                                        </a>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 text-xs">No Docs</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap flex gap-2">
                                            <button
                                                onClick={() => handleAction(company.id, "verify")}
                                                disabled={company.verificationStatus === "VERIFIED"}
                                                className="bg-black hover:bg-gray-800 text-white px-3 py-1.5 rounded-md text-xs font-medium disabled:opacity-50 transition-colors"
                                            >
                                                Verify
                                            </button>
                                            <button
                                                onClick={() => handleAction(company.id, "reject")}
                                                disabled={company.verificationStatus === "REJECTED"}
                                                className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 px-3 py-1.5 rounded-md text-xs font-medium disabled:opacity-50 transition-colors"
                                            >
                                                Reject
                                            </button>
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
