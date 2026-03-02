const fs = require('fs');
const path = require('path');

const formsDir = 'src/app/(app)/settings/_components/forms';
const files = fs.readdirSync(formsDir).map(f => path.join(formsDir, f));
files.push('src/app/(app)/settings/page.tsx');
files.push('src/components/IntegrationsContent.tsx');
files.push('src/components/ui/enterprise/index.tsx');

function replaceAll(code) {
    // 🚫 Remove Banned Things
    code = code.replace(/bg-gradient-to-[a-z]+/g, '');
    code = code.replace(/from-[a-z0-9\/#-]+/g, '');
    code = code.replace(/to-[a-z0-9\/#-]+/g, '');
    code = code.replace(/shadow-xl shadow-[a-z0-9\/#-]+/g, 'shadow-sm');
    code = code.replace(/shadow-lg shadow-[a-z0-9\/#-]+/g, 'shadow-sm');
    code = code.replace(/shadow-blue-[0-9]+\/[0-9]+/g, '');
    code = code.replace(/shadow-emerald-[0-9]+\/[0-9]+/g, '');
    code = code.replace(/shadow-amber-[0-9]+\/[0-9]+/g, '');
    code = code.replace(/bg-amber-[0-9]+/g, 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300');
    code = code.replace(/text-amber-[0-9]+/g, '');
    code = code.replace(/border-amber-[0-9]+\/[0-9]+/g, '');
    // Replace old orange/amber explicitly
    code = code.replace(/#E64A00/g, '#3B82F6');

    // LAYOUT REPLACEMENTS

    // Cards / Containers
    // Match current standard and replace with the new Enterprise Console card
    code = code.replace(/bg-white dark:bg-\[#111827\]/g, 'bg-white dark:bg-[#0F172A]');
    code = code.replace(/bg-white dark:bg-\[#0B1120\]/g, 'bg-white dark:bg-slate-900'); // Input bgs

    code = code.replace(/rounded-\[20px\]/g, 'rounded-2xl');
    code = code.replace(/rounded-\[16px\]/g, 'rounded-xl');
    code = code.replace(/rounded-\[14px\]/g, 'rounded-xl');
    code = code.replace(/rounded-\[12px\]/g, 'rounded-xl');

    // Inputs (from EnterpriseInput or hardcoded)
    code = code.replace(/className="w-full h-\[44px\] px-\[12px\] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 hover:border-slate-300 dark:hover:border-slate-600 transition-all outline-none(.*?)"/g,
        'className="w-full h-11 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/40 transition-all outline-none$1"');

    // Make similar replacement for raw inputs
    code = code.replace(/h-\[44px\] px-\[12px\]/g, 'h-11 px-4');
    code = code.replace(/focus:ring-blue-600 focus:border-blue-600/g, 'focus:ring-blue-500/30 focus:border-blue-500/40');

    // Textarea raw
    code = code.replace(/className="w-full p-\[12px\] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl/g, 'className="w-full p-4 min-h-[100px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl');

    // Buttons
    // Primary
    code = code.replace(/bg-blue-600 hover:bg-blue-700 text-white h-11 px-6 rounded-xl font-bold text-sm/g, 'bg-blue-600 hover:bg-blue-700 text-white h-11 px-5 rounded-xl font-medium text-sm');
    // Danger
    code = code.replace(/bg-red-50(0\/10)? dark:bg-red-500\/10 border border-red-200 dark:border-red-500\/20 text-red-600 hover:bg-red-100 dark:hover:bg-red-500\/30/g, 'bg-rose-600 hover:bg-rose-700 text-white border-0');

    // Sidebar specifically (will only apply to page.tsx)
    code = code.replace(/<div className="flex h-screen bg-\[\#F6F8FB\] dark:bg-\[\#0B1120\] text-slate-900 dark:text-white overflow-hidden">/g,
        '<div className="flex h-screen bg-slate-50 dark:bg-[#0B1220] text-slate-900 dark:text-white overflow-hidden grid grid-cols-[260px_1fr] md:flex">');

    code = code.replace(/className="w-\[260px\] shrink-0 border-r border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-\[\#111827\] flex flex-col gap-2 overflow-y-auto"/g,
        'className="w-[260px] shrink-0 border-r border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-[#0F172A] flex flex-col gap-2 overflow-y-auto"');

    // Sidebar active item
    code = code.replace(/bg-\[\#E0E7FF\] dark:bg-\[\#1E293B\] text-blue-700 dark:text-white font-bold/g,
        'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium');

    // Sidebar default item
    code = code.replace(/text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-800/g,
        'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-xl');

    return code;
}

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    content = replaceAll(content);

    // Minor fixes on inline styles
    content = content.replace(/style=\{\{.*?fontWeight.*?\}\}/g, '');
    content = content.replace(/style=\{\{.*?fontSize.*?\}\}/g, '');

    // Replace the exact label class specified in the prompt
    content = content.replace(/text-\[10px\] font-black text-slate-500 dark:text-slate-400 uppercase tracking-\[0\.2em\] ml-1/g,
        'text-sm font-medium text-slate-700 dark:text-slate-300');

    fs.writeFileSync(file, content);
});

console.log('Global Enterprise Refresh applied.');
