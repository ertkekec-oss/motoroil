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

function restoreApiInFile(filePath) {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
    let content = fs.readFileSync(filePath, 'utf8');

    const regex = /\/api\/hub\/(seller|buyer|finance|payouts|earnings|trust-score|stock-risks|payments)/g;

    if (regex.test(content)) {
        console.log('Restoring API path in:', filePath);
        content = content.replace(regex, '/api/network/$1');
        fs.writeFileSync(filePath, content, 'utf8');
    }
}

const targetPath = path.join(__dirname, 'src');
walkDir(targetPath, restoreApiInFile);
console.log('API Restore complete.');
