const fs = require('fs');
const f = 'src/app/(app)/staff/me/page.tsx';
let c = fs.readFileSync(f, 'utf8');

c = c.replace(/: 'bg-slate-100 dark:bg-slate-800\/40 text-slate-600 hover:bg-slate-200'/g, ": 'bg-slate-100 dark:bg-slate-800/40 text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800 dark:text-slate-400'");
fs.writeFileSync(f, c);
console.log('done fixing dark mode 3');
