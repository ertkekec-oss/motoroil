const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const user = await prisma.user.findUnique({ where: { email: 'oilshoptr@gmail.com' } });
    const customers = await prisma.customer.findMany({ where: { companyId: user.companyId } });
    const branchCounts = customers.reduce((acc, c) => {
        const branch = c.branch || 'Merkez (Boş)';
        acc[branch] = (acc[branch] || 0) + 1;
        return acc;
    }, {});
    console.log("Branch distribution:", branchCounts);
}

check().catch(console.error).finally(() => prisma.$disconnect());
