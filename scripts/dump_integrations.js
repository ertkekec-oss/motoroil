const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkIntegrator() {
    const integrations = await prisma.integratorSettings.findMany();
    console.log('IntegratorSettings:', JSON.stringify(integrations, null, 2));

    const allConfigs = await prisma.marketplaceConfig.findMany(); // Dump all configs
    console.log('All MarketplaceConfig:', JSON.stringify(allConfigs, null, 2));
}

checkIntegrator().catch(console.error).finally(() => prisma.$disconnect());
