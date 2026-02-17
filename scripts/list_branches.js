
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const branches = await prisma.branch.findMany();
    branches.forEach(b => {
        console.log(`ID: ${b.id}, Company: ${b.companyId}, Name: ${b.name}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
