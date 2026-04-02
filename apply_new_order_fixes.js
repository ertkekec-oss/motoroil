const fs = require('fs');
const file = 'c:/Users/ertke/OneDrive/Masaüstü/periodya/muhasebeapp/motoroil/src/app/(app)/service/new/NewWorkOrderClient.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('const [currentKm, setCurrentKm]')) {
    content = content.replace(
        "const [primaryIdentifier, setPrimaryIdentifier] = useState(''); // e.g. Plate or Serial No",
        "const [primaryIdentifier, setPrimaryIdentifier] = useState(''); // e.g. Plate or Serial No\n    const [currentKm, setCurrentKm] = useState<string>('');\n    const [productionYear, setProductionYear] = useState<string>('');\n    const [chassisNo, setChassisNo] = useState<string>('');"
    );
}

// Prefill form from selected asset
if (!content.includes('setCurrentKm(selected.metadata?.currentKm || \'\');')) {
    content = content.replace(
        "}, [assetTab, customerId]);",
        `}, [assetTab, customerId]);\n\n    useEffect(() => {\n        const selected = assets.find(a => a.id === assetId);\n        if (selected) {\n            setCurrentKm(selected.metadata?.currentKm?.toString() || '');\n            setProductionYear(selected.productionYear?.toString() || '');\n            setChassisNo(selected.secondaryIdentifier || '');\n        } else {\n            setCurrentKm(''); setProductionYear(''); setChassisNo('');\n        }\n    }, [assetId, assets]);`
    );
}

// Add state to POST request
content = content.replace(
    "status: 'PENDING'",
    "status: 'PENDING',\n                currentKm,\n                chassisNo,\n                productionYear"
);

// Inject inputs
const inputsToAdd = `
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
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
                            </div>
`;

if (!content.includes('Servise Geliş KM</label>')) {
    content = content.replace(
        '<textarea\n                                    value={complaint}',
        inputsToAdd + '\n                                <textarea\n                                    value={complaint}'
    );
}

fs.writeFileSync(file, content, 'utf8');
console.log('Update Complete.');
