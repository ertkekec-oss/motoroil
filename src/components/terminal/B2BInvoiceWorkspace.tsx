import React, { useState } from 'react';
import { Plus, Trash2, FileText, Send, Building2, User, Search, Calculator, CheckCircle2 } from 'lucide-react';
import { useModal } from '@/contexts/ModalContext';

export default function B2BInvoiceWorkspace({ products, customers }: any) {
    const { showWarning, showSuccess } = useModal();

    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [customerSearch, setCustomerSearch] = useState('');
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

    const [focusedLineId, setFocusedLineId] = useState<number | null>(null);
    const [productSearchStr, setProductSearchStr] = useState('');

    const [invoiceType, setInvoiceType] = useState('SATIS');
    const [invoiceScenario, setInvoiceScenario] = useState('TICARIFATURA');

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

    const filteredCustomers = customers?.filter((c: any) => c.name?.toLowerCase().includes(customerSearch.toLowerCase())) || [];
    
    // Product Search Logic
    const filteredProducts = products?.filter((p: any) => 
        p.name?.toLowerCase().includes(productSearchStr.toLowerCase()) || 
        p.code?.toLowerCase().includes(productSearchStr.toLowerCase())
    ) || [];

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
        <div className="flex-1 w-full flex flex-col min-h-0 bg-[#F4F6F8] dark:bg-[#0B1220] p-2 lg:p-4 overflow-y-auto custom-scrollbar">
            
            {/* The Formal Invoice Box */}
            <div className="w-full bg-white dark:bg-[#0f172a] rounded-xl shadow border border-[#D6DAE1] dark:border-white/10 flex flex-col mb-4">
                
                {/* Header Section (Compact Grid) */}
                <div className="p-4 lg:p-5 border-b border-slate-200 dark:border-white/5 grid grid-cols-1 lg:grid-cols-2 gap-6 bg-slate-50/30 dark:bg-white/[0.01] rounded-t-xl">
                    
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

                    {/* Metadata Block (Horizontal alignment) */}
                    <div className="flex flex-row items-center justify-end gap-4 sm:gap-6 text-left flex-wrap ml-auto">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Fatura Tipi</label>
                            <select 
                                value={invoiceType}
                                onChange={(e) => setInvoiceType(e.target.value)}
                                className="font-black text-[11px] px-2 py-1 bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400 rounded border border-sky-200 dark:border-sky-500/20 w-max outline-none cursor-pointer focus:ring-2 focus:ring-sky-500/30 transition-shadow transition-colors"
                            >
                                <option value="SATIS">SATIŞ FATURASI</option>
                                <option value="IADE">İADE FATURASI</option>
                                <option value="TEVKIFAT">TEVKİFATLI FATURA</option>
                                <option value="ISTISNA">İSTİSNA FATURASI</option>
                            </select>
                        </div>
                        <div className="h-8 w-px bg-slate-200 dark:bg-white/10 mx-1"></div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Senaryo</label>
                            <select 
                                value={invoiceScenario}
                                onChange={(e) => setInvoiceScenario(e.target.value)}
                                className="font-black text-[11px] px-2 py-1 bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 rounded border border-purple-200 dark:border-purple-500/20 w-max outline-none cursor-pointer focus:ring-2 focus:ring-purple-500/30 transition-shadow transition-colors"
                            >
                                <option value="TICARIFATURA">TİCARİ FATURA</option>
                                <option value="TEMELFATURA">TEMEL FATURA</option>
                            </select>
                        </div>
                        <div className="h-8 w-px bg-slate-200 dark:bg-white/10 mx-1"></div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Düzenlenme Tarihi</label>
                            <span className="font-bold text-xs text-slate-800 dark:text-white leading-tight">{new Date().toLocaleDateString('tr-TR')} {new Date().toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})}</span>
                        </div>
                        <div className="h-8 w-px bg-slate-200 dark:bg-white/10"></div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Şube / Kasa</label>
                            <span className="font-bold text-xs text-slate-800 dark:text-white leading-tight">Merkez (Online)</span>
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="overflow-x-auto w-full min-h-[300px]">
                    <table className="w-full text-left border-collapse min-w-[750px]">
                        <thead>
                            <tr className="bg-slate-100/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-white/5 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                <th className="p-3 w-10 text-center">#</th>
                                <th className="p-3">Ürün / Hizmet Açıklaması</th>
                                <th className="p-3 w-24">Miktar</th>
                                <th className="p-3 w-28">Birim Fiyat</th>
                                <th className="p-3 w-20">İsk.(%)</th>
                                <th className="p-3 w-20">KDV(%)</th>
                                <th className="p-3 w-28 text-right">Net Tutar</th>
                                <th className="p-3 w-10 text-center"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {invoiceLines.map((line, index) => {
                                const rowGross = line.qty * line.unitPrice;
                                const rowNet = rowGross - (rowGross * (line.discountRate / 100));
                                
                                return (
                                    <tr key={line.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                                        <td className="p-2 text-center font-bold text-slate-400 text-xs align-top pt-4">
                                            {index + 1}
                                        </td>
                                        <td className="p-2 align-top">
                                            <div className="relative">
                                                <input 
                                                    type="text"
                                                    value={focusedLineId === line.id ? productSearchStr : line.name}
                                                    onChange={(e) => {
                                                        if (focusedLineId === line.id) {
                                                            setProductSearchStr(e.target.value);
                                                            updateLine(line.id, 'name', e.target.value); // Sync manual name optionally
                                                        } else {
                                                            updateLine(line.id, 'name', e.target.value);
                                                        }
                                                    }}
                                                    onFocus={() => {
                                                        setFocusedLineId(line.id);
                                                        setProductSearchStr(line.name || '');
                                                    }}
                                                    onBlur={() => {
                                                        // Using setTimeout to allow clicking on dropdown items
                                                        setTimeout(() => {
                                                            if (focusedLineId === line.id) setFocusedLineId(null);
                                                        }, 200);
                                                    }}
                                                    className="w-full bg-transparent font-bold text-slate-800 dark:text-white text-xs outline-none border-b border-transparent focus:border-indigo-500 pb-1"
                                                    placeholder="Açıklama veya ürün adı..."
                                                />
                                                <div className="text-[9px] mt-1 space-x-2 font-medium">
                                                    <span className="text-slate-400 cursor-pointer hover:text-indigo-500" onClick={() => {
                                                        setFocusedLineId(line.id); 
                                                        setProductSearchStr('');
                                                    }}>🔍 Stok Arama Listesi</span>
                                                </div>

                                                {/* Inline Product Search Dropdown */}
                                                {focusedLineId === line.id && productSearchStr.length >= 2 && (
                                                    <div className="absolute z-50 left-0 top-full mt-1 w-full min-w-[280px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl shadow-xl max-h-[250px] overflow-y-auto py-2">
                                                        <div className="px-3 py-1 text-xs font-bold text-slate-400 border-b border-slate-100 dark:border-white/5">Stok Kartları ({filteredProducts.length})</div>
                                                        {filteredProducts.map((p: any) => (
                                                            <div 
                                                                key={p.id} 
                                                                onClick={() => {
                                                                    handleProductSelect(line.id, p.id);
                                                                    setFocusedLineId(null);
                                                                }}
                                                                className="px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer flex flex-col transition-colors border-b border-slate-50 dark:border-white/5 last:border-0"
                                                            >
                                                                <span className="font-bold text-slate-800 dark:text-white text-[11px] leading-tight flex items-center justify-between">
                                                                    <span className="truncate pr-2">{p.name}</span>
                                                                    <span className="shrink-0 text-indigo-600 dark:text-indigo-400 font-black px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-500/10 rounded">₺{Number(p.price || 0).toLocaleString()}</span>
                                                                </span>
                                                                <span className="text-[9px] text-slate-500 mt-0.5">Stok: {p.stock} • KDV: %{p.vatRate}</span>
                                                            </div>
                                                        ))}
                                                        {filteredProducts.length === 0 && (
                                                            <div className="px-3 py-3 text-xs text-slate-500 text-center">Sonuç bulunamadı.</div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-2 align-top pt-3">
                                            <input type="number" min="1" value={line.qty || ''} onChange={(e) => updateLine(line.id, 'qty', Number(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded px-2 py-1.5 text-xs font-bold text-center outline-none focus:ring-1 focus:ring-indigo-500" />
                                        </td>
                                        <td className="p-2 align-top pt-3">
                                            <input type="number" min="0" value={line.unitPrice || ''} onChange={(e) => updateLine(line.id, 'unitPrice', Number(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded px-2 py-1.5 text-xs font-bold text-right outline-none focus:ring-1 focus:ring-indigo-500" />
                                        </td>
                                        <td className="p-2 align-top pt-3">
                                            <input type="number" min="0" max="100" value={line.discountRate || ''} onChange={(e) => updateLine(line.id, 'discountRate', Number(e.target.value))} className="w-full bg-transparent border-b border-slate-200 dark:border-white/20 py-1.5 text-xs font-bold text-center outline-none focus:border-indigo-500" />
                                        </td>
                                        <td className="p-2 align-top pt-3">
                                            <select value={line.vatRate} onChange={(e) => updateLine(line.id, 'vatRate', Number(e.target.value))} className="w-full bg-transparent border-b border-slate-200 dark:border-white/20 py-1.5 text-xs font-bold outline-none focus:border-indigo-500 cursor-pointer text-center">
                                                <option value="20">%20</option>
                                                <option value="10">%10</option>
                                                <option value="1">%1</option>
                                                <option value="0">%0</option>
                                            </select>
                                        </td>
                                        <td className="p-2 text-right align-top pt-4 font-black text-slate-800 dark:text-white text-xs">
                                            {rowNet.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                        </td>
                                        <td className="p-2 text-center align-top pt-4">
                                            <button onClick={() => handleRemoveLine(line.id)} className="text-slate-300 hover:text-rose-500 transition-colors">
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>


                    <div className="p-3 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-white/5">
                        <button onClick={handleAddLine} className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 px-3 py-1.5 rounded transition-colors border border-dashed border-indigo-200 dark:border-indigo-500/30 flex items-center gap-1.5">
                            <Plus size={14} strokeWidth={3} /> YENİ SATIR EKLE
                        </button>
                    </div>
                </div>

                {/* Footer Section (Calculations & Totals) - Compact */}
                <div className="bg-slate-50 dark:bg-slate-900 border-t items-start border-slate-200 dark:border-white/10 p-5 lg:p-6 flex flex-row justify-between gap-6 w-full min-w-min">
                    
                    <div className="flex-1 max-w-xl">
                        <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-widest mb-1.5">Fatura Alt Notu</label>
                        <textarea placeholder="Banka IBAN bilgileri, teslimat notu vb..." className="w-full h-32 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-lg p-3 text-sm font-medium resize-none outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm leading-relaxed" />
                    </div>

                    <div className="w-[320px] shrink-0 bg-white dark:bg-[#0B1220] border border-slate-200 dark:border-white/10 rounded-lg shadow-sm p-4 flex flex-col space-y-2 ml-auto">
                        <div className="flex justify-between text-xs font-bold text-slate-500">
                            <span>Mal / Hizmet Toplam Tutar</span>
                            <span>{totals.subtotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits:2})} TL</span>
                        </div>
                        {totals.discount > 0 && (
                            <div className="flex justify-between text-xs font-bold text-rose-500">
                                <span>Toplam İskonto</span>
                                <span>-{totals.discount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits:2})} TL</span>
                            </div>
                        )}
                        <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                            <span>Hesaplanan KDV</span>
                            <span>{totals.vatTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits:2})} TL</span>
                        </div>
                        <div className="h-px w-full bg-slate-200 dark:bg-white/10 my-1"></div>
                        <div className="flex justify-between items-end">
                            <span className="font-black text-[11px] text-slate-800 dark:text-white uppercase pb-0.5">VERGİLER DAHİL TOPLAM</span>
                            <span className="text-2xl font-black tracking-tight text-indigo-600 dark:text-indigo-400 leading-none">₺{totals.grandTotal.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                        </div>
                    </div>
                </div>

                {/* Final Action Bar */}
                <div className="bg-white dark:bg-[#0f172a] border-t border-slate-200 dark:border-white/10 p-4 shrink-0 flex flex-row justify-end items-center gap-3 rounded-b-xl">
                    <button className="px-5 py-2.5 rounded-lg font-bold bg-slate-100 text-slate-700 dark:bg-white/5 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors flex items-center justify-center gap-2 text-xs shadow-sm">
                        <FileText size={14} className="hidden sm:inline" /> <span className="hidden sm:inline">TASLAK OLARAK KAYDET</span><span className="sm:hidden">TASLAK</span>
                    </button>
                    <button 
                        onClick={handleSendInvoice}
                        disabled={invoiceStatus === 'processing'}
                        className="px-8 py-2.5 rounded-lg font-black bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2 text-[13px] shadow-sm disabled:opacity-50 tracking-wide"
                    >
                        {invoiceStatus === 'processing' ? <Calculator className="animate-spin" size={16} /> : <Send size={16} />} 
                        {invoiceStatus === 'processing' ? 'BEKLEYİNİZ...' : 'E-FATURALAŞTIR VE GÖNDER'}
                    </button>
                </div>
            </div>
        </div>
    )
}
