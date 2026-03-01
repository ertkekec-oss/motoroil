const fs = require('fs');

const file = 'src/components/StaffManagementContent.tsx';
let txt = fs.readFileSync(file, 'utf8');

// 1. KPI Strip Redesign
txt = txt.replace(/<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">/g,
    '<div className="w-full bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-[20px] shadow-sm flex flex-col md:flex-row mb-8 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800 overflow-hidden">');

txt = txt.replace(/<div className="card glass p-5 relative overflow-hidden group">/g,
    '<div className="flex-1 p-6 relative overflow-hidden group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">');

txt = txt.replace(/<div className="text-muted text-\[10px\] font-black uppercase tracking-widest mb-1">/g,
    '<div className="text-slate-500 dark:text-slate-400 text-[11px] font-semibold tracking-wider uppercase mb-2">');

txt = txt.replace(/<div className="text-3xl font-black text-white">/g,
    '<div className="text-[28px] font-semibold text-slate-900 dark:text-white">');

txt = txt.replace(/<div className="text-3xl font-black text-emerald-400">/g,
    '<div className="text-[28px] font-semibold text-emerald-600 dark:text-emerald-400">');

txt = txt.replace(/<div className="text-3xl font-black text-blue-400">/g,
    '<div className="text-[28px] font-semibold text-amber-600 dark:text-amber-400">'); // Devam eden is amber

txt = txt.replace(/<div className="text-3xl font-black text-slate-400">/g,
    '<div className="text-[28px] font-semibold text-blue-600 dark:text-blue-400">'); // Verimlilik is blue

// 2. Tab Navigation Redesign
txt = txt.replace(/<div className="flex items-center gap-4 mb-8 bg-\[#0f111a\] rounded-xl border border-white\/5 overflow-hidden flex-col md:flex-row items-stretch">/,
    '<div className="flex border-b border-slate-200 dark:border-slate-800 mb-8 w-full md:items-end">');

txt = txt.replace(/<div className="flex bg-\[#0f111a\] border-b border-white\/5 w-full overflow-x-auto select-none" style=\{\{ borderRadius: '12px 12px 0 0' \}\}>/g,
    '<div className="flex whitespace-nowrap overflow-x-auto h-[48px] items-end gap-6 px-2 w-full custom-scroll select-none">');

const tabActiveStr = "px-6 py-4 text-[14px] font-semibold text-blue-400 whitespace-nowrap transition-all border-b-2 border-blue-500 group relative";
txt = txt.replace(tabActiveStr, "h-full px-2 py-0 text-[14px] font-semibold text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 transition-all flex items-center");

const tabInactiveStr = "px-6 py-4 text-[14px] font-medium text-white/40 hover:text-white/80 whitespace-nowrap transition-all border-b-2 border-transparent";
txt = txt.replace(tabInactiveStr, "h-full px-2 py-0 text-[14px] font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 border-b-2 border-transparent transition-all flex items-center");

txt = txt.replace(/style=\{activeTab === tab\.id \? \{ boxShadow: 'inset 0 -15px 15px -15px rgba\(59, 130, 246, 0\.2\)' \} : \{\}\}/g, "");


// 3. Header Redesign Base
txt = txt.replace(/<h1 style=\{\{ fontSize: '30px', fontWeight: '700', color: 'var\(--text-main, #fff\)', margin: 0, letterSpacing: '-0\.5px' \}\}>/g,
    '<h1 className="text-[30px] font-bold text-slate-900 dark:text-white leading-tight">');

txt = txt.replace(/<div style=\{\{ fontSize: '13px', color: 'var\(--text-muted, #888\)', marginTop: '6px', fontWeight: '500' \}\}>/g,
    '<div className="text-[14px] text-slate-500 dark:text-slate-400 mt-1 font-medium">');

txt = txt.replace(/<div style=\{\{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid var\(--border-color, rgba\(255,255,255,0\.05\)\)' \}\}>/g,
    '<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200 dark:border-slate-800">');

// 4. Tables and Row colors 
txt = txt.replace(/bg-\[#141721\]/g, 'bg-white dark:bg-[#0F172A]');
txt = txt.replace(/bg-white\/5/g, 'bg-slate-50 dark:bg-slate-800/50');
txt = txt.replace(/border-white\/10/g, 'border-slate-200 dark:border-slate-800');
txt = txt.replace(/border-white\/5/g, 'border-slate-100 dark:border-slate-800');
txt = txt.replace(/text-white\/40/g, 'text-slate-500 dark:text-slate-400');
txt = txt.replace(/text-white\/60/g, 'text-slate-600 dark:text-slate-300');
txt = txt.replace(/text-white\/80/g, 'text-slate-700 dark:text-slate-200');

// Replace standard tailwind table rows (zebra or border)
txt = txt.replace(/<tr className="hover:bg-white\/5/g, '<tr className="h-[52px] hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 transition-colors');
txt = txt.replace(/<tr className="border-b border-white\/5/g, '<tr className="h-[52px] border-b border-slate-100 dark:border-slate-800 transition-colors');


fs.writeFileSync(file, txt, 'utf8');
console.log('Staff refactored 2');
