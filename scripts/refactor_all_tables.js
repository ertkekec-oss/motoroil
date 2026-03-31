const fs = require('fs');
const file = 'src/app/(app)/customers/[id]/CustomerDetailClient.tsx';
let data = fs.readFileSync(file, 'utf8');

// The main loop to find and replace ALL inline-styled tables
let pass = 0;
while (true) {
    const tableIndex = data.indexOf("<div style={{ overflowX: 'auto' }}>");
    if (tableIndex === -1) break;

    pass++;

    // Find table bounds
    let beforeString = data.substring(0, tableIndex);
    let searchArea = data.substring(tableIndex);
    let endLocal = searchArea.indexOf('</table>');
    
    if (endLocal === -1) break;
    
    let tableBlock = searchArea.substring(0, endLocal + '</table>'.length);
    let afterString = searchArea.substring(endLocal + '</table>'.length);

    // Apply Replacements to `tableBlock`
    
    tableBlock = tableBlock.replace(
        /<div style=\{\{\s*overflowX:\s*'auto'\s*\}\}>/g, 
        '<div className="overflow-auto max-h-[calc(100vh-270px)] custom-scroll bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] shadow-sm flex flex-col">'
    );

    tableBlock = tableBlock.replace(
        /<table style=\{\{\s*width:\s*'100%',\s*borderCollapse:\s*'collapse'.*?\}\}>/g,
        '<table className="w-full text-left border-collapse">'
    );

    // Header replacement
    tableBlock = tableBlock.replace(
        /<thead[\s\S]*?<\/thead>/m,
        `<thead className="bg-slate-50 dark:bg-[#1e293b] text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest sticky top-0 z-20">
            <tr>
                <th className="px-5 py-4 font-bold border-b border-slate-200 dark:border-white/5 whitespace-nowrap">Tarih</th>
                <th className="px-5 py-4 font-bold border-b border-slate-200 dark:border-white/5 whitespace-nowrap">Tür / Durum</th>
                <th className="px-5 py-4 font-bold border-b border-slate-200 dark:border-white/5 min-w-[200px]">Açıklama / Detay</th>
                <th className="px-5 py-4 font-bold border-b border-slate-200 dark:border-white/5 text-right whitespace-nowrap">Tutar / Bakiye</th>
                <th className="px-5 py-4 font-bold border-b border-slate-200 dark:border-white/5 text-right whitespace-nowrap">Aksiyonlar</th>
                <th className="px-5 py-4 font-bold border-b border-slate-200 dark:border-white/5 text-center w-[40px]"></th>
            </tr>
        </thead>`
    );

    tableBlock = tableBlock.replace(/<tbody>/, '<tbody className="divide-y divide-slate-100 dark:divide-white/5">');

    // Replace TR row loops layout
    tableBlock = tableBlock.replace(
        /style=\{\{\s*borderBottom:\s*'1px solid var\(--border-color.*?',\s*transition:\s*'all 0\.2s'.*?\}\}/g,
        'className="hover:bg-slate-50 dark:hover:bg-[#1e293b]/80 transition-colors h-[48px] group"'
    );
    
    tableBlock = tableBlock.replace(
        /className="hover:bg-slate-50\/5 hover:dark:bg-white\/\[0\.02\]"/g,
        ''
    );

    tableBlock = tableBlock.replace(
        /style=\{\{\s*borderBottom:\s*'1px solid var\(--border-color.*?\)\)'\s*\}\}/g,
        'className="hover:bg-slate-50 dark:hover:bg-[#1e293b]/80 transition-colors h-[48px] group"'
    );
    tableBlock = tableBlock.replace(
        /style=\{\{ borderBottom: '1px solid var\(--border-color, rgba\(255,255,255,0\.05\)\)' \}\}/g,
        'className="hover:bg-slate-50 dark:hover:bg-[#1e293b]/80 transition-colors h-[48px] group"'
    );

    // Padding replacements
    tableBlock = tableBlock.replace(
        /<td style=\{\{\s*padding:\s*'24px 32px'\s*\}\}>/g,
        '<td className="px-5 py-3 align-middle text-[12px] font-bold text-slate-700 dark:text-slate-300">'
    );
    tableBlock = tableBlock.replace(
        /<td style=\{\{\s*padding:\s*'24px'(?:[^}]*?)\}\}>/g,
        '<td className="px-5 py-3 align-middle text-[12px] font-semibold text-slate-600 dark:text-slate-400">'
    );
    
    // Status badges / Pills generic match
    tableBlock = tableBlock.replace(
        /style=\{\{\s*padding:\s*'6px 12px',\s*borderRadius:\s*'8px',\s*fontSize:\s*'12px',\s*fontWeight:\s*'800',\s*background:\s*(.*?),\s*color:\s*(.*?),\s*border:\s*(.*?)\s*\}\}/g,
        'style={{ background: $1, color: $2, border: $3 }} className="inline-flex items-center justify-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest"'
    );

    data = beforeString + tableBlock + afterString;

    if (pass > 20) break; // Infinite loop safety
}

// 2. We also remove Content background wrapper if it still exists because the staff standard prefers floating tables.
const contentBg = `background: 'var(--bg-panel, rgba(15, 23, 42, 0.4))',
                    borderRadius: '20px',
                    border: '1px solid rgba(255,255,255,0.05)',
                    overflow: 'hidden',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.2)'`;
data = data.replace(contentBg, `/* removed staff block bg */`);

// Replace search box location to far right properly
// The user noted `ARAMA KUTUSUNU BULUNDUĞU KONUMUN SAĞINA AL` - let's make sure it is completely right-aligned in its flex wrapper.
const searchBoxDiv = `<div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mt-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex w-full lg:w-max whitespace-nowrap overflow-x-auto items-center gap-6 px-1 custom-scroll select-none pb-1">`;
// This is already done and `justify-between` puts it far right. But let's wrap the input specifically:
data = data.replace(
    `<div className="flex items-center gap-2 w-full lg:w-max justify-end">
                        <div className="relative w-full lg:w-[260px]">`,
    `<div className="flex items-center gap-2 flex-1 justify-end ml-auto">
                        <div className="relative w-full lg:w-[320px]">`
);

// One more check to ensure metrics vs buttons swapped correctly from previous step (it did)

fs.writeFileSync(file, data);
console.log('Done refactoring all inner tables.');
