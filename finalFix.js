const fs = require('fs');

const editorFile = 'c:/Users/ertke/OneDrive/Masaüstü/periodya/muhasebeapp/motoroil/src/app/(app)/admin/cms/editor/[pageId]/EditorClient.tsx';
let editorContent = fs.readFileSync(editorFile, 'utf8');

// ---- 1. ADD TABS FLAG URL FIELD ----
editorContent = editorContent.replace(
    `<input placeholder="Monthly" value={activeBlock.content.chartFilter || ''} onChange={e => updateBlockData('chartFilter', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 p-1.5 text-[10px] text-white rounded outline-none h-7" />
                           </div>
                        </div>`,
    `<input placeholder="Monthly" value={activeBlock.content.chartFilter || ''} onChange={e => updateBlockData('chartFilter', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 p-1.5 text-[10px] text-white rounded outline-none h-7" />
                           </div>
                           <p className="text-xs font-bold text-slate-400 mt-4 border-t border-slate-800 pt-3">Floating UI Görselleri</p>
                           <input placeholder="Bayrak Linki (örn: https://flagcdn.com/w40/tr.png)" value={activeBlock.content.balanceFlagUrl || ''} onChange={e => updateBlockData('balanceFlagUrl', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 p-1.5 text-[10px] text-white rounded outline-none h-7 mt-2" />
                        </div>`
);

// ---- 2. ADD INTEGRATION BENTO FIELDS AND BUTTON TEXT ----
editorContent = editorContent.replace(
    `<input placeholder="Yorumlar Ana Başlık" value={activeBlock.content.testimonialHeading || ''} onChange={e => updateBlockData('testimonialHeading', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 rounded p-2 text-xs text-white" />
                           <input placeholder="Yorumlar Açıklama" value={activeBlock.content.testimonialDesc || ''} onChange={e => updateBlockData('testimonialDesc', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 rounded p-2 text-xs text-white" />
                        </div>`,
    `<input placeholder="Yorumlar Ana Başlık" value={activeBlock.content.testimonialHeading || ''} onChange={e => updateBlockData('testimonialHeading', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 rounded p-2 text-xs text-white" />
                           <input placeholder="Yorumlar Açıklama" value={activeBlock.content.testimonialDesc || ''} onChange={e => updateBlockData('testimonialDesc', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 rounded p-2 text-xs text-white" />
                           
                           <p className="text-[10px] text-amber-400 mt-2 font-bold mt-4 border-t border-slate-800 pt-3">Link & Buton</p>
                           <input placeholder="Buton Metni (Tüm Yorumlar)" value={activeBlock.content.integBtnText || ''} onChange={e => updateBlockData('integBtnText', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 rounded p-1.5 text-xs text-white mt-1" />

                           <p className="text-[10px] text-blue-400 mt-4 border-t border-slate-800 pt-3 font-bold">1. Geniş Resim (Sol Üst)</p>
                           <ImageUploadField value={activeBlock.content.integB1Img || ''} onChange={val => updateBlockData('integB1Img', val)} />
                           <input placeholder="E-Ticaret Yönetimi" value={activeBlock.content.integB1Title || ''} onChange={e => updateBlockData('integB1Title', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 rounded p-1.5 text-xs text-white mt-1" />
                           <input placeholder="Entegrasyon, Depo, Fatura" value={activeBlock.content.integB1Desc || ''} onChange={e => updateBlockData('integB1Desc', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 rounded p-1.5 text-xs text-white mt-1" />

                           <p className="text-[10px] text-orange-400 mt-4 border-t border-slate-800 pt-3 font-bold">2. Dikey Resim (Sağ Üst)</p>
                           <ImageUploadField value={activeBlock.content.integB2Img || ''} onChange={val => updateBlockData('integB2Img', val)} />
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
                           <input placeholder="Avatar Resim URL" value={activeBlock.content.integB4Avatar || ''} onChange={e => updateBlockData('integB4Avatar', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 rounded p-1.5 text-[10px] text-white mt-1" />
                           <input placeholder="(2.3k+ Reviews)" value={activeBlock.content.integB4Reviews || ''} onChange={e => updateBlockData('integB4Reviews', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 rounded p-1.5 text-[10px] text-white mt-1" />
                        </div>`
);

fs.writeFileSync(editorFile, editorContent);

