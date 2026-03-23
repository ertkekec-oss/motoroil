"use client";

import { useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { counterRfqAction } from "@/actions/rfqResponseActions";
import { useModal } from "@/contexts/ModalContext";
import { Package, Send, CheckCircle2, FileText, Calendar, Box } from "lucide-react";

export default function CounterClient({ rfq, items, offer }: { rfq: any, items: any[], offer: any }) {
    const { showConfirm, showSuccess, showError, showWarning } = useModal();
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const formRef = useRef<HTMLFormElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formRef.current) return;

        const formData = new FormData(formRef.current);
        const tp = formData.get("totalPrice");
        if (!tp || Number(tp) <= 0) {
            showWarning("Uyarı", "Lütfen geçerli bir toplam teklif fiyatı giriniz.");
            return;
        }

        showConfirm(
            "Teklifi Gönder",
            "Bu teklifi alıcıya iletmek istediğinize emin misiniz? Gönderildikten sonra fiyat ve şartlar değiştirilemez.",
            () => {
                startTransition(async () => {
                    try {
                        await counterRfqAction(formData);
                        showSuccess("Başarılı", "Teklif başarıyla alıcı şirkete sunuldu.");
                        router.push("/seller/rfqs");
                    } catch (err: any) {
                        showError("Hata", err.message || "Teklif gönderilemedi.");
                    }
                });
            }
        );
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            
            <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
                <div className="p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Package className="w-5 h-5 text-indigo-500" />
                        Talep Edilen Kalemler
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Alıcının sizden fiyatlamasını istediği ağ ürünleri ve miktarları.</p>
                </div>

                <div className="p-6 space-y-4">
                    {items.map(item => (
                        <div key={item.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm border border-slate-200 dark:border-white/10 p-4 rounded-xl bg-slate-50 dark:bg-[#0f172a] shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center shrink-0">
                                    <Box className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="font-bold text-slate-900 dark:text-white block">{item.productName}</span>
                                    <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 block">Global Ağ Ürünü</span>
                                </div>
                            </div>
                            <div className="mt-3 sm:mt-0 text-left sm:text-right bg-white dark:bg-[#1e293b] px-4 py-2 rounded-lg border border-slate-200 dark:border-white/5">
                                <span className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest block mb-0.5">İstenen Miktar</span>
                                <span className="font-mono text-lg font-bold text-slate-800 dark:text-white">{item.quantity} Adet</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
                <div className="p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <FileText className="w-5 h-5 text-emerald-500" />
                        Sizin Karşı Teklifiniz
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Tüm kalemleri kapsayan toplam tutarı ve opsiyonel geçerlilik tarihini belirleyin.</p>
                </div>

                <div className="p-6">
                    {offer ? (
                        <div className="space-y-6">
                            <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-400 p-4 rounded-xl flex gap-3">
                                <CheckCircle2 className="w-6 h-6 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold text-sm mb-0.5">Teklif İletildi</p>
                                    <p className="text-xs opacity-90">Bu ihaleye daha önce yanıt verdiniz. Alıcının değerlendirmesi bekleniyor.</p>
                                </div>
                            </div>

                            <div className="bg-slate-50 dark:bg-[#0f172a] rounded-xl p-5 border border-slate-200 dark:border-white/10 space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-600 dark:text-slate-400 font-medium">Teklif Durumu:</span>
                                    <span className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest rounded border ${
                                        offer.status === 'ACCEPTED' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' :
                                        offer.status === 'REJECTED' ? 'bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20' :
                                        offer.status === 'COUNTERED' ? 'bg-indigo-100 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20' : 
                                        'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-white/10'
                                    }`}>
                                        {offer.status === 'COUNTERED' ? 'İLETİLDİ' : offer.status === 'ACCEPTED' ? 'KABUL EDİLDİ' : offer.status === 'REJECTED' ? 'REDDEDİLDİ' : offer.status}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm pt-4 border-t border-slate-200 dark:border-white/5">
                                    <span className="text-slate-600 dark:text-slate-400 font-medium">İletilen Toplam Tutar:</span>
                                    <span className="font-mono text-xl font-bold text-emerald-600 dark:text-emerald-400">
                                        {Number(offer.totalPrice).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                    </span>
                                </div>
                                {offer.expiresAt && (
                                    <div className="flex justify-between items-center text-sm pt-4 border-t border-slate-200 dark:border-white/5">
                                        <span className="text-slate-600 dark:text-slate-400 font-medium">Opsiyon Geçerlilik Tarihi:</span>
                                        <span className="font-bold text-slate-800 dark:text-slate-200">
                                            {new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(offer.expiresAt))}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                            <input type="hidden" name="rfqId" value={rfq.id} />

                            <div>
                                <label className="block text-sm font-bold text-slate-800 dark:text-white mb-2">Toplam İhale Paketi Fiyatı (TL)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 dark:text-slate-500">₺</span>
                                    <input
                                        type="number"
                                        name="totalPrice"
                                        step="0.01"
                                        min="1"
                                        required
                                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-white/10 rounded-xl text-lg font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                                        placeholder="0.00"
                                    />
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                                    Talep edilen tüm kalemleri kapsayan KDV hariç toplam satış fiyatını paket halinde giriniz.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-800 dark:text-white mb-2">Opsiyon Geçerlilik Tarihi (İsteğe Bağlı)</label>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                                    <input
                                        type="date"
                                        name="expiresAt"
                                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-white/10 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                                    />
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                                    Eğer bu fiyatın belirli bir günden sonra geçersiz olmasını istiyorsanız tarih seçiniz.
                                </p>
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 text-sm font-bold rounded-xl active:scale-95 transition-all shadow-sm disabled:opacity-50"
                                >
                                    <Send className="w-4 h-4" />
                                    {isPending ? "GÖNDERİLİYOR..." : "TEKLİFİ GÖNDER"}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
