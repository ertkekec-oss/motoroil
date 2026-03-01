const fs = require('fs');

const path = 'src/app/(app)/settings/page.tsx';
let lines = fs.readFileSync(path, 'utf8').split('\n');

const baseInputStyleStr = "style={{ background: 'var(--bg-deep)', border: '1px solid var(--border-light)', padding: '12px', borderRadius: '10px', color: 'white' }}";
const baseInputStyleStrWithWeight = "style={{ background: 'var(--bg-deep)', border: '1px solid var(--border-light)', padding: '12px', borderRadius: '10px', color: 'white', fontWeight: '800' }}";
const branchInputStyle = "style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-deep)', color: 'white' }}";
const newInputClass = 'className="w-full h-[44px] px-[12px] rounded-[12px] bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all shadow-sm"';
const textClass = 'className="w-full p-[12px] rounded-[12px] bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all shadow-sm resize-y"';

for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Global Layout Background & Text Colors
    line = line.replace(/<div className="container" style=\{\{ padding: '0', height: '100vh', display: 'flex' \}\}>/g, '<div className="flex h-screen bg-[#F6F8FB] dark:bg-[#0B1120] text-slate-900 dark:text-white overflow-hidden">');
    line = line.replace(/<div className="w-\[240px\] border-r border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-\[\#0F172A\] flex flex-col gap-1">/g, '<div className="w-[260px] shrink-0 border-r border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-[#111827] flex flex-col gap-2 overflow-y-auto">');
    line = line.replace(/<div style=\{\{ flex: 1, padding: '40px', overflowY: 'auto' \}\}>/g, '<div className="flex-1 p-8 overflow-y-auto w-full max-w-7xl mx-auto flex flex-col gap-8 pb-32">');

    // Cards
    line = line.replace(/className="card glass flex-col gap-6" style=\{\{ padding: '24px' \}\}/g, 'className="flex flex-col gap-6 p-8 bg-white dark:bg-[#111827] rounded-[20px] border border-slate-200 dark:border-slate-800 shadow-sm"');
    line = line.replace(/className="card glass mb-8" style=\{\{ padding: '24px', borderLeft: (.*?) \}\}/g, 'className="flex flex-col gap-6 p-8 mb-8 bg-white dark:bg-[#111827] rounded-[20px] border border-slate-200 dark:border-slate-800 shadow-sm" style={{ borderLeft: $1 }}');
    line = line.replace(/className="card glass mb-8" style=\{\{ padding: '24px' \}\}/g, 'className="flex flex-col gap-6 p-8 mb-8 bg-white dark:bg-[#111827] rounded-[20px] border border-slate-200 dark:border-slate-800 shadow-sm"');
    line = line.replace(/className="card glass flex-col gap-4"/g, 'className="flex flex-col gap-4 p-8 bg-white dark:bg-[#111827] rounded-[20px] border border-slate-200 dark:border-slate-800 shadow-sm"');
    line = line.replace(/className="card glass( animate-slide-up)?" style=\{\{ borderLeft:/g, 'className="p-8 bg-white dark:bg-[#111827] rounded-[20px] border border-slate-200 dark:border-slate-800 shadow-sm$1" style={{ borderLeft:');
    line = line.replace(/className="card glass( animate-slide-up)?"/g, 'className="p-8 bg-white dark:bg-[#111827] rounded-[20px] border border-slate-200 dark:border-slate-800 shadow-sm$1"');
    line = line.replace(/className="card glass overflow-hidden border border-white\/5"/g, 'className="bg-white dark:bg-[#111827] rounded-[20px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"');

    // Labels
    line = line.replace(/<label style=\{\{ fontSize: '11px', fontWeight: '900', opacity: 0\.5 \}\}>/g, '<label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 block mb-2">');
    line = line.replace(/<label className="text-muted" style=\{\{ fontSize: '11px', fontWeight: 'bold' \}\}>/g, '<label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 block mb-2">');

    // Inputs (exact match, no wildcards crossing lines)
    line = line.replace('style={{ display: \'none\' }}', 'className="hidden"'); // file upload
    line = line.replace(baseInputStyleStrWithWeight, newInputClass + ' style={{ fontWeight: 800 }}');
    line = line.replace(baseInputStyleStr, newInputClass);
    line = line.replace(branchInputStyle, newInputClass);

    // Other input inline styles
    line = line.replace(/style=\{\{ background: 'var\(--bg-deep\)', border: '1px solid var\(--border-light\)', padding: '12px', borderRadius: '10px', color: 'white'(.*?) \}\}/g, newInputClass + " style={{$1}}");
    line = line.replace(/style=\{\{ padding: '10px', borderRadius: '8px', border: '1px solid var\(--border-light\)', background: 'var\(--bg-deep\)', color: 'white'(.*?) \}\}/g, newInputClass + " style={{$1}}");

    // Textarea
    if (line.includes('<textarea')) {
        line = line.replace(baseInputStyleStr, textClass);
        line = line.replace(/style=\{\{ background: 'var\(--bg-deep\)', border: '1px solid var\(--border-light\)', padding: '12px', borderRadius: '10px', color: 'white'(.*?) \}\}/g, textClass + " style={{$1}}");
    }

    // Clean up legacy colors inline
    line = line.replace(/'var\(--text-muted\)'/g, '"#64748B"');
    line = line.replace(/'var\(--border-light\)'/g, '"#E2E8F0"');

    // Re-map internal component backgrounds explicitly
    line = line.replace(/background: 'var\(--bg-deep\)'/g, 'backgroundColor: "transparent"');
    line = line.replace(/background: 'var\(--bg-card\)'/g, 'backgroundColor: "transparent"');

    // Buttons that use 'btn-ghost' generic styles:
    line = line.replace(/className="btn btn-ghost"/g, 'className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition-colors"');
    line = line.replace(/className="btn btn-outline"/g, 'className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold transition-colors"');

    lines[i] = line;
}

fs.writeFileSync(path, lines.join('\n'), 'utf8');
console.log('Done safely');
