const fs = require('fs');
const f = 'src/app/(app)/staff/me/page.tsx';
let c = fs.readFileSync(f, 'utf8');

c = c.replace(/border-emerald-200'/g, `border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400'`);
c = c.replace(/border-rose-200'/g, `border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400'`);
c = c.replace(/border-amber-200'/g, `border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400'`);

c = c.replace(/opacity-50 group-hover:opacity-100/g, 'opacity-75 group-hover:opacity-100');

fs.writeFileSync(f, c);
console.log('done fixing dark mode 2');
