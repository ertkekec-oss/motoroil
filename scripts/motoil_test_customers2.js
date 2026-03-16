const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
    const customers = await prisma.customer.findMany({ select: { id: true, name: true, branch: true } });
    fs.writeFileSync('test_customers.json', JSON.stringify(customers, null, 2));
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
