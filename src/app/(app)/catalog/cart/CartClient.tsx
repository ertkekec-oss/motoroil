"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateCartItemQtyAction, clearCartAction } from "@/actions/cartActions";
import Link from "next/link";
import { useModal } from "@/contexts/ModalContext";
import { ShoppingBag, Trash2, ArrowRight, Save, Truck, Package, RotateCcw, Minus, Plus, Building2 } from "lucide-react";

type CartItemDisplay = {
    productId: string;
    productName: string;
    sellerCompanyId: string;
    sellerName: string;
    qty: number;
    price: number;
};

export default function CartClient({ initialItems }: { initialItems: CartItemDisplay[] }) {
    const { showConfirm, showSuccess, showError } = useModal();
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
        <div className="flex flex-col lg:flex-row gap-6 w-full">
            {items.length === 0 ? (
                <div className="w-full bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm py-24 text-center flex flex-col items-center justify-center">
                    <div className="w-20 h-20 bg-slate-50 dark:bg-[#0f172a] rounded-full flex items-center justify-center shadow-inner mb-6 border border-slate-100 dark:border-white/5">
                        <ShoppingBag className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Sepetiniz Boş</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 max-w-sm">Ağ üzerinde aradığınız ürünleri sepetinize ekleyerek çoklu tedarik siparişi veya ihale oluşturabilirsiniz.</p>
                    <Link href="/catalog" className="inline-flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-sm">
                        Kataloğa Git <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            ) : (
                <>
                    {/* Items List */}
                    <div className="flex-1 space-y-4">
                        <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden flex flex-col relative">
                            <div className="px-5 py-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/50 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-10">
                                <div>
                                    <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        <Package className="w-4 h-4 text-indigo-500" />
                                        Eklenen Tedarik Kalemleri
                                        <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-widest">{items.length} Kayıt</span>
                                    </h2>
                                </div>
                                <button onClick={handleClear} className="text-[11px] font-bold uppercase tracking-widest text-rose-500 hover:text-rose-600 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5">
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Sepeti Boşalt
                                </button>
                            </div>

                            <div className="divide-y divide-slate-100 dark:divide-white/5">
                                {items.map(item => (
                                    <div key={`${item.productId}-${item.sellerCompanyId}`} className="p-5 flex flex-col md:flex-row items-start md:items-center gap-6 hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors group">
                                        <div className="flex-1 min-w-0 w-full">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h4 className="font-bold text-slate-900 dark:text-white text-base truncate" title={item.productName}>{item.productName}</h4>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border border-slate-200 dark:border-white/10 px-1.5 py-0.5 rounded">B2B AĞ</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                                                <Building2 className="w-3.5 h-3.5" />
                                                <span className="truncate max-w-xs">{item.sellerName}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between md:justify-end gap-5 w-full md:w-auto shrink-0 bg-slate-50 dark:bg-slate-800/50 md:bg-transparent md:dark:bg-transparent p-3 md:p-0 rounded-xl md:rounded-none">
                                            
                                            <div className="hidden md:block w-32 border-r border-slate-100 dark:border-white/5 pr-5">
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 text-right">Birim Fiyat</div>
                                                <div className="font-mono font-bold text-slate-700 dark:text-slate-300 text-sm text-right">{item.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</div>
                                            </div>

                                            <div className="flex items-center gap-2 bg-white dark:bg-[#0f172a] rounded-lg border border-slate-200 dark:border-white/10 p-1 shadow-sm shrink-0">
                                                <button onClick={() => updateQty(item.productId, item.sellerCompanyId, item.qty - 1)} className="w-7 h-7 flex items-center justify-center rounded bg-slate-50 dark:bg-[#1e293b] border border-slate-100 dark:border-white/5 hover:bg-white dark:hover:bg-slate-800 transition-colors text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white group-active:scale-95">
                                                    <Minus className="w-3.5 h-3.5" />
                                                </button>
                                                <span className="w-8 text-center font-mono font-bold text-[13px] text-slate-900 dark:text-white select-none">{item.qty}</span>
                                                <button onClick={() => updateQty(item.productId, item.sellerCompanyId, item.qty + 1)} className="w-7 h-7 flex items-center justify-center rounded bg-slate-50 dark:bg-[#1e293b] border border-slate-100 dark:border-white/5 hover:bg-white dark:hover:bg-slate-800 transition-colors text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white group-active:scale-95">
                                                    <Plus className="w-3.5 h-3.5" />
                                                </button>
                                            </div>

                                            <div className="w-28 text-right">
                                                <div className="text-[10px] font-bold text-emerald-600/70 dark:text-emerald-500/70 uppercase tracking-widest mb-1">Ara Toplam</div>
                                                <div className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-base">{(item.price * item.qty).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</div>
                                            </div>

                                            <button 
                                                onClick={() => updateQty(item.productId, item.sellerCompanyId, 0)}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors ml-2"
                                                title="Ürünü Çıkar"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Order Summary Sidebar */}
                    <div className="w-full lg:w-[380px] shrink-0">
                        <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-white/5 sticky top-6">
                            <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/5 pb-4 mb-6 flex items-center gap-2">
                                <Save className="w-4 h-4 text-emerald-500" />
                                Sipariş Özeti
                            </h2>
                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600 dark:text-slate-400 font-medium">Ara Toplam (KDV Hariç)</span>
                                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{subtotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1.5"><Truck className="w-3.5 h-3.5 text-slate-400" /> Lojistik / Kargo</span>
                                    <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase tracking-widest font-bold px-2 py-0.5 rounded">Sonra Hesaplanacak</span>
                                </div>
                            </div>
                            
                            <div className="flex justify-between items-end bg-emerald-50 dark:bg-emerald-500/5 rounded-xl p-4 border border-emerald-100 dark:border-emerald-500/10 mb-8">
                                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-100 uppercase tracking-wider">Tahmini Tutar</span>
                                <span className="font-mono text-2xl font-bold text-emerald-700 dark:text-emerald-400 leading-none">{subtotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={handleCheckout}
                                    disabled={isPending}
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-bold rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 active:scale-[0.98] transition-all shadow-sm disabled:opacity-50"
                                >
                                    {isPending ? "İşleniyor..." : "Siparişi Tamamla (Direkt Alım)"}
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                                <p className="text-[11px] text-slate-500 font-medium text-center px-2">
                                    B2B sepetinizdeki ürünler için PO (Satınalma Emri) oluşturulacaktır.
                                </p>
                            </div>

                            <div className="relative flex items-center gap-3 py-6">
                                <div className="flex-1 h-[1px] bg-slate-100 dark:bg-white/5"></div>
                                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">ALTERNATİF</span>
                                <div className="flex-1 h-[1px] bg-slate-100 dark:bg-white/5"></div>
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
                                className="w-full relative overflow-hidden flex flex-col items-center justify-center p-3.5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-500/20 active:scale-[0.98] transition-all shadow-sm disabled:opacity-50 group"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/5 to-indigo-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                                <span className="text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 mb-1">
                                    <RotateCcw className="w-3.5 h-3.5" /> Çoklu Teklif İste (RFQ)
                                </span>
                                <span className="text-[10px] font-medium opacity-80">
                                    Ağırlıklı fiyatlandırma için tedarikçilere fırlatın.
                                </span>
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
