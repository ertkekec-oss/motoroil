const fs = require('fs');
const file = 'c:/Users/ertke/OneDrive/Masaüstü/periodya/muhasebeapp/motoroil/src/app/(app)/service/[id]/ServiceDetailClient.tsx';
let content = fs.readFileSync(file, 'utf8');

const importsToAdd = `
import { useInventory } from '@/contexts/InventoryContext';
import { useRouter } from 'next/navigation';
`;

if (!content.includes('import { useInventory }')) {
    content = content.replace("import Link from 'next/link';", `import Link from 'next/link';\n${importsToAdd}`);
}

const hooksToAdd = `    const { products } = useInventory();
    const router = useRouter();

    const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
    const [productModalOpen, setProductModalOpen] = useState(false);
    const [productSearch, setProductSearch] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'cash'|'cc'|'iban'|'account'>('cash');
    const [isFinishing, setIsFinishing] = useState(false);
`;

if (!content.includes('const { products } = useInventory();')) {
    content = content.replace("    const [newItemQty, setNewItemQty] = useState(1);", "    const [newItemQty, setNewItemQty] = useState(1);");
    content = content.replace("    const [newItemPrice, setNewItemPrice] = useState(0);", `    const [newItemPrice, setNewItemPrice] = useState(0);\n${hooksToAdd}`);
}

// 1. TAMAMLA ACTION -> Open Checkout
const completeBtnRegex = /onClick=\{\(\) \=\> handleUpdateStatus\('COMPLETED'\)\}/;
content = content.replace(completeBtnRegex, "onClick={() => setCheckoutModalOpen(true)}");


