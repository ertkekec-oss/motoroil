const fs = require('fs');

let content = fs.readFileSync('src/app/(app)/reports/page.tsx', 'utf8');

const oldInventoryBlockRegex = /\{\/\* Inventory Tab \*\/\}\s*\{activeTab === 'inventory' && \([\s\S]*?\{activeTab === 'customers' && \(/;

const newInventoryTable = `
                    {/* Inventory Tab */}
                    {activeTab === 'inventory' && (
                        <div className="flex flex-col gap-6">

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 shadow-sm rounded-2xl p-6 flex flex-col justify-center relative overflow-hidden">
                                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 z-10 relative">TOPLAM ENVANTER DEĞERİ (ALIŞ)</div>
                                    <div className="text-4xl font-black text-slate-900 dark:text-white z-10 relative mb-1">₺{inventoryStats.totalValue.toLocaleString()}</div>
                                    <div className="text-xs font-medium text-slate-400 mt-2 z-10 relative">Tüm stokların maliyet bedeli toplamı</div>
                                </div>
                                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 shadow-sm rounded-2xl p-6 flex flex-col justify-center relative overflow-hidden">
                                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 z-10 relative">TOPLAM STOK ADEDİ</div>
                                    <div className="text-4xl font-black text-slate-900 dark:text-white z-10 relative mb-1">{inventoryStats.totalQty.toLocaleString()}</div>
                                    <div className="text-xs font-medium text-slate-400 mt-2 z-10 relative">Şu an depoda bulunan toplam ürün sayısı</div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 shadow-sm rounded-2xl overflow-hidden flex flex-col">
                                <div className="p-5 border-b border-slate-100 dark:border-white/5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">En Yüksek Değerli Envanter (Top 8)</h3>
                                        <p className="text-xs text-slate-500 font-semibold mt-0.5">Depo ve maliyet değeri en yüksek operasyonel emtialar.</p>
                                    </div>
                                    <button onClick={() => router.push('/inventory')} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-bold transition-colors">
                                        Tüm Stoğu Aç
                                    </button>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-white/5">
                                                <th className="p-4 whitespace-nowrap">Ürün Referansı</th>
                                                <th className="p-4 whitespace-nowrap">Stok Miktarı</th>
                                                <th className="p-4 whitespace-nowrap">Birim Maliyet</th>
                                                <th className="p-4 whitespace-nowrap text-right">Toplam Değer</th>
                                                <th className="p-4 whitespace-nowrap text-right">Durum</th>
                                                <th className="p-4 whitespace-nowrap text-right">Aksiyon</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {inventoryStats.topProducts.map((product: any, i: number) => {
                                                const isLow = Number(product.stock) < Number(product.minStock);
                                                return (
                                                <tr key={i} className="group border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer" onClick={() => router.push(\`/inventory/\${product.id || ''}\`)}>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-center text-slate-400 font-black text-[10px]">
                                                                SKU
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors max-w-[200px] truncate" title={product.name}>{product.name}</div>
                                                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{product.barcode || 'BARKODSUZ'}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-sm font-black text-slate-700 dark:text-slate-300">
                                                        {product.stock} {product.unit || 'Adet'}
                                                    </td>
                                                    <td className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">
                                                        ₺{Number(product.buyPrice || product.price).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <div className="text-base font-black text-slate-900 dark:text-white">
                                                            ₺{product.stockValue.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <span className={\`inline-flex items-center px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider \${isLow ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'}\`}>
                                                            {isLow ? 'KRİTİK' : 'NORMAL'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <button className="text-slate-400 group-hover:text-blue-500 transition-colors text-xs font-bold uppercase tracking-wider">İncele →</button>
                                                    </td>
                                                </tr>
                                            )})}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Customers Tab */}
                    {activeTab === 'customers' && (`;

content = content.replace(oldInventoryBlockRegex, newInventoryTable);

fs.writeFileSync('src/app/(app)/reports/page.tsx', content);
console.log("Inventory grid refactored successfully.");
