const fs = require('fs');
const missing = fs.readFileSync('missing.txt', 'utf8').trim();

// 1. Add to page.tsx
let pageCode = fs.readFileSync('src/app/(app)/settings/page.tsx', 'utf8');
pageCode = pageCode.replace('const sharedProps: any = {', 'const sharedProps: any = { ' + missing + ',');
fs.writeFileSync('src/app/(app)/settings/page.tsx', pageCode);

// 2. Add to all components
const formsDir = 'src/app/(app)/settings/_components/forms';
const files = fs.readdirSync(formsDir);
files.forEach(f => {
    let compCode = fs.readFileSync(formsDir + '/' + f, 'utf8');
    compCode = compCode.replace('const { activeTab', 'const { ' + missing + ', activeTab');

    // Add missing import for Check icon if needed (since missing.txt has 'Check')
    if (f.includes('CampaignPointsPanel')) {
        compCode = `import { Check } from 'lucide-react';\n` + compCode;
    }
    fs.writeFileSync(formsDir + '/' + f, compCode);
});
console.log('Fixed missing variables in page.tsx and all 15 components.');
