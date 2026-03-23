"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateCartItemQtyAction, clearCartAction } from "@/actions/cartActions";
import Link from "next/link";
import { useModal } from "@/contexts/ModalContext";
import { ShoppingBag, Trash2, ArrowRight, Save, Truck, Package, RotateCcw, Minus, Plus, Building2, CreditCard, Box } from "lucide-react";

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
    const uniqueSellersCount = new Set(items.map(i => i.sellerCompanyId)).size;

    return (
        <div className="w-full grid grid-cols-1 lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_400px] gap-6 lg:gap-8 items-start">
            {items.length === 0 ? (
                <div className="w-full bg-white dark:bg-[#1e293b]/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl shadow-lg py-32 text-center flex flex-col items-center justify-center">
                    <div className="w-24 h-24 bg-slate-50 dark:bg-[#0f172a] rounded-3xl flex items-center justify-center shadow-inner mb-6 border border-slate-100 dark:border-white/5 transform rotate-3">
                        <ShoppingBag className="w-10 h-10 text-slate-300 dark:text-slate-600 -rotate-3" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-3">Tedarik Sepetiniz Boş</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 max-w-md">B2B Network üzerinde farklı satıcılardan teklif almak veya anında sipariş vermek için ürünleri sepetinize ekleyin.</p>
                    <Link href="/catalog" className="inline-flex items-center justify-center gap-2 bg-indigo-600 dark:bg-indigo-500 text-white px-8 py-3.5 rounded-xl font-bold text-sm hover:bg-indigo-700 dark:hover:bg-indigo-400 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
                        <Box className="w-4 h-4" /> B2B Kataloğu İncele
                    </Link>
                </div>
            ) : (
                <>
                    {/* LEFT COLUMN: Items List */}
                    <div className="flex-1 w-full space-y-4">
                        
                        {/* Summary Bar Above Items */}
                        <div className="flex items-center justify-between bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400">
                                    <Package className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-slate-900 dark:text-white">Eklenen Tedarik Kalemleri</h2>
                                    <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">{items.length} Kalem &bull; {uniqueSellersCount} Farklı Tedarikçi</p>
                                </div>
                            </div>
                            <button onClick={handleClear} className="text-xs font-bold uppercase tracking-widest text-rose-500 hover:text-rose-600 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-2">
                                <Trash2 className="w-4 h-4" />
                                <span className="hidden sm:inline">Sepeti Boşalt</span>
                            </button>
                        </div>

                        {/* Items Container */}
                        <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-3xl shadow-sm overflow-hidden flex flex-col">
                            <div className="divide-y divide-slate-100 dark:divide-white/5">
                                {items.map((item, index) => (
                                    <div key={`${item.productId}-${item.sellerCompanyId}`} className="p-5 sm:p-6 flex flex-col xl:flex-row items-start xl:items-center gap-6 hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors group">
                                        
                                        {/* Product Info */}
                                        <div className="flex-1 min-w-0 w-full xl:w-auto">
                                            <div className="flex items-center gap-3 mb-2.5">
                                                <span className="w-6 h-6 rounded bg-slate-100 dark:bg-white/5 flex items-center justify-center text-[10px] font-black text-slate-400 dark:text-slate-500">
                                                    {index + 1}
                                                </span>
                                                <h4 className="font-bold text-slate-900 dark:text-white text-lg truncate" title={item.productName}>{item.productName}</h4>
                                                <span className="hidden sm:inline-block text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 uppercase tracking-widest px-2 py-1 rounded">B2B NETWORK</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 font-medium ml-9">
                                                <Building2 className="w-4 h-4 text-slate-400" />
                                                <span className="truncate max-w-sm" title={item.sellerName}>{item.sellerName}</span>
                                            </div>
                                        </div>

                                        {/* Pricing & Controls */}
                                        <div className="flex items-center justify-between xl:justify-end gap-6 md:gap-8 w-full xl:w-auto shrink-0 bg-slate-50 dark:bg-[#0f172a]/50 xl:bg-transparent xl:dark:bg-transparent p-4 xl:p-0 rounded-2xl xl:rounded-none ml-0 xl:ml-auto border border-slate-100 dark:border-white/5 xl:border-none">
                                            
                                            <div className="w-24 border-r border-slate-200 dark:border-white/10 pr-6 text-right hidden sm:block">
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Birim Fiyat</div>
                                                <div className="font-mono font-bold text-slate-700 dark:text-slate-300 text-sm">{item.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</div>
                                            </div>

                                            <div className="flex items-center gap-1 bg-white dark:bg-[#1e293b] xl:dark:bg-[#0f172a] rounded-xl border border-slate-200 dark:border-white/10 p-1 shadow-sm shrink-0">
                                                <button onClick={() => updateQty(item.productId, item.sellerCompanyId, item.qty - 1)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 dark:bg-[#1e293b] hover:bg-slate-200 dark:hover:bg-white/10 transition-colors text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white group-active:scale-95 shadow-sm border border-slate-200/50 dark:border-white/5">
                                                    <Minus className="w-4 h-4" />
                                                </button>
                                                <span className="w-10 text-center font-mono font-bold text-sm text-slate-900 dark:text-white select-none">{item.qty}</span>
                                                <button onClick={() => updateQty(item.productId, item.sellerCompanyId, item.qty + 1)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 dark:bg-[#1e293b] hover:bg-slate-200 dark:hover:bg-white/10 transition-colors text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white group-active:scale-95 shadow-sm border border-slate-200/50 dark:border-white/5">
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <div className="w-28 text-right">
                                                <div className="text-[10px] font-bold text-emerald-600/80 dark:text-emerald-500/80 uppercase tracking-widest mb-1">Ara Toplam</div>
                                                <div className="font-mono font-black text-emerald-700 dark:text-emerald-400 text-lg">{(item.price * item.qty).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
                                            </div>

                                            <button 
                                                onClick={() => updateQty(item.productId, item.sellerCompanyId, 0)}
                                                className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:shadow-sm transition-all ml-1"
                                                title="Sepetten Çıkar"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>

                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Order Summary Sidebar */}
                    <div className="w-full sticky top-6">
                        <div className="bg-white dark:bg-[#1e293b] rounded-3xl p-6 sm:p-8 shadow-lg border border-slate-200 dark:border-white/10">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/10 pb-5 mb-6 flex items-center gap-3">
                                <Save className="w-6 h-6 text-emerald-500" />
                                İşlem Özeti
                            </h2>
                            
                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-600 dark:text-slate-400 font-medium">Ara Toplam (KDV Hariç)</span>
                                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-base">{subtotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1.5"><Truck className="w-4 h-4 text-slate-400" /> Lojistik / Kargo</span>
                                    <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold px-2.5 py-1 rounded-md">Adımda Belli Olacak</span>
                                </div>
                            </div>
                            
                            <div className="flex flex-col gap-2 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/10 rounded-2xl p-6 border border-emerald-100 dark:border-emerald-800/30 mb-8 shadow-inner">
                                <span className="text-xs font-black text-emerald-800 dark:text-emerald-500 uppercase tracking-widest">Tahmini Tutar</span>
                                <span className="font-mono text-3xl font-black text-emerald-700 dark:text-emerald-300 leading-none tracking-tight">
                                    {subtotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} <span className="text-xl">₺</span>
                                </span>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <button
                                        onClick={handleCheckout}
                                        disabled={isPending}
                                        className="w-full flex items-center justify-center gap-2 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-black uppercase tracking-wider rounded-xl hover:bg-slate-800 dark:hover:bg-slate-200 active:scale-[0.98] transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                                    >
                                        <CreditCard className="w-5 h-5" />
                                        Satınalma Emri (PO) Oluştur
                                    </button>
                                    <p className="text-[11px] text-slate-500 font-medium text-center px-4 mt-3 leading-relaxed">
                                        İleri adımda açık hesap / cari limit kullanabilir veya kredi kartı ile 3D Secure ödeme yapabilirsiniz.
                                    </p>
                                </div>

                                <div className="relative flex items-center gap-4 py-4">
                                    <div className="flex-1 h-[1px] bg-slate-200 dark:bg-white/10"></div>
                                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">VEYA</span>
                                    <div className="flex-1 h-[1px] bg-slate-200 dark:bg-white/10"></div>
                                </div>

                                <div>
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
                                        className="w-full relative overflow-hidden flex flex-col items-center justify-center p-4 bg-indigo-50 dark:bg-indigo-500/10 border-2 border-dashed border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-500/20 active:scale-[0.98] transition-all disabled:opacity-50 group hover:border-solid hover:shadow-md"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/10 to-indigo-500/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
                                        <span className="text-sm font-black uppercase tracking-widest flex items-center gap-2 mb-1.5 z-10">
                                            <RotateCcw className="w-4 h-4" /> İhale Fırlat (RFQ)
                                        </span>
                                        <span className="text-[10px] font-medium opacity-80 z-10 text-center px-2">
                                            Fiyatları kabul etmeyip bu listeye özel indirim teklifleri toplayın.
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
