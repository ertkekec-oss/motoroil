const fs = require('fs');
const file = 'c:/Users/ertke/OneDrive/Masaüstü/periodya/muhasebeapp/motoroil/src/app/(app)/service/new/NewWorkOrderClient.tsx';
let c = fs.readFileSync(file, 'utf8');

// Replace top bar structure
c = c.replace(/<div className="flex-1 p-4 sm:p-6 lg:p-10 max-w-\[1000px\] mx-auto w-full">/g, 
            '<div className="flex-1 p-4 sm:p-6 lg:p-10 max-w-[1200px] mx-auto w-full">');

// We want to make the wrapper less bordered-box and more of a soft area.
// Just remove the `bg-white border` from the main wrapper and put it on the sub-items, OR keep `p-6` but remove the excessive white space above/below.
// Actually, `bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[20px] sm:rounded-[24px] shadow-sm p-4 sm:p-8` is okay but let's make it `p-6 sm:p-10`.
c = c.replace(/<div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white\/10 rounded-\[20px\] sm:rounded-\[24px\] shadow-sm p-4 sm:p-8">/g, 
            '<div className="bg-transparent space-y-8">');

c = c.replace(/<div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">/g,
            '<div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">\n<div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[24px] shadow-sm p-6 sm:p-8">');


c = c.replace(/<div className="pt-6 sm:pt-8 border-t border-slate-200 dark:border-white\/10 flex justify-between items-center bg-transparent">/g,
            '</div>\n<div className="pt-6 sm:pt-4 flex justify-between items-center bg-transparent">');

fs.writeFileSync(file, c, 'utf8');
