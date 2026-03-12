import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
    try {
        const c1 = await prisma.customer.findFirst({
            where: { email: { contains: 'guest-4624209464@hepsiburada.com' } }
        });
        console.log("Customer specific mapping:", c1?.name, c1?.id, c1?.deletedAt);

        const c2 = await prisma.customer.findMany({
            where: { name: { contains: 'cem', mode: 'insensitive' } },
            select: { id: true, name: true, deletedAt: true }
        });
        console.log("Searching for 'cem' insensitive mode returns:", c2);
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}
run();
