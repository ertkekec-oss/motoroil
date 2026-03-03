const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach(f => {
        const dirPath = path.join(dir, f);
        if (fs.statSync(dirPath).isDirectory()) {
            walkDir(dirPath, callback);
        } else {
            callback(dirPath);
        }
    });
}

function restoreLibInFile(filePath) {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
    let content = fs.readFileSync(filePath, 'utf8');

    // Check if the file imports from '@/lib/hub/...'
    const regex = /@\/lib\/hub\//g;

    if (regex.test(content)) {
        console.log('Restoring lib path in:', filePath);
        content = content.replace(regex, '@/lib/network/');
        fs.writeFileSync(filePath, content, 'utf8');
    }
}

const targetPath = path.join(__dirname, 'src');
walkDir(targetPath, restoreLibInFile);
console.log('Lib Restore complete.');
