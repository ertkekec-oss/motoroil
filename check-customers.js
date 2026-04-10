const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const user = await prisma.user.findUnique({ where: { email: 'oilshoptr@gmail.com' } });
    if (!user) return console.log('User not found');
    const count = await prisma.customer.count({ where: { companyId: user.companyId } });
    console.log('Total customers in DB:', count);
    const customers = await prisma.customer.findMany({ where: { companyId: user.companyId }, select: { name: true } });
    console.log(customers);
}

check().catch(console.error).finally(() => prisma.$disconnect());
