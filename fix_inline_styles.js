const fs = require('fs');
const path = require('path');

const formsDir = 'src/app/(app)/settings/_components/forms';
const files = fs.readdirSync(formsDir).map(f => path.join(formsDir, f));
files.push('src/app/(app)/settings/page.tsx');
files.push('src/components/IntegrationsContent.tsx');
files.push('src/components/ui/enterprise/index.tsx');

function cleanFile(code) {
    // specific instances found in grep:
    code = code.replace(/background: 'linear-gradient\(135deg, var\(--primary\) 0%, #3B82F6 100%\)',/g, '');
    code = code.replace(/boxShadow: '0 10px 30px rgba\(36,123,254,0\.3\)'/g, '');
    code = code.replace(/style=\{\{ padding: '10px 12px', background: 'rgba\(255,255,255,0\.03\)', borderRadius: '8px', border: '1px solid rgba\(255,255,255,0\.02\)' \}\}/g, 'className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"');
    code = code.replace(/background: newCampaign\.targetCustomerCategoryIds\?\.includes\(cc\) \? 'var\(--info\)' : 'rgba\(255,255,255,0\.05\)'/g, "background: newCampaign.targetCustomerCategoryIds?.includes(cc) ? '#3B82F6' : ''");
    code = code.replace(/background: newCampaign\.conditions\.brands\?\.includes\(b\) \? 'var\(--primary\)' : 'rgba\(255,255,255,0\.05\)'/g, "background: newCampaign.conditions.brands?.includes(b) ? '#3B82F6' : ''");
    code = code.replace(/background: newCampaign\.conditions\.categories\?\.includes\(c\) \? 'var\(--secondary\)' : 'rgba\(255,255,255,0\.05\)'/g, "background: newCampaign.conditions.categories?.includes(c) ? '#3B82F6' : ''");
    code = code.replace(/background: definitionTab === t\.id \? 'rgba\(59, 130, 246, 0\.1\)' : 'transparent'/g, "background: definitionTab === t.id ? '#EFF6FF' : 'transparent'");
    code = code.replace(/background: log\.action\?\.includes\('DELETE'\) \? 'rgba\(239, 68, 68, 0\.1\)' : 'rgba\(59, 130, 246, 0\.1\)'/g, 'backgroundColor: log.action?.includes("DELETE") ? "#FEF2F2" : "#EFF6FF"');
    code = code.replace(/background: c\.isUsed \? 'rgba\(255,255,255,0\.2\)' : 'var\(--primary\)'/g, "background: c.isUsed ? '#E2E8F0' : '#3B82F6'");

    // General purge of inline styles we don't want
    code = code.replace(/style=\{\{.*?background: 'none', border: 'none', color: 'var\(--danger\)', cursor: 'pointer', fontSize: '14px'.*?\}\}/g, 'className="text-red-500 hover:text-red-600 transition-colors"');

    // Convert old classes in definitions 
    code = code.replace(/flex-between/g, 'flex justify-between items-center');

    // Replace the specific legacy buttons at the bottom of forms (if any remain)
    code = code.replace(/btn btn-primary/g, 'bg-blue-600 hover:bg-blue-700 text-white h-11 px-5 rounded-xl transition-all font-medium');
    code = code.replace(/btn btn-danger/g, 'bg-rose-600 hover:bg-rose-700 text-white h-11 px-5 rounded-xl transition-all font-medium');
    code = code.replace(/btn btn-ghost/g, 'bg-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all font-medium rounded-xl h-11 px-5');

    return code;
}

files.forEach(file => {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        content = cleanFile(content);
        fs.writeFileSync(file, content);
    }
});
console.log('Inline styles purged!');
