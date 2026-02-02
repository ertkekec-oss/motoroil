const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Fetching accounts...');
    try {
        const count = await prisma.account.count();
        console.log('Account Count:', count);

        if (count > 0) {
            const accounts = await prisma.account.findMany({ take: 5 });
            console.log('Sample Accounts:', JSON.stringify(accounts, null, 2));
        } else {
            console.log('No accounts found!');
        }
    } catch (e) {
        console.error('Error:', e);
    }
}

main().finally(() => prisma.$disconnect());
