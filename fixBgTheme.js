const fs = require('fs');
const glob = require('glob');

const dirs = [
    'src/app/(app)/hub/finance/**/*.tsx',
    'src/app/(app)/hub/earnings/**/*.tsx',
    'src/app/(app)/hub/payouts/**/*.tsx',
    'src/app/(app)/hub/payments/**/*.tsx',
    'src/app/(app)/hub/billing/**/*.tsx',
    'src/app/(app)/seller/boost/**/*.tsx',
    'src/app/(app)/hub/trust-score/**/*.tsx'
];

let files = [];
dirs.forEach(pattern => {
    files = files.concat(glob.sync(pattern));
});

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');

    // Make minimal, reliable replacements
    content = content.replace(/className=\"([^\"]*)bg-slate-50 min-h-screen([^\"]*)\"/g, 'className=\"$1bg-slate-50 min-h-screen dark:bg-[#020617] dark:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] dark:from-slate-900/40 dark:via-[#020617] dark:to-[#020617]$2\"');

    // Cards & Boxes that usually are white
    content = content.replace(/className=\"([^\"]*)bg-white([^\"]*)\"/g, (m, p1, p2) => {
        if (m.includes('dark:bg-')) return m;
        return `className="${p1}bg-white dark:bg-[#0f172a]${p2}"`;
    });

    // Cards & Boxes that usually are slate-50 (e.g. inner gray boxes)
    content = content.replace(/className=\"([^\"]*)bg-slate-50([^\"]*)\"/g, (m, p1, p2) => {
        if (m.includes('dark:bg-')) return m;
        return `className="${p1}bg-slate-50 dark:bg-[#1e293b]${p2}"`;
    });

    content = content.replace(/className=\"([^\"]*)border-slate-200([^\"]*)\"/g, (m, p1, p2) => {
        if (m.includes('dark:border-')) return m;
        return `className="${p1}border-slate-200 dark:border-white/5${p2}"`;
    });

    content = content.replace(/className=\"([^\"]*)text-slate-900([^\"]*)\"/g, (m, p1, p2) => {
        if (m.includes('dark:text-')) return m;
        return `className="${p1}text-slate-900 dark:text-white${p2}"`;
    });

    content = content.replace(/className=\"([^\"]*)text-slate-600([^\"]*)\"/g, (m, p1, p2) => {
        if (m.includes('dark:text-')) return m;
        return `className="${p1}text-slate-600 dark:text-slate-400${p2}"`;
    });

    content = content.replace(/className=\"([^\"]*)text-slate-500([^\"]*)\"/g, (m, p1, p2) => {
        if (m.includes('dark:text-')) return m;
        return `className="${p1}text-slate-500 dark:text-slate-400${p2}"`;
    });

    // Write back
    fs.writeFileSync(file, content);
    console.log('Fixed themes on: ' + file);
});
