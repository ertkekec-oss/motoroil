const fs = require('fs');

const file_path = 'src/app/(app)/inventory/components/ProductWizardModal.tsx';
let content = fs.readFileSync(file_path, 'utf8');

// Replace signature
content = content.replace(
    /function StepOtherInfo\(\{ data, onChange, categories \}: any\) \{/g,
    'function StepOtherInfo({ data, onChange, categories, globalCategories }: any) {'
);

// Replace select 
const oldSelectRegex = /<select value=\{\s*data\.category\s*\|\|\s*''\s*\}.*?<\/select>/s;

const newSelect = `<select 
                        value={data.globalCategoryId || data.category || ''} 
                        onChange={e => {
                            const val = e.target.value;
                            const selectedCat = globalCategories?.find((c: any) => c.id === val);
                            if (selectedCat) {
                                onChange({ ...data, globalCategoryId: val, category: selectedCat.path.split(' > ').pop() });
                            } else {
                                onChange({ ...data, category: val });
                            }
                        }} 
                        className="w-full h-12 px-3 rounded-xl border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 outline-none bg-white dark:bg-[#0f172a] shadow-sm"
                    >
                        <option value="" disabled>Ağaçtan Kategori Seç...</option>
                        {globalCategories && globalCategories.length > 0 ? (
                            globalCategories.map((c: any) => (
                                <option key={c.id} value={c.id}>{c.path}</option>
                            ))
                        ) : (
                            (categories && categories.length > 0 ? categories : ["Motosiklet", "Otomobil", "Aksesuar", "Yedek Parça", "Genel"]).map((c: string) => (
                                <option key={c} value={c}>{c}</option>
                            ))
                        )}
                    </select>`;

content = content.replace(oldSelectRegex, newSelect);
content = content.replace(/<label className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 font-semibold">Kategori<\/label>/, '<label className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 font-semibold">Global Kategori</label>');

fs.writeFileSync(file_path, content, 'utf8');
console.log('Fixed ProductWizardModal properly!!');
