const fs = require('fs');

const editorFile = 'c:/Users/ertke/OneDrive/Masaüstü/periodya/muhasebeapp/motoroil/src/app/(app)/admin/cms/editor/[pageId]/EditorClient.tsx';
let editorContent = fs.readFileSync(editorFile, 'utf8');

// 1. ADD TABS FLAG URL FIELD
const tabsPattern = /<input placeholder="Monthly" value=\{activeBlock\.content\.chartFilter \|\| ''\} onChange=\{e => updateBlockData\('chartFilter', e\.target\.value\)\} className="w-full bg-slate-900 border border-slate-700\/50 p-1\.5 text-\[10px\] text-white rounded outline-none h-7" \/>\s*<\/div>\s*<\/div>/;

if(tabsPattern.test(editorContent)) {
    editorContent = editorContent.replace(tabsPattern, `<input placeholder="Monthly" value={activeBlock.content.chartFilter || ''} onChange={e => updateBlockData('chartFilter', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 p-1.5 text-[10px] text-white rounded outline-none h-7" />
                           </div>
                           <p className="text-xs font-bold text-slate-400 mt-4 border-t border-slate-800 pt-3">Floating UI Görselleri</p>
                           <input placeholder="Bayrak Linki (örn: https://flagcdn.com/w40/tr.png)" value={activeBlock.content.balanceFlagUrl || ''} onChange={e => updateBlockData('balanceFlagUrl', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 p-1.5 text-[10px] text-white rounded outline-none h-7 mt-2" />
                        </div>`);
    console.log("TABS SUCCESS");
} else {
    console.log("TABS NOT FOUND");
}

// 2. ADD INTEGRATION BENTO FIELDS AND BUTTON TEXT
// wait, the testimonial heading is in MODERN_INTEGRATIONS block
const integPattern = /<input placeholder="Yorumlar Açıklama" value=\{activeBlock\.content\.testimonialDesc \|\| ''\} onChange=\{e => updateBlockData\('testimonialDesc', e\.target\.value\)\} className="w-full bg-slate-900 border border-slate-700\/50 rounded p-2 text-xs text-white" \/>\s*<\/div>/;

if(integPattern.test(editorContent)) {
    editorContent = editorContent.replace(integPattern, `<input placeholder="Yorumlar Açıklama" value={activeBlock.content.testimonialDesc || ''} onChange={e => updateBlockData('testimonialDesc', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 rounded p-2 text-xs text-white" />
                           
                           <p className="text-[10px] text-amber-400 mt-2 font-bold mt-4 border-t border-slate-800 pt-3">Link & Buton</p>
                           <input placeholder="Buton Metni (Tüm Yorumlar)" value={activeBlock.content.integBtnText || ''} onChange={e => updateBlockData('integBtnText', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 rounded p-1.5 text-xs text-white mt-1" />

                           <p className="text-[10px] text-blue-400 mt-4 border-t border-slate-800 pt-3 font-bold">1. Geniş Resim (Sol Üst)</p>
                           <input placeholder="Geniş Resim URL (E-Ticaret Yönetimi)" value={activeBlock.content.integB1Img || ''} onChange={e => updateBlockData('integB1Img', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 rounded p-1.5 text-[10px] text-white mt-1" />
                           <input placeholder="E-Ticaret Yönetimi" value={activeBlock.content.integB1Title || ''} onChange={e => updateBlockData('integB1Title', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 rounded p-1.5 text-xs text-white mt-1" />
                           <input placeholder="Entegrasyon, Depo, Fatura" value={activeBlock.content.integB1Desc || ''} onChange={e => updateBlockData('integB1Desc', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 rounded p-1.5 text-xs text-white mt-1" />

                           <p className="text-[10px] text-orange-400 mt-4 border-t border-slate-800 pt-3 font-bold">2. Dikey Resim (Sağ Üst)</p>
                           <input placeholder="Dikey Resim URL (Focus)" value={activeBlock.content.integB2Img || ''} onChange={e => updateBlockData('integB2Img', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 rounded p-1.5 text-[10px] text-white mt-1" />
                           <input placeholder="%98.2" value={activeBlock.content.integB2Title || ''} onChange={e => updateBlockData('integB2Title', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 rounded p-1.5 text-xs text-white mt-1" />
                           <input placeholder="En iyi ve güvenilir..." value={activeBlock.content.integB2Desc || ''} onChange={e => updateBlockData('integB2Desc', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 rounded p-1.5 text-xs text-white mt-1" />
                           
                           <p className="text-[10px] text-cyan-400 mt-4 border-t border-slate-800 pt-3 font-bold">3. Mavi İstatistik (Sol Alt)</p>
                           <input placeholder="30x" value={activeBlock.content.integB3Title || ''} onChange={e => updateBlockData('integB3Title', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 rounded p-1.5 text-xs text-white mt-1" />
                           <input placeholder="Zaman tasarrufu..." value={activeBlock.content.integB3Desc || ''} onChange={e => updateBlockData('integB3Desc', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 rounded p-1.5 text-xs text-white mt-1" />
                           <input placeholder="Avatar URL, Avatar URL (virgülle)" value={activeBlock.content.integB3Avatars || ''} onChange={e => updateBlockData('integB3Avatars', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 rounded p-1.5 text-[10px] text-white mt-1" />

                           <p className="text-[10px] text-purple-400 mt-4 border-t border-slate-800 pt-3 font-bold">4. Yorum (Sağ Alt)</p>
                           <input placeholder="Periodya" value={activeBlock.content.integB4Brand || ''} onChange={e => updateBlockData('integB4Brand', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 rounded p-1.5 text-[10px] text-white mt-1" />
                           <textarea placeholder="Yorum metni..." value={activeBlock.content.integB4Quote || ''} onChange={e => updateBlockData('integB4Quote', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 rounded p-1.5 text-[10px] text-white mt-1 h-12" />
                           <div className="flex gap-2 mt-1">
                                <input placeholder="Kişi İsmi" value={activeBlock.content.integB4Name || ''} onChange={e => updateBlockData('integB4Name', e.target.value)} className="w-1/2 bg-slate-900 border border-slate-700/50 rounded p-1.5 text-[10px] text-white" />
                                <input placeholder="Ünvan (Şirket Sahibi)" value={activeBlock.content.integB4Role || ''} onChange={e => updateBlockData('integB4Role', e.target.value)} className="w-1/2 bg-slate-900 border border-slate-700/50 rounded p-1.5 text-[10px] text-white" />
                           </div>
                           <input placeholder="Yazar Avatar URL" value={activeBlock.content.integB4Avatar || ''} onChange={e => updateBlockData('integB4Avatar', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 rounded p-1.5 text-[10px] text-white mt-1" />
                           <input placeholder="(2.3k+ Reviews)" value={activeBlock.content.integB4Reviews || ''} onChange={e => updateBlockData('integB4Reviews', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 rounded p-1.5 text-[10px] text-white mt-1" />
                        </div>`);
    console.log("INTEG SUCCESS");
} else {
    console.log("INTEG NOT FOUND");
}

fs.writeFileSync(editorFile, editorContent);
