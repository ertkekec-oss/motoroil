const fs = require('fs');
const path = require('path');

const directoriesToWalk = [
    'src/app/(app)/settings',
    'src/components'
];

function processFile(filePath) {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
    if (filePath.includes('src\\components\\') && !filePath.includes('IntegrationsContent.tsx')) return;
    if (filePath.includes('src/components/') && !filePath.includes('IntegrationsContent.tsx')) return;

    let original = fs.readFileSync(filePath, 'utf8');
    let content = original;

    // Remove double w-full
    content = content.replace(/w-full w-full/g, 'w-full');
    content = content.replace(/mx-auto w-full animate-in/g, 'mx-auto w-full animate-in');

    // Restore ERPBlock to solid card color #0f172a
    content = content.replace(/function ERPBlock.*?(return\s*\(\s*<div\s+className="[^"]*)dark:bg-\[\#020617\]\/60([^"]*")/gs, (match, prefix, suffix) => {
        return `function ERPBlock` + match.substring(17).replace(/dark:bg-\[\#020617\]\/60/g, 'dark:bg-[#0f172a]');
    });

    // Make inputs dark:bg-[#020617] (pure dark) so they look indented inside the #0f172a block
    content = content.replace(/function ERPInput.*?(return\s*\(\s*<input\s*\{...props\}\s*className="[^"]*)dark:bg-\[\#020617\]\/60([^"]*")/gs, (match, prefix, suffix) => {
        return `function ERPInput` + match.substring(17).replace(/dark:bg-\[\#020617\]\/60/g, 'dark:bg-[#020617]');
    });

    // Same for Textarea and Select
    content = content.replace(/function ERPTextarea.*?(return\s*\(\s*<textarea\s*\{...props\}\s*className="[^"]*)dark:bg-\[\#020617\]\/60([^"]*")/gs, (match, prefix, suffix) => {
        return `function ERPTextarea` + match.substring(19).replace(/dark:bg-\[\#020617\]\/60/g, 'dark:bg-[#020617]');
    });
    content = content.replace(/function ERPSelect.*?(return\s*\(\s*<select\s*\{...props\}\s*className="[^"]*)dark:bg-\[\#020617\]\/60([^"]*")/gs, (match, prefix, suffix) => {
        return `function ERPSelect` + match.substring(18).replace(/dark:bg-\[\#020617\]\/60/g, 'dark:bg-[#020617]');
    });

    // But wait... what if my previous replace affected OTHER blocks ?
    // "className="bg-white dark:bg-[#020617]/60 border"
    content = content.replace(/dark:bg-\[\#020617\]\/60/g, 'dark:bg-[#0f172a]'); // fallback to restore others

    // In IntegrationsContent, ensure inputs are #020617 and blocks are #0f172a
    if (filePath.includes('IntegrationsContent.tsx')) {
        // Blocks: bg-white dark:bg-[#0B1220] => dark:bg-[#0f172a]
        // Inputs: bg-white dark:bg-[#0B1220] => dark:bg-[#020617]
        content = content.replace(/function ERPBlock.*?(return\s*\(\s*<div\s+className="[^"]*)dark:bg-\[\#0B1220\]([^"]*")/gs, (match, prefix, suffix) => {
            return `function ERPBlock` + match.substring(17).replace(/dark:bg-\[\#0B1220\]/g, 'dark:bg-[#0f172a]');
        });
        content = content.replace(/function ERPInput.*?(return\s*\(\s*<input\s*\{...props\}\s*className="[^"]*)dark:bg-\[\#0B1220\]([^"]*")/gs, (match, prefix, suffix) => {
            return `function ERPInput` + match.substring(17).replace(/dark:bg-\[\#0B1220\]/g, 'dark:bg-[#020617]');
        });
        content = content.replace(/function ERPSelect.*?(return\s*\(\s*<select\s*\{...props\}\s*className="[^"]*)dark:bg-\[\#0B1220\]([^"]*")/gs, (match, prefix, suffix) => {
            return `function ERPSelect` + match.substring(18).replace(/dark:bg-\[\#0B1220\]/g, 'dark:bg-[#020617]');
        });
        content = content.replace(/function ERPTextarea.*?(return\s*\(\s*<textarea\s*\{...props\}\s*className="[^"]*)dark:bg-\[\#0B1220\]([^"]*")/gs, (match, prefix, suffix) => {
            return `function ERPTextarea` + match.substring(19).replace(/dark:bg-\[\#0B1220\]/g, 'dark:bg-[#020617]');
        });

        // Ensure disabled inputs have correct border
        content = content.replace(/disabled:text-slate-500 disabled:border-slate-200/g, 'disabled:text-slate-500 dark:disabled:text-slate-400 disabled:border-slate-200 dark:disabled:border-white/10');
    }

    if (content !== original) {
        fs.writeFileSync(filePath, content);
        console.log('Restored/Fixed', filePath);
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

let count = directoriesToWalk.length;
let allFiles = [];
directoriesToWalk.forEach(dir => {
    walk(dir, (err, res) => {
        if (!err && res) {
            allFiles = allFiles.concat(res);
        }
        if (--count === 0) {
            allFiles.forEach(processFile);
            console.log("Done fixing input and block colors");
        }
    });
});
