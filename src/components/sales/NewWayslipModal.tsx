
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
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm" style={{ width: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
                <div className="flex-between mb-6">
                    <h3>🚚 Yeni İrsaliye Düzenle</h3>
                    <button onClick={() => setView('list')} style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px' }}>×</button>
                </div>

                <div className="grid-cols-2 gap-4 mb-6">
                    <div className="flex-col gap-2">
                        <label className="text-muted" style={{ fontSize: '12px' }}>İRSALİYE TİPİ</label>
                        <select
                            value={newWayslipData.type}
                            onChange={(e) => setNewWayslipData({ ...newWayslipData, type: e.target.value as any, customerId: '', supplierId: '' })}
                            style={{ padding: '12px', background: 'var(--bg-deep)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'white' }}
                        >
                            <option value="Giden">Sevk İrsaliyesi (Müşteriye)</option>
                            <option value="Gelen">Alım İrsaliyesi (Tedarikçiden)</option>
                        </select>
                    </div>
                    <div className="flex-col gap-2">
                        <label className="text-muted" style={{ fontSize: '12px' }}>{newWayslipData.type === 'Giden' ? 'MÜŞTERİ / CARİ' : 'TEDARİKÇİ'}</label>
                        {newWayslipData.type === 'Giden' ? (
                            <select
                                value={newWayslipData.customerId}
                                onChange={(e) => setNewWayslipData({ ...newWayslipData, customerId: e.target.value })}
                                style={{ padding: '12px', background: 'var(--bg-deep)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'white' }}
                            >
                                <option value="">Müşteri Seçin...</option>
                                {customers?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        ) : (
                            <select
                                value={newWayslipData.supplierId}
                                onChange={(e) => setNewWayslipData({ ...newWayslipData, supplierId: e.target.value })}
                                style={{ padding: '12px', background: 'var(--bg-deep)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'white' }}
                            >
                                <option value="">Tedarikçi Seçin...</option>
                                {suppliers?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        )}
                    </div>
                    {newWayslipData.type === 'Giden' && newWayslipData.customerId && (
                        <div className="flex-col gap-2 col-span-2">
                            <label className="text-muted" style={{ fontSize: '12px' }}>FATURADAN İRSALİYE OLUŞTUR (SEÇMELİ)</label>
                            <select
                                value={newWayslipData.relatedInvoiceId || ''}
                                onChange={(e) => handleSelectInvoice(e.target.value)}
                                style={{ padding: '12px', background: 'var(--bg-deep)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'white' }}
                            >
                                <option value="">Bağımsız İrsaliye (Fatura Seçmeden Devam Et)</option>
                                {unfactoredInvoices.map((inv: any) => (
                                    <option key={inv.id} value={inv.id}>
                                        Fatura No: {inv.invoiceNo} - Tutar: {inv.totalAmount}₺ - Tarih: {new Date(inv.invoiceDate || inv.createdAt).toLocaleDateString('tr-TR')}
                                    </option>
                                ))}
                            </select>
                            <span style={{fontSize: '11px', color: '#94a3b8'}}>Fatura seçildiğinde ürünler otomatik eklenir ve irsaliye açıklamasında bu faturanın referansı yer alır.</span>
                        </div>
                    )}
                    <div className="flex-col gap-2">
                        <label className="text-muted" style={{ fontSize: '12px' }}>İRSALİYE NO</label>
                        <input
                            type="text" value={newWayslipData.irsNo}
                            onChange={(e) => setNewWayslipData({ ...newWayslipData, irsNo: e.target.value })}
                            placeholder="Örn: IRS202600001"
                            style={{ padding: '12px', background: 'var(--bg-deep)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'white' }}
                        />
                    </div>
                    <div className="flex-col gap-2">
                        <label className="text-muted" style={{ fontSize: '12px' }}>BELGE TARİHİ</label>
                        <input
                            type="date" value={newWayslipData.date}
                            onChange={(e) => setNewWayslipData({ ...newWayslipData, date: e.target.value })}
                            style={{ padding: '12px', background: 'var(--bg-deep)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'white' }}
                        />
                    </div>
                </div>

                <div className="card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
                    <h4 className="mb-4">📦 Ürün Ekle</h4>
                    <div className="flex gap-2 mb-4">
                        <select id="irs-item-select" className="flex-1 p-2 bg-black/20 border border-white/10 rounded-lg text-white">
                            <option value="">Ürün Seçin...</option>
                            {inventoryProducts?.map(p => <option key={p.id} value={p.id}>{p.name} ({p.stock} Adet)</option>)}
                        </select>
                        <input id="irs-item-qty" type="number" defaultValue="1" className="w-20 p-2 bg-black/20 border border-white/10 rounded-lg text-white" />
                        <button
                            onClick={() => {
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
                            className="btn btn-outline"
                        >Ekle</button>
                    </div>

                    <table className="w-full text-sm">
                        <thead><tr className="text-muted border-b border-white/10"><th align="left">Ürün</th><th>Miktar</th><th></th></tr></thead>
                        <tbody>
                            {newWayslipData.items?.map((item: any, i: number) => (
                                <tr key={i} className="border-b border-white/5">
                                    <td className="py-2">{item.name}</td>
                                    <td align="center">{item.qty}</td>
                                    <td align="right">
                                        <button
                                            onClick={() => setNewWayslipData({ ...newWayslipData, items: newWayslipData.items.filter((_: any, idx: number) => idx !== i) })}
                                            style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}
                                        >×</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex-end gap-4 mt-6">
                    <button onClick={() => setView('list')} className="btn btn-ghost">Vazgeç</button>
                    <button
                        onClick={handleSaveWayslip}
                        disabled={isSavingWayslip}
                        className="btn btn-primary px-8 py-3 font-bold"
                    >{isSavingWayslip ? 'Kaydediliyor...' : 'Oluştur ve Kaydet'}</button>
                </div>
            </div>
        </div>
    );
}
