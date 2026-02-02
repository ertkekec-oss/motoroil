const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Testing Accounts API logic...');

        // Mocking the steps from existing endpoint

        // 1. Fetch counts
        const count = await prisma.account.count();
        console.log('Account Count:', count);

        // 2. Fetch Kasalar
        const allKasalar = await prisma.kasa.findMany();
        console.log(`Found ${allKasalar.length} kasalar.`);

        // 3. (Simplified) Account Sync Check
        /* 
           Simulate getAccountForKasa logic without full module import to avoid complex deps in script 
        */
        for (const k of allKasalar) {
            const acc = await prisma.account.findFirst({ where: { kasaId: k.id } });
            console.log(`Kasa '${k.name}' -> Account: ${acc ? acc.code : 'MISSING'}`);
        }

        // 4. Fetch accounts
        const accounts = await prisma.account.findMany({
            orderBy: { code: 'asc' },
            take: 5
        });
        console.log('Top 5 Accounts:', JSON.stringify(accounts, null, 2));

    } catch (e) {
        console.error('ERROR:', e);
    }
}

main().finally(() => prisma.$disconnect());
