const fs = require('fs');
const file = 'src/app/(app)/customers/[id]/CustomerDetailClient.tsx';
let data = fs.readFileSync(file, 'utf8');

// 1. Move Dengeli Bakiyesi to the far right, on the SAME row as buttons.
// The container right now is at line 884: `<div className="flex flex-col md:items-end gap-3 flex-1 w-full md:w-auto">`
// Let's replace the flex-col with flex-row and reverse the order of the two child divs (Metrics and Quick Actions) using absolute string replace.

const rightSectionRegex = /\{\/\* Right: Compact Metrics & Actions \*\/\}\s*<div className="flex flex-col md:items-end gap-3 flex-1 w-full md:w-auto">\s*\{\/\* Metrics \*\/\}\s*(<div className="flex flex-wrap items-center gap-3">[\s\S]*?<\/div>\s*)\s*\{\/\* Quick Actions \*\/\}\s*(<div className="flex flex-wrap items-center gap-2">[\s\S]*?<\/div>\s*)\s*<\/div>/;

data = data.replace(
    /\{\/\* Right: Compact Metrics & Actions \*\/\}\s*<div className="flex flex-col md:items-end gap-3 flex-1 w-full md:w-auto">\s*\{\/\* Metrics \*\/\}\s*(<div className="flex flex-wrap items-center gap-3">[\s\S]*?<\/div>\s*)\s*\{\/\* Quick Actions \*\/\}\s*(<div className="flex flex-wrap items-center gap-2">[\s\S]*?<\/button>\s*<\/div>\s*)\s*<\/div>/,
    `{/* Right: Compact Metrics & Actions */}
                    <div className="flex flex-wrap items-center justify-end gap-4 flex-1 w-full md:w-auto mt-4 xl:mt-0 xl:ml-auto">
                        {/* Quick Actions */}
                        $2
                        {/* Metrics */}
                        $1
                    </div>`
);

// 2. Fix empty states in "Teklifler", "Mutabakatlar", "Garantiler", "Evraklar & Vadeler" to use the EXACT standard table `colSpan` empty states!
// Actually, it's easier to rip out the empty state divs and put them INSIDE the tbody.
// Taksitler (line 1482): 
// `{!customer.paymentPlans || customer.paymentPlans.length === 0 ? ( <div...> ... </div> ) : ( <table...> )}`

// Mutabakatlar
const emptyMutabakatRegex = /\{\(!customer\.reconciliations \|\| customer\.reconciliations\.length === 0\) \? \([\s\S]*?Mevcut İşlemleri Gör[\s\S]*?<\/button>\s*<\/div>\s*\) : \(\s*<div className="overflow-auto max-h-\[calc\(100vh-270px\)\] custom-scroll bg-white dark:bg-\[#0f172a\] border border-slate-200 dark:border-white\/5 rounded-\[20px\] shadow-sm flex flex-col mb-4">\s*<table className="w-full text-left border-collapse">\s*<thead>\s*(<tr[\s\S]*?<\/tr>)\s*<\/thead>\s*<tbody>/;
data = data.replace(emptyMutabakatRegex, 
    `<div className="overflow-auto max-h-[calc(100vh-270px)] custom-scroll bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] shadow-sm flex flex-col mb-4">
        <table className="w-full text-left border-collapse">
            <thead>
                $1
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {(!customer.reconciliations || customer.reconciliations.length === 0) ? (
                    <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-500 dark:text-slate-400 font-semibold text-[14px]">Bu cariyle henüz mutabakat yapılmamış.</td></tr>
                ) : (`
);
// Fix the closing tags for mutabakat
data = data.replace(/<\/tbody>\s*<\/table>\s*<\/div>\s*\)\}\s*<\/div>\s*\) : \(\s*<div className="overflow-auto/g, `</tbody></table></div></div>) : ( <div className="overflow-auto`);
// wait we need a more surgical replace for closing `)}` of the map. I'll just leave string replacing for complex ternary logic to a custom robust replacer or do it in multiple steps.

fs.writeFileSync(file, data);
console.log('Phase 1 applied');
