const fs = require('fs');

const logPath = 'tsc-err-utf8-4.log';
if (!fs.existsSync(logPath)) {
    console.log('Log file not found:', logPath);
    process.exit(1);
}

const logContent = fs.readFileSync(logPath, 'utf8');

// The TS error prints paths with unicode escapes like \u00FC
// We can find all lines with 'typeof import('
const matchRegex = /typeof import\("([^"]+)"\)/g;
const matches = [...logContent.matchAll(matchRegex)].map(m => m[1]);

// Distinct paths
const modulePaths = [...new Set(matches)];

// Some paths come with unicode escapes, let's unescape them
function unescapeUnicode(str) {
    return str.replace(/\\u([0-9a-fA-F]{4})/g, (match, grp) => {
        return String.fromCharCode(parseInt(grp, 16));
    });
}

function processFile(filePath) {
    console.log('Processing:', filePath);
    let content = '';
    try {
        content = fs.readFileSync(filePath, 'utf8');
    } catch (err) {
        console.log('Failed to read:', filePath, err.message);
        return;
    }

    let modified = false;

    // Let's target various patterns for `params` usage in Next.js App Router route.ts files
    // Most common: `export async function GET(req: NextRequest, { params }: { params: { id: string } })`
    // We want to replace `{ params }: [anything]` with `context: any` 
    // and insert `const params = await context.params;` at the start of the function body.

    const funcRegex = /(export(?:\s+async)?\s+function\s+[A-Z]+\s*\(\s*req\s*:\s*NextRequest\s*,\s*[^)]*?)\{*\s*params\s*\}*[^)]*(\)\s*\{)/g;

    content = content.replace(funcRegex, (match, p1, p2) => {
        modified = true;
        // Replace the params part with context. Then inject the await inside the block.
        // Since we can't reliably parse the parameter types with simple regex, just use `context: any`
        // However, the signature already contains `req: NextRequest`, so we just replace the second argument.
        // Example: `export async function GET(req: NextRequest, { params }: { params: { id: string } }) {`
        // Becomes: `export async function GET(req: NextRequest, context: any) { \n const params = await context.params;`
        return p1.substring(0, p1.lastIndexOf(',')) + ', context: any' + p2 + '\n    const params = await context.params;';
    });

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('-> MODIFIED:', filePath);
    } else {
        console.log('-> No match found for modification rules.');
    }
}

for (let p of modulePaths) {
    // Unescape
    let localPath = unescapeUnicode(p);
    // TS might output a .ts file or just the route directory. If it doesn't end in .ts or .tsx, assume it's the module import.
    if (!localPath.endsWith('.ts') && !localPath.endsWith('.tsx')) {
        localPath += '.ts';
    }
    if (fs.existsSync(localPath)) {
        processFile(localPath);
    } else {
        localPath = localPath + 'x'; // try .tsx
        if (fs.existsSync(localPath)) processFile(localPath);
        else console.log('File not found corresponding to path:', localPath);
    }
}

console.log('Done.');
