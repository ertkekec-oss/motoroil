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
        } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.css')) {
            results.push(file);
        }
    });
    return results;
}

const files = processDir('src');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    content = content.replace(/backdrop-blur-\[.*?\]/g, '');
    content = content.replace(/backdrop-blur-[a-z0-9]+/g, '');
    content = content.replace(/backdrop-blur/g, '');
    // Replace html inline style
    content = content.replace(/style="[^"]*backdrop-filter:\s*blur\([^)]+\)[^"]*"/g, '');

    // The user mentioned an inline style specifically in html string format or in partial render
    content = content.replace(/<header class="show-mobile" style=".*?"/g, '<header className="show-mobile"');

    // Remove any leftover shadow-lg, xl, md globally
    content = content.replace(/shadow-xl/g, 'shadow-sm');
    content = content.replace(/shadow-lg/g, 'shadow-sm');
    content = content.replace(/shadow-md/g, 'shadow-sm');

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
    }
});

console.log('Final global shell edge cases cleaned up.');
