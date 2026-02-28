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
            <div className="bg-[#0a0a0b]/80 border border-white/5 rounded-3xl p-8 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                <h3 className="font-black mb-6 flex items-center gap-3 text-lg">
                    <span className="text-2xl text-primary">📄</span> BELGE ÖZETİ
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Customer Selection */}
                    <div className="form-control md:col-span-2">
                        <label className="label-text text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2 block">
                            Cari / Müşteri
                        </label>
                        <select
                            className="w-full bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 rounded-xl p-3.5 text-sm font-bold text-white focus:border-primary/50 focus:ring-2 focus:ring-primary/20 shadow-inner outline-none transition-all duration-300 cursor-pointer appearance-none"
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
                            <div className="mt-1 flex items-center gap-1.5">
                                <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/30 uppercase">
                                    {resolvedPriceList.name} LİSTESİ AKTİF
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Date */}
                    <div className="form-control">
                        <label className="label-text text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2 block">
                            Tarih
                        </label>
                        <input
                            type="date"
                            className="w-full bg-[#0a0a0b]/60 border border-white/10 rounded-xl p-3.5 text-sm font-bold text-white/80 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 shadow-inner outline-none transition-all duration-300"
                            value={formData.date}
                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                            required
                        />
                    </div>

                    {/* Valid Until */}
                    <div className="form-control">
                        <label className="label-text text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2 block">
                            Geçerlilik
                        </label>
                        <input
                            type="date"
                            className="w-full bg-[#0a0a0b]/60 border border-white/10 rounded-xl p-3.5 text-sm font-bold text-white/80 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 shadow-inner outline-none transition-all duration-300"
                            value={formData.validUntil}
                            onChange={e => setFormData({ ...formData, validUntil: e.target.value })}
                        />
                    </div>

                    {/* Status (only when editing) */}
                    {initialData && (
                        <div className="form-control md:col-span-2">
                            <label className="label-text text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2 block">
                                Teklif Durumu
                            </label>
                            <select
                                className="w-full bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 rounded-xl p-3.5 text-sm font-bold text-white focus:border-primary/50 focus:ring-2 focus:ring-primary/20 shadow-inner outline-none transition-all duration-300 cursor-pointer appearance-none"
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
                    <div className={`${initialData ? 'md:col-span-2' : 'md:col-span-4'} bg-primary/5 p-6 rounded-2xl border border-primary/20 shadow-inner flex flex-col justify-center`}>
                        <div className="grid grid-cols-3 gap-4 text-center items-center">
                            <div>
                                <div className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em] mb-2">Ara Toplam</div>
                                <div className="text-sm font-black tabular-nums">{totals.subTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} <span className="text-[10px] text-white/50">₺</span></div>
                            </div>
                            <div>
                                <div className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em] mb-2">KDV Tutarı</div>
                                <div className="text-sm font-black tabular-nums">{totals.taxAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} <span className="text-[10px] text-white/50">₺</span></div>
                            </div>
                            <div>
                                <div className="text-[10px] text-primary font-black uppercase tracking-[0.2em] mb-2">Genel Toplam</div>
                                <div className="text-2xl font-black text-primary tabular-nums">{totals.totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} <span className="text-sm text-primary/60">₺</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <div className="bg-[#0a0a0b]/80 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                <div className="p-6 bg-white/[0.02] border-b border-white/5 flex justify-between items-center">
                    <h3 className="font-black text-lg flex items-center gap-3">
                        <span className="text-primary text-2xl">📦</span> Hizmet ve Ürün Detayları
                    </h3>
                    <button type="button" onClick={addItem} className="bg-primary hover:bg-transparent hover:text-primary hover:border-primary border border-transparent text-white px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 shadow-lg shadow-primary/20 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)]">
                        + Kalem Ekle
                    </button>
                </div>

                <div className="overflow-x-auto min-h-[300px]">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[#0a0a0b]/80">
                            <tr>
                                <th className="p-5 w-12 text-center text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">#</th>
                                <th className="p-5 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Ürün / Hizmet Tanımı</th>
                                <th className="p-5 w-24 text-center text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Miktar</th>
                                <th className="p-5 w-36 text-right text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Birim Fiyat</th>
                                <th className="p-5 w-24 text-center text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">KDV %</th>
                                <th className="p-5 w-36 text-right text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Toplam</th>
                                <th className="p-5 w-12 text-center text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.02]">
                            {formData.items.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-12 text-center text-muted italic font-medium">
                                        Henüz bir kalem eklenmedi. Başlamak için butona tıklayın.
                                    </td>
                                </tr>
                            ) : (
                                formData.items.map((item, i) => (
                                    <tr key={i} className="hover:bg-white/[0.04] transition-colors duration-300 group">
                                        <td className="p-4 text-center font-mono text-xs opacity-40 tabular-nums">{i + 1}</td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-2">
                                                <select
                                                    className="w-full bg-white/[0.02] hover:bg-[#0a0a0b]/60 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all outline-none"
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
                                                    className="w-full bg-transparent border-b border-white/10 focus:border-primary/50 text-sm font-bold text-white px-2 py-1 outline-none transition-all placeholder-white/20"
                                                    value={item.name}
                                                    onChange={e => updateItem(i, 'name', e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <input
                                                type="number"
                                                className="w-full bg-white/[0.02] hover:bg-[#0a0a0b]/60 border border-white/10 rounded-xl px-0 text-center py-2 text-xs font-black text-white focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all outline-none tabular-nums"
                                                value={item.quantity}
                                                onChange={e => updateItem(i, 'quantity', e.target.value)}
                                                min="0.1"
                                                step="0.1"
                                                required
                                            />
                                        </td>
                                        <td className="p-4">
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    className="w-full bg-white/[0.02] hover:bg-[#0a0a0b]/60 border border-white/10 rounded-xl pl-3 pr-7 py-2 text-xs font-black text-white text-right focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all outline-none tabular-nums"
                                                    value={item.price}
                                                    onChange={e => updateItem(i, 'price', e.target.value)}
                                                    step="0.01"
                                                    required
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] uppercase font-black text-white/30 pointer-events-none">₺</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <select
                                                className="w-full bg-white/[0.02] hover:bg-[#0a0a0b]/60 border border-white/10 rounded-xl px-2 py-2 text-xs font-bold text-white text-center focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all outline-none appearance-none"
                                                value={item.taxRate}
                                                onChange={e => updateItem(i, 'taxRate', e.target.value)}
                                            >
                                                <option value="0">%0</option>
                                                <option value="1">%1</option>
                                                <option value="10">%10</option>
                                                <option value="20">%20</option>
                                            </select>
                                        </td>
                                        <td className="p-4 text-right font-black text-white tabular-nums">
                                            {(Number(item.quantity) * Number(item.price)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} <span className="text-[10px] text-white/40">₺</span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <button type="button" onClick={() => removeItem(i)} className="w-8 h-8 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 flex items-center justify-center transition-all duration-300 mx-auto" title="Kaldır">
                                                <span className="text-sm">🗑️</span>
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Notes - Takes 2 columns */}
                <div className="lg:col-span-2 bg-[#0a0a0b]/80 border border-white/5 rounded-3xl p-8 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                    <h3 className="font-black mb-4 flex items-center gap-3 text-lg">
                        <span className="text-2xl text-primary">📝</span> Teklif Notları
                    </h3>
                    <textarea
                        className="w-full bg-[#0a0a0b]/60 border border-white/10 rounded-xl p-4 text-sm font-bold text-white/90 placeholder-white/20 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 shadow-inner outline-none transition-all duration-300 min-h-[120px] resize-y"
                        placeholder="Müşteriye özel notlar, garanti şartları veya ödeme koşulları..."
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                </div>

                {/* Action Buttons - Takes 1 column */}
                <div className="bg-[#0a0a0b]/80 border border-white/5 rounded-3xl p-8 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col justify-center gap-4">
                    <button type="submit" className="w-full bg-primary hover:bg-transparent hover:text-primary hover:border-primary border border-transparent text-white py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all duration-300 shadow-lg shadow-primary/20 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] text-center">
                        {initialData ? 'DEĞİŞİKLİKLERİ KAYDET' : 'TEKLİFİ OLUŞTUR'}
                    </button>
                    <button type="button" onClick={onCancel} className="w-full bg-white/[0.02] hover:bg-red-500/10 border border-white/10 hover:border-red-500/20 text-white/50 hover:text-red-500 py-3.5 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all duration-300 text-center">
                        İptal Et
                    </button>
                </div>
            </div>
        </form>
    );
}
