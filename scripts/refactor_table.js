const fs = require('fs');
const file = 'src/app/(app)/customers/[id]/CustomerDetailClient.tsx';
let data = fs.readFileSync(file, 'utf8');

const tStartStr = "<div style={{ overflowX: 'auto' }}>";
const lines = data.split('\n');
let tStart = -1;
let tEnd = -1;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("filteredHistory.length === 0 ? (")) {
        for (let j = i; j >= Math.max(0, i - 30); j--) {
            if (lines[j].includes(tStartStr)) {
                tStart = j;
                break;
            }
        }
        for (let j = i; j < lines.length; j++) {
            if (lines[j].includes("</table>")) {
                tEnd = j + 2; 
                break;
            }
        }
        break;
    }
}

if (tStart === -1 || tEnd === -1) {
    console.log('Not found');
    process.exit(1);
}

// Perform regex replacements inside the target table block
let tableBlock = lines.slice(tStart, tEnd).join('\n');

tableBlock = tableBlock.replace(
    /<div style=\{\{\s*overflowX:\s*'auto'\s*\}\}>/g, 
    '<div className="overflow-auto max-h-[calc(100vh-270px)] custom-scroll bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] shadow-sm flex flex-col">'
);

tableBlock = tableBlock.replace(
    /<table style=\{\{\s*width:\s*'100%',\s*borderCollapse:\s*'collapse',\s*minWidth:\s*'900px'\s*\}\}>/g,
    '<table className="w-full text-left border-collapse">'
);

tableBlock = tableBlock.replace(
    /<thead[\s\S]*?<\/thead>/m,
    `<thead className="bg-slate-50 dark:bg-[#1e293b] text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest sticky top-0 z-20">
                                    <tr>
                                        <th className="px-5 py-4 font-bold border-b border-slate-200 dark:border-white/5 whitespace-nowrap">Tarih</th>
                                        <th className="px-5 py-4 font-bold border-b border-slate-200 dark:border-white/5 whitespace-nowrap">Hareket Türü</th>
                                        <th className="px-5 py-4 font-bold border-b border-slate-200 dark:border-white/5 min-w-[200px]">Açıklama</th>
                                        <th className="px-5 py-4 font-bold border-b border-slate-200 dark:border-white/5 text-right whitespace-nowrap">Tutar</th>
                                        <th className="px-5 py-4 font-bold border-b border-slate-200 dark:border-white/5 text-right whitespace-nowrap">Aksiyonlar</th>
                                        <th className="px-5 py-4 font-bold border-b border-slate-200 dark:border-white/5 text-center w-[40px]"></th>
                                    </tr>
                                </thead>`
);

tableBlock = tableBlock.replace(/<tbody>/, '<tbody className="divide-y divide-slate-100 dark:divide-white/5">');

// Replace the empty history message
tableBlock = tableBlock.replace(
    /<tr><td colSpan=\{6\} style=\{\{ padding: '60px', textAlign: 'center', color: 'var\(--text-muted, #666\)', fontSize: '15px', fontWeight: '500' \}\}>Bu kategoride kayıt veya işlem bulunamadı\.<\/td><\/tr>/g,
    '<tr><td colSpan={6} className="px-6 py-10 text-center text-slate-500 dark:text-slate-400 font-semibold text-[14px]">Bu kategoride kayıt veya işlem bulunamadı.</td></tr>'
);

// Replace the main row `tr` style, cursor logic, etc.
tableBlock = tableBlock.replace(
    /style=\{\{\s*borderBottom:\s*'1px solid var\(--border-color, rgba\(255,255,255,0\.05\)\)',\s*cursor:\s*item\.items \? 'pointer' : 'default',\s*background:\s*expandedRowId === item\.id \? 'var\(--bg-card, rgba\(255,255,255,0\.03\)\)' : 'transparent',\s*transition:\s*'all 0\.2s'\s*\}\}\s*className="hover:bg-white\/5"/g,
    'className={`hover:bg-slate-50 dark:hover:bg-[#1e293b]/80 transition-colors h-[48px] group ${expandedRowId === item.id ? "bg-slate-50 dark:bg-white/[0.02]" : ""} ${item.items ? "cursor-pointer" : ""}`}'
);

// Replace td paddings logic inside tableBlock
tableBlock = tableBlock.replace(
    /<td style=\{\{\s*padding:\s*'24px',\s*fontSize:\s*'13px',\s*color:\s*'var\(--text-main, #ddd\)',\s*fontWeight:\s*'600'\s*\}\}>/g,
    '<td className="px-5 py-3 align-middle text-[12px] font-bold text-slate-700 dark:text-slate-300">'
);
tableBlock = tableBlock.replace(
    /<td style=\{\{\s*padding:\s*'24px'\s*\}\}>/g,
    '<td className="px-5 py-3 align-middle">'
);

// Specifically handle the type field background
tableBlock = tableBlock.replace(
    /<span style=\{\{\s*padding:\s*'6px 12px',\s*borderRadius:\s*'8px',\s*fontSize:\s*'11px',\s*fontWeight:\s*'800',\s*background:\s*item\.color \+ '15',\s*color:\s*item\.color,\s*border:\s*'1px solid '\s*\+\s*item\.color\s*\+\s*'30'\s*\}\}>/g,
    '<span style={{ background: item.color + "15", color: item.color, border: "1px solid " + item.color + "30" }} className="inline-flex items-center justify-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest">'
);

