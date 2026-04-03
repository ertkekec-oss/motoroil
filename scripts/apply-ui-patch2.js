const fs = require('fs');
let c = fs.readFileSync('src/app/(app)/service/[id]/ServiceDetailClient.tsx', 'utf8');

c = c.replace(
  'className="flex-1 p-4 sm:p-4 sm:p-5 lg:p-10 max-w-[1400px] mx-auto w-full space-y-8"',
  'className="flex-1 p-3 sm:p-6 lg:p-8 max-w-[1400px] mx-auto w-full space-y-4"'
);

c = c.replace(
  /className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white\/10 rounded-\[16px\] shadow-sm p-4 sm:p-4 sm:p-5 lg:p-8 animate-in fade-in zoom-in-95 duration-200"/g,
  'className="bg-white dark:bg-[#0B1220] border border-slate-200/60 dark:border-white/5 rounded-[16px] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden animate-in fade-in zoom-in-95 duration-200"'
);

c = c.replace(
  /className="grid grid-cols-2 gap-4 mt-2 p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white\/5 rounded-xl"/g,
  'className="grid grid-cols-2 gap-4 mt-2 p-4 bg-slate-50/50 dark:bg-[#0f172a] border border-slate-200/60 dark:border-white/5 rounded-[12px]"'
);

c = c.replace(
  /className="w-full min-h-\[120px\] p-4 rounded-xl border border-slate-200 dark:border-white\/10 bg-slate-50 dark:bg-slate-800\/50 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-y"/g,
  'className="w-full min-h-[120px] p-4 rounded-[12px] border border-slate-200/60 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/30 text-[13px] focus:ring-2 focus:ring-emerald-500/50 outline-none resize-y font-medium text-slate-700 dark:text-slate-300"'
);

c = c.replace(
  /className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-500\/10 border border-emerald-100 dark:border-emerald-500\/20 rounded-\[12px\] flex flex-wrap gap-4 sm:p-5 items-center"/g,
  'className="mt-3 p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-[12px] flex flex-wrap gap-6 items-center"'
);

fs.writeFileSync('src/app/(app)/service/[id]/ServiceDetailClient.tsx', c);
