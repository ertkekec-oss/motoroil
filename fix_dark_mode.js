const fs = require('fs');
const f = 'src/app/(app)/staff/me/page.tsx';
let c = fs.readFileSync(f, 'utf8');

// DashboardView fixes
c = c.replace(/px-5 py-2\.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600/g, 'px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-white');
c = c.replace(/bg-emerald-50 px-2 py-0\.5 rounded-md w-max border border-emerald-200/g, 'bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md w-max border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400');
c = c.replace(/w-14 h-14 bg-slate-50 border border-slate-200 dark:border-slate-700 rounded-xl/g, 'w-14 h-14 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 rounded-xl');

// DashboardView PDKS DOĞRULAMASI header
c = c.replace(/<h3 className="flex items-center gap-2 text-\[12px\] font-black uppercase tracking-widest text-slate-500">/g, '<h3 className="flex items-center gap-2 text-[12px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">');

// LeavesView fixes
c = c.replace(/text-slate-800">YENİ TALEP OLUŞTUR/g, 'text-slate-800 dark:text-white">YENİ TALEP OLUŞTUR');
c = c.replace(/text-slate-700 outline-none/g, 'text-slate-700 dark:text-white outline-none'); 
c = c.replace(/text-slate-900 group-hover:text-blue-600/g, 'text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400');
c = c.replace(/text-slate-500 font-medium">Toplam:/g, 'text-slate-500 dark:text-slate-400 font-medium">Toplam:');

fs.writeFileSync(f, c);
console.log('done fixing dark mode');
