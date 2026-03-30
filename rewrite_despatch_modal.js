const fs = require('fs');
let code = fs.readFileSync('src/components/sales/DespatchModal.tsx', 'utf8');

// Replace standard outer block
code = code.replace(/<div style={{ position: 'fixed'[\s\S]*?<\/div>[\s]*<\/div>[\s]*\);/m, 
`(
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000 }} className="flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[24px] shadow-2xl w-full max-w-[500px] relative animate-in zoom-in-95 duration-200 flex flex-col overflow-hidden max-h-[90vh]">
                
                {/* Header */}
                <div className="bg-[#f8fafc] dark:bg-[#1e293b]/50 border-b border-slate-200 dark:border-white/5 px-6 py-5 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-400 text-lg">
                            📦
                        </div>
                        <div>
                            <h2 className="text-[16px] font-black text-slate-800 dark:text-white tracking-tight leading-none mb-1">
                                e-İrsaliye Gönderimi Detayları
                            </h2>
                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                Nakliye Bilgileri
                            </p>
                        </div>
                    </div>
                    <button onClick={() => setShowDespatchModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors">
                        ✕
                    </button>
                </div>

                {/* Form Body Container */}
                <div className="p-6 overflow-y-auto w-full space-y-4">
                    <p className="text-[12px] font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/5 mb-2">
                        e-İrsaliye gönderebilmek için zorunlu nakliye/şoför bilgilerini doldurunuz. Eğer kargo firması ile gönderiyorsanız plakaya kargo firması plakasını (örn: "Kargo") yazabilirsiniz.
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Plaka No</label>
                            <input
                                type="text" value={despatchForm.plateNumber}
                                onChange={e => setDespatchForm({ ...despatchForm, plateNumber: e.target.value })}
                                placeholder="Örn: 34ABC123"
                                className="w-full bg-slate-50 dark:bg-[#1e293b]/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-[13px] font-semibold text-slate-800 dark:text-white outline-none focus:border-orange-500 transition-colors"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Dorse Plaka No (Opsiyonel)</label>
                            <input
                                type="text" value={despatchForm.trailerPlateNumber}
                                onChange={e => setDespatchForm({ ...despatchForm, trailerPlateNumber: e.target.value })}
                                placeholder="Örn: 34DEF456"
                                className="w-full bg-slate-50 dark:bg-[#1e293b]/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-[13px] font-semibold text-slate-800 dark:text-white outline-none focus:border-orange-500 transition-colors"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Şoför Adı</label>
                            <input
                                type="text" value={despatchForm.driverName}
                                onChange={e => setDespatchForm({ ...despatchForm, driverName: e.target.value })}
                                placeholder="Örn: Ahmet"
                                className="w-full bg-slate-50 dark:bg-[#1e293b]/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-[13px] font-semibold text-slate-800 dark:text-white outline-none focus:border-orange-500 transition-colors"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Şoför Soyadı</label>
                            <input
                                type="text" value={despatchForm.driverSurname}
                                onChange={e => setDespatchForm({ ...despatchForm, driverSurname: e.target.value })}
                                placeholder="Örn: Yılmaz"
                                className="w-full bg-slate-50 dark:bg-[#1e293b]/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-[13px] font-semibold text-slate-800 dark:text-white outline-none focus:border-orange-500 transition-colors"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Şoför TCKN</label>
                        <input
                            type="text" value={despatchForm.driverId}
                            onChange={e => setDespatchForm({ ...despatchForm, driverId: e.target.value })}
                            placeholder="11 haneli TCKN" maxLength={11}
                            className="w-full bg-slate-50 dark:bg-[#1e293b]/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-[13px] font-semibold text-slate-800 dark:text-white outline-none focus:border-orange-500 transition-colors"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">İrsaliye Seri Özel Kod (Opsiyonel)</label>
                        <input
                            type="text" value={despatchForm.despatchSeries}
                            onChange={e => setDespatchForm({ ...despatchForm, despatchSeries: e.target.value })}
                            placeholder="Örn: IRS (Sadece SERİ KODU, numara sistemden verilir)" maxLength={3}
                            className="w-full bg-slate-50 dark:bg-[#1e293b]/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-[13px] font-semibold text-slate-800 dark:text-white outline-none focus:border-orange-500 transition-colors"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 p-5 border-t border-slate-200 dark:border-white/5 mt-auto bg-slate-50 dark:bg-[#0f172a]">
                    <button onClick={() => setShowDespatchModal(false)} className="px-5 h-[42px] bg-white dark:bg-[#1e293b]/50 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full text-[11px] font-black uppercase tracking-widest transition-colors shadow-sm">
                        İptal
                    </button>
                    <button
                        onClick={handleFinalSendDespatch}
                        disabled={isSendingDespatch}
                        className={\`px-8 h-[42px] \${isSendingDespatch ? 'opacity-50 cursor-not-allowed' : ''} bg-orange-600 hover:bg-orange-700 text-white rounded-full text-[11px] font-black uppercase tracking-widest shadow-lg shadow-orange-500/20 transition-all active:scale-[0.98]\`}
                    >
                        {isSendingDespatch ? 'Gönderiliyor...' : 'e-İrsaliye Gönder'}
                    </button>
                </div>
            </div>
        </div>
    );`
);
fs.writeFileSync('src/components/sales/DespatchModal.tsx', code);
console.log('done rewriting DespatchModal');
