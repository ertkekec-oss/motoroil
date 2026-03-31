const fs = require('fs');
const file = 'src/app/(app)/fintech/control-tower/page.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Rip out all the weird tab classes
const tabRegex = /className=\{\`flex-1[^\`]*\`\}/g;
const newTabClass = "className={`flex-1 min-w-[200px] h-10 px-6 rounded-full text-[11px] font-bold tracking-wide transition-all outline-none whitespace-nowrap flex items-center justify-center gap-2 border ${activeTab === '__TAB_ID__' ? 'bg-white text-slate-800 shadow-sm border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-700 border-transparent dark:text-slate-400 dark:hover:text-slate-300'}`}";

code = code.replace(/className=\{\`flex-1[^\`]*activeTab === 'control'[^\`]*\`\}/g, newTabClass.replace('__TAB_ID__', 'control'));
code = code.replace(/className=\{\`flex-1[^\`]*activeTab === 'heatmap'[^\`]*\`\}/g, newTabClass.replace('__TAB_ID__', 'heatmap'));
code = code.replace(/className=\{\`flex-1[^\`]*activeTab === 'pricing'[^\`]*\`\}/g, newTabClass.replace('__TAB_ID__', 'pricing'));


// 2. Kill all neon emeralds!
code = code.replace(/bg-emerald-500/g, 'bg-indigo-500');
code = code.replace(/bg-emerald-500\/10/g, 'bg-indigo-50 dark:bg-indigo-500/10');
code = code.replace(/bg-emerald-500\/20/g, 'bg-indigo-50 dark:bg-indigo-500/10');
code = code.replace(/bg-emerald-500\/50/g, 'bg-indigo-100 dark:bg-indigo-500/20');
code = code.replace(/bg-emerald-500\/5/g, 'bg-indigo-50 dark:bg-indigo-500/5');

code = code.replace(/text-emerald-600 dark:text-emerald-400/g, 'text-indigo-600 dark:text-indigo-400');
code = code.replace(/text-emerald-600/g, 'text-indigo-600');
code = code.replace(/text-emerald-500/g, 'text-indigo-600 dark:text-indigo-400');
code = code.replace(/text-emerald-400/g, 'text-indigo-600 dark:text-indigo-400');

code = code.replace(/border-emerald-[a-z0-9\/]+/g, 'border-indigo-200 dark:border-indigo-500/20');

// Replace rose (neon pink/red) with calmer red
code = code.replace(/bg-rose-500/g, 'bg-rose-600 dark:bg-rose-500');
code = code.replace(/bg-rose-500\/10/g, 'bg-rose-50 dark:bg-rose-500/10');
code = code.replace(/bg-rose-500\/20/g, 'bg-rose-50 dark:bg-rose-500/10');
code = code.replace(/bg-rose-500\/50/g, 'bg-rose-100 dark:bg-rose-500/20');

code = code.replace(/text-rose-600 dark:text-rose-400/g, 'text-rose-600 dark:text-rose-400');

// 3. Make titles use corporate text
// There's a title that has "bg-clip-text text-transparent bg-gradient-to-r..." 
// Oh wait, my script removed it, but "bg-clip-text" might still be there for "SMART PRICING ENGINE"
const regexSmart = /<span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">SMART<\/span>\s*<span className="bg-indigo-600 text-slate-900 dark:text-white px-3 py-1 rounded-xl shadow-lg">PRICING<\/span>\s*<span className="text-gray-400">ENGINE<\/span>/g;
// Actually just replace all big weird texts. Let me check the source for pricing engine.
// Actually I don't know the exact string, I will let the JSX be but replace the class names.
code = code.replace(/bg-gradient-to-br from-orange-400 to-amber-600/g, 'bg-slate-800');
code = code.replace(/bg-gradient-to-r from-indigo-500 to-blue-500/g, 'bg-indigo-600');
code = code.replace(/bg-gradient-to-br from-indigo-900\/20 to-transparent/g, 'bg-transparent');

// The main page uses standard HR style
code = code.replace(/bg-slate-50 dark:bg-\[\#0f172a\] min-h-screen/g, 'bg-slate-50 min-h-screen pb-16 w-full font-sans dark:bg-[#0f172a]');
code = code.replace(/<div className="p-8 space-y-8 animate-in fade-in duration-700 pb-24/g, '<div className="max-w-[1600px] mx-auto pt-8 px-4 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-700 pb-24');

// Clean up "bg-clip-text text-transparent" anywhere it exists
code = code.replace(/bg-clip-text text-transparent bg-gradient-to-r( [a-z0-9\-]+){3,4}/g, 'text-slate-800 dark:text-white');

fs.writeFileSync(file, code);
