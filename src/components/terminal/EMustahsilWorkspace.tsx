import React, { useState } from 'react';
import { Plus, Trash2, FileText, Send, User, Search, Calculator, CheckCircle2, Clock, Tag } from 'lucide-react';
import { useModal } from '@/contexts/ModalContext';

export default function EMustahsilWorkspace({ products, customers }: any) {
    const { showWarning, showSuccess } = useModal();

    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [customerSearch, setCustomerSearch] = useState('');
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

    const [focusedLineId, setFocusedLineId] = useState<number | null>(null);
    const [productSearchStr, setProductSearchStr] = useState('');

    const [invoiceType, setInvoiceType] = useState('NORMAL'); // NORMAL, HAL
    const [invoiceLines, setInvoiceLines] = useState<any[]>([
        { id: 1, product: null, name: '', qty: 1, unitPrice: 0, gvRate: 0, sgkRate: 0, borsaRate: 0, meraRate: 0 }
    ]);

    const [invoiceStatus, setInvoiceStatus] = useState('draft');

    const [currency, setCurrency] = useState('TRY');
    const [exchangeRate, setExchangeRate] = useState<number>(1);

    const handleAddLine = () => {
        setInvoiceLines([
            ...invoiceLines, 
            { id: Date.now(), product: null, name: '', qty: 1, unitPrice: 0, gvRate: 0, sgkRate: 0, borsaRate: 0, meraRate: 0 }
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
                unitPrice: Number(prod.price || 0)
            } : l));
        }
    };

    // Calculations
    const totals = invoiceLines.reduce((acc, line) => {
        const rowGross = Number(line.qty) * Number(line.unitPrice);
        const rowGv = rowGross * (Number(line.gvRate) / 100);
        const rowSgk = rowGross * (Number(line.sgkRate) / 100);
        const rowBorsa = rowGross * (Number(line.borsaRate) / 100);
        const rowMera = rowGross * (Number(line.meraRate) / 100);
        const rowDeductions = rowGv + rowSgk + rowBorsa + rowMera;
        const rowNet = rowGross - rowDeductions;
        
        return {
            subtotal: acc.subtotal + rowGross,
            gvTotal: acc.gvTotal + rowGv,
            sgkTotal: acc.sgkTotal + rowSgk,
            borsaTotal: acc.borsaTotal + rowBorsa,
            meraTotal: acc.meraTotal + rowMera,
            totalDeductions: acc.totalDeductions + rowDeductions,
            payableTotal: acc.payableTotal + rowNet
        };
    }, { subtotal: 0, gvTotal: 0, sgkTotal: 0, borsaTotal: 0, meraTotal: 0, totalDeductions: 0, payableTotal: 0 });

    const filteredCustomers = customers?.filter((c: any) => c.name?.toLowerCase().includes(customerSearch.toLowerCase())) || [];
    const currSymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '₺';

    const filteredProducts = products?.filter((p: any) => 
        p.name?.toLowerCase().includes(productSearchStr.toLowerCase()) || 
        p.code?.toLowerCase().includes(productSearchStr.toLowerCase())
    ) || [];

    const handleSendInvoice = async () => {
        if (!selectedCustomer) {
            return showWarning("Üretici Seçimi Eksik", "Makbuz düzenleyebilmek için lütfen Müstahsil (Çiftçi) seçiniz.");
        }
        const validLines = invoiceLines.filter(l => l.name);
        if (validLines.length === 0) {
            return showWarning("Makbuz Boş", "Lütfen en az bir kalem ekleyiniz.");
        }

        setInvoiceStatus('processing');
        
        try {
            const res = await fetch('/api/nilvera/emustahsil', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer: selectedCustomer,
                    lines: validLines,
                    currency,
                    exchangeRate
                })
            });
            const data = await res.json();
            
            if (data.success) {
                setInvoiceStatus('sent');
                showSuccess("E-Müstahsil Makbuzu Başarıyla İletildi", `Belge Numarası: ${new Date().getFullYear()}${(Math.random().toString(36).substring(2, 8).toUpperCase())}`);
            } else {
                setInvoiceStatus('draft');
                showWarning("Hata Oluştu", data.error || "Makbuz oluşturulamadı.");
            }
        } catch (err: any) {
            setInvoiceStatus('draft');
            showWarning("Bağlantı Hatası", err.message);
        }
    };

    if (invoiceStatus === 'sent') {
        return (
            <div className="flex-1 w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl flex flex-col items-center justify-center m-6 p-8">
                <CheckCircle2 size={80} strokeWidth={1} className="text-emerald-500 mb-6" />
                <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">E-Müstahsil Makbuzu Düzenlendi</h2>
                <p className="text-slate-500 font-medium mb-8 text-center max-w-md">Belge başarıyla GİB portalına iletilmek üzere sıraya alındı.</p>
                <div className="space-x-4">
                    <button className="px-6 py-3 bg-white border border-slate-200 rounded-xl font-bold shadow-sm" onClick={() => { setInvoiceStatus('draft'); setInvoiceLines([{ id: 1, product: null, name: '', qty: 1, unitPrice: 0, gvRate: 0, sgkRate: 0, borsaRate: 0, meraRate: 0 }]); setSelectedCustomer(null); }}>YENİ MAKBUZ</button>
                    <button className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-md hover:bg-indigo-700">PDF OLARAK İNDİR</button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 w-full flex flex-col min-h-0 bg-[#F4F6F8] dark:bg-[#0B1220] p-2 lg:p-4 overflow-y-auto custom-scrollbar">
            <div className="w-full bg-white dark:bg-[#0f172a] rounded-xl shadow border border-[#D6DAE1] dark:border-white/10 flex flex-col mb-4">
                <div className="p-4 lg:p-5 border-b border-slate-200 dark:border-white/5 grid grid-cols-1 lg:grid-cols-2 gap-6 bg-slate-50/30 dark:bg-white/[0.01] rounded-t-xl">
                    <div className="flex-1 max-w-md relative">
                        <label className="text-[11px] font-black tracking-widest text-[#059669] dark:text-[#34d399] uppercase block mb-3">ÇİFTÇİ / MÜSTAHSİL (SATICI)</label>
                        {!selectedCustomer ? (
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input 
                                    placeholder="Üretici Ad Soyad veya TC/VKN Ara..." 
                                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-[#0f172a] border-l-4 border-l-emerald-500 border border-slate-200 dark:border-white/10 rounded-xl font-bold text-sm outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm"
                                    value={customerSearch}
                                    onChange={(e) => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true); }}
                                    onFocus={() => setShowCustomerDropdown(true)}
                                />
                                {showCustomerDropdown && (
                                    <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl shadow-xl max-h-[300px] overflow-y-auto py-2">
                                        <div className="px-3 py-1.5 text-xs font-bold text-slate-400">Son Kullanılan Üreticiler</div>
                                        {filteredCustomers.slice(0, 10).map((c: any) => (
                                            <div 
                                                key={c.id} 
                                                onClick={() => { setSelectedCustomer(c); setShowCustomerDropdown(false); setCustomerSearch(''); }}
                                                className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer flex flex-col transition-colors border-b border-slate-50 dark:border-white/5 last:border-0"
                                            >
                                                <span className="font-bold text-slate-800 dark:text-white text-[13px] leading-tight">{c.name}</span>
                                                <span className="text-[11px] text-slate-500 mt-1 uppercase">TC/VKN: {c.taxNumber || 'Tanımsız'}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-xl p-4 shadow-sm relative group cursor-pointer" onClick={() => setSelectedCustomer(null)}>
                                <div className="absolute inset-0 bg-rose-50 dark:bg-rose-500/10 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity border border-rose-200 dark:border-rose-500/30">
                                    <span className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2"><Trash2 size={16} /> Üreticiyi Değiştir</span>
                                </div>
                                <div className="group-hover:opacity-0 transition-opacity">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                                            <User size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-slate-900 dark:text-white leading-tight pr-4">{selectedCustomer.name}</h3>
                                            <p className="text-[11px] text-slate-500 font-medium mt-1">TC/VKN: <span className="font-bold">{selectedCustomer.taxNumber || 'Belirtilmemiş'}</span></p>
                                        </div>
                                    </div>
                                    <div className="mt-3 text-[11px] text-slate-500 leading-relaxed border-t border-slate-100 dark:border-white/5 pt-3">
                                        {selectedCustomer.address || 'Adres bilgisi eksik.'}
                                        <br/>{selectedCustomer.district} / {selectedCustomer.city}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col items-end gap-4 ml-auto w-full lg:w-auto mt-4 lg:mt-0">
                        <div className="flex flex-row items-center justify-end gap-3 sm:gap-6 text-left flex-wrap">
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Belge Tipi</label>
                                <span className="font-black text-[13px] text-emerald-600 dark:text-emerald-400">E-MÜSTAHSİL MAKBUZU</span>
                            </div>
                            <div className="h-8 w-px bg-slate-200 dark:bg-white/10 mx-1"></div>
                            
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Döviz</label>
                                <select 
                                    value={currency}
                                    onChange={(e) => {
                                        setCurrency(e.target.value);
                                        if (e.target.value === 'USD') setExchangeRate(32.4501);
                                        else if (e.target.value === 'EUR') setExchangeRate(35.1240);
                                        else if (e.target.value === 'GBP') setExchangeRate(41.0520);
                                        else setExchangeRate(1);
                                    }}
                                    className="font-black text-[11px] px-2 py-1 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 rounded border border-amber-200 dark:border-amber-500/20 w-max outline-none cursor-pointer focus:ring-2 focus:ring-amber-500/30 transition-shadow transition-colors"
                                >
                                    <option value="TRY">TRY</option>
                                    <option value="USD">USD</option>
                                    <option value="EUR">EUR</option>
                                </select>
                            </div>
                            {currency !== 'TRY' && (
                                <>
                                    <div className="h-8 w-px bg-slate-200 dark:bg-white/10 mx-1 hidden sm:block"></div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">TCMB Kuru</label>
                                        <input 
                                            type="number" step="0.0001" 
                                            value={exchangeRate} 
                                            onChange={(e) => setExchangeRate(Number(e.target.value))}
                                            className="w-20 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded px-1.5 py-1 text-[11px] font-bold outline-none focus:ring-1 focus:ring-emerald-500 text-center" 
                                        />
                                    </div>
                                </>
                            )}
                            <div className="h-8 w-px bg-slate-200 dark:bg-white/10 mx-1"></div>

                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Düzenlenme Tarihi</label>
                                <span className="font-bold text-xs text-slate-800 dark:text-white leading-tight">{new Date().toLocaleDateString('tr-TR')} {new Date().toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})}</span>
                            </div>
                            <div className="h-8 w-px bg-slate-200 dark:bg-white/10 hidden sm:block"></div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Şube / Kasa</label>
                                <span className="font-bold text-xs text-slate-800 dark:text-white leading-tight">Merkez (Online)</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto w-full min-h-[300px]">
                    <table className="w-full text-left border-collapse min-w-[750px] relative z-10">
                        <thead>
                            <tr className="bg-slate-100/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-white/5 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                <th className="p-3 w-10 text-center">#</th>
                                <th className="p-3">Hizmet / Tarımsal Ürün Adı</th>
                                <th className="p-3 w-24">Miktar(Kg/Ad)</th>
                                <th className="p-3 w-28 text-right">Birim Fiyat</th>
                                <th className="p-3 w-20 text-center">GV(%)</th>
                                <th className="p-3 w-20 text-center">SGK(%)</th>
                                <th className="p-3 w-20 text-center">Borsa(%)</th>
                                <th className="p-3 w-20 text-center">Mera(%)</th>
                                <th className="p-3 w-28 text-right">Brüt Tutar</th>
                                <th className="p-3 w-10 text-center"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {invoiceLines.map((line, index) => {
                                const rowGross = line.qty * line.unitPrice;
                                
                                return (
                                    <tr key={line.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors relative">
                                        <td className="p-2 text-center font-bold text-slate-400 text-xs align-top pt-4">
                                            {index + 1}
                                        </td>
                                        <td className="p-2 align-top">
                                            <div className="relative pt-2">
                                                <input 
                                                    type="text"
                                                    value={focusedLineId === line.id ? productSearchStr : line.name}
                                                    onChange={(e) => {
                                                        if (focusedLineId === line.id) {
                                                            setProductSearchStr(e.target.value);
                                                            updateLine(line.id, 'name', e.target.value);
                                                        } else {
                                                            updateLine(line.id, 'name', e.target.value);
                                                        }
                                                    }}
                                                    onFocus={() => {
                                                        setFocusedLineId(line.id);
                                                        setProductSearchStr(line.name || '');
                                                    }}
                                                    onBlur={() => {
                                                        setTimeout(() => {
                                                            if (focusedLineId === line.id) setFocusedLineId(null);
                                                        }, 250);
                                                    }}
                                                    className="w-full bg-transparent font-bold text-slate-800 dark:text-white text-xs outline-none border-b border-transparent focus:border-emerald-500 pb-1"
                                                    placeholder="Örn: Buğday, Arpa, Süt..."
                                                />
                                                <div className="text-[9px] mt-1 space-x-2 font-medium">
                                                    <span className="text-slate-400 cursor-pointer hover:text-emerald-500" onClick={() => {
                                                        setFocusedLineId(line.id); 
                                                        setProductSearchStr('');
                                                    }}>🔍 Stok Arama</span>
                                                </div>
                                                {focusedLineId === line.id && productSearchStr.length >= 2 && (
                                                    <div className="absolute z-50 left-0 top-full mt-1 w-full min-w-[280px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl shadow-xl max-h-[250px] overflow-y-auto py-2">
                                                        <div className="px-3 py-1 text-xs font-bold text-slate-400 border-b border-slate-100 dark:border-white/5">Stok Kartları</div>
                                                        {filteredProducts.map((p: any) => (
                                                            <div 
                                                                key={p.id} 
                                                                onClick={() => {
                                                                    handleProductSelect(line.id, p.id);
                                                                    setFocusedLineId(null);
                                                                }}
                                                                className="px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer flex flex-col transition-colors border-b border-slate-50 dark:border-white/5"
                                                            >
                                                                <span className="font-bold text-slate-800 dark:text-white text-[11px] leading-tight flex justify-between">
                                                                    <span>{p.name}</span>
                                                                    <span className="text-emerald-600 dark:text-emerald-400">₺{Number(p.price || 0).toLocaleString()}</span>
                                                                </span>
                                                            </div>
                                                        ))}
                                                        {filteredProducts.length === 0 && <div className="px-3 py-3 text-xs text-slate-500 text-center">Sonuç bulunamadı.</div>}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-2 align-top pt-3">
                                            <input type="number" min="1" value={line.qty || ''} onChange={(e) => updateLine(line.id, 'qty', Number(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded px-2 py-1.5 text-xs font-bold text-center outline-none focus:ring-1 focus:ring-emerald-500" />
                                        </td>
                                        <td className="p-2 align-top pt-3">
                                            <input type="number" min="0" value={line.unitPrice || ''} onChange={(e) => updateLine(line.id, 'unitPrice', Number(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded px-2 py-1.5 text-xs font-bold text-right outline-none focus:ring-1 focus:ring-emerald-500" />
                                        </td>
                                        <td className="p-2 align-top pt-3">
                                            <select value={line.gvRate} onChange={(e) => updateLine(line.id, 'gvRate', Number(e.target.value))} className="w-full bg-transparent border-b border-slate-200 dark:border-white/20 py-1.5 text-[11px] font-bold outline-none focus:border-emerald-500 cursor-pointer text-center">
                                                <option value="0">%0</option>
                                                <option value="1">%1</option>
                                                <option value="2">%2</option>
                                                <option value="4">%4</option>
                                            </select>
                                        </td>
                                        <td className="p-2 align-top pt-3">
                                            <select value={line.sgkRate} onChange={(e) => updateLine(line.id, 'sgkRate', Number(e.target.value))} className="w-full bg-transparent border-b border-slate-200 dark:border-white/20 py-1.5 text-[11px] font-bold outline-none focus:border-emerald-500 cursor-pointer text-center text-rose-500 text-rose-500">
                                                <option value="0">%0</option>
                                                <option value="1">%1</option>
                                                <option value="2">%2</option>
                                                <option value="3">%3</option>
                                            </select>
                                        </td>
                                        <td className="p-2 align-top pt-3">
                                            <select value={line.borsaRate} onChange={(e) => updateLine(line.id, 'borsaRate', Number(e.target.value))} className="w-full bg-transparent border-b border-slate-200 dark:border-white/20 py-1.5 text-[11px] font-bold outline-none focus:border-emerald-500 cursor-pointer text-center text-amber-600">
                                                <option value="0">%0</option>
                                                <option value="0.1">%0.1</option>
                                                <option value="0.2">%0.2</option>
                                            </select>
                                        </td>
                                        <td className="p-2 align-top pt-3">
                                            <select value={line.meraRate} onChange={(e) => updateLine(line.id, 'meraRate', Number(e.target.value))} className="w-full bg-transparent border-b border-slate-200 dark:border-white/20 py-1.5 text-[11px] font-bold outline-none focus:border-emerald-500 cursor-pointer text-center">
                                                <option value="0">%0</option>
                                                <option value="0.1">%0.1</option>
                                            </select>
                                        </td>
                                        <td className="p-2 text-right align-top pt-4 font-black text-slate-800 dark:text-white text-xs">
                                            {rowGross.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
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

                    <div className="p-3 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-white/5 relative z-0">
                        <button onClick={handleAddLine} className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 px-3 py-1.5 rounded transition-colors border border-dashed border-emerald-200 dark:border-emerald-500/30 flex items-center gap-1.5">
                            <Plus size={14} strokeWidth={3} /> YENİ KALEM EKLE
                        </button>
                    </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900 border-t items-start border-slate-200 dark:border-white/10 p-5 lg:p-6 flex flex-row justify-between gap-6 w-full min-w-min">
                    
                    <div className="flex-1 max-w-xl">
                        <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-widest mb-1.5">Makbuz Alt Notu / Açıklama</label>
                        <textarea placeholder="Kesinti açıklamaları vs..." className="w-full h-32 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-lg p-3 text-sm font-medium resize-none outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm leading-relaxed" />
                    </div>

                    <div className="w-[320px] shrink-0 bg-white dark:bg-[#0B1220] border border-slate-200 dark:border-white/10 rounded-lg shadow-sm p-4 flex flex-col space-y-2 ml-auto">
                        <div className="flex justify-between text-xs font-bold text-slate-500">
                            <span>Müstahsil Brüt Tutar</span>
                            <span>{currSymbol}{totals.subtotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits:2})}</span>
                        </div>
                        <div className="h-px w-full bg-slate-100 dark:bg-white/5 my-0.5"></div>
                        {totals.gvTotal > 0 && (
                            <div className="flex justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400">
                                <span>(-) Gelir Vergisi (Stopaj)</span>
                                <span>-{currSymbol}{totals.gvTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits:2})}</span>
                            </div>
                        )}
                        {totals.sgkTotal > 0 && (
                            <div className="flex justify-between text-[11px] font-bold text-rose-500">
                                <span>(-) Bağ-Kur / SGK Kesintisi</span>
                                <span>-{currSymbol}{totals.sgkTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits:2})}</span>
                            </div>
                        )}
                        {totals.borsaTotal > 0 && (
                            <div className="flex justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400">
                                <span>(-) Borsa Tescil Ücreti</span>
                                <span>-{currSymbol}{totals.borsaTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits:2})}</span>
                            </div>
                        )}
                        {totals.meraTotal > 0 && (
                            <div className="flex justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400">
                                <span>(-) Mera Fonu</span>
                                <span>-{currSymbol}{totals.meraTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits:2})}</span>
                            </div>
                        )}
                        <div className="h-px w-full bg-slate-200 dark:bg-white/10 my-1"></div>
                        <div className="flex justify-between items-end">
                            <span className="font-black text-[11px] text-slate-800 dark:text-white uppercase pb-0.5" title="Net Üreticiye Ödenecek Tutar">ÇİFTÇİYE ÖDENECEK NET</span>
                            <span className="text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400 leading-none">{currSymbol}{totals.payableTotal.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                        </div>
                        {currency !== 'TRY' && (
                            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800 p-2 rounded -mx-2 mt-2 border border-slate-100 dark:border-white/5">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Sistem (TL) Karşılığı</span>
                                <span className="text-xs font-black text-slate-700 dark:text-slate-300">₺{(totals.payableTotal * exchangeRate).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white dark:bg-[#0f172a] border-t border-slate-200 dark:border-white/10 p-4 shrink-0 flex flex-col sm:flex-row justify-between items-center gap-4 rounded-b-xl relative z-10 w-full overflow-visible">
                    {/* Payment Method Selector for E-Mustahsil */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                        <div className="flex flex-col text-left">
                            <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest leading-none">Para Çıkış Yönü</span>
                            <span className="text-sm font-black text-rose-700 dark:text-rose-400 mt-1">Üreticiye Ödeme Devri</span>
                        </div>
                        <div className="h-8 w-px bg-slate-200 dark:bg-white/10 hidden sm:block mx-1"></div>
                        <div className="flex bg-rose-50/50 dark:bg-rose-950/20 p-1.5 rounded-xl border border-rose-100 dark:border-rose-900/30 gap-1.5 w-full sm:w-auto overflow-x-auto">
                            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-500 text-white shadow-sm font-bold text-xs">
                                <FileText size={14} /> Nakit Ödeme
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-transparent text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 hover:shadow-sm font-bold text-xs transition-colors">
                                <Tag size={14} /> Hesaba Havale
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-transparent text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 hover:shadow-sm font-bold text-xs transition-colors">
                                <Clock size={14} /> Cari Vade
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-row gap-3 w-full sm:w-auto justify-end">
                        <button className="px-5 py-2.5 rounded-lg font-bold bg-slate-100 text-slate-700 dark:bg-white/5 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors flex items-center justify-center gap-2 text-xs shadow-sm">
                            <FileText size={14} className="hidden sm:inline" /> <span className="hidden sm:inline">TASLAK OLARAK KAYDET</span><span className="sm:hidden">TASLAK</span>
                        </button>
                        <button 
                            onClick={handleSendInvoice}
                            disabled={invoiceStatus === 'processing'}
                            className="px-8 py-2.5 rounded-lg font-black bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 text-[13px] shadow-sm disabled:opacity-50 tracking-wide"
                        >
                            {invoiceStatus === 'processing' ? <Calculator className="animate-spin" size={16} /> : <Send size={16} />} 
                            {invoiceStatus === 'processing' ? 'BEKLEYİNİZ...' : 'E-MÜSTAHSİL OLUŞTUR'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
