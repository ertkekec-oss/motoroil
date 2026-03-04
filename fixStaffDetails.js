const fs = require('fs');
const glob = require('glob');

const dirs = [
    'src/components/StaffManagementContent.tsx'
];

let filesToProcess = [];
dirs.forEach(pattern => {
    filesToProcess = filesToProcess.concat(glob.sync(pattern));
});

console.log('Found ' + filesToProcess.length + ' files to process for StaffManagementContent.');

filesToProcess.forEach(file => {
    if (!fs.existsSync(file)) return;

    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // 1. Container background (main layout wrappers)
    // The previous regex might have missed some

    // 2. White cards (bg-white -> dark:bg-[#0f172a])
    content = content.replace(/className=\"([^\"]*)bg-white([^\"]*)\"/g, (m, p1, p2) => {
        if (m.includes('dark:bg-')) return m;
        return `className=\"${p1}bg-white dark:bg-[#0f172a]${p2}\"`;
    });

    // 3. Gray cards / headers (bg-slate-50 -> dark:bg-[#1e293b])
    content = content.replace(/className=\"([^\"]*)bg-slate-50([^\"]*)\"/g, (m, p1, p2) => {
        if (m.includes('dark:bg-') || m.includes('min-h-screen')) return m;
        return `className=\"${p1}bg-slate-50 dark:bg-[#1e293b]${p2}\"`;
    });
    content = content.replace(/className=\"([^\"]*)bg-slate-100([^\"]*)\"/g, (m, p1, p2) => {
        if (m.includes('dark:bg-')) return m;
        return `className=\"${p1}bg-slate-100 dark:bg-[#334155]/50${p2}\"`;
    });

    // 4. Borders (border-slate-X -> dark:border-white/5)
    content = content.replace(/className=\"([^\"]*)border-slate-200([^\"]*)\"/g, (m, p1, p2) => {
        if (m.includes('dark:border-')) return m;
        return `className=\"${p1}border-slate-200 dark:border-white/5${p2}\"`;
    });
    content = content.replace(/className=\"([^\"]*)border-slate-100([^\"]*)\"/g, (m, p1, p2) => {
        if (m.includes('dark:border-')) return m;
        return `className=\"${p1}border-slate-100 dark:border-white/5${p2}\"`;
    });
    content = content.replace(/className=\"([^\"]*)border-slate-300([^\"]*)\"/g, (m, p1, p2) => {
        if (m.includes('dark:border-')) return m;
        return `className=\"${p1}border-slate-300 dark:border-white/10${p2}\"`;
    });


    // 5. Texts (text-slate-X -> dark:text-white / dark:text-slate-300)
    content = content.replace(/className=\"([^\"]*)text-slate-900([^\"]*)\"/g, (m, p1, p2) => {
        if (m.includes('dark:text-')) return m;
        return `className=\"${p1}text-slate-900 dark:text-white${p2}\"`;
    });
    content = content.replace(/className=\"([^\"]*)text-slate-800([^\"]*)\"/g, (m, p1, p2) => {
        if (m.includes('dark:text-')) return m;
        return `className=\"${p1}text-slate-800 dark:text-slate-200${p2}\"`;
    });
    content = content.replace(/className=\"([^\"]*)text-slate-700([^\"]*)\"/g, (m, p1, p2) => {
        if (m.includes('dark:text-')) return m;
        return `className=\"${p1}text-slate-700 dark:text-slate-300${p2}\"`;
    });
    content = content.replace(/className=\"([^\"]*)text-slate-600([^\"]*)\"/g, (m, p1, p2) => {
        if (m.includes('dark:text-')) return m;
        return `className=\"${p1}text-slate-600 dark:text-slate-400${p2}\"`;
    });
    content = content.replace(/className=\"([^\"]*)text-slate-500([^\"]*)\"/g, (m, p1, p2) => {
        if (m.includes('dark:text-')) return m;
        return `className=\"${p1}text-slate-500 dark:text-slate-400${p2}\"`;
    });

    // Write back only if changed
    if (content !== original) {
        fs.writeFileSync(file, content);
        console.log('Successfully fixed themes on:', file);
    } else {
        console.log('No changes made to:', file);
    }
});
