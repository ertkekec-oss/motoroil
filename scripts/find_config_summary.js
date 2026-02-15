const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findKeySummary() {
    const all = await prisma.marketplaceConfig.findMany();
    const targetKeyPartial = '5H4';

    const matches = all.filter(c => {
        const s = c.settings || {};
        const str = JSON.stringify(s);
        return str.includes(targetKeyPartial);
    });

    matches.forEach(m => {
        console.log(`ID: ${m.id}`);
        console.log(`Company ID: ${m.companyId}`);
        console.log(`Type: ${m.type}`);
        console.log(`Active: ${m.isActive}`);
        console.log(`Settings: ${JSON.stringify(m.settings)}`);
        console.log('---');
    });
}

findKeySummary().catch(console.error).finally(() => prisma.$disconnect());
