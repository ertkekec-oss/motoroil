"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { createOrdersFromCartAction } from "@/actions/createOrdersFromCartAction";
import { v4 as uuidv4 } from "uuid";
import { useState, useEffect } from "react";
import { useModal } from "@/contexts/ModalContext";
import { ShieldCheck, ArrowRight, Save, Store, Calculator, Info, ShieldAlert } from "lucide-react";

export default function CheckoutClient({ previewData }: { previewData: any }) {
    const { showSuccess, showError, showWarning } = useModal();
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const [attemptKey, setAttemptKey] = useState("");

    useEffect(() => {
        // Generate once on mount
        setAttemptKey(`chk_${uuidv4()}`);
    }, []);

    const handleSubmit = () => {
        if (!attemptKey) return;

        startTransition(async () => {
            try {
                const res = await createOrdersFromCartAction(attemptKey);
                
                if (res?.error) {
                    showError("İşlem Başarısız", res.error);
                    return;
                }

                showSuccess("Sipariş Onaylandı", "Başarıyla Ağ Açık Hesabı (Escrow Mimarisi) üzerinden B2B sipariş fırlatıldı!");
                router.push("/hub/buyer/orders");
            } catch (err: any) {
                showError("İşlem Başarısız", err.message || "Ödeme veya sipariş aktarımı sırasında bir hata oluştu.");
            }
        });
    };

    return (
        <div className="w-full grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_400px] gap-6 lg:gap-8 items-start">
            
            {/* LEFT COLUMN: Seller Groups */}
            <div className="w-full space-y-6">
                {previewData.groups.map((group: any) => (
                    <div key={group.sellerCompanyId} className="bg-white  border border-slate-200  rounded-3xl overflow-hidden shadow-sm">
                        <div className="p-5 border-b border-slate-100  bg-slate-50/50  flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <h3 className="font-bold text-slate-800  flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-indigo-50  flex items-center justify-center shrink-0">
                                    <Store className="w-4 h-4 text-indigo-500 " />
                                </div>
                                <span className="flex flex-col min-w-0">
                                    <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">Satıcı / Tedarikçi</span>
                                    <span className="text-base text-indigo-700  truncate" title={group.sellerName}>{group.sellerName}</span>
                                </span>
                            </h3>
                            <span className="text-[11px] font-bold text-slate-500  px-3 py-1.5 bg-white  rounded-lg border border-slate-200  uppercase tracking-widest shadow-sm">
                                Açık Hesap (B2B)
                            </span>
                        </div>
                        
                        <div className="p-6 space-y-5">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-600  font-medium">Tedarik Ara Toplamı</span>
                                <span className="font-mono font-bold text-slate-800 ">{group.subtotalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                            </div>
                            
                            <div className="flex justify-between items-center text-sm p-4 bg-slate-50  rounded-xl border border-slate-100 ">
                                <span className="text-slate-500 font-medium flex items-center gap-2">
                                    <Info className="w-4 h-4 text-slate-400" /> 
                                    Ağ Komisyonu <span className="text-[10px] font-bold uppercase tracking-widest opacity-70 ml-1">(Satıcı Tarafı)</span>
                                </span>
                                <span className="font-mono text-slate-500 font-bold">-{group.platformCommission.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                            </div>
                            
                            <div className="flex justify-between items-center text-sm p-4 bg-amber-50  rounded-xl border border-amber-100 ">
                                <span className="text-amber-800  font-bold flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4" /> 
                                    Escrow Emanet Güvence Bedeli <span className="text-[10px] uppercase tracking-widest opacity-80 bg-amber-200/50  px-1.5 py-0.5 rounded ml-1">%1 Alıcı Sorumluluğu</span>
                                </span>
                                <span className="font-mono font-bold text-amber-700 ">+{group.escrowFee.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                            </div>
                            
                            <div className="flex justify-between items-end border-t border-slate-100  pt-5 mt-2">
                                <span className="text-sm font-black text-slate-900  uppercase tracking-wider">Satıcı Net Yükümlülük</span>
                                <span className="font-mono text-2xl font-black text-emerald-600 ">{group.orderTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* RIGHT COLUMN: Network Finance Summary */}
            <div className="w-full shrink-0 sticky top-6">
                <div className="bg-white  border border-slate-200  rounded-3xl p-6 sm:p-8 shadow-lg">
                    <h2 className="text-xl font-bold text-slate-900  border-b border-slate-100  pb-5 mb-6 flex items-center gap-3">
                        <Calculator className="w-6 h-6 text-emerald-500" />
                        Ağ Finansman Özeti
                    </h2>
                    
                    <div className="flex flex-col gap-2 bg-gradient-to-br from-emerald-50 to-emerald-100/50   rounded-2xl p-6 border border-emerald-100  mb-8 shadow-inner">
                        <span className="text-xs font-black text-emerald-800  uppercase tracking-widest">Genel Toplam (Tüm Tedarik)</span>
                        <span className="font-mono text-3xl font-black text-emerald-700  leading-none tracking-tight">
                            {previewData.grandTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} <span className="text-xl">₺</span>
                        </span>
                    </div>

                    <div className="bg-indigo-50  border border-indigo-200  rounded-xl p-5 mb-8 shadow-sm">
                        <span className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-indigo-900  mb-2">
                            <ShieldCheck className="w-5 h-5" /> B2B Escrow Aktif
                        </span>
                        <p className="text-xs text-indigo-800  font-medium leading-relaxed">
                            Ağ üzerindeki emanet havuzuna fon bloke edilir ve tarafınıza ulaşıp teslimat onayı verdiğinizde otomatik serbest kalır.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <button
                            onClick={handleSubmit}
                            disabled={isPending || !attemptKey}
                            className="w-full flex items-center justify-center gap-2 py-4 bg-emerald-600 text-white text-sm font-black uppercase tracking-wider rounded-xl hover:bg-emerald-500 active:scale-[0.98] transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                        >
                            {isPending ? "Bloke Ediliyor..." : "Siparişi Onayla & Bloke Et"}
                            {!isPending && <ArrowRight className="w-5 h-5" />}
                        </button>

                        <div className="bg-slate-50  p-4 rounded-xl flex items-start gap-3 border border-slate-100 ">
                            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
                            <p className="text-[10px] text-slate-500  font-medium leading-relaxed">
                                Siparişi onayladığınızda Periodya B2B Güven Ağı üzerindeki blokaj ve teslimat komisyonlarına yönelik finansman taahhütlerini kabul etmiş olursunuz.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
