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
    // for other components
    content = content.replace(
        /<div style=\{\{ minHeight: '100vh', background: 'var\(--bg-main\)' \}\}>/g,
        '<div className="min-h-screen bg-slate-50 dark:bg-[#020617] dark:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] dark:from-slate-900/40 dark:via-[#020617] dark:to-[#020617] pb-24">'
    );

    // 2. ClassName conversions
    content = content.replace(/dark:bg-slate-900/g, 'dark:bg-[#0f172a]');
    content = content.replace(/dark:border-slate-800/g, 'dark:border-white/5');
    content = content.replace(/bg-slate-100 dark:bg-slate-800/g, 'bg-slate-100 dark:bg-[#1e293b]');

    content = content.replace(/background: 'var\(--bg-deep\)'/g, 'background: "#1e293b"');
    content = content.replace(/border: '1px solid var\(--border-light\)'/g, 'border: "1px solid rgba(255,255,255,0.05)"');

    // 3. To prevent broken JSX AST when extracting inline styles to classNames:
    // Just replace var(--bg-card) with a hardcoded hex inside the string instead of injecting a className!
    // Since var(--bg-card) corresponds to dark mode card bg. Wait, we want it to be responsive to light/dark.
    // Let's do a simple regex carefully.

    fs.writeFileSync(file, content);
    console.log('Fixed', file);
});
