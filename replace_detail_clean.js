const fs = require('fs');
const file = 'c:/Users/ertke/OneDrive/Masaüstü/periodya/muhasebeapp/motoroil/src/app/(app)/service/[id]/ServiceDetailClient.tsx';
let c = fs.readFileSync(file, 'utf8');

const regexToReplace = /<div className="flex gap-4 sm:gap-6 mt-4 sm:mt-6 border-b border-slate-200 dark:border-white\/5 overflow-x-auto custom-scroll -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">[\s\S]*?\{productModalOpen && \(/;

const newSection = `
                {/* TABS REMOVED */}
            </div>

            <div className="flex-1 p-4 sm:p-6 lg:p-10 max-w-[1400px] mx-auto w-full space-y-8">
                {/* 1. DETAILS */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in zoom-in-95 duration-200">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[24px] shadow-sm p-6">
                            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-white/5 pb-2">
                                <FileText className="w-4 h-4" /> Şikayet & İstekler
                            </h3>
                            <p className="text-[14px] font-semibold text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                                {order.complaint || 'Belirtilmedi'}
                            </p>
                        </div>
                        
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[24px] shadow-sm p-6">
                            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-white/5 pb-2">
                                <Shield className="w-4 h-4" /> Cihaz Bilgisi & Araç Karnesi
                            </h3>
                            {order.asset ? (
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500 flex items-center justify-center shrink-0">
                                            <Wrench className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <div className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                                {order.asset.brand} <span className="text-sm text-slate-400">{order.asset.primaryIdentifier}</span>
                                            </div>
                                            <div className="text-sm font-medium text-slate-500">
                                                {order.asset.model || 'Model Belirtilmemiş'} {order.asset.productionYear ? \` • \${order.asset.productionYear}\` : ''} {order.asset.secondaryIdentifier ? \` • Şase: \${order.asset.secondaryIdentifier}\` : ''}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mt-2 p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-xl">
                                        <div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Geliş KM</div>
                                            <div className="text-[13px] font-bold text-slate-700 dark:text-slate-200">{order.currentKm_or_Use ? \`\${order.currentKm_or_Use.toLocaleString()} KM\` : 'Belirtilmedi'}</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Sonraki Servis KM</div>
                                            <div className="text-[13px] font-bold text-emerald-600 dark:text-emerald-400">{order.nextKm_or_Use ? \`\${order.nextKm_or_Use.toLocaleString()} KM\` : 'Belirlenmedi'}</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Sonraki Servis Tarihi</div>
                                            <div className="text-[13px] font-bold text-emerald-600 dark:text-emerald-400">{order.nextMaintenanceAt ? new Date(order.nextMaintenanceAt).toLocaleDateString('tr-TR') : 'Belirlenmedi'}</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Servise Geliş Tarihi</div>
                                            <div className="text-[13px] font-bold text-slate-700 dark:text-slate-200">{new Date(order.createdAt).toLocaleDateString('tr-TR')}</div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <span className="text-sm font-medium text-slate-500">Cihaz belirtilmemiş.</span>
                            )}
                        </div>
                    </div>
                    
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-[24px] shadow-sm p-6 flex flex-col justify-between">
                            <h3 className="text-[12px] font-black tracking-widest text-slate-500 uppercase mb-4">Finansal Özet</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm font-medium text-slate-600 dark:text-slate-400">
                                    <span>Yedek Parça</span>
                                    <span>{Number(parts.reduce((s:number, p:any) => s + Number(p.totalPrice), 0)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                                </div>
                                <div className="flex justify-between items-center text-sm font-medium text-slate-600 dark:text-slate-400">
                                    <span>İşçilik</span>
                                    <span>{Number(labor.reduce((s:number, l:any) => s + Number(l.totalPrice), 0)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                                </div>
                                <div className="h-px w-full bg-slate-200 dark:bg-white/10 my-2"></div>
                                <div className="flex justify-between items-center text-[18px] font-black text-slate-900 dark:text-white">
                                    <span>GENEL TOPLAM</span>
                                    <span className="text-blue-600 dark:text-blue-500">{Number(order.totalAmount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. PARTS SECTION */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[24px] shadow-sm p-4 sm:p-6 lg:p-8 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Package className="w-5 h-5 text-blue-500" /> Kullanılan Yedek Parçalar & Ürün Satışı
                        </h3>
                        <button onClick={() => setProductModalOpen(true)} className="w-full sm:w-auto h-[36px] px-4 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-indigo-200 dark:border-indigo-500/20 hover:bg-indigo-100 dark:hover:bg-indigo-500/20">
                            <ScanLine className="w-4 h-4" /> Barkod / Katalogdan Seç
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
                                    <tr><td colSpan={5} className="py-8 text-center text-sm font-medium text-slate-500">Henüz yedek parça kayıt eklenmemiş.</td></tr>
                                ) : (
                                    parts.map((item: any) => (
                                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="py-3 px-4 text-sm font-semibold text-slate-900 dark:text-white">{item.name}</td>
                                            <td className="py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400 text-right">{Number(item.quantity)}</td>
                                            <td className="py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400 text-right">{Number(item.unitPrice).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                                            <td className="py-3 px-4 text-sm font-bold text-blue-600 dark:text-blue-400 text-right">{Number(item.totalPrice).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                                            <td className="py-3 px-4 text-center">
                                                <button onClick={() => handleDeleteItem(item.id)} className="w-8 h-8 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center justify-center mx-auto transition-colors">
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

                {/* 3. LABOR SECTION */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[24px] shadow-sm p-4 sm:p-6 lg:p-8 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Clock className="w-5 h-5 text-amber-500" /> Uygulanan İşçilikler
                        </h3>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 mb-8 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-[16px] border border-slate-200 dark:border-white/10">
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
                            <button onClick={() => handleAddItem('LABOR')} className="w-full h-[44px] sm:h-10 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-500/20 border border-amber-200 dark:border-amber-500/20 rounded-[10px] sm:rounded-lg text-sm sm:text-xs font-bold flex justify-center items-center gap-1.5 transition-colors">
                                <Plus className="w-5 h-5 sm:w-4 sm:h-4" /> İşçilik Ekle
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
                                    <tr><td colSpan={5} className="py-8 text-center text-sm font-medium text-slate-500">Henüz işçilik kayıt eklenmemiş.</td></tr>
                                ) : (
                                    labor.map((item: any) => (
                                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="py-3 px-4 text-sm font-semibold text-slate-900 dark:text-white">{item.name}</td>
                                            <td className="py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400 text-right">{Number(item.quantity)}</td>
                                            <td className="py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400 text-right">{Number(item.unitPrice).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                                            <td className="py-3 px-4 text-sm font-bold text-amber-600 dark:text-amber-400 text-right">{Number(item.totalPrice).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                                            <td className="py-3 px-4 text-center">
                                                <button onClick={() => handleDeleteItem(item.id)} className="w-8 h-8 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center justify-center mx-auto transition-colors">
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
            </div>

            {productModalOpen && (`;

c = c.replace(regexToReplace, newSection);

fs.writeFileSync(file, c, 'utf8');
console.log('Done!');
