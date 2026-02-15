const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findKey() {
    const all = await prisma.marketplaceConfig.findMany();
    const targetKeyPartial = '5H4Y';

    const matches = all.filter(c => {
        const s = c.settings || {};
        // settings is JSON object
        return JSON.stringify(s).includes(targetKeyPartial);
    });

    console.log('Found configs:', JSON.stringify(matches, null, 2));
}

findKey().catch(console.error).finally(() => prisma.$disconnect());
