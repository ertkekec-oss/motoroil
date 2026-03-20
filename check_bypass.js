const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        await prisma.order.aggregate({
            where: { id: "test" },
            _sum: { totalAmount: true },
            adminBypass: true
        });
        console.log("WORKED");
    } catch(e) {
        console.log("ERROR:", e.message);
    }
    prisma.$disconnect();
}
check();
