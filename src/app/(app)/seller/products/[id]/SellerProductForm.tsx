"use client";

import { useTransition, useState } from "react";
import { upsertListingAction } from "@/actions/upsertListingAction";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

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
                const res = await upsertListingAction(fd);
                if (res?.error) {
                    setErrorMsg(res.error);
                } else {
                    router.push("/seller/products");
                }
            } catch (err: any) {
                setErrorMsg(err.message || "Beklenmeyen bir hata oluştu.");
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {errorMsg && (
                <div className="text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400 p-4 font-semibold text-[13px] border border-rose-200 dark:border-rose-500/20 rounded-xl flex items-start gap-3">
                    <span className="text-xl leading-none">⚠️</span>
                    <span>{errorMsg}</span>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-[12px] font-bold text-slate-800 dark:text-slate-300 mb-2 uppercase tracking-wide">
                        Fiyat (TRY) <span className="text-rose-500">*</span>
                    </label>
                    <input
                        defaultValue={existingListing ? Number(existingListing.price) : Number(erpProduct.price || 0)}
                        name="price"
                        type="number"
                        step="0.01"
                        required
                        className="w-full text-[14px] font-semibold border border-slate-300 dark:border-white/10 dark:bg-[#0f172a] dark:text-white rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all shadow-sm"
                        placeholder="Örn: 15400.00"
                    />
                </div>

                <div>
                    <label className="block text-[12px] font-bold text-slate-800 dark:text-slate-300 mb-2 uppercase tracking-wide">
                        B2B Satılabilir Adet <span className="text-rose-500">*</span>
                    </label>
                    <input
                        defaultValue={existingListing?.availableQty ?? erpProduct.stock}
                        name="availableQty"
                        type="number"
                        required
                        className="w-full text-[14px] font-semibold border border-slate-300 dark:border-white/10 dark:bg-[#0f172a] dark:text-white rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all shadow-sm"
                        placeholder="Satılabilir Stok"
                    />
                </div>

                <div>
                    <label className="block text-[12px] font-bold text-slate-800 dark:text-slate-300 mb-2 uppercase tracking-wide">Min. Sipariş Adedi (MoQ)</label>
                    <input
                        defaultValue={existingListing?.minQty ?? 1}
                        name="minQty"
                        type="number"
                        min="1"
                        className="w-full text-[14px] border border-slate-300 dark:border-white/10 dark:bg-[#0f172a] dark:text-white rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all shadow-sm"
                    />
                </div>

                <div>
                    <label className="block text-[12px] font-bold text-slate-800 dark:text-slate-300 mb-2 uppercase tracking-wide">Hazırlık/Sevk Süresi (Gün)</label>
                    <input
                        defaultValue={existingListing?.leadTimeDays ?? 0}
                        name="leadTimeDays"
                        type="number"
                        min="0"
                        className="w-full text-[14px] border border-slate-300 dark:border-white/10 dark:bg-[#0f172a] dark:text-white rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all shadow-sm"
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="block text-[12px] font-bold text-slate-800 dark:text-slate-300 mb-2 uppercase tracking-wide">B2B Katalog Durumu</label>
                    <select
                        defaultValue={existingListing?.status ?? "ACTIVE"}
                        name="status"
                        className="w-full text-[14px] font-bold border border-slate-300 dark:border-white/10 dark:bg-[#0f172a] dark:text-white rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all shadow-sm cursor-pointer"
                    >
                        <option value="ACTIVE">⚡ AKTİF (Katalogda Görünsün)</option>
                        <option value="PAUSED">⏸️ DURAKLATILDI (Gizlensin)</option>
                    </select>
                </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 mt-8 pt-6 border-t border-slate-100 dark:border-white/10">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="w-full sm:w-auto h-11 px-6 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 text-[13px] font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 transition-colors shadow-sm"
                >
                    İptal
                </button>
                <button
                    type="submit"
                    disabled={isPending}
                    className="w-full sm:w-auto h-11 px-8 bg-blue-600 text-white text-[13px] font-black tracking-wide rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-sm disabled:opacity-70 disabled:scale-100 flex items-center justify-center gap-2"
                >
                    {isPending ? (
                        <><Loader2 size={16} className="animate-spin" /> Kaydediliyor...</>
                    ) : (existingListing ? "Güncelle ve Yayınla" : "Kataloga Ekle ve Yayınla")}
                </button>
            </div>
        </form>
    );
}
