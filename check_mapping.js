
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const accounts = await prisma.account.findMany({
            where: {
                OR: [
                    { code: { startsWith: '100' } },
                    { code: { startsWith: '102' } },
                    { code: { startsWith: '108' } },
                    { code: { startsWith: '300' } }
                ]
            }
        });

        console.log('Accounting accounts mapping:');
        accounts.forEach(a => {
            console.log(`Code: ${a.code}, Name: ${a.name}, kasaId: ${a.kasaId}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
