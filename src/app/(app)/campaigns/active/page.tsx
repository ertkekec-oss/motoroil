"use client";

import { useState, useEffect } from "react";
import { useModal } from "@/contexts/ModalContext";
import { Gift, Edit, Trash2 } from "lucide-react";
import Link from "next/link";

export default function ActiveCampaigns() {
    const { showConfirm, showError, showSuccess } = useModal();
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadCampaigns = async () => {
        try {
            const res = await fetch('/api/campaigns');
            const data = await res.json();
            if (Array.isArray(data)) {
                // Filter active campaigns only
                setCampaigns(data.filter(c => c.status === 'ACTIVE' || c.isActive));
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCampaigns();
    }, []);

    const handleDelete = (id: string) => {
        showConfirm(
            "Kampanyayı Pasife Al",
            "Kampanyayı pasife almak istediğinize emin misiniz?",
            async () => {
                try {
                    const res = await fetch(`/api/campaigns?id=${id}`, { method: 'DELETE' });
                    if (res.ok) {
                        showSuccess("Başarılı", "Kampanya pasife alındı.");
                        loadCampaigns();
                    } else {
                        showError("Hata", "Kampanya pasife alınırken bir hata oluştu.");
                    }
                } catch (error) {
                    showError("Hata", "İşlem sırasında sunucu hatası oluştu.");
                }
            }
        );
    };

    if (loading) return <div className="text-sm text-slate-500">Yükleniyor...</div>;

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Yayında Olan Kampanyalar
                </h3>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-500 dark:text-slate-400">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase font-semibold text-slate-600 dark:text-slate-300">
                        <tr>
                            <th className="px-6 py-4 rounded-tl-xl">Kampanya</th>
                            <th className="px-6 py-4">Kanallar</th>
                            <th className="px-6 py-4">Kural</th>
                            <th className="px-6 py-4">İndirim / Değer</th>
                            <th className="px-6 py-4">Geçerlilik</th>
                            <th className="px-6 py-4 text-right rounded-tr-xl">İşlem</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                        {campaigns.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                                    Aktif kampanya bulunmuyor.
                                </td>
                            </tr>
                        ) : (
                            campaigns.map((c) => (
                                <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition duration-150">
                                    <td className="px-6 py-4 font-medium text-slate-800 dark:text-white">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                                                <Gift className="w-4 h-4 text-indigo-500" />
                                            </div>
                                            <div>
                                                <div>{c.name}</div>
                                                <div className="text-[11px] font-normal text-slate-400 mt-0.5">{c.campaignType || c.type}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-1 flex-wrap">
                                            {c.channels && c.channels.length > 0 ? c.channels.map((ch: string) => (
                                                <span key={ch} className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-md text-[10px] font-semibold tracking-wide">
                                                    {ch}
                                                </span>
                                            )) : (
                                                <span className="px-2 py-1 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 rounded-md text-[10px] font-semibold tracking-wide">
                                                    GLOBAL
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-md text-[10px] font-semibold tracking-wide ${c.stackingRule === 'EXCLUSIVE' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'}`}>
                                            {c.stackingRule || 'STACKABLE'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-medium">
                                        {c.discountRate ? `%${c.discountRate} İndirim` : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-xs">
                                        {c.validUntil ? new Date(c.validUntil).toLocaleDateString('tr-TR') : 'Süresiz'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link href={`/campaigns/edit/${c.id}`} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                                <Edit className="w-4 h-4" />
                                            </Link>
                                            <button onClick={() => handleDelete(c.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
