"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitRfqAction } from "@/actions/rfqActions";
import { acceptOfferAction } from "@/actions/rfqResponseActions";

export default function RfqDetailClient({ rfq, items, offers }: { rfq: any, items: any[], offers: any[] }) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleSubmit = () => {
        if (!confirm("Submit this RFQ to all selected suppliers?")) return;

        startTransition(async () => {
            try {
                await submitRfqAction(rfq.id);
                alert("RFQ sent successfully.");
            } catch (err: any) {
                alert(err.message || "Failed to submit RFQ.");
            }
        });
    };

    const handleAcceptOffer = (offerId: string) => {
        if (!confirm("Are you sure you want to ACCEPT this offer? It will create an immediate Network Order.")) return;

        startTransition(async () => {
            try {
                await acceptOfferAction(offerId);
                alert("Offer accepted! Order created. Proceed to Buyer Orders to checkout.");
                router.push("/network/buyer/orders");
            } catch (err: any) {
                alert(err.message || "Failed to accept offer.");
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-md p-6">
                <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">RFQ Details</h2>

                <div className="overflow-x-auto border border-slate-200 rounded-md mb-6">
                    <table className="min-w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-[#1F3A5F] text-white">
                            <tr>
                                <th className="px-4 py-2 font-semibold">Product</th>
                                <th className="px-4 py-2 font-semibold">Supplier Requested</th>
                                <th className="px-4 py-2 font-semibold text-center">Qty</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {items.map(item => (
                                <tr key={item.id}>
                                    <td className="px-4 py-3 font-medium text-slate-900">{item.productName}</td>
                                    <td className="px-4 py-3 text-slate-600">{item.sellerName}</td>
                                    <td className="px-4 py-3 text-center font-mono">{item.quantity}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {rfq.status === "DRAFT" && (
                    <div className="flex justify-end">
                        <button
                            onClick={handleSubmit}
                            disabled={isPending}
                            className="px-6 py-2 bg-black text-white text-sm font-semibold rounded-md hover:opacity-90 active:scale-95 transition-transform disabled:opacity-50"
                        >
                            {isPending ? "Submitting..." : "Submit RFQ Request"}
                        </button>
                    </div>
                )}

                {rfq.status !== "DRAFT" && (
                    <div className="mt-8">
                        <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Supplier Offers</h2>

                        {offers.length === 0 ? (
                            <p className="text-slate-500 italic">Waiting for supplier responses...</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {offers.map(offer => (
                                    <div key={offer.id} className="border border-slate-200 rounded-md p-5 bg-[#F6F7F9]">
                                        <div className="flex justify-between items-start mb-3">
                                            <h3 className="font-bold text-[#1F3A5F]">{offer.sellerName}</h3>
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${offer.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-700' :
                                                    offer.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                                        offer.status === 'COUNTERED' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'
                                                }`}>
                                                {offer.status}
                                            </span>
                                        </div>
                                        <div className="text-sm text-slate-700 space-y-2 mb-4">
                                            <div className="flex justify-between">
                                                <span>Total Offer Value:</span>
                                                <span className="font-mono font-bold">{Number(offer.totalPrice).toFixed(2)} TRY</span>
                                            </div>
                                            {offer.expiresAt && (
                                                <div className="flex justify-between text-xs text-slate-500">
                                                    <span>Valid Until:</span>
                                                    <span>{new Date(offer.expiresAt).toLocaleDateString()}</span>
                                                </div>
                                            )}
                                        </div>

                                        {offer.status === "COUNTERED" && rfq.status !== "ACCEPTED" && (
                                            <button
                                                onClick={() => handleAcceptOffer(offer.id)}
                                                disabled={isPending}
                                                className="w-full py-2 bg-emerald-600 text-white text-sm font-semibold rounded-md hover:bg-emerald-700 active:scale-95 transition-transform disabled:opacity-50"
                                            >
                                                Accept & Create Order
                                            </button>
                                        )}
                                        {offer.status === "ACCEPTED" && (
                                            <div className="text-center text-sm font-semibold text-emerald-700 mt-2">
                                                This offer was accepted.
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
