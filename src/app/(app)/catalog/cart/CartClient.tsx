"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateCartItemQtyAction, clearCartAction } from "@/actions/cartActions";
import { processCheckoutAction } from "@/actions/checkoutAction";
import Link from "next/link";

type CartItemDisplay = {
    productId: string;
    productName: string;
    sellerCompanyId: string;
    sellerName: string;
    qty: number;
    price: number;
};

export default function CartClient({ initialItems }: { initialItems: CartItemDisplay[] }) {
    const [items, setItems] = useState(initialItems);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const updateQty = async (productId: string, sellerCompanyId: string, newQty: number) => {
        let updated = items.map(item =>
            (item.productId === productId && item.sellerCompanyId === sellerCompanyId)
                ? { ...item, qty: newQty }
                : item
        );

        if (newQty <= 0) {
            updated = updated.filter(item => !(item.productId === productId && item.sellerCompanyId === sellerCompanyId));
        }

        setItems(updated);
        await updateCartItemQtyAction(productId, sellerCompanyId, newQty);
        router.refresh();
    };

    const handleClear = async () => {
        if (!confirm("Are you sure you want to empty your cart?")) return;
        setItems([]);
        await clearCartAction();
        router.refresh();
    };

    const handleCheckout = () => {
        if (items.length === 0) return;
        router.push("/catalog/checkout");
    };

    const subtotal = items.reduce((acc, item) => acc + (item.price * item.qty), 0);

    return (
        <div className="min-h-[50vh] bg-white border border-slate-200 rounded-md p-6">
            <h1 className="text-2xl font-bold tracking-tight text-[#1F3A5F] mb-6 border-b border-slate-100 pb-4">
                Sepetim (B2B Cart)
            </h1>

            {items.length === 0 ? (
                <div className="text-center py-10">
                    <p className="text-slate-500 mb-4">Your cart is empty.</p>
                    <Link href="/catalog" className="px-4 py-2 bg-black text-white rounded-md text-sm font-medium hover:bg-slate-800">
                        Continue Shopping
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-4">
                        <div className="overflow-x-auto border border-slate-200 rounded-md">
                            <table className="min-w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-[#F6F7F9] text-slate-700">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold">Product</th>
                                        <th className="px-4 py-3 font-semibold">Supplier</th>
                                        <th className="px-4 py-3 font-semibold text-right">Price</th>
                                        <th className="px-4 py-3 font-semibold text-center">Qty</th>
                                        <th className="px-4 py-3 font-semibold text-right">Total</th>
                                        <th className="px-4 py-3 font-semibold text-center">Remove</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700">
                                    {items.map(item => (
                                        <tr key={`${item.productId}-${item.sellerCompanyId}`}>
                                            <td className="px-4 py-3 font-medium text-slate-900">{item.productName}</td>
                                            <td className="px-4 py-3 text-[#1F3A5F]">{item.sellerName}</td>
                                            <td className="px-4 py-3 font-mono text-right">{item.price.toFixed(2)}</td>
                                            <td className="px-4 py-3 text-center">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={item.qty}
                                                    onChange={e => updateQty(item.productId, item.sellerCompanyId, Number(e.target.value))}
                                                    className="w-16 px-2 py-1 border border-slate-300 rounded text-center focus:outline-none focus:border-[#1F3A5F]"
                                                />
                                            </td>
                                            <td className="px-4 py-3 font-mono font-bold text-right">
                                                {(item.price * item.qty).toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => updateQty(item.productId, item.sellerCompanyId, 0)}
                                                    className="text-red-500 hover:text-red-700 font-bold"
                                                    title="Remove from cart"
                                                >
                                                    ×
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex justify-between items-center mt-4">
                            <button onClick={handleClear} className="text-sm text-red-600 hover:underline">
                                Empty Cart
                            </button>
                            <Link href="/catalog" className="text-sm text-[#1F3A5F] hover:underline">
                                ← Continue Shopping
                            </Link>
                        </div>
                    </div>

                    <div className="md:col-span-1">
                        <div className="bg-[#F6F7F9] rounded-md p-6 border border-slate-200 flex flex-col gap-4">
                            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-300 pb-2">Order Summary</h2>
                            <div className="flex justify-between text-sm text-slate-600">
                                <span>Subtotal</span>
                                <span className="font-mono font-medium">{subtotal.toFixed(2)} TRY</span>
                            </div>
                            <div className="flex justify-between text-sm text-slate-600">
                                <span>Shipping (Est.)</span>
                                <span className="font-mono text-slate-400">Calculated Later</span>
                            </div>
                            <div className="flex justify-between text-base font-bold text-slate-900 pt-4 border-t border-slate-300">
                                <span>Total Estimate</span>
                                <span className="font-mono">{subtotal.toFixed(2)} TRY</span>
                            </div>

                            <button
                                onClick={handleCheckout}
                                disabled={isPending}
                                className="mt-4 w-full py-2.5 bg-black text-white text-sm font-bold uppercase tracking-wide rounded-md hover:bg-slate-800 active:scale-95 transition-transform disabled:opacity-50"
                            >
                                {isPending ? "Processing..." : "Submit Order"}
                            </button>

                            <p className="text-[10px] text-slate-500 text-center mt-2 leading-tight">
                                By submitting, you agree to create a B2B network order ticket directly to the suppliers.
                            </p>

                            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-300">
                                <div className="flex-1 h-[1px] bg-slate-200"></div>
                                <span className="text-xs text-slate-400 font-semibold italic">OR</span>
                                <div className="flex-1 h-[1px] bg-slate-200"></div>
                            </div>

                            <button
                                onClick={async () => {
                                    if (items.length === 0) return;
                                    startTransition(async () => {
                                        try {
                                            const { createRfqFromCartAction } = await import("@/actions/rfqActions");
                                            const res = await createRfqFromCartAction();
                                            alert("RFQ Created successfully!");
                                            router.push(`/rfq/${res.rfqId}`);
                                        } catch (e: any) {
                                            alert(e.message || "Failed to create RFQ");
                                        }
                                    });
                                }}
                                disabled={isPending}
                                className="w-full py-2 bg-white border border-slate-300 text-slate-700 text-sm font-bold uppercase tracking-wide rounded-md hover:bg-slate-50 active:scale-95 transition-transform disabled:opacity-50"
                            >
                                Request Quote (RFQ)
                            </button>
                            <p className="text-[10px] text-slate-500 text-center leading-tight">
                                Want to negotiate bulk pricing? Start an RFQ to seek offers from these suppliers.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
