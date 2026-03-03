const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

function checkAdminLinks() {
    console.log('🔍 Checking /admin directory for forbidden /staff links...');
    const adminPath = path.join(__dirname, '../src/app/admin');

    if (!fs.existsSync(adminPath)) {
        console.log('No /admin directory found, skipping.');
        return;
    }

    let hasError = false;

    walkDir(adminPath, (filePath) => {
        if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;

        const content = fs.readFileSync(filePath, 'utf8');
        // Simple regex to catch href="/staff..." avoiding imports and paths starting with /api/staff which are allowed/proxies for now, 
        // wait, the user said "/staff root HR sayfası asla admin'e redirect olmamalı. /admin içinden /staff'e yönlendiren 'Panel' gibi generik link olmamalı"
        // Let's look for href="/staff" or href='/staff'
        const regex = /href=(["'`])\/staff(\/|["'`])/g;

        let match;
        while ((match = regex.exec(content)) !== null) {
            console.error(`❌ ERROR: Forbidden /staff link found in /admin!`);
            console.error(`   File: ${filePath}`);
            console.error(`   Line content matches: href="/staff..."`);
            hasError = true;
        }
    });

    if (hasError) {
        console.error('\n🚨 TEST FAILED. Admin pages must not link to /staff HR pages.');
        process.exit(1);
    } else {
        console.log('✅ TEST PASSED. No /staff links found in /admin pages.');
        process.exit(0);
    }
}

checkAdminLinks();
