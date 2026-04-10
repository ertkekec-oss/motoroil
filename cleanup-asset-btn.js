const fs = require('fs');
let content = fs.readFileSync('src/app/(app)/customers/[id]/CustomerDetailClient.tsx', 'utf8');

const targetStr = `<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button onClick={() => setEditingAsset(a)} className="px-2 py-1 bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded text-[10px] font-bold uppercase hover:bg-blue-200 dark:hover:bg-blue-500/20">KARTI AÇ</button>
                                                                <button onClick={() => {
                                                                    if(confirm('Kayıtlı cihaz sicilini silmek istediğinize emin misiniz?')) {
                                                                        fetch(\`/api/assets/\${a.id}\`, { method: 'DELETE' })
                                                                            .then(res => { if(res.ok) fetchAssets(); else alert('Silinemedi'); });
                                                                    }
                                                                }} className="px-2 py-1 bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded text-[10px] font-bold uppercase hover:bg-red-200 dark:hover:bg-red-500/20">SİL</button>
                                                            </div>`;

const replaceStr = `<div className="flex items-center gap-2 mt-2">
                                                                <button onClick={() => setEditingAsset(a)} className="px-3 py-1.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-white/10 text-slate-800 dark:text-white rounded-lg text-[11px] font-black tracking-widest uppercase hover:border-blue-500 hover:text-blue-600 transition-all shadow-sm">KARTI İNCELE / DÜZENLE</button>
                                                                <button onClick={() => {
                                                                    if(confirm('Kayıtlı cihaz sicilini silmek istediğinize emin misiniz?')) {
                                                                        fetch(\`/api/assets/\${a.id}\`, { method: 'DELETE' })
                                                                            .then(res => { if(res.ok) fetchAssets(); else alert('Silinemedi'); });
                                                                    }
                                                                }} className="px-3 py-1.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg text-[11px] font-black uppercase hover:bg-red-100 dark:hover:bg-red-500/20 transition-all opacity-0 group-hover:opacity-100">SİL</button>
                                                            </div>`;

content = content.replace(targetStr, replaceStr);
fs.writeFileSync('src/app/(app)/customers/[id]/CustomerDetailClient.tsx', content, 'utf8');
console.log("Done updating asset row button");
