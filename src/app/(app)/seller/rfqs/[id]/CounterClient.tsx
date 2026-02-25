"use client";

import { useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { counterRfqAction } from "@/actions/rfqResponseActions";

export default function CounterClient({ rfq, items, offer }: { rfq: any, items: any[], offer: any }) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const formRef = useRef<HTMLFormElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formRef.current) return;

        const formData = new FormData(formRef.current);
        const tp = formData.get("totalPrice");
        if (!tp || Number(tp) <= 0) {
            alert("Please provide a valid total price offer.");
            return;
        }

        if (!confirm("Are you sure you want to submit this offer to the buyer? Prices cannot be changed once submitted.")) return;

        startTransition(async () => {
            try {
                await counterRfqAction(formData);
                alert("Offer submitted successfully.");
                router.push("/seller/rfqs");
            } catch (err: any) {
                alert(err.message || "Failed to submit offer.");
            }
        });
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-md p-6">
                <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Requested Items</h2>

                <div className="space-y-4">
                    {items.map(item => (
                        <div key={item.id} className="flex justify-between items-center text-sm border border-slate-100 p-3 rounded bg-[#F6F7F9]">
                            <div className="flex-1">
                                <span className="font-semibold text-slate-900 block">{item.productName}</span>
                            </div>
                            <div className="text-right">
                                <span className="text-slate-500 text-xs block">Requested Qty:</span>
                                <span className="font-mono font-bold">{item.quantity}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-md p-6">
                <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Your Counter Offer</h2>

                {offer ? (
                    <div className="space-y-4">
                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-md text-sm">
                            <p className="font-bold mb-1">Offer Submitted</p>
                            <p>You have already responded to this RFQ.</p>
                        </div>

                        <div className="flex justify-between text-sm text-slate-700 py-2 border-b border-slate-100">
                            <span>Status:</span>
                            <span className="font-bold">{offer.status}</span>
                        </div>
                        <div className="flex justify-between text-sm text-slate-700 py-2 border-b border-slate-100">
                            <span>Total Price Quoted:</span>
                            <span className="font-mono font-bold">{Number(offer.totalPrice).toFixed(2)} TRY</span>
                        </div>
                        {offer.expiresAt && (
                            <div className="flex justify-between text-sm text-slate-700 py-2">
                                <span>Expires At:</span>
                                <span>{new Date(offer.expiresAt).toLocaleDateString()}</span>
                            </div>
                        )}
                    </div>
                ) : (
                    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
                        <input type="hidden" name="rfqId" value={rfq.id} />

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Total Package Price Offer (TRY)</label>
                            <input
                                type="number"
                                name="totalPrice"
                                step="0.01"
                                min="1"
                                required
                                className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1F3A5F]"
                                placeholder="E.g 50000.00"
                            />
                            <p className="text-xs text-slate-500 mt-1">
                                Enter the total price you are willing to sell this bundle of requested items for.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Offer Expiration (Optional)</label>
                            <input
                                type="date"
                                name="expiresAt"
                                className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1F3A5F]"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full py-2.5 bg-black text-white text-sm font-bold uppercase tracking-wide rounded-md hover:bg-slate-800 active:scale-95 transition-transform disabled:opacity-50 mt-4"
                        >
                            {isPending ? "Submitting Offer..." : "Submit Offer"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
