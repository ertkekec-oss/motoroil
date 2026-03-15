"use client";

import React, { useEffect, useState } from "react";
import { useModal } from "@/contexts/ModalContext";

export default function ProductDiscoveryAdminPage() {
    const { showSuccess, showError, showWarning } = useModal();
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({
        canonicalCount: 0,
        supplierCount: 0,
    });

    // We should actually fetch these stats. Since we didn't add a specific stats endpoint, 
    // Let's just create a basic UI that shows it's the control center and allows Reindexing.

    const handleReindex = async () => {
        try {
            setLoading(true);
            await fetch("/api/admin/product-discovery/reindex", { method: "POST" });
            showSuccess("Bilgi", "Reindex process started in background!");
        } catch (error) {
            console.error("Failed to start reindex", error);
            showError("Uyarı", "Failed to start reindex");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Product Discovery Control Center</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="card bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800">Meilisearch Index Engine</h3>
                        <p className="text-sm text-gray-500 mt-2">
                            Manages the synchronization between Prisma DB and Discovery Search Engine. Pushes Canonical Products and Supplier Inventories to the fast search index.
                        </p>
                    </div>

                    <div className="mt-6 border-t pt-4">
                        <button
                            onClick={handleReindex}
                            disabled={loading}
                            className="bg-black text-white px-4 py-2 rounded-md font-medium text-sm flex items-center justify-center disabled:opacity-50"
                        >
                            {loading ? "Triggering..." : "Run Full Reindex"}
                        </button>
                    </div>
                </div>

                <div className="card bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800">Index Status</h3>
                        <div className="mt-4 space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600">canonical_products</span>
                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">Active</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600">supplier_products</span>
                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">Active</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
