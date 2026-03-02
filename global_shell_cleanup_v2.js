const fs = require('fs');
const path = require('path');

function processDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(processDir(file));
        } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.css') || file.endsWith('.bak')) {
            results.push(file);
        }
    });
    return results;
}

const files = processDir('src');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // 1. CSS backdrop-filter removal
    content = content.replace(/backdrop-filter:[^;]+;/g, '');
    content = content.replace(/backdrop-filter:[^;]+!important;/g, '');
    content = content.replace(/-webkit-backdrop-filter:[^;]+;/g, '');

    // 2. Inline style backdropFilter removal
    content = content.replace(/,\s*backdropFilter:\s*['"][^'"]+['"]/g, '');
    content = content.replace(/backdropFilter:\s*['"][^'"]+['"]\s*,?/g, '');

    // 3. Tailwind backdrop-filter / blur class removal
    content = content.replace(/\bbackdrop-filter\b/g, '');
    content = content.replace(/\bbackdrop-blur-[a-z0-9]+\b/g, '');
    content = content.replace(/\bblur-[a-z0-9]+\b/g, '');
    content = content.replace(/\bbackdrop-blur-\[[^\]]+\]\b/g, '');
    content = content.replace(/\bblur-\[[^\]]+\]\b/g, '');

    // 4. shadow-lg, shadow-md, shadow-xl 
    content = content.replace(/\bshadow-xl\b/g, 'shadow-sm');
    content = content.replace(/\bshadow-lg\b/g, 'shadow-sm');
    content = content.replace(/\bshadow-md\b/g, 'shadow-sm');

    // Removing some specific ones seen in grep output
    content = content.replace(/\bshadow-blue-500\/20\b/g, '');
    content = content.replace(/\bshadow-orange-[0-9]+\/[0-9]+\b/g, '');
    content = content.replace(/\bshadow-rose-[0-9]+\/[0-9]+\b/g, '');
    content = content.replace(/\bshadow-emerald-[0-9]+\/[0-9]+\b/g, '');

    // 5. Replace mobile header backgrounds
    // bg-white/50, 60, 70
    content = content.replace(/\bbg-white\/[567]0\b/g, 'bg-white dark:bg-slate-900');
    content = content.replace(/\bbg-white\/95\b/g, 'bg-white dark:bg-slate-900');
    // mobile header inline style 
    content = content.replace(/style=\{\{\s*backdropFilter:\s*'blur\(20px\)'\s*\}\}/g, '');
    content = content.replace(/class="show-mobile" style=".*?"/g, 'className="show-mobile"'); // Note: html class vs className, some are raw html strings

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
    }
});

console.log('Global shell strict cleanup completed on all files.');
