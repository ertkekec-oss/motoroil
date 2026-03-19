import sys

file_path = 'src/app/(app)/inventory/components/ProductWizardModal.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Edit 1
content = content.replace(
    'const [currentStep, setCurrentStep] = useState(1);',
    'const [currentStep, setCurrentStep] = useState(1);\n    const [globalCategories, setGlobalCategories] = useState<any[]>([]);\n\n    useEffect(() => {\n        fetch("/api/catalog/global-categories")\n            .then(res => res.json())\n            .then(d => { if (d.success) setGlobalCategories(d.categories); })\n            .catch(e => console.error("Global categories fetch error:", e));\n    }, []);'
)

# Edit 2
content = content.replace(
    '<StepOtherInfo mode={mode} data={data} onChange={onChange} categories={categories} />',
    '<StepOtherInfo mode={mode} data={data} onChange={onChange} categories={categories} globalCategories={globalCategories} />'
)

# Edit 3
old_step_info = '''function StepOtherInfo({ data, onChange, categories }: any) {
    return (
        <div className="animate-in fade-in duration-300 space-y-8">
            <div className="mb-2 border-b border-slate-200 dark:border-white/5 pb-2">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">3. Aşama: Diğer Bilgiler</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Stok kodu, fatura ayarları ve ürüne dair detaylar.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                    <label className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 font-semibold">Kategori</label>
                    <select value={data.category || ''} onChange={e => onChange({ ...data, category: e.target.value })} className="w-full h-12 px-3 rounded-xl border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 outline-none bg-white dark:bg-[#0f172a] shadow-sm">
                        <option value="" disabled>Kategori Seçin</option>
                        {(categories.length > 0 ? categories : ["Motosiklet", "Otomobil", "Aksesuar", "Yedek Parça", "Genel"]).map((c: string) => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </div>'''

new_step_info = '''function StepOtherInfo({ data, onChange, categories, globalCategories }: any) {
    return (
        <div className="animate-in fade-in duration-300 space-y-8">
            <div className="mb-2 border-b border-slate-200 dark:border-white/5 pb-2">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">3. Aşama: Diğer Bilgiler</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Stok kodu, fatura ayarları ve ürüne dair detaylar.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                    <label className="text-xs uppercase tracking-wide text-blue-600 dark:text-blue-400 font-bold mb-1 block">
                        Kategori (Hub) <span className="text-red-500">*</span>
                    </label>
                    <select 
                        value={data.globalCategoryId || ''} 
                        onChange={e => {
                            const selectedId = e.target.value;
                            if (selectedId) {
                                const selectedCat = globalCategories?.find((c: any) => c.id === selectedId);
                                const mainCatName = selectedCat?.path?.split(" > ")[0] || "Diğer";
                                onChange({ ...data, globalCategoryId: selectedId, category: mainCatName });
                            } else {
                                onChange({ ...data, globalCategoryId: null });
                            }
                        }} 
                        className="w-full h-12 px-3 rounded-xl border-2 border-blue-300 bg-blue-50/20 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 outline-none shadow-sm dark:bg-blue-900/10 dark:border-blue-500/50"
                        required
                    >
                        <option value="" disabled>Ağaçtan Kategori Seçin...</option>
                        {globalCategories && globalCategories.map((c: any) => (
                            <option key={c.id} value={c.id}>{c.path}</option>
                        ))}
                    </select>
                </div>'''

content = content.replace(old_step_info, new_step_info)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
