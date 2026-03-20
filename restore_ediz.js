const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const ediz = await prisma.customer.findFirst({ where: { name: { contains: 'EDİZ', mode: 'insensitive' } } });
    if (ediz && ediz.deletedAt) {
        await prisma.customer.update({
            where: { id: ediz.id },
            data: { deletedAt: null }
        });
        console.log("Restored EDIZ L.T.D successfully!");
    } else {
        console.log("EDIZ not found or not deleted.");
    }
    prisma.$disconnect();
}
check();
