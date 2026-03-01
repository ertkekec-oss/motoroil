const fs = require('fs');
const file = 'src/app/(app)/inventory/components/TransferTabContent.tsx';
let txt = fs.readFileSync(file, 'utf8');

// Header Actions
txt = txt.replace(/btn btn-primary px-6 py-3 text-sm font-extrabold shadow-xl shadow-primary\/20/g, 'h-[44px] px-6 rounded-[14px] bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[13px] transition-all flex items-center justify-center gap-2 shadow-sm');
txt = txt.replace(/btn btn-ghost/g, 'h-[44px] px-6 rounded-[14px] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-semibold text-[13px] hover:bg-slate-50 dark:hover:bg-white/5 transition-all flex items-center justify-center gap-2 shadow-sm');

// Card Radiuses - change 24px to 20px for the transfer layout cards
txt = txt.replace(/rounded-\[24px\]/g, 'rounded-[20px]');

// Transfer table standard
// The start button at bottom: "SEVKİYATI BAŞLAT"
// w-full h-[48px] rounded-[12px] -> w-full h-[44px] rounded-[14px]
txt = txt.replace(/w-full h-\[48px\] rounded-\[12px\]/g, 'w-full h-[44px] rounded-[14px]');

// Make tables in Transfer standard: h-[52px], etc.
// The transfer cart table:
txt = txt.replace(/<tr key=\{idx\} className="border-b/g, '<tr key={idx} className="h-[52px] border-b');

// History Table:
txt = txt.replace(/<tr key=\{t.id\} className="border-b/g, '<tr key={t.id} className="h-[52px] border-b');

fs.writeFileSync(file, txt, 'utf8');
console.log('Fixed TransferTabContent.tsx UI classes');
