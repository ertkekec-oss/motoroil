const fs = require('fs');
const file = 'src/app/(app)/fintech/control-tower/page.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Remove all static "text-white" -> "text-slate-900 dark:text-white"
// Exceptions: things inside solid badges or where we explicitly need white text even in light mode. But here it's mostly main text.
code = code.replace(/text-white/g, 'text-slate-900 dark:text-white');

// 2. Remove neon gradients
code = code.replace(/bg-clip-text text-transparent bg-gradient-to-r from-white via-[a-z]+-400 to-white animate-gradient/g, 'text-slate-900 dark:text-white');

// 3. Calm down the emeralds and neons
// Replace text-emerald-xxx with text-emerald-600 dark:text-emerald-400 (to make it readable in light mode!)
code = code.replace(/text-emerald-400/g, 'text-emerald-600 dark:text-emerald-400');
code = code.replace(/text-emerald-500/g, 'text-emerald-600 dark:text-emerald-400');
code = code.replace(/border-emerald-500/g, 'border-emerald-600 dark:border-emerald-500');

// Replace text-rose-400 -> text-rose-600 dark:text-rose-400
code = code.replace(/text-rose-400/g, 'text-rose-600 dark:text-rose-400');
code = code.replace(/text-rose-500/g, 'text-rose-600 dark:text-rose-400');

// Replace text-amber-400 and orange
code = code.replace(/text-amber-400/g, 'text-amber-600 dark:text-amber-400');
code = code.replace(/text-amber-500/g, 'text-amber-600 dark:text-amber-400');
code = code.replace(/text-orange-400/g, 'text-orange-600 dark:text-orange-400');
code = code.replace(/text-orange-500/g, 'text-orange-600 dark:text-orange-400');

// Replace text-indigo-400 -> text-indigo-600 dark:text-indigo-400
code = code.replace(/text-indigo-400/g, 'text-indigo-600 dark:text-indigo-400');
code = code.replace(/text-indigo-500/g, 'text-indigo-600 dark:text-indigo-400');

// 4. Heatmap list styling fix 
// Currently "card text-slate-900 dark:text-white..." it has background issues.
// Let's replace raw white/5 bg's
code = code.replace(/bg-white\/5/g, 'bg-slate-50 dark:bg-white/5');
code = code.replace(/border-white\/10/g, 'border-slate-200 dark:border-white/10');
code = code.replace(/border-white\/5/g, 'border-slate-200 dark:border-white/5');


// 5. Main page wrap
// Change <div className="p-8 space-y-8 animate-in fade-in duration-700 pb-24">
code = code.replace(
    '<div className="p-8 space-y-8 animate-in fade-in duration-700 pb-24">',
    '<div className="p-8 space-y-8 animate-in fade-in duration-700 pb-24 bg-slate-50 dark:bg-[#0f172a] min-h-screen">'
);

// 6. Fix "text-slate-900 dark:text-white" dupes just in case we did it twice
code = code.replace(/text-slate-900 dark:text-slate-900 dark:text-white/g, 'text-slate-900 dark:text-white');

// 7. Remove any "card" remnants if any
code = code.replace(/className="card /g, 'className="');

// Fix text colors for the active tab to be very soft and corporate
// Before: `bg-slate-900 dark:text-white text-indigo-600 ...`
// Make active tabs look professional: bg-white shadow text-slate-900
code = code.replace(/bg-slate-900 dark:text-white text-indigo-600 shadow-sm border-slate-200/g, 'bg-white text-slate-900 shadow-sm border-slate-200');

// Fix sticky bottom bar text visibility
code = code.replace(/bg-black\/60/g, 'bg-white/80 dark:bg-black/80 backdrop-blur-md border-t border-slate-200 dark:border-white/5');

fs.writeFileSync(file, code);
