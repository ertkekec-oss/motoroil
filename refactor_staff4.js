const fs = require('fs');

const file = 'src/components/StaffManagementContent.tsx';
let txt = fs.readFileSync(file, 'utf8');

// Modals Base (bg-[#0f111a] to bg-white dark:bg-[#0f172a])
txt = txt.replace(/bg-\[#0f111a\]/gi, "bg-white dark:bg-[#0f172a]");

// Replace Inputs and Selects (h-11 -> h-[44px], rounded-xl -> rounded-[12px]) 
// text-white -> text-slate-900 dark:text-white
txt = txt.replace(/h-11/g, "h-[44px]");
txt = txt.replace(/rounded-xl/g, "rounded-[12px]");

// Modal borders and shadows
txt = txt.replace(/shadow-blue\/20/g, "shadow-sm");
txt = txt.replace(/shadow-blue\/40/g, "shadow-md");
txt = txt.replace(/border-blue-500\/30\/50/g, "border-blue-500");
txt = txt.replace(/border-blue-500\/30\/20/g, "border-slate-200 dark:border-slate-800");
txt = txt.replace(/border-blue-500\/30/g, "border-blue-500/50");

// Convert custom classes on specific inputs
const inputRegex = /<input([^>]+)className="([^"]+)"([^>]*)>/g;
txt = txt.replace(inputRegex, (match, prefix, classList, suffix) => {
    let newClassList = classList.replace(/rounded-lg/g, 'rounded-[12px]')
        .replace(/bg-white\/10/g, 'bg-slate-50 dark:bg-slate-800/50')
        .replace(/border-white\/5/g, 'border-slate-200 dark:border-slate-800');
    return `<input${prefix}className="${newClassList}"${suffix}>`;
});

const selectRegex = /<select([^>]+)className="([^"]+)"([^>]*)>/g;
txt = txt.replace(selectRegex, (match, prefix, classList, suffix) => {
    let newClassList = classList.replace(/rounded-lg/g, 'rounded-[12px]')
        .replace(/bg-white\/10/g, 'bg-slate-50 dark:bg-slate-800/50')
        .replace(/border-white\/5/g, 'border-slate-200 dark:border-slate-800');
    return `<select${prefix}className="${newClassList}"${suffix}>`;
});

// Update specific buttons to Enterprise Primary Standard: Blue, h-[44px], rounded-[14px], etc.
// Look for save/submit buttons
txt = txt.replace(/w-full h-12 bg-blue-600 hover:bg-blue-600\/80 text-slate-900 dark:text-white rounded-\[12px\] font-black text-sm tracking-widest/gi,
    "w-full h-[44px] bg-blue-600 hover:bg-blue-700 text-white rounded-[14px] font-semibold text-[14px] transition-all");

txt = txt.replace(/px-8 h-12 rounded-\[12px\] bg-blue-600 text-slate-900 dark:text-white font-black tracking-widest/gi,
    "px-8 h-[44px] rounded-[14px] bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all");

// Adjust text colors
txt = txt.replace(/text-white\/30/g, "text-slate-400 dark:text-slate-500");
txt = txt.replace(/text-white\/40/g, "text-slate-500 dark:text-slate-400");
txt = txt.replace(/text-white\/50/g, "text-slate-500 dark:text-slate-400");
txt = txt.replace(/text-white\/60|text-white\/70|text-white\/80/g, "text-slate-600 dark:text-slate-300");
txt = txt.replace(/text-white/g, "text-slate-900 dark:text-white");

// Fix "text-xs font-black" to "text-[11px] font-semibold tracking-wider" for labels and small headings
txt = txt.replace(/text-xs font-black/gi, "text-[11px] font-semibold tracking-wider");
txt = txt.replace(/text-\[10px\] font-bold/gi, "text-[11px] font-semibold tracking-wider");

// Clean up some left over 2xl radiuses on modals ensuring they are 24px per instructions
txt = txt.replace(/rounded-2xl w-full max-w-md/g, "rounded-[24px] w-full max-w-md");
txt = txt.replace(/rounded-2xl w-full max-w-4xl/g, "rounded-[24px] w-full max-w-4xl");

// Check the target definition (performance tab buttons)
txt = txt.replace(/bg-blue-600 text-slate-900 dark:text-white/g, "bg-blue-600 text-white");

fs.writeFileSync(file, txt, 'utf8');
console.log('Staff refactored 4');
