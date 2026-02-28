import { useState, useEffect, useMemo } from 'react';
import { useCRM } from '@/contexts/CRMContext';
import { useInventory } from '@/contexts/InventoryContext';

export default function QuoteForm({ initialData, onSave, onCancel }: any) {
    const { customers } = useCRM();
    const { products } = useInventory();

    const [formData, setFormData] = useState({
        customerId: '',
        date: new Date().toISOString().split('T')[0],
        validUntil: '',
        description: '',
        items: [] as any[],
        status: 'Draft'
    });
    const [resolvedPriceList, setResolvedPriceList] = useState<any>(null);
    const [loadingPrice, setLoadingPrice] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData({
                customerId: initialData.customerId || '',
                date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                validUntil: initialData.validUntil ? new Date(initialData.validUntil).toISOString().split('T')[0] : '',
                description: initialData.description || '',
                items: Array.isArray(initialData.items) ? initialData.items : [],
                status: initialData.status || 'Draft'
            });
        }
    }, [initialData]);

    // Resolve Price List when customer changes
    useEffect(() => {
        const resolve = async () => {
            if (!formData.customerId) {
                setResolvedPriceList(null);
                return;
            }
            try {
                const res = await fetch('/api/pricing/resolve-customer', {
                    method: 'POST',
                    body: JSON.stringify({ customerId: formData.customerId })
                });
                const d = await res.json();
                if (d.success) {
                    setResolvedPriceList(d.priceList);
                }
            } catch (error) {
                console.error("Price list resolution failed", error);
            }
        };
        resolve();
    }, [formData.customerId]);

    const addItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { productId: '', name: '', quantity: 1, price: 0, taxRate: 20 }]
        }));
    };

    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...formData.items];
        newItems[index] = { ...newItems[index], [field]: value };

        if (field === 'productId' && value) {
            const product = products.find((p: any) => p.id === value || String(p.id) === String(value));
            if (product) {
                newItems[index].name = product.name;
                newItems[index].price = product.price; // Default fallback
                newItems[index].taxRate = product.salesVat || 20;

                // If we have a resolved price list and it's not the default retail,
                // we should check for a specific price
                if (resolvedPriceList) {
                    setLoadingPrice(true);
                    fetch(`/api/pricing/products/${value}/prices`)
                        .then(res => res.json())
                        .then(d => {
                            if (d.success && Array.isArray(d.data)) {
                                const specific = d.data.find((p: any) => p.priceListId === resolvedPriceList.id);
                                if (specific && Number(specific.price) > 0) {
                                    newItems[index].price = Number(specific.price);
                                    setFormData(prev => ({ ...prev, items: [...newItems] }));
                                }
                            }
                        })
                        .finally(() => setLoadingPrice(false));
                }
            }
        }

        setFormData({ ...formData, items: newItems });
    };

    const removeItem = (index: number) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const totals = useMemo(() => {
        let subTotal = 0;
        let taxAmount = 0;

        formData.items.forEach(item => {
            const qty = Number(item.quantity) || 0;
            const prc = Number(item.price) || 0;
            const tax = Number(item.taxRate) || 0;

            const lineTotal = qty * prc;
            const lineTax = lineTotal * (tax / 100);

            subTotal += lineTotal;
            taxAmount += lineTax;
        });

        return { subTotal, taxAmount, totalAmount: subTotal + taxAmount };
    }, [formData.items]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            ...formData,
            ...totals
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Top Section: Document Info - Horizontal Layout */}
            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
                <h3 className="font-semibold mb-6 flex items-center gap-2 text-[15px] text-slate-900 dark:text-white">
                    BELGE ÖZETİ
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Customer Selection */}
                    <div className="form-control md:col-span-2">
                        <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">
                            Cari / Müşteri
                        </label>
                        <select
                            className="w-full h-[40px] bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-[10px] px-3 text-[13px] text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-colors appearance-none"
                            value={formData.customerId}
                            onChange={e => setFormData({ ...formData, customerId: e.target.value })}
                            required
                        >
                            <option value="">Bir müşteri seçin...</option>
                            {customers.map((c: any) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        {resolvedPriceList && (
                            <div className="mt-2 flex items-center gap-1.5">
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 uppercase">
                                    {resolvedPriceList.name} LİSTESİ AKTİF
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Date */}
                    <div className="form-control">
                        <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">
                            Tarih
                        </label>
                        <input
                            type="date"
                            className="w-full h-[40px] bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-[10px] px-3 text-[13px] text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-colors"
                            value={formData.date}
                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                            required
                        />
                    </div>

                    {/* Valid Until */}
                    <div className="form-control">
                        <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">
                            Geçerlilik
                        </label>
                        <input
                            type="date"
                            className="w-full h-[40px] bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-[10px] px-3 text-[13px] text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-colors"
                            value={formData.validUntil}
                            onChange={e => setFormData({ ...formData, validUntil: e.target.value })}
                        />
                    </div>

                    {/* Status (only when editing) */}
                    {initialData && (
                        <div className="form-control md:col-span-2">
                            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">
                                Teklif Durumu
                            </label>
                            <select
                                className="w-full h-[40px] bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-[10px] px-3 text-[13px] text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-colors appearance-none"
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value })}
                            >
                                <option value="Draft">Taslak</option>
                                <option value="Sent">Gönderildi</option>
                                <option value="Accepted">Onaylandı</option>
                                <option value="Rejected">Reddedildi</option>
                                <option value="Converted">Faturalandı</option>
                            </select>
                        </div>
                    )}

                    {/* Totals Summary */}
                    <div className={`${initialData ? 'md:col-span-2' : 'md:col-span-4'} bg-slate-50 dark:bg-white/5 py-3 px-6 rounded-xl border border-slate-200 dark:border-white/10 flex flex-col justify-center`}>
                        <div className="flex items-center justify-between text-right gap-6">
                            <div className="flex-1 flex flex-col items-end">
                                <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mb-1">Ara Toplam</span>
                                <span className="text-[14px] font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                                    {totals.subTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                </span>
                            </div>
                            <div className="w-px h-8 bg-slate-200 dark:bg-white/10"></div>
                            <div className="flex-1 flex flex-col items-end">
                                <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mb-1">KDV Tutarı</span>
                                <span className="text-[14px] font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                                    {totals.taxAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                </span>
                            </div>
                            <div className="w-px h-8 bg-slate-200 dark:bg-white/10"></div>
                            <div className="flex-1 flex flex-col items-end">
                                <span className="text-[11px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider mb-1">Genel Toplam</span>
                                <span className="text-[20px] font-bold text-slate-900 dark:text-white tabular-nums">
                                    {totals.totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-[16px] overflow-hidden shadow-sm">
                <div className="p-4 sm:p-6 bg-slate-50 dark:bg-[#1e293b] border-b border-slate-200 dark:border-white/10 flex justify-between items-center">
                    <h3 className="font-semibold text-[15px] text-slate-900 dark:text-white flex items-center gap-2">
                        Hizmet ve Ürün Detayları
                    </h3>
                    <button type="button" onClick={addItem} className="h-9 px-4 flex items-center justify-center gap-2 border border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl text-[12px] font-medium transition-colors">
                        <span className="text-[14px]">+</span> Kalem Ekle
                    </button>
                </div>

                <div className="overflow-x-auto min-h-[300px]">
                    <table className="w-full text-left text-[13px]">
                        <thead className="bg-slate-50/50 dark:bg-[#0f172a] border-b border-slate-200 dark:border-white/10">
                            <tr>
                                <th className="p-4 w-12 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider">#</th>
                                <th className="p-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Ürün / Hizmet Tanımı</th>
                                <th className="p-4 w-28 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Miktar</th>
                                <th className="p-4 w-36 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Birim Fiyat</th>
                                <th className="p-4 w-24 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider">KDV %</th>
                                <th className="p-4 w-36 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Toplam</th>
                                <th className="p-4 w-12 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider">İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {formData.items.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-12 text-center text-slate-400 italic font-medium">
                                        Henüz bir kalem eklenmedi. Başlamak için butona tıklayın.
                                    </td>
                                </tr>
                            ) : (
                                formData.items.map((item, i) => (
                                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors duration-200 group min-h-[52px]">
                                        <td className="p-3 text-center font-mono text-xs text-slate-400">{i + 1}</td>
                                        <td className="p-3">
                                            <div className="flex flex-col gap-2">
                                                <select
                                                    className="w-full bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1.5 text-[12px] text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-colors appearance-none"
                                                    value={item.productId}
                                                    onChange={e => updateItem(i, 'productId', e.target.value)}
                                                >
                                                    <option value="">Envanterden Seç (Opsiyonel)</option>
                                                    {products.map((p: any) => (
                                                        <option key={p.id} value={p.id}>{p.name} ({p.brand})</option>
                                                    ))}
                                                </select>
                                                <input
                                                    type="text"
                                                    placeholder="Örn: Motor Yağı Değişimi veya Ürün Adı"
                                                    className="w-full bg-transparent border-b border-slate-200 dark:border-white/10 focus:border-blue-500 text-[13px] font-medium text-slate-900 dark:text-white px-2 py-1 outline-none transition-colors placeholder-slate-400"
                                                    value={item.name}
                                                    onChange={e => updateItem(i, 'name', e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <input
                                                type="number"
                                                className="w-full bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-lg px-0 text-center py-1.5 text-[13px] font-medium text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-colors tabular-nums"
                                                value={item.quantity}
                                                onChange={e => updateItem(i, 'quantity', e.target.value)}
                                                min="0.1"
                                                step="0.1"
                                                required
                                            />
                                        </td>
                                        <td className="p-3">
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    className="w-full bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-lg pl-2 pr-6 py-1.5 text-[13px] font-medium text-slate-900 dark:text-white text-right focus:border-blue-500 outline-none transition-colors tabular-nums"
                                                    value={item.price}
                                                    onChange={e => updateItem(i, 'price', e.target.value)}
                                                    step="0.01"
                                                    required
                                                />
                                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-medium text-slate-400 pointer-events-none">₺</span>
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <select
                                                className="w-full bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1.5 text-[13px] font-medium text-slate-900 dark:text-white text-center focus:border-blue-500 outline-none transition-colors appearance-none"
                                                value={item.taxRate}
                                                onChange={e => updateItem(i, 'taxRate', e.target.value)}
                                            >
                                                <option value="0">%0</option>
                                                <option value="1">%1</option>
                                                <option value="10">%10</option>
                                                <option value="20">%20</option>
                                            </select>
                                        </td>
                                        <td className="p-3 text-right font-semibold text-slate-900 dark:text-white tabular-nums">
                                            {(Number(item.quantity) * Number(item.price)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} <span className="text-[11px] text-slate-500 font-medium">₺</span>
                                        </td>
                                        <td className="p-3 text-center">
                                            <button type="button" onClick={() => removeItem(i)} className="w-8 h-8 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center justify-center transition-colors mx-auto" title="Kaldır">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Notes and Actions */}
            <div className="flex flex-col gap-6 w-full">
                {/* Notes Block */}
                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-[14px] p-5 shadow-sm">
                    <h3 className="font-semibold mb-3 text-[14px] text-slate-900 dark:text-white">
                        Teklif Notları
                    </h3>
                    <textarea
                        className="w-full bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-[10px] p-3 text-[13px] text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-500 outline-none transition-colors min-h-[120px] resize-y"
                        placeholder="Müşteriye özel notlar, garanti şartları veya ödeme koşulları..."
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                </div>

                {/* Sticky Action Footer */}
                <div className="sticky bottom-0 z-10 bg-white/90 dark:bg-[#0a0a0b]/90 backdrop-blur-md border-t border-slate-200 dark:border-white/10 py-4 -mx-4 sm:mx-0 sm:px-0 flex justify-end gap-3 px-4">
                    <button type="button" onClick={onCancel} className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 px-6 h-[42px] rounded-[12px] text-[13px] font-medium transition-colors">
                        İptal Et
                    </button>
                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-8 h-[42px] rounded-[12px] text-[13px] font-semibold transition-colors shadow-sm">
                        {initialData ? 'Değişiklikleri Kaydet' : 'Teklifi Oluştur'}
                    </button>
                </div>
            </div>
        </form>
    );
}
