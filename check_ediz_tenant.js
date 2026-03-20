const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const admin = await prisma.user.findFirst({ where: { email: 'oilshoptr@gmail.com' } });
    console.log("Admin tenantId:", admin.tenantId);
    
    const company = await prisma.company.findFirst({ where: { tenantId: admin.tenantId } });
    console.log("Admin companyId:", company?.id);
    
    const ediz = await prisma.customer.findFirst({ where: { name: { contains: 'EDİZ', mode: 'insensitive' } } });
    console.log("EDIZ companyId:", ediz?.companyId);
    console.log("MATCH??", company?.id === ediz?.companyId ? 'YES' : 'NO');
    
    prisma.$disconnect();
}
check();
