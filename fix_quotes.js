const fs = require('fs');

const files = [
    'src/app/(app)/accounting/reconciliations/[id]/ReconDetailClient.tsx',
    'src/app/(app)/accounting/reconciliations/disputes/DisputesClient.tsx',
    'src/app/(app)/accounting/reconciliations/ReconciliationsClient.tsx',
    'src/app/(app)/payment/page.tsx'
];

files.forEach(file => {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        // Replace \` with `
        content = content.replace(/\\`/g, '`');
        // Replace \$ with $
        content = content.replace(/\\\$/g, '$');
        
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Fixed ${file}`);
    } else {
        console.log(`File not found: ${file}`);
    }
});
