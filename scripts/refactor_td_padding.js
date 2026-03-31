const fs = require('fs');
const file = 'src/app/(app)/customers/[id]/CustomerDetailClient.tsx';
let data = fs.readFileSync(file, 'utf8');

// Global replaces that are 100% safe
data = data.replace(
    /<div style=\{\{\s*overflowX:\s*'auto'\s*\}\}>/g, 
    '<div className="overflow-auto max-h-[calc(100vh-270px)] custom-scroll bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] shadow-sm flex flex-col mb-4">'
);
data = data.replace(
    /<table style=\{\{\s*width:\s*'100%',\s*borderCollapse:\s*'collapse'.*?\}\}>/g,
    '<table className="w-full text-left border-collapse">'
);

// We need to replace the nested table elements but keep the text
// Replace `tr` in the `thead` (which has background: 'var(--bg-panel...)'
data = data.replace(
    /<tr style=\{\{\s*background:\s*'var\(--bg-panel, rgba\(15, 23, 42, 0\.4\)\)',\s*color:\s*'var\(--text-muted, #888\)',\s*fontSize:\s*'11px',\s*textAlign:\s*'left',\s*textTransform:\s*'uppercase',\s*letterSpacing:\s*'1px',\s*fontWeight:\s*'800'\s*\}\}>/g,
    '<tr className="bg-slate-50 dark:bg-[#1e293b] text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest sticky top-0 z-20">'
);

// Replace generic td / th padding 
data = data.replace(
    /<th style=\{\{\s*padding:\s*'24px'\s*\}\}>/g,
    '<th className="px-5 py-4 font-bold border-b border-slate-200 dark:border-white/5 whitespace-nowrap">'
);
data = data.replace(
    /<th style=\{\{\s*padding:\s*'24px'(.*?)\}\}>/g,
    '<th className="px-5 py-4 font-bold border-b border-slate-200 dark:border-white/5 whitespace-nowrap" style={{$1}}>'
);
data = data.replace(
    /<th style=\{\{\s*padding:\s*'16px 24px'\s*\}\}>/g,
    '<th className="px-5 py-4 font-bold border-b border-slate-200 dark:border-white/5 whitespace-nowrap">'
);
data = data.replace(
    /<th style=\{\{\s*padding:\s*'16px 24px'(.*?)\}\}>/g,
    '<th className="px-5 py-4 font-bold border-b border-slate-200 dark:border-white/5 whitespace-nowrap" style={{$1}}>'
);

data = data.replace(
    /<th style=\{\{\s*padding:\s*'20px'\s*\}\}>/g,
    '<th className="px-5 py-4 font-bold border-b border-slate-200 dark:border-white/5 whitespace-nowrap">'
);
data = data.replace(
    /<th style=\{\{\s*padding:\s*'20px'(.*?)\}\}>/g,
    '<th className="px-5 py-4 font-bold border-b border-slate-200 dark:border-white/5 whitespace-nowrap" style={{$1}}>'
);

// Now for `tbody` replacing TR styles to match `hover:bg-slate-50 dark:hover:bg-[#1e293b]/80 transition-colors h-[48px] group`
// E.g. `<tr style={{ borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.05))', fontSize: '13px', transition: 'background 0.2s' }} className="hover:bg-white/5">`
data = data.replace(
    /<tr key=\{(.*?)\} style=\{\{\s*borderBottom:[^}]*\}\}\s*className="hover:bg-white\/5">/g,
    '<tr key={$1} className="hover:bg-slate-50 dark:hover:bg-[#1e293b]/80 transition-colors h-[48px] group border-b border-slate-100 dark:border-white/5">'
);
data = data.replace(
    /className="hover:bg-slate-50\/5 hover:dark:bg-white\/\[0\.02\]"/g,
    ''
);
data = data.replace(
    /style=\{\{\s*borderBottom:\s*'1px solid var\(--border-color.*?\)',\s*background:\s*expandedRowId.*?'transparent',\s*cursor:(.*?),\s*transition:\s*'all 0\.2s',\s*\}\}\s*className="hover:bg-slate-50 dark:bg-slate-50 \/\[0.02\]"/g, // the main list tr is already refactored 
    ''
);


