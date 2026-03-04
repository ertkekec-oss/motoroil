"use client";

import React, { useState, useEffect } from "react";
import { EnterprisePageShell } from "@/components/ui/enterprise";
import { Check, X, Loader2, Save, Users, Store } from "lucide-react";
import { useModal } from "@/contexts/ModalContext";

export default function DealerCatalogPage() {
    const { showSuccess, showError } = useModal();
    const [q, setQ] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [products, setProducts] = useState<any[]>([]);

    const fetchCatalog = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/dealer-network/catalog?q=${encodeURIComponent(q)}`);
            const data = await res.json();
            if (data.ok) {
                setProducts(data.items);
            } else {
                showError("Katalog", "Katalog listesi alınamadı: " + (data.error || "Bilinmeyen hata"));
            }
        } catch (e: any) {
            showError("Hata", "Ağ hatası: " + e.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        const timer = setTimeout(() => fetchCatalog(), 300);
        return () => clearTimeout(timer);
    }, [q]);

    const handleUpdateField = (id: string, field: string, val: any) => {
        setProducts(prev => prev.map(p => {
            if (p.id === id) {
                return { ...p, [field]: val };
            }
            return p;
        }));
    }

    const saveChanges = async () => {
        setSaving(true);
        try {
            // we send all currently fetched modifications or map them.
            // for safety let's send what we have as simple upsert
            const updates = products.map(p => ({
                productId: p.id,
                isVisible: p.isVisible,
                dealersPrice: p.dealersPrice,
                minOrderQty: p.minOrderQty,
                maxOrderQty: p.maxOrderQty
            }));

            const res = await fetch("/api/dealer-network/catalog", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ items: updates })
            });
            const data = await res.json();
            if (data.ok || data.id) {
                showSuccess("Başarılı", "B2B Katalog güncellendi");
                // refresh
                fetchCatalog();
            } else {
                showError("Hata", "Güncelleme başarısız: " + data.error);
            }
        } catch (e: any) {
            showError("Hata", "Ağ hatası: " + e.message);
        } finally {
            setSaving(false);
        }
    }

    const setAllVisible = (visible: boolean) => {
        setProducts(prev => prev.map(p => ({ ...p, isVisible: visible })));
    }

    return (
        <EnterprisePageShell
            title="B2B Katalog Yönetimi"
            description="Ürünlerinizi bayi portalına (B2B) açın, toplu fiyat ve miktar kurallarını belirleyin."
        >
            <div className="bg-white rounded-xl border-slate-200 border p-6 space-y-4">
                <div className="flex gap-4 items-center justify-between">
                    <div className="flex-1 max-w-sm">
                        <input
                            type="text"
                            placeholder="Ürün adı veya kodu..."
                            className="w-full h-10 px-4 border rounded-md text-sm outline-none focus:border-blue-500"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setAllVisible(true)} className="px-4 py-2 border rounded-md text-sm font-semibold hover:bg-slate-50 text-slate-700">Tümünü Aç</button>
                        <button onClick={() => setAllVisible(false)} className="px-4 py-2 border rounded-md text-sm font-semibold hover:bg-slate-50 text-slate-700">Tümünü Kapat</button>
                        <button
                            disabled={saving}
                            onClick={saveChanges}
                            className="px-4 py-2 bg-slate-900 text-white rounded-md text-sm font-semibold hover:bg-slate-800 flex gap-2 items-center"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Değişiklikleri Kaydet
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto relative mt-4 border border-slate-200 rounded-lg">
                    {loading ? (
                        <div className="p-8 text-center text-slate-500">Yükleniyor...</div>
                    ) : products.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">Ürün bulunamadı</div>
                    ) : (
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-medium text-xs">
                                <tr>
                                    <th className="p-4">Kod</th>
                                    <th className="p-4">Ürün Adı</th>
                                    <th className="p-4">B2B Görünürlük</th>
                                    <th className="p-4">B2B Fiyatı (Opsiyonel)</th>
                                    <th className="p-4 w-24">Min (adet)</th>
                                    <th className="p-4 w-24">Max (adet)</th>
                                    <th className="p-4">Stok</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {products.map((p) => (
                                    <tr key={p.id} className="hover:bg-slate-50/50">
                                        <td className="p-4 font-mono text-slate-500">{p.sku}</td>
                                        <td className="p-4 font-semibold text-slate-900">{p.name}</td>
                                        <td className="p-4">
                                            <button
                                                onClick={() => handleUpdateField(p.id, "isVisible", !p.isVisible)}
                                                className={`w-12 h-6 rounded-full relative transition-colors ${p.isVisible ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                            >
                                                <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${p.isVisible ? 'translate-x-6' : 'translate-x-0'}`}></span>
                                            </button>
                                        </td>
                                        <td className="p-4">
                                            <input
                                                type="number"
                                                className="w-32 border rounded-md p-2 outline-none text-right"
                                                placeholder={`Baz: ${p.basePrice}`}
                                                value={p.dealersPrice || ""}
                                                onChange={(e) => handleUpdateField(p.id, "dealersPrice", e.target.value ? Number(e.target.value) : null)}
                                            />
                                        </td>
                                        <td className="p-4">
                                            <input
                                                type="number"
                                                className="w-16 border rounded-md p-2 outline-none text-center"
                                                value={p.minOrderQty}
                                                onChange={(e) => handleUpdateField(p.id, "minOrderQty", parseInt(e.target.value) || 1)}
                                            />
                                        </td>
                                        <td className="p-4">
                                            <input
                                                type="number"
                                                className="w-16 border rounded-md p-2 outline-none text-center"
                                                placeholder="Sınır Yok"
                                                value={p.maxOrderQty || ""}
                                                onChange={(e) => handleUpdateField(p.id, "maxOrderQty", parseInt(e.target.value) || null)}
                                            />
                                        </td>
                                        <td className="p-4 text-slate-500">
                                            {p.stock}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </EnterprisePageShell>
    );
}
