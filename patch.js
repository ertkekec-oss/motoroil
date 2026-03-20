const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/(app)/inventory/components/ProductWizardModal.tsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace('const totalSteps = 5;', 'const totalSteps = 6;');

content = content.replace(
    '{ step: 5, label: "Bağlı Ürünler" },',
    `{ step: 5, label: "Bağlı Ürünler" },
                            { step: 6, label: "B2B Katalog Detayı" },`
);

content = content.replace('idx < 4 && (', 'idx < 5 && (');

const targetRender = `{currentStep === 5 && (
                        <StepConnectedProducts mode={mode} data={data} onChange={onChange} setCurrentStep={setCurrentStep} />
                    )}`;
const replacementRender = targetRender + `
                    {currentStep === 6 && (
                        <StepB2BDetails mode={mode} data={data} onChange={onChange} />
                    )}`;
content = content.replace(targetRender, replacementRender);

const stepContent = `

function StepB2BDetails({ mode, data, onChange }: any) {
    return (
        <div className="animate-in fade-in duration-300 space-y-8">
            <div className="mb-2 border-b border-slate-200 dark:border-white/5 pb-2">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">6. Aşama: B2B ve Katalog Detayları</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">B2B Ağı ve Periodya Hub üzerinde incelendiğinde müşterilerinize gösterilecek gelişmiş açıklamayı buraya girebilirsiniz.</p>
            </div>
            
            <div className="space-y-4">
                <label className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 font-semibold">Ürün Açıklaması (Gelişmiş)</label>
                <textarea
                    rows={12}
                    value={data.description || ''}
                    onChange={e => onChange({ ...data, description: e.target.value })}
                    className="w-full p-4 rounded-xl border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all bg-white dark:bg-[#0f172a] shadow-sm resize-y text-[15px] font-medium leading-relaxed"
                    placeholder="Ürün hakkında pazarlama amaçlı, detaylı bir metin yazabilirsiniz. Örneğin: Ürün materyalleri, garantisi, kullanım alanları vb."
                ></textarea>
                <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl flex gap-3 items-start">
                    <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                        Bu alana girilen detaylı ürün yazısı, doğrudan B2B Özel Kataloğu ve Periodya Satış Hubı üzerindeki İncele ekranlarında müşterilerinize sunulacaktır. Boş bırakmanız halinde detay sayfası gösterilmeyecektir.
                    </p>
                </div>
            </div>
        </div>
    );
}
`;

if (!content.includes('StepB2BDetails')) {
    content += stepContent;
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Patch successful');
