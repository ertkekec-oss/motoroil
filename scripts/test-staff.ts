import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findFirst({ where: { name: 'PERSONE DENEME' } });
    const staff = await prisma.staff.findFirst({ where: { name: 'PERSONE DENEME' } });
    console.log("USER RECORD:\n", user);
    console.log("STAFF RECORD:\n", staff);
}

main().finally(() => prisma.$disconnect());
