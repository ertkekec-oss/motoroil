const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/(app)/inventory/components/ProductWizardModal.tsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
    'const totalSteps = 5;', 
    'const totalSteps = 6;'
);

content = content.replace(
    '{ step: 5, label: " Baðlý Ürünler\ },',
 '{ step: 5, label: \Baðlý Ürünler\ },\n { step: 6, label: \B2B Detayý\ },'
);

content = content.replace(
 /idx < 4 && \(/g, 
 'idx < 5 && ('
);

content = content.replace(
 '<StepConnectedProducts mode={mode} data={data} onChange={onChange} setCurrentStep={setCurrentStep} />\n )}',
 '<StepConnectedProducts mode={mode} data={data} onChange={onChange} setCurrentStep={setCurrentStep} />\n )}\n {currentStep === 6 && (\n <StepB2BDetails mode={mode} data={data} onChange={onChange} />\n )}'
);

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
 </div>
 </div>
 );
}
;

content += '\n' + newStepStr;

fs.writeFileSync(filePath, content, 'utf8');
