
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const branches = await prisma.branch.findMany();
    console.log('Total branches:', branches.length);

    const seen = new Set();
    const duplicates = [];

    for (const b of branches) {
        const key = `${b.companyId}:${b.name}`;
        if (seen.has(key)) {
            duplicates.push(b);
        }
        seen.add(key);
    }

    if (duplicates.length > 0) {
        console.log('Duplicates found:', JSON.stringify(duplicates, null, 2));
    } else {
        console.log('No duplicates found for [companyId, name]');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
