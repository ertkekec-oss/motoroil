const fs = require('fs');
const path = require('path');

const directoriesToWalk = [
    'src/app/(app)/settings',
    'src/components'
];

function processFile(filePath) {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
    // only process IntegrationsContent if in components
    if (filePath.includes('src\\components\\') && !filePath.includes('IntegrationsContent.tsx')) return;
    if (filePath.includes('src/components/') && !filePath.includes('IntegrationsContent.tsx')) return;

    let original = fs.readFileSync(filePath, 'utf8');
    let content = original;

    // 1. Fix Layout max-widths
    content = content.replace(/max-w-[34567]xl\b(?!\s*mx-auto)/g, 'max-w-5xl mx-auto w-full');
    content = content.replace(/max-w-[34567]xl mx-auto/g, 'max-w-5xl mx-auto w-full');

    // 2. Fix Input backgrounds so they contrast with cards
    content = content.replace(/dark:bg-\[\#0f172a\]\s+border/g, 'dark:bg-[#020617]/60 border');
    content = content.replace(/dark:bg-\[\#0f172a\]\s+border/g, 'dark:bg-[#020617]/60 border');

    // 3. Fix input borders
    content = content.replace(/dark:border-white\/10\s+rounded-lg/g, 'dark:border-white/20 rounded-lg');

    // 4. Fix input disabled text and borders for dark mode
    content = content.replace(/disabled:text-slate-500 disabled:border-slate-200/g, 'disabled:text-slate-500 dark:disabled:text-slate-400 disabled:border-slate-200 dark:disabled:border-white/10');

    // 5. IntegrationsContent.tsx Specific Global Fixes
    if (filePath.includes('IntegrationsContent.tsx')) {
        content = content.replace(/bg-\[\#F8FAFC\]/g, 'bg-slate-50 dark:bg-transparent');
        // Add generic dark mode classes where missing
        content = content.replace(/(?<!:)bg-white(?!\/| dark:)/g, 'bg-white dark:bg-[#0B1220]');
        content = content.replace(/(?<!:)bg-slate-50(?!\/| dark:)/g, 'bg-slate-50 dark:bg-[#1e293b]');
        content = content.replace(/(?<!:)border-slate-300(?! dark:)/g, 'border-slate-300 dark:border-white/10');
        content = content.replace(/(?<!:)border-slate-200(?! dark:)/g, 'border-slate-200 dark:border-white/5');
        content = content.replace(/(?<!:)border-slate-100(?! dark:)/g, 'border-slate-100 dark:border-white/5');
        content = content.replace(/(?<!:)text-slate-900(?! dark:)/g, 'text-slate-900 dark:text-white');
        content = content.replace(/(?<!:)text-slate-800(?! dark:)/g, 'text-slate-800 dark:text-slate-100');
        content = content.replace(/(?<!:)text-slate-700(?! dark:)/g, 'text-slate-700 dark:text-slate-200');
        content = content.replace(/(?<!:)text-slate-600(?! dark:)/g, 'text-slate-600 dark:text-slate-300');
        content = content.replace(/(?<!:)text-slate-500(?! dark:)/g, 'text-slate-500 dark:text-slate-400');
        content = content.replace(/(?<!:)text-slate-400(?! dark:)/g, 'text-slate-400 dark:text-slate-500');
        content = content.replace(/bg-slate-900(?! dark:)/g, 'bg-slate-900 dark:bg-white');
        content = content.replace(/dark:bg-white border border-slate-900 rounded-lg text-white(?! dark:)/g, 'dark:bg-white border border-slate-900 dark:border-white rounded-lg text-white dark:text-slate-900');
    }

    if (content !== original) {
        fs.writeFileSync(filePath, content);
        console.log('Fixed', filePath);
    }
}

function walk(dir, done) {
    let results = [];
    fs.readdir(dir, function (err, list) {
        if (err) return done(err);
        let pending = list.length;
        if (!pending) return done(null, results);
        list.forEach(function (file) {
            file = path.resolve(dir, file);
            fs.stat(file, function (err, stat) {
                if (stat && stat.isDirectory()) {
                    walk(file, function (err, res) {
                        results = results.concat(res);
                        if (!--pending) done(null, results);
                    });
                } else {
                    results.push(file);
                    if (!--pending) done(null, results);
                }
            });
        });
    });
}

function runAll() {
    let count = directoriesToWalk.length;
    let allFiles = [];
    directoriesToWalk.forEach(dir => {
        walk(dir, (err, res) => {
            if (!err && res) {
                allFiles = allFiles.concat(res);
            }
            if (--count === 0) {
                allFiles.forEach(processFile);
                console.log("Done layout fixes");
            }
        });
    });
}

runAll();
