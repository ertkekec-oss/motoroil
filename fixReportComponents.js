const fs = require('fs');

const files = [
    'src/components/DailyReportContent.tsx',
    'src/components/SupplierReportContent.tsx',
    'src/app/(app)/reports/page.tsx' // let's double check this one or run it again
];

files.forEach(file => {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');

    // Replace card dark backgrounds
    content = content.replace(/dark:bg-slate-900/g, 'dark:bg-[#0f172a]');

    // Replace card dark borders
    content = content.replace(/dark:border-slate-800/g, 'dark:border-white/5');

    // Replace bg-slate-100 specifically for dark mode
    content = content.replace(/bg-slate-100 dark:bg-slate-800/g, 'bg-slate-100 dark:bg-[#1e293b]');

    // Update internal styles relying on var(--bg-card) etc.
    content = content.replace(/style={{ background: 'var\(--bg-card\)',/g, 'className="bg-white dark:bg-[#0f172a]" style={{');
    content = content.replace(/background: 'var\(--bg-deep\)'/g, 'background: "#1e293b"');

    // Convert hardcoded styles handling
    content = content.replace(/background: 'var\(--bg-card\)'/g, 'background: ""');

    fs.writeFileSync(file, content);
    console.log('Fixed', file);
});
