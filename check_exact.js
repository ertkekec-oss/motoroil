const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const admin = await prisma.user.findFirst({ where: { email: 'oilshoptr@gmail.com' } });
    const company = await prisma.company.findFirst({ where: { tenantId: admin.tenantId } });

    console.log("------------------------");
    console.log("Admin Company ID:", company.id);

    const ediz = await prisma.customer.findFirst({ where: { name: { contains: 'EDİZ', mode: 'insensitive' } } });
    console.log("EDIZ Company ID:", ediz?.companyId);

    console.log("IS SAME?:", company.id === ediz?.companyId);
    console.log("------------------------");
    
    prisma.$disconnect();
}
check();
