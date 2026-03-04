const fs = require('fs');

const files = [
    'src/app/(app)/reports/page.tsx',
    'src/components/DailyReportContent.tsx',
    'src/components/SupplierReportContent.tsx'
];

files.forEach(file => {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');

    // 1. Wrap the entire container in reports/page.tsx
    content = content.replace(
        /<div style=\{\{ minHeight: '100vh', background: 'var\(--bg-main\)', padding: '20px' \}\}>/g,
        '<div className="min-h-screen p-5 bg-slate-50 dark:bg-[#020617] dark:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] dark:from-slate-900/40 dark:via-[#020617] dark:to-[#020617] pb-24">'
    );

    // 2. Wrap container in other components if they use the same style
    content = content.replace(
        /<div style=\{\{ minHeight: '100vh', background: 'var\(--bg-main\)' \}\}>/g,
        '<div className="min-h-screen bg-slate-50 dark:bg-[#020617] dark:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] dark:from-slate-900/40 dark:via-[#020617] dark:to-[#020617] pb-24">'
    );

    // 3. Fix dark mode on cards
    content = content.replace(/dark:bg-slate-900/g, 'dark:bg-[#0f172a]');
    content = content.replace(/dark:border-slate-800/g, 'dark:border-white/5');
    content = content.replace(/bg-slate-100 dark:bg-slate-800/g, 'bg-slate-100 dark:bg-[#1e293b]');

    // 4. Safely handle var(--bg-card) inline style.
    // Replace it with className styling but retain other inline styles
    content = content.replace(/style=\{\{\s*background:\s*'var\(--bg-card\)'/g, 'className="bg-white dark:bg-[#0f172a]" style={{ ');
    content = content.replace(/style=\{\{\s*background:\s*'var\(--bg-deep\)'/g, 'className="bg-slate-50 dark:bg-[#1e293b]" style={{ ');

    // Convert remaining border: '1px solid var(--border-light)' gently
    content = content.replace(/border:\s*'1px solid var\(--border-light\)'/g, 'border: "1px solid rgba(255,255,255,0.05)"');

    fs.writeFileSync(file, content);
    console.log('Fixed', file);
});
