const fs = require('fs');

let file = 'src/app/(app)/inventory/page.tsx';
let txt = fs.readFileSync(file, 'utf8');

// 1. Redesign Header Buttons
// Yükle / İndir / Stok Sayımı / Barkod Tara / Yeni Ürün
// They must be "Height 44px, Radius 14px". Outline for secondary, Blue for primary.
txt = txt.replace(/<div className="flex items-center gap-3">[\s\S]*?(<button\s+onClick=\{\(\) => setShowAddModal\(true\)\}\s+className=")[^"]+("\s*>)[\s\S]*?(<div className="relative flex items-center justify-center gap-2 text-white font-semibold text-\[13px\] tracking-wide">\s*<span>Yeni Ürün<\/span>\s*<\/div>\s*<\/button>)/g, (match, btnStart, btnEnd, btnContent) => {
    // Completely rewrite the whole button group to match the Enterprise look.
    return `<div className="flex items-center gap-3">
            <input type="file" ref={fileInputRef} onChange={handleExcelUpload} accept=".xlsx, .xls" className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="h-[44px] px-4 rounded-[14px] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[13px] hover:bg-slate-50 dark:hover:bg-[#1e293b] transition-all flex items-center gap-2 shadow-sm">
              <span className="text-sm">📤</span> Yükle
            </button>
            <button onClick={exportToExcel} className="h-[44px] px-4 rounded-[14px] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[13px] hover:bg-slate-50 dark:hover:bg-[#1e293b] transition-all flex items-center gap-2 shadow-sm">
              <span className="text-sm">📥</span> İndir
            </button>
            <button onClick={startCount} className="h-[44px] px-4 rounded-[14px] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[13px] hover:bg-slate-50 dark:hover:bg-[#1e293b] transition-all flex items-center gap-2 shadow-sm">
              <span className="text-sm">🔍</span> Stok Sayımı
            </button>
            <button onClick={() => setShowScanner(true)} className="hidden md:flex h-[44px] px-4 rounded-[14px] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[13px] hover:bg-slate-50 dark:hover:bg-[#1e293b] transition-all items-center gap-2 shadow-sm">
              <span className="text-sm">📷</span> Barkod Tara
            </button>
            <button onClick={() => setShowAddModal(true)} className="h-[44px] px-6 rounded-[14px] bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[13px] transition-all flex items-center gap-2 shadow-sm">
              <span>Yeni Ürün</span>
            </button>
`;
});

// 2. Redesign Tab Navigation to Underline Style
txt = txt.replace(/<div className="flex p-1 rounded-xl border border-slate-200 dark:border-white\/10 whitespace-nowrap w-max h-\[40px\] items-center">/g,
    '<div className="flex border-b border-slate-200 dark:border-white/10 whitespace-nowrap w-full md:w-max h-[48px] items-end gap-6 px-2">');

txt = txt.replace(/<button\s+onClick=\{\(\) => setActiveTab\("all"\)\}\s+className=\{`px-4 h-full rounded-lg text-\[13px\] font-medium transition-all duration-300 flex items-center gap-2 \$\{activeTab === "all" \? "bg-blue-50 dark:bg-blue-500\/10 text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white\/5"}`\}\s*>\s*Envanter Listesi\s*<\/button>/g,
    `<button onClick={() => setActiveTab("all")} className={\`h-full px-2 text-[14px] font-semibold transition-all duration-300 flex items-center gap-2 border-b-2 \${activeTab === "all" ? "border-blue-600 text-blue-600 dark:text-blue-400" : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"}\`}>Envanter Listesi</button>`);

txt = txt.replace(/<button\s+onClick=\{\(\) => setActiveTab\("transfers"\)\}\s+className=\{`px-4 h-full rounded-lg text-\[13px\] font-medium transition-all duration-300 flex items-center gap-2 \$\{activeTab === "transfers" \? "bg-blue-50 dark:bg-blue-500\/10 text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white\/5"}`\}\s*>\s*Transfer & Sevkiyat\s*<\/button>/g,
    `<button onClick={() => setActiveTab("transfers")} className={\`h-full px-2 text-[14px] font-semibold transition-all duration-300 flex items-center gap-2 border-b-2 \${activeTab === "transfers" ? "border-blue-600 text-blue-600 dark:text-blue-400" : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"}\`}>Transfer & Sevkiyat</button>`);

txt = txt.replace(/<button\s+onClick=\{\(\) => setActiveTab\("bulk-price"\)\}\s+className=\{`px-4 h-full rounded-lg text-\[13px\] font-medium transition-all duration-300 flex items-center gap-2 \$\{activeTab === "bulk-price" \? "bg-blue-50 dark:bg-blue-500\/10 text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white\/5"}`\}\s*>\s*Fiyat Girişi\s*<\/button>/g,
    `<button onClick={() => setActiveTab("bulk-price")} className={\`h-full px-2 text-[14px] font-semibold transition-all duration-300 flex items-center gap-2 border-b-2 \${activeTab === "bulk-price" ? "border-blue-600 text-blue-600 dark:text-blue-400" : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"}\`}>Fiyat Girişi</button>`);

// Fix modal corner radiuses
txt = txt.replace(/rounded-\[24px\]/g, 'rounded-[24px]'); // leave as is if already 24

// Cleanup some residual buttons that might have been broken by regex
// Also remove extra closing tag if the previous replacement missed one

fs.writeFileSync(file, txt, 'utf8');
console.log('UI updated for page.tsx');

// Table fix in InventoryTable.tsx
let tableFile = 'src/app/(app)/inventory/components/InventoryTable.tsx';
if (fs.existsSync(tableFile)) {
    let tTxt = fs.readFileSync(tableFile, 'utf8');
    // Row height 52px (h-[52px]), sticky header, no zebra striping, solid checkbox, action column hover
    // Let's ensure headers and rows have enterprise UI.
    // Replace old class like "border-b border-slate-200" to have standard h-[52px]
    tTxt = tTxt.replace(/<tr\s+key=\{/g, '<tr className="h-[52px] border-b border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors" key={');
    tTxt = tTxt.replace(/className="hover:bg-slate-50 dark:hover:bg-white\/5 transition-colors group"/g, 'className="h-[52px] border-b border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group"');
    tTxt = tTxt.replace(/className="[^"]*group hover:bg-slate-50 dark:hover:bg-white\/5 transition-colors cursor-pointer[^"]*"/g, 'className="h-[52px] group border-b border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer"');

    // Solid checkbox style
    tTxt = tTxt.replace(/<input\s+type="checkbox"/g, '<input type="checkbox" className="w-[18px] h-[18px] accent-blue-600 rounded border-slate-300 cursor-pointer"');

    // Numeric right align - check if any numeric columns are specifically targeted.

    fs.writeFileSync(tableFile, tTxt, 'utf8');
    console.log('UI updated for InventoryTable.tsx');
}

let filterBarFile = 'src/app/(app)/inventory/components/InventoryFilterBar.tsx';
if (fs.existsSync(filterBarFile)) {
    let fTxt = fs.readFileSync(filterBarFile, 'utf8');
    fTxt = fTxt.replace(/h-\[40px\]/g, 'h-[44px]');
    fTxt = fTxt.replace(/rounded-\[10px\]/g, 'rounded-[12px]');
    fs.writeFileSync(filterBarFile, fTxt, 'utf8');
    console.log('UI updated for InventoryFilterBar.tsx');
}
