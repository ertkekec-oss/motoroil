const fs = require('fs');
const path = require('path');

function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walkDir(fullPath));
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            results.push(fullPath);
        }
    });
    return results;
}

const allFiles = walkDir('src/app');

let count = 0;
for (const file of allFiles) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Hedef: if (!perms.includes("network_buy") && user.role !== "SUPER_ADMIN" && user.role !== "admin")
    content = content.replace(/user\.role\s*!==\s*["']SUPER_ADMIN["']\s*&&\s*user\.role\s*!==\s*["']admin["']/g, 
        'user.role !== "SUPER_ADMIN" && user.role !== "admin" && user.role !== "OWNER"');

    // Also the API routes doing `user.role !== "SUPER_ADMIN"` without admin
    content = content.replace(/user\.role\s*!==\s*["']SUPER_ADMIN["']\s*\)/g, 
        'user.role !== "SUPER_ADMIN" && user.role !== "OWNER")');

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log("Patched", file);
        count++;
    }
}
console.log(`Patched ${count} files.`);
