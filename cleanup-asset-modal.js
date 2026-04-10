const fs = require('fs');
let content = fs.readFileSync('src/app/(app)/customers/[id]/CustomerDetailClient.tsx', 'utf8');

const startStr = "{editingAsset && (";
const endStr = "{/* STATEMENT MODAL */}";

const startIdx = content.indexOf(startStr);
const endIdx = content.indexOf(endStr);

if (startIdx !== -1 && endIdx !== -1) {
    const replaceStr = `{editingAsset && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[6000] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <EnterpriseCard className="w-full max-w-2xl shadow-2xl border-blue-500/30 text-left p-0 overflow-hidden bg-white dark:bg-[#0f172a]">
                        <div className="p-6 bg-slate-50 dark:bg-[#1e293b]/50 border-b border-slate-200 dark:border-white/10 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3 tracking-tight">
                                    <span className="text-2xl">🏍️</span> Cihaz Sicil Kartı
                                </h3>
                                <p className="text-[13px] text-slate-500 font-medium mt-1">Bu cihaza ait temel bilgiler ve servis geçmişi.</p>
                            </div>
                            <button
                                onClick={() => setEditingAsset(null)}
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 font-bold"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-6 flex flex-col gap-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[11px] font-bold tracking-widest uppercase text-slate-500 mb-1.5 block">Ana Kimlik (Seri No / Plaka)</label>
                                    <input type="text" value={editingAsset.primaryIdentifier || ''} onChange={e => setEditingAsset({...editingAsset, primaryIdentifier: e.target.value})} className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] text-[13px] font-bold focus:border-blue-500 outline-none" />
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold tracking-widest uppercase text-slate-500 mb-1.5 block">İkincil Seçim / Şablon Adı</label>
                                    <input type="text" value={editingAsset.secondaryIdentifier || ''} onChange={e => setEditingAsset({...editingAsset, secondaryIdentifier: e.target.value})} className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] text-[13px] font-bold focus:border-blue-500 outline-none" />
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold tracking-widest uppercase text-slate-500 mb-1.5 block">Marka</label>
                                    <input type="text" value={editingAsset.brand || ''} onChange={e => setEditingAsset({...editingAsset, brand: e.target.value})} className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] text-[13px] font-bold focus:border-blue-500 outline-none" />
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold tracking-widest uppercase text-slate-500 mb-1.5 block">Model Serisi</label>
                                    <input type="text" value={editingAsset.model || ''} onChange={e => setEditingAsset({...editingAsset, model: e.target.value})} className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] text-[13px] font-bold focus:border-blue-500 outline-none" />
                                </div>
                            </div>
                            
                            <div className="mt-2 bg-slate-50 dark:bg-[#1e293b]/50 border border-slate-200 dark:border-white/5 rounded-xl p-4">
                                <h4 className="text-[12px] font-bold text-slate-800 dark:text-slate-300 uppercase tracking-widest mb-3">Servis İşlemleri Geçmişi</h4>
                                {services.filter((s) => s.assetId === editingAsset.id || s.plate === editingAsset.primaryIdentifier).length === 0 ? (
                                    <div className="text-[12px] text-slate-400 italic">Bu cihaza ait servis kaydı bulunmuyor.</div>
                                ) : (
                                    <div className="space-y-2 max-h-[160px] overflow-auto custom-scroll pr-2">
                                        {services.filter((s) => s.assetId === editingAsset.id || s.plate === editingAsset.primaryIdentifier).map((s, i) => (
                                            <div key={i} className="flex justify-between items-center p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-xl">
                                                <div>
                                                    <div className="font-bold text-[13px] text-slate-800 dark:text-white mb-0.5">{s.date ? new Date(s.date).toLocaleDateString("tr-TR") : "-"}</div>
                                                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Durum: {s.status}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-black text-[14px] text-blue-600 dark:text-blue-400 mb-0.5">{Number(s.totalAmount || 0).toLocaleString("tr-TR")} ₺</div>
                                                    <Link href={\`/service/\${s.id}\`} className="text-[10px] font-black text-slate-400 hover:text-blue-500">İNCELE ↗</Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <button onClick={() => {
                                fetch(\`/api/assets/\${editingAsset.id}\`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        primaryIdentifier: editingAsset.primaryIdentifier,
                                        secondaryIdentifier: editingAsset.secondaryIdentifier,
                                        brand: editingAsset.brand,
                                        model: editingAsset.model
                                    })
                                }).then(res => res.json()).then(data => {
                                    if(data.id) {
                                        setEditingAsset(null);
                                        fetchAssets();
                                    } else {
                                        alert('Güncellenemedi OBP');
                                    }
                                })
                            }} className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold uppercase tracking-widest text-[13px] shadow-lg shadow-blue-500/20 transition-all">
                                BİLGİLERİ KAYDET
                            </button>
                        </div>
                    </EnterpriseCard>
                </div>
            )}
            `;
    
    // Also inject statement tag so we don't lose it
    const finalContent = content.substring(0, startIdx) + replaceStr + "            {/* STATEMENT MODAL */}" + content.substring(endIdx + 25);
    fs.writeFileSync('src/app/(app)/customers/[id]/CustomerDetailClient.tsx', finalContent, 'utf8');
    console.log("Success");
} else {
    console.log("Failed to find boundaries", startIdx, endIdx);
}
