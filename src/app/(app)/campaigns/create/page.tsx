"use client";

import { useState, useEffect } from "react";
import { MoveLeft, Save, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useModal } from "@/contexts/ModalContext";

export default function CreateCampaign() {
    const { showSuccess, showError, showWarning } = useModal();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [targetOptions, setTargetOptions] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        name: "",
        campaignType: "PERCENT_DISCOUNT",
        channels: ["GLOBAL"],
        priority: 0,
        stackingRule: "STACKABLE",
        discountRate: "",
        minOrderAmount: "",
        validFrom: "",
        validUntil: "",
        description: "",
        buyQuantity: 1,
        rewardQuantity: 1,
        targetType: 'ALL',
        targetValue: '',
    });

    useEffect(() => {
        if (formData.targetType !== "ALL" && formData.targetValue.length > 1) {
            const timer = setTimeout(async () => {
                try {
                    const res = await fetch(`/api/campaigns/targets?type=${formData.targetType}&q=${encodeURIComponent(formData.targetValue)}`);
                    if (res.ok) {
                        const data = await res.json();
                        setTargetOptions(data);
                    }
                } catch (e) {
                    console.error("Option load error", e);
                }
            }, 300);
            return () => clearTimeout(timer);
        } else {
            setTargetOptions([]);
        }
    }, [formData.targetValue, formData.targetType]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload: any = {
                name: formData.name,
                campaignType: formData.campaignType,
                type: formData.campaignType === "BUY_X_GET_Y" ? "buy_x_get_free" : (formData.campaignType === "LOYALTY_POINTS" ? "loyalty_points" : "percent_discount"),
                channels: formData.channels,
                priority: Number(formData.priority),
                stackingRule: formData.stackingRule,
                discountRate: formData.campaignType === "LOYALTY_POINTS" ? null : Number(formData.discountRate),
                pointsRate: formData.campaignType === "LOYALTY_POINTS" ? Number(formData.discountRate) / 100 : null,
                minOrderAmount: formData.minOrderAmount ? Number(formData.minOrderAmount) : null,
                validFrom: formData.validFrom ? new Date(formData.validFrom) : null,
                validUntil: formData.validUntil ? new Date(formData.validUntil) : null,
                description: formData.description,
            };

            if (formData.campaignType === "BUY_X_GET_Y") {
                payload.conditions = {
                    buyQuantity: Number(formData.buyQuantity),
                    rewardQuantity: Number(formData.rewardQuantity),
                    targetType: formData.targetType,
                    targetValue: formData.targetValue
                };
            }

            const res = await fetch("/api/campaigns", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                router.push("/campaigns/active");
            } else {
                showError("Uyarı", "Hata oluştu.");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden max-w-4xl mx-auto">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Link href="/campaigns" className="p-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition-colors">
                        <MoveLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                    </Link>
                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-white text-lg">Yeni Kampanya Kurgusu</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Campaign Engine V2 Formu</p>
                    </div>
                </div>
                <button disabled={loading} type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-5 rounded-xl transition shadow flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    {loading ? "Kaydediliyor" : "Kaydet ve Başlat"}
                </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-1 md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Kampanya Adı <span className="text-rose-500">*</span></label>
                    <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} list="target-options" type="text" className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-900/50 outline-none focus:ring-2 focus:ring-indigo-500/50" placeholder="Örn: Hafta Sonu Fiyat Avantajı" />
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Kampanya Türü</label>
                    <select value={formData.campaignType} onChange={e => setFormData({ ...formData, campaignType: e.target.value })} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-900/50 outline-none focus:ring-2 focus:ring-indigo-500/50">
                        <option value="PERCENT_DISCOUNT">Yüzde İndirimi</option>
                        <option value="FIXED_DISCOUNT">Miktar İndirimi (Sepet)</option>
                        <option value="BUY_X_GET_Y">X Al Y Öde</option>
                        <option value="LOYALTY_POINTS">Puan Biriktir (Parapuan)</option>
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                        {formData.campaignType === "LOYALTY_POINTS" ? "Kazanım Oranı (%)" : "İndirim Oranı / Tutarı"}
                    </label>
                    <input required={formData.campaignType !== "BUY_X_GET_Y"} disabled={formData.campaignType === "BUY_X_GET_Y"} value={formData.discountRate} onChange={e => setFormData({ ...formData, discountRate: e.target.value })} type="number" step="0.01" className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-900/50 outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50" placeholder="10.00" />
                </div>

                {formData.campaignType === "BUY_X_GET_Y" && (
                    <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-800 flex-wrap">
                        <div className="md:col-span-2 mb-1">
                            <h4 className="text-[14px] font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
                                Kurgu Hedefleme Seçenekleri
                            </h4>
                            <p className="text-[13px] text-indigo-600 dark:text-indigo-400 mt-1">Bu promosyon hangi ürün, marka veya kategori satın alındığında aktif olacak belirleyin.</p>
                        </div>
                        
                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">Hedef Tipi</label>
                            <select value={formData.targetType} onChange={e => setFormData({ ...formData, targetType: e.target.value })} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/50 text-[14px] font-semibold text-slate-700 dark:text-slate-300">
                                <option value="ALL">Tüm Sepet Geneli (Herhangi Ürünler)</option>
                                <option value="BRAND">Belirli Marka (Brand)</option>
                                <option value="CATEGORY">Belirli Kategori (Category)</option>
                                <option value="PRODUCT">Sabit Spesifik Ürün (Product)</option>
                            </select>
                        </div>

                        {formData.targetType !== "ALL" ? (
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">
                                    Hedef Adı / Kodu <span className="text-rose-500">*</span>
                                </label>
                                <input list="target-options" required value={formData.targetValue} onChange={e => setFormData({ ...formData, targetValue: e.target.value })} type="text" className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/50 text-[14px] font-medium" placeholder={`Örn: ${formData.targetType === 'PRODUCT' ? 'Motul 5W30 4L' : formData.targetType === 'CATEGORY' ? 'Motor Yağı' : 'Castrol'}`} />
                                <datalist id="target-options">
                                    {targetOptions.map((opt, i) => (
                                        <option key={i} value={opt.value}>{opt.label}</option>
                                    ))}
                                </datalist>
                                <datalist id="target-options">
                                    {targetOptions.map((opt, i) => (
                                        <option key={i} value={opt.value}>{opt.label}</option>
                                    ))}
                                </datalist>
                            </div>
                        ) : (
                             <div></div>
                        )}

                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">Alış Şartı Adedi (Satın Aldığında)</label>
                            <div className="relative">
                                <input required value={formData.buyQuantity} onChange={e => setFormData({ ...formData, buyQuantity: Number(e.target.value) })} type="number" className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/50 text-[15px] font-bold pl-12" placeholder="2" />
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">Al: </span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">Promosyon Adedi (Bedelsiz Verilecek)</label>
                            <div className="relative">
                                <input required value={formData.rewardQuantity} onChange={e => setFormData({ ...formData, rewardQuantity: Number(e.target.value) })} type="number" className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/50 text-[15px] font-bold pl-16 text-emerald-600" placeholder="1" />
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 font-semibold">Bedava: </span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="col-span-1 md:col-span-2 border-t pt-6 mt-2 border-slate-100 dark:border-slate-800">
                    <h4 className="font-bold text-slate-800 dark:text-white mb-4">Görünürlük ve Stack Kuralları</h4>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Kanal</label>
                    <select
                        value={formData.channels[0]}
                        onChange={e => setFormData({ ...formData, channels: [e.target.value] })}
                        className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-900/50 outline-none focus:ring-2 focus:ring-indigo-500/50"
                    >
                        <option value="GLOBAL">Global (Tüm Kanallar)</option>
                        <option value="POS">POS Terminal (Saha)</option>
                        <option value="HUB">Periodya Hub (B2B)</option>
                        <option value="SALES_REP">Saha Satış Temsilcisi</option>
                        <option value="B2B">Bayi Ağı Siparişleri</option>
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Stack Kuralı</label>
                    <select value={formData.stackingRule} onChange={e => setFormData({ ...formData, stackingRule: e.target.value })} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-900/50 outline-none focus:ring-2 focus:ring-indigo-500/50">
                        <option value="STACKABLE">Üst Üste Eklenebilir (Stackable)</option>
                        <option value="EXCLUSIVE">Özel (Başka kampanya ile birleşmez)</option>
                        <option value="PRIORITY_ONLY">Yüksek Öncelikli (Diğerlerini ezer)</option>
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Öncelik (Priority)</label>
                    <input value={formData.priority} onChange={e => setFormData({ ...formData, priority: Number(e.target.value) })} type="number" className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-900/50 outline-none focus:ring-2 focus:ring-indigo-500/50" placeholder="0 (Yüksek sayı = yüksek öncelik)" />
                    <p className="text-[10px] text-slate-400 mt-1">Örn: 10 olan, 5 olandan önce hesaplanır.</p>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Minimum Sipariş Tutarı</label>
                    <input value={formData.minOrderAmount} onChange={e => setFormData({ ...formData, minOrderAmount: e.target.value })} type="number" className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-900/50 outline-none focus:ring-2 focus:ring-indigo-500/50" placeholder="Opsiyonel" />
                </div>

            </div>
        </form>
    );
}
