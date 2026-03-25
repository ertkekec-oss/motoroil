"use client";

import { useState } from "react";
import { addToCartAction } from "@/actions/cartActions";
import { useModal } from "@/contexts/ModalContext";
import { Plus, Loader2, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";

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
    const { showSuccess, showError, showWarning } = useModal();
    const [qty, setQty] = useState(1);
    const [loading, setLoading] = useState(false);
    const [added, setAdded] = useState(false);
    const router = useRouter();

    const handleAdd = async () => {
        if (added) {
            router.push("/catalog/cart");
            return;
        }

        setLoading(true);
        try {
            await addToCartAction({ productId, sellerCompanyId, qty });
            showSuccess("Sepete Eklendi", "Ürün başarıyla B2B sepetinize eklendi. Sepet üzerinden satın alma adımına geçebilirsiniz.");
            setAdded(true);
        } catch (e: any) {
            showError("Hata", e?.message || "Sepete eklenirken bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    if (added) {
         return (
             <button
                 onClick={handleAdd}
                 className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-emerald-600 text-white text-[11px] uppercase tracking-wider font-bold rounded-lg hover:bg-emerald-700 active:scale-95 transition-all shadow-sm"
             >
                 <ShoppingCart className="w-3.5 h-3.5" />
                 Sepete Git
             </button>
         );
    }

    return (
        <div className="flex flex-col sm:flex-row items-stretch gap-2">
            <div className="relative shrink-0">
                 <input
                     type="number"
                     min="1"
                     max={maxQty}
                     value={qty}
                     onChange={e => setQty(Number(e.target.value))}
                     disabled={disabled || loading}
                     className="w-16 px-2 py-2 border border-slate-300  bg-white  rounded-lg text-sm font-bold font-mono text-center focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all  disabled:opacity-50"
                 />
            </div>
            <button
                onClick={handleAdd}
                disabled={loading || maxQty < 1 || disabled}
                className="flex flex-1 items-center justify-center gap-2 px-4 py-2 bg-slate-900  text-white  text-[11px] uppercase tracking-wider font-bold rounded-lg hover:bg-slate-800 :bg-slate-100 active:scale-[0.98] transition-all shadow-sm disabled:opacity-50 disabled:active:scale-100"
            >
                {loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                    <>
                        <Plus className="w-3.5 h-3.5" />
                        Ekle
                    </>
                )}
            </button>
        </div>
    );
}
