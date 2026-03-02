const fs = require('fs');
const file = 'src/app/(app)/accounting/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// The replacement that initially broke it was replacing `glass` but there could have been standard logic like:
// `className="foo bar ${card.bg} card glass"`
// where `glass` was replaced by `bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm`.
// That is actually valid CSS! But there was `glass-nav` or something else that broke.
// Oh, `glass` string replacements in node string.replace(/glass/g) might break `console.log('hourglass')` etc.
// Let's use `\bglass\b`
content = content.replace(/\bglass-nav\b/g, 'bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm');
content = content.replace(/\bglass\b/g, 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm');

// Repeat other strict steps
content = content.replace(/,\s*backdropFilter:\s*['"][^'"]+['"]/g, '');
content = content.replace(/backdropFilter:\s*['"][^'"]+['"]\s*,?/g, '');
content = content.replace(/backdrop-filter:[^;]+;/g, '');
content = content.replace(/\bbackdrop-filter\b/g, '');
content = content.replace(/\bbackdrop-blur-[a-z0-9]+\b/g, '');
content = content.replace(/\bblur-[a-z0-9]+\b/g, '');
content = content.replace(/\bbackdrop-blur-\[[^\]]+\]\b/g, '');
content = content.replace(/\bblur-\[[^\]]+\]\b/g, '');
content = content.replace(/\bbg-white\/[567]0\b/g, 'bg-white dark:bg-slate-900');
content = content.replace(/\bshadow-xl\b/g, 'shadow-sm');
content = content.replace(/\bshadow-lg\b/g, 'shadow-sm');
content = content.replace(/\bshadow-md\b/g, 'shadow-sm');

fs.writeFileSync(file, content, 'utf8');
console.log('Accounting page fixed.');
