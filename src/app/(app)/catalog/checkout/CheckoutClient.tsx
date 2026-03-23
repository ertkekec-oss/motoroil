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
                await createOrdersFromCartAction(attemptKey);
                showSuccess("Sipariş Onaylandı", "Başarıyla Ağ Açık Hesabı (Escrow Mimarisi) üzerinden B2B sipariş fırlatıldı!");
                router.push("/b2b/buyer/orders");
            } catch (err: any) {
                showError("İşlem Başarısız", err.message || "Ödeme veya sipariş aktarımı sırasında bir hata oluştu.");
            }
        });
    };

    return (
        <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:col-span-2 w-full lg:w-2/3 space-y-6">
                {previewData.groups.map((group: any) => (
                    <div key={group.sellerCompanyId} className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
                        <div className="p-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] flex items-center justify-between">
                            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <Store className="w-4 h-4 text-indigo-500" />
                                Satıcı / Tedarikçi: <span className="text-indigo-600 dark:text-indigo-400">{group.sellerName}</span>
                            </h3>
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 px-2 py-1 bg-white dark:bg-[#1e293b] rounded border border-slate-200 dark:border-white/10 uppercase tracking-wider shadow-sm">
                                Açık Hesap (B2B)
                            </span>
                        </div>
                        
                        <div className="p-4 sm:p-6 space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-600 dark:text-slate-400 font-medium">Tedarik Ara Toplamı</span>
                                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{group.subtotalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                            </div>
                            
                            <div className="flex justify-between items-center text-sm p-3 bg-slate-50 dark:bg-white/[0.02] rounded-lg border border-slate-100 dark:border-white/5">
                                <span className="text-slate-500 font-medium flex items-center gap-1.5"><Info className="w-3.5 h-3.5" /> Ağ Komisyonu (%5 - Satıcı Öder)</span>
                                <span className="font-mono text-slate-500 font-bold">-{group.platformCommission.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                            </div>
                            
                            <div className="flex justify-between items-center text-sm p-3 bg-amber-50 dark:bg-amber-500/10 rounded-lg border border-amber-100 dark:border-amber-500/20">
                                <span className="text-amber-800 dark:text-amber-500 font-bold flex items-center gap-1.5"><ShieldCheck className="w-4 h-4" /> Escrow / Emanet Güvence Bedeli (%1 - Alıcı Öder)</span>
                                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">+{group.escrowFee.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                            </div>
                            
                            <div className="flex justify-between items-end border-t border-slate-100 dark:border-white/5 pt-4 mt-2">
                                <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Satıcı Net Yükümlülük</span>
                                <span className="font-mono text-lg font-bold text-emerald-600 dark:text-emerald-400">{group.orderTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="lg:col-span-1 w-full lg:w-1/3">
                <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-2xl p-6 sticky top-6 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/5 pb-4 mb-6 flex items-center gap-2">
                        <Calculator className="w-5 h-5 text-emerald-500" />
                        Ağ Finansman Özeti
                    </h2>
                    
                    <div className="flex justify-between items-end text-base font-bold text-slate-900 dark:text-white mb-6">
                        <span className="uppercase tracking-wider">Genel Toplam (Tüm Tedarik)</span>
                        <span className="font-mono text-2xl text-emerald-600 dark:text-emerald-400">{previewData.grandTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                    </div>

                    <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-xl p-4 text-xs text-indigo-800 dark:text-indigo-300 mb-6 font-medium shadow-sm flex flex-col gap-2">
                        <span className="flex items-center gap-2 text-sm font-bold text-indigo-900 dark:text-indigo-400"><ShieldCheck className="w-5 h-5" /> B2B Escrow Güvencesi Aktif</span>
                        <p className="leading-relaxed">Ağ üzerindeki emanet havuzuna fon bloke edilir ve tarafınıza ulaşıp teslimat onayı verdiğinizde serbest kalır.</p>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={isPending || !attemptKey}
                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-emerald-600 text-white text-sm font-bold uppercase tracking-wide rounded-xl hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-sm disabled:opacity-50"
                    >
                        {isPending ? "Bloke Ediliyor..." : "Siparişi Onayla & Bloke Et"}
                        {!isPending && <ArrowRight className="w-4 h-4" />}
                    </button>

                    <p className="text-[10px] text-slate-500 dark:text-slate-400 text-center mt-4 font-medium flex items-start gap-1">
                        <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                        <span>Siparişi onayladığınızda Periodya B2B Güven Ağı üzerindeki finansman taahhütlerini kabul etmiş olursunuz.</span>
                    </p>
                </div>
            </div>
        </div>
    );
}
