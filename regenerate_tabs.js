const fs = require('fs');

let code = fs.readFileSync('original_tabs.tsx', 'utf8');

const replaceClasses = (classes) => {
    let replaced = classes;
    replaced = replaced.replace(/card glass/g, "rounded-[20px] bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none");
    replaced = replaced.replace(/bg-white\/\[0\.02\]/g, "bg-slate-50 dark:bg-[#1e293b] border-slate-200 dark:border-slate-700");
    replaced = replaced.replace(/bg-white\/5/g, "bg-slate-100 dark:bg-slate-800/50");
    replaced = replaced.replace(/bg-white\/10/g, "bg-slate-200 dark:bg-slate-700/50");
    replaced = replaced.replace(/border-white\/5/g, "border-slate-200 dark:border-slate-800");
    replaced = replaced.replace(/border-white\/10/g, "border-slate-200 dark:border-slate-800");
    replaced = replaced.replace(/text-white\/40/g, "text-slate-500 dark:text-slate-400");
    replaced = replaced.replace(/text-white\/30/g, "text-slate-500 dark:text-slate-400");
    replaced = replaced.replace(/text-white\/60/g, "text-slate-500 dark:text-slate-400");
    replaced = replaced.replace(/text-white\/70/g, "text-slate-500 dark:text-slate-400");
    replaced = replaced.replace(/text-white\/80/g, "text-slate-900 dark:text-slate-100");
    replaced = replaced.replace(/text-white(?! \?\!)/g, "text-slate-900 dark:text-slate-100");
    replaced = replaced.replace(/bg-primary\/20/g, "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30");
    replaced = replaced.replace(/bg-primary(?![\/\w])/g, "bg-blue-600 outline-none text-white hover:bg-blue-700 dark:hover:bg-blue-500");
    replaced = replaced.replace(/border-primary/g, "border-blue-600 dark:border-blue-500");
    replaced = replaced.replace(/shadow-primary/g, "shadow-blue-500");
    replaced = replaced.replace(/text-primary/g, "text-blue-700 dark:text-blue-400");
    replaced = replaced.replace(/bg-\[#0f111a\]/g, "bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800");
    replaced = replaced.replace(/border-emerald-500/g, "border-emerald-500 dark:border-emerald-400");
    replaced = replaced.replace(/bg-black\/80/g, "bg-black/60 backdrop-blur-sm");
    replaced = replaced.replace(/zoom-in/g, "");
    return replaced;
};

code = code.replace(/className="([^"]+)"/g, (match, classes) => {
    return `className="${replaceClasses(classes)}"`;
});

code = code.replace(/className={\`([^\`]+)\`}/g, (match, classes) => {
    return `className={\`${replaceClasses(classes)}\`}`;
});

fs.writeFileSync('enterprise_tabs.tsx', code);
console.log('enterprise_tabs.tsx regenerated with Tailwind dark variants');
