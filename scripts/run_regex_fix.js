const fs = require('fs');

const file = 'c:/Users/ertke/OneDrive/Masaüstü/periodya/muhasebeapp/motoroil/src/app/(app)/service/new/NewWorkOrderClient.tsx';
let code = fs.readFileSync(file, 'utf8');

const regex1 = /<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">([\s\S]*?)<label className="text-xs font-bold text-slate-500 mb-1\.5 block">Marka\/Model \/ Ürün Adı<\/label>/;
const replacment1 = `<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                <div>
                                                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">Cihaz / Taşıt Türü</label>
                                                    <select value={selectedAssetType} onChange={e => setSelectedAssetType(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none">
                                                        <option value="">Türü Seçiniz...</option>
                                                        {(appSettings?.asset_types_schema || []).map((t:any) => (
                                                            <option key={t.id} value={t.name}>{t.name}</option>
                                                        ))}
                                                        <option value="VEHICLE">Kayıtsız (Genel)</option>
                                                    </select>
                                                </div>$1<label className="text-xs font-bold text-slate-500 mb-1.5 block">Marka/Model / Ürün Adı</label>`;
code = code.replace(regex1, replacment1);

const regex2 = /<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">[\s\S]*?<label className="text-xs font-bold text-slate-500 mb-1\.5 block">Servise Geliş KM<\/label>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<div className="pt-6 border-t border-slate-100 dark:border-slate-800">/m;
// Actually, it's safer to just replace from '<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">' to the end of that grid block.

const targetStart = code.indexOf('<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">');
const blockEnd = code.indexOf('</div>', code.indexOf('Müşterinin şikayeti', targetStart));
// Let's just find the exact old code snippet for step 2!
// Old: 
//                             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
//                                 <div>
//                                     <label className="text-xs font-bold text-slate-500 mb-1.5 block">Servise Geliş KM</label>
//                                     <input type="number" value={currentKm} onChange={e => setCurrentKm(e.target.value)} placeholder="Araç KM'si..." className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/50 outline-none" />
//                                 </div>
//                                 <div>
//                                     <label className="text-xs font-bold text-slate-500 mb-1.5 block">Şase No (VIN)</label>
//                                     <input type="text" value={chassisNo} onChange={e => setChassisNo(e.target.value)} placeholder="Şase numarası..." className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/50 outline-none" />
//                                 </div>
//                                 <div>
//                                     <label className="text-xs font-bold text-slate-500 mb-1.5 block">Model Yılı</label>
//                                     <input type="number" value={productionYear} onChange={e => setProductionYear(e.target.value)} placeholder="Örn: 2021" className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/50 outline-none" />
//                                 </div>
//                             </div>

function extractBlockAndReplace(fileContent) {
    let startIdx = fileContent.indexOf('<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">');
    // We want to replace everything inside this grid, meaning until the *end* of the grid div.
    let endIdx = fileContent.indexOf('</div>', fileContent.indexOf('Model Yılı', startIdx));
    // Actually the closest </div> after "Model Yılı" input
    let realEndIdx = fileContent.indexOf('</div>', fileContent.indexOf('</div>', fileContent.indexOf('Model Yılı', startIdx)) + 6) + 6;
    
    // Safety check: is it the right block?
    if(startIdx !== -1 && endIdx !== -1) {
        let chunk = fileContent.substring(startIdx, realEndIdx);
        let newChunk = \`<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                                {(() => {
                                    const schema = appSettings?.asset_types_schema?.find((t:any) => t.name === selectedAssetType || t.id === selectedAssetType) || 
                                                   appSettings?.asset_types_schema?.find((t:any) => 
                                                       (assetBrand || '').toLowerCase().includes(t.name.toLowerCase()) || 
                                                       (selectedAssetType === 'VEHICLE' && t.name.toLowerCase() === 'diğer')
                                                   );
                                    
                                    if (schema && schema.fields && schema.fields.length > 0) {
                                        return schema.fields.map((f:any) => (
                                            <div key={f.id}>
                                                <label className="text-xs font-bold text-slate-500 mb-1.5 block">{f.label}</label>
                                                <input 
                                                    type="text" 
                                                    value={dynamicFields[f.id] || ''} 
                                                    onChange={e => setDynamicFields({...dynamicFields, [f.id]: e.target.value})} 
                                                    placeholder={f.label + " giriniz..."} 
                                                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/50 outline-none" 
                                                />
                                            </div>
                                        ));
                                    } else {
                                        // Default fallback if no dynamic schema is found
                                        return (
                                            <>
                                                <div>
                                                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">Servise Geliş KM</label>
                                                    <input type="number" value={currentKm} onChange={e => setCurrentKm(e.target.value)} placeholder="Araç KM'si..." className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/50 outline-none" />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">Şase No (VIN)</label>
                                                    <input type="text" value={chassisNo} onChange={e => setChassisNo(e.target.value)} placeholder="Şase numarası..." className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/50 outline-none" />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">Model Yılı</label>
                                                    <input type="number" value={productionYear} onChange={e => setProductionYear(e.target.value)} placeholder="Örn: 2021" className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/50 outline-none" />
                                                </div>
                                            </>
                                        );
                                    }
                                })()}
                            </div>\`;
                            
        return fileContent.substring(0, startIdx) + newChunk + fileContent.substring(realEndIdx);
    }
    return fileContent;
}

code = extractBlockAndReplace(code);

fs.writeFileSync(file, code, 'utf8');