tableBlock = tableBlock.replace(
    /<td style=\{\{\s*padding:\s*'24px',\s*fontSize:\s*'13px',\s*color:\s*'var\(--text-muted, #aaa\)',\s*fontWeight:\s*'500'\s*\}\}>/g,
    '<td className="px-5 py-3 align-middle text-[12px] font-semibold text-slate-500 dark:text-slate-400">'
);

tableBlock = tableBlock.replace(
    /<td style=\{\{\s*padding:\s*'24px',\s*textAlign:\s*'right',\s*fontWeight:\s*'800',\s*fontSize:\s*'15px',\s*color:\s*item\.amount > 0 \? '#ef4444' : '#10b981',\s*fontFamily:\s*'monospace',\s*whiteSpace:\s*'nowrap'\s*\}\}>/g,
    '<td className={`px-5 py-3 align-middle text-right text-[14px] font-black font-mono whitespace-nowrap ${item.amount > 0 ? "text-red-500" : item.amount < 0 ? "text-emerald-500" : "text-slate-500"}`}>'
);

tableBlock = tableBlock.replace(
    /<td style=\{\{\s*padding:\s*'24px',\s*textAlign:\s*'right'\s*\}\}>/g,
    '<td className="px-5 py-3 align-middle text-right pr-6">'
);

tableBlock = tableBlock.replace(
    /<div style=\{\{\s*display:\s*'flex',\s*gap:\s*'8px',\s*justifyContent:\s*'flex-end',\s*flexWrap:\s*'nowrap',\s*alignItems:\s*'center'\s*\}\}>/g,
    '<div className="flex items-center justify-end gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">'
);

// We should replace `<td style={{ padding: '24px', textAlign: 'center' }}>`
tableBlock = tableBlock.replace(
    /<td style=\{\{\s*padding:\s*'24px',\s*textAlign:\s*'center'\s*\}\}>/g,
    '<td className="px-5 py-3 align-middle text-center">'
);

// Replace button inline styles for action buttons inside the row
tableBlock = tableBlock.replace(
    /style=\{\{\s*fontSize:\s*'11px',\s*fontWeight:\s*'800',\s*padding:\s*'8px 12px',\s*borderRadius:\s*'8px',\s*background:\s*'rgba\(59, 130, 246, 0\.1\)',\s*color:\s*'#3b82f6',\s*border:\s*'1px solid rgba\(59, 130, 246, 0\.3\)',\s*display:\s*'flex',\s*alignItems:\s*'center',\s*gap:\s*'6px'\s*\}\}/g,
    'className="px-2.5 py-1 rounded-md text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 border border-transparent hover:border-blue-200 dark:hover:border-blue-500/30 transition-all flex items-center gap-1.5 text-[10px] font-bold"'
);

tableBlock = tableBlock.replace(
    /style=\{\{\s*fontSize:\s*'11px',\s*fontWeight:\s*'800',\s*padding:\s*'8px 12px',\s*borderRadius:\s*'8px',\s*background:\s*'rgba\(245, 158, 11, 0\.1\)',\s*color:\s*'#f59e0b',\s*border:\s*'1px solid rgba\(245, 158, 11, 0\.3\)',\s*display:\s*'flex',\s*alignItems:\s*'center',\s*gap:\s*'6px'\s*\}\}/g,
    'className="px-2.5 py-1 rounded-md text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20 border border-transparent hover:border-amber-200 dark:hover:border-amber-500/30 transition-all flex items-center gap-1.5 text-[10px] font-bold"'
);

tableBlock = tableBlock.replace(
    /style=\{\{\s*fontSize:\s*'11px',\s*fontWeight:\s*'800',\s*padding:\s*'8px 12px',\s*borderRadius:\s*'8px',\s*background:\s*'rgba\(239, 68, 68, 0\.1\)',\s*color:\s*'#ef4444',\s*border:\s*'1px solid rgba\(239, 68, 68, 0\.3\)',\s*display:\s*'flex',\s*alignItems:\s*'center',\s*gap:\s*'6px'\s*\}\}/g,
    'className="px-2.5 py-1 rounded-md text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 border border-transparent hover:border-red-200 dark:hover:border-red-500/30 transition-all flex items-center gap-1.5 text-[10px] font-bold"'
);

tableBlock = tableBlock.replace(
    /style=\{\{\s*fontSize:\s*'11px',\s*fontWeight:\s*'800',\s*padding:\s*'8px 12px',\s*borderRadius:\s*'8px',\s*background:\s*'var\(--bg-card, rgba\(255,255,255,0\.05\)\)',\s*color:\s*'var\(--text-main, #fff\)',\s*border:\s*'1px solid var\(--border-color, rgba\(255,255,255,0\.1\)\)',\s*display:\s*'flex',\s*alignItems:\s*'center',\s*gap:\s*'6px'\s*\}\}/g,
    'className="w-7 h-7 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 border border-transparent hover:border-slate-200 dark:hover:border-white/20 hover:text-slate-700 dark:hover:text-white transition-all flex items-center justify-center font-bold text-[13px]"'
);

// We need to change the texts of the action buttons if they have text and replace them with icon only where the generic class was applied (this applies to "Yazdır" or "Detay" etc)
// Actually we can leave text as is, the staff layout has `Görev Ata` button, but for records small square buttons are used.
// Let's replace the content with the new block
data = lines.slice(0, tStart).join('\n') + '\n' + tableBlock + '\n' + lines.slice(tEnd).join('\n');
fs.writeFileSync(file, data);

console.log('Successfully refactored tables');
