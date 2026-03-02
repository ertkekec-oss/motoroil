const fs = require('fs');
const path = require('path');

function processDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(processDir(file));
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            results.push(file);
        }
    });
    return results;
}

const files = processDir('src/app/(app)/settings');
files.push('src/components/IntegrationsContent.tsx');
files.push('src/components/ui/enterprise/index.tsx');

files.forEach(file => {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');

        // 1) NO INLINE STYLES ALLOWED (STRICT MODE)
        // This regex removes the entire style={{ ... }} tag. 
        content = content.replace(/\s*style=\{\{[\s\S]*?\}\}/g, '');

        // 2) Remove any remaining rgba(.., 0.x) transparent backgrounds
        content = content.replace(/rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*0\.\d+\s*\)/g, "'transparent'");

        // 3) Just in case there's any blur/backdrop in standard classes
        content = content.replace(/backdrop-filter/g, '');
        content = content.replace(/backdrop-blur-[a-z0-9]+/g, '');
        content = content.replace(/blur-\[.*\]/g, '');
        content = content.replace(/blur-[a-z0-9]+/g, '');
        content = content.replace(/linear-gradient[^\)]+\)/g, "'none'");
        content = content.replace(/radial-gradient[^\)]+\)/g, "'none'");

        // 4) Shadow resets
        content = content.replace(/shadow-xl/g, 'shadow-sm');
        content = content.replace(/shadow-lg/g, 'shadow-sm');
        content = content.replace(/shadow-md/g, 'shadow-sm');

        // 5) Custom radius reset
        content = content.replace(/rounded-\[12px\]/g, 'rounded-xl');
        content = content.replace(/rounded-\[14px\]/g, 'rounded-xl');
        content = content.replace(/rounded-\[16px\]/g, 'rounded-2xl');
        content = content.replace(/rounded-\[20px\]/g, 'rounded-2xl');
        code = content.replace(/rounded-\[24px\]/g, 'rounded-2xl');

        // Clean out page.tsx_partial as it might cause confusion
        if (file.includes('page.tsx_partial')) {
            // let's ignore or delete it later, actually let's skip it
        } else {
            fs.writeFileSync(file, content, 'utf8');
        }
    }
});
console.log('Strict mode applied over files successfully!');
