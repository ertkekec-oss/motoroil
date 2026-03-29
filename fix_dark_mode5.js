const fs = require('fs');
const f = 'src/app/(app)/staff/me/page.tsx';
let c = fs.readFileSync(f, 'utf8');

c = c.replace(/border-blue-200'/g, `border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400'`);
c = c.replace(/border-red-100'/g, `border-red-100 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400'`);

fs.writeFileSync(f, c);
console.log('done fixing dark mode 5');
