const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const sema = await prisma.customer.findFirst({ where: { name: { contains: 'SEMA', mode: 'insensitive' } } });
    console.log("Sema branch:", sema?.branch);
    
    const ertug = await prisma.customer.findFirst({ where: { name: { contains: 'ERTUG', mode: 'insensitive' } } });
    console.log("Ertug branch:", ertug?.branch);
    
    const ediz = await prisma.customer.findFirst({ where: { name: { contains: 'EDİZ', mode: 'insensitive' } } });
    console.log("Ediz branch:", ediz?.branch);
    
    prisma.$disconnect();
}
check();
