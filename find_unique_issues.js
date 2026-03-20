const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

walkDir('src/app/api/network', function(filePath) {
    if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
        const content = fs.readFileSync(filePath, 'utf8');
        // Simple regex to find findUnique({ where: { key1: val1, key2: val2 } })
        // Not perfect, just a heuristic
        if (content.match(/\.findUnique\s*\(\s*\{\s*where\s*:\s*\{[^}]*,[^}]*\}/)) {
            console.log("Found potential issue in:", filePath);
        }
    }
});
