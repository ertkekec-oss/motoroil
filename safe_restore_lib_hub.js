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

function safeRestoreLibInFile(filePath) {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
    let content = fs.readFileSync(filePath, 'utf8');

    if (content.includes('@/lib/hub/')) {
        console.log('Replacing @/lib/hub/ with @/lib/network/ in:', filePath);
        content = content.split('@/lib/hub/').join('@/lib/network/');
        fs.writeFileSync(filePath, content, 'utf8');
    }
}

const targetPath = path.join(__dirname, 'src');
walkDir(targetPath, safeRestoreLibInFile);
console.log('Lib Restore properly complete.');
