
"use client";

interface NewWayslipModalProps {
    view: string;
    setView: (view: 'list' | 'new_wayslip') => void;
    newWayslipData: any;
    setNewWayslipData: (data: any) => void;
    customers: any[];
    suppliers: any[];
    inventoryProducts: any[];
    handleSaveWayslip: () => void;
    isSavingWayslip: boolean;
    realInvoices?: any[];
}

export function NewWayslipModal({
    view,
    setView,
    newWayslipData,
    setNewWayslipData,
    customers,
    suppliers,
    inventoryProducts,
    handleSaveWayslip,
    isSavingWayslip,
    realInvoices
}: NewWayslipModalProps) {
    if (view !== 'new_wayslip') return null;

    const unfactoredInvoices = realInvoices?.filter(i => 
        i.customerId === newWayslipData.customerId && 
        i.formalType !== 'EIRSALIYE' &&
        !(i.description || '').includes('[İrsaliyeli]')
    ) || [];

    const handleSelectInvoice = (invoiceId: string) => {
        if (!invoiceId) {
            setNewWayslipData({ ...newWayslipData, relatedInvoiceId: undefined, relatedInvoiceNo: undefined, items: [] });
            return;
        }
        const inv = unfactoredInvoices.find(i => i.id === invoiceId);
        if (inv) {
            setNewWayslipData({
                ...newWayslipData,
                relatedInvoiceId: inv.id,
                relatedInvoiceNo: inv.invoiceNo,
                items: Array.isArray(inv.items) ? inv.items.map((it:any) => ({...it})) : []
            });
        }
    };

    return (

        <div style={{ position: 'fixed', inset: 0, zIndex: 1000 }} className="flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[24px] shadow-2xl w-full max-w-2xl relative animate-in zoom-in-95 duration-200 flex flex-col overflow-hidden max-h-[90vh]">
                
                {/* Header */}
                <div className="bg-[#f8fafc] dark:bg-[#1e293b]/50 border-b border-slate-200 dark:border-white/5 px-6 py-5 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-lg">
                            🚚
                        </div>
                        <div>
                            <h2 className="text-[16px] font-black text-slate-800 dark:text-white tracking-tight leading-none mb-1">
                                Yeni İrsaliye Düzenle
                            </h2>
                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                İşlem Formu
                            </p>
                        </div>
                    </div>
                    <button onClick={() => setView('list')} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors">
                        ✕
                    </button>
                </div>

                {/* Form Body Container */}
                <div className="p-6 overflow-y-auto w-full space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">İRSALİYE TİPİ</label>
                            <select
                                value={newWayslipData.type}
                                onChange={(e) => setNewWayslipData({ ...newWayslipData, type: e.target.value as any, customerId: '', supplierId: '' })}
                                className="w-full bg-slate-50 dark:bg-[#1e293b]/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-[13px] font-semibold text-slate-800 dark:text-white outline-none focus:border-indigo-500 transition-colors"
                            >
                                <option value="Giden">Sevk İrsaliyesi (Müşteriye)</option>
                                <option value="Gelen">Alım İrsaliyesi (Tedarikçiden)</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">{newWayslipData.type === 'Giden' ? 'MÜŞTERİ / CARİ' : 'TEDARİKÇİ'}</label>
                            {newWayslipData.type === 'Giden' ? (
                                <select
                                    value={newWayslipData.customerId}
                                    onChange={(e) => setNewWayslipData({ ...newWayslipData, customerId: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-[#1e293b]/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-[13px] font-semibold text-slate-800 dark:text-white outline-none focus:border-indigo-500 transition-colors"
                                >
                                    <option value="">Müşteri Seçin...</option>
                                    {customers?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            ) : (
                                <select
                                    value={newWayslipData.supplierId}
                                    onChange={(e) => setNewWayslipData({ ...newWayslipData, supplierId: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-[#1e293b]/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-[13px] font-semibold text-slate-800 dark:text-white outline-none focus:border-indigo-500 transition-colors"
                                >
                                    <option value="">Tedarikçi Seçin...</option>
                                    {suppliers?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            )}
                        </div>

                        {newWayslipData.type === 'Giden' && newWayslipData.customerId && (
                            <div className="flex flex-col gap-1.5 col-span-2 mt-2">
                                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">FATURADAN İRSALİYE OLUŞTUR (SEÇMELİ)</label>
                                <select
                                    value={newWayslipData.relatedInvoiceId || ''}
                                    onChange={(e) => handleSelectInvoice(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-[#1e293b]/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-[13px] font-semibold text-slate-800 dark:text-white outline-none focus:border-indigo-500 transition-colors"
                                >
                                    <option value="">Bağımsız İrsaliye (Fatura Seçmeden Devam Et)</option>
                                    {unfactoredInvoices.map((inv: any) => (
                                        <option key={inv.id} value={inv.id}>
                                            Fatura No: {inv.invoiceNo} - Tutar: {inv.totalAmount}₺ - Tarih: {new Date(inv.invoiceDate || inv.createdAt).toLocaleDateString('tr-TR')}
                                        </option>
                                    ))}
                                </select>
                                <span className="text-[10px] font-medium text-slate-400">Fatura seçildiğinde ürünler otomatik eklenir ve irsaliye açıklamasında bu faturanın referansı yer alır.</span>
                            </div>
                        )}

                        <div className="flex flex-col gap-1.5 mt-2">
                            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">İRSALİYE NO</label>
                            <input
                                type="text" value={newWayslipData.irsNo}
                                onChange={(e) => setNewWayslipData({ ...newWayslipData, irsNo: e.target.value })}
                                placeholder="Örn: IRS-2026-001"
                                className="w-full bg-slate-50 dark:bg-[#1e293b]/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-[13px] font-semibold text-slate-800 dark:text-white outline-none focus:border-indigo-500 transition-colors"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5 mt-2">
                            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">BELGE TARİHİ</label>
                            <input
                                type="date" value={newWayslipData.date}
                                onChange={(e) => setNewWayslipData({ ...newWayslipData, date: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-[#1e293b]/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-[13px] font-semibold text-slate-800 dark:text-white outline-none focus:border-indigo-500 transition-colors"
                            />
                        </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-[#1e293b]/30 border border-slate-200 dark:border-white/5 rounded-2xl p-5">
                        <h4 className="text-[13px] font-black text-slate-800 dark:text-white uppercase tracking-widest mb-4">📦 Ürün Ekle</h4>
                        <div className="flex gap-3 mb-4">
                            <select id="irs-item-select" className="flex-1 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-slate-800 dark:text-white outline-none">
                                <option value="">Ürün Seçin...</option>
                                {inventoryProducts?.map(p => <option key={p.id} value={p.id}>{p.name} ({p.stock} Adet)</option>)}
                            </select>
                            <input id="irs-item-qty" type="number" defaultValue="1" min="1" className="w-24 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-slate-800 dark:text-white outline-none text-center" />
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    const s = document.getElementById('irs-item-select') as HTMLSelectElement;
                                    const q = document.getElementById('irs-item-qty') as HTMLInputElement;
                                    if (!s.value) return;
                                    const p = inventoryProducts.find(pr => pr.id === s.value);
                                    if (p) {
                                        setNewWayslipData({
                                            ...newWayslipData,
                                            items: [...newWayslipData.items, { ...p, qty: parseInt(q.value) }]
                                        });
                                    }
                                }}
                                className="px-5 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 font-black text-[11px] rounded-full transition-colors tracking-widest uppercase border border-indigo-200 dark:border-white/5"
                            >
                                Ekle
                            </button>
                        </div>

                        {newWayslipData.items?.length > 0 && (
                            <table className="w-full text-sm mt-2">
                                <thead>
                                    <tr className="text-[10px] text-slate-500 font-black uppercase tracking-widest border-b border-slate-200 dark:border-white/10">
                                        <th align="left" className="pb-2">Ürün</th>
                                        <th align="center" className="pb-2">Miktar</th>
                                        <th align="right" className="pb-2"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {newWayslipData.items?.map((item: any, i: number) => (
                                        <tr key={i} className="border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-100 dark:hover:bg-[#0f172a]/50 transition-colors group">
                                            <td className="py-3 text-[12px] font-semibold text-slate-800 dark:text-white">{item.name}</td>
                                            <td align="center" className="py-3 text-[12px] font-bold text-slate-600 dark:text-slate-300">{item.qty}</td>
                                            <td align="right" className="py-3 pr-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setNewWayslipData({ ...newWayslipData, items: newWayslipData.items.filter((_: any, idx: number) => idx !== i) })
                                                    }}
                                                    className="w-6 h-6 rounded-md bg-rose-50 text-rose-500 dark:bg-rose-500/10 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 flex items-center justify-center opacity-50 group-hover:opacity-100 transition-all ml-auto"
                                                >✕</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-white/5 mt-auto">
                        <button onClick={() => setView('list')} className="px-5 h-[42px] bg-white dark:bg-[#1e293b]/50 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full text-[11px] font-black uppercase tracking-widest transition-colors shadow-sm">
                            Vazgeç
                        </button>
                        <button
                            onClick={handleSaveWayslip}
                            disabled={isSavingWayslip}
                            className={`px-8 h-[42px] ${isSavingWayslip ? 'opacity-50' : ''} bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-[11px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98]`}
                        >
                            {isSavingWayslip ? 'Kaydediliyor...' : 'Oluştur ve Kaydet'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
