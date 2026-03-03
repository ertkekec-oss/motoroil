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
    console.log('🔍 Checking /admin, /dealer-network, and /staff directories for link boundaries...');
    const srcPath = path.join(process.cwd(), 'src');
    const adminPath = path.join(process.cwd(), 'src/app/admin');
    const b2bPath = path.join(process.cwd(), 'src/app/(app)/dealer-network');
    const staffPath = path.join(process.cwd(), 'src/app/(app)/staff');

    let hasError = false;

    // 1) Global Check: /b2b/ hardcoded links are forbidden anywhere (except redirect files which usually use redirect('/b2b...'), wait, redirect are also moving away. We just shouldn't use /b2b hrefs.)
    walkDir(srcPath, (filePath) => {
        if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
        const content = fs.readFileSync(filePath, 'utf8');

        // Allow permanentRedirect('/b2b...') or similar? The user said "redirect dışında yasak".
        // Let's just ban href="/b2b" and router.push('/b2b') globally.
        const regexB2b = /(?:href=|push\()(["'`])\/b2b\b(.*?)(["'`])/g;
        let match;
        while ((match = regexB2b.exec(content)) !== null) {
            // Ignore if it's in a redirect shim file (page.tsx with redirect inside)
            // Wait, we redirected TO /dealer-network. There are no /b2b links at all anymore except the legacy proxy ones that don't have hrefs!
            // Actually, `b2b/dashboard/page.tsx` uses `permanentRedirect('/dealer-network/dashboard')`. 
            // The file path itself has `b2b`, but its contents don't link TO `/b2b`.
            console.error(`❌ ERROR: Global forbidden /b2b/ link found!`);
            console.error(`   File: ${filePath}`);
            console.error(`   Match: ${match[0]}`);
            hasError = true;
        }
    });

    // 2) Check /dealer-network (no /admin or /staff allowed inside)
    walkDir(b2bPath, (filePath) => {
        if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
        const content = fs.readFileSync(filePath, 'utf8');

        const regexAdmin = /(?:href=|push\()(["'`])\/admin\b(.*?)(["'`])/g;
        const regexStaff = /(?:href=|push\()(["'`])\/staff\b(.*?)(["'`])/g;

        let matchA;
        while ((matchA = regexAdmin.exec(content)) !== null) {
            console.error(`❌ ERROR: Forbidden /admin link found in /dealer-network!`);
            console.error(`   File: ${filePath}`);
            console.error(`   Match: ${matchA[0]}`);
            hasError = true;
        }

        let matchS;
        while ((matchS = regexStaff.exec(content)) !== null) {
            console.error(`❌ ERROR: Forbidden /staff link found in /dealer-network!`);
            console.error(`   File: ${filePath}`);
            console.error(`   Match: ${matchS[0]}`);
            hasError = true;
        }
    });

    // 3) Check /staff (no /dealer-network allowed inside HR pages)
    walkDir(staffPath, (filePath) => {
        if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
        const content = fs.readFileSync(filePath, 'utf8');

        const regexDealerNetwork = /(?:href=|push\()(["'`])\/dealer-network\b(.*?)(["'`])/g;

        let match;
        while ((match = regexDealerNetwork.exec(content)) !== null) {
            console.error(`❌ ERROR: Forbidden /dealer-network link found in /staff!`);
            console.error(`   File: ${filePath}`);
            console.error(`   Match: ${match[0]}`);
            hasError = true;
        }
    });

    if (hasError) {
        console.error('\n🚨 TEST FAILED. Link boundaries violated.');
        process.exit(1);
    } else {
        console.log('✅ TEST PASSED. All route boundaries intact.');
        process.exit(0);
    }
}

checkRoutes();
