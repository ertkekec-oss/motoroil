import React, { useState } from 'react';
import { Plus, Trash2, FileText, Send, Building2, User, Search, Calculator, CheckCircle2 } from 'lucide-react';
import { useModal } from '@/contexts/ModalContext';

export default function B2BInvoiceWorkspace({ products, customers }: any) {
    const { showWarning, showSuccess } = useModal();

    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [customerSearch, setCustomerSearch] = useState('');
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

    const [invoiceLines, setInvoiceLines] = useState<any[]>([
        { id: 1, product: null, name: '', qty: 1, unitPrice: 0, discountRate: 0, vatRate: 20, description: '' }
    ]);

    const [invoiceStatus, setInvoiceStatus] = useState('draft');

    const handleAddLine = () => {
        setInvoiceLines([
            ...invoiceLines, 
            { id: Date.now(), product: null, name: '', qty: 1, unitPrice: 0, discountRate: 0, vatRate: 20, description: '' }
        ]);
    };

    const handleRemoveLine = (id: number) => {
        if (invoiceLines.length === 1) return;
        setInvoiceLines(invoiceLines.filter(l => l.id !== id));
    };

    const updateLine = (id: number, field: string, value: any) => {
        setInvoiceLines(invoiceLines.map(l => l.id === id ? { ...l, [field]: value } : l));
    };

    const handleProductSelect = (id: number, prodId: string) => {
        const prod = products.find((p: any) => p.id === prodId || p.code === prodId);
        if (prod) {
            setInvoiceLines(invoiceLines.map(l => l.id === id ? { 
                ...l, 
                product: prod, 
                name: prod.name, 
                unitPrice: Number(prod.price || 0),
                vatRate: prod.vatRate || 20
            } : l));
        }
    };

    // Calculations
    const totals = invoiceLines.reduce((acc, line) => {
        const rowGross = Number(line.qty) * Number(line.unitPrice);
        const rowDiscount = rowGross * (Number(line.discountRate) / 100);
        const rowNet = rowGross - rowDiscount;
        const rowVat = rowNet * (Number(line.vatRate) / 100);
        
        return {
            subtotal: acc.subtotal + rowGross,
            discount: acc.discount + rowDiscount,
            netTotal: acc.netTotal + rowNet,
            vatTotal: acc.vatTotal + rowVat,
            grandTotal: acc.grandTotal + rowNet + rowVat
        };
    }, { subtotal: 0, discount: 0, netTotal: 0, vatTotal: 0, grandTotal: 0 });

    const filteredCustomers = customers.filter((c: any) => c.name?.toLowerCase().includes(customerSearch.toLowerCase()));

    const handleSendInvoice = () => {
        if (!selectedCustomer) {
            return showWarning("Cari Seçimi Eksik", "Fatura kesebilmek için lütfen Cari Hesap seçiniz.");
        }
        const validLines = invoiceLines.filter(l => l.name);
        if (validLines.length === 0) {
            return showWarning("Fatura Boş", "Lütfen en az bir ürün/hizmet ekleyiniz.");
        }

        setInvoiceStatus('processing');
        setTimeout(() => {
            setInvoiceStatus('sent');
            showSuccess("E-Fatura Başarıyla GİB'e İletildi", `Fatura Numarası: ${new Date().getFullYear()}${(Math.random().toString(36).substring(2, 8).toUpperCase())}`);
        }, 1500);
    };

    if (invoiceStatus === 'sent') {
        return (
            <div className="flex-1 w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl flex flex-col items-center justify-center m-6 p-8">
                <CheckCircle2 size={80} strokeWidth={1} className="text-emerald-500 mb-6" />
                <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">E-Fatura Kesildi</h2>
                <p className="text-slate-500 font-medium mb-8 text-center max-w-md">Belge GİB kuyruğuna başarıyla eklendi. Müşteriye e-posta olarak otomatik iletilmiştir.</p>
                <div className="space-x-4">
                    <button className="px-6 py-3 bg-white border border-slate-200 rounded-xl font-bold shadow-sm" onClick={() => { setInvoiceStatus('draft'); setInvoiceLines([{ id: 1, product: null, name: '', qty: 1, unitPrice: 0, discountRate: 0, vatRate: 20, description: '' }]); setSelectedCustomer(null); }}>YENİ FATURA</button>
                    <button className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-md hover:bg-indigo-700">PDF OLARAK İNDİR</button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 w-full flex flex-col min-h-0 bg-slate-100 dark:bg-[#020617] p-4 lg:p-8 overflow-y-auto custom-scrollbar">
            
            {/* The Formal Invoice A4 Paper Canvas */}
            <div className="w-full max-w-[1400px] mx-auto bg-white dark:bg-[#0B1220] rounded-xl shadow-lg border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                
                {/* Header Section */}
                <div className="p-6 md:p-8 border-b border-slate-200 dark:border-white/5 flex flex-col md:flex-row justify-between gap-8 bg-slate-50/50 dark:bg-white/[0.02]">
                    
                    {/* Customer Selection Block */}
                    <div className="flex-1 max-w-md relative">
                        <label className="text-[11px] font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase block mb-3">SAYIN / KURUM (ALICI)</label>
                        
                        {!selectedCustomer ? (
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input 
                                    placeholder="Fatura Kesilecek Cari Ünvan veya Vergi No..." 
                                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-[#0f172a] border-l-4 border-l-indigo-500 border border-slate-200 dark:border-white/10 rounded-xl font-bold text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
                                    value={customerSearch}
                                    onChange={(e) => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true); }}
                                    onFocus={() => setShowCustomerDropdown(true)}
                                />
                                {showCustomerDropdown && (
                                    <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl shadow-xl max-h-[300px] overflow-y-auto py-2">
                                        <div className="px-3 py-1.5 text-xs font-bold text-slate-400">Son Kullanılan Cariler</div>
                                        {filteredCustomers.slice(0, 10).map((c: any) => (
                                            <div 
                                                key={c.id} 
                                                onClick={() => { setSelectedCustomer(c); setShowCustomerDropdown(false); setCustomerSearch(''); }}
                                                className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer flex flex-col transition-colors border-b border-slate-50 dark:border-white/5 last:border-0"
                                            >
                                                <span className="font-bold text-slate-800 dark:text-white text-[13px] leading-tight">{c.name}</span>
                                                <span className="text-[11px] text-slate-500 mt-1 uppercase">Bakiye: {Number(c.balance || 0).toLocaleString()} TL • {c.taxOffice || 'Vergi D.'}: {c.taxNumber || 'Tanımsız'}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-xl p-4 shadow-sm relative group cursor-pointer" onClick={() => setSelectedCustomer(null)}>
                                <div className="absolute inset-0 bg-rose-50 dark:bg-rose-500/10 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity border border-rose-200 dark:border-rose-500/30">
                                    <span className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2"><Trash2 size={16} /> Cariyi Değiştir</span>
                                </div>
                                <div className="group-hover:opacity-0 transition-opacity">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                                            {selectedCustomer.taxNumber ? <Building2 size={20} /> : <User size={20} />}
                                        </div>
                                        <div>
                                            <h3 className="font-black text-slate-900 dark:text-white leading-tight pr-4">{selectedCustomer.name}</h3>
                                            <p className="text-[11px] text-slate-500 font-medium mt-1">VD: {selectedCustomer.taxOffice || 'Belirtilmemiş'} • VNO: <span className="font-bold">{selectedCustomer.taxNumber || 'Belirtilmemiş'}</span></p>
                                        </div>
                                    </div>
                                    <div className="mt-3 text-[11px] text-slate-500 leading-relaxed border-t border-slate-100 dark:border-white/5 pt-3">
                                        {selectedCustomer.address || 'Kayıtlı açık adres bulunamadı. Fatura E-Arşiv olarak kesilecektir.'}
                                        <br/>{selectedCustomer.district} / {selectedCustomer.city}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Metadata Block */}
                    <div className="flex flex-col gap-4 text-right">
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-widest mb-1">Fatura Tipi</label>
                            <span className="font-black text-xs px-3 py-1.5 bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400 rounded-md border border-sky-200 dark:border-sky-500/20">SATIŞ E-FATURASI</span>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-widest mb-1">Düzenlenme Tarihi</label>
                            <span className="font-bold text-[13px] text-slate-800 dark:text-white">{new Date().toLocaleDateString('tr-TR')} {new Date().toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})}</span>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-widest mb-1">Şube / Operasyon</label>
                            <span className="font-bold text-[13px] text-slate-800 dark:text-white">Merkez Depo (E-Ticaret)</span>
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="overflow-x-auto w-full min-h-[400px]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-white/5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                <th className="p-4 w-12 text-center">#</th>
                                <th className="p-4 min-w-[250px]">Ürün / Hizmet Açıklaması</th>
                                <th className="p-4 w-32">Miktar</th>
                                <th className="p-4 w-32">Birim Fiyat</th>
                                <th className="p-4 w-24">İsk. (%)</th>
                                <th className="p-4 w-24">KDV (%)</th>
                                <th className="p-4 w-32 text-right">Net Tutar</th>
                                <th className="p-4 w-12 text-center"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {invoiceLines.map((line, index) => {
                                const rowGross = line.qty * line.unitPrice;
                                const rowNet = rowGross - (rowGross * (line.discountRate / 100));
                                
                                return (
                                    <tr key={line.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                                        <td className="p-4 text-center font-medium text-slate-400 text-sm align-top pt-5">
                                            {index + 1}
                                        </td>
                                        <td className="p-4 align-top">
                                            <div className="relative">
                                                <input 
                                                    type="text"
                                                    value={line.name}
                                                    onChange={(e) => updateLine(line.id, 'name', e.target.value)}
                                                    className="w-full bg-transparent font-bold text-slate-900 dark:text-white text-sm outline-none border-b border-transparent focus:border-indigo-500 pb-1"
                                                    placeholder="Ürün adı, barkod veya hizm. açıklaması girin..."
                                                />
                                                <div className="text-[10px] mt-1 space-x-2">
                                                    <span className="text-slate-400 cursor-pointer hover:text-indigo-500">+ Alt Açıklama Ekle</span>
                                                    <span className="text-slate-400 cursor-pointer hover:text-indigo-500" onClick={() => {
                                                        const p = prompt("Stok arayın:");
                                                        if(p) handleProductSelect(line.id, p);
                                                    }}>🔍 Stoktan Seç</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 align-top pt-4">
                                            <input type="number" min="1" value={line.qty || ''} onChange={(e) => updateLine(line.id, 'qty', Number(e.target.value))} className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-md px-3 py-2 text-sm font-bold text-center outline-none focus:ring-2 focus:ring-indigo-500/30" />
                                        </td>
                                        <td className="p-4 align-top pt-4">
                                            <input type="number" min="0" value={line.unitPrice || ''} onChange={(e) => updateLine(line.id, 'unitPrice', Number(e.target.value))} className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-md px-3 py-2 text-sm font-bold text-right outline-none focus:ring-2 focus:ring-indigo-500/30" />
                                        </td>
                                        <td className="p-4 align-top pt-4">
                                            <input type="number" min="0" max="100" value={line.discountRate || ''} onChange={(e) => updateLine(line.id, 'discountRate', Number(e.target.value))} className="w-full bg-transparent border-b border-slate-200 dark:border-white/20 py-2 text-sm font-bold text-center outline-none focus:border-indigo-500" />
                                        </td>
                                        <td className="p-4 align-top pt-4">
                                            <select value={line.vatRate} onChange={(e) => updateLine(line.id, 'vatRate', Number(e.target.value))} className="w-full bg-transparent border-b border-slate-200 dark:border-white/20 py-2 text-sm font-bold opacity-80 outline-none focus:border-indigo-500 cursor-pointer">
                                                <option value="20">%20</option>
                                                <option value="10">%10</option>
                                                <option value="1">%1</option>
                                                <option value="0">%0</option>
                                            </select>
                                        </td>
                                        <td className="p-4 text-right align-top pt-5 font-black text-slate-800 dark:text-white tracking-tight">
                                            {rowNet.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                        </td>
                                        <td className="p-4 text-center align-top pt-5">
                                            <button onClick={() => handleRemoveLine(line.id)} className="text-slate-300 hover:text-rose-500 transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    <div className="p-4 border-t border-slate-200 dark:border-white/5">
                        <button onClick={handleAddLine} className="flex items-center gap-2 text-sm font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 px-4 py-2.5 rounded-lg transition-colors border border-dashed border-indigo-200 dark:border-indigo-500/30">
                            <Plus size={16} strokeWidth={3} /> YENİ SATIR EKLE
                        </button>
                    </div>
                </div>

                {/* Footer Section (Calculations & Totals) */}
                <div className="bg-slate-50 dark:bg-slate-900 border-t items-start border-slate-200 dark:border-white/10 p-6 md:p-8 flex flex-col md:flex-row justify-between gap-8">
                    
                    <div className="flex-1 max-w-md">
                        <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-widest mb-2">Fatura Alt Notu</label>
                        <textarea placeholder="Banka IBAN bilgileri, teslimat notu veya yasal açıklamalar..." className="w-full h-32 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-xl p-4 text-sm font-medium resize-none outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm" />
                    </div>

                    <div className="w-full md:w-[360px] shrink-0 bg-white dark:bg-[#0B1220] border border-slate-200 dark:border-white/10 rounded-xl shadow-sm p-6 flex flex-col space-y-3">
                        <div className="flex justify-between text-sm font-bold text-slate-500">
                            <span>Mal / Hizmet Toplam Tutar</span>
                            <span>{totals.subtotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits:2})} TL</span>
                        </div>
                        {totals.discount > 0 && (
                            <div className="flex justify-between text-sm font-bold text-rose-500">
                                <span>Toplam İskonto</span>
                                <span>-{totals.discount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits:2})} TL</span>
                            </div>
                        )}
                        <div className="flex justify-between text-sm font-bold text-slate-600 dark:text-slate-400">
                            <span>Hesaplanan KDV</span>
                            <span>{totals.vatTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits:2})} TL</span>
                        </div>
                        <div className="h-px w-full bg-slate-200 dark:bg-white/10 my-1"></div>
                        <div className="flex justify-between items-end">
                            <span className="font-black text-[13px] text-slate-800 dark:text-white uppercase">VERGİLER DAHİL TOPLAM</span>
                            <span className="text-3xl font-black tracking-tight text-indigo-600 dark:text-indigo-400 leading-none">₺{totals.grandTotal.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                        </div>
                    </div>
                </div>

                {/* Final Action Bar */}
                <div className="bg-white dark:bg-[#0f172a] border-t border-slate-200 dark:border-white/5 p-4 lg:p-6 flex flex-col sm:flex-row justify-end items-center gap-4">
                    <button className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold bg-slate-100 text-slate-700 dark:bg-white/5 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors flex items-center justify-center gap-2 text-sm shadow-sm">
                        <FileText size={16} /> TASLAK OLARAK KAYDET
                    </button>
                    <button 
                        onClick={handleSendInvoice}
                        disabled={invoiceStatus === 'processing'}
                        className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 text-[15px] shadow-lg shadow-emerald-600/30 disabled:opacity-50"
                    >
                        {invoiceStatus === 'processing' ? <Calculator className="animate-spin" size={18} /> : <Send size={18} />} 
                        {invoiceStatus === 'processing' ? 'GİB İLE HABERLEŞİLİYOR...' : 'E-FATURA GÖNDER'}
                    </button>
                </div>
            </div>
        </div>
    )
}
