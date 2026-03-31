const fs = require('fs');
const file = 'src/app/(app)/customers/[id]/CustomerDetailClient.tsx';
let data = fs.readFileSync(file, 'utf8');

// 1. Fix the Header (make layout md:flex-row, add Detay Ekstre, explicitly put Balance top right)
const headerRegex = /<div className="max-w-\[1600px\] mx-auto px-4 sm:px-6 lg:px-8 mt-2 flex flex-col xl:flex-row xl:items-start justify-between gap-6">[\s\S]*?\{" "\}\s*<\/div>\s*<\/div>/;
// Wait, the regex might fail. I'll use explicit string replacements.

// Fix Header layout container
// Find: <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mt-2 flex flex-col xl:flex-row xl:items-start justify-between gap-6">
data = data.replace(
    /className="max-w-\[1600px\] mx-auto px-4 sm:px-6 lg:px-8 mt-2 flex flex-col xl:flex-row xl:items-start justify-between gap-6"/,
    'className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mt-2 flex flex-col md:flex-row md:items-start justify-between gap-6 w-full"'
);

// Fix inner right section (Right: Compact Metrics & Actions)
// Change: <div className="flex flex-col items-end gap-3 flex-1">
data = data.replace(
    /<div className="flex flex-col items-end gap-3 flex-1">/,
    '<div className="flex flex-col md:items-end gap-3 flex-1 w-full md:w-auto">'
);

// Add "Detay Ekstre" button
data = data.replace(
    /<button\s+onClick=\{\(\) => \{ setStatementType\('summary'\); setStatementOpen\(true\); \}\}\s+className="h-\[36px\] px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white\/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white\/5 rounded-\[8px\] font-bold text-\[12px\] flex items-center justify-center gap-1.5 transition-colors shadow-sm hidden lg:flex"\s*>\s*📄 Özet Ekstre\s*<\/button>/,
    `<button
        onClick={() => { setStatementType('summary'); setStatementOpen(true); }}
        className="h-[36px] px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 rounded-[8px] font-bold text-[12px] flex items-center justify-center gap-1.5 transition-colors shadow-sm hidden lg:flex"
    >
        📄 Özet Ekstre
    </button>
    <button
        onClick={() => { setStatementType('detailed'); setStatementOpen(true); }}
        className="h-[36px] px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 rounded-[8px] font-bold text-[12px] flex items-center justify-center gap-1.5 transition-colors shadow-sm hidden lg:flex"
    >
        📑 Detaylı Ekstre
    </button>`
);

// Fix Search Box right-alignment
// Find: <div className="flex items-center gap-2 w-full lg:w-max justify-end">
data = data.replace(
    /<div className="flex items-center gap-2 w-full lg:w-max justify-end">/,
    '<div className="flex items-center gap-2 w-full md:w-auto ml-auto justify-end mt-4 lg:mt-0">'
);

// Fix Vadeler (activeTab === 'checks')
// Original uses huge paddings: style={{ padding: '40px 20px', textAlign: 'center', background: 'var(--bg-panel...
// I will just replace `style={{ padding: '32px' }}>` with `className="p-4 sm:p-6 bg-slate-50/50 dark:bg-transparent rounded-2xl">` for all of them!

