const fs = require('fs');
const path = require('path');

const files = [
    'DailyReportContent.tsx',
    'SupplierReportContent.tsx',
    'ManufacturingReportContent.tsx',
    'ExportReportsContent.tsx'
];

files.forEach(file => {
    const filePath = path.join('src/components', file);
    if (!fs.existsSync(filePath)) return;
    
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Remove the entire <style jsx>{` ... `}</style> block
    content = content.replace(/<style jsx>\{`[\s\S]*?`\}<\/style>/, '');

    // 2. Replace custom neon classes with standard clean tailwind classes
    content = content.replace(/shadow-sm-card/g, 'shadow-sm rounded-2xl');
    content = content.replace(/bg-subtle border border-subtle hover:bg-hover hover:border-main/g, 'bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10');
    content = content.replace(/text-main/g, 'text-slate-900 dark:text-white');
    content = content.replace(/text-muted/g, 'text-slate-500');
    content = content.replace(/bg-primary\/20/g, 'bg-slate-200 dark:bg-slate-700');
    content = content.replace(/text-primary/g, 'text-slate-900 dark:text-white'); // Use neutral instead of glowing orange
    content = content.replace(/gradient-text-[a-z]+/g, 'text-slate-900 dark:text-white');
    content = content.replace(/shadow-\[0_0_10px_var\(--primary-glow\)]/g, 'shadow-sm');
    content = content.replace(/pulse-box/g, 'w-2 h-2 rounded-full bg-emerald-500 mr-1 animate-pulse'); // Keep pulse but make it standard tailwind semantic green
    content = content.replace(/shadow-[a-z]+-500\/[0-9]+/g, '');
    
    // Convert 'text-white' usages to 'text-slate-900 dark:text-white' to match white theme support
    // Be careful, some cards might intentionally be dark. But the context is enterprise white background.
    content = content.replace(/text-white\/[0-9]+/g, 'text-slate-500 dark:text-slate-400');
    content = content.replace(/text-white/g, 'text-slate-900 dark:text-white');

    content = content.replace(/bg-white\/[0-9]+/g, 'bg-slate-100 dark:bg-slate-800');
    content = content.replace(/bg-primary\/5/g, 'bg-slate-50 dark:bg-slate-800/50');
    content = content.replace(/bg-primary/g, 'bg-slate-900 dark:bg-white text-white dark:text-slate-900');
    

    // 3. Fix inline styles
    content = content.replace(/style=\{\{\s*width: `\$\{percentage\}%`\s*\}\}/g, 'style={{ width: `${percentage}%` }}');
    content = content.replace(/style=\{\{\s*background:\s*"#1e293b"\s*\}\}/g, 'className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white"');

    // 4. Clean up emojis from headers
    content = content.replace(/<span className="text-4xl.*?">.*?(?:🌑|💰|🧾|📥|💼|📦|💡).*?<\/span>/g, '<span className="text-4xl mb-4">📊</span>');

    fs.writeFileSync(filePath, content);
});
console.log('Done reporting sub component fix');
