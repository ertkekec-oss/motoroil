const fs = require('fs');
let code = fs.readFileSync('original_tabs.tsx', 'utf8');

// The original JSX mostly uses `className="..."` or `className={\`...\`}`
// To safely inject, let's use a function that replaces className values.
code = code.replace(/className=\"(.*?)\"/g, "className={`$1`}");

code = code.replace(/card glass/g, "rounded-[20px] ${bgCard}");
code = code.replace(/bg-white\/\[0\.02\]/g, "${bgSurface}");
code = code.replace(/bg-white\/5/g, "${isLight ? 'bg-slate-100' : 'bg-slate-800/50'}");
code = code.replace(/bg-white\/10/g, "${isLight ? 'bg-slate-200' : 'bg-slate-700/50'}");
code = code.replace(/border-white\/5/g, "${borderColor}");
code = code.replace(/border-white\/10/g, "${borderColor}");
code = code.replace(/text-white\/40/g, "${textMuted}");
code = code.replace(/text-white\/30/g, "${textMuted}");
code = code.replace(/text-white\/60/g, "${textMuted}");
code = code.replace(/text-white\/70/g, "${textMuted}");
code = code.replace(/text-white\/80/g, "${textMain}");
code = code.replace(/text-white(?! \?\!)/g, "${textMain}");
code = code.replace(/bg-primary/g, "${isLight ? 'bg-blue-600 ${textMain} hover:bg-blue-700' : 'bg-blue-600 outline-none ${textMain} hover:bg-blue-500'}");
code = code.replace(/text-primary/g, "${isLight ? 'text-blue-700' : 'text-blue-400'}");
code = code.replace(/bg-\[#0f111a\]/g, "${bgCard}");
code = code.replace(/bg-black\/80/g, "bg-black/60");
code = code.replace(/zoom-in/g, "");

// Write out to enterprise_tabs.tsx
fs.writeFileSync('enterprise_tabs.tsx', code);
console.log('enterprise_tabs.tsx generated');
