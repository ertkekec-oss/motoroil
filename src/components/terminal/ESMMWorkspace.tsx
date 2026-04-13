import React, { useState } from 'react';
import { Plus, Trash2, FileText, Send, User, Search, Calculator, CheckCircle2, RefreshCw, Clock, Tag } from 'lucide-react';
import { useModal } from '@/contexts/ModalContext';

export default function ESMMWorkspace({ products, customers }: any) {
    const { showWarning, showSuccess } = useModal();

    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [customerSearch, setCustomerSearch] = useState('');
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

    // Calc mode can be globally applied or per line. Let's do per line for maximum flexibility.
    const [invoiceLines, setInvoiceLines] = useState<any[]>([
        { id: 1, name: '', amount: 0, calcMode: 'brut', gvRate: 20, vatRate: 20 }
    ]);

    const [invoiceStatus, setInvoiceStatus] = useState('draft');
    const [currency, setCurrency] = useState('TRY');
    const [exchangeRate, setExchangeRate] = useState<number>(1);

    const handleAddLine = () => {
        setInvoiceLines([
            ...invoiceLines, 
            { id: Date.now(), name: '', amount: 0, calcMode: 'brut', gvRate: 20, vatRate: 20 }
        ]);
    };

    const handleRemoveLine = (id: number) => {
        if (invoiceLines.length === 1) return;
        setInvoiceLines(invoiceLines.filter(l => l.id !== id));
    };

    const updateLine = (id: number, field: string, value: any) => {
        setInvoiceLines(invoiceLines.map(l => l.id === id ? { ...l, [field]: value } : l));
    };

    // --- CALCULATIONS ---
    const totals = invoiceLines.reduce((acc, line) => {
        let brut = 0;
        let net = 0;
        
        const gvFactor = Number(line.gvRate) / 100;
        const vatFactor = Number(line.vatRate) / 100;
        const inputAmount = Number(line.amount) || 0;

        if (line.calcMode === 'brut') {
            brut = inputAmount;
            // Net = Brut + KDV - Stopaj
            net = brut + (brut * vatFactor) - (brut * gvFactor);
        } else {
            net = inputAmount;
            // Brut = Net / (1 + KDV - Stopaj)
            // Example: KDV 20, Stopaj 20 => Net = Brut * (1 + 0.2 - 0.2) = Brut * 1 => Brut = Net
            const divisor = (1 + vatFactor - gvFactor);
            brut = divisor === 0 ? 0 : net / divisor; // Handle edge case if divisor is 0, practically impossible unless KDV=0, GV=100
        }

        const rowGv = brut * gvFactor;
        const rowVat = brut * vatFactor;

        return {
            brutTotal: acc.brutTotal + brut,
            gvTotal: acc.gvTotal + rowGv,
            vatTotal: acc.vatTotal + rowVat,
            netTotal: acc.netTotal + net
        };
    }, { brutTotal: 0, gvTotal: 0, vatTotal: 0, netTotal: 0 });

    const filteredCustomers = customers?.filter((c: any) => c.name?.toLowerCase().includes(customerSearch.toLowerCase())) || [];
    const currSymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '₺';

    const handleSendInvoice = async () => {
        if (!selectedCustomer) {
            return showWarning("Müşteri Seçimi Eksik", "Makbuz düzenleyebilmek için lütfen alıcı seçiniz.");
        }
        const validLines = invoiceLines.filter(l => l.name);
        if (validLines.length === 0 || totals.brutTotal === 0) {
            return showWarning("Makbuz Boş", "Lütfen en az bir hizmet ekleyiniz ve tutar giriniz.");
        }

        setInvoiceStatus('processing');
        
        try {
            const res = await fetch('/api/nilvera/esmm', {
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
                showSuccess("E-SMM Başarıyla İletildi", `Belge Numarası: SMM${new Date().getFullYear()}${(Math.random().toString(36).substring(2, 8).toUpperCase())}`);
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
                <CheckCircle2 size={80} strokeWidth={1} className="text-purple-500 mb-6" />
                <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">E-SMM Düzenlendi</h2>
                <p className="text-slate-500 font-medium mb-8 text-center max-w-md">Serbest Meslek Makbuzunuz başarıyla oluşturuldu ve GİB portalına iletilmek üzere kuyruğa eklendi.</p>
                <div className="space-x-4">
                    <button className="px-6 py-3 bg-white border border-slate-200 rounded-xl font-bold shadow-sm" onClick={() => { setInvoiceStatus('draft'); setInvoiceLines([{ id: 1, name: '', amount: 0, calcMode: 'brut', gvRate: 20, vatRate: 20 }]); setSelectedCustomer(null); }}>YENİ E-SMM</button>
                    <button className="px-6 py-3 bg-purple-600 text-white rounded-xl font-bold shadow-md hover:bg-purple-700">PDF OLARAK İNDİR</button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 w-full flex flex-col min-h-0 bg-[#F4F6F8] dark:bg-[#0B1220] p-2 lg:p-4 overflow-y-auto custom-scrollbar">
            <div className="w-full bg-white dark:bg-[#0f172a] rounded-xl shadow border border-[#D6DAE1] dark:border-white/10 flex flex-col mb-4">
                
                {/* Header Section */}
                <div className="p-4 lg:p-5 border-b border-slate-200 dark:border-white/5 grid grid-cols-1 lg:grid-cols-2 gap-6 bg-slate-50/30 dark:bg-white/[0.01] rounded-t-xl">
                    <div className="flex-1 max-w-md relative">
                        <label className="text-[11px] font-black tracking-widest text-purple-600 dark:text-purple-400 uppercase block mb-3">MÜŞTERİ / ALICI</label>
                        {!selectedCustomer ? (
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input 
                                    placeholder="Firma Ünvanı veya Müşteri Adı Ara..." 
                                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-[#0f172a] border-l-4 border-l-purple-500 border border-slate-200 dark:border-white/10 rounded-xl font-bold text-sm outline-none focus:ring-4 focus:ring-purple-500/10 transition-all shadow-sm"
                                    value={customerSearch}
                                    onChange={(e) => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true); }}
                                    onFocus={() => setShowCustomerDropdown(true)}
                                />
                                {showCustomerDropdown && (
                                    <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl shadow-xl max-h-[300px] overflow-y-auto py-2">
                                        <div className="px-3 py-1.5 text-xs font-bold text-slate-400">Son Kullanılanlar</div>
                                        {filteredCustomers.slice(0, 10).map((c: any) => (
                                            <div 
                                                key={c.id} 
                                                onClick={() => { setSelectedCustomer(c); setShowCustomerDropdown(false); setCustomerSearch(''); }}
                                                className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer flex flex-col transition-colors border-b border-slate-50 dark:border-white/5 last:border-0"
                                            >
                                                <span className="font-bold text-slate-800 dark:text-white text-[13px] leading-tight">{c.name}</span>
                                                <span className="text-[11px] text-slate-500 mt-1 uppercase">VKN/TC: {c.taxNumber || 'Tanımsız'}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-xl p-4 shadow-sm relative group cursor-pointer" onClick={() => setSelectedCustomer(null)}>
                                <div className="absolute inset-0 bg-rose-50 dark:bg-rose-500/10 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity border border-rose-200 dark:border-rose-500/30">
                                    <span className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2"><Trash2 size={16} /> Değiştir</span>
                                </div>
                                <div className="group-hover:opacity-0 transition-opacity">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-purple-50 dark:bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                                            <User size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-slate-900 dark:text-white leading-tight pr-4">{selectedCustomer.name}</h3>
                                            <p className="text-[11px] text-slate-500 font-medium mt-1">VKN: <span className="font-bold">{selectedCustomer.taxNumber || 'Belirtilmemiş'}</span></p>
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
                                <span className="font-black text-[13px] text-purple-600 dark:text-purple-400">E-SERBEST MESLEK MAKBUZU</span>
                            </div>
                            <div className="h-8 w-px bg-slate-200 dark:bg-white/10 mx-1"></div>
                            
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Para Birimi</label>
                                <select 
                                    value={currency}
                                    onChange={(e) => {
                                        setCurrency(e.target.value);
                                        if (e.target.value === 'USD') setExchangeRate(32.4501);
                                        else if (e.target.value === 'EUR') setExchangeRate(35.1240);
                                        else if (e.target.value === 'GBP') setExchangeRate(41.0520);
                                        else setExchangeRate(1);
                                    }}
                                    className="font-black text-[11px] px-2 py-1 bg-slate-100 text-slate-700 dark:bg-white/5 dark:text-slate-300 rounded border border-slate-200 dark:border-white/10 w-max outline-none cursor-pointer focus:ring-2 focus:ring-purple-500/30 transition-shadow transition-colors"
                                >
                                    <option value="TRY">TRY</option>
                                    <option value="USD">USD</option>
                                    <option value="EUR">EUR</option>
                                </select>
                            </div>
                            <div className="h-8 w-px bg-slate-200 dark:bg-white/10 mx-1"></div>

                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Düzenlenme</label>
                                <span className="font-bold text-xs text-slate-800 dark:text-white leading-tight">{new Date().toLocaleDateString('tr-TR')} {new Date().toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="overflow-x-auto w-full min-h-[300px]">
                    <table className="w-full text-left border-collapse min-w-[750px] relative z-10">
                        <thead>
                            <tr className="bg-slate-100/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-white/5 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                <th className="p-3 w-10 text-center">#</th>
                                <th className="p-3">Hizmet Açıklaması</th>
                                <th className="p-3 w-32 text-center" title="Hangi tutar üzerinden hesaplanacağı">Hesap Tipi</th>
                                <th className="p-3 w-36 text-right">Girilen Tutar</th>
                                <th className="p-3 w-20 text-center">GV (%)</th>
                                <th className="p-3 w-20 text-center">KDV (%)</th>
                                <th className="p-3 w-36 text-right text-purple-600 dark:text-purple-400">Çıkan Sonuç</th>
                                <th className="p-3 w-10 text-center"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {invoiceLines.map((line, index) => {
                                // Real-time preview of the outcome
                                let brut = 0;
                                let net = 0;
                                const gvF = Number(line.gvRate) / 100;
                                const vatF = Number(line.vatRate) / 100;
                                const amt = Number(line.amount) || 0;

                                if (line.calcMode === 'brut') {
                                    brut = amt;
                                    net = brut + (brut * vatF) - (brut * gvF);
                                } else {
                                    net = amt;
                                    const div = (1 + vatF - gvF);
                                    brut = div === 0 ? 0 : net / div;
                                }

                                const previewValue = line.calcMode === 'brut' ? net : brut;
                                const previewLabel = line.calcMode === 'brut' ? 'Net:' : 'Brüt:';

                                return (
                                    <tr key={line.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors relative">
                                        <td className="p-2 text-center font-bold text-slate-400 text-xs align-top pt-4">
                                            {index + 1}
                                        </td>
                                        <td className="p-2 align-top pt-2">
                                            <input 
                                                type="text"
                                                value={line.name}
                                                onChange={(e) => updateLine(line.id, 'name', e.target.value)}
                                                className="w-full bg-transparent font-bold text-slate-800 dark:text-white text-xs outline-none border-b border-transparent focus:border-purple-500 pb-1 pt-1.5"
                                                placeholder="Örn: Haziran Ayı Mali Müşavirlik Hizmeti"
                                            />
                                        </td>
                                        <td className="p-2 align-top pt-3">
                                            <select 
                                                value={line.calcMode} 
                                                onChange={(e) => updateLine(line.id, 'calcMode', e.target.value)} 
                                                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 py-1.5 text-[10px] font-black uppercase tracking-widest outline-none focus:border-purple-500 cursor-pointer text-center rounded text-slate-600 dark:text-slate-300"
                                            >
                                                <option value="brut">Brütten</option>
                                                <option value="net">Netten</option>
                                            </select>
                                        </td>
                                        <td className="p-2 align-top pt-3">
                                            <input 
                                                type="number" min="0" 
                                                value={line.amount || ''} 
                                                onChange={(e) => updateLine(line.id, 'amount', Number(e.target.value))} 
                                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded px-2 py-1.5 text-xs font-bold text-right outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500" 
                                                placeholder="0.00"
                                            />
                                        </td>
                                        <td className="p-2 align-top pt-3">
                                            <select value={line.gvRate} onChange={(e) => updateLine(line.id, 'gvRate', Number(e.target.value))} className="w-full bg-transparent border-b border-slate-200 dark:border-white/20 py-1.5 text-[11px] font-bold outline-none focus:border-purple-500 cursor-pointer text-center">
                                                <option value="20">%20</option>
                                                <option value="10">%10</option>
                                                <option value="0">%0</option>
                                            </select>
                                        </td>
                                        <td className="p-2 align-top pt-3">
                                            <select value={line.vatRate} onChange={(e) => updateLine(line.id, 'vatRate', Number(e.target.value))} className="w-full bg-transparent border-b border-slate-200 dark:border-white/20 py-1.5 text-[11px] font-bold outline-none focus:border-purple-500 cursor-pointer text-center">
                                                <option value="20">%20</option>
                                                <option value="10">%10</option>
                                                <option value="1">%1</option>
                                                <option value="0">%0</option>
                                            </select>
                                        </td>
                                        <td className="p-2 text-right align-top pt-3">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">{previewLabel}</span>
                                                <span className={`font-black text-xs ${line.calcMode === 'brut' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-200'}`}>
                                                    {previewValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                                </span>
                                            </div>
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

                    <div className="p-3 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-white/5 relative z-0 flex justify-between items-center">
                        <button onClick={handleAddLine} className="text-[11px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 hover:bg-purple-100 dark:hover:bg-purple-500/20 px-3 py-1.5 rounded transition-colors border border-dashed border-purple-200 dark:border-purple-500/30 flex items-center gap-1.5">
                            <Plus size={14} strokeWidth={3} /> YENİ HİZMET EKLE
                        </button>
                        <div className="text-[10px] font-medium text-slate-400 flex items-center gap-1.5">
                            <RefreshCw size={12} /> Serbest Meslek Makbuzunda Tahsil Edilen Net = Brüt + KDV - Stopaj Formülü Uygulanır
                        </div>
                    </div>
                </div>

                {/* Footer Section (Calculations & Totals) */}
                <div className="bg-slate-50 dark:bg-slate-900 border-t items-start border-slate-200 dark:border-white/10 p-5 lg:p-6 flex flex-row justify-between gap-6 w-full min-w-min">
                    
                    <div className="flex-1 max-w-xl">
                        <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-widest mb-1.5">Açıklama / IBAN Bilgileri</label>
                        <textarea placeholder="Ödemenin yapılacağı hesap bilgileri vb..." className="w-full h-32 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-lg p-3 text-sm font-medium resize-none outline-none focus:ring-1 focus:ring-purple-500 shadow-sm leading-relaxed" />
                    </div>

                    <div className="w-[320px] shrink-0 bg-white dark:bg-[#0B1220] border border-slate-200 dark:border-white/10 rounded-lg shadow-sm p-4 flex flex-col space-y-2 ml-auto">
                        <div className="flex justify-between text-[11px] font-bold text-slate-500">
                            <span>Brüt Ücret (Hizmet Bedeli)</span>
                            <span>{currSymbol}{totals.brutTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits:2})}</span>
                        </div>
                        {totals.gvTotal > 0 && (
                            <div className="flex justify-between text-[11px] font-bold text-rose-500">
                                <span>(-) Gelir Vergisi (Stopaj)</span>
                                <span>-{currSymbol}{totals.gvTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits:2})}</span>
                            </div>
                        )}
                        {totals.vatTotal > 0 && (
                            <div className="flex justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                <span className="text-emerald-600 dark:text-emerald-400">(+) KDV Hesaplanan</span>
                                <span>+{currSymbol}{totals.vatTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits:2})}</span>
                            </div>
                        )}
                        <div className="h-px w-full bg-slate-200 dark:bg-white/10 my-1"></div>
                        <div className="flex justify-between items-end">
                            <span className="font-black text-[11px] text-slate-800 dark:text-white uppercase pb-0.5" title="Cebinize girecek asıl tutar">TAHSİL EDİLECEK NET</span>
                            <span className="text-2xl font-black tracking-tight text-purple-600 dark:text-purple-400 leading-none">{currSymbol}{totals.netTotal.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                        </div>
                    </div>
                </div>

                {/* Final Action Bar with Payment Methods */}
                <div className="bg-white dark:bg-[#0f172a] border-t border-slate-200 dark:border-white/10 p-4 shrink-0 flex flex-col sm:flex-row justify-between items-center gap-4 rounded-b-xl relative z-10 w-full overflow-visible">
                    
                    {/* Payment Method Selector for ESMM */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                        <div className="flex flex-col text-left">
                            <span className="text-[10px] font-black text-purple-500 uppercase tracking-widest leading-none">Para Giriş Yönü</span>
                            <span className="text-sm font-black text-purple-700 dark:text-purple-400 mt-1">Makbuz Tahsilatı</span>
                        </div>
                        <div className="h-8 w-px bg-slate-200 dark:bg-white/10 hidden sm:block mx-1"></div>
                        <div className="flex bg-purple-50/50 dark:bg-purple-900/10 p-1.5 rounded-xl border border-purple-100 dark:border-purple-900/30 gap-1.5 w-full sm:w-auto overflow-x-auto">
                            <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-transparent text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 hover:shadow-sm font-bold text-xs transition-colors min-w-max">
                                <FileText size={14} /> Nakit
                            </button>
                            <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-500 text-white shadow-sm font-bold text-xs min-w-max">
                                <Tag size={14} /> Havale
                            </button>
                            <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-transparent text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 hover:shadow-sm font-bold text-xs transition-colors min-w-max">
                                <Clock size={14} /> CariHesap
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
                            className="px-8 py-2.5 rounded-lg font-black bg-purple-600 text-white hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 text-[13px] shadow-sm disabled:opacity-50 tracking-wide"
                        >
                            {invoiceStatus === 'processing' ? <Calculator className="animate-spin" size={16} /> : <Send size={16} />} 
                            {invoiceStatus === 'processing' ? 'BEKLEYİNİZ...' : 'E-SMM OLUŞTUR'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
