const fs = require('fs');

let c = fs.readFileSync('src/app/api/admin/integrations/route.ts', 'utf8');

const targetStr = `return NextResponse.json({ success: true, integration });`;
const bridgeLogic = `
        // --- BRIDGE TO LEGACY APIS TO PREVENT BACKEND BREAKAGE ---
        if (category === 'EMAIL' && providerCode === 'GMAIL') {
            const adminCompany = await prisma.company.findFirst({ orderBy: { createdAt: 'asc' } });
            if (adminCompany) {
                await prisma.appSettings.upsert({
                    where: { companyId_key: { companyId: adminCompany.id, key: 'smtp_settings' } },
                    create: { companyId: adminCompany.id, key: 'smtp_settings', value: credentials },
                    update: { value: credentials }
                });
            }
        }

        if (category === 'SMS' && providerCode === 'NETGSM') {
            const adminCompany = await prisma.company.findFirst({ orderBy: { createdAt: 'asc' } });
            if (adminCompany) {
                await (prisma as any).otpProviderConfig.upsert({
                    where: { companyId_provider: { companyId: adminCompany.id, provider: 'NETGSM' } },
                    create: { 
                        companyId: adminCompany.id, 
                        provider: 'NETGSM', 
                        isActive: isActive,
                        credentials: credentials,
                        settings: settings || {}
                    },
                    update: { 
                        isActive: isActive,
                        credentials: credentials,
                        settings: settings || {}
                    }
                });
            }
        }
        // ---------------------------------------------------------

        return NextResponse.json({ success: true, integration });
`;

if (c.includes(targetStr)) {
    c = c.replace(targetStr, bridgeLogic);
    fs.writeFileSync('src/app/api/admin/integrations/route.ts', c, 'utf8');
    console.log("Successfully bridged integration route");
} else {
    console.log("FAILED to find insertion point");
}
