"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateCartItemQtyAction, clearCartAction } from "@/actions/cartActions";
import { processCheckoutAction } from "@/actions/checkoutAction";
import Link from "next/link";
import { useModal } from "@/contexts/ModalContext";
import { ShoppingBag, Trash2, ArrowRight, Save, Truck, Package, RotateCcw } from "lucide-react";

type CartItemDisplay = {
    productId: string;
    productName: string;
    sellerCompanyId: string;
    sellerName: string;
    qty: number;
    price: number;
};

export default function CartClient({ initialItems }: { initialItems: CartItemDisplay[] }) {
    const { showConfirm, showSuccess, showError, showWarning } = useModal();
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

    const handleClear = () => {
        showConfirm(
            "Sepeti Boşalt",
            "Sepetinizdeki tüm ürünleri silmek istediğinize emin misiniz?",
            async () => {
                setItems([]);
                await clearCartAction();
                router.refresh();
            }
        );
    };

    const handleCheckout = () => {
        if (items.length === 0) return;
        router.push("/catalog/checkout");
    };

    const subtotal = items.reduce((acc, item) => acc + (item.price * item.qty), 0);

    return (
        <div className="flex flex-col lg:flex-row gap-8">
            {items.length === 0 ? (
                <div className="w-full bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
                    <div className="w-20 h-20 bg-slate-50 dark:bg-[#0f172a] rounded-full flex items-center justify-center mb-6">
                        <ShoppingBag className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Sepetiniz Boş</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm">Ağ üzerinde aradığınız ürünleri sepetinize ekleyerek çoklu tedarik siparişi veya ihale oluşturabilirsiniz.</p>
                    <Link href="/catalog" className="inline-flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-sm">
                        Kataloğa Git <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            ) : (
                <>
                    <div className="lg:col-span-2 w-full lg:w-2/3 space-y-6">
                        <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                            <div className="p-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] flex items-center justify-between">
                                <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    <Package className="w-4 h-4 text-indigo-500" />
                                    Eklenen Tedarik Kalemleri ({items.length})
                                </h2>
                                <button onClick={handleClear} className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1">
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Sepeti Boşalt
                                </button>
                            </div>

                            <div className="p-0 sm:p-2 divide-y divide-slate-100 dark:divide-white/5">
                                {items.map(item => (
                                    <div key={`${item.productId}-${item.sellerCompanyId}`} className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors rounded-xl mx-2">
                                        <div className="flex-1 min-w-0 w-full">
                                            <h4 className="font-bold text-slate-900 dark:text-white text-base mb-1 truncate">{item.productName}</h4>
                                            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                Tedarikçi: <span className="text-indigo-600 dark:text-indigo-400 break-words">{item.sellerName}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto shrink-0 mt-3 sm:mt-0">
                                            <div className="text-right">
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Birim Fiyat</div>
                                                <div className="font-mono font-bold text-slate-700 dark:text-slate-300">{item.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</div>
                                            </div>
                                            
                                            <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#0f172a] rounded-lg border border-slate-200 dark:border-white/10 p-1 shadow-sm">
                                                <button onClick={() => updateQty(item.productId, item.sellerCompanyId, item.qty - 1)} className="w-7 h-7 flex items-center justify-center rounded bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition-colors text-slate-700 dark:text-slate-300">-</button>
                                                <span className="w-8 text-center font-mono font-bold text-sm text-slate-900 dark:text-white">{item.qty}</span>
                                                <button onClick={() => updateQty(item.productId, item.sellerCompanyId, item.qty + 1)} className="w-7 h-7 flex items-center justify-center rounded bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition-colors text-slate-700 dark:text-slate-300">+</button>
                                            </div>

                                            <div className="text-right w-24">
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ara Toplam</div>
                                                <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-base">{(item.price * item.qty).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</div>
                                            </div>

                                            <button 
                                                onClick={() => updateQty(item.productId, item.sellerCompanyId, 0)}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                                                title="Ürünü Sil"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-1 w-full lg:w-1/3">
                        <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-white/5 sticky top-6">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/5 pb-4 mb-6 flex items-center gap-2">
                                <Save className="w-5 h-5 text-emerald-500" />
                                Sipariş Özeti
                            </h2>
                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600 dark:text-slate-400 font-medium">Ara Toplam (KDV Hariç)</span>
                                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{subtotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1"><Truck className="w-4 h-4" /> Lojistik / Kargo</span>
                                    <span className="font-mono text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">Sonra Hesaplanacak</span>
                                </div>
                            </div>
                            
                            <div className="flex justify-between items-end border-t border-slate-100 dark:border-white/5 pt-6 mb-8">
                                <span className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider">Tahmini Tutar</span>
                                <span className="font-mono text-xl font-bold text-emerald-600 dark:text-emerald-400">{subtotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                            </div>

                            <button
                                onClick={handleCheckout}
                                disabled={isPending}
                                className="w-full flex items-center justify-center gap-2 py-3.5 bg-emerald-600 text-white text-sm font-bold uppercase tracking-wide rounded-xl hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-sm disabled:opacity-50"
                            >
                                {isPending ? "İşleniyor..." : "Siparişi Tamamla (Direkt Alım)"}
                            </button>

                            <p className="text-[10px] text-slate-500 dark:text-slate-400 text-center mt-3 font-medium">
                                İleri adımda ödeme yönteminizi (Açık Hesap / Kredi Kartı) seçerek PO (Purchase Order) oluşturacaksınız.
                            </p>

                            <div className="relative flex items-center gap-3 py-6">
                                <div className="flex-1 h-[1px] bg-slate-200 dark:bg-white/10"></div>
                                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">VEYA</span>
                                <div className="flex-1 h-[1px] bg-slate-200 dark:bg-white/10"></div>
                            </div>

                            <button
                                onClick={async () => {
                                    if (items.length === 0) return;
                                    startTransition(async () => {
                                        try {
                                            const { createRfqFromCartAction } = await import("@/actions/rfqActions");
                                            const res = await createRfqFromCartAction();
                                            showSuccess("İhale Başlatıldı", "Sepetteki ürünlerden başarıyla çoklu ihale (RFQ) talebi fırlatıldı!");
                                            router.push(`/rfq/${res.rfqId}`);
                                        } catch (e: any) {
                                            showError("İhale Hatası", e.message || "İhale oluşturulamadı.");
                                        }
                                    });
                                }}
                                disabled={isPending}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-white dark:bg-[#0f172a] border border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-400 text-xs font-bold uppercase tracking-wide rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-500/10 active:scale-[0.98] transition-all shadow-sm flex-col leading-tight disabled:opacity-50"
                            >
                                <span className="flex items-center gap-1.5"><RotateCcw className="w-3.5 h-3.5" /> Çoklu Teklif İste (RFQ)</span>
                            </button>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 text-center mt-3 font-medium">
                                Fiyatlarda pazarlık yapmak mı istiyorsunuz? Ağa fırlatın ve bekleyin.
                            </p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
