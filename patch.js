const fs = require('fs');
const file = 'src/app/(app)/customers/[id]/CustomerDetailClient.tsx';
let txt = fs.readFileSync(file, 'utf8');

const t2115_find = `<button onClick={() => setInvoiceModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors">
                                    &times;
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-950/30">`;

const t2115_rep = `<div className="flex items-center gap-2 md:gap-4">
                                    <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer hover:border-emerald-500/50 transition-colors">
                                        <input
                                            type="checkbox"
                                            id="inv_create_wayslip"
                                            className="w-3.5 h-3.5 rounded text-emerald-500 accent-emerald-500"
                                        />
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">İrsaliye Ekle</span>
                                    </label>

                                    {(() => {
                                        const pmRaw = selectedOrder?.rawData ? (typeof selectedOrder.rawData === 'string' ? JSON.parse(selectedOrder.rawData)?.paymentMode : selectedOrder.rawData.paymentMode) : null;
                                        const isVeresiye = !pmRaw || ['account', 'veresiye'].includes(pmRaw);
                                        if (!isVeresiye) return null;

                                        const invoiceIdsForOrder = (customer?.invoices || [])
                                            .filter((inv: any) => inv.orderId === selectedOrder?.id)
                                            .map((inv: any) => inv.id);

                                        const isAlreadyVadelendi = selectedOrder && (
                                            vadelenenIds.includes(selectedOrder.id) || 
                                            invoiceIdsForOrder.some((id: string) => vadelenenIds.includes(id)) ||
                                            customer?.paymentPlans?.some((p: any) => 
                                                (
                                                    p.description === selectedOrder.id || 
                                                    (lastInvoice && p.description === lastInvoice.id) || 
                                                    (lastInvoice && p.description === lastInvoice.orderId) ||
                                                    invoiceIdsForOrder.includes(p.description)
                                                ) && 
                                                p.status !== 'İptal' && p.status !== 'Cancelled'
                                            )
                                        );

                                        return (
                                            <div className="relative group/vadewrap">
                                                <label className={\`flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer transition-colors \${isAlreadyVadelendi ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-500/50'}\`}>
                                                    <input
                                                        type="checkbox"
                                                        disabled={isAlreadyVadelendi}
                                                        checked={isAlreadyVadelendi ? false : isInstallmentInvoice}
                                                        onChange={(e) => setIsInstallmentInvoice(e.target.checked)}
                                                        className="w-3.5 h-3.5 rounded text-blue-500 accent-blue-500 disabled:opacity-50"
                                                    />
                                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Vadelendir (Plan)</span>
                                                </label>
                                                
                                                {isInstallmentInvoice && !isAlreadyVadelendi && (
                                                    <div className="absolute right-0 top-[120%] z-50 w-72 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl animate-in fade-in zoom-in-95 duration-200 flex flex-col gap-3">
                                                        <div className="flex flex-col gap-1.5">
                                                            <label className="text-[10px] uppercase font-bold text-slate-500">Taksit Türü</label>
                                                            <select id="inv_installment_type" defaultValue="Açık Hesap" className="p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-semibold outline-none focus:ring-1 focus:ring-blue-500">
                                                                <option value="Açık Hesap">Açık Hesap / Cari</option>
                                                                <option value="Çek">Çek Alınacak</option>
                                                                <option value="Senet">Senet / Promissory Note</option>
                                                            </select>
                                                        </div>
                                                        <div className="flex flex-col gap-1.5">
                                                            <label className="text-[10px] uppercase font-bold text-slate-500">Ödeme Vadesi (Düzen)</label>
                                                            <select value={invoiceInstallmentCount} onChange={e => setInvoiceInstallmentCount(Number(e.target.value))} className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none font-bold">
                                                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => <option key={n} value={n}>{n} Ay Seç</option>)}
                                                            </select>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}

                                    <button onClick={() => setInvoiceModalOpen(false)} className="ml-2 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200 dark:bg-slate-800/50 dark:hover:bg-slate-800 text-slate-500 transition-colors">
                                        &times;
                                    </button>
                                </div>
                            </div>
                            
                            {/* Scrollable Modal Content */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-950/30">`;

txt = txt.replace(t2115_find, t2115_rep);

