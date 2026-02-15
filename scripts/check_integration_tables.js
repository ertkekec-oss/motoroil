const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listModels() {
    // List tables actually
    // But I can guess or check schema again.
    // Let's check IntegratorSettings first.
    try {
        const settings = await prisma.integratorSettings.findMany();
        console.log('IntegratorSettings:', settings);
    } catch (e) {
        console.log('IntegratorSettings error:', e.message);
    }

    try {
        const mps = await prisma.marketplaceIntegration.findMany();
        console.log('MarketplaceIntegration:', mps);
    } catch (e) {
        console.log('MarketplaceIntegration error:', e.message);
    }
}

listModels().catch(console.error).finally(() => prisma.$disconnect());
