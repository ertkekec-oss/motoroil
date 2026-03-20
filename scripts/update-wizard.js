const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/(app)/inventory/components/ProductWizardModal.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Update totalSteps
content = content.replace('const totalSteps = 5;', 'const totalSteps = 6;');

// Add Step 6 to Map
content = content.replace(
    '{ step: 5, label: " Baðlý Ürünler\ },',
 '{ step: 5, label: \Baðlý Ürünler\ },\n { step: 6, label: \B2B Detayý\ },'
);

// Update progress bar logic
content = content.replace('idx < 4 && (', 'idx < 5 && (');

// Render StepB2BDetails
content = content.replace(
 '<StepConnectedProducts mode={mode} data={data} onChange={onChange} setCurrentStep={setCurrentStep} />\n )}',
 '<StepConnectedProducts mode={mode} data={data} onChange={onChange} setCurrentStep={setCurrentStep} />\n )}\n {currentStep === 6 && (\n <StepB2BDetails mode={mode} data={data} onChange={onChange} />\n )}'
);

// Append StepB2BDetails function at the end
const newStepStr = 
function StepB2BDetails({ mode, data, onChange }: any) {
 return (
 <div className=\animate-in fade-in duration-300 space-y-8\>
 <div className=\mb-2 border-b border-slate-200 dark:border-white/5 pb-2\>
 <h3 className=\text-base font-semibold text-slate-900 dark:text-white\>6. Aþama: B2B ve Katalog Detaylarý</h3>
 <p className=\text-sm text-slate-500 dark:text-slate-400 mt-1\>B2B Aðý ve Periodya Hub üzerinde incelendiðinde müþterilerinize gösterilecek geliþmiþ açýklamayý buraya girebilirsiniz.</p>
 </div>
 
 <div className=\space-y-4\>
 <label className=\text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 font-semibold\>Ürün Açýklamasý (Geliþmiþ)</label>
 <textarea
 rows={12}
 value={data.description || ''}
 onChange={e => onChange({ ...data, description: e.target.value })}
 className=\w-full p-4 rounded-xl border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all bg-white dark:bg-[#0f172a] shadow-sm resize-y text-[15px] font-medium leading-relaxed\
 placeholder=\Ürün hakkýnda pazarlama amaçlý detaylý bir metin yazabilirsiniz. Örneðin: Ürün materyalleri garantisi kullaným alanlarý vb.\
 ></textarea>
 <div className=\p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl flex gap-3 items-start\>
 <div className=\p-1.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg hidden sm:block\><FileText size={16} /></div>
 <p className=\text-sm font-medium text-emerald-800 dark:text-emerald-300\>
 Bu alana girilen detaylý ürün yazýsý, doðrudan B2B Özel Kataloðu ve Periodya Satýþ Hubý üzerindeki \Ýncele\ ekranlarýnda müþterilerinize sunulacaktýr. Boþ býrakmanýz halinde detay sayfasý gösterilmeyecektir.
 </p>
 </div>
 </div>
 </div>
 );
}
;

content += '\n' + newStepStr;

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated ProductWizardModal.tsx via script!');
