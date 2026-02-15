const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
    const configs = await prisma.marketplaceConfig.findMany({
        include: { company: true }
    });
    fs.writeFileSync('configs_debug.json', JSON.stringify(configs, null, 2));
    console.log('Saved to configs_debug.json');
}

main().catch(console.error).finally(() => prisma.$disconnect());
