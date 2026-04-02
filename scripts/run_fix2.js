const fs = require('fs');
const file = 'c:/Users/ertke/OneDrive/Masaüstü/periodya/muhasebeapp/motoroil/src/app/(app)/service/new/NewWorkOrderClient.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Replace the "external" grid definition
const oldPart1 = `<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">Marka/Model / Ürün Adı</label>`;

const newPart1 = `<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                <div>
                                                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">Cihaz / Taşıt Türü</label>
                                                    <select value={selectedAssetType} onChange={e => setSelectedAssetType(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none">
                                                        <option value="">Seçiniz...</option>
                                                        {(appSettings?.asset_types_schema || []).map((t:any) => (
                                                            <option key={t.id} value={t.name}>{t.name}</option>
                                                        ))}
                                                        <option value="VEHICLE">Kayıtsız (Genel)</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">Marka/Model / Ürün Adı</label>`;

if(code.includes(oldPart1)) {
    code = code.replace(oldPart1, newPart1);
} else {
    // try removing carriage returns for the check?
    let crStr = oldPart1.replace(/\r\n/g, '\n');
    let crCode = code.replace(/\r\n/g, '\n');
    if (crCode.includes(crStr)) {
        code = crCode.replace(crStr, newPart1);
    }
}


// 2. Replace the step 2 grid completely
const oldPart2 = `                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
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
                            </div>`;

const newPart2 = `                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
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
                            </div>`;

if(code.includes(oldPart2)) {
    code = code.replace(oldPart2, newPart2);
} else {
    let crStr2 = oldPart2.replace(/\r\n/g, '\n');
    let crCode = code.replace(/\r\n/g, '\n');
    if (crCode.includes(crStr2)) {
        code = crCode.replace(crStr2, newPart2);
    }
}

fs.writeFileSync(file, code, 'utf8');
