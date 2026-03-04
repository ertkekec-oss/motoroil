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

        // B2B cannot link to /network, /admin, or /hub
        const networkRegex = /(?:href=|push\()(["'`])\/network\b(.*?)(["'`])/g;
        const adminRegex = /(?:href=|push\()(["'`])\/admin\b(.*?)(["'`])/g;
        const hubRegex = /(?:href=|push\()(["'`])\/hub\b(.*?)(["'`])/g;
        let match;

        while ((match = networkRegex.exec(content)) !== null) {
            logError('/network link found in /dealer-network', filePath, match[0]);
        }
        while ((match = adminRegex.exec(content)) !== null) {
            logError('/admin link found in /dealer-network', filePath, match[0]);
        }
        while ((match = hubRegex.exec(content)) !== null) {
            logError('/hub link found in /dealer-network', filePath, match[0]);
        }
    });

    // Checking /admin boundaries
    walkDir(adminPath, (filePath) => {
        if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
        const content = fs.readFileSync(filePath, 'utf8');

        // Admin cannot link to /dealer-network, /network, or /b2b (except shim)
        const dealerRegex = /(?:href=|push\()(["'`])\/dealer-network\b(.*?)(["'`])/g;
        const networkRegex = /(?:href=|push\()(["'`])\/network\b(.*?)(["'`])/g;
        const hubRegex = /(?:href=|push\()(["'`])\/hub\b(.*?)(["'`])/g;
        const b2bRegex = /(?:href=|push\()(["'`])\/b2b\b(.*?)(["'`])/g;
        const staffRegex = /(?:href=|push\()(["'`])\/staff\b(.*?)(["'`])/g;
        let match;

        while ((match = dealerRegex.exec(content)) !== null) {
            logError('/dealer-network link found in /admin', filePath, match[0]);
        }
        while ((match = networkRegex.exec(content)) !== null) {
            logError('/network link found in /admin', filePath, match[0]);
        }
        while ((match = hubRegex.exec(content)) !== null) {
            logError('/hub link found in /admin', filePath, match[0]);
        }
        while ((match = staffRegex.exec(content)) !== null) {
            if (filePath.includes(path.sep + 'b2b' + path.sep)) {
                logError('/staff link found in /admin/b2b', filePath, match[0]);
            }
        }
        while ((match = b2bRegex.exec(content)) !== null) {
            // Check if it's explicitly a redirect shim
            if (content.includes('redirect(')) {
                continue;
            }
            logError('Forbidden /b2b link found in /admin', filePath, match[0]);
        }
    });

    // Sidebar Route Exist Check
    if (fs.existsSync(sidebarPath)) {
        console.log('🔍 Checking Sidebar hrefs against route manifest...');
        const content = fs.readFileSync(sidebarPath, 'utf8');

        // Extract all valid Next.js paths by walking src/app
        const appPath = path.join(process.cwd(), 'src/app');
        const validRoutes = new Set<string>();
        validRoutes.add('/'); // root route assumption
        validRoutes.add('#'); // sometimes empty/anchor

        walkDir(appPath, (filePath) => {
            if (filePath.endsWith('page.tsx') || filePath.endsWith('route.ts')) {
                let routePath = filePath.replace(appPath, '').replace(/\\/g, '/');
                // Remove route groups like /(app)
                routePath = routePath.replace(/\/\([^)]+\)/g, '');
                // Remove page.tsx or route.ts suffix
                routePath = routePath.replace(/\/page\.tsx$/, '').replace(/\/route\.ts$/, '');
                if (routePath === '') routePath = '/';
                validRoutes.add(routePath);

                // Add dynamic route capability (very basic matching pattern for test purposes)
                // If it's a dynamic path like /dealers/[id], let's try to normalize it
                if (routePath.includes('[') && routePath.includes(']')) {
                    const normalizedDynamic = routePath.replace(/\[.*?\]/g, 'DYNAMIC');
                    validRoutes.add(normalizedDynamic);
                }
            }
        });

        // Add some known external/special routes that may not be directly in app dir
        const knownSafeRoutes = [
            '', '/', '#', '/help', '/support', '/support/tickets', '/settings',
            '/settings/branch', '/settings/pricing', '/billing', '/api/auth/logout'
        ];
        knownSafeRoutes.forEach(r => validRoutes.add(r));

        const hrefRegex = /href:\s*(['"`])(.*?)\1/g;
        let match;
        while ((match = hrefRegex.exec(content)) !== null) {
            let href = match[2].trim();
            if (href === '') continue; // allowed empty hrefs mapped in permMap or parent nodes

            // basic dynamic check substitution if any dynamic param is used
            const toCheck = href.replace(/\/[a-f0-9]{24}/g, '/DYNAMIC').replace(/\/[0-9]+/g, '/DYNAMIC');

            // Quick bypass for external or non-app routes if we know them
            if (toCheck.startsWith('http')) continue;

            const exists = validRoutes.has(toCheck) || Array.from(validRoutes).some(r => {
                if (r.includes('DYNAMIC')) {
                    const regexSafe = r.replace(/DYNAMIC/g, '[^/]+');
                    const rTest = new RegExp('^' + regexSafe + '$');
                    return rTest.test(toCheck);
                }
                return false;
            });

            if (!exists) {
                logError('Sidebar link points to non-existent route (404 risk)', sidebarPath, href);
            }
        }
    }

    if (hasError) {
        console.error('\n🚨 TEST FAILED. Namespace boundaries violated.');
        process.exit(1);
    } else {
        console.log('✅ TEST PASSED. All strict namespace boundaries intact.');
        process.exit(0);
    }
}

checkRoutes();
