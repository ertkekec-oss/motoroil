const fs = require('fs');
const path = require('path');

const directoriesToWalk = [
    'src/app/(app)/settings',
    'src/components'
];

function processFile(filePath) {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;

    let original = fs.readFileSync(filePath, 'utf8');
    let content = original;

    // Fix the double dark:bg- problem caused by aggressive string replacements
    content = content.replace(/dark:bg-slate-900 dark:bg-white/g, 'dark:bg-[#0f172a]');
    content = content.replace(/dark:bg-white dark:bg-slate-900/g, 'dark:bg-[#0f172a]');
    content = content.replace(/dark:bg-slate-800 dark:bg-white/g, 'dark:bg-[#1e293b]');

    // Check if there are bg-white dark:bg-[#0f172a] doing the same double stuff:
    content = content.replace(/dark:bg-\[\#0B1220\] dark:bg-\[\#0f172a\]/g, 'dark:bg-[#0f172a]');

    if (content !== original) {
        fs.writeFileSync(filePath, content);
        console.log('Fixed double dark bg', filePath);
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
                console.log("Done fixing double drak classes");
            }
        });
    });
}
runAll();
