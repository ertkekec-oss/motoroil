const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const admin = await prisma.user.findFirst({ where: { email: 'oilshoptr@gmail.com' } });
    const company = await prisma.company.findFirst({ where: { tenantId: admin.tenantId } });

    const allCusts = await prisma.customer.findMany({ 
        where: { companyId: company.id, deletedAt: null },
        select: { name: true, branch: true, customerClass: true }
    });
    
    console.log("ALL CUSTOMERS:", allCusts);
    prisma.$disconnect();
}
check();
