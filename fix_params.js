const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
    });
}

walk('src/app/api', function (filePath) {
    if (filePath.endsWith('.ts')) {
        let content = fs.readFileSync(filePath, 'utf8');

        // Note the robust regex
        const sigRegex = /export\s+async\s+function\s+([A-Z]+)\s*\(([^,]+),\s*\{\s*params\s*\}\s*:\s*\{\s*params\s*:\s*\{\s*([^}]+?)\s*;?\s*\}\s*;?\s*\}\s*\)/g;

        let changed = false;
        content = content.replace(sigRegex, (match, method, req, paramProps) => {
            changed = true;
            let cleanedProps = paramProps.trim();
            return `export async function ${method}(${req}, { params }: { params: Promise<{ ${cleanedProps} }> })`;
        });

        if (changed) {
            // Find `params.<something>` and replace with `(await params).<something>`
            content = content.replace(/params\.([a-zA-Z0-9_]+)/g, '(await params).$1');
            fs.writeFileSync(filePath, content, 'utf8');
            console.log('Updated ' + filePath);
        }
    }
});
