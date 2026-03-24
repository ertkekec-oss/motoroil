"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitRfqAction } from "@/actions/rfqActions";
import { acceptOfferAction } from "@/actions/rfqResponseActions";

import RoutingWidget from "./RoutingWidget";
import { useModal } from "@/contexts/ModalContext";
import { Package, Send, CheckCircle2, FileText, Clock } from "lucide-react";

export default function RfqDetailClient({ rfq, items, offers }: { rfq: any, items: any[], offers: any[] }) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const { showSuccess, showError, showConfirm } = useModal();

    const handleSubmit = () => {
        showConfirm("Onay Gerekli", "Seçili tüm ağ tedarikçilerine resmi ihale paketi gönderilsin mi?", () => {
            startTransition(async () => {
                try {
                    const res = await submitRfqAction(rfq.id);
                    if (res && res.error) throw new Error(res.error);
                    showSuccess("Başarılı", "İhale tüm tedarikçilere başarıyla fırlatıldı.");
                } catch (err: any) {
                    showError("Hata", err.message || "İhale başlatılamadı.");
                }
            });
        });
    };

    const handleAcceptOffer = (offerId: string) => {
        showConfirm("Teklif Kabul Edilecek", "Bu teklifi kabul etmek istediğinize emin misiniz? Kabul edildiğinde otomatik olarak B2B Ağ Siparişi (Network Order) oluşturulacaktır.", () => {
            startTransition(async () => {
                try {
                    const res = await acceptOfferAction(offerId);
                    if (res && res.error) throw new Error(res.error);
                    showSuccess("Kabul Edildi", "Teklif başarıyla onaylandı ve siparişe dönüştürüldü. Lütfen Satınalma paneline geçiniz.");
                    router.push("/hub/buyer/orders");
                } catch (err: any) {
                    showError("Hata", err.message || "Teklif kabul edilemedi.");
                }
            });
        });
    };

    return (
        <div className="space-y-6">
            <RoutingWidget rfqId={rfq.id} />

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] xl:grid-cols-[1.2fr_1fr] gap-6 items-start">
                
                {/* Column 1: İhale Kalemleri */}
                <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full min-h-[400px]">
                     <div className="px-5 py-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0f172a]/50 flex items-center justify-between">
                         <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-indigo-500" />
                            <h2 className="text-sm font-bold text-slate-800 dark:text-white">İhale Kalemleri (Paket İçeriği)</h2>
                         </div>
                         <span className="text-[10px] font-bold bg-slate-200/50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2.5 py-1 rounded-md uppercase tracking-widest border border-slate-200/50 dark:border-white/10 shrink-0">
                            {items.length} Kalem
                         </span>
                     </div>
                     <div className="overflow-x-auto flex-1 p-0">
                         <table className="min-w-full text-left text-[12px] whitespace-nowrap border-collapse">
                             <thead className="bg-[#f8fafc] dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                                 <tr>
                                     <th className="px-5 py-3 font-bold uppercase tracking-widest">Ürün Adı</th>
                                     <th className="px-5 py-3 font-bold uppercase tracking-widest">Ağ Tedarikçisi</th>
                                     <th className="px-5 py-3 font-bold uppercase tracking-widest text-right">Miktar</th>
                                 </tr>
                             </thead>
                             <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-slate-300 bg-white dark:bg-transparent">
                                 {items.map(item => (
                                     <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                                         <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white truncate max-w-[180px]">{item.productName}</td>
                                         <td className="px-5 py-3.5 text-slate-500">{item.sellerName}</td>
                                         <td className="px-5 py-3.5 text-right">
                                             <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                                                 {item.quantity}
                                             </span>
                                         </td>
                                     </tr>
                                 ))}
                             </tbody>
                         </table>
                     </div>
                     
                     {rfq.status === "DRAFT" && (
                         <div className="p-5 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01]">
                             <button
                                 onClick={handleSubmit}
                                 disabled={isPending}
                                 className="w-full flex items-center justify-center gap-2 h-10 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[13px] font-bold rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 active:scale-95 transition-all shadow-sm disabled:opacity-50 disabled:active:scale-100"
                             >
                                 <Send className="w-4 h-4" />
                                 {isPending ? "Fırlatılıyor..." : "Talebi Tedarikçilere Fırlat"}
                             </button>
                         </div>
                     )}
                </div>

                {/* Column 2: Gelen Satıcı Teklifleri */}
                {rfq.status !== "DRAFT" && (
                    <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full min-h-[400px]">
                         <div className="px-5 py-4 border-b border-slate-100 dark:border-white/5 bg-indigo-50/30 dark:bg-indigo-500/5 flex items-center justify-between">
                             <div className="flex items-center gap-2">
                                 <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                 <h2 className="text-sm font-bold text-indigo-900 dark:text-indigo-100">Gelen Teklifler</h2>
                             </div>
                             <span className="text-[10px] font-bold bg-white dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 px-2.5 py-1 rounded-md uppercase tracking-widest border border-indigo-100 dark:border-indigo-500/20 shrink-0 flex items-center gap-1.5 shadow-sm">
                                {offers.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>}
                                {offers.length} Teklif
                             </span>
                         </div>
                         <div className="p-5 flex-1 overflow-y-auto bg-slate-50/30 dark:bg-transparent">
                             {offers.length === 0 ? (
                                 <div className="flex flex-col items-center justify-center h-full text-center py-12 opacity-80">
                                     <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800/50 flex flex-col items-center justify-center mb-4 border border-slate-200 dark:border-white/5 shadow-inner">
                                        <Clock className="w-6 h-6 text-slate-400 animate-pulse" />
                                     </div>
                                     <h3 className="text-[14px] font-bold text-slate-700 dark:text-slate-300 mb-1">Yanıt Bekleniyor</h3>
                                     <p className="text-[12px] text-slate-500 max-w-[220px]">Tedarikçiler fiyat ve termin sürelerini girdiğinde bildirim alacaksınız.</p>
                                 </div>
                             ) : (
                                 <div className="flex flex-col gap-4">
                                     {offers.map(offer => (
                                         <div key={offer.id} className={`p-5 rounded-2xl border transition-all flex flex-col gap-4 ${offer.status === 'ACCEPTED' ? 'bg-emerald-50/40 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20 shadow-sm' : 'bg-white dark:bg-[#0f172a] border-slate-200 dark:border-white/10 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:shadow-md'}`}>
                                             <div className="flex justify-between items-start gap-4">
                                                 <h3 className="font-bold text-[14px] text-slate-900 dark:text-white leading-tight pr-2">
                                                     {offer.sellerName}
                                                 </h3>
                                                 <span className={`shrink-0 text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md border ${
                                                     offer.status === 'ACCEPTED' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30' :
                                                     offer.status === 'REJECTED' ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/30' :
                                                     offer.status === 'COUNTERED' ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30 shadow-inner' : 
                                                     'bg-slate-100 text-slate-600 border-slate-200'
                                                 }`}>
                                                     {offer.status === 'COUNTERED' ? 'YENİ TEKLİF' : offer.status === 'ACCEPTED' ? 'ONAYLANDI' : offer.status}
                                                 </span>
                                             </div>
                                             
                                             <div className={`flex items-center justify-between rounded-xl px-4 py-3 border ${offer.status === 'ACCEPTED' ? 'bg-white/60 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20' : 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/5'}`}>
                                                 <span className="text-[12px] font-semibold text-slate-500 dark:text-slate-400">Teklif Tutarı:</span>
                                                 <span className={`font-mono font-black text-[16px] ${offer.status === 'ACCEPTED' ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                                                     {Number(offer.totalPrice).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} <span className="text-[12px] opacity-70 font-sans">₺</span>
                                                 </span>
                                             </div>
                                             
                                             {offer.status === "COUNTERED" && rfq.status !== "ACCEPTED" && (
                                                 <button
                                                     onClick={() => handleAcceptOffer(offer.id)}
                                                     disabled={isPending}
                                                     className="w-full flex items-center justify-center gap-2 h-10 bg-indigo-600 hover:bg-indigo-500 text-white text-[12px] font-bold uppercase tracking-wider rounded-xl active:scale-95 transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50"
                                                 >
                                                     <CheckCircle2 className="w-4 h-4" /> Kabul Et ve Siparişi Tamamla
                                                 </button>
                                             )}
                                             
                                             {offer.status === "ACCEPTED" && (
                                                 <div className="flex items-center justify-center gap-1.5 text-center text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mt-1">
                                                     <CheckCircle2 className="w-4 h-4" /> Mutabakat Sağlandı
                                                 </div>
                                             )}
                                         </div>
                                     ))}
                                 </div>
                             )}
                         </div>
                    </div>
                )}

            </div>
        </div>
    );
}
