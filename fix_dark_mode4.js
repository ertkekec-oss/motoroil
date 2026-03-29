const fs = require('fs');
const f = 'src/app/(app)/staff/me/page.tsx';
let c = fs.readFileSync(f, 'utf8');

// Fix Dashboard top stats labels
c = c.replace(/className="text-\[10px\] font-bold text-slate-500 tracking-widest uppercase"/g, 'className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-widest uppercase"');

// Fix Dashboard header titles
c = c.replace(/className="flex items-center gap-2 text-\[12px\] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400"/g, 'className="flex items-center gap-2 text-[12px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-300"');

// Fix Table head text colors to be slightly brighter in dark mode
c = c.replace(/dark:text-slate-400 uppercase tracking-widest sticky top-0/g, 'dark:text-slate-300 uppercase tracking-widest sticky top-0');

fs.writeFileSync(f, c);
console.log('done fixing dark mode 4');
