const cp = require('child_process');
const cmds = [
    'git checkout HEAD~1 -- src/app/(app)/admin/ops/orders/page.tsx',
    'git checkout HEAD~1 -- src/app/(app)/admin/ops/providers/page.tsx',
    'git checkout HEAD~1 -- src/app/(app)/admin/ops/shipments/page.tsx',
    'git checkout HEAD~1 -- src/app/(app)/admin/payments-escrow/audit/page.tsx',
    'git checkout HEAD~1 -- src/app/(app)/admin/payments-escrow/commissions/page.tsx',
    'git checkout HEAD~1 -- src/app/(app)/admin/payments-escrow/policies/page.tsx',
    'git checkout HEAD~1 -- src/app/(app)/admin/payments-escrow/providers/page.tsx'
];
cmds.forEach(cmd => {
    try {
        cp.execSync(cmd);
        console.log('Restored using:', cmd);
    } catch (e) {
        console.error('Failed:', cmd);
    }
});