// 2. Barkod / Katalogdan Seç -> Open Product Modal
const catalogBtnRegex = /onClick=\{\(\) \=\> \{[^}]*\}\}[\s\S]*?Barkod \/ Katalogdan Seç \(Upsell\)/;
// Wait, the original code is:
// <button className="w-full sm:w-auto h-[36px] px-4 bg-indigo-50...
//                                     <ScanLine className="w-4 h-4" />
//                                     Barkod / Katalogdan Seç (Upsell)
//                                 </button>
content = content.replace(
    /<button( className="w-full sm:w-auto h-\[36px\] px-4 bg-indigo-50[^>]+)>/,
    `<button onClick={() => setProductModalOpen(true)}$1>`
);

// 3. Remove parts Add Item form & Make it Labor only
const addItemFormLabel = /\{\/\* Add Item Form \*\/\}/;
const formStart = content.indexOf('{/* Add Item Form */}');
const tableStart = content.indexOf('{/* Items Table */}');
if (formStart !== -1 && tableStart !== -1) {
    const originalForm = content.slice(formStart, tableStart);
    const newForm = `                        {/* Add Item Form */}
                        {activeTab === 'labor' && (
                        <div className="flex flex-col sm:flex-row gap-3 mb-8 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-[16px] border border-slate-200 dark:border-white/10 animate-in fade-in zoom-in-95">
                            <div className="flex-1">
                                <label className="text-xs font-bold text-slate-500 mb-1.5 block">İşçilik / Hizmet Adı</label>
                                <input type="text" value={newItemName} onChange={e => setNewItemName(e.target.value)} placeholder="Manuel işçilik açıklaması giriniz..." className="w-full h-[44px] sm:h-10 px-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-[13px] font-medium focus:ring-2 focus:ring-blue-500/50 outline-none" />
                            </div>
                            <div className="flex gap-3">
                                <div className="w-1/3 sm:w-20">
                                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">Miktar</label>
                                    <input type="number" min="1" value={newItemQty} onChange={e => setNewItemQty(Number(e.target.value))} className="w-full h-[44px] sm:h-10 px-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-[13px] font-bold focus:ring-2 focus:ring-blue-500/50 outline-none text-center" />
                                </div>
                                <div className="w-2/3 sm:w-32">
                                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">Birim Fiyat (₺)</label>
                                    <input type="number" min="0" value={newItemPrice} onChange={e => setNewItemPrice(Number(e.target.value))} className="w-full h-[44px] sm:h-10 px-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-[13px] font-bold focus:ring-2 focus:ring-blue-500/50 outline-none text-right" />
                                </div>
                            </div>
                            <div className="w-full sm:w-32 flex items-end mt-2 sm:mt-0">
                                <button onClick={() => handleAddItem('LABOR')} className="w-full h-[44px] sm:h-10 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-[10px] sm:rounded-lg text-sm sm:text-xs font-bold flex justify-center items-center gap-1.5 transition-all shadow-md active:scale-95">
                                    <Plus className="w-5 h-5 sm:w-4 sm:h-4" /> İşçilik Ekle
                                </button>
                            </div>
                        </div>
                        )}
                        \n`;
    content = content.slice(0, formStart) + newForm + content.slice(tableStart);
}

// 4. Modals Code Injection
const modalsCode = `
            {/* PRODUCT FINDER MODAL */}
            {productModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-2xl bg-white dark:bg-[#0f172a] rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-2xl animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2"><ScanLine className="text-indigo-500" /> Katalogdan Parça Seçimi</h3>
                            <button onClick={() => setProductModalOpen(false)} className="w-8 h-8 flex justify-center items-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"><span className="font-bold">✕</span></button>
                        </div>
                        <input autoFocus placeholder="Barkod veya Ürün Adı Arama..." value={productSearch} onChange={e => setProductSearch(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-3 mb-4 focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white font-bold" />
                        <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-2 custom-scroll">
                            {(products || []).filter(p => !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.barcode?.includes(productSearch)).slice(0, 50).map(p => (
                                <div key={p.id} className="w-full text-left p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-colors flex justify-between items-center group">
                                    <div className="flex flex-col min-w-0 pr-4">
                                        <span className="font-bold text-[13px] text-slate-800 dark:text-slate-200 truncate">{p.name}</span>
                                        <span className="text-[11px] text-slate-500 mt-1">Stok: {p.stock} {p.unit || 'ADET'} • Barkod: {p.barcode || '-'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">₺{Number(p.price || 0).toLocaleString()}</span>
                                        <button onClick={async () => {
                                            if (p.stock <= 0) {
                                                showError("Stok Hatası", "Bu ürünün stoğu bulunmamaktadır.");
                                                return;
                                            }
                                            await fetch(\`/api/services/work-orders/\${id}/items\`, {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ name: p.name, quantity: 1, unitPrice: Number(p.price || 0), type: 'PART', productId: p.id })
                                            });
                                            fetchOrder();
                                            showSuccess("Başarılı", \`\${p.name} yedek parça listesine eklendi.\`);
                                            setProductSearch('');
                                        }} className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold hover:bg-indigo-600 hover:text-white transition-colors flex justify-center items-center">
                                            +
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {products?.length === 0 && <div className="text-center py-6 text-slate-500 font-bold text-sm">Ürün bulunamadı. Lütfen envanterinizi güncelleyin.</div>}
                        </div>
                    </div>
                </div>
            )}

            {/* CHECKOUT MODAL (TAMAMLA) */}
            {checkoutModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-lg bg-white dark:bg-[#0f172a] rounded-[24px] p-6 sm:p-8 border border-slate-200 dark:border-white/10 shadow-2xl animate-in fade-in slide-in-from-bottom-4">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 flex items-center justify-center rounded-full mx-auto mb-4">
                                <CheckCircle className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Servis İşlemini Tamamla</h3>
                            <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium mt-2">Bu iş emri kapatılacak ve finansal kaydı oluşturulacaktır.</p>
                        </div>

                        <div className="p-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[20px] mb-6 flex justify-between items-center shadow-sm">
                            <span className="font-bold text-[13px] text-slate-500 uppercase tracking-widest">Ödenecek Tutar</span>
                            <span className="text-[24px] font-black text-emerald-600 dark:text-emerald-400 leading-none">
                                {Number(order.totalAmount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                            </span>
                        </div>

                        <div className="space-y-4 mb-8">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-2">Ödeme / Kapatma Şekli Seçimi</label>
                            
                            <button onClick={() => setPaymentMethod('cash')} className={\`w-full p-4 rounded-[16px] border flex items-center justify-between transition-all \${paymentMethod === 'cash' ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-500 shadow-sm' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10 hover:border-slate-300'}\`}>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex justify-center items-center text-[20px]">💵</div>
                                    <div className="text-left"><div className={\`font-bold text-[14px] \${paymentMethod === 'cash' ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200'}\`}>Nakit Kasa</div><div className="text-[11px] font-medium text-slate-500">Nakit tahsilat olarak kasaya işlenir.</div></div>
                                </div>
                                {paymentMethod === 'cash' && <div className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px]">✓</div>}
                            </button>

                            <button onClick={() => setPaymentMethod('cc')} className={\`w-full p-4 rounded-[16px] border flex items-center justify-between transition-all \${paymentMethod === 'cc' ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-500 shadow-sm' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10 hover:border-slate-300'}\`}>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex justify-center items-center text-[20px]">💳</div>
                                    <div className="text-left"><div className={\`font-bold text-[14px] \${paymentMethod === 'cc' ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200'}\`}>POS / Kredi Kartı</div><div className="text-[11px] font-medium text-slate-500">Kredi kartı tahsilatı olarak işaretlenir.</div></div>
                                </div>
                                {paymentMethod === 'cc' && <div className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px]">✓</div>}
                            </button>
                            
                            <button onClick={() => setPaymentMethod('iban')} className={\`w-full p-4 rounded-[16px] border flex items-center justify-between transition-all \${paymentMethod === 'iban' ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-500 shadow-sm' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10 hover:border-slate-300'}\`}>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex justify-center items-center text-[20px]">🏦</div>
                                    <div className="text-left"><div className={\`font-bold text-[14px] \${paymentMethod === 'iban' ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200'}\`}>Havale / EFT Şirket Hesabı</div><div className="text-[11px] font-medium text-slate-500">Bankaya gelen transfer olarak işlenir.</div></div>
                                </div>
                                {paymentMethod === 'iban' && <div className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px]">✓</div>}
                            </button>

                            <button onClick={() => setPaymentMethod('account')} className={\`w-full p-4 rounded-[16px] border flex items-center justify-between transition-all \${paymentMethod === 'account' ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-500 shadow-sm' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10 hover:border-slate-300'}\`}>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex justify-center items-center text-[20px]">📒</div>
                                    <div className="text-left"><div className={\`font-bold text-[14px] \${paymentMethod === 'account' ? 'text-amber-700 dark:text-amber-400' : 'text-slate-800 dark:text-slate-200'}\`}>Açık Hesap (Veresiye)</div><div className="text-[11px] font-medium text-slate-500">Müşteri carisine borç olarak eklenir. (Cari artar)</div></div>
                                </div>
                                {paymentMethod === 'account' && <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px]">✓</div>}
                            </button>
                        </div>

                        <div className="flex gap-3">
                            <button disabled={isFinishing} onClick={() => setCheckoutModalOpen(false)} className="w-[120px] h-14 rounded-xl font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Vazgeç</button>
                            <button
                                disabled={isFinishing}
                                onClick={async () => {
                                    setIsFinishing(true);
                                    try {
                                        // 1. Mark Order Completed
                                        const resStatus = await fetch(\`/api/services/work-orders/\${id}\`, {
                                            method: 'PATCH',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ status: 'COMPLETED' })
                                        });

                                        if (!resStatus.ok) throw new Error("İş emri güncellenirken hata oluştu.");

                                        // 2. Add Transaction/Invoice
                                        if (paymentMethod === 'account') {
                                            // VERESIYE -> Add Sales Transaction with no KasaId to just increase Customer debt.
                                            const resFin = await fetch('/api/financials/transactions', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    type: 'Sales',
                                                    amount: order.totalAmount,
                                                    customerId: order.customer.id,
                                                    isAccountTransaction: true,
                                                    description: \`Servis Fişi (Müşteri Bedeli) - REF:\${id}\`
                                                })
                                            });
                                            if (!resFin.ok) throw new Error("Açık hesap finansal işlemi oluşturulamadı.");
                                        } else {
                                            // CASH, CC, IBAN -> redirect to native system payment screen for standard process
                                            // Wait! the safest way so we don't break Kasa balances without selecting specific Kasas.
                                            // Let's redirect to standard payment, prepopulated with amount, type, etc.
                                            // But since it's already recorded as Sales? No, standard payment doesn't record sales, it just records Collection.
                                            // IF WE RECORD COLLECTION, we must also record SALES for the debt, otherwise balance will go negative!
                                            // Let's record Sales first to balance it:
                                            await fetch('/api/financials/transactions', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    type: 'Sales',
                                                    amount: order.totalAmount,
                                                    customerId: order.customer.id,
                                                    isAccountTransaction: true,
                                                    description: \`Servis Fişi (Müşteri Bedeli) - REF:\${id}\`
                                                })
                                            });

                                            // Then redirect to Collection Payment URL
                                            router.push(\`/payment?amount=\${order.totalAmount}&title=ServisFisiTahsilat-\${encodeURIComponent(order.customer.name)}&ref=CUST-\${order.customer.id}&type=collection\`);
                                            return;
                                        }

                                        showSuccess("Başarılı", "Servis başarıyla tamamlandı ve portföye kaydedildi.");
                                        setCheckoutModalOpen(false);
                                        fetchOrder();
                                        
                                    } catch (err: any) {
                                        showError("Hata", err.message || "İşlem tamamlanamadı.");
                                    } finally {
                                        setIsFinishing(false);
                                    }
                                }}
                                className="flex-1 h-14 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 transition-all flex justify-center items-center disabled:opacity-50"
                            >
                                {isFinishing ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : 'ONAYLA VE BİTİR'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
`;

if (!content.includes('PRODUCT FINDER MODAL')) {
    const bottomIndex = content.lastIndexOf('</div>');
    // Ensure we place it reasonably near the end. Let's just place it before the final `</div>\n        </div>` or similar
    const insertionPoint = content.lastIndexOf('</div');
    content = content.slice(0, insertionPoint) + modalsCode + content.slice(insertionPoint);
}


fs.writeFileSync(file, content, 'utf8');
console.log('Update Complete.');
