const fs = require('fs');
const glob = require('glob');

function enforceDesign(filePath) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // 1. CARDS
    // Replace legacy cards: 'card glass', 'bg-white/5', 'bg-black/20' etc. with standard Enterprise Card
    // The standard: padding 32px (p-8), radius 20px (rounded-[20px]), white/dark mode solid.
    content = content.replace(/className=["']([^"']*)card glass([^"']*)["']/g,
        'className="$1bg-white dark:bg-[#111827] rounded-[20px] p-8 border border-slate-200 dark:border-slate-800 shadow-sm transition-all$2"');

    // Remove decorative background glows (blur-3xl)
    content = content.replace(/<div className=["'][^"']*blur-3xl[^"']*["'][^>]*>\s*<\/div>/g, '');

    // Eliminate heavy highlights / backgrounds on wrapper elements
    content = content.replace(/bg-\[\#f27a1a\]\/5/g, 'bg-slate-50 dark:bg-slate-800/30');
    content = content.replace(/bg-gradient-to-[a-z]+ from-[^\s]+ to-[^\s]+/g, '');

    // 2. BUTTONS 
    // Turuncu -> Gitti, Heavy Red -> Danger Outline, Primary -> Blue 600
    // Fix Primary (btn-primary, bg-primary, etc)
    content = content.replace(/className=["']([^"']*)bg-primary([^"']*)["']/g,
        'className="$1bg-blue-600 hover:bg-blue-700 text-white shadow-sm$2"');
    content = content.replace(/className=["']([^"']*)btn btn-primary([^"']*)["']/g,
        'className="$1px-6 h-[44px] rounded-[14px] font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white transition-all flex items-center justify-center gap-2 active:scale-95 shadow-sm outline-none$2"');

    // Danger Buttons (Solid Red to Outline Red)
    content = content.replace(/bg-red-500 hover:bg-red-600 text-white/g,
        'bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-500 hover:bg-red-100 dark:hover:bg-red-500/30');
    content = content.replace(/bg-red-500\/10/g, 'bg-red-50 dark:bg-red-500/10');
    content = content.replace(/text-red-400/g, 'text-red-600 dark:text-red-500');

    // Outline / Ghost / Secondary buttons
    content = content.replace(/btn btn-outline/g, 'px-6 h-[44px] rounded-[14px] font-bold text-sm bg-transparent border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2');
    content = content.replace(/btn btn-ghost/g, 'px-6 h-[44px] rounded-[14px] font-bold text-sm bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-none border border-transparent flex items-center justify-center gap-2');

    // 3. FORMS (Inputs, Textarea, Select)
    // Standarize all tailwind form inputs to -> Height 44px, Radius 12px, border subtle, focus ring 2px blue
    const inputStyle = "w-full h-[44px] px-[12px] bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-[12px] text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all outline-none";
    content = content.replace(/className=["']([^"']*?)(?:w-full h-12 bg-white\/5 border border-white\/10 rounded-xl px-4 text-sm text-white focus:border-primary\/50)[^"']*?["']/g, `className="$1${inputStyle}"`);
    content = content.replace(/className=["']([^"']*?)(?:w-full h-12 bg-white\/5 border border-white\/10 rounded-xl px-4 text-xs text-white focus:border-\[\#[0-9a-fA-F]+\]\/50)[^"']*?["']/g, `className="$1${inputStyle}"`);

    const textareaStyle = "w-full p-[12px] bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-[12px] text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all outline-none resize-y";
    content = content.replace(/<textarea([^>]*?)className=["'][^"']*?["']/g, `<textarea$1className="${textareaStyle}"`);

    const selectStyle = "w-full h-[44px] px-[12px] bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-[12px] text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all outline-none appearance-none cursor-pointer";
    content = content.replace(/<select([^>]*?)className=["'][^"']*?["']/g, `<select$1className="${selectStyle}"`);

    // Numeric inputs right aligned (Requirement: KDV & Vergiler Numeric input right aligned)
    content = content.replace(/type="number"\s+className="/g, 'type="number" className="text-right ');

    // Tables: standard
    // Row height 52px, Sticky header, Uppercase small header, Hover subtle tint, No zebra striping
    content = content.replace(/<thead[^>]*>/g, '<thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800">');
    content = content.replace(/<th[^>]*className=["']([^"']*)["'][^>]*>/g, '<th className="h-[52px] px-6 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap $1">');
    content = content.replace(/<tr([^>]*)className=["']([^"']*)hover:bg-white\/5([^"']*)["']/g, '<tr$1className="$2hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors$3"');

    // Spacing Discipline
    // Section gap: 32px (gap-8 is 32px)
    // Card padding: 32px (p-8 is 32px) => handled above
    // Space-y-6 inside cards might need to be form row gap 16px (space-y-4)
    content = content.replace(/space-y-6/g, 'space-y-4');

    // Modals:
    // Enterprise modal (replace old glass modal)
    content = content.replace(/className=["']([^"']*)bg-\[\#0B1120\] border border-white\/10([^"']*)["']/g,
        'className="$1bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-2xl$2"');

    // Switch/Checkbox
    // Make toggles blue active instead of primary/green
    content = content.replace(/bg-emerald-500/g, 'bg-blue-600');
    content = content.replace(/accent-primary/g, 'accent-blue-600');
    content = content.replace(/text-emerald-400/g, 'text-blue-600 dark:text-blue-500');
    content = content.replace(/text-emerald-500/g, 'text-blue-600 dark:text-blue-500');
    content = content.replace(/border-emerald-500\/20/g, 'border-blue-500/20');
    content = content.replace(/bg-emerald-500\/10/g, 'bg-blue-500/10');

    // Remove gradients
    content = content.replace(/\bbg-gradient-to-[a-z]+ from-[\w\-\/]+ to-[\w\-\/]+\b/g, 'bg-slate-50 dark:bg-slate-800/30');

    if (original !== content) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed Enterprise standard for:', filePath);
    }
}

const files = glob.sync('src/app/(app)/settings/**/*.tsx');
files.push('src/components/IntegrationsContent.tsx');
files.forEach(enforceDesign);
