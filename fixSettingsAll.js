const fs = require('fs');
const path = require('path');

const targetDir = 'src/app/(app)/settings';

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
                    if (file.endsWith('.tsx')) {
                        results.push(file);
                    }
                    if (!--pending) done(null, results);
                }
            });
        });
    });
}

function processFile(filePath) {
    let original = fs.readFileSync(filePath, 'utf8');
    let content = original;

    // ROOT Background fixes
    content = content.replace(
        /className="fixed inset-0 -z-10 bg-slate-50 dark:bg-\[\#0B1220\]"/g,
        'className="fixed inset-0 -z-10 bg-slate-50 dark:bg-[#020617] dark:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] dark:from-slate-900/40 dark:via-[#020617] dark:to-[#020617]"'
    );
    content = content.replace(
        /bg-white dark:bg-\[\#0F172A\]/gi,
        'bg-white dark:bg-[#0f172a]'
    );
    // Remove conflicting darks
    content = content.replace(/dark:bg-slate-900\/50/g, 'dark:bg-[#0f172a]');
    content = content.replace(/dark:bg-slate-800\/80/g, 'dark:bg-[#0f172a]');

    // General Backgrounds
    content = content.replace(/(?<!:)bg-white(?!\/| dark:)/g, 'bg-white dark:bg-[#0f172a]');
    content = content.replace(/(?<!:)bg-slate-50(?!\/| dark:)/g, 'bg-slate-50 dark:bg-[#1e293b]');

    // Inputs inside panels, maybe specific bg
    content = content.replace(/disabled:bg-slate-50(?! dark:)/g, 'disabled:bg-slate-50 dark:disabled:bg-slate-800');

    // Borders
    content = content.replace(/(?<!:)border-slate-300(?! dark:)/g, 'border-slate-300 dark:border-white/10');
    content = content.replace(/(?<!:)border-slate-200(?! dark:)/g, 'border-slate-200 dark:border-white/5');
    content = content.replace(/(?<!:)border-slate-100(?! dark:)/g, 'border-slate-100 dark:border-white/5');

    // Texts
    content = content.replace(/(?<!:)text-slate-900(?! dark:)/g, 'text-slate-900 dark:text-white');
    content = content.replace(/(?<!:)text-slate-800(?! dark:)/g, 'text-slate-800 dark:text-slate-100');
    content = content.replace(/(?<!:)text-slate-700(?! dark:)/g, 'text-slate-700 dark:text-slate-200');
    content = content.replace(/(?<!:)text-slate-600(?! dark:)/g, 'text-slate-600 dark:text-slate-300');
    content = content.replace(/(?<!:)text-slate-500(?! dark:)/g, 'text-slate-500 dark:text-slate-400');
    content = content.replace(/(?<!:)text-slate-400(?! dark:)/g, 'text-slate-400 dark:text-slate-500');

    // Focus rings
    content = content.replace(/focus:ring-slate-900(?! dark:)/g, 'focus:ring-slate-900 dark:focus:ring-white/20');
    content = content.replace(/focus:border-slate-900(?! dark:)/g, 'focus:border-slate-900 dark:focus:border-white/30');

    // Button specific bg
    content = content.replace(/bg-slate-900(?! dark:)/g, 'bg-slate-900 dark:bg-white');

    if (content !== original) {
        fs.writeFileSync(filePath, content);
        console.log('Fixed', filePath);
    }
}

walk(targetDir, function (err, results) {
    if (err) throw err;
    results.forEach(processFile);
});
