const fs = require('fs');

const file = 'src/components/AccountPlanContent.tsx';
let txt = fs.readFileSync(file, 'utf8');

// Header formatting
txt = txt.replace(/bg-gradient-to-r from-blue-400 to-purple-400/g, 'bg-clip-text text-transparent');
txt = txt.replace(/<h2 className="([^"]+)">/g, '<h2 className="text-[24px] font-bold text-slate-900 dark:text-white">');

// Table Headers and Row Heights
txt = txt.replace(/<thead([^>]*)>/g, '<thead className="bg-[#F6F8FB] dark:bg-[#0F172A] border-b border-slate-200 dark:border-slate-800 font-bold sticky top-0 z-10">');
txt = txt.replace(/<tr className="bg-slate-50 dark:bg-slate-800\/50 text-sm font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">/g, '<tr>');
txt = txt.replace(/<th className="([^"]+)">/g, (m, c) => {
    if (!c.includes('p-4')) return m;
    return `<th className="p-4 tracking-wider uppercase text-[12px] font-semibold text-slate-500 dark:text-slate-400 ${c.includes('text-right') ? 'text-right' : 'text-left'}">`;
});

// rows
txt = txt.replace(/<tr\s+key=\{acc\.id\}\s+className=\{`([\s\S]*?)`\}\s+>/g, (m, c) => {
    return `<tr key={acc.id} className={\`h-[52px] border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors \${isMain ? 'bg-slate-50/50 dark:bg-slate-800/20' : ''}\`}>`;
});

// Remove old inline styling and add vertical line logic
txt = txt.replace(/<span style=\{\{ marginLeft: `\$\{depth \* 20\}px` \}\}>/g, '<span style={{ marginLeft: `${depth * 20}px` }} className="relative flex items-center">');
txt = txt.replace(/\{isMain \? '' : '└─ '\}/g, "{isMain ? '' : <span className='absolute -left-3 top-[-10px] w-2 h-4 border-l border-b border-slate-300 dark:border-slate-700 rounded-bl'></span>}");

// Modals
txt = txt.replace(/bg-\[\#1a1a2e\]/g, 'bg-white dark:bg-[#0f172a]');
txt = txt.replace(/p-6/g, 'p-8');
txt = txt.replace(/bg-black\/30/g, 'bg-white dark:bg-[#1e293b]');

// Text colors inside rows
txt = txt.replace(/<td className="p-4(.*?)"/g, '<td className="px-4 py-2 font-semibold text-[13px]$1"');
txt = txt.replace(/text-rose-300/g, 'text-rose-600 dark:text-rose-400');
txt = txt.replace(/text-blue-300|text-blue-400/g, 'text-blue-600 dark:text-blue-400');
txt = txt.replace(/text-slate-900 dark:text-white/g, 'text-slate-900 dark:text-white'); // ensure neutral colors for normal text

fs.writeFileSync(file, txt, 'utf8');
console.log('AccountPlanContent table refactored.');
