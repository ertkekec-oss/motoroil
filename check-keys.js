const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const config = await prisma.marketplaceConfig.findFirst({
        where: { companyId: 'cmlsmhyap000e8fcnemogl9hn', type: 'pazarama' }
    });
    if (config) {
        const s = config.settings || config.config || {};
        console.log('Type:', config.type);
        console.log('API Key:', s.apiKey);
        console.log('Has Secret:', !!s.apiSecret);
    } else {
        console.log('No Pazarama config');
    }
}

check().catch(console.error).finally(() => prisma.$disconnect());
