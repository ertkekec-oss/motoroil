const fs = require('fs');
const file = 'src/app/(app)/staff/me/page.tsx';
let txt = fs.readFileSync(file, 'utf-8');

// Dış ve sert sınırları kaldır; pürüzsüz kart ve hap (pill) tasarımlarına dönüştür.
// DASHBOARD
txt = txt.replace(/bg-surface border border-default p-4 flex flex-col justify-between rounded-md shadow-sm/g, 'bg-white dark:bg-[#1e293b] p-5 flex flex-col justify-between rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-transparent');
txt = txt.replace(/bg-surface dark:bg-emerald-900\/10 border border-state-success-border p-4 flex flex-col justify-between rounded-md shadow-sm/g, 'bg-emerald-50 dark:bg-emerald-900/10 p-5 flex flex-col justify-between rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-transparent');
txt = txt.replace(/bg-surface border border-default overflow-hidden flex flex-col rounded-md shadow-sm/g, 'bg-white dark:bg-[#1e293b] overflow-hidden flex flex-col rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-transparent');

// TARGETS
txt = txt.replace(/bg-surface dark:bg-\[\#0f172a\] border border-default rounded-md shadow-sm p-4 flex flex-col justify-between/g, 'bg-white dark:bg-[#1e293b] rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] p-5 flex flex-col justify-between border border-transparent');
txt = txt.replace(/bg-emerald-50\/50 dark:bg-emerald-900\/10 border border-state-success-border rounded-md shadow-sm p-4 flex flex-col justify-between/g, 'bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] p-5 flex flex-col justify-between border border-transparent');
txt = txt.replace(/bg-surface border border-default rounded-md shadow-sm/g, 'bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-transparent');
txt = txt.replace(/bg-surface-secondary px-4 py-3 border-b border-default/g, 'bg-slate-50 dark:bg-[#0f172a] px-5 py-4 border-none');

// TASKS & SHIFTS
txt = txt.replace(/bg-white dark:bg-slate-800 p-4 rounded-sm border border-default shadow-sm shrink-0/g, 'bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-transparent shrink-0');
txt = txt.replace(/p-4 rounded-sm border flex flex-col justify-between/g, 'p-4 rounded-2xl flex flex-col justify-between border border-transparent shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)]');
txt = txt.replace(/p-5 rounded-sm border bg-surface-bg\/30 dark:bg-slate-800\/40 border-default border-t-2 border-t-blue-500/g, 'p-6 rounded-2xl bg-white dark:bg-[#1e293b] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-transparent border-t-2 border-t-blue-500');
txt = txt.replace(/p-5 rounded-sm border bg-surface-bg\/30 dark:bg-slate-800\/40 border-default border-t-2 border-t-emerald-500/g, 'p-6 rounded-2xl bg-white dark:bg-[#1e293b] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-transparent border-t-2 border-t-emerald-500');
txt = txt.replace(/p-5 rounded-sm border bg-surface-bg\/30 dark:bg-slate-800\/40 border-default border-t-2 border-t-slate-500/g, 'p-6 rounded-2xl bg-white dark:bg-[#1e293b] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-transparent border-t-2 border-t-slate-500');

// PROFILE
txt = txt.replace(/w-16 h-16 rounded-sm bg-surface-tertiary border border-default/g, 'w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 border border-transparent');

// TABS (Kutuların çizgileri, hap tasarımlar)
txt = txt.replace(/bg-slate-100\/50 dark:bg-slate-800\/30 p-1 rounded-lg border border-slate-200\/50 dark:border-white\/5/g, 'bg-slate-100/50 dark:bg-[#1e293b] p-1.5 rounded-[16px] shadow-none border border-transparent');
txt = txt.replace(/"px-4 py-2 text-\[12px\] font-bold text-slate-900 dark:text-white bg-white dark:bg-\[\#0f172a\] shadow-sm border border-slate-200\/50 dark:border-white\/10 rounded-\[6px\]"/g, '"px-6 py-2.5 text-[12px] font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-800 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-transparent rounded-[12px]"');
txt = txt.replace(/"px-4 py-2 text-\[12px\] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-all rounded-\[6px\]"/g, '"px-6 py-2.5 text-[12px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-all rounded-[12px] border border-transparent"');

fs.writeFileSync(file, txt);
console.log('Fixes applied to', file);
