"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface BuySuggestionClientProps {
    suggestionId: string;
    globalProductId: string;
    hasSeller: boolean;
}

export function BuySuggestionClient({ suggestionId, globalProductId, hasSeller }: BuySuggestionClientProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleAction = async (action: 'BUY' | 'RFQ' | 'DISMISS') => {
        setLoading(true);
        try {
            const res = await fetch("/api/buyer/recommendations/action", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ suggestionId, globalProductId, action })
            });

            if (res.ok) {
                if (action === 'BUY') {
                    router.push(`/catalog?search=${globalProductId}`);
                } else if (action === 'RFQ') {
                    router.push(`/network/buyer/rfq/new?product=${globalProductId}`);
                } else {
                    router.refresh();
                }
            } else {
                console.error("Failed to execute action");
            }
        } catch (error) {
            console.error("Action error", error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex gap-2">
            {hasSeller ? (
                <button
                    onClick={() => handleAction('BUY')}
                    disabled={loading}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 rounded-lg text-sm transition-colors text-center disabled:opacity-50"
                >
                    Satın Al
                </button>
            ) : (
                <button
                    onClick={() => handleAction('RFQ')}
                    disabled={loading}
                    className="flex-1 bg-[#1F3A5F] hover:bg-[#152845] text-white font-medium py-2 rounded-lg text-sm transition-colors text-center disabled:opacity-50"
                >
                    RFQ Oluştur
                </button>
            )}
            <button
                onClick={() => handleAction('DISMISS')}
                disabled={loading}
                className="px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium py-2 rounded-lg text-sm transition-colors shadow-sm disabled:opacity-50"
            >
                Yoksay
            </button>
        </div>
    );
}
