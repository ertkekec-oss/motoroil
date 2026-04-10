const fs = require('fs');

// Patch 1: app/api/customers/route.ts
const routeFile = 'src/app/api/customers/route.ts';
let c1 = fs.readFileSync(routeFile, 'utf8');

if (!c1.includes('company_default_branch')) {
    // Inject fetch logic inside GET
    c1 = c1.replace(
        "const where: any = { deletedAt: null };",
        `const where: any = { deletedAt: null };
        let defaultBranchString = 'Merkez';
        if (company) {
            const defBranchSetting = await prisma.appSettings.findFirst({ where: { companyId: company.id, key: 'company_default_branch' }});
            if (defBranchSetting && defBranchSetting.value) {
                defaultBranchString = defBranchSetting.value;
            }
        }`
    );

    // Replace fallback string mapped in GET
    c1 = c1.replace(
        "branch: c.branch || 'Merkez',",
        "branch: c.branch || defaultBranchString,"
    );

    // Inject fetch logic inside POST
    c1 = c1.replace(
        "// Final safety check",
        `// Final safety check` // no-op just finding context marker
    );
    c1 = c1.replace(
        `// Genel kategori otomatik seçilsin mi?`,
        `let defaultBranchString = 'Merkez';
        if (targetCompanyId) {
            const defBranchSetting = await prisma.appSettings.findFirst({ where: { companyId: targetCompanyId, key: 'company_default_branch' }});
            if (defBranchSetting && defBranchSetting.value) {
                defaultBranchString = defBranchSetting.value;
            }
        }
        
        // Genel kategori otomatik seçilsin mi?`
    );

    // Replace fallback string mapped in POST schema create
    c1 = c1.replace(
        `branch: branch || 'Merkez',`,
        `branch: branch || defaultBranchString,`
    );

    fs.writeFileSync(routeFile, c1);
    console.log("Patched customers GET/POST route");
}

// Patch 2: app/api/customers/import/route.ts
const importFile = 'src/app/api/customers/import/route.ts';
let c2 = fs.readFileSync(importFile, 'utf8');
if (!c2.includes('company_default_branch')) {
    c2 = c2.replace(
        "export async function POST(request: Request) {",
        "export const dynamic = 'force-dynamic';\nimport { authorize } from '@/lib/auth';\nexport async function POST(request: Request) {"
    );

    c2 = c2.replace(
        "const body = await request.json();",
        `const auth = await authorize();\n        if (!auth.authorized) return auth.response;\n        const body = await request.json();`
    );

    c2 = c2.replace(
        "let successCount = 0;",
        `let successCount = 0;
        let targetCompanyId = auth.user.companyId;
        if (!targetCompanyId) {
            const c = await prisma.company.findFirst({ where: { tenantId: auth.user.tenantId } });
            targetCompanyId = c?.id;
        }

        let defaultBranchString = 'Merkez';
        if (targetCompanyId) {
            const defBranchSetting = await prisma.appSettings.findFirst({ where: { companyId: targetCompanyId, key: 'company_default_branch' }});
            if (defBranchSetting && defBranchSetting.value) {
                defaultBranchString = defBranchSetting.value;
            }
        }
        `
    );

    c2 = c2.replace(
        "categoryId: categoryId",
        "categoryId: categoryId,\n                            branch: defaultBranchString,\n                            companyId: targetCompanyId"
    );

    fs.writeFileSync(importFile, c2);
    console.log("Patched customers import route");
}
