const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        await prisma.order.findFirst({
            where: { id: "test" },
            adminBypass: true
        });
        console.log("findFirst WORKED");
    } catch(e) {
        console.log("findFirst ERROR:", e.message);
    }
    prisma.$disconnect();
}
check();