// NOW UPDATE ModernLanding.tsx
const landingFile = 'c:/Users/ertke/OneDrive/Masaüstü/periodya/muhasebeapp/motoroil/src/components/landing/ModernLanding.tsx';
let landingContent = fs.readFileSync(landingFile, 'utf8');

// TABS replace flag
landingContent = landingContent.replace(
    `<img src="https://flagcdn.com/w40/us.png" alt="USA Flag" className="w-full h-full object-cover" />`,
    `<img src={dbTabsData?.balanceFlagUrl || "https://flagcdn.com/w40/us.png"} alt="Flag" className="w-full h-full object-cover" />`
);

// INTEGRATIONS Box 0
landingContent = landingContent.replace(
    `Tüm Yorumlar <ArrowUpRight className="w-4 h-4"/>`,
    `{integData?.integBtnText || 'Tüm Yorumlar'} <ArrowUpRight className="w-4 h-4"/>`
);

// INTEGRATIONS Box 1
landingContent = landingContent.replace(
    `<img src="https://images.unsplash.com/photo-1542596594-649edbc13630?auto=format&fit=crop&w=800&q=80" alt="User Smiling" className="w-full h-full object-cover" />
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                                    <h3 className="text-white text-xl font-bold mb-1">E-Ticaret Yönetimi</h3>
                                    <p className="text-white/80 text-[13px] font-medium">Entegrasyon, Depo, Fatura</p>`,
    `<img src={integData?.integB1Img || "https://images.unsplash.com/photo-1542596594-649edbc13630?auto=format&fit=crop&w=800&q=80"} alt="User Smiling" className="w-full h-full object-cover" />
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                                    <h3 className="text-white text-xl font-bold mb-1">{integData?.integB1Title || 'E-Ticaret Yönetimi'}</h3>
                                    <p className="text-white/80 text-[13px] font-medium">{integData?.integB1Desc || 'Entegrasyon, Depo, Fatura'}</p>`
);

// INTEGRATIONS Box 2
landingContent = landingContent.replace(
    `<img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80" alt="Focus" className="w-full h-full object-cover" />
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#3E2723]/90 to-transparent p-6">
                                    <h3 className="text-white text-4xl font-bold mb-1">%98.2</h3>
                                    <p className="text-white/80 text-[13px] font-medium leading-tight">En iyi ve güvenilir geri bildirimler bizi tam olarak anlayan müşterilerimizden gelir.</p>`,
    `<img src={integData?.integB2Img || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80"} alt="Focus" className="w-full h-full object-cover" />
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#3E2723]/90 to-transparent p-6">
                                    <h3 className="text-white text-4xl font-bold mb-1">{integData?.integB2Title || '%98.2'}</h3>
                                    <p className="text-white/80 text-[13px] font-medium leading-tight">{integData?.integB2Desc || 'En iyi ve güvenilir geri bildirimler bizi tam olarak anlayan müşterilerimizden gelir.'}</p>`
);

// INTEGRATIONS Box 3
let b3ReplaceStr = `<div className="flex -space-x-2">
                                    {(integData?.integB3Avatars ? integData.integB3Avatars.split(',') : ["https://i.pravatar.cc/100?img=4", "https://i.pravatar.cc/100?img=5", "https://i.pravatar.cc/100?img=6"]).map((av: string, i: number) => (
                                        <img key={i} src={av.trim()} className="w-8 h-8 rounded-full border border-[#A8F0FF]" alt="User" />
                                    ))}
                                </div>
                                <div>
                                    <h3 className="text-[#0E1528] text-[42px] font-medium leading-none mb-2">{integData?.integB3Title || '30x'}</h3>
                                    <p className="text-[#0E1528]/80 text-[14px] font-medium italic leading-snug">{integData?.integB3Desc || 'Zaman tasarrufu sağlayan kusursuz altyapı.'}</p>
                                </div>`;

