const fs = require('fs');

const files = [
    "src/app/(admin)/admin/system/notifications/page.tsx",
    "src/app/(admin)/admin/system/mail-logs/page.tsx",
    "src/app/(admin)/admin/signatures/page.tsx",
    "src/app/(admin)/admin/signatures/webhooks/page.tsx",
    "src/app/(admin)/admin/signatures/audit/page.tsx",
    "src/app/(admin)/admin/signatures/templates/page.tsx",
    "src/app/(admin)/admin/signatures/providers/page.tsx",
    "src/app/(admin)/admin/signatures/providers/netgsm/page.tsx",
    "src/app/(admin)/admin/reconciliation/disputes/page.tsx",
    "src/app/(admin)/admin/reconciliation/audit/page.tsx",
    "src/app/(admin)/admin/reconciliation/templates/page.tsx",
    "src/app/(admin)/admin/reconciliation/page.tsx",
    "src/app/(admin)/admin/reconciliation/policies/page.tsx"
];

files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    content = content.replace(/SUPERADMIN/g, 'SUPER_ADMIN').replace(/!== 'ADMIN'/g, "!== 'PLATFORM_ADMIN'");
    fs.writeFileSync(f, content);
});
console.log('Done replacement');
