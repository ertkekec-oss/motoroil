const fs = require('fs');

const files = [
    'src/app/(app)/reports/page.tsx',
    'src/components/DailyReportContent.tsx',
    'src/components/SupplierReportContent.tsx'
];

files.forEach(file => {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');

    // Make sure we only replace background: 'var(--bg-main)' in the root container of each file
    content = content.replace(
        "minHeight: '100vh', background: 'var(--bg-main)', padding: '20px'",
        "minHeight: '100vh', background: 'radial-gradient(ellipse at top, rgba(15, 23, 42, 0.4), #020617, #020617)', padding: '20px'"
    );

    content = content.replace(
        "minHeight: '100vh', background: 'var(--bg-main)'",
        "minHeight: '100vh', background: 'radial-gradient(ellipse at top, rgba(15, 23, 42, 0.4), #020617, #020617)'"
    );

    fs.writeFileSync(file, content);
    console.log('Fixed', file);
});
