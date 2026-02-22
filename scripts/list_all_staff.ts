import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const staff = await prisma.staff.findMany({
        where: { deletedAt: null },
        select: { name: true, role: true }
    });
    console.log(staff);
}
main().finally(() => prisma.$disconnect());
