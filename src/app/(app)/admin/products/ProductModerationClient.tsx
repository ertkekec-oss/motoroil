"use client";

import { useTransition } from "react";
import { approveProductAction, rejectProductAction } from "@/actions/adminGovernanceActions";
import { ProductStatus } from "@prisma/client";

import { useModal } from "@/contexts/ModalContext";

export default function ProductModerationClient({ productId, currentStatus }: { productId: string; currentStatus: ProductStatus }) {
    const [isPending, startTransition] = useTransition();
    const { showConfirm, showPrompt, showError, showWarning } = useModal();

    const handleApprove = () => {
        showConfirm(
            "Product Approval",
            "Are you sure you want to approve this product and make it public in the catalog?",
            () => {
                startTransition(async () => {
                    try {
                        await approveProductAction(productId);
                    } catch (error: any) {
                        showError("Action Failed", error.message || "Failed to approve product.");
                    }
                });
            }
        );
    };

    const handleReject = () => {
        showPrompt(
            "Rejection Reason",
            "Please enter the reason for rejecting this product:",
            (reason) => {
                if (!reason || reason.length < 5) {
                    showWarning("Invalid Input", "Please provide a detailed rejection reason (at least 5 characters).");
                    return;
                }
                startTransition(async () => {
                    try {
                        await rejectProductAction(productId, reason);
                    } catch (error: any) {
                        showError("Action Failed", error.message || "Failed to reject product.");
                    }
                });
            }
        );
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
