"use client";

import { useTransition } from "react";
import { approveProductAction, rejectProductAction } from "@/actions/adminGovernanceActions";
import { ProductStatus } from "@prisma/client";

export default function ProductModerationClient({ productId, currentStatus }: { productId: string; currentStatus: ProductStatus }) {
    const [isPending, startTransition] = useTransition();

    const handleApprove = () => {
        if (!confirm("Approve this product and make it public in the catalog?")) return;
        startTransition(async () => {
            await approveProductAction(productId);
        });
    };

    const handleReject = () => {
        const reason = prompt("Enter rejection reason:");
        if (!reason) return;
        startTransition(async () => {
            await rejectProductAction(productId, reason);
        });
    };

    if (currentStatus !== ProductStatus.PENDING) return null;

    return (
        <div className="flex justify-end gap-2">
            <button
                onClick={handleReject}
                disabled={isPending}
                className="px-3 py-1 bg-white border border-red-200 text-red-600 rounded text-xs font-bold hover:bg-red-50 transition-colors disabled:opacity-50"
            >
                {isPending ? "..." : "Reject"}
            </button>
            <button
                onClick={handleApprove}
                disabled={isPending}
                className="px-3 py-1 bg-emerald-600 text-white rounded text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
            >
                {isPending ? "..." : "Approve"}
            </button>
        </div>
    );
}
