"use client";

import { useState } from "react";
import { forceReleaseLedgerAction } from "@/actions/forceReleaseLedgerAction";
import { Zap } from "lucide-react";

export default function ForceReleaseLedgerButton({ paymentId }: { paymentId: string }) {
    const [loading, setLoading] = useState(false);
    const [toastMsg, setToastMsg] = useState<string | null>(null);

    const handleForceRelease = async () => {
        if (!confirm("Initiating force release. This will bypass buyer confirmation and release escrow directly. Continue?")) return;
        setLoading(true);
        setToastMsg(null);
        try {
            const res = await forceReleaseLedgerAction(paymentId);
            setToastMsg(res.message);
        } catch (e: any) {
            setToastMsg("Force release execution failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center">
            <button
                onClick={handleForceRelease}
                disabled={loading}
                className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded border border-red-300 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mx-auto"
            >
                {loading ? <span className="animate-spin border-[1.5px] border-red-600 border-t-transparent rounded-full w-3 h-3" /> : <Zap className="w-3 h-3" />}
                Force Release
            </button>
            {toastMsg && <span className="text-[9px] text-gray-500 font-mono mt-1 w-24 truncate text-center" title={toastMsg}>{toastMsg}</span>}
        </div>
    );
}
