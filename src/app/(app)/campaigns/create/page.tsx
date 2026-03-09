"use client";

import { useState } from "react";
import { MoveLeft, Save, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CreateCampaign() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        campaignType: "PERCENT_DISCOUNT",
        channels: ["GLOBAL"],
        priority: 0,
        stackingRule: "STACKABLE",
        discountRate: "",
        minOrderAmount: "",
        minQuantity: "",
        validFrom: "",
        validUntil: "",
        description: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch("/api/campaigns", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.name,
                    campaignType: formData.campaignType,
                    type: "percent_discount", // fallback for legacy
                    channels: formData.channels,
                    priority: Number(formData.priority),
                    stackingRule: formData.stackingRule,
                    discountRate: Number(formData.discountRate),
                    minOrderAmount: formData.minOrderAmount ? Number(formData.minOrderAmount) : null,
                    minQuantity: formData.minQuantity ? Number(formData.minQuantity) : null,
                    validFrom: formData.validFrom ? new Date(formData.validFrom) : null,
                    validUntil: formData.validUntil ? new Date(formData.validUntil) : null,
                    description: formData.description,
                }),
            });

            if (res.ok) {
                router.push("/campaigns/active");
            } else {
                alert("Hata oluştu.");
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
                    <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} type="text" className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-900/50 outline-none focus:ring-2 focus:ring-indigo-500/50" placeholder="Örn: Hafta Sonu Fiyat Avantajı" />
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Kampanya Türü</label>
                    <select value={formData.campaignType} onChange={e => setFormData({ ...formData, campaignType: e.target.value })} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-900/50 outline-none focus:ring-2 focus:ring-indigo-500/50">
                        <option value="PERCENT_DISCOUNT">Yüzde İndirimi</option>
                        <option value="FIXED_DISCOUNT">Miktar İndirimi (Sepet)</option>
                        <option value="BUY_X_GET_Y">X Al Y Öde (Yakında)</option>
                        <option value="FREE_SHIPPING">Kargo Bedava (Yakında)</option>
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">İndirim Oranı / Tutarı</label>
                    <input required value={formData.discountRate} onChange={e => setFormData({ ...formData, discountRate: e.target.value })} type="number" step="0.01" className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-900/50 outline-none focus:ring-2 focus:ring-indigo-500/50" placeholder="10.00" />
                </div>

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
