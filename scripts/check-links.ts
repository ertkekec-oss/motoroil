import fs from 'fs';
import path from 'path';

function walkDir(dir: string, callback: (path: string) => void) {
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

function checkRoutes() {
    console.log('🔍 Checking links and strict namespaces...');
    const srcPath = path.join(process.cwd(), 'src');
    const adminPath = path.join(process.cwd(), 'src/app/(app)/admin');
    const b2bPath = path.join(process.cwd(), 'src/app/(app)/dealer-network');
    const staffPath = path.join(process.cwd(), 'src/app/(app)/staff');
    const sidebarPath = path.join(process.cwd(), 'src/components/Sidebar.tsx');

    let hasError = false;

    // Helper to log errors
    const logError = (msg: string, file: string, match: string) => {
        console.error(`❌ ERROR: ${msg}`);
        console.error(`   File: ${file}`);
        console.error(`   Match: ${match}`);
        hasError = true;
    };

    // Global /b2b/ link check
    walkDir(srcPath, (filePath) => {
        if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
        const content = fs.readFileSync(filePath, 'utf8');

        // Check for /b2b links outside of redirect shims
        const b2bRegex = /(?:href=|push\()(["'`])\/b2b\b(.*?)(["'`])/g;
        let match;
        while ((match = b2bRegex.exec(content)) !== null) {
            // Ignore if it's explicitly a redirect shim in app/b2b or app/(app)/b2b
            if (filePath.includes(path.sep + 'b2b' + path.sep) && content.includes('redirect(')) {
                continue; // Allow redirect shims
            }
            logError('Global forbidden /b2b link found', filePath, match[0]);
        }
    });

    // Sidebar specifically should not have /network link
    if (fs.existsSync(sidebarPath)) {
        const content = fs.readFileSync(sidebarPath, 'utf8');
        const networkRegex = /(?:href=|push\()(["'`])\/network\b(.*?)(["'`])/g;
        let match;
        while ((match = networkRegex.exec(content)) !== null) {
            logError('/network/ link found in Sidebar', sidebarPath, match[0]);
        }
    }

    // Checking /staff boundaries
    walkDir(staffPath, (filePath) => {
        if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
        const content = fs.readFileSync(filePath, 'utf8');

        const dealerRegex = /(?:href=|push\()(["'`])\/dealer-network\b(.*?)(["'`])/g;
        const hubRegex = /(?:href=|push\()(["'`])\/hub\b(.*?)(["'`])/g;

        let match;
        while ((match = dealerRegex.exec(content)) !== null) {
            logError('/dealer-network link found in /staff', filePath, match[0]);
        }
        while ((match = hubRegex.exec(content)) !== null) {
            logError('/hub link found in /staff', filePath, match[0]);
        }
    });

    // Checking /dealer-network boundaries
    walkDir(b2bPath, (filePath) => {
        if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
        const content = fs.readFileSync(filePath, 'utf8');

        const networkRegex = /(?:href=|push\()(["'`])\/network\b(.*?)(["'`])/g;
        let match;
        while ((match = networkRegex.exec(content)) !== null) {
            logError('/network link found in /dealer-network', filePath, match[0]);
        }
    });

    // Checking /admin boundaries
    walkDir(adminPath, (filePath) => {
        if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
        const content = fs.readFileSync(filePath, 'utf8');

        const dealerRegex = /(?:href=|push\()(["'`])\/dealer-network\b(.*?)(["'`])/g;
        let match;
        while ((match = dealerRegex.exec(content)) !== null) {
            logError('/dealer-network link found in /admin', filePath, match[0]);
        }
    });

    if (hasError) {
        console.error('\n🚨 TEST FAILED. Namespace boundaries violated.');
        process.exit(1);
    } else {
        console.log('✅ TEST PASSED. All strict namespace boundaries intact.');
        process.exit(0);
    }
}

checkRoutes();
