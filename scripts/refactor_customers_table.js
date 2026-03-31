const fs = require('fs');
const file = 'src/app/(app)/customers/page.tsx';
let data = fs.readFileSync(file, 'utf8');

// 1. Table wrapper background and shadow update
data = data.replace(
    /className=\{\`mt-6 rounded-\[24px\] border flex flex-col overflow-hidden shadow-sm \$\{cardClass\}\`\}/,
    'className={`mt-6 rounded-[24px] border border-slate-200 dark:border-white/5 flex flex-col overflow-hidden shadow-sm bg-white dark:bg-[#0f172a]`}'
);

// 2. Thead replacement
data = data.replace(
    /<thead className="bg-transparent border-b">/,
    '<thead className="bg-slate-50 dark:bg-[#1e293b] text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest sticky top-0 z-20">'
);
data = data.replace(
    /<tr className=\{isLight \? 'border-slate-200' : 'border-slate-800'\}>/,
    '<tr>'
);

// 3. TH padding and borders replacement
data = data.replace(
    /<th className="w-\[48px\] px-6 text-center">/g,
    '<th className="px-5 py-4 font-bold border-b border-slate-200 dark:border-white/5 whitespace-nowrap w-[48px] text-center">'
);
data = data.replace(
    /<th className=\{\`h-\[48px\] px-4 text-\[11px\] uppercase tracking-wide font-semibold \$\{isLight \? 'text-slate-500' : 'text-slate-400'\}\`\}>(.*?)<\/th>/g,
    '<th className="px-5 py-4 font-bold border-b border-slate-200 dark:border-white/5 whitespace-nowrap">$1</th>'
);
data = data.replace(
    /<th className=\{\`h-\[48px\] px-6 text-right text-\[11px\] uppercase tracking-wide font-semibold \$\{isLight \? 'text-slate-500' : 'text-slate-400'\}\`\}>(.*?)<\/th>/g,
    '<th className="px-5 py-4 font-bold border-b border-slate-200 dark:border-white/5 whitespace-nowrap text-right">$1</th>'
);

// 4. TBody replacements
data = data.replace(
    /<tbody className=\{\`divide-y \$\{isLight \? 'divide-slate-100' : 'divide-slate-800\/50'\}\`\}>/,
    '<tbody className="divide-y divide-slate-100 dark:divide-white/5">'
);

data = data.replace(
    /<tr key=\{cust.id\} className=\{\`h-\[60px\] transition-colors \$\{isSelected \? \(isLight \? 'bg-blue-50\/30' : 'bg-blue-900\/10'\) : \(isLight \? 'hover:bg-slate-50' : 'hover:bg-slate-800\/50'\)\}\`\}>/g,
    '<tr key={cust.id} className={`h-[48px] transition-colors group ${isSelected ? "bg-slate-50 dark:bg-white/5" : "hover:bg-slate-50 dark:hover:bg-[#1e293b]/80"}`}>'
);

data = data.replace(
    /<td className="px-6 py-3 align-middle text-center">/g,
    '<td className="px-5 py-3 align-middle text-[12px] text-center font-semibold text-slate-600 dark:text-slate-400">'
);
data = data.replace(
    /<td className="px-4 py-3 align-middle">/g,
    '<td className="px-5 py-3 align-middle text-[12px] font-semibold text-slate-600 dark:text-slate-400">'
);
data = data.replace(
    /<td className="px-6 py-3 align-middle text-right flex gap-2 justify-end items-center h-full pt-4">/g,
    '<td className="px-5 py-3 align-middle text-[12px] font-semibold text-slate-600 dark:text-slate-400 text-right">'
);


// 5. Button styles (from large blue button to the generic staff small outline button)
data = data.replace(
    /<Link href=\{\`\/customers\/\$\{cust.id\}\`\} className=\{\`h-\[32px\] px-4 flex items-center justify-center rounded-full text-\[10px\] font-black uppercase tracking-widest transition-colors \$\{isLight \? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-600 text-white hover:bg-blue-500'\}\`\}>\s*Detay\s*<\/Link>/g,
    '<Link href={`/customers/${cust.id}`} className="px-4 py-1.5 h-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 rounded-[6px] font-bold text-[11px] flex items-center justify-center transition-all whitespace-nowrap shadow-sm">Detay</Link>'
);


fs.writeFileSync(file, data);
console.log('Customer table layout refactored.');
