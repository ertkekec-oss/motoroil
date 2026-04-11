const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(fullPath)); 
        } else if (file.endsWith('.tsx')) { 
            results.push(fullPath); 
        }
    });
    return results;
}

const allFiles = [
    ...walk('src/app/(app)/reports'),
    ...walk('src/components/reports')
];

let updatedCount = 0;

allFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Remove gradients
    content = content.replace(/bg-gradient-to-[a-z]+ from-[-A-Za-z0-9\/]+ to-[-A-Za-z0-9\/]+/g, '');
    content = content.replace(/<div className="absolute inset-0 bg-gradient-[^"]+"><\/div>/g, '');

    // Standardize borders and corners
    content = content.replace(/rounded-3xl/g, 'rounded-[20px]');
    content = content.replace(/rounded-\[24px\]/g, 'rounded-[20px]');
    content = content.replace(/border-[a-zA-Z]+-\d+\/\d+ dark:border-[a-zA-Z]+-\d+\/\d+/g, 'border-slate-200 dark:border-white/5');
    content = content.replace(/border-[a-zA-Z]+-500\/\d+/g, 'border-slate-200');

    // Fix remaining messy classes safely (only replace these exactly if they exist on their own or with spaces)
    content = content.replace(/\s+relative overflow-hidden\s+/g, ' ');
    content = content.replace(/\s+relative z-10\s+/g, ' ');

    if (content !== original) {
        fs.writeFileSync(file, content);
        updatedCount++;
    }
});

console.log('Updated ' + updatedCount + ' files.');
