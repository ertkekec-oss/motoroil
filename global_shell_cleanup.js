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
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            results.push(file);
        }
    });
    return results;
}

const files = processDir('src');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // 1. Remove backdropFilter inline styles completely
    content = content.replace(/,\s*backdropFilter:\s*['"][^'"]+['"]/g, '');
    content = content.replace(/backdropFilter:\s*['"][^'"]+['"]\s*,?/g, '');

    // 2. Remove backdrop-filter in inline styles or css
    content = content.replace(/backdrop-filter:[^;]+;/g, '');

    // 3. Remove tailwind backdrop-filter and blur classes
    content = content.replace(/\bbackdrop-filter\b/g, '');
    content = content.replace(/\bbackdrop-blur-[a-z0-9]+\b/g, '');
    content = content.replace(/\bblur-[a-z0-9]+\b/g, '');
    // Also remove any arbitrary values like backdrop-blur-[20px]
    content = content.replace(/\bbackdrop-blur-\[[^\]]+\]\b/g, '');
    content = content.replace(/\bblur-\[[^\]]+\]\b/g, '');

    // 4. Remove transculent backgrounds like bg-white/50, 60, 70, 80 etc.
    // Replace with solid bg-white or standard variants.
    // For mobile headers, the request was: bg-white dark:bg-slate-900
    // We will do a generic replacement for the problematic translucent ones
    content = content.replace(/\bbg-white\/[5678]0\b/g, 'bg-white dark:bg-slate-900');
    // For dark mode equivalents if any (bg-black/50 etc) we could do similar, 
    // but the prompt asked specifically for bg-white/50, 60, 70
    content = content.replace(/\bbg-white\/[567]0\b/g, 'bg-white dark:bg-slate-900');

    // 5. Replace shadow-md, shadow-lg, shadow-xl with shadow-sm 
    // (Ensure we don't accidentally match shadow-md-something if that exists, but standard is shadow-md)
    content = content.replace(/\bshadow-xl\b/g, 'shadow-sm');
    content = content.replace(/\bshadow-lg\b/g, 'shadow-sm');
    content = content.replace(/\bshadow-md\b/g, 'shadow-sm');
    // Also matching shadow-xl shadow-blue-500/20 etc if any remains, but the class name itself will be replaced.

    // 6. Header/Sidebar specific fixes (Glass removal)
    content = content.replace(/glass-nav/g, 'bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm');
    content = content.replace(/glass/g, 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm');

    // Sometimes mobile header uses specific inline styles. We've removed backdropFilter, 
    // now ensure the background is opaque.
    // "Replace mobile header background with: bg-white dark:bg-slate-900"
    content = content.replace(/backgroundColor:\s*['"]rgba\(255,\s*255,\s*255,\s*0\.\d+\)['"]/g, "backgroundColor: 'var(--bg-primary, #ffffff)'");
    content = content.replace(/backgroundColor:\s*['"]rgba\(15,\s*23,\s*42,\s*0\.\d+\)['"]/g, "backgroundColor: 'var(--bg-primary, #0f172a)'");

    // Replace the specific `style={{ ... backdropFilter: blur(20px); }}` if it's purely a string or JSX.
    // Previous regexes `backdropFilter: 'blur(20px)'` handle the JS object style.

    if (content !== original) {
        // Clean up empty style objects created by replacements: style={{ }} -> removed or simplified.
        content = content.replace(/style=\{\{\s*\}\}/g, '');
        fs.writeFileSync(file, content, 'utf8');
    }
});

console.log('Global shell cleanup completed.');
