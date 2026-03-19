const fs = require('fs');

const file_path = 'src/app/(app)/inventory/components/InventoryDetailModal.tsx';
let content = fs.readFileSync(file_path, 'utf8');

// Inject globalCategories state and useEffect
const oldEffect = `    const [detailTab, setDetailTab] = useState('general');

    if (!isOpen || !selectedProduct) return null;`;

const newEffect = `    const [detailTab, setDetailTab] = useState('general');
    const [globalCategories, setGlobalCategories] = useState<any[]>([]);

    useEffect(() => {
        if (isOpen && globalCategories.length === 0) {
            fetch("/api/catalog/global-categories")
                .then(r => r.json())
                .then(d => {
                    if (d.success) setGlobalCategories(d.categories);
                });
        }
    }, [isOpen]);

    if (!isOpen || !selectedProduct) return null;`;

content = content.replace(oldEffect, newEffect);

// Replace the normal category select with the new one
const oldSelect = `                                        <div>
                                            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">Kategori</label>
                                            <select
                                                value={selectedProduct.category}
                                                onChange={(e) => setSelectedProduct({ ...selectedProduct, category: e.target.value })}
                                                disabled={!canEdit}
                                                className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-[12px] p-3 text-[13px] font-medium text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors appearance-none shadow-sm disabled:opacity-50"
                                            >
                                                {categories.length > 0 ? (
                                                    categories.map(cat => (
                                                        <option key={cat} value={cat}>{cat}</option>
                                                    ))
                                                ) : (
                                                    <>
                                                        <option value="Genel">Genel</option>
                                                        <option value="Motosiklet">Motosiklet</option>
                                                        <option value="Otomobil">Otomobil</option>
                                                        <option value="Aksesuar">Aksesuar</option>
                                                        <option value="Yedek Parça">Yedek Parça</option>
                                                    </>
                                                )}
                                            </select>
                                        </div>`;

const newSelect = `                                        <div>
                                            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">Global Kategori</label>
                                            <select
                                                value={selectedProduct.globalCategoryId || ''}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    const selectedCat = globalCategories.find(c => c.id === val);
                                                    setSelectedProduct({ 
                                                        ...selectedProduct, 
                                                        globalCategoryId: val,
                                                        category: selectedCat ? selectedCat.path.split(' > ').pop() : selectedProduct.category
                                                    });
                                                }}
                                                disabled={!canEdit}
                                                className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-[12px] p-3 text-[13px] font-medium text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors appearance-none shadow-sm disabled:opacity-50"
                                            >
                                                <option value="" disabled>Ağaçtan Kategori Seçin...</option>
                                                {globalCategories.map(c => (
                                                    <option key={c.id} value={c.id}>{c.path}</option>
                                                ))}
                                            </select>
                                        </div>`;

content = content.replace(oldSelect, newSelect);

fs.writeFileSync(file_path, content, 'utf8');
console.log('InventoryDetailModal Patched!');
