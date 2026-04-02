const fs = require('fs');

function fixLaborSection() {
    const file = 'c:/Users/ertke/OneDrive/Masaüstü/periodya/muhasebeapp/motoroil/src/app/(app)/service/[id]/ServiceDetailClient.tsx';
    let code = fs.readFileSync(file, 'utf8');

    // Add import useSettings
    if (!code.includes('useSettings')) {
        code = code.replace("import { useInventory } from '@/contexts/InventoryContext';", "import { useInventory } from '@/contexts/InventoryContext';\nimport { useSettings } from '@/contexts/SettingsContext';");
    }

    // Add destructuring of serviceSettings
    if (!code.includes('const { serviceSettings } = useSettings();')) {
        code = code.replace("const { products } = useInventory();", "const { products } = useInventory();\n    const { serviceSettings } = useSettings();");
    }

    // Replace the Labor inputs UI
    const targetLaborInputs = `                    <div className="flex flex-col sm:flex-row gap-3 mb-8 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-[16px] border border-slate-200 dark:border-white/10">
                        <div className="flex-1">
                            <label className="text-xs font-bold text-slate-500 mb-1.5 block">İşçilik / Hizmet Adı</label>
                            <input type="text" value={newItemName} onChange={e => setNewItemName(e.target.value)} placeholder="Manuel işçilik açıklaması giriniz..." className="w-full h-[44px] sm:h-10 px-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-[13px] font-medium focus:ring-2 focus:ring-blue-500/50 outline-none" />
                        </div>
                        <div className="flex gap-3">
                            <div className="w-1/3 sm:w-20">
                                <label className="text-xs font-bold text-slate-500 mb-1.5 block">Miktar</label>
                                <input type="number" min="1" value={newItemQty} onChange={e => setNewItemQty(Number(e.target.value))} className="w-full h-[44px] sm:h-10 px-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-[13px] font-bold focus:ring-2 focus:ring-blue-500/50 outline-none text-center" />
                            </div>
                            <div className="w-2/3 sm:w-32">
                                <label className="text-xs font-bold text-slate-500 mb-1.5 block">Birim Fiyat (₺)</label>
                                <input type="number" min="0" value={newItemPrice} onChange={e => setNewItemPrice(Number(e.target.value))} className="w-full h-[44px] sm:h-10 px-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-[13px] font-bold focus:ring-2 focus:ring-blue-500/50 outline-none text-right" />
                            </div>
                        </div>
                        <div className="w-full sm:w-32 flex items-end mt-2 sm:mt-0">
                            <button onClick={() => handleAddItem('LABOR')} className="w-full h-[44px] sm:h-10 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-500/20 border border-amber-200 dark:border-amber-500/20 rounded-[10px] sm:rounded-lg text-sm sm:text-xs font-bold flex justify-center items-center gap-1.5 transition-colors">
                                <Plus className="w-5 h-5 sm:w-4 sm:h-4" /> İşçilik Ekle
                            </button>
                        </div>
                    </div>`;

    const customLaborInputs = `                    <div className="flex flex-col sm:flex-row gap-3 mb-8 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-[16px] border border-slate-200 dark:border-white/10">
                        <div className="flex-1">
                            <label className="text-xs font-bold text-slate-500 mb-1.5 block">İşçilik / Hizmet Seçin (Ayarlardaki Tarifeler)</label>
                            <select 
                                value={newItemName} 
                                onChange={e => {
                                    const val = e.target.value;
                                    setNewItemName(val);
                                    if(serviceSettings && serviceSettings[val] !== undefined) {
                                        setNewItemPrice(Number(serviceSettings[val]));
                                    }
                                }} 
                                className="w-full h-[44px] sm:h-10 px-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-[13px] font-medium focus:ring-2 focus:ring-blue-500/50 outline-none"
                            >
                                <option value="">Bir İşçilik/Hizmet Seçiniz...</option>
                                {(serviceSettings ? Object.keys(serviceSettings) : []).map(tariffName => (
                                    <option key={tariffName} value={tariffName}>{tariffName}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex gap-3">
                            <div className="w-1/3 sm:w-20">
                                <label className="text-xs font-bold text-slate-500 mb-1.5 block">Miktar</label>
                                <input type="number" min="1" value={newItemQty} onChange={e => setNewItemQty(Number(e.target.value))} className="w-full h-[44px] sm:h-10 px-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-[13px] font-bold focus:ring-2 focus:ring-blue-500/50 outline-none text-center" />
                            </div>
                            <div className="w-2/3 sm:w-32">
                                <label className="text-xs font-bold text-slate-500 mb-1.5 block">Birim Fiyat (₺)</label>
                                <input type="number" min="0" value={newItemPrice} onChange={e => setNewItemPrice(Number(e.target.value))} className="w-full h-[44px] sm:h-10 px-3 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-800/50 text-[13px] font-bold outline-none text-right cursor-not-allowed" readOnly title="Ayarlardan Gelen Sabit Tarife" />
                            </div>
                        </div>
                        <div className="w-full sm:w-32 flex items-end mt-2 sm:mt-0">
                            <button disabled={!newItemName} onClick={() => handleAddItem('LABOR')} className="w-full h-[44px] sm:h-10 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed border border-amber-200 dark:border-amber-500/20 rounded-[10px] sm:rounded-lg text-sm sm:text-xs font-bold flex justify-center items-center gap-1.5 transition-colors">
                                <Plus className="w-5 h-5 sm:w-4 sm:h-4" /> İşçilik Ekle
                            </button>
                        </div>
                    </div>`;

    if (code.includes(targetLaborInputs)) {
        code = code.replace(targetLaborInputs, customLaborInputs);
        fs.writeFileSync(file, code, 'utf8');
        console.log('Labor fix applied!');
    } else {
        console.log('Labor target not found in file!');
    }

}

fixLaborSection();
