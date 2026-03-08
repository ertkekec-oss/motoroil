"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function CompanyTrustTenantAdminPage() {
    const params = useParams();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params.tenantId) {
            fetchTrustData(params.tenantId as string);
        }
    }, [params.tenantId]);

    const fetchTrustData = async (tenantId: string) => {
        try {
            setLoading(true);
            const res = await fetch(`/api/admin/company-trust/${tenantId}`);
            const json = await res.json();
            setData(json);
        } catch (error) {
            console.error("Failed to fetch trust details", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRecalculate = async () => {
        try {
            setLoading(true);
            await fetch("/api/admin/company-trust/recalculate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tenantId: params.tenantId }),
            });
            fetchTrustData(params.tenantId as string);
        } catch (error) {
            console.error("Failed to recalculate", error);
        }
    };

    if (loading || !data) {
        return <div className="p-6">Loading trust profile details...</div>;
    }

    const { profile, signals, history } = data;

    const scoreClass = (score: number) => {
        if (score >= 0.8) return "text-green-600";
        if (score >= 0.5) return "text-yellow-600";
        return "text-red-600";
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center space-x-4 mb-4">
                <Link href="/admin/company-trust" className="text-gray-500 hover:text-black">← Back</Link>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                    Trust Profile: {profile?.companyIdentity?.legalName || params.tenantId}
                </h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* SCORECARD */}
                <div className="card bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Overall Score</h3>
                        <div className="text-5xl font-extrabold text-gray-900">{(profile.overallScore * 100).toFixed(1)}</div>
                        <div className="mt-2 inline-flex font-bold text-sm bg-gray-100 px-3 py-1 rounded">{profile.trustLevel}</div>
                    </div>

                    <button
                        onClick={handleRecalculate}
                        className="mt-6 w-full bg-black text-white px-4 py-2 rounded-md font-medium text-sm flex items-center justify-center hover:bg-gray-800 transition-colors"
                    >
                        Recalculate Now
                    </button>
                </div>

                {/* INPUT BREAKDOWN */}
                <div className="md:col-span-2 card bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Signal Breakdown</h3>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center border-b pb-2">
                            <span className="text-sm text-gray-600 font-medium">Identity Status (35%)</span>
                            <span className={`text-sm font-bold ${profile.identityScore === 1 ? 'text-green-600' : 'text-red-500'}`}>
                                {profile.identityScore === 1 ? 'VERIFIED' : 'UNVERIFIED'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center border-b pb-2">
                            <span className="text-sm text-gray-600 font-medium">Trade Completion (25%)</span>
                            <span className={`text-sm font-bold ${scoreClass(profile.tradeScore)}`}>{(profile.tradeScore * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between items-center border-b pb-2">
                            <span className="text-sm text-gray-600 font-medium">Shipping Reliability (20%)</span>
                            <span className={`text-sm font-bold ${scoreClass(profile.shippingScore)}`}>{(profile.shippingScore * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between items-center border-b pb-2">
                            <span className="text-sm text-gray-600 font-medium">Payment Reliability (10%)</span>
                            <span className={`text-sm font-bold ${scoreClass(profile.paymentScore)}`}>{(profile.paymentScore * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 font-medium">Negative Discipline (Dispute Rate) (10%)</span>
                            <span className={`text-sm font-bold ${scoreClass(profile.disputeScore)}`}>{(profile.disputeScore * 100).toFixed(1)}%</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* HISTORY */}
                <div className="card bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Calculation History</h3>
                    <div className="space-y-3">
                        {history.length === 0 ? <p className="text-sm text-gray-500">No history found</p> :
                            history.map((h: any) => (
                                <div key={h.id} className="flex justify-between text-sm py-2 border-b last:border-0 border-gray-100">
                                    <span className="text-gray-600">{new Date(h.calculatedAt).toLocaleString()}</span>
                                    <span className="font-medium text-gray-900">{(h.overallScore * 100).toFixed(1)} <span className="text-xs text-gray-500">({h.trustLevel})</span></span>
                                </div>
                            ))
                        }
                    </div>
                </div>

                {/* RAW SIGNALS */}
                <div className="card bg-white p-6 rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Raw Signals</h3>
                    <div className="max-h-64 overflow-y-auto pr-2">
                        <div className="space-y-3">
                            {signals.length === 0 ? <p className="text-sm text-gray-500">No raw signals recorded</p> :
                                signals.map((s: any) => (
                                    <div key={s.id} className="text-xs py-2 border-b last:border-0 border-gray-100 flex flex-col gap-1">
                                        <div className="flex justify-between">
                                            <span className="font-semibold text-gray-indigo-600">{s.signalType}</span>
                                            <span className="font-medium">Val: {s.signalValue} (W: {s.weight})</span>
                                        </div>
                                        <span className="text-gray-400">{new Date(s.createdAt).toLocaleDateString()}</span>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
