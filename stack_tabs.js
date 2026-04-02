const fs = require('fs');

const file = 'c:/Users/ertke/OneDrive/Masaüstü/periodya/muhasebeapp/motoroil/src/app/(app)/service/[id]/ServiceDetailClient.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove Tabs UI and `activeTab` logic
content = content.replace(
    /<div className="flex gap-4 sm:gap-6 mt-4 sm:mt-6 border-b border-slate-200 dark:border-white\/5 overflow-x-auto custom-scroll -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">[\s\S]*?<\/div>/g,
    ''
);

// 2. Remove conditional rendering for `details`, `parts`, `labor` inside the container
// We replace `{activeTab === 'details' && (` with `<div className="space-y-6">` and end appropriately.
// It's easier using regex to replace {activeTab === 'xyz' && (` with `<div className="mt-8 section-group">`
content = content.replace(/{activeTab === 'details' && \(/g, '<div className="space-y-6 animate-in fade-in zoom-in-95 duration-200" id="section-details">');
content = content.replace(/{activeTab === 'parts' && \(/g, '<div className="mt-8 pt-8 border-t border-slate-200 dark:border-white/10" id="section-parts"><h2 className="text-lg font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">📦</div> Yedek Parça & Ürünler</h2>');
content = content.replace(/{activeTab === 'labor' && \(/g, '<div className="mt-8 pt-8 border-t border-slate-200 dark:border-white/10" id="section-labor"><h2 className="text-lg font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">👨‍🔧</div> İşçilik & Hizmetler</h2>');

// Find and replace the closing `)}` for each section
// We can just run a smart string replace loop or regex for the closing part.
// But wait, it's `)}` at the end of the root div of that condition.
content = content.replace(/<\/div>\s*\}\)\s*\}\s*<\/div>\s*\)\}/g, '</div>})}</div>');

content = content.replace(/<\/div>\s*\)\}/g, '</div>');

fs.writeFileSync(file, content, 'utf8');
console.log('Removed tabs from ServiceDetailClient and stacked them !');
