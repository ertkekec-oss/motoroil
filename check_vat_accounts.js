const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkVatAccounts() {
    const accounts = await prisma.account.findMany({
        where: {
            code: { in: ['190', '191', '391'] }
        }
    });

    console.log('KDV Accounts Found:', accounts.length);
    accounts.forEach(a => console.log(`- ${a.code} ${a.name}`));

    if (accounts.length < 3) {
        console.log('Missing KDV accounts!');
    }

    await prisma.$disconnect();
}

checkVatAccounts();
