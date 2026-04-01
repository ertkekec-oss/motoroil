const fs = require('fs');
const file = 'c:/Users/ertke/OneDrive/Masaüstü/periodya/muhasebeapp/motoroil/src/app/(app)/customers/[id]/CustomerDetailClient.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Insert fetchAssets
const assetsStateHook = `    const [assets, setAssets] = useState<any[]>([]);\n    const [warranties, setWarranties] = useState<any[]>(customer?.warranties || []);\n`;
if (!content.includes('const [assets, setAssets] = useState')) {
    content = content.replace('    const [qrPlate', assetsStateHook + '    const [qrPlate');
}

const fetchAssetsFunc = `    const fetchAssets = async () => {
        try {
            const res = await fetch(\`/api/customers/\${customer.id}/assets\`);
            if (res.ok) {
                const data = await res.json();
                setAssets(data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    // Auto-fetch services to get plate info for Header Buttons
`;
if (!content.includes('fetchAssets = async')) {
    content = content.replace('    // Auto-fetch services to get plate info for Header Buttons\r\n', fetchAssetsFunc);
    content = content.replace('        fetchServices();\r\n    }, []);', '        fetchServices();\n        fetchAssets();\n    }, []);');
}

// 2. Replace the services tab layout
const viewStart = `                    {activeTab === 'services' ? (
                        <div className="p-4 sm:p-6">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <h3 style={{ margin: 0, color: 'var(--text-main, #fff)', fontSize: '20px', fontWeight: '800' }}>Servis Kayıtları</h3>`;

const newViewStart = `                    {activeTab === 'services' ? (
                        <div className="p-4 sm:p-6">
                            
                            {/* --- VARLIKLAR VE GARANTİLER BÖLÜMÜ --- */}
                            <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                    <div>
                                        <h3 style={{ margin: 0, color: 'var(--text-main, #fff)', fontSize: '20px', fontWeight: '800' }}>Cihazlar, Varlıklar ve Garantiler</h3>
                                        <p style={{ color: 'var(--text-muted, #888)', fontSize: '13px', marginTop: '6px', fontWeight: '500' }}>Müşteriye ait tüm cihaz sicilleri ve garanti karneleri.</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button
                                            onClick={() => setWarrantyModalOpen(true)}
                                            className="h-[36px] px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[8px] font-bold text-[12px] flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                                        >
                                            🛡️ Garanti Karnesi Ekle
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                    {/* CİHAZLAR KUTUSU */}
                                    <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-[20px] p-5 shadow-sm">
                                        <h4 className="text-[14px] font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">📱 Kayıtlı Cihaz Sicilleri</h4>
                                        {assets.length === 0 ? (
                                            <div className="text-[12px] text-slate-500 font-medium py-6 text-center border border-dashed border-slate-200 dark:border-white/10 rounded-xl">Kayıtlı cihaz sicili bulunmuyor. Servis anında oluşturulur.</div>
                                        ) : (
                                            <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scroll pr-2">
                                                {assets.map(a => (
                                                    <div key={a.id} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl flex justify-between items-center hover:border-emerald-500/30 transition-all">
                                                        <div className="min-w-0 pr-4">
                                                            <div className="font-bold text-[13px] text-slate-900 dark:text-white truncate">{a.primaryIdentifier}</div>
                                                            <div className="text-[11px] text-slate-500 mt-1 truncate">{a.brand || 'Diğer'} {a.model ? \` - \${a.model}\` : ''}</div>
                                                        </div>
                                                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded text-[10px] font-bold uppercase whitespace-nowrap shrink-0">Cihaz Sicili</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* GARANTİLER KUTUSU */}
                                    <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-[20px] p-5 shadow-sm">
                                        <h4 className="text-[14px] font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">🛡️ Garanti Karneleri</h4>
                                        {warranties.length === 0 ? (
                                            <div className="text-[12px] text-slate-500 font-medium py-6 text-center border border-dashed border-slate-200 dark:border-white/10 rounded-xl">Kayıtlı garanti karnesi bulunmuyor.</div>
                                        ) : (
                                            <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scroll pr-2">
                                                {warranties.map(w => (
                                                    <div key={w.id} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl flex justify-between items-center hover:border-blue-500/30 transition-all">
                                                        <div className="min-w-0 pr-4">
                                                            <div className="font-bold text-[13px] text-slate-900 dark:text-white flex items-center gap-1.5 truncate"><div className={\`w-2 h-2 rounded-full shrink-0 \${w.status === 'Active' ? 'bg-emerald-500' : 'bg-red-500'}\`}></div> <span className="truncate">{w.productName}</span></div>
                                                            <div className="text-[11px] text-slate-500 mt-1 truncate">S. No: {w.serialNo} • Fatura: {w.invoiceNo || '-'}</div>
                                                        </div>
                                                        <div className="text-right shrink-0">
                                                            <span className={\`inline-block px-2 py-1 rounded text-[10px] font-bold uppercase \${w.status === 'Active' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'}\`}>
                                                                {w.status === 'Active' ? 'Devam Ediyor' : 'Süresi Doldu'}
                                                            </span>
                                                            <div className="text-[10px] font-bold text-slate-400 mt-1">Bitiş: {new Date(w.endDate).toLocaleDateString('tr-TR')}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <hr className="border-slate-200 dark:border-white/10 mb-8" />

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <h3 style={{ margin: 0, color: 'var(--text-main, #fff)', fontSize: '20px', fontWeight: '800' }}>Servis Geçmişi & İş Emri Yönetimi</h3>`;

if (content.indexOf("Servis Geçmişi & İş Emri Yönetimi") === -1) {
    // If it hasn't been replaced yet, replace the exact code correctly irrespective of `\r\n` or `\n`
    const regex = /\{activeTab === 'services' \? \([\s\S]*?<h3[^>]*>Servis Kayıtları<\/h3>/;
    content = content.replace(regex, newViewStart);
}

fs.writeFileSync(file, content, 'utf8');
console.log('Customer Detail Update Applied.');
