const fs = require('fs');

const file = 'src/app/(app)/reports/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace card dark backgrounds
content = content.replace(/dark:bg-slate-900/g, 'dark:bg-[#0f172a]');

// Replace card dark borders
content = content.replace(/dark:border-slate-800/g, 'dark:border-white/5');

// Update internal styles relying on var(--bg-card) etc.
content = content.replace(/background: 'var\(--bg-card\)'/g, 'background: ""');

// Let's replace inline var(--bg-card) with Tailwind if we can, 
// actually the easiest way is to just let the script remove or replace it
content = content.replace(/style={{ background: 'var\(--bg-card\)',/g, 'className="bg-white dark:bg-[#0f172a]" style={{');
content = content.replace(/background: 'var\(--bg-deep\)'/g, 'background: "#1e293b"');
content = content.replace(/border: '1px solid var\(--border-light\)'/g, ''); // we'll rely on global border or we add class

fs.writeFileSync(file, content);
console.log('Fixed reports content');
