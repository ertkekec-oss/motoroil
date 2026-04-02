const fs = require('fs');

function fixNewWorkOrderClient() {
    const file = 'c:/Users/ertke/OneDrive/Masaüstü/periodya/muhasebeapp/motoroil/src/app/(app)/service/new/NewWorkOrderClient.tsx';
    let code = fs.readFileSync(file, 'utf8');

    // Add SettingsContext import
    if (!code.includes('useSettings')) {
        code = code.replace("import { useModal } from '@/contexts/ModalContext';", "import { useModal } from '@/contexts/ModalContext';\nimport { useSettings } from '@/contexts/SettingsContext';");
    }

    // Add useSettings hook extraction
    if (!code.includes('const { appSettings } = useSettings();')) {
        code = code.replace("const { showSuccess, showError } = useModal();", "const { showSuccess, showError } = useModal();\n    const { appSettings } = useSettings();");
    }

    // Add dynamic UI state
    if (!code.includes('const [selectedAssetType, setSelectedAssetType] = useState<string>')) {
        code = code.replace("const [chassisNo, setChassisNo] = useState<string>('');", 
            "const [chassisNo, setChassisNo] = useState<string>('');\n    const [selectedAssetType, setSelectedAssetType] = useState<string>('');\n    const [dynamicFields, setDynamicFields] = useState<Record<string, string>>({});");
    }

    // Modify handleCreateAsset to send assetType instead of defaulting
    const createAssetOld = `        try {
            const res = await fetch(\`/api/customers/\${customerId}/assets\`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ primaryIdentifier, brand: assetBrand, assetType: 'VEHICLE' })
            });`;
    const createAssetNew = `        try {
            const res = await fetch(\`/api/customers/\${customerId}/assets\`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ primaryIdentifier, brand: assetBrand, assetType: selectedAssetType || 'VEHICLE' })
            });`;
    code = code.replace(createAssetOld, createAssetNew);

    // Modify how we set assetType when clicking an existing asset
    // We need to set up "selectedAssetType" when an asset is clicked
    const selectAssetOld = `                                                            onClick={() => setAssetId(a.id)}
                                                            className={\`cursor-pointer p-3 sm:p-4 rounded-xl border transition-all \${assetId === a.id ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 shadow-sm' : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-50 dark:hover:bg-slate-800'}\`}`;
    const selectAssetNew = `                                                            onClick={() => {
                                                                setAssetId(a.id);
                                                                setSelectedAssetType(a.assetType || '');
                                                            }}
                                                            className={\`cursor-pointer p-3 sm:p-4 rounded-xl border transition-all \${assetId === a.id ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 shadow-sm' : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-50 dark:hover:bg-slate-800'}\`}`;
    code = code.replace(selectAssetOld, selectAssetNew);

    // Add UI for taking the Type in Dışarıdan Cihaz step
    const externalAssetUIOld = `                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">Marka/Model / Ürün Adı</label>`;
    const externalAssetUINew = `                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
    code = code.replace(externalAssetUIOld, externalAssetUINew);


    // Rewrite Step 2 UI (Dynamic Fields) instead of currentKm/chassisNo
    const step2FieldsOld = `                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
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

    const step2FieldsNew = `                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                                {(() => {
                                    const schema = appSettings?.asset_types_schema?.find((t:any) => t.name === selectedAssetType || t.id === selectedAssetType);
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
    code = code.replace(step2FieldsOld, step2FieldsNew);

    // Modify handleSubmit payload:
    const submitPayloadOld = `        try {
            const payload = {
                customerId,
                assetId,
                complaint,
                branch: activeBranchName,
                status: 'IN_PROGRESS',
                currentKm,
                chassisNo,
                productionYear
            };`;
    const submitPayloadNew = `        try {
            // Include dynamic fields in metadata payload
            const dynamicMetadata: Record<string, string> = {};
            const schema = appSettings?.asset_types_schema?.find((t:any) => t.name === selectedAssetType || t.id === selectedAssetType);
            if (schema && schema.fields) {
                schema.fields.forEach((f:any) => {
                    dynamicMetadata[f.label] = dynamicFields[f.id] || '';
                    if (f.label.toUpperCase() === 'KM') currentKm = dynamicFields[f.id]; // map KM field to currentKm for backward compat
                });
            }

            const payload = {
                customerId,
                assetId,
                complaint,
                branch: activeBranchName,
                status: 'IN_PROGRESS',
                currentKm,
                chassisNo,
                productionYear,
                dynamicMetadata // newly added parameter for backend
            };`;
    code = code.replace(submitPayloadOld, submitPayloadNew);

    fs.writeFileSync(file, code, 'utf8');
}

fixNewWorkOrderClient();
