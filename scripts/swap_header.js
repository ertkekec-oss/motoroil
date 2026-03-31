const fs = require('fs');
const file = 'src/app/(app)/customers/[id]/CustomerDetailClient.tsx';
let data = fs.readFileSync(file, 'utf8');

const regex = /\{\/\* Right: Compact Metrics & Actions \*\/\}[\s\S]*?\{\/\* GROUPED NAVIGATION & FILTERS \*\/\}/;
let headerBlockMatch = data.match(regex);

if (headerBlockMatch) {
    let block = headerBlockMatch[0];
    const actionsRegex = /\{\/\* Quick Actions \*\/\}[\s\S]*?(?=\{\/\* Metrics \*\/\})/;
    const metricsRegex = /\{\/\* Metrics \*\/\}[\s\S]*?(?=<\/div>\s*<\/div>\s*\{\/\* GROUPED NAVIGATION & FILTERS \*\/\})/;
    
    let aMatch = block.match(actionsRegex);
    let mMatch = block.match(metricsRegex);
    
    if (aMatch && mMatch) {
        let actions = aMatch[0];
        let metrics = mMatch[0];
        
        let newActions = actions.replace('📄 Özet Ekstre\n                            </button>', '📄 Özet Ekstre\n                            </button>\n                            <button\n                                onClick={() => { setStatementType(\'detailed\'); setStatementOpen(true); }}\n                                className="h-[36px] px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 rounded-[8px] font-bold text-[12px] flex items-center justify-center gap-1.5 transition-colors shadow-sm hidden lg:flex"\n                            >\n                                📑 Detaylı Ekstre\n                            </button>');

        let newBlock = '{/* Right: Compact Metrics & Actions */}\n                    <div className="flex flex-col items-end gap-3 flex-1">\n                        \n                        ' + metrics + '\n                        ' + newActions + '                    </div>\n                </div>\n\n                {/* GROUPED NAVIGATION & FILTERS */}';
        
        data = data.replace(headerBlockMatch[0], newBlock);
    }
}

// 2. Adjust search box to the right. 
const searchMatch = data.match(/<div className="flex items-center gap-2">\s*<div className="relative w-full lg:w-\[260px\]">/);
if (searchMatch) {
    data = data.replace(searchMatch[0], '<div className="flex items-center gap-2 w-full lg:w-max justify-end">\n                        <div className="relative w-full lg:w-[260px]">');
}

fs.writeFileSync(file, data);
console.log('Done swap');
