"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { broadcastRfqAction } from "@/actions/broadcastRfqAction";
import { useModal } from "@/contexts/ModalContext";

export default function NetworkRfqForm({ initialProducts }: { initialProducts: Array<{ id: string, name: string, code?: string }> }) {
    const { showSuccess, showError } = useModal();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [selectedProductId, setSelectedProductId] = useState<string>("");
    const [quantityStr, setQuantityStr] = useState("100");
    const [targetPriceStr, setTargetPriceStr] = useState("");

    const handleBroadcast = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedProductId) {
            showError("Hata", "Lütfen ağda aramak istediğiniz ürünü seçin.");
            return;
        }

        const qty = parseInt(quantityStr, 10);
        if (isNaN(qty) || qty <= 0) {
            showError("Hata", "Geçerli bir miktar girmelisiniz.");
            return;
        }

        const targetPrice = targetPriceStr ? parseFloat(targetPriceStr) : undefined;
        if (targetPrice !== undefined && (isNaN(targetPrice) || targetPrice < 0)) {
            showError("Hata", "Geçerli bir hedef fiyat girin (Opsiyonel)");
            return;
        }

        setLoading(true);

        try {
            const result = await broadcastRfqAction(selectedProductId, qty, targetPrice);
            if (result.success) {
                showSuccess(
                    "Sinyal Gönderildi!", 
                    `RFQ başarıyla fırlatıldı! Ağdaki ${result.targetCount} satıcıya anında Otonom İhale isteğiniz ulaştı.`
                );
                router.push("/rfq");
            } else {
                showError("Yönlendirme Başarısız", result.message || "Ağda tedarikçi bulunamadı.");
            }
        } catch (error: any) {
            showError("Hata Oluştu", error.message || "Sinyal iletilirken bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleBroadcast} className="space-y-6">
            <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Hedef Ürün (Global Product)</label>
                <select 
                    value={selectedProductId}
                    onChange={e => setSelectedProductId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#1e293b] border border-slate-300 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white shadow-sm focus:ring-2 focus:ring-blue-500 transition-shadow appearance-none"
                >
                    <option value="">-- Ağ Kataloğundan Ürün Seçin --</option>
                    {initialProducts.map(p => (
                        <option key={p.id} value={p.id}>
                            {p.code ? `[${p.code}] ` : ""}{p.name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Talep Miktarı</label>
                    <input 
                        type="number"
                        min="1"
                        value={quantityStr}
                        onChange={e => setQuantityStr(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-[#1e293b] border border-slate-300 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white shadow-sm focus:ring-2 focus:ring-blue-500 transition-shadow"
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Hedef Birim Fiyat (Opsiyonel / TRY)</label>
                    <input 
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Örn: 25.50"
                        value={targetPriceStr}
                        onChange={e => setTargetPriceStr(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-[#1e293b] border border-slate-300 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white shadow-sm focus:ring-2 focus:ring-blue-500 transition-shadow"
                    />
                </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex justify-end">
                <button
                    type="submit"
                    disabled={loading || !selectedProductId}
                    className="h-12 px-8 inline-flex items-center justify-center rounded-xl text-[14px] font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm gap-2 disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                    {loading ? "Ağ Taraması Sürüyor..." : "Ağa Yayınla (Broadcast Demand)"}
                </button>
            </div>
        </form>
    );
}
