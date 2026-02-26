"use client";

import { useState } from "react";
import { addToCartAction } from "@/actions/cartActions";

export default function AddToCartButton({
    productId,
    sellerCompanyId,
    maxQty,
    disabled
}: {
    productId: string;
    sellerCompanyId: string;
    maxQty: number;
    disabled?: boolean;
}) {
    const [qty, setQty] = useState(1);
    const [loading, setLoading] = useState(false);

    const handleAdd = async () => {
        setLoading(true);
        try {
            await addToCartAction({ productId, sellerCompanyId, qty });
            alert("Added to cart!");
        } catch (e) {
            alert("Failed to add to cart");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <input
                type="number"
                min="1"
                max={maxQty}
                value={qty}
                onChange={e => setQty(Number(e.target.value))}
                disabled={disabled}
                className="w-16 px-2 py-1 border border-slate-300 rounded-md text-sm text-center focus:outline-none focus:border-[#1F3A5F] disabled:opacity-50"
            />
            <button
                onClick={handleAdd}
                disabled={loading || maxQty < 1 || disabled}
                className="px-3 py-1 bg-black text-white text-xs font-semibold rounded-md hover:opacity-90 active:scale-95 transition-transform disabled:opacity-50 disabled:scale-100"
            >
                {loading ? "Adding..." : "Add to Cart"}
            </button>
        </div>
    );
}
