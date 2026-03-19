const fs = require('fs');

const file_path = 'src/app/(app)/inventory/components/ProductWizardModal.tsx';
let content = fs.readFileSync(file_path, 'utf8');

const oldCode = `function StepOtherInfo({ data, onChange, categories }: any) {
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
                </div>`;

const newCode = `function StepOtherInfo({ data, onChange, categories, globalCategories }: any) {
    return (
        <div className="animate-in fade-in duration-300 space-y-8">
            <div className="mb-2 border-b border-slate-200 dark:border-white/5 pb-2">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">3. Aşama: Diğer Bilgiler</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Stok kodu, fatura ayarları ve ürüne dair detaylar.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                    <label className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 font-semibold">Global Kategori</label>
                    <select 
                        value={data.globalCategoryId || ''} 
                        onChange={e => {
                            const val = e.target.value;
                            const selectedCat = globalCategories?.find((c: any) => c.id === val);
                            onChange({ 
                                ...data, 
                                globalCategoryId: val,
                                category: selectedCat ? selectedCat.path.split(' > ').pop() : data.category
                            });
                        }} 
                        className="w-full h-12 px-3 rounded-xl border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 outline-none bg-white dark:bg-[#0f172a] shadow-sm"
                    >
                        <option value="" disabled>Ağaçtan Kategori Seçin...</option>
                        {globalCategories?.map((c: any) => (
                            <option key={c.id} value={c.id}>{c.path}</option>
                        ))}
                    </select>
                </div>`;

content = content.replace(oldCode, newCode);
fs.writeFileSync(file_path, content, 'utf8');
console.log('Wizard UI Patched!');
