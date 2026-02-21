import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();

async function main() {
    const companies = await p.company.findMany({
        select: { id: true, name: true, vkn: true, tenantId: true }
    });
    console.log('All companies:', JSON.stringify(companies, null, 2));
    console.log('\nTotal:', companies.length);
}

main().catch(console.error).finally(() => p.$disconnect());
