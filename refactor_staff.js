const fs = require('fs');

const file = 'src/components/StaffManagementContent.tsx';
let txt = fs.readFileSync(file, 'utf8');

// 1. Clean Orange Colors
txt = txt.replace(/text-orange-(400|500|600)/g, 'text-blue-600');
txt = txt.replace(/bg-orange-(400|500|600)/g, 'bg-blue-600 hover:bg-blue-700');
txt = txt.replace(/border-orange-(400|500|600)/g, 'border-blue-600');
txt = txt.replace(/'#FF5500'|"#FF5500"/gi, "'#2563eb'");
txt = txt.replace(/rgba\(255,\s*85,\s*0,/gi, 'rgba(37, 99, 235,');

// 2. Adjust Modal Radii
txt = txt.replace(/borderRadius:\s*'24px'/g, "borderRadius: '24px'");

// 3. Tab Styles Redesign
// Previous tab styles often had big pills. Let's find specific tab loops or active checks.
// Actually, it's safer to just inject some classes instead of strict string replacement for tabs,
// or let's use regex to replace activeTab pills.
txt = txt.replace(/activeTab === '([^']+)' \? 'var\(--text-main, #fff\)' : 'var\(--text-muted, rgba\(255,255,255,0\.4\)\)'/g, "activeTab === '$1' ? 'var(--text-main, #fff)' : 'var(--text-muted, rgba(255,255,255,0.4))'");
txt = txt.replace(/activeTab === '([^']+)' \? 'rgba\(255,255,255,0\.15\)' : 'transparent'/g, "activeTab === '$1' ? 'transparent' : 'transparent'");

// We want bottom borders instead of background fills for tabs.
// Let's replace the tab style block:
txt = txt.replace(/<div style=\{\{\s*display: 'flex',\s*gap: '8px',\s*background: 'var\(--bg-panel, rgba\(255,255,255,0\.02\)\)',\s*padding: '6px',\s*borderRadius: '16px',\s*overflowX: 'auto',\s*whiteSpace: 'nowrap',\s*border: '1px solid var\(--border-color, rgba\(255,255,255,0\.05\)\)'\s*\}\}>/g,
    `<div className="flex border-b border-slate-200 dark:border-white/10 whitespace-nowrap overflow-x-auto h-[48px] items-end gap-6 px-2 mb-6 w-full custom-scroll">`);

// Replace individual tab button styles
const tabRegex = /<button\s+onClick=\{\(\) => setActiveTab\('([^']+)'\)\}\s+style=\{\{\s*padding: '12px 24px',\s*borderRadius: '12px',\s*background: activeTab === '[^']+' \? 'rgba\(255,255,255,0\.15\)' : 'transparent',\s*color: activeTab === '[^']+' \? 'var\(--text-main, #fff\)' : 'var\(--text-muted, rgba\(255,255,255,0\.4\)\)',\s*border: 'none',\s*cursor: 'pointer',\s*fontWeight: activeTab === '[^']+' \? '700' : '500',\s*fontSize: '14px',\s*transition: 'all 0\.2s',\s*display: 'flex',\s*alignItems: 'center',\s*gap: '8px'\s*\}\}\s*className="hover:bg-white\/5"\s*>/g;

txt = txt.replace(tabRegex, (match, tabId) => {
    return `<button onClick={() => setActiveTab('${tabId}')} className={\`h-full px-2 text-[14px] font-semibold transition-all duration-300 flex items-center justify-center gap-2 border-b-2 \${activeTab === '${tabId}' ? "border-blue-600 text-blue-600 dark:text-blue-400" : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"}\`}>`;
});


// 4. Update Inputs and Buttons to Enterprise Standard
txt = txt.replace(/padding:\s*'12px\s*16px'/gi, "padding: '10px 16px'");
txt = txt.replace(/borderRadius:\s*'8px'/gi, "borderRadius: '12px'");
txt = txt.replace(/borderRadius:\s*'12px'/gi, "borderRadius: '12px'");
txt = txt.replace(/height:\s*'48px'/gi, "height: '44px'");
txt = txt.replace(/borderRadius:\s*'6px'/gi, "borderRadius: '12px'");


// 5. Replace inline styles for tables
txt = txt.replace(/borderBottom:\s*'1px\s*solid\s*rgba\(255,255,255,0\.05\)'/gi, "borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.05))'");
txt = txt.replace(/padding:\s*'16px'/gi, "padding: '16px'");


// 6. Convert inline cards to tailwind Enterprise blue/white/dark standards where possible
txt = txt.replace(/background:\s*'rgba\(255,255,255,0\.02\)'/g, "background: 'var(--bg-card, rgba(255,255,255,0.02))'");
txt = txt.replace(/border:\s*'1px\s*solid\s*rgba\(255,255,255,0\.05\)'/g, "border: '1px solid var(--border-main, rgba(255,255,255,0.05))'");


// We are saving it.
fs.writeFileSync(file, txt, 'utf8');
console.log('Staff refactored');
