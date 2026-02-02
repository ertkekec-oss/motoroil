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
                newItems[index].price = product.price;
                newItems[index].taxRate = product.salesVat || 20;
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
            <div className="card glass-plus p-6 border border-white/10 shadow-xl">
                <h3 className="font-black mb-4 text-lg tracking-tight">📄 BELGE ÖZETİ</h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Customer Selection */}
                    <div className="form-control md:col-span-2">
                        <label className="label-text text-[10px] font-bold text-muted uppercase tracking-widest mb-2">
                            Cari / Müşteri
                        </label>
                        <select
                            className="select select-bordered select-sm w-full bg-black/40 border-white/20"
                            value={formData.customerId}
                            onChange={e => setFormData({ ...formData, customerId: e.target.value })}
                            required
                        >
                            <option value="">Bir müşteri seçin...</option>
                            {customers.map((c: any) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Date */}
                    <div className="form-control">
                        <label className="label-text text-[10px] font-bold text-muted uppercase tracking-widest mb-2">
                            Tarih
                        </label>
                        <input
                            type="date"
                            className="input input-bordered input-sm bg-black/40 border-white/20"
                            value={formData.date}
                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                            required
                        />
                    </div>

                    {/* Valid Until */}
                    <div className="form-control">
                        <label className="label-text text-[10px] font-bold text-muted uppercase tracking-widest mb-2">
                            Geçerlilik
                        </label>
                        <input
                            type="date"
                            className="input input-bordered input-sm bg-black/40 border-white/20"
                            value={formData.validUntil}
                            onChange={e => setFormData({ ...formData, validUntil: e.target.value })}
                        />
                    </div>

                    {/* Status (only when editing) */}
                    {initialData && (
                        <div className="form-control md:col-span-2">
                            <label className="label-text text-[10px] font-bold text-muted uppercase tracking-widest mb-2">
                                Teklif Durumu
                            </label>
                            <select
                                className="select select-bordered select-sm w-full bg-black/40 border-white/20 font-bold"
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
                    <div className={`${initialData ? 'md:col-span-2' : 'md:col-span-4'} bg-primary/5 p-4 rounded-lg border border-primary/20`}>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <div className="text-[9px] text-muted font-bold uppercase tracking-widest mb-1">Ara Toplam</div>
                                <div className="text-sm font-bold">{totals.subTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</div>
                            </div>
                            <div>
                                <div className="text-[9px] text-muted font-bold uppercase tracking-widest mb-1">KDV</div>
                                <div className="text-sm font-bold">{totals.taxAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</div>
                            </div>
                            <div>
                                <div className="text-[9px] text-primary font-bold uppercase tracking-widest mb-1">Genel Toplam</div>
                                <div className="text-lg font-black text-primary">{totals.totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <div className="card glass-plus p-0 overflow-hidden border border-white/10 shadow-xl">
                <div className="p-4 bg-white/5 border-b border-white/5 flex justify-between items-center">
                    <h3 className="font-black text-lg flex items-center gap-2">
                        <span className="text-primary">📦</span> Hizmet ve Ürün Detayları
                    </h3>
                    <button type="button" onClick={addItem} className="btn btn-sm btn-primary">+ Kalem Ekle</button>
                </div>

                <div className="overflow-x-auto min-h-[300px]">
                    <table className="w-full text-left text-sm">
                        <thead className="text-[10px] uppercase font-bold text-muted bg-black/20">
                            <tr>
                                <th className="p-4 w-12 text-center">#</th>
                                <th className="p-4">Ürün / Hizmet Tanımı</th>
                                <th className="p-4 w-20 text-center">Miktar</th>
                                <th className="p-4 w-32 text-right">Birim Fiyat</th>
                                <th className="p-4 w-20 text-center">KDV %</th>
                                <th className="p-4 w-32 text-right">Toplam</th>
                                <th className="p-4 w-12"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {formData.items.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-12 text-center text-muted italic font-medium">
                                        Henüz bir kalem eklenmedi. Başlamak için butona tıklayın.
                                    </td>
                                </tr>
                            ) : (
                                formData.items.map((item, i) => (
                                    <tr key={i} className="hover:bg-white/5 transition-colors group">
                                        <td className="p-4 text-center font-mono text-xs opacity-40">{i + 1}</td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1.5">
                                                <select
                                                    className="select select-bordered select-sm w-full bg-black/40 text-xs border-white/5"
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
                                                    className="input input-ghost input-sm w-full bg-transparent border-b border-white/5 rounded-none px-0 h-6 text-sm"
                                                    value={item.name}
                                                    onChange={e => updateItem(i, 'name', e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <input
                                                type="number"
                                                className="input input-bordered input-sm w-full text-center bg-black/40 border-white/5"
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
                                                    className="input input-bordered input-sm w-full text-right bg-black/40 border-white/5 pr-4"
                                                    value={item.price}
                                                    onChange={e => updateItem(i, 'price', e.target.value)}
                                                    step="0.01"
                                                    required
                                                />
                                                <span className="absolute right-1 top-1.5 text-[10px] opacity-30">₺</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <select
                                                className="select select-bordered select-sm w-full text-xs bg-black/40 border-white/5"
                                                value={item.taxRate}
                                                onChange={e => updateItem(i, 'taxRate', e.target.value)}
                                            >
                                                <option value="0">0%</option>
                                                <option value="1">1%</option>
                                                <option value="10">10%</option>
                                                <option value="20">20%</option>
                                            </select>
                                        </td>
                                        <td className="p-4 text-right font-mono font-bold text-white">
                                            {(Number(item.quantity) * Number(item.price)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="p-4 text-right">
                                            <button type="button" onClick={() => removeItem(i)} className="btn btn-square btn-ghost btn-xs text-red-500 hover:bg-red-500/10">✕</button>
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
                <div className="lg:col-span-2 card glass-plus p-6 border border-white/10 shadow-xl">
                    <h3 className="font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-widest text-muted">
                        📝 Teklif Notları ve Açıklamalar
                    </h3>
                    <textarea
                        className="textarea textarea-bordered w-full h-32 bg-black/40 border-white/20 focus:border-primary transition-all text-sm leading-relaxed"
                        placeholder="Müşteriye özel notlar, garanti şartları veya ödeme koşulları..."
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                </div>

                {/* Action Buttons - Takes 1 column */}
                <div className="card glass-plus p-6 border border-white/10 shadow-xl flex flex-col justify-center gap-3">
                    <button type="submit" className="btn btn-primary w-full shadow-lg shadow-primary/20 h-12">
                        {initialData ? 'DEĞİŞİKLİKLERİ KAYDET' : 'TEKLİFİ OLUŞTUR'}
                    </button>
                    <button type="button" onClick={onCancel} className="btn btn-ghost btn-sm text-muted hover:text-white">
                        İptal Et
                    </button>
                </div>
            </div>
        </form>
    );
}
