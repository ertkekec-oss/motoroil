
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const branches = await prisma.branch.findMany();
    console.log('Total branches:', branches.length);

    const seen = new Set();
    const duplicates = [];

    for (const b of branches) {
        const key = b.name.toLowerCase();
        if (seen.has(key)) {
            duplicates.push(b);
        }
        seen.add(key);
    }

    if (duplicates.length > 0) {
        console.log('Global duplicate branch names found:', JSON.stringify(duplicates, null, 2));
    } else {
        console.log('No global duplicate branch names found.');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
