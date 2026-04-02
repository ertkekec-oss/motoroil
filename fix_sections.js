const fs = require('fs');

const file = 'c:/Users/ertke/OneDrive/Masaüstü/periodya/muhasebeapp/motoroil/src/app/(app)/service/[id]/ServiceDetailClient.tsx';
let content = fs.readFileSync(file, 'utf8');

const regexToReplace = /<div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white\/10 rounded-\[24px\] shadow-sm p-4 sm:p-6 lg:p-8 animate-in fade-in zoom-in-95 duration-200">[\s\S]*?<\/div>\s*\}\)\s*<\/div>/;

const replacement = `
                    {/* PARTS SECTION */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[24px] shadow-sm p-4 sm:p-6 lg:p-8">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
                            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Package className="w-5 h-5 text-blue-500" />
                                Kullanılan Yedek Parçalar & Ürün Satışı
                            </h3>
                            <button onClick={() => setProductModalOpen(true)} className="w-full sm:w-auto h-[36px] px-4 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-indigo-200 dark:border-indigo-500/20 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 shadow-sm">
                                <ScanLine className="w-4 h-4" />
                                Barkod / Katalogdan Seç (Upsell)
                            </button>
                        </div>
                        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-widest font-bold border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/30">
                                        <th className="py-3 px-4 font-bold whitespace-nowrap">Açıklama</th>
                                        <th className="py-3 px-4 font-bold whitespace-nowrap text-right">Miktar</th>
                                        <th className="py-3 px-4 font-bold whitespace-nowrap text-right">B. Fiyat</th>
                                        <th className="py-3 px-4 font-bold whitespace-nowrap text-right">Toplam</th>
                                        <th className="py-3 px-4 font-bold whitespace-nowrap text-center">İşlem</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                    {parts.length === 0 ? (
                                        <tr><td colSpan={5} className="py-8 text-center text-sm font-medium text-slate-500">Parça Eklenmemiş.</td></tr>
                                    ) : (
                                        parts.map((item: any) => (
                                            <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                <td className="py-3 px-4 text-sm font-semibold text-slate-900 dark:text-white">{item.name}</td>
                                                <td className="py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400 text-right">{Number(item.quantity)}</td>
                                                <td className="py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400 text-right">{Number(item.unitPrice).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                                                <td className="py-3 px-4 text-sm font-bold text-blue-600 dark:text-blue-400 text-right">{Number(item.totalPrice).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                                                <td className="py-3 px-4 text-center">
                                                    <button onClick={() => handleDeleteItem(item.id)} className="w-8 h-8 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center justify-center mx-auto transition-colors">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* LABOR SECTION */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[24px] shadow-sm p-4 sm:p-6 lg:p-8 mb-10">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
                            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Clock className="w-5 h-5 text-amber-500" />
                                Uygulanan İşçilik & Hizmetler
                            </h3>
                        </div>

                        {/* Add Labor Form */}
                        <div className="flex flex-col sm:flex-row gap-3 mb-6 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-white/10">
                            <div className="flex-1">
                                <label className="text-xs font-bold text-slate-500 mb-1.5 block">İşçilik / Hizmet Adı</label>
                                <input type="text" value={newItemName} onChange={e => setNewItemName(e.target.value)} placeholder="Manuel işçilik açıklaması giriniz..." className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-[13px] font-medium focus:ring-2 focus:ring-blue-500/50 outline-none shadow-sm" />
                            </div>
                            <div className="flex gap-3">
                                <div className="w-1/3 sm:w-20">
                                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">Miktar</label>
                                    <input type="number" min="1" value={newItemQty} onChange={e => setNewItemQty(Number(e.target.value))} className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-[13px] font-bold focus:ring-2 focus:ring-blue-500/50 outline-none text-center shadow-sm" />
                                </div>
                                <div className="w-2/3 sm:w-32">
                                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">Birim Fiyat (₺)</label>
                                    <input type="number" min="0" value={newItemPrice} onChange={e => setNewItemPrice(Number(e.target.value))} className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-[13px] font-bold focus:ring-2 focus:ring-blue-500/50 outline-none text-right shadow-sm" />
                                </div>
                            </div>
                            <div className="w-full sm:w-32 flex items-end mt-2 sm:mt-0">
                                <button onClick={() => handleAddItem('LABOR')} className="w-full h-10 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-[10px] text-sm sm:text-xs font-bold flex justify-center items-center gap-1.5 transition-all shadow-md active:scale-95">
                                    <Plus className="w-4 h-4" /> Ekle
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-widest font-bold border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/30">
                                        <th className="py-3 px-4 font-bold whitespace-nowrap">Açıklama</th>
                                        <th className="py-3 px-4 font-bold whitespace-nowrap text-right">Miktar</th>
                                        <th className="py-3 px-4 font-bold whitespace-nowrap text-right">B. Fiyat</th>
                                        <th className="py-3 px-4 font-bold whitespace-nowrap text-right">Toplam</th>
                                        <th className="py-3 px-4 font-bold whitespace-nowrap text-center">İşlem</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                    {labor.length === 0 ? (
                                        <tr><td colSpan={5} className="py-8 text-center text-sm font-medium text-slate-500">İşçilik Eklenmemiş.</td></tr>
                                    ) : (
                                        labor.map((item: any) => (
                                            <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                <td className="py-3 px-4 text-sm font-semibold text-slate-900 dark:text-white">{item.name}</td>
                                                <td className="py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400 text-right">{Number(item.quantity)}</td>
                                                <td className="py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400 text-right">{Number(item.unitPrice).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                                                <td className="py-3 px-4 text-sm font-bold text-amber-600 dark:text-amber-400 text-right">{Number(item.totalPrice).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                                                <td className="py-3 px-4 text-center">
                                                    <button onClick={() => handleDeleteItem(item.id)} className="w-8 h-8 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center justify-center mx-auto transition-colors">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
            </div>`;

content = content.replace(regexToReplace, replacement);
fs.writeFileSync(file, content, 'utf8');
console.log('Fixed ServiceDetailClient!');
