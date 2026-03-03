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

function replaceInFile(filePath) {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
    let content = fs.readFileSync(filePath, 'utf8');

    // We only replace /network/ followed by buyer|seller|finance|payouts|earnings|trust-score|stock-risks|payments
    // We do NOT replace /api/network/...
    const regex = /\/network\/(seller|buyer|finance|payouts|earnings|trust-score|stock-risks|payments)/g;

    if (regex.test(content)) {
        console.log('Updating:', filePath);
        content = content.replace(regex, '/hub/$1');
        fs.writeFileSync(filePath, content, 'utf8');
    }
}

const targetPath = path.join(__dirname, 'src');
walkDir(targetPath, replaceInFile);
console.log('Replacement complete.');
