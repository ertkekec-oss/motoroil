const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findPlatformAdmins() {
    const list = await prisma.user.findMany({
        where: {
            role: 'SUPER_ADMIN'
        },
        select: {
            id: true,
            email: true,
            role: true,
            tenantId: true
        }
    });
    
    console.log(list);
}

findPlatformAdmins().catch(console.error).finally(() => prisma.$disconnect());
