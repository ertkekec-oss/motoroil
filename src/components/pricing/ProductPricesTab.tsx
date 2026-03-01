'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface ProductPricesTabProps {
    productId: string;
}

export function ProductPricesTab({ productId }: ProductPricesTabProps) {
    const [prices, setPrices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchPrices = async () => {
        setLoading(true);
        try {
            // Get all price lists
            const listRes = await fetch('/api/pricing/lists');
            const listData = await listRes.json();
            const allLists = listData.data || [];

            // Get product prices
            const priceRes = await fetch(`/api/pricing/products/${productId}/prices`);
            const priceData = await priceRes.json();
            const existingPrices = priceData.data || [];

            // Merge
            const merged = allLists.filter((l: any) => ['Perakende', 'Toptan'].includes(l.name)).map((l: any) => {
                const p = existingPrices.find((ep: any) => ep.priceListId === l.id);
                return {
                    priceListId: l.id,
                    priceListName: l.name,
                    currency: l.currency,
                    price: p ? p.price : 0,
                    isManualOverride: p ? p.isManualOverride : false,
                    derivedFromListId: p ? p.derivedFromListId : null
                };
            });
            setPrices(merged);
        } catch (error) {
            toast.error("Fiyatlar yüklenemedi.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (productId) fetchPrices();
    }, [productId]);

    const handleSave = async (priceListId: string, price: number, isManualOverride: boolean) => {
        setSaving(true);
        try {
            const res = await fetch(`/api/pricing/products/${productId}/prices`, {
                method: 'PUT',
                body: JSON.stringify({
                    priceListId,
                    price,
                    isManualOverride
                })
            });
            const d = await res.json();
            if (d.success) {
                toast.success("Fiyat güncellendi.");
                fetchPrices(); // Refresh to see updates (e.g. if formula affected others? No, formula is manual trigger usually)
            } else {
                toast.error(d.error);
            }
        } catch {
            toast.error("Hata.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-4 flex justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-4">
            <h3 className="text-[14px] font-semibold text-slate-800 dark:text-white pb-2 border-b border-slate-200 dark:border-white/10">Fiyat Listeleri</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {prices.map(p => (
                    <div key={p.priceListId} className="flex flex-col gap-4 p-5 border border-slate-200 dark:border-white/10 rounded-[16px] bg-slate-50 dark:bg-[#1e293b] shadow-sm">
                        <div className="flex justify-between items-start">
                            <div className="flex flex-col gap-1">
                                <span className="font-semibold text-[13px] text-slate-900 dark:text-white bg-white dark:bg-[#0f172a] px-3 py-1 rounded-[8px] border border-slate-200 dark:border-white/10 shadow-sm w-fit">{p.priceListName}</span>
                                {p.derivedFromListId && <span className="text-[11px] font-medium text-slate-500 mt-1 flex items-center gap-1">✨ Formül ile üretildi</span>}
                            </div>
                            <div className="flex items-center gap-2 bg-white dark:bg-[#0f172a] px-3 py-1.5 rounded-[10px] border border-slate-200 dark:border-white/10 shadow-sm">
                                <Checkbox
                                    checked={p.isManualOverride}
                                    onCheckedChange={(c) => handleSave(p.priceListId, p.price, !!c)}
                                    className="w-4 h-4 rounded border-slate-300 dark:border-white/20 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                />
                                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider cursor-pointer">Manuel Yönetim</label>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 pt-2 border-t border-slate-200 dark:border-white/10">
                            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Özel Fiyat Merkezi ({p.currency})</label>
                            <Input
                                type="number"
                                className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-[12px] p-4 text-[16px] font-bold text-slate-900 dark:text-white focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:border-blue-500 placeholder-slate-400 transition-colors shadow-inner"
                                defaultValue={p.price}
                                onBlur={(e) => handleSave(p.priceListId, parseFloat(e.target.value), true)} // Auto save as override on change
                            />
                        </div>
                    </div>
                ))}
            </div>
            <div className="text-[11px] font-medium text-slate-500 flex items-center gap-2 bg-slate-50 dark:bg-[#1e293b] p-3 rounded-[12px] border border-slate-200 dark:border-white/10">
                <span className="text-blue-500 text-[14px]">ℹ️</span>
                Fiyat değeri değiştirildiğinde otomatik olarak "Manuel Yönetim" aktif edilir ve hiyerarşik formüllerden etkilenmez.
            </div>
        </div>
    );
}
