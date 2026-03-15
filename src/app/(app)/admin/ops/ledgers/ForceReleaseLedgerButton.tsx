"use client";

import { useState } from "react";
import { forceReleaseLedgerAction } from "@/actions/forceReleaseLedgerAction";
import { Zap } from "lucide-react";
import { useModal } from "@/contexts/ModalContext";

export default function ForceReleaseLedgerButton({ paymentId }: { paymentId: string }) {
    const { showConfirm, showSuccess, showError } = useModal();
    const [loading, setLoading] = useState(false);

    const handleForceRelease = () => {
        showConfirm(
            "Force Release Onayı",
            "Initiating force release. This will bypass buyer confirmation and release escrow directly. Continue?",
            async () => {
                setLoading(true);
                try {
                    const res = await forceReleaseLedgerAction(paymentId);
                    if (res.ok) {
                        showSuccess("Başarılı", res.message || "Force release başarıyla tamamlandı.");
                    } else {
                        showError("Hata", res.message || "İşlem başarısız oldu.");
                    }
                } catch (e: any) {
                    showError("Hata", "Force release execution failed.");
                } finally {
                    setLoading(false);
                }
            }
        );
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
        </div>
    );
}
