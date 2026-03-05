const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/app/**/*.tsx');
let changed = 0;

files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');

    // Target 1: The long radial gradient strings
    let newContent = content.replace(/dark:bg-\[#020617\] dark:bg-\[radial-gradient\(ellipse_at_top,_var\(--tw-gradient-stops\)\)\] dark:from-slate-900\/40 dark:via-\[#020617\] dark:to-\[#020617\]/g, 'dark:bg-[#0f172a]');

    // Target 2: Light mode equivalent radial gradients (if any)
    newContent = newContent.replace(/bg-\[#020617\] bg-\[radial-gradient\(ellipse_at_top,_var\(--tw-gradient-stops\)\)\] from-slate-900\/40 via-\[#020617\] to-\[#020617\]/g, 'bg-[#0f172a]');

    // Target 3: Stray dark:bg-[#020617]
    newContent = newContent.replace(/dark:bg-\[#020617\]/g, 'dark:bg-[#0f172a]');

    // Target 4: Stray bg-[#020617] (specifically replacing the fixed "black")
    newContent = newContent.replace(/bg-\[#020617\]/g, 'bg-[#0f172a]');

    if (content !== newContent) {
        fs.writeFileSync(f, newContent);
        changed++;
        console.log('Fixed ' + f);
    }
});

console.log('Total files changed: ' + changed);
