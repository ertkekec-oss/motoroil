
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const accounts = await prisma.account.findMany();
        const problematic = accounts.filter(a => a.code.includes('.') && (!a.parentCode || !a.code.startsWith(a.parentCode)));

        console.log('Accounts with dots but missing/mismatched parentCode:');
        problematic.forEach(a => {
            console.log(`Code: ${a.code}, ParentCode: ${a.parentCode}`);
        });

        // Also check if any account code that WE generate is already taken but NOT found by lastChild
        // getAccountForKasa generates ${parentRoot}.01.001

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