let chunk2_start = `                                    {/* Section: Ekstra Seçenekler */}`;
let chunk2_end = `                                        </div>\r\n                                    </EnterpriseCard>`;
let chunk2_rep = `                                    {/* Section: Finansal Özet */}\n                                    <EnterpriseCard borderLeftColor="#10b981" className="space-y-4 lg:col-span-1 !p-4 bg-emerald-50/10 dark:bg-emerald-900/5 flex flex-col">\n                                        <h3 className="text-[11px] font-bold text-emerald-500 uppercase tracking-widest">FİNANSAL ÖZET</h3>\n                                        <div className="flex-1 flex flex-col justify-end">\n                                        {(() => {\n                                            const subtotal = invoiceItems.reduce((acc, it) => acc + (Number(it.qty) * Number(it.price)), 0);\n\n                                            let totalOtv = 0;\n                                            let totalOiv = 0;\n                                            let totalVat = 0;\n\n                                            invoiceItems.forEach(it => {\n                                                const lineQty = Number(it.qty || 1);\n                                                const lineNetBase = lineQty * Number(it.price || 0);\n                                                const lineDiscount = lineNetBase * (Number(it.discountRate || 0) / 100);\n                                                const lineNet = lineNetBase - lineDiscount;\n                                                \n                                                let lineOtv = 0;\n                                                if (it.otvType === 'Yüzdesel') {\n                                                    lineOtv = lineNet * (Number(it.otv || 0) / 100);\n                                                } else if (it.otvType === 'Birim Başına') {\n                                                    lineOtv = Number(it.otv || 0) * lineQty;\n                                                }\n                                                const matrah = lineNet + lineOtv;\n                                                totalOtv += lineOtv;\n                                                totalOiv += matrah * (Number(it.oiv || 0) / 100);\n                                                totalVat += matrah * (Number(it.vat || 20) / 100);\n                                            });\n\n                                            let discAmount = 0;\n                                            if (discountType === 'percent') {\n                                                discAmount = subtotal * (discountValue / 100);\n                                            } else {\n                                                discAmount = discountValue;\n                                            }\n\n                                            const finalTotal = subtotal + totalOtv + totalOiv + totalVat - discAmount;\n\n                                            return (\n                                                <div className="flex flex-col gap-3 py-1">\n                                                    <div className="flex justify-between items-center">\n                                                        <span className="text-xs font-semibold text-slate-500">Ara Toplam (Net)</span>\n                                                        <span className="font-mono font-bold text-[14px]">{subtotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺</span>\n                                                    </div>\n\n                                                    {totalOtv > 0 && (\n                                                        <div className="flex justify-between items-center">\n                                                            <span className="text-xs font-semibold text-slate-500">ÖTV Toplam</span>\n                                                            <span className="font-mono font-bold text-[14px] text-amber-500">{totalOtv.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺</span>\n                                                        </div>\n                                                    )}\n\n                                                    <div className="flex justify-between items-center">\n                                                        <div className="flex items-center gap-2">\n                                                            <span className="text-xs font-semibold text-slate-500">İskonto</span>\n                                                            <select\n                                                                value={discountType}\n                                                                onChange={(e: any) => setDiscountType(e.target.value)}\n                                                                className="px-1 py-0.5 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded outline-none"\n                                                            >\n                                                                <option value="percent">%</option>\n                                                                <option value="amount">₺</option>\n                                                            </select>\n                                                            <input\n                                                                type="number"\n                                                                value={discountValue}\n                                                                onChange={(e) => setDiscountValue(Number(e.target.value))}\n                                                                className="w-14 px-1 py-0.5 text-center text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded outline-none"\n                                                            />\n                                                        </div>\n                                                        <span className="font-mono font-bold text-[14px] text-red-500">- {discAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺</span>\n                                                    </div>\n\n                                                    <div className="flex justify-between items-center">\n                                                        <div className="flex items-center gap-2">\n                                                            <span className="text-xs font-semibold text-slate-500">KDV Katkısı</span>\n                                                            {invoiceItems.length > 0 && invoiceItems.every((it: any) => it.vat === invoiceItems[0].vat) && (\n                                                                <span className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[9px] font-bold text-slate-500 border border-slate-200 dark:border-slate-700">\n                                                                    %{invoiceItems[0].vat || 20}\n                                                                </span>\n                                                            )}\n                                                        </div>                                                        \n                                                        <span className="font-mono font-bold text-[14px]">{totalVat.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺</span>\n                                                    </div>\n\n                                                    <div className="h-px bg-slate-200 dark:bg-slate-700 my-1"></div>\n\n                                                    <div className="flex justify-between items-center">\n                                                        <span className="text-sm font-bold tracking-widest text-slate-900 dark:text-white">GENEL TOPLAM</span>\n                                                        <span className="text-2xl font-mono font-black text-blue-600 dark:text-blue-500 tracking-tight">\n                                                            {finalTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm opacity-80">₺</span>\n                                                        </span>\n                                                    </div>\n                                                </div>\n                                            );\n                                        })()}\n                                        </div>\n                                    </EnterpriseCard>`;

// Fallback line endings
if(txt.indexOf(chunk2_end) === -1) {
    chunk2_end = `                                        </div>\n                                    </EnterpriseCard>`;
}

const startIndex = txt.indexOf(chunk2_start);
if(startIndex > -1) {
    const endIndex = txt.indexOf(chunk2_end, startIndex) + chunk2_end.length;
    txt = txt.substring(0, startIndex) + chunk2_rep + txt.substring(endIndex);
} else {
    console.error("chunk2_start not found!");
}

const chunk3_start = `                                <div className="flex justify-end">\n                                    <EnterpriseCard className="w-[480px] bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/50">`;
const chunk3_end = `                                    </EnterpriseCard>\n                                </div>`;
const chunk3_start_win = `                                <div className="flex justify-end">\r\n                                    <EnterpriseCard className="w-[480px] bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/50">`;
const chunk3_end_win = `                                    </EnterpriseCard>\r\n                                </div>`;

const chunk3_rep = `                                {/* Finansal Özet sağ üst alana taşındı */}`;

let s3 = txt.indexOf(chunk3_start);
let e3 = -1;
if(s3 > -1) {
    e3 = txt.indexOf(chunk3_end, s3) + chunk3_end.length;
} else {
    s3 = txt.indexOf(chunk3_start_win);
    if(s3 > -1) {
        e3 = txt.indexOf(chunk3_end_win, s3) + chunk3_end_win.length;
    }
}

if(s3 > -1 && e3 > -1 && e3 > s3) {
    txt = txt.substring(0, s3) + chunk3_rep + txt.substring(e3);
} else {
    console.error("chunk3_start not found!");
}

fs.writeFileSync(file, txt, 'utf8');
console.log('Done script execution.');
