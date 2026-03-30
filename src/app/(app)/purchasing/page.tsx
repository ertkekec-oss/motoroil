
"use client";

import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useInventory } from '@/contexts/InventoryContext';
import { useCRM } from '@/contexts/CRMContext';
import { useModal } from '@/contexts/ModalContext';

export default function PurchasingPage() {
    // --- STATE ---
    const [view, setView] = useState('list'); // 'list' | 'new_invoice'
    const { showSuccess, showError } = useModal();

    const { products } = useInventory();
    const { suppliers } = useCRM();
    const [invoices, setInvoices] = useState<any[]>([]);

    useEffect(() => {
        // Fetch real invoices from DB
        fetch('/api/purchasing/list') // I'll create this or just fetch all suppliers? 
            .then(res => res.json())
            .then(data => { if (data.success) setInvoices(data.invoices); })
            .catch(e => console.error(e));
    }, []);

    const [formData, setFormData] = useState({
        supplierId: '',
        invNo: '',
        date: new Date().toISOString().split('T')[0],
        targetBranch: 'Merkez Depo',
        items: [] as { productId: string, name: string, qty: number, price: number, description?: string }[]
    });

    const [tempItem, setTempItem] = useState({ productId: '', name: '', qty: 1, price: 0, description: '' });

    // --- ACTIONS ---
    const addItem = () => {
        if (!tempItem.name) return;
        setFormData({
            ...formData,
            items: [...formData.items, tempItem]
        });
        setTempItem({ productId: '', name: '', qty: 1, price: 0, description: '' });
    };

    const removeItem = (index: number) => {
        const newItems = [...formData.items];
        newItems.splice(index, 1);
        setFormData({ ...formData, items: newItems });
    };

    const calculateTotal = () => {
        return formData.items.reduce((acc, item) => acc + (item.qty * item.price), 0);
    };

    const handleSaveInvoice = async () => {
        if (!formData.supplierId || formData.items.length === 0) {
            showError('Eksik Bilgi', 'Lütfen tedarikçi seçin ve en az bir ürün ekleyin.');
            return;
        }

        const totalAmount = calculateTotal() * 1.2; // Including VAT

        try {
            const res = await fetch('/api/purchasing/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    supplierId: formData.supplierId,
                    invoiceNo: formData.invNo || `FAT-${Date.now()}`,
                    invoiceDate: formData.date,
                    items: formData.items,
                    totalAmount: totalAmount
                })
            });

            const data = await res.json();
            if (data.success) {
                showSuccess('Başarılı', '✅ Fatura başarıyla kaydedildi, stoklar güncellendi ve cariye borç işlendi.');
                setView('list');
                // Optional: Refresh list
            } else {
                showError('Hata', '❌ Hata: ' + data.error);
            }
        } catch (e) {
            showError('Hata', '❌ Bağlantı hatası!');
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-[#0f172a] animate-in fade-in duration-300">

            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 sm:p-8 bg-white dark:bg-[#0f172a] border-b border-slate-200 dark:border-white/5 shadow-sm gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                        <span className="flex items-center justify-center w-10 h-10 rounded-[16px] bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                            📦
                        </span>
                        Satın Alma & Mal Kabul
                    </h1>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 sm:ml-[3.25rem]">Gelen Faturalar ve Depo Giriş İşlemleri</p>
                </div>
                {view === 'list' && (
                    <button onClick={() => setView('new_invoice')} className="flex items-center gap-2 h-[38px] px-6 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-widest shadow-sm shadow-blue-500/20 transition-all outline-none">
                        <span>+ YENİ ALIM FATURASI GİR</span>
                    </button>
                )}
            </div>

            {/* --- LIST VIEW --- */}
            {view === 'list' && (
            <div className="p-6 sm:p-8 flex-1 overflow-y-auto w-full">
                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[24px] shadow-sm overflow-hidden flex flex-col w-full">
                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead className="bg-[#f8fafc] dark:bg-[#1e293b]/50 text-[10px] font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-widest sticky top-0 z-10 border-b border-slate-200 dark:border-white/5">
                                <tr>
                                    <th className="px-6 py-4 font-bold border-b border-slate-200 dark:border-white/5">Fatura Bilgisi</th>
                                    <th className="px-6 py-4 font-bold border-b border-slate-200 dark:border-white/5">Hedef Depo</th>
                                    <th className="px-6 py-4 font-bold border-b border-slate-200 dark:border-white/5">Tarih</th>
                                    <th className="px-6 py-4 font-bold border-b border-slate-200 dark:border-white/5">Tutar</th>
                                    <th className="px-6 py-4 font-bold border-b border-slate-200 dark:border-white/5">Durum</th>
                                    <th className="px-6 py-4 font-bold text-right border-b border-slate-200 dark:border-white/5 pr-8">İşlem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {invoices.length > 0 ? invoices.map((inv, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900 dark:text-white text-sm">{inv.supplier}</div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">{inv.id} - {inv.msg}</div>
                                        </td>
                                        <td className="px-6 py-4 align-middle">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold tracking-widest uppercase text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                                {inv.target}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-[11px] font-bold tracking-widest text-slate-500 align-middle">{inv.date}</td>
                                        <td className="px-6 py-4 text-[14px] font-black text-slate-900 dark:text-white align-middle">{inv.total.toLocaleString()} ₺</td>
                                        <td className="px-6 py-4 align-middle">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-[6px] text-[10px] font-bold tracking-widest uppercase border ${inv.status === 'Onaylandı' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'}`}>
                                                {inv.status === 'Onaylandı' ? 'STOKTA' : 'BEKLİYOR'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 pr-8 align-middle text-right">
                                            <button className="px-3 py-1.5 rounded-full border border-slate-200 dark:border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                                Detay
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
                                            Henüz fatura bulunmamaktadır.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            )}

            {/* --- NEW INVOICE MODAL --- */}
            {view === 'new_invoice' && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[9999] flex justify-center items-center p-4 sm:p-6 animate-in fade-in">
                    <div className="bg-white dark:bg-[#0f172a] w-full max-w-5xl max-h-[90vh] rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center px-8 py-5 border-b border-slate-200 dark:border-white/10 bg-[#f8fafc] dark:bg-[#1e293b]/50 shrink-0">
                            <div>
                                <h3 className="text-[18px] font-black text-slate-900 dark:text-white flex items-center gap-3">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100/50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">📥</span> MANUEL FATURA GİRİŞ
                                </h3>
                                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">Alış faturanızı ve detaylarını girip envantere işleyin.</p>
                            </div>
                            <button onClick={() => setView('list')} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-8 custom-scroll space-y-8">
                            
                            {/* General Info */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Tedarikçi</label>
                                    <select
                                        value={formData.supplierId} onChange={e => setFormData({ ...formData, supplierId: e.target.value })}
                                        className="w-full h-11 px-3 rounded-[16px] bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors appearance-none"
                                    >
                                        <option value="" disabled>Seçiniz...</option>
                                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Hedef Depo / Şube</label>
                                    <select
                                        value={formData.targetBranch} onChange={e => setFormData({ ...formData, targetBranch: e.target.value })}
                                        className="w-full h-11 px-3 rounded-[16px] bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors appearance-none"
                                    >
                                        <option>Merkez Depo</option>
                                        <option>Kadıköy Şube</option>
                                        <option>Beşiktaş Şube</option>
                                        <option>İzmir Şube</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Fatura No</label>
                                    <input 
                                        type="text" 
                                        placeholder="Örn: GIB2026..." 
                                        value={formData.invNo} 
                                        onChange={e => setFormData({ ...formData, invNo: e.target.value })} 
                                        className="w-full h-11 px-3 rounded-[16px] bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Fatura Tarihi</label>
                                    <input 
                                        type="date" 
                                        value={formData.date} 
                                        onChange={e => setFormData({ ...formData, date: e.target.value })} 
                                        className="w-full h-11 px-3 rounded-[16px] bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" 
                                    />
                                </div>
                            </div>

                            {/* ITEMS ADDER */}
                            <div className="bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-[24px] p-6 shadow-sm">
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Ürün Girişi</h4>
                                
                                <div className="flex flex-col md:flex-row gap-3 items-end">
                                    <div className="flex-1 w-full">
                                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Ürün Seçiniz</label>
                                        <select
                                            value={tempItem.productId}
                                            onChange={e => {
                                                const p = products.find(prod => prod.id === e.target.value);
                                                setTempItem({ ...tempItem, productId: e.target.value, name: p?.name || '', price: parseFloat(String(p?.buyPrice)) || 0 });
                                            }}
                                            className="w-full h-11 px-3 rounded-[16px] bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors appearance-none"
                                        >
                                            <option value="" disabled>Ürün Arayın & Seçin...</option>
                                            {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
                                        </select>
                                    </div>
                                    <div className="w-full md:w-32">
                                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Miktar</label>
                                        <input 
                                            type="number" 
                                            min="1"
                                            placeholder="Adet" 
                                            value={tempItem.qty || ''} 
                                            onChange={e => setTempItem({ ...tempItem, qty: parseInt(e.target.value) || 0 })} 
                                            className="w-full h-11 px-3 rounded-[16px] bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" 
                                        />
                                    </div>
                                    <div className="w-full md:w-40">
                                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Birim Alış Fiyatı (₺)</label>
                                        <input 
                                            type="number" 
                                            step="0.01"
                                            placeholder="Fiyat" 
                                            value={tempItem.price || ''} 
                                            onChange={e => setTempItem({ ...tempItem, price: parseFloat(e.target.value) || 0 })} 
                                            className="w-full h-11 px-3 rounded-[16px] bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" 
                                        />
                                    </div>
                                    <div className="w-full md:w-3/12">
                                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Açıklama / Şase No vs. (Opsiyonel)</label>
                                        <input 
                                            type="text" 
                                            placeholder="Örn: ŞASE: XYZ123" 
                                            value={tempItem.description || ''} 
                                            onChange={e => setTempItem({ ...tempItem, description: e.target.value })} 
                                            className="w-full h-11 px-3 rounded-[16px] bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" 
                                        />
                                    </div>
                                    <button 
                                        onClick={addItem}
                                        disabled={!tempItem.productId || tempItem.qty <= 0}
                                        className="h-11 px-6 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-[10px] uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto"
                                    >
                                        LİSTEYE EKLE
                                    </button>
                                </div>

                                {/* ITEMS LIST */}
                                {formData.items.length > 0 && (
                                    <div className="mt-8 border border-slate-200 dark:border-white/5 rounded-[24px] overflow-hidden bg-white dark:bg-[#0f172a]">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead className="bg-slate-50/50 dark:bg-[#1e293b]/50 border-b border-slate-200 dark:border-white/5">
                                                    <tr>
                                                        <th className="px-5 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sıra</th>
                                                        <th className="px-5 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ürün</th>
                                                        <th className="px-5 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Miktar</th>
                                                        <th className="px-5 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Birim Fiyat</th>
                                                        <th className="px-5 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Toplam</th>
                                                        <th className="px-5 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">İşlem</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                                    {formData.items.map((item, i) => (
                                                        <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                                                            <td className="px-5 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">{i + 1}</td>
                                                            <td className="px-5 py-3 text-sm font-semibold text-slate-900 dark:text-white">
                                                                {item.name}
                                                                {item.description && (
                                                                    <div className="text-xs text-slate-500 font-medium mt-1 inline-block bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                                                        {item.description}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="px-5 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 text-right">{item.qty}</td>
                                                            <td className="px-5 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 text-right">{item.price.toLocaleString('tr-TR', {minimumFractionDigits: 2})} ₺</td>
                                                            <td className="px-5 py-3 text-sm font-black text-slate-900 dark:text-white text-right">{(item.qty * item.price).toLocaleString('tr-TR', {minimumFractionDigits: 2})} ₺</td>
                                                            <td className="px-5 py-3 text-center">
                                                                <button 
                                                                    onClick={() => removeItem(i)} 
                                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-colors"
                                                                    title="Sil"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* SUMMARY & SAVE */}
                            {formData.items.length > 0 && (
                                <div className="bg-slate-900 text-white rounded-[24px] p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-center sm:items-start gap-6 shadow-xl relative overflow-hidden">
                                    <div className="absolute -right-8 -top-8 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
                                    <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>
                                    
                                    <div className="relative z-10 w-full sm:w-auto text-center sm:text-left">
                                        <div className="text-slate-400 font-medium text-sm">Fatura Özeti</div>
                                        <div className="mt-4 flex gap-8">
                                            <div>
                                                <div className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1">Ara Toplam</div>
                                                <div className="text-lg font-semibold">{calculateTotal().toLocaleString('tr-TR', {minimumFractionDigits: 2})} ₺</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1">+ KDV Toplamı (%20)</div>
                                                <div className="text-lg font-semibold text-slate-300">{(calculateTotal() * 0.2).toLocaleString('tr-TR', {minimumFractionDigits: 2})} ₺</div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="relative z-10 w-full sm:w-auto pt-6 sm:pt-0 border-t sm:border-t-0 sm:border-l border-slate-700 sm:pl-8 text-center sm:text-right">
                                        <div className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1">ÖDENECEK GENEL TOPLAM</div>
                                        <div className="text-4xl font-black text-white tracking-tight">{(calculateTotal() * 1.2).toLocaleString('tr-TR', {minimumFractionDigits: 2})} ₺</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-8 py-5 border-t border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-[#1e293b]/50 flex justify-end gap-3 z-20">
                            <button onClick={() => setView('list')} className="px-6 py-3 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 font-bold text-[10px] uppercase tracking-widest transition-colors">
                                İPTAL & VAZGEÇ
                            </button>
                            <button 
                                onClick={handleSaveInvoice} 
                                disabled={formData.items.length === 0 || !formData.supplierId}
                                className="h-11 px-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] tracking-widest uppercase transition-colors shadow-sm shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <span>KAYDET VE İLERLET</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
