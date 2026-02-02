
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const accounts = await prisma.account.findMany();
        const codes = accounts.map(a => `${a.code}:${a.branch}`);
        const duplicates = codes.filter((item, index) => codes.indexOf(item) !== index);

        console.log('Duplicates found:', duplicates);

        // Also check for accounts with same code but different IDs
        const codeMap = {};
        accounts.forEach(a => {
            const key = `${a.code}:${a.branch}`;
            if (!codeMap[key]) codeMap[key] = [];
            codeMap[key].push(a.id);
        });

        Object.keys(codeMap).forEach(key => {
            if (codeMap[key].length > 1) {
                console.log(`Code ${key} has multiple IDs:`, codeMap[key]);
            }
        });

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
