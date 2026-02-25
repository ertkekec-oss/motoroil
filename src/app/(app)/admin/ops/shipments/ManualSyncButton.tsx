"use client";

import { useState } from "react";
import { syncShipmentAction } from "@/actions/syncShipmentAction";
import { RefreshCw } from "lucide-react";

export default function ManualSyncButton({ shipmentId, disabled }: { shipmentId: string, disabled: boolean }) {
    const [loading, setLoading] = useState(false);

    const handleSync = async () => {
        setLoading(true);
        try {
            await syncShipmentAction(shipmentId);
        } catch (e: any) {
            alert(e.message || "Manual sync enqueue failed");
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleSync}
            disabled={loading || disabled}
            title={disabled ? "Already Delivered" : "Manual Sync Payload"}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mx-auto"
        >
            {loading ? <span className="animate-spin border-[1.5px] border-slate-600 border-t-transparent rounded-full w-3 h-3" /> : <RefreshCw className="w-3 h-3" />}
            Sync
        </button>
    );
}
