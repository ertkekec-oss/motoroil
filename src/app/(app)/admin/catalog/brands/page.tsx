"use client";
import React, { useState, useEffect } from 'react';
import { EnterprisePageShell, EnterpriseCard } from "@/components/ui/enterprise";
import { List, CheckCircle, Tag } from "lucide-react";
import { useModal } from "@/contexts/ModalContext";

export default function BrandsPage() {
    const { showSuccess, showError } = useModal();
    const [brands, setBrands] = useState<{name: string, approved: boolean}[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/admin/catalog/brands")
            .then(r => r.json())
            .then(data => { setBrands(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    const toggleStatus = async (name: string, currentStatus: boolean) => {
        try {
            const res = await fetch("/api/admin/catalog/brands/toggle", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, approved: !currentStatus })
            });
            if (res.ok) {
                setBrands(brands.map(b => b.name === name ? {...b, approved: !currentStatus} : b));
                showSuccess("Başarılı", \`Marka durumu güncellendi: \${name}\`);
            } else {
                showError("Hata", "Marka güncellenemedi.");
            }
        } catch(e) {
            showError("Hata", "Sunucu bağlantı hatası.");
        }
    };

    if (loading) return <div className="p-8 font-bold text-slate-500">Yükleniyor...</div>;

    return (
        <EnterprisePageShell 
            title="Katalog Marka Yönetimi" 
            description="Tedarikçilerin ürün yüklerken kullandığı markaları onaylayın veya engelleyin."
        >
            <EnterpriseCard title="Veritabanındaki Markalar" icon={<List className="w-5 h-5"/>}>
                <div className="mt-4">
                    <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
                        <thead className="bg-[#F6F7F9] dark:bg-slate-800/80 text-slate-500 text-[10px] uppercase font-black tracking-widest border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="px-5 py-3.5">Marka Adı</th>
                                <th className="px-5 py-3.5 text-center">Durum</th>
                                <th className="px-5 py-3.5 text-center w-36">İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {brands.map((b,i) => (
                                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-white/5">
                                    <td className="px-5 py-4 font-bold flex items-center gap-2"><Tag className="w-4 h-4 text-slate-400"/> {b.name}</td>
                                    <td className="px-5 py-4 text-center">
                                        <span className={\`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded \${b.approved ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}\`}>
                                            {b.approved ? 'ONAYLI' : 'YASAKLI'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                        <button onClick={() => toggleStatus(b.name, b.approved)} className="px-3 py-1.5 text-xs font-bold bg-slate-900 text-white rounded-lg cursor-pointer">Durum Değiştir</button>
                                    </td>
                                </tr>
                            ))}
                            {brands.length === 0 && <tr><td colSpan={3} className="px-5 py-8 text-center text-slate-500 font-bold text-xs">Henüz marka verisi oluşturulmamış</td></tr>}
                        </tbody>
                    </table>
                </div>
            </EnterpriseCard>
        </EnterprisePageShell>
    );
}

