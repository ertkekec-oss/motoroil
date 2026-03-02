const { Project, SyntaxKind } = require('ts-morph');
const fs = require('fs');

const project = new Project();
const sourceFile = project.addSourceFileAtPath('src/components/IntegrationsContent.tsx');

// Import enterprise components
sourceFile.addImportDeclaration({
    moduleSpecifier: '@/components/ui/enterprise',
    namedImports: ['EnterpriseCard', 'EnterpriseSectionHeader', 'EnterpriseInput', 'EnterpriseButton', 'EnterpriseSwitch', 'EnterpriseSelect']
});

// We can do simple string replacements on the JSX to flatten classes
let code = sourceFile.getFullText();

// 1. Remove big shadows & rounded-2xl -> rounded-lg
code = code.replace(/shadow-xl shadow-[a-z0-9\/]+/g, 'shadow-sm');
code = code.replace(/shadow-lg shadow-[a-z0-9\/]+/g, 'shadow-sm');
code = code.replace(/shadow-inner/g, '');
code = code.replace(/rounded-2xl/g, 'rounded-lg');
code = code.replace(/rounded-xl/g, 'rounded-md');
code = code.replace(/rounded-\[20px\]/g, 'rounded-xl');
code = code.replace(/rounded-\[12px\]/g, 'rounded-md');
code = code.replace(/rounded-\[14px\]/g, 'rounded-md');
code = code.replace(/scale-105/g, '');
code = code.replace(/backdrop-blur-md/g, '');
code = code.replace(/!text-white/g, 'text-white');

// 2. Simplification of specific buttons in tabs 
// From: bg-blue-600 text-white shadow-sm scale-105
// To: bg-slate-800 text-white (or just blue-600 without shadow)
code = code.replace(
    /className={`px-5 py-2\.5 rounded-md text-xs font-black tracking-wider transition-all flex items-center gap-2\.5 \$\{activeTab === tab\.id \? 'bg-blue-600 text-white shadow-sm ' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'\}`}/g,
    "className={`px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}"
);

// TABS container: From p-1.5 bg-slate-50 dark:bg-white/5 rounded-md border text-xs
code = code.replace(
    /className="flex flex-wrap gap-2 p-1\.5 bg-slate-50 dark:bg-white\/5 rounded-md border border-slate-200 dark:border-white\/10 w-fit mb-10 "/g,
    'className="flex flex-wrap gap-2 p-1 bg-slate-100 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800 w-fit mb-8"'
);

// 3. Save Button
code = code.replace(
    /className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white text-white rounded-md font-black text-xs tracking-widest shadow-sm hover:shadow-primary\/40 transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50"/g,
    'className="h-10 px-6 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white rounded-md font-semibold text-sm transition-all flex items-center gap-2 disabled:opacity-50"'
);

// 4. "TEST ORTAMI" vs "CANLI ORTAM" buttons 
// They are using bg-amber-500 and bg-blue-600 with uppercase text-xs. Let's make them standard Enterprise segments
code = code.replace(/bg-amber-500/g, 'bg-slate-800');
code = code.replace(/bg-emerald-500/g, 'bg-slate-800');

// 5. Replace EnterpriseInput manually for some common inputs
code = code.replace(/<input type="text" className="w-full h-\[44px\] px-\[12px\] rounded-md bg-white dark:bg-slate-800\/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 hover:border-slate-300 dark:hover:border-slate-600 transition-all outline-none"(.*?)\/>/g, '<EnterpriseInput$1/>');
code = code.replace(/<input type="password" className="w-full h-\[44px\] px-\[12px\] rounded-md bg-white dark:bg-slate-800\/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 hover:border-slate-300 dark:hover:border-slate-600 transition-all outline-none"(.*?)\/>/g, '<EnterpriseInput type="password"$1/>');

// Replace standard <select> with EnterpriseSelect
code = code.replace(/<select className="w-full h-\[44px\] px-\[12px\] rounded-md bg-white dark:bg-slate-800\/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-[^"]+"([^>]*)>/g, '<EnterpriseSelect$1>');
code = code.replace(/<\/select>/g, '</EnterpriseSelect>');

// Let's replace the huge border wrappers with EnterpriseCard wrappers where obvious:
// div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-8
code = code.replace(/<div className="bg-white dark:bg-\[\#111827\] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 [^"]*">/g, '<EnterpriseCard className="mb-6 p-8 relative overflow-hidden">');
// Since EnterpriseCard is a div, we don't need to change the closing </div>

// Remove decorative background glow
code = code.replace(/<div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-600\/5 rounded-full blur-3xl pointer-events-none" \/>/g, '');
// Remove the label divs that sit above inputs and merge them into the EnterpriseInput's `label` prop if possible, but it's hard with regex. leaving inputs alone is safer, we'll just fix the wrapper shapes.

fs.writeFileSync('src/components/IntegrationsContent.tsx', code, 'utf8');
console.log('Saved Integrations modifications');
