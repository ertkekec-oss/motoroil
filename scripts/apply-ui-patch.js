const fs = require('fs');

let c = fs.readFileSync('src/app/(app)/service/[id]/ServiceDetailClient.tsx', 'utf8');

c = c.replace(/rounded-\[24px\]/g, 'rounded-[16px]');
c = c.replace(/rounded-2xl/g, 'rounded-[16px]');
c = c.replace(/p-6/g, 'p-4 sm:p-5');

c = c.replace(
  /<div className="flex-1 p-4 sm:p-6 lg:p-10 max-w-\[1400px\] mx-auto w-full space-y-8">/,
  '<div className="flex-1 p-3 sm:p-6 lg:p-8 max-w-[1400px] mx-auto w-full space-y-4">'
);

c = c.replace(
  /<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in zoom-in-95 duration-200">/,
  '<div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-in fade-in zoom-in-95 duration-200">'
);

c = c.replace(
  /<div className="lg:col-span-2 space-y-6">/,
  '<div className="lg:col-span-2 space-y-4">'
);

c = c.replace(
  /<div className="lg:col-span-1 space-y-6">/,
  '<div className="lg:col-span-1 space-y-4">'
);

c = c.replace(
  /<div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white\/10 rounded-\[16px\] shadow-sm p-4 sm:p-5 lg:p-8 animate-in fade-in zoom-in-95 duration-200">/g,
  '<div className="bg-white dark:bg-[#0B1220] border border-slate-200/60 dark:border-white/5 rounded-[16px] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">'
);

c = c.replace(
  /<div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white\/10 rounded-\[16px\] shadow-sm p-4 sm:p-5">/g,
  '<div className="bg-white dark:bg-[#0B1220] border border-slate-200/60 dark:border-white/5 rounded-[16px] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] p-4 sm:p-5">'
);

c = c.replace(
  /<div className="bg-slate-50 dark:bg-slate-800\/50 border border-slate-200 dark:border-white\/10 rounded-\[16px\] shadow-sm p-4 sm:p-5 flex flex-col justify-between">/g,
  '<div className="bg-white dark:bg-[#0B1220] border border-slate-200/60 dark:border-white/5 rounded-[16px] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] p-4 sm:p-5 flex flex-col justify-between">'
);

c = c.replace(
  /<div className="mt-3 p-4 bg-emerald-50 dark:bg-emerald-500\/10 border border-emerald-100 dark:border-emerald-500\/20 rounded-xl flex flex-wrap gap-6 items-center">/,
  '<div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-[12px] flex flex-wrap gap-6 items-center">'
);

c = c.replace(
  /<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">/,
  '<div className="p-4 sm:p-5 border-b border-slate-100 dark:border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50 dark:bg-white/[0.02]">'
);

c = c.replace(
  /<div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">/g,
  '<div className="overflow-x-auto">'
);

c = c.replace(
  /<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b border-slate-100 dark:border-white\/5 pb-4">/,
  '<div className="p-4 sm:p-5 border-b border-slate-100 dark:border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50 dark:bg-white/[0.02]">'
);

c = c.replace(
  /<h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">/g,
  '<h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2 uppercase tracking-wide">'
);

c = c.replace(
  /<div className="flex flex-col sm:flex-row gap-3 mb-8 bg-slate-50 dark:bg-slate-800\/50 p-4 rounded-\[16px\] border border-slate-200 dark:border-white\/10">/,
  '<div className="flex flex-col sm:flex-row gap-3 m-4 sm:m-5 bg-slate-50/50 dark:bg-slate-800/20 p-3 rounded-[12px] border border-slate-200/60 dark:border-white/5">'
);

fs.writeFileSync('src/app/(app)/service/[id]/ServiceDetailClient.tsx', c);
