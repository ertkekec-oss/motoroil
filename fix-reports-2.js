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

    content = content.replace(/<div className="absolute inset-0  z-0"><\/div>/g, '');
    content = content.replace(/ relative overflow-hidden/g, '');
    content = content.replace(/ relative z-10/g, '');

    if (content !== original) {
        fs.writeFileSync(file, content);
        updatedCount++;
    }
});

console.log('Updated ' + updatedCount + ' files.');
