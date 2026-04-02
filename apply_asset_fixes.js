const fs = require('fs');

// 1. CustomerDetailClient.tsx -> Add Model Yılı & KM to "Kayıtlı Cihaz Sicilleri"
const file1 = 'c:/Users/ertke/OneDrive/Masaüstü/periodya/muhasebeapp/motoroil/src/app/(app)/customers/[id]/CustomerDetailClient.tsx';
let c1 = fs.readFileSync(file1, 'utf8');

c1 = c1.replace(
    `<div className="font-bold text-[13px] text-slate-900 dark:text-white truncate">{a.primaryIdentifier}</div>
                                                            <div className="text-[11px] text-slate-500 mt-1 truncate">{a.brand || 'Diğer'} {a.model ? \` - \${a.model}\` : ''}</div>`,
    `<div className="font-bold text-[13px] text-slate-900 dark:text-white truncate">{a.primaryIdentifier} {a.secondaryIdentifier ? \`(\${a.secondaryIdentifier})\` : ''}</div>
                                                            <div className="text-[11px] text-slate-500 mt-1 truncate">
                                                                {a.brand || 'Diğer'} {a.model ? \` - \${a.model}\` : ''}
                                                                {a.productionYear ? \` • Model: \${a.productionYear}\` : ''}
                                                                {a.metadata?.currentKm ? \` • KM: \${a.metadata.currentKm.toLocaleString()}\` : ''}
                                                            </div>`
);
fs.writeFileSync(file1, c1, 'utf8');


// 2. ServiceDetailClient.tsx -> Update Araç Karnesi & Checkout Modal to ask for nextDate & nextKm
const file2 = 'c:/Users/ertke/OneDrive/Masaüstü/periodya/muhasebeapp/motoroil/src/app/(app)/service/[id]/ServiceDetailClient.tsx';
let c2 = fs.readFileSync(file2, 'utf8');

// Add states for Checkout
if(!c2.includes('const [nextKm, setNextKm] = useState')) {
    c2 = c2.replace('const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);', 
        'const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);\n    const [nextKm, setNextKm] = useState<string>(\'\');\n    const [nextDate, setNextDate] = useState<string>(\'\');');
}

// Update Cihaz Bilgisi to Araç Karnesi
const cihazBilgisiBlock = `<div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[24px] shadow-sm p-6">
                                <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-white/5 pb-2">
                                    <Shield className="w-4 h-4" /> Cihaz Bilgisi & Araç Karnesi
                                </h3>
                                {order.asset ? (
                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500 flex items-center justify-center shrink-0">
                                                <Wrench className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <div className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                                    {order.asset.brand} <span className="text-sm text-slate-400">{order.asset.primaryIdentifier}</span>
                                                </div>
                                                <div className="text-sm font-medium text-slate-500">
                                                    {order.asset.model || 'Model Belirtilmemiş'} {order.asset.productionYear ? \` • \${order.asset.productionYear}\` : ''} {order.asset.secondaryIdentifier ? \` • Şase: \${order.asset.secondaryIdentifier}\` : ''}
                                                </div>
                                            </div>
                                        </div>
                                        {/* Karne Özeti */}
                                        <div className="grid grid-cols-2 gap-4 mt-2 p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-xl">
                                            <div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Geliş KM</div>
                                                <div className="text-[13px] font-bold text-slate-700 dark:text-slate-200">{order.currentKm_or_Use ? \`\${order.currentKm_or_Use.toLocaleString()} KM\` : 'Belirtilmedi'}</div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Sonraki Servis KM</div>
                                                <div className="text-[13px] font-bold text-emerald-600 dark:text-emerald-400">{order.nextKm_or_Use ? \`\${order.nextKm_or_Use.toLocaleString()} KM\` : 'Belirlenmedi'}</div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Sonraki Servis Tarihi</div>
                                                <div className="text-[13px] font-bold text-emerald-600 dark:text-emerald-400">{order.nextMaintenanceAt ? new Date(order.nextMaintenanceAt).toLocaleDateString('tr-TR') : 'Belirlenmedi'}</div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Servise Geliş Tarihi</div>
                                                <div className="text-[13px] font-bold text-slate-700 dark:text-slate-200">{new Date(order.createdAt).toLocaleDateString('tr-TR')}</div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <span className="text-sm font-medium text-slate-500">Cihaz belirtilmemiş.</span>
                                )}`;

c2 = c2.replace(/<div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white\/10 rounded-\[24px\] shadow-sm p-6">\s+<h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-white\/5 pb-2">\s+<Shield className="w-4 h-4" \/> Cihaz Bilgisi\s+<\/h3>[\s\S]*?Cihaz belirtilmemiş\.<\/span>\s+\)\}\s+<\/div>/, cihazBilgisiBlock);

// Inside Checkout Modal logic, ask for nextDate & nextKm
const checkoutInputs = `                                {/* Karne / Gelecek Servis Bilgisi */}
                                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-white/10 mb-4 grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">Sonraki Servis KM</label>
                                        <input type="number" value={nextKm} onChange={e => setNextKm(e.target.value)} placeholder="Örn: 90000" className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500/50 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">Sonraki Servis Tarihi</label>
                                        <input type="date" value={nextDate} onChange={e => setNextDate(e.target.value)} className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500/50 outline-none" />
                                    </div>
                                </div>`;

if(!c2.includes('Sonraki Servis KM')) {
    c2 = c2.replace('<div>\n                                    <h4 className="text-[13px] font-bold', checkoutInputs + '\n                                <div>\n                                    <h4 className="text-[13px] font-bold');
}

// Update handleCompleteService to pass nextKm and nextDate
c2 = c2.replace(/const handleCompleteService = async \(method: 'CASH' \| 'CREDIT_CARD' \| 'ACCOUNT'\) => {[\s\S]*?body: JSON.stringify\(\{ status: 'COMPLETED' \}\)/, 
`const handleCompleteService = async (method: 'CASH' | 'CREDIT_CARD' | 'ACCOUNT') => {
        if (!order) return;
        try {
            const res = await fetch(\`/api/services/work-orders/\${order.id}\`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    status: 'COMPLETED',
                    nextKm_or_Use: nextKm ? parseInt(nextKm) : undefined,
                    nextMaintenanceAt: nextDate ? new Date(nextDate).toISOString() : undefined
                })`);

fs.writeFileSync(file2, c2, 'utf8');

console.log("CustomerDetailClient and ServiceDetailClient updated!");
