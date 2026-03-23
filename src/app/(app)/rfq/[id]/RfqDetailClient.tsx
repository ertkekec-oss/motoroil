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
                    await submitRfqAction(rfq.id);
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
                    await acceptOfferAction(offerId);
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

            <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Package className="w-5 h-5 text-indigo-500" />
                        İhale Kalemleri
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Bu ihale paketinde yer alan ağ ürünleri ve istenen tedarikçiler listesi.</p>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm whitespace-nowrap border-collapse">
                        <thead className="bg-[#1F3A5F] text-white">
                            <tr>
                                <th className="px-6 py-3 font-semibold text-xs tracking-wider uppercase">Ürün Adı</th>
                                <th className="px-6 py-3 font-semibold text-xs tracking-wider uppercase">Ağ Tedarikçisi</th>
                                <th className="px-6 py-3 font-semibold text-xs tracking-wider uppercase text-center">Hedef Miktar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-slate-300">
                            {items.map(item => (
                                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{item.productName}</td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{item.sellerName}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="inline-flex px-3 py-1 font-mono font-bold text-xs bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white rounded-md border border-slate-200 dark:border-slate-700">
                                            {item.quantity} Adet
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {rfq.status === "DRAFT" && (
                <div className="flex justify-end mt-4">
                    <button
                        onClick={handleSubmit}
                        disabled={isPending}
                        className="flex items-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-slate-900 text-sm font-bold rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 active:scale-95 transition-all shadow-sm disabled:opacity-50 disabled:active:scale-100"
                    >
                        <Send className="w-4 h-4" />
                        {isPending ? "Fırlatılıyor..." : "Talebi Tedarikçilere Fırlat"}
                    </button>
                </div>
            )}

            {rfq.status !== "DRAFT" && (
                <div className="mt-8">
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <FileText className="w-5 h-5 text-indigo-500" />
                            Gelen Satıcı Teklifleri
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Ağ üzerinden tarafınıza sunulan fiyat ve kurşun süresi (lead time) teklifleri.</p>
                    </div>

                    {offers.length === 0 ? (
                        <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-2xl p-12 text-center shadow-sm">
                            <Clock className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4 animate-pulse" />
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">Tedarikçi Yanıtları Bekleniyor</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                                Henüz hiçbir tedarikçi geri dönüş yapmadı. Ağ üzerindeki satıcılar talebinizi inceleyip karşı teklif verdiklerinde burada belirecektir.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {offers.map(offer => (
                                <div key={offer.id} className="relative bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow group flex flex-col">
                                    <div className="flex justify-between items-start mb-4 gap-4">
                                        <h3 className="font-bold text-slate-900 dark:text-white line-clamp-2 leading-tight">
                                            {offer.sellerName}
                                        </h3>
                                        <span className={`shrink-0 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded border ${
                                            offer.status === 'ACCEPTED' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' :
                                            offer.status === 'REJECTED' ? 'bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20' :
                                            offer.status === 'COUNTERED' ? 'bg-indigo-100 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20' : 
                                            'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-white/10'
                                        }`}>
                                            {offer.status === 'COUNTERED' ? 'YENİ TEKLİF' : 
                                             offer.status === 'ACCEPTED' ? 'KABUL EDİLDİ' : 
                                             offer.status === 'REJECTED' ? 'REDDEDİLDİ' : offer.status}
                                        </span>
                                    </div>
                                    
                                    <div className="bg-slate-50 dark:bg-[#0f172a] rounded-xl p-4 mb-5 border border-slate-100 dark:border-white/5 flex-1">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Sunulan Toplam Tutar</span>
                                            <span className="font-mono text-lg font-bold text-emerald-600 dark:text-emerald-400 block">
                                                {Number(offer.totalPrice).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                            </span>
                                        </div>
                                        {offer.expiresAt && (
                                            <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-white/5 mt-2">
                                                <span className="text-[11px] text-slate-500 dark:text-slate-500 font-medium">Geçerlilik Tarihi</span>
                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                    {new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(offer.expiresAt))}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {offer.status === "COUNTERED" && rfq.status !== "ACCEPTED" && (
                                        <button
                                            onClick={() => handleAcceptOffer(offer.id)}
                                            disabled={isPending}
                                            className="w-full flex items-center justify-center gap-2 py-3 bg-[#1F3A5F] hover:bg-[#152a47] dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-sm font-bold rounded-xl active:scale-95 transition-all shadow-sm disabled:opacity-50"
                                        >
                                            <CheckCircle2 className="w-4 h-4" />
                                            Kabul Et ve Siparişe Çevir
                                        </button>
                                    )}
                                    
                                    {offer.status === "ACCEPTED" && (
                                        <div className="flex items-center justify-center gap-1.5 text-center text-sm font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl py-3">
                                            <CheckCircle2 className="w-4 h-4" />
                                            Bu teklif onaylandı.
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
