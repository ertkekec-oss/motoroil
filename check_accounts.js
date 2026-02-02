
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const accounts = await prisma.account.findMany();
        console.log('Total accounts:', accounts.length);
        console.log(JSON.stringify(accounts, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
