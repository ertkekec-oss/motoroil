const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const kasalar = await prisma.kasa.findMany({ select: { id: true, name: true, branch: true, balance: true } });
    console.log('KASALAR:', JSON.stringify(kasalar, null, 2));

    const accounts = await prisma.account.findMany({
        where: { code: { startsWith: '100' } },
        select: { code: true, name: true, branch: true, balance: true, kasaId: true }
    });
    console.log('ACCOUNTS (100):', JSON.stringify(accounts, null, 2));
}

main().finally(() => prisma.$disconnect());
