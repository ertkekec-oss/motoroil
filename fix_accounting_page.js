const fs = require('fs');
let c = fs.readFileSync('src/app/(app)/accounting/page.tsx', 'utf8');

c = c.replace(/text-\\[28px\\]/g, 'text-[18px] md:text-[22px] truncate max-w-[120px] md:max-w-full');
// Oval tab buttons:
c = c.replace(/className={\`h-\\[38px\\] px-5 rounded-xl/g, 'className={`h-[38px] px-5 rounded-full');
// Oval buttons for "TAHSİLAT EKLE" etc:
c = c.replace(/text-white rounded-xl font-black/g, 'text-white rounded-full font-black');
// Oval buttons with borders:
c = c.replace(/rounded-xl font-black text-\\[10px\\] uppercase tracking-widest/g, 'rounded-full font-black text-[10px] uppercase tracking-widest');

// Remove header
const headerRegex = /{\/\* Header \*\/}[\s\S]*?<TopPills/;
const newHeader = `<div className="w-full flex justify-end mb-4">
    <button onClick={refreshData} className="px-5 py-2.5 bg-white dark:bg-[#1e293b]/50 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-full text-[11px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-2">
        <RefreshCw className={\`w-3.5 h-3.5 \${isInitialLoading ? 'animate-spin' : ''}\`} /> YENİLE
    </button>
</div>
<TopPills`;

c = c.replace(headerRegex, newHeader);

fs.writeFileSync('src/app/(app)/accounting/page.tsx', c);
console.log('Accounting adjustments complete');
