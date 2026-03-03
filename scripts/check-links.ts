const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

function checkRoutes() {
    console.log('🔍 Checking /admin, /b2b, and /staff directories for forbidden links...');
    const adminPath = path.join(__dirname, '../src/app/admin');
    const b2bPath = path.join(__dirname, '../src/app/(app)/b2b');
    const staffPath = path.join(__dirname, '../src/app/(app)/staff');

    let hasError = false;

    // Check /admin
    walkDir(adminPath, (filePath) => {
        if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
        const content = fs.readFileSync(filePath, 'utf8');

        const regexStaff = /(?:href=|push\()(["'`])\/staff\b(.*?)(["'`])/g;
        let match;
        while ((match = regexStaff.exec(content)) !== null) {
            console.error(`❌ ERROR: Forbidden /staff link found in /admin!`);
            console.error(`   File: ${filePath}`);
            console.error(`   Match: ${match[0]}`);
            hasError = true;
        }
    });

    // Check /b2b
    walkDir(b2bPath, (filePath) => {
        if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
        const content = fs.readFileSync(filePath, 'utf8');

        const regexAdmin = /(?:href=|push\()(["'`])\/admin\b(.*?)(["'`])/g;
        const regexStaff = /(?:href=|push\()(["'`])\/staff\b(.*?)(["'`])/g;

        let matchA;
        while ((matchA = regexAdmin.exec(content)) !== null) {
            console.error(`❌ ERROR: Forbidden /admin link found in /b2b!`);
            console.error(`   File: ${filePath}`);
            console.error(`   Match: ${matchA[0]}`);
            hasError = true;
        }

        let matchS;
        while ((matchS = regexStaff.exec(content)) !== null) {
            console.error(`❌ ERROR: Forbidden /staff link found in /b2b!`);
            console.error(`   File: ${filePath}`);
            console.error(`   Match: ${matchS[0]}`);
            hasError = true;
        }
    });

    // Check /staff
    walkDir(staffPath, (filePath) => {
        if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
        const content = fs.readFileSync(filePath, 'utf8');

        const regexB2b = /(?:href=|push\()(["'`])\/b2b\b(.*?)(["'`])/g;

        let match;
        while ((match = regexB2b.exec(content)) !== null) {
            console.error(`❌ ERROR: Forbidden /b2b link found in /staff!`);
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
