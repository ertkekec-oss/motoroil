const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/app/(app)/reports/**/*.tsx');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let o = content;

    content = content.replace(/min-h-screen\s+bg-slate-50/g, (match) => {
        if (content.includes('dark:bg-[radial-gradient')) return match; // avoid double
        return 'min-h-screen bg-slate-50 dark:bg-[#020617] dark:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] dark:from-slate-900/40 dark:via-[#020617] dark:to-[#020617]';
    });

    content = content.replace(/bg-gradient-to-br from-indigo-50 to-white/g, 'bg-gradient-to-br from-indigo-50 to-white dark:from-[#0f172a] dark:to-[#0f172a]');

    if (content !== o) {
        fs.writeFileSync(file, content);
        console.log('Fixed:', file);
    }
});
