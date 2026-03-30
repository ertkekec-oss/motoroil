const fs = require('fs');
let code = fs.readFileSync('src/components/sales/InvoiceMappingModal.tsx', 'utf8');

// Replace standard outer block
code = code.replace(/<div style={{ position: 'fixed'[\s\S]*?<\/div>[\s]*<\/div>[\s]*\);/m, 
`(
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000 }} className="flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[24px] shadow-2xl w-full max-w-4xl relative animate-in zoom-in-95 duration-200 flex flex-col overflow-hidden max-h-[90vh]">
                
                {/* Header */}
                <div className="bg-[#f8fafc] dark:bg-[#1e293b]/50 border-b border-slate-200 dark:border-white/5 px-6 py-5 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-lg">
                            📑
                        </div>
                        <div>
                            <h2 className="text-[16px] font-black text-slate-800 dark:text-white tracking-tight leading-none mb-1">
                                Akıllı Ürün Eşleştirme
                            </h2>
                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                Sipariş #{selectedOrder.orderNumber} · {selectedOrder.marketplace}
                            </p>
                        </div>
                    </div>
                    <button onClick={() => setSelectedOrder(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors">
                        ✕
                    </button>
                </div>

                {isLoadingMapping ? (
                    <div className="p-16 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 gap-4">
                        <div className="text-4xl animate-bounce">🤖</div>
                        <p className="text-[14px] font-bold">AI ürünleri tarıyor ve eşleştiriyor...</p>
                        <p className="text-[11px] font-semibold opacity-60 uppercase tracking-widest">Stok veritabanınızla karşılaştırılıyor</p>
                    </div>
                ) : (
                    <div className="p-6 overflow-y-auto w-full space-y-4 flex flex-col custom-scroll">
                        {/* Legend */}
                        <div className="flex gap-4 items-center text-[10px] font-black uppercase tracking-widest px-4 py-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5">
                            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Otomatik eşleşti</span>
                            <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Öneri var — doğrula</span>
                            <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500"></span> Bulunamadı — kart oluştur</span>
                        </div>

                        {/* Items */}
                        <div className="space-y-3">
                            {selectedOrder.items?.map((item: any, idx: number) => {
                                const info = getMappingInfo(item);
                                const currentMap = mappedItems[item.name];
                                const isDone = !!(currentMap?.productId);
                                const statusColor = isDone ? 'text-emerald-600 dark:text-emerald-400' : (info.status === 'suggest' ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400');
                                const bgStyle = isDone ? 'bg-emerald-50/50 dark:bg-emerald-500/5' : (info.status === 'suggest' ? 'bg-amber-50/50 dark:bg-amber-500/5' : 'bg-rose-50/50 dark:bg-rose-500/5');
                                const borderStyle = isDone ? 'border-emerald-200 dark:border-emerald-500/20' : (info.status === 'suggest' ? 'border-amber-200 dark:border-amber-500/20' : 'border-rose-200 dark:border-rose-500/20');
                                const showCreate = quickCreate[item.name] !== undefined && quickCreate[item.name] !== null;

                                return (
                                    <div key={idx} className={\`p-4 rounded-2xl border \${bgStyle} \${borderStyle}\`}>
                                        {/* Row: marketplace item */}
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <div className="font-bold text-[14px] text-slate-800 dark:text-white mb-1">{item.name}</div>
                                                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                                    <span>Kod: {item.code || item.barcode || '—'}</span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                                                    <span>Adet: <strong className="font-black text-slate-700 dark:text-slate-200">x{item.qty || item.quantity || 1}</strong></span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className={\`text-[10px] font-black uppercase tracking-widest \${statusColor}\`}>
                                                    {isDone ? '✅ Eşleştirildi' : SCORE_LABELS[info.status]}
                                                </div>
                                                {info.score > 0 && <div className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-widest">Skor: {info.score}/100</div>}
                                            </div>
                                        </div>

                                        {/* Match selector */}
                                        {info.status === 'suggest' && !isDone && (
                                            <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/10 mb-3 px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-500/20">
                                                💡 AI Önerisi: <strong className="font-black">{info.internalProduct?.name}</strong> (Skor: {info.score}) — Lütfen doğrulayın veya listeden başka bir ürün seçin.
                                            </div>
                                        )}

                                        {info.status !== 'notFound' || isDone ? (
                                            <select
                                                className={\`w-full px-4 py-3 rounded-xl text-[13px] font-bold outline-none border transition-colors \${isDone ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-400' : 'bg-white dark:bg-[#1e293b] border-amber-300 dark:border-amber-500/30 text-slate-800 dark:text-white'}\`}
                                                value={currentMap?.productId || ''}
                                                onChange={e => setMappedItems({ ...mappedItems, [item.name]: { productId: e.target.value, status: 'manual' } })}
                                            >
                                                <option value="">— Stok Kartı Seçin —</option>
                                                {(info.suggestions || []).length > 0 && (
                                                    <optgroup label={\`🤖 AI Önerileri (en iyi \${info.suggestions.length})\`}>
                                                        {(info.suggestions as any[])?.map((s: any) => (
                                                            <option key={s.product.id} value={s.product.id}>
                                                                {s.product.name} — Stok: {s.product.stock} — Skor: {s.score}
                                                            </option>
                                                        ))}
                                                    </optgroup>
                                                )}
                                                <optgroup label="📦 Tüm Stok Kartları">
                                                    {inventoryProducts?.map((inv: any) => (
                                                        <option key={inv.id} value={inv.id}>
                                                            {inv.name} ({inv.stock} Adet)
                                                        </option>
                                                    ))}
                                                </optgroup>
                                            </select>
                                        ) : (
                                            /* notFound — offer create */
                                            <div>
                                                {!showCreate ? (
                                                    <div className="flex gap-3">
                                                        <select
                                                            className="flex-1 bg-white dark:bg-[#1e293b] border border-rose-300 dark:border-rose-500/30 px-4 py-3 rounded-xl text-[13px] font-bold text-slate-800 dark:text-white outline-none"
                                                            value={currentMap?.productId || ''}
                                                            onChange={e => setMappedItems({ ...mappedItems, [item.name]: { productId: e.target.value, status: 'manual' } })}
                                                        >
                                                            <option value="">— Manuel Seçim Yap —</option>
                                                            {inventoryProducts?.map((inv: any) => (
                                                                <option key={inv.id} value={inv.id}>{inv.name} ({inv.stock} Adet)</option>
                                                            ))}
                                                        </select>
                                                        <button
                                                            onClick={() => setQuickCreate({ ...quickCreate, [item.name]: { name: item.name, code: item.code || '', stock: '0', price: '0' } })}
                                                            className="px-5 py-3 rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[11px] font-black uppercase tracking-widest hover:bg-indigo-100 dark:hover:bg-indigo-500/20 active:scale-95 transition-all whitespace-nowrap"
                                                        >
                                                            + Yeni Kart Oluştur
                                                        </button>
                                                    </div>
                                                ) : (
                                                    /* Quick-create form */
                                                    <div className="bg-indigo-50/50 dark:bg-indigo-500/5 border border-indigo-200 dark:border-indigo-500/20 rounded-xl p-4 flex flex-col gap-3">
                                                        <div className="font-black text-[12px] text-indigo-600 dark:text-indigo-400 mb-1">🆕 Yeni Stok Kartı Hızlı Oluşturma</div>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className="flex flex-col gap-1">
                                                                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Ürün Adı *</label>
                                                                <input type="text" value={quickCreate[item.name]!.name}
                                                                    onChange={e => setQuickCreate({ ...quickCreate, [item.name]: { ...quickCreate[item.name]!, name: e.target.value } })}
                                                                    className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-[13px] font-semibold text-slate-800 dark:text-white outline-none focus:border-indigo-500"
                                                                />
                                                            </div>
                                                            <div className="flex flex-col gap-1">
                                                                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Ürün Kodu</label>
                                                                <input type="text" value={quickCreate[item.name]!.code}
                                                                    onChange={e => setQuickCreate({ ...quickCreate, [item.name]: { ...quickCreate[item.name]!, code: e.target.value } })}
                                                                    className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-[13px] font-semibold text-slate-800 dark:text-white outline-none focus:border-indigo-500"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className="flex flex-col gap-1">
                                                                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Mevcut Stok</label>
                                                                <input type="number" value={quickCreate[item.name]!.stock}
                                                                    onChange={e => setQuickCreate({ ...quickCreate, [item.name]: { ...quickCreate[item.name]!, stock: e.target.value } })}
                                                                    className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-[13px] font-semibold text-slate-800 dark:text-white outline-none focus:border-indigo-500"
                                                                />
                                                            </div>
                                                            <div className="flex flex-col gap-1">
                                                                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Fiyat (₺)</label>
                                                                <input type="number" value={quickCreate[item.name]!.price}
                                                                    onChange={e => setQuickCreate({ ...quickCreate, [item.name]: { ...quickCreate[item.name]!, price: e.target.value } })}
                                                                    className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-[13px] font-semibold text-slate-800 dark:text-white outline-none focus:border-indigo-500"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-3 mt-1">
                                                            <button onClick={() => handleCreateProduct(item.name, quickCreate[item.name]!)}
                                                                disabled={isCreating === item.name}
                                                                className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[11px] uppercase tracking-widest disabled:opacity-50 transition-colors">
                                                                {isCreating === item.name ? 'Oluşturuluyor...' : '✅ Stok Kartı Oluştur ve Seç'}
                                                            </button>
                                                            <button onClick={() => setQuickCreate({ ...quickCreate, [item.name]: null })}
                                                                className="px-5 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1e293b] text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 font-black text-[11px] uppercase tracking-widest transition-colors">
                                                                İptal
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Finalize button */}
                        <div className="pt-2 mt-auto">
                            <button
                                onClick={finalizeInvoice}
                                disabled={isLoadingMapping || !allMapped}
                                className={\`w-full h-14 rounded-full font-black text-[13px] uppercase tracking-widest transition-all \${allMapped ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 active:scale-[0.98]' : 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-500 cursor-not-allowed'}\`}
                            >
                                {isLoadingMapping ? 'İŞLENİYOR...' : (allMapped ? '✅ Eşleştirmeyi Kaydet ve Faturayı Oluştur' : \`⚠️ Lütfen Tüm Ürünleri Eşleştirin (\${selectedOrder.items.filter((i: any) => !mappedItems[i.name]?.productId).length} eksik)\`)}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );`
);
fs.writeFileSync('src/components/sales/InvoiceMappingModal.tsx', code);
console.log('done rewriting InvoiceMappingModal');