landingContent = landingContent.replace(
    `<div className="flex -space-x-2">
                                    <img src="https://i.pravatar.cc/100?img=4" className="w-8 h-8 rounded-full border border-[#A8F0FF]" alt="User" />
                                    <img src="https://i.pravatar.cc/100?img=5" className="w-8 h-8 rounded-full border border-[#A8F0FF]" alt="User" />
                                    <img src="https://i.pravatar.cc/100?img=6" className="w-8 h-8 rounded-full border border-[#A8F0FF]" alt="User" />
                                </div>
                                <div>
                                    <h3 className="text-[#0E1528] text-[42px] font-medium leading-none mb-2">30x</h3>
                                    <p className="text-[#0E1528]/80 text-[14px] font-medium italic leading-snug">Zaman tasarrufu sağlayan kusursuz altyapı.</p>
                                </div>`,
    b3ReplaceStr
);

// INTEGRATIONS Box 4
landingContent = landingContent.replace(
    `<span className="font-extrabold text-[15px] uppercase tracking-wide">Periodya</span>
                                    </div>
                                    <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-full shadow-sm text-slate-300">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div><div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                                    </div>
                                </div>
                                
                                <p className="text-[#0E1528] text-[15px] font-medium leading-relaxed mb-4 italic pr-6">
                                    "Tüm pazar yerlerini tek bir yerden yönetmek harika. Stoklarımız artık hiç karışmıyor. Ekip her zaman duyarlı ve müşteri memnuniyetini gerçekten önemsiyor."
                                </p>
                                
                                <div className="flex justify-between items-end">
                                    <div className="flex items-center gap-2">
                                        <img src="https://i.pravatar.cc/100?img=7" className="w-8 h-8 rounded-full" alt="Ahmet Y." />
                                        <div>
                                            <h4 className="font-bold text-[#0E1528] text-[13px] leading-none mb-0.5">Ahmet Y.</h4>
                                            <p className="text-[10px] font-semibold text-slate-500 leading-none">Şirket Sahibi</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <h3 className="text-3xl font-medium text-[#0E1528] leading-none mb-1">4.5</h3>
                                        <div className="flex gap-0.5 text-orange-500 justify-end mb-1">
                                            <Star className="w-3 h-3 fill-orange-500" /><Star className="w-3 h-3 fill-orange-500" /><Star className="w-3 h-3 fill-orange-500" /><Star className="w-3 h-3 fill-orange-500" /><Star className="w-3 h-3 text-slate-300 fill-slate-300" />
                                        </div>
                                        <p className="text-[10px] text-slate-500 font-semibold">(2.3k+ Reviews)</p>`,
    `<span className="font-extrabold text-[15px] uppercase tracking-wide">{integData?.integB4Brand || 'Periodya'}</span>
                                    </div>
                                    <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-full shadow-sm text-slate-300">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div><div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                                    </div>
                                </div>
                                
                                <p className="text-[#0E1528] text-[15px] font-medium leading-relaxed mb-4 italic pr-6 whitespace-pre-wrap">
                                    {integData?.integB4Quote || '"Tüm pazar yerlerini tek bir yerden yönetmek harika. Stoklarımız artık hiç karışmıyor. Ekip her zaman duyarlı ve müşteri memnuniyetini gerçekten önemsiyor."'}
                                </p>
                                
                                <div className="flex justify-between items-end">
                                    <div className="flex items-center gap-2">
                                        <img src={integData?.integB4Avatar || "https://i.pravatar.cc/100?img=7"} className="w-8 h-8 rounded-full object-cover" alt="Avatar" />
                                        <div>
                                            <h4 className="font-bold text-[#0E1528] text-[13px] leading-none mb-0.5">{integData?.integB4Name || 'Ahmet Y.'}</h4>
                                            <p className="text-[10px] font-semibold text-slate-500 leading-none">{integData?.integB4Role || 'Şirket Sahibi'}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <h3 className="text-3xl font-medium text-[#0E1528] leading-none mb-1">4.5</h3>
                                        <div className="flex gap-0.5 text-orange-500 justify-end mb-1">
                                            <Star className="w-3 h-3 fill-orange-500" /><Star className="w-3 h-3 fill-orange-500" /><Star className="w-3 h-3 fill-orange-500" /><Star className="w-3 h-3 fill-orange-500" /><Star className="w-3 h-3 text-slate-300 fill-slate-300" />
                                        </div>
                                        <p className="text-[10px] text-slate-500 font-semibold">{integData?.integB4Reviews || '(2.3k+ Reviews)'}</p>`
);

fs.writeFileSync(landingFile, landingContent);
console.log('PATCH_COMPLETE');
