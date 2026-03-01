const fs = require('fs');
const file = 'src/app/(app)/inventory/components/BulkPriceEntryContent.tsx';
let txt = fs.readFileSync(file, 'utf8');

// replace rounded-[10px] with rounded-[12px] everywhere (since it's mostly inputs and selects)
txt = txt.replace(/rounded-\[10px\]/g, 'rounded-[12px]');

// enforce h-[44px] on inputs by adding it to their classNames
txt = txt.replace(/rounded-\[12px\] p-2.5/g, 'h-[44px] rounded-[12px] px-3');
txt = txt.replace(/rounded-\[12px\] px-2.5 py-2.5/g, 'h-[44px] rounded-[12px] px-3');

// enforce row height and enterprise styling on table rows
txt = txt.replace(/<tr key=\{product\.id\} className="hover:bg-slate-50/g, '<tr key={product.id} className="h-[52px] border-b border-slate-200 dark:border-white/5 hover:bg-slate-50');

// add focus ring blue
// actually most inputs already have "focus:ring-1 focus:ring-blue-500", but let's make sure it's 2px focus ring:
txt = txt.replace(/focus:ring-1 focus:ring-blue-500/g, 'focus:ring-2 focus:ring-blue-500');

fs.writeFileSync(file, txt, 'utf8');
console.log('Fixed BulkPriceEntryContent.tsx UI classes');
