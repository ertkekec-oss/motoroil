const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const allStaff = await prisma.staff.findMany({
        select: {
            id: true,
            username: true,
            email: true,
            name: true,
            deletedAt: true
        }
    });

    console.log(JSON.stringify(allStaff, null, 2));
}

main().finally(() => prisma.$disconnect());
