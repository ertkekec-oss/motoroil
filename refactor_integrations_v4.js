const { Project } = require('ts-morph');
const fs = require('fs');

const project = new Project();
const sourceFile = project.addSourceFileAtPath('src/components/IntegrationsContent.tsx');

// Import enterprise components
sourceFile.addImportDeclaration({
    moduleSpecifier: '@/components/ui/enterprise',
    namedImports: ['EnterpriseInput', 'EnterpriseSelect']
});

let code = sourceFile.getFullText();

// 1. Remove big shadows & rounded-2xl -> rounded-xl (Enterprise uses rounded-[20px] which is basically xl/2xl)
code = code.replace(/shadow-xl shadow-[a-z0-9\/-]+/g, 'shadow-sm');
code = code.replace(/shadow-lg shadow-[a-z0-9\/-]+/g, 'shadow-sm');
code = code.replace(/shadow-inner/g, '');
code = code.replace(/rounded-2xl/g, 'rounded-[20px]');
code = code.replace(/rounded-xl/g, 'rounded-[16px]');
code = code.replace(/scale-105/g, '');
code = code.replace(/backdrop-blur-md/g, '');
code = code.replace(/!text-white/g, 'text-white');

// 2. Simplification of specific buttons in tabs 
code = code.replace(
    /className={`px-5 py-2\.5 rounded-\[16px\] text-xs font-black tracking-wider transition-all flex items-center gap-2\.5 \$\{activeTab === tab\.id\s*\?\s*'bg-blue-600 text-white shadow-sm '\s*:\s*'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800'\}`}/g,
    "className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-white dark:bg-[#111827] text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/50 rounded-lg'}`}"
);

// TABS container
code = code.replace(
    /className="flex flex-wrap gap-2 p-1\.5 bg-slate-50 dark:bg-white\/5 rounded-\[20px\] border border-slate-200 dark:border-white\/10 w-fit mb-10 "/g,
    'className="flex flex-wrap gap-2 p-1 bg-slate-100 dark:bg-[#0B1120] rounded-[12px] border border-slate-200 dark:border-slate-800 w-fit mb-8"'
);

// 3. Save Button
code = code.replace(
    /className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white text-white rounded-\[16px\] font-black text-xs tracking-widest shadow-sm hover:shadow-[a-z0-9\/-]+ transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50"/g,
    'className="h-10 px-6 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white rounded-[14px] font-semibold text-sm transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 shadow-sm border border-transparent"'
);

// 4. "TEST ORTAMI" vs "CANLI ORTAM" buttons 
code = code.replace(/bg-amber-500/g, 'bg-slate-800');
code = code.replace(/bg-emerald-500/g, 'bg-slate-800');

// "AYARLARI KAYDET" emoji / text tweak if needed, but the class change above covers it.

// 5. Replace standard forms with Enterprise components
code = code.replace(/<input type="text" className="w-full h-\[44px\] px-\[12px\] rounded-\[12px\] bg-white dark:bg-slate-800\/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 hover:border-slate-300 dark:hover:border-slate-600 transition-all outline-none"(.*?)\/>/g, '<EnterpriseInput$1/>');
code = code.replace(/<input type="password" className="w-full h-\[44px\] px-\[12px\] rounded-\[12px\] bg-white dark:bg-slate-800\/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 hover:border-slate-300 dark:hover:border-slate-600 transition-all outline-none"(.*?)\/>/g, '<EnterpriseInput type="password"$1/>');

code = code.replace(/<select className="w-full h-\[44px\] px-\[12px\] rounded-\[12px\] bg-white dark:bg-slate-800\/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-[^"]+"([^>]*)>/g, '<EnterpriseSelect$1>');
code = code.replace(/<\/select>/g, '</EnterpriseSelect>');

// Make main wrapper Enterprise standard
// The main section box is: <div className="bg-white dark:bg-[#111827] rounded-[20px] border border-slate-200 dark:border-slate-800 shadow-sm p-8 border border-slate-200 dark:border-white/10 overflow-hidden relative">
code = code.replace(/className="bg-white dark:bg-\[\#111827\] rounded-\[20px\] border border-slate-200 dark:border-slate-800 shadow-sm p-8 border border-slate-200 dark:border-white\/10 overflow-hidden relative"/g, 'className="bg-white dark:bg-[#111827] rounded-[20px] border border-slate-200 dark:border-slate-800 shadow-sm p-8 relative"');

fs.writeFileSync('src/components/IntegrationsContent.tsx', code, 'utf8');
console.log('Saved v4 Integrations modifications.');
