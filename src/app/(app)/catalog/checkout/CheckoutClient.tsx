"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { createOrdersFromCartAction } from "@/actions/createOrdersFromCartAction";
import { v4 as uuidv4 } from "uuid";
import { useState, useEffect } from "react";

export default function CheckoutClient({ previewData }: { previewData: any }) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const [attemptKey, setAttemptKey] = useState("");

    useEffect(() => {
        // Generate once on mount
        setAttemptKey(`chk_${uuidv4()}`);
    }, []);

    const handleSubmit = () => {
        if (!attemptKey) return;

        startTransition(async () => {
            try {
                await createOrdersFromCartAction(attemptKey);
                alert("Order placed successfully via ESCROW mock payment!");
                router.push("/network/buyer/orders");
            } catch (err: any) {
                alert(err.message || "Checkout failed");
            }
        });
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
                {previewData.groups.map((group: any) => (
                    <div key={group.sellerCompanyId} className="border border-slate-200 rounded-md p-4 bg-[#F6F7F9]">
                        <h3 className="font-bold text-[#1F3A5F] mb-3 border-b border-slate-300 pb-2">
                            Supplier: {group.sellerName}
                        </h3>
                        <div className="space-y-2 text-sm text-slate-700">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span className="font-mono">{group.subtotalAmount.toFixed(2)} TRY</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Platform Commission (5% - Paid by Seller)</span>
                                <span className="font-mono text-slate-500">-{group.platformCommission.toFixed(2)} TRY</span>
                            </div>
                            <div className="flex justify-between font-semibold">
                                <span>Escrow Fee (1% - Buyer side)</span>
                                <span className="font-mono text-amber-600">+{group.escrowFee.toFixed(2)} TRY</span>
                            </div>
                            <div className="flex justify-between font-bold text-base mt-2 pt-2 border-t border-slate-200 text-slate-900">
                                <span>Supplier Total NetworkOrder</span>
                                <span className="font-mono">{group.orderTotal.toFixed(2)} TRY</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="md:col-span-1">
                <div className="bg-white border border-slate-200 rounded-md p-6 sticky top-6 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4">
                        Payment Summary
                    </h2>
                    <div className="flex justify-between text-base font-bold text-slate-900 pt-2 mb-6">
                        <span>Grand Total</span>
                        <span className="font-mono text-xl text-[#1F3A5F]">{previewData.grandTotal.toFixed(2)} TRY</span>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded p-3 text-xs text-amber-800 mb-6 font-medium">
                        <span className="mb-1 block">🛡️ B2B Escrow Protection Active</span>
                        Funds will be locked in the central network escrow and released upon delivery confirmation.
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={isPending || !attemptKey}
                        className="w-full py-3 bg-black text-white text-sm font-bold uppercase tracking-wide rounded-md hover:bg-slate-800 active:scale-95 transition-transform disabled:opacity-50"
                    >
                        {isPending ? "Locking Escrow..." : "Confirm & Pay Order"}
                    </button>

                    <p className="text-[10px] text-slate-500 text-center mt-3 leading-tight">
                        By confirming, you execute a financial commitment on the Periodya Network.
                    </p>
                </div>
            </div>
        </div>
    );
}
