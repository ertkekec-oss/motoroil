"use client";

import { useTransition, useState } from "react";
import { upsertListingAction } from "@/actions/upsertListingAction";
import { useRouter } from "next/navigation";

export default function SellerProductForm({ erpProduct, existingListing }: { erpProduct: any, existingListing: any }) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const [errorMsg, setErrorMsg] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrorMsg("");

        const fd = new FormData(e.currentTarget);
        fd.append("erpProductId", erpProduct.id);

        startTransition(async () => {
            try {
                await upsertListingAction(fd);
                router.push("/seller/products");
            } catch (err: any) {
                setErrorMsg(err.message || "An error occurred");
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
                <div className="text-red-600 bg-red-50 p-2 text-sm border border-red-200 rounded">
                    {errorMsg}
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-1">Price (TRY) *</label>
                    <input
                        defaultValue={existingListing ? Number(existingListing.price) : Number(erpProduct.price)}
                        name="price"
                        type="number"
                        step="0.01"
                        required
                        className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:border-[#1F3A5F]"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-1">Available Qty *</label>
                    <input
                        defaultValue={existingListing?.availableQty ?? erpProduct.stock}
                        name="availableQty"
                        type="number"
                        required
                        className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:border-[#1F3A5F]"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-1">Min. Order Qty</label>
                    <input
                        defaultValue={existingListing?.minQty ?? 1}
                        name="minQty"
                        type="number"
                        className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:border-[#1F3A5F]"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-1">Lead Time (Days)</label>
                    <input
                        defaultValue={existingListing?.leadTimeDays ?? 0}
                        name="leadTimeDays"
                        type="number"
                        className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:border-[#1F3A5F]"
                    />
                </div>

                <div className="col-span-2">
                    <label className="block text-sm font-semibold text-slate-800 mb-1">Status</label>
                    <select
                        defaultValue={existingListing?.status ?? "ACTIVE"}
                        name="status"
                        className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:border-[#1F3A5F]"
                    >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="PAUSED">PAUSED</option>
                    </select>
                </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-200 transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isPending}
                    className="px-4 py-2 bg-black text-white text-sm font-semibold rounded-md hover:bg-slate-800 active:scale-95 transition-transform disabled:opacity-50 disabled:scale-100"
                >
                    {isPending ? "Saving..." : (existingListing ? "Update Listing" : "Publish to Catalog")}
                </button>
            </div>
        </form>
    );
}