// `<td>` standard styles
data = data.replace(
    /<td style=\{\{\s*padding:\s*'20px'\s*\}\}>/g,
    '<td className="px-5 py-3 align-middle text-[12px] font-semibold text-slate-600 dark:text-slate-400">'
);
data = data.replace(
    /<td style=\{\{\s*padding:\s*'20px'(.*?)\}\}>/g,
    '<td className="px-5 py-3 align-middle text-[12px] font-semibold text-slate-600 dark:text-slate-400" style={{$1}}>'
);
data = data.replace(
    /<td style=\{\{\s*padding:\s*'16px 24px'\s*\}\}>/g,
    '<td className="px-5 py-3 align-middle text-[12px] font-semibold text-slate-600 dark:text-slate-400">'
);
data = data.replace(
    /<td style=\{\{\s*padding:\s*'16px 24px'(.*?)\}\}>/g,
    '<td className="px-5 py-3 align-middle text-[12px] font-semibold text-slate-600 dark:text-slate-400" style={{$1}}>'
);

// Remove the inline `style={{ fontWeight: '700', color: 'var(--text-main, #e2e8f0)' }}` and keep its contents text style:
data = data.replace(
    /style=\{\{\s*fontWeight:\s*'?(?:700|800)'?,\s*color:\s*'var\(--text-main[^)]*\)'\s*\}\}/g,
    'className="font-bold text-slate-900 dark:text-white"'
);

// For action buttons with links
// style={{ padding: '6px 12px', background: 'var(--bg-card, rgba(255,255,255,0.05))', color: 'var(--text-main, #fff)', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', borderRadius: '8px', fontSize: '11px', fontWeight: '800', textDecoration: 'none' }}
// style={{ padding: '8px 12px', background: 'var(--bg-card, rgba(255,255,255,0.05))', color: 'var(--text-main, #fff)', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', borderRadius: '8px', fontSize: '11px', fontWeight: '800', textDecoration: 'none' }}
data = data.replace(
    /style=\{\{\s*padding:\s*'(?:6px|8px) 12px',\s*background:\s*'var\(--bg-card[^)]*\)',\s*color:\s*'var\(--text-main[^)]*\)',\s*border:\s*'1px solid var\(--border-color[^)]*\)',\s*borderRadius:\s*'8px',\s*fontSize:\s*'11px',\s*fontWeight:\s*'800',\s*textDecoration:\s*'none'\s*\}\}/g,
    'className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 rounded-[6px] font-bold text-[11px] shadow-sm transition-all whitespace-nowrap"'
);
data = data.replace(
    /style=\{\{\s*padding:\s*'(?:6px|8px) 12px',\s*background:\s*'var\(--bg-card[^)]*\)',\s*border:\s*'1px solid var\(--border-color[^)]*\)',\s*borderRadius:\s*'8px',\s*fontSize:\s*'11px',\s*fontWeight:\s*'800',\s*color:\s*'var\(--text-main[^)]*\)',\s*textDecoration:\s*'none',\s*display:\s*'flex',\s*alignItems:\s*'center',\s*gap:\s*'6px'\s*\}\}/g,
    'className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 rounded-[6px] font-bold text-[11px] flex items-center gap-1.5 shadow-sm transition-all whitespace-nowrap"'
);


// For badges in inner tables
// style={{ padding: '4px 10px', background: 'var(--bg-card, rgba(255,255,255,0.05))', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', borderRadius: '6px', fontWeight: '800', color: '#3b82f6', letterSpacing: '1px' }}
data = data.replace(
    /style=\{\{\s*padding:\s*'4px 10px',\s*background:\s*'var\(--bg-card[^)]*\)',\s*border:\s*'1px solid var\(--border-color[^)]*\)',\s*borderRadius:\s*'6px',\s*fontWeight:\s*'800',\s*color:\s*'#3b82f6',\s*letterSpacing:\s*'1px'\s*\}\}/g,
    'className="px-2 py-0.5 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 rounded-md font-bold tracking-widest text-[10px]"'
);

data = data.replace(
    /style=\{\{\s*padding:\s*'4px 10px',\s*background:\s*'var\(--bg-card[^)]*\)',\s*border:\s*'1px solid var\(--border-color[^)]*\)',\s*borderRadius:\s*'6px',\s*fontWeight:\s*'800',\s*color:\s*'var\(--text-main[^)]*\)',\s*letterSpacing:\s*'1px'\s*\}\}/g,
    'className="px-2 py-0.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-md font-bold tracking-widest text-[10px]"'
);

// 2. We also remove Content background wrapper
const contentBg = `background: 'var(--bg-panel, rgba(15, 23, 42, 0.4))',
                    borderRadius: '20px',
                    border: '1px solid rgba(255,255,255,0.05)',
                    overflow: 'hidden',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.2)'`;
data = data.replace(contentBg, `/* removed staff block bg */`);


fs.writeFileSync(file, data);
console.log('Done td padding refactor');
