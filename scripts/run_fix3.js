const fs = require('fs');

const file = 'c:/Users/ertke/OneDrive/Masaüstü/periodya/muhasebeapp/motoroil/src/app/(app)/service/new/NewWorkOrderClient.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. UPDATE handleCreateAsset
const oldHandleCreate = `    const handleCreateAsset = async () => {
        if (!primaryIdentifier) return;
        try {
            const res = await fetch(\`/api/customers/\${customerId}/assets\`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ primaryIdentifier, brand: assetBrand })
            });`;

const newHandleCreate = `    const handleCreateAsset = async () => {
        const idToSave = primaryIdentifier || Object.values(dynamicFields)[0];
        if (!idToSave) return showError("Eksik", "Tanıtıcı kod veya ilgili cihaz karnesi girilmelidir.");
        try {
            const res = await fetch(\`/api/customers/\${customerId}/assets\`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    primaryIdentifier: idToSave, 
                    brand: assetBrand || selectedAssetType, 
                    metadata: { type: selectedAssetType, ...dynamicFields }
                })
            });`;

let c1 = code.replace(/\r\n/g, '\n');
let s1 = oldHandleCreate.replace(/\r\n/g, '\n');
if (c1.includes(s1)) {
    c1 = c1.replace(s1, newHandleCreate);
} else {
    // try looser match
    c1 = c1.replace(/body: JSON\.stringify\(\{ primaryIdentifier, brand: assetBrand \}\)/g, 
        `body: JSON.stringify({ primaryIdentifier: primaryIdentifier || Object.values(dynamicFields)[0] || "Genel", brand: assetBrand || selectedAssetType || "Diğer", metadata: { type: selectedAssetType, ...dynamicFields } })`);
}

// 2. UPDATE handleSubmit
const oldHandleSubmit = `            const payload = {
                customerId,
                assetId: assetId || undefined,
                complaint,
                branch: activeBranchName,
                status: 'PENDING',
                currentKm,
                chassisNo,
                productionYear
            };`;

const newHandleSubmit = `            // Eğer seçilen asset'in dinamik fieldları varsa gönderelim.
            const finalDynamic = Object.keys(dynamicFields).length > 0 ? dynamicFields : undefined;
            const payload = {
                customerId,
                assetId: assetId || undefined,
                complaint,
                branch: activeBranchName,
                status: 'PENDING',
                currentKm,
                chassisNo,
                productionYear,
                dynamicMetadata: finalDynamic
            };`;

let s2 = oldHandleSubmit.replace(/\r\n/g, '\n');
if (c1.includes(s2)) {
    c1 = c1.replace(s2, newHandleSubmit);
}

// 3. FIX DIŞ MÜŞTERİ EKLE UI 
const disUrunOld = `<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                                                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">Marka/Model / Ürün Adı</label>
                                                    <input type="text" value={assetBrand} onChange={e => setAssetBrand(e.target.value)} placeholder="Örn: Beko, Kuba, Honda..." className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none" />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">Seri No / Plaka / Şase No</label>
                                                    <input type="text" value={primaryIdentifier} onChange={e => setPrimaryIdentifier(e.target.value)} placeholder="Zorunlu identifier..." className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none" />
                                                </div>
                                            </div>`;

const disUrunNew = `<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                <div>
                                                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">Cihaz / Taşıt Türü</label>
                                                    <select value={selectedAssetType} onChange={e => { setSelectedAssetType(e.target.value); setDynamicFields({}); }} className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none">
                                                        <option value="">Seçiniz...</option>
                                                        {(appSettings?.asset_types_schema || []).map((t:any) => (
                                                            <option key={t.id} value={t.name}>{t.name}</option>
                                                        ))}
                                                        <option value="VEHICLE">Kayıtsız (Genel)</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">Marka / Cihaz Adı</label>
                                                    <input type="text" value={assetBrand} onChange={e => setAssetBrand(e.target.value)} placeholder="Örn: Beko, Kuba, Honda..." className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none" />
                                                </div>
                                                {(() => {
                                                    const schema = appSettings?.asset_types_schema?.find((t:any) => t.name === selectedAssetType || t.id === selectedAssetType);
                                                    if (schema && schema.fields && schema.fields.length > 0) {
                                                        return schema.fields.map((f:any) => (
                                                            <div key={f.id}>
                                                                <label className="text-xs font-bold text-slate-500 mb-1.5 block flex justify-between">
                                                                    {f.label}
                                                                </label>
                                                                <input 
                                                                    type="text" 
                                                                    value={dynamicFields[f.id] || ''} 
                                                                    onChange={e => setDynamicFields({...dynamicFields, [f.id]: e.target.value})} 
                                                                    placeholder={f.label + "..."} 
                                                                    className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none" 
                                                                />
                                                            </div>
                                                        ));
                                                    } else if (selectedAssetType) {
                                                        return (
                                                            <div>
                                                                <label className="text-xs font-bold text-slate-500 mb-1.5 block">Seri No / Plaka / Tanıtıcı</label>
                                                                <input type="text" value={primaryIdentifier} onChange={e => setPrimaryIdentifier(e.target.value)} placeholder="Zorunlu identifier..." className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none" />
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                })()}
                                            </div>`;

let s3 = disUrunOld.replace(/\r\n/g, '\n');
if (c1.includes(s3)) {
    c1 = c1.replace(s3, disUrunNew);
} else {
    // Fallback simple replace
    c1 = c1.replace(/Cihaz \/ Taşıt Türü[\s\S]*?Seri No \/ Plaka \/ Şase No[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/, disUrunNew);
}

// 4. Update the "handleAutoCreateAndSelectAsset" which is used for Warranty & Purchase
const autoCreateOld = /metadata: \{ sourceId: item\.id, sourceType: type \}/g;
c1 = c1.replace(autoCreateOld, 'metadata: { sourceId: item.id, sourceType: type, type: selectedAssetType }');

fs.writeFileSync(file, c1, 'utf8');
