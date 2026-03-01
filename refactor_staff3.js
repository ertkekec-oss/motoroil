const fs = require('fs');
const file = 'src/components/StaffManagementContent.tsx';
let txt = fs.readFileSync(file, 'utf8');

// Replace standard custom containers
txt = txt.replace(/className="card glass p-0 overflow-hidden"/g, 'className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-[20px] shadow-sm overflow-hidden"');
txt = txt.replace(/className="card glass p-8/g, 'className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-[20px] shadow-sm p-6');
txt = txt.replace(/card glass p-8/g, 'bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-[20px] shadow-sm p-6');

// List tab grid items styling
txt = txt.replace(/background: 'rgba\(0, 0, 0, 0\.4\)', backdropFilter: 'blur\(12px\)'/g, "background: 'var(--bg-card)', backdropFilter: 'none'");
txt = txt.replace(/className="rounded-2xl p-6 border border-slate-100 dark:border-slate-800 hover:border-blue-500\/30 transition-all duration-300 group shadow-lg"/g,
    'className="bg-white dark:bg-[#0f172a] rounded-[20px] p-6 border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-500/30 transition-all duration-300 group shadow-sm"');

// Fix text colors in list tab
txt = txt.replace(/<div className="text-sm font-black text-white">\{person\.performance \|\| 100\}<\/div>/g, '<div className="text-sm font-semibold text-slate-900 dark:text-white">{person.performance || 100}</div>');
txt = txt.replace(/text-white\/30/g, 'text-slate-400 dark:text-slate-500');
txt = txt.replace(/text-white\/40/g, 'text-slate-500 dark:text-slate-400');
txt = txt.replace(/text-white\/50/g, 'text-slate-500 dark:text-slate-400');
txt = txt.replace(/text-white\/60|text-white\/70|text-white\/80/g, 'text-slate-600 dark:text-slate-300');
txt = txt.replace(/text-white/g, 'text-slate-900 dark:text-white');

// Fix inner bg elements
txt = txt.replace(/bg-black\/20/g, 'bg-slate-50 dark:bg-slate-800/50');
txt = txt.replace(/bg-white\/\[0\.03\]/g, 'bg-slate-50 dark:bg-slate-800/50');
txt = txt.replace(/bg-white\/\[0\.02\]/g, 'bg-slate-50 dark:bg-slate-800/50');

// Fix tables
txt = txt.replace(/<tr className="hover:bg-white\/\[0\.02\]">/g, '<tr className="h-[52px] hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 transition-colors">');
txt = txt.replace(/<tr key=\{person\.id\} className="hover:bg-slate-50 dark:hover:bg-slate-800\/50">/g, '<tr key={person.id} className="h-[52px] border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">');
txt = txt.replace(/<tr key=\{idx\} className="hover:bg-slate-50 dark:hover:bg-slate-800\/50 transition-colors">/g, '<tr key={idx} className="h-[52px] hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 transition-colors">');

// Convert specific table headings
txt = txt.replace(/<thead className="bg-slate-50 dark:bg-slate-800\/50 text-\[10px\] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest">/g,
    '<thead className="bg-slate-50 dark:bg-slate-800/50 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">');
txt = txt.replace(/<thead className="bg-slate-50 dark:bg-slate-800\/50 text-\[10px\] text-slate-500 dark:text-slate-400 font-black uppercase">/g,
    '<thead className="bg-slate-50 dark:bg-slate-800/50 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">');

// Modals:
txt = txt.replace(/className="bg-\[#0F111A\] max-w-2xl/g, 'className="bg-white dark:bg-[#0f172a] max-w-2xl');
txt = txt.replace(/className="text-2xl font-black text-white"/g, 'className="text-2xl font-bold text-slate-900 dark:text-white"');
txt = txt.replace(/bg-\[#141721\] border-white\/5/g, 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800');

fs.writeFileSync(file, txt, 'utf8');
console.log('Staff refactored 3');
