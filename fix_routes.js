const fs = require('fs');
const path = require('path');

const srcDir = 'c:/Users/ertke/OneDrive/Masaüstü/periodya/muhasebeapp/motoroil/src/app/api';

function walkDir(dir, callback) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
        const fullPath = path.join(dir, f);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath, callback);
        } else {
            callback(fullPath);
        }
    }
}

walkDir(srcDir, (filePath) => {
    if (filePath.endsWith('route.ts')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let original = content;

        // Fix params: Promise<{ id: string }> in Next 15
        content = content.replace(/\{ params \}: \{ params: \{ ([^}]+) \} \}/g, '{ params }: any');

        // Fix withIdempotency(idempotencyKey, 'PLATFORM_ADMIN', async () =>
        if (content.includes('withIdempotency(idempotencyKey,')) {
            content = content.replace(
                /await withIdempotency\(idempotencyKey,\s*'PLATFORM_ADMIN',\s*async \(\) => \{/g,
                "await withIdempotency(prisma, idempotencyKey, 'ADMIN_ACTION', 'PLATFORM_ADMIN', async () => {"
            );
            // Ensure prisma is imported
            if (!content.includes('import prisma')) {
                content = "import prisma from '@/lib/prisma';\n" + content;
            }
        }

        if (content !== original) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log('Fixed', filePath);
        }
    }
});
