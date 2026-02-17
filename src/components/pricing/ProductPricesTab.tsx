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
            <h3 className="text-lg font-bold">Fiyat Listeleri</h3>
            <div className="space-y-2">
                {prices.map(p => (
                    <div key={p.priceListId} className="flex items-center gap-4 p-3 border rounded-lg bg-white/5">
                        <div className="flex-1">
                            <div className="font-bold text-sm">{p.priceListName}</div>
                            {p.derivedFromListId && <div className="text-xs opacity-50">Formül ile üretildi</div>}
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex flex-col items-end">
                                <label className="text-[10px] opacity-70 mb-1">Fiyat ({p.currency})</label>
                                <Input
                                    type="number"
                                    className="w-32 h-8 text-right"
                                    defaultValue={p.price}
                                    onBlur={(e) => handleSave(p.priceListId, parseFloat(e.target.value), true)} // Auto save as override on change
                                />
                            </div>

                            <div className="flex flex-col items-center">
                                <label className="text-[10px] opacity-70 mb-1">Manuel</label>
                                <Checkbox
                                    checked={p.isManualOverride}
                                    onCheckedChange={(c) => handleSave(p.priceListId, p.price, !!c)}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="text-xs opacity-50 mt-2">
                * Fiyatı değiştirdiğinizde otomatik olarak "Manuel" işaretlenir ve formüllerden etkilenmez.
            </div>
        </div>
    );
}
