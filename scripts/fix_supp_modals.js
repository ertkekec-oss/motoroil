const fs = require('fs');
const file = 'src/app/(app)/suppliers/[id]/SupplierDetailClient.tsx';
let data = fs.readFileSync(file, 'utf8');

// Replace CHECK COLLECT MODAL
const checkCollectRegex = /\{\/\* CHECK COLLECT MODAL \*\/\}\s*\{showCheckCollectModal && activeCheck && \([\s\S]*?<\/div>\s*\)\}/;
const newCheckCollect = `{/* CHECK COLLECT MODAL */}
            {showCheckCollectModal && activeCheck && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
                        
                        <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02]">
                            <h3 className="text-[16px] font-black text-slate-800 dark:text-white flex items-center gap-2">
                                {activeCheck.type.includes('Alınan') ? '📥 Tahsilat Onayı' : '📤 Ödeme Onayı'}
                            </h3>
                            <button onClick={() => setShowCheckCollectModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 transition-colors">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>

                        <div className="p-6 flex flex-col gap-6">
                            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[16px] border border-slate-100 dark:border-white/5 text-center flex flex-col items-center justify-center">
                                <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">{activeCheck.type}</div>
                                <div className="text-[32px] font-black text-slate-800 dark:text-white mb-1">{Number(activeCheck.amount).toLocaleString('tr-TR')} ₺</div>
                                <div className="text-[13px] font-semibold text-slate-500">{activeCheck.bank} - {activeCheck.number}</div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[12px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider ml-1">
                                    {activeCheck.type.includes('Alınan') ? 'Tahsilatın Aktarılacağı' : 'Ödemenin Çıkacağı'} Hesap
                                </label>
                                <select
                                    value={targetKasaId}
                                    onChange={(e) => setTargetKasaId(e.target.value)}
                                    className="w-full h-[48px] px-4 rounded-[12px] bg-white dark:bg-[#0f172a] border-2 border-slate-200 dark:border-white/10 focus:border-blue-500 dark:focus:border-blue-500 outline-none text-[14px] font-bold text-slate-700 dark:text-white transition-colors appearance-none"
                                >
                                    <option value="">Seçiniz...</option>
                                    {kasalar.filter((k: any) => k.name !== 'ÇEK / SENET PORTFÖYÜ').map((k: any) => (
                                        <option key={k.id} value={k.id}>{k.name} ({Number(k.balance).toLocaleString('tr-TR')} ₺)</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="px-6 py-5 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
                            <button onClick={() => setShowCheckCollectModal(false)} className="px-5 h-[42px] rounded-[10px] text-[13px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
                                İptal
                            </button>
                            <button
                                onClick={handleExecuteCheckCollect}
                                disabled={isProcessingCollection || !targetKasaId}
                                className="px-6 h-[42px] rounded-[10px] text-[13px] font-black text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                            >
                                {isProcessingCollection ? 'İŞLENİYOR...' : 'İŞLEMİ ONAYLA'}
                            </button>
                        </div>

                    </div>
                </div>
            )}`;

// Replace ADJUSTMENT MODAL
const adjustModalRegex = /\{\/\* ADJUSTMENT MODAL \*\/\}\s*\{isAdjustModalOpen && \([\s\S]*?<\/div>\s*\)\}/;
const newAdjustModal = `{/* ADJUSTMENT MODAL */}
            {isAdjustModalOpen && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
                        
                        <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02]">
                            <h3 className="text-[16px] font-black text-slate-800 dark:text-white flex items-center gap-2">
                                ⚖️ Bakiye Düzeltme
                            </h3>
                            <button onClick={() => setIsAdjustModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 transition-colors">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>

                        <div className="p-6 flex flex-col gap-6">
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setAdjustData({ ...adjustData, type: 'DEBT' })} 
                                    className={\`flex-1 h-[48px] rounded-[12px] font-black text-[12px] transition-all \${adjustData.type === 'DEBT' ? 'bg-red-50 text-red-600 border-2 border-red-500 dark:bg-red-500/10 dark:text-red-400' : 'bg-slate-50 text-slate-500 border-2 border-transparent hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-400'}\`}
                                >
                                    BORÇLANDIR 🔴
                                </button>
                                <button 
                                    onClick={() => setAdjustData({ ...adjustData, type: 'CREDIT' })} 
                                    className={\`flex-1 h-[48px] rounded-[12px] font-black text-[12px] transition-all \${adjustData.type === 'CREDIT' ? 'bg-emerald-50 text-emerald-600 border-2 border-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-slate-50 text-slate-500 border-2 border-transparent hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-400'}\`}
                                >
                                    ALACAKLANDIR 🟢
                                </button>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[12px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider ml-1">
                                    TUTAR (₺)
                                </label>
                                <input 
                                    type="number" 
                                    placeholder="0.00" 
                                    value={adjustData.amount} 
                                    onChange={e => setAdjustData({ ...adjustData, amount: e.target.value })} 
                                    className="w-full h-[54px] px-4 rounded-[12px] bg-white dark:bg-[#0f172a] border-2 border-slate-200 dark:border-white/10 focus:border-blue-500 dark:focus:border-blue-500 outline-none text-[20px] font-black text-slate-800 dark:text-white transition-colors"
                                />
                                <p className="text-[11px] font-bold text-slate-500 ml-1 mt-1">
                                    {adjustData.type === 'DEBT' ? '🔴 Girdiğiniz miktar borcumuza eklenecektir.' : '🟢 Girdiğiniz miktar borcumuzdan düşülecektir.'}
                                </p>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[12px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider ml-1">
                                    AÇIKLAMA / NOT
                                </label>
                                <textarea 
                                    placeholder="Düzeltme sebebi..." 
                                    value={adjustData.description} 
                                    onChange={e => setAdjustData({ ...adjustData, description: e.target.value })} 
                                    className="w-full min-h-[100px] p-4 rounded-[12px] bg-white dark:bg-[#0f172a] border-2 border-slate-200 dark:border-white/10 focus:border-blue-500 dark:focus:border-blue-500 outline-none text-[14px] font-semibold text-slate-700 dark:text-white transition-colors resize-y custom-scroll"
                                />
                            </div>
                        </div>

                        <div className="px-6 py-5 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
                            <button onClick={() => setIsAdjustModalOpen(false)} className="px-5 h-[42px] rounded-[10px] text-[13px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
                                İptal
                            </button>
                            <button 
                                onClick={handleAdjustment} 
                                className={\`px-6 h-[42px] rounded-[10px] text-[13px] font-black text-white transition-colors shadow-sm \${adjustData.type === 'DEBT' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}\`}
                            >
                                BAKİYEYİ GÜNCELLE
                            </button>
                        </div>
                    </div>
                </div>
            )}`;

data = data.replace(checkCollectRegex, newCheckCollect);
data = data.replace(adjustModalRegex, newAdjustModal);

fs.writeFileSync(file, data);
console.log('Supplier Modals Rewritten');