data = data.replace(
    /<div style=\{\{ padding: '32px' \}\}>/g,
    '<div className="p-4 sm:p-6">'
);
data = data.replace(
    /<div style=\{\{ padding: '60px', textAlign: 'center', color: 'var\(--text-muted, #888\)' \}\}>/g,
    '<div className="p-12 text-center text-slate-500 rounded-[20px] bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-white/5">'
);
data = data.replace(
    /<div style=\{\{ padding: '40px 20px', textAlign: 'center', background: 'var\(--bg-panel, rgba\(15, 23, 42, 0.4\)\)', borderRadius: '16px', border: '1px dashed var\(--border-color, rgba\(255,255,255,0.1\)\)' \}\}>/g,
    '<div className="p-10 text-center bg-slate-50 dark:bg-[#0f172a] rounded-[16px] border border-dashed border-slate-200 dark:border-white/10">'
);
data = data.replace(
    /<div style=\{\{ overflowX: 'auto', background: 'var\(--bg-panel, rgba\(15, 23, 42, 0.4\)\)', borderRadius: '16px', border: '1px solid rgba\(255,255,255,0.05\)' \}\}>/g,
    '<div className="overflow-auto max-h-[calc(100vh-270px)] custom-scroll bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] shadow-sm flex flex-col mb-4">'
);
data = data.replace(
    /<div style=\{\{ overflowX: 'auto', borderRadius: '16px', border: '1px solid rgba\(255,255,255,0.05\)', background: 'var\(--bg-surface, rgba\(15, 23, 42, 0.6\)\)' \}\}>/g,
    '<div className="overflow-auto max-h-[calc(100vh-270px)] custom-scroll bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] shadow-sm flex flex-col mb-4">'
);
data = data.replace(
    /<tr style=\{\{ color: 'var\(--text-muted, #888\)', fontSize: '11px', textTransform: 'uppercase', textAlign: 'left', borderBottom: '1px solid var\(--border-color, rgba\(255,255,255,0.1\)\)', fontWeight: '800', letterSpacing: '0.5px' \}\}>/g,
    '<tr className="text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-widest font-bold border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#1e293b]">'
);
data = data.replace(
    /<tr style=\{\{ background: 'var\(--bg-panel, rgba\(0,0,0,0.2\)\)', color: 'var\(--text-muted, #888\)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' \}\}>/g,
    '<tr className="text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-widest font-bold border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#1e293b]">'
);
data = data.replace(
    /<th style=\{\{ padding: '16px 20px', fontWeight: '800' \}\}>/g,
    '<th className="px-5 py-4 font-bold whitespace-nowrap">'
);
data = data.replace(
    /<th style=\{\{ padding: '16px' \}\}>/g,
    '<th className="px-5 py-4 font-bold whitespace-nowrap">'
);
data = data.replace(
    /<th style=\{\{ textAlign: 'right', padding: '16px 20px' \}\}>/g,
    '<th className="px-5 py-4 font-bold text-right whitespace-nowrap">'
);
data = data.replace(
    /<th style=\{\{ textAlign: 'right', padding: '16px' \}\}>/g,
    '<th className="px-5 py-4 font-bold text-right whitespace-nowrap">'
);
data = data.replace(
    /<th style=\{\{ padding: '16px 20px', fontWeight: '800', textAlign: 'right' \}\}>/g,
    '<th className="px-5 py-4 font-bold text-right whitespace-nowrap">'
);

// Tr / Td refactoring inside offers, checks, reconciliations
data = data.replace(
    /<td style=\{\{ padding: '16px' \}\}>/g,
    '<td className="px-5 py-3 align-middle text-[12px] font-semibold text-slate-600 dark:text-slate-400">'
);
data = data.replace(
    /<td style=\{\{ textAlign: 'right', padding: '16px' \}\}>/g,
    '<td className="px-5 py-3 align-middle text-[12px] font-semibold text-slate-600 dark:text-slate-400 text-right">'
);


// Garanti Box (warranties) replacements
data = data.replace(
    /className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-500\/30" style=\{\{.*?padding: '24px'.*?\}\}/g,
    'className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 shadow-sm rounded-[16px] p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all hover:bg-slate-50 dark:hover:bg-[#1e293b]/50"'
);

// Fix inner tables hover styles
data = data.replace(
    /<tr key=\{\w+\.id\} style=\{\{ borderTop: '1px solid var\(--border-color, rgba\(255,255,255,0.05\)\)', transition: 'background 0.2s' \}\}>/g,
    '<tr key={offer.id} className="hover:bg-slate-50 dark:hover:bg-[#1e293b]/80 transition-colors h-[48px] group border-b border-slate-100 dark:border-white/5">'
);

data = data.replace(
    /<div style=\{\{ padding: '60px 20px', textAlign: 'center', background: 'var\(--bg-panel, rgba\(15, 23, 42, 0.4\)\)', borderRadius: '16px', border: '1px dashed var\(--border-color, rgba\(255,255,255,0.1\)\)' \}\}>/g,
    '<div className="p-10 text-center bg-slate-50 dark:bg-[#0f172a] rounded-[16px] border border-dashed border-slate-200 dark:border-white/10">'
);

data = data.replace(
    /<div style=\{\{ background: 'var\(--bg-panel, rgba\(15, 23, 42, 0.4\)\)', borderRadius: '20px', border: '1px solid rgba\(255,255,255,0.05\)', overflow: 'hidden', boxShadow: '0 4px 24px rgba\(0,0,0,0.2\)' \}\}>/g,
    '<div className="bg-transparent">'
);

fs.writeFileSync(file, data);
console.log('Tabs and buttons fixed.');
