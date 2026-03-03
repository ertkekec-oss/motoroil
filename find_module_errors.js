const fs = require('fs');
const content = fs.readFileSync('build_err_hub_utf8.txt', 'utf8');
const lines = content.split('\n');
const errors = [];
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('Module not found')) {
        errors.push(lines.slice(Math.max(0, i - 1), i + 4).join('\n'));
    }
}
fs.writeFileSync('module_errors.txt', errors.join('\n\n---\n\n'), 'utf8');
