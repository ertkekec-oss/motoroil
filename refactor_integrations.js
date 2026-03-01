const fs = require('fs');
const path = require('path');

const targetPath = path.join('src', 'components', 'IntegrationsContent.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

// Container fixes
content = content.replace(/card glass/g, 'bg-white dark:bg-[#111827] rounded-[20px] border border-slate-200 dark:border-slate-800 shadow-sm');
content = content.replace(/card glass-plus/g, 'bg-white dark:bg-[#111827] rounded-[20px] border border-slate-200 dark:border-slate-800 shadow-sm bg-gradient-to-br from-white to-slate-50 dark:from-[#111827] dark:to-[#0F172A]');

// General Text
content = content.replace(/text-white\/40/g, 'text-slate-500 dark:text-slate-400');
content = content.replace(/text-white\/30/g, 'text-slate-400 dark:text-slate-500');
content = content.replace(/text-white\/50/g, 'text-slate-500 dark:text-slate-400');
content = content.replace(/text-white\/60/g, 'text-slate-500 dark:text-slate-400');
content = content.replace(/text-white\/70/g, 'text-slate-600 dark:text-slate-300');
content = content.replace(/text-white([\s\"])/g, 'text-slate-900 dark:text-white$1');

// General Backgrounds
content = content.replace(/bg-white\/5/g, 'bg-slate-50 dark:bg-white/5');
content = content.replace(/bg-white\/10/g, 'bg-slate-100 dark:bg-white/10');
content = content.replace(/bg-white\/\[0\.02\]/g, 'bg-slate-50/50 dark:bg-white/[0.02]');
content = content.replace(/bg-white\/\[0\.05\]/g, 'bg-slate-100/50 dark:bg-white/[0.05]');
content = content.replace(/bg-white\/\[0\.08\]/g, 'bg-slate-100 dark:bg-white/[0.08]');
content = content.replace(/bg-black\/20/g, 'bg-slate-100 dark:bg-black/20');
content = content.replace(/bg-\[\#0f172a\]/g, 'bg-white dark:bg-[#0f172a]'); // For the "OR USER CREDENTIALS" divider background

// Borders
content = content.replace(/border-white\/10/g, 'border-slate-200 dark:border-white/10');
content = content.replace(/border-white\/5/g, 'border-slate-200 dark:border-white/5');

// Inputs
const inputRegex = /className="(w-full[^\"]+bg-white\/5[^\"]+)"/g;
content = content.replace(inputRegex, (match, classes) => {
    // Already replaced bg-white/5 up there, but let's standardise
    return 'className="w-full h-[44px] px-[12px] rounded-[12px] bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 hover:border-slate-300 dark:hover:border-slate-600 transition-all outline-none"';
});

// Selects
const selectRegex = /<select\s+className="w-full[^\"]+"/g;
content = content.replace(selectRegex, '<select className="w-full h-[44px] px-[12px] rounded-[12px] bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 hover:border-slate-300 dark:hover:border-slate-600 transition-all outline-none appearance-none cursor-pointer"');

// Special Tab buttons at top
// <div className="flex flex-wrap gap-2 p-1.5 bg-slate-50 dark:bg-white/5 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-white/10 w-fit mb-10 shadow-inner">
// Tab buttons themselves: bg-primary text-white or text-slate-600
content = content.replace(
    /className={`px-5 py-2\.5 rounded-xl text-xs font-black tracking-wider transition-all flex items-center gap-2\.5 \$\{activeTab === tab\.id\s*\?\s*'bg-primary text-slate-900 dark:text-white shadow-xl shadow-primary\/25 scale-105'\s*:\s*'text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:bg-white\/5'[^}]+}`}/g,
    "className={`px-5 py-2.5 rounded-xl text-xs font-black tracking-wider transition-all flex items-center gap-2.5 ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'}`}"
);

// We need to re-make sure the buttons are correctly formatted
content = content.replace(
    /\? 'bg-primary text-slate-900 dark:text-white shadow-xl shadow-primary\/25 scale-105'/,
    "? 'bg-blue-600 !text-white shadow-xl shadow-blue-500/25 scale-105'"
);

content = content.replace(
    /: 'text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-white\/5'/,
    ": 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800'"
);

// Save button 
content = content.replace(/bg-primary hover:bg-primary\/80 text-slate-900 dark:text-white/g, 'bg-blue-600 hover:bg-blue-700 text-white !text-white');

// Orange TEST ORTAMI button
content = content.replace(/bg-amber-500 text-slate-900 dark:text-white shadow-lg shadow-amber-500\/20/g, 'bg-amber-500 !text-white shadow-lg shadow-amber-500/20');
// CANLI ORTAM button
content = content.replace(/bg-emerald-500 text-slate-900 dark:text-white shadow-lg shadow-emerald-500\/20/g, 'bg-emerald-500 !text-white shadow-lg shadow-emerald-500/20');

// "Bağlantıyı şimdi test et" button
content = content.replace(
    /className="w-full h-14 bg-slate-50 dark:bg-white\/5 hover:bg-slate-100 dark:bg-white\/10 border border-slate-200 dark:border-white\/10 text-slate-900 dark:text-white rounded-2xl font-black text-xs tracking-\[0\.2em\] transition-all flex items-center justify-center gap-4 disabled:opacity-50 active:scale-\[0\.99\] group"/g,
    'className="w-full h-14 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl font-black text-xs tracking-[0.2em] transition-all flex items-center justify-center gap-4 disabled:opacity-50 active:scale-[0.99] group shadow-sm"'
);

// Some smaller test buttons
content = content.replace(
    /className="px-6 py-2\.5 bg-slate-50 dark:bg-white\/5 hover:bg-slate-100 dark:bg-white\/10 border border-slate-200 dark:border-white\/10 text-slate-900 dark:text-white rounded-xl font-black text-\[10px\] tracking-widest transition-all/g,
    'className="px-6 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl font-black text-[10px] tracking-widest transition-all shadow-sm'
);

// Toggles "text-white" 
// <div className={`w-12 h-6 rounded-full relative transition-all duration-300 ${eFaturaSettings.autoSend ? 'bg-primary' : 'bg-slate-100 dark:bg-white/10'}`}>
// Make bg-primary into bg-blue-600
content = content.replace(/bg-primary/g, 'bg-blue-600');

// Fix toggle inner circles that were 'bg-white' which is now fine, but just making sure
content = content.replace(/bg-slate-100 dark:bg-white\/10/g, 'bg-slate-200 dark:bg-slate-700');

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Processed IntegrationsContent.tsx for Enterprise Light/Dark mode Parity');
