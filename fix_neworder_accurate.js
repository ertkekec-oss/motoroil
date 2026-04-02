const fs = require('fs');
const file = 'c:/Users/ertke/OneDrive/Masaüstü/periodya/muhasebeapp/motoroil/src/app/(app)/service/new/NewWorkOrderClient.tsx';
let c = fs.readFileSync(file, 'utf8');

c = c.replace(
    '<div className="flex-1 p-4 sm:p-6 lg:p-10 max-w-[1000px] mx-auto w-full">',
    '<div className="flex-1 p-4 sm:p-6 lg:p-10 max-w-[1400px] mx-auto w-full space-y-8">'
);

c = c.replace(
    '<div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[20px] sm:rounded-[24px] shadow-sm p-4 sm:p-8">',
    '<div>'
);

// Close out the `<div>` replacement. Actually instead of diving in blind, let's target the exact blocks.
c = c.replace(
    '{step === 1 && (',
    '{step === 1 && (<div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[24px] shadow-sm p-6 sm:p-10">'
);

c = c.replace(
    '{step === 2 && (',
    '{step === 2 && (<div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[24px] shadow-sm p-6 sm:p-10">'
);

// We added opening divs, we need to add closing divs. 
// Step 1 finishes before `step === 2`.
// Instead of regex, if I just do `c = c.replace(')}', '</div>)}');`, it might be wrong.
// Better: just replace the `pt-6 sm:pt-8 border-t...` block which belongs to the second half of step 1!
c = c.replace(
    '<div className="pt-6 sm:pt-8 border-t border-slate-200 dark:border-white/10">',
    '</div><div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[24px] shadow-sm p-6 sm:p-10 mt-8">'
);

fs.writeFileSync(file, c, 'utf8');
