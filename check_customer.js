const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.customer.findMany({ where: { name: { contains: 'EDIZ', mode: 'insensitive' } } })
    .then(r => console.log(JSON.stringify(r, null, 2)))
    .catch(console.error)
    .finally(() => prisma.$disconnect());
