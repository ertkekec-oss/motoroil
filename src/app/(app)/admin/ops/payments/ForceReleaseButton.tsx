"use client";

import { useState } from "react";
import { forceReleaseAction } from "@/actions/forceReleaseAction";
import { RotateCcw } from "lucide-react";

export default function ForceReleaseButton({ orderId }: { orderId: string }) {
    const [loading, setLoading] = useState(false);

    const handleForceRelease = async () => {
        if (!confirm("Are you sure you want to force release the escrow payout? This will hit the mock API again and sync ledgers.")) return;
        setLoading(true);
        try {
            await forceReleaseAction(orderId);
        } catch (e: any) {
            alert(e.message || "Force release failed");
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleForceRelease}
            disabled={loading}
            className="flex items-center gap-1.5 mx-auto px-2.5 py-1 text-xs font-semibold rounded border border-red-300 text-red-600 hover:bg-red-50 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {loading ? <span className="animate-spin border-[1.5px] border-red-600 border-t-transparent rounded-full w-3 h-3" /> : <RotateCcw className="w-3 h-3" />}
            Force Release
        </button>
    );
}
