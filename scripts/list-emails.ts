import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const users = await prisma.user.findMany({ select: { email: true } });
    console.log('All User emails:', users.map(u => u.email));

    const staff = await prisma.staff.findMany({ select: { username: true, email: true } });
    console.log('All Staff (username/email):', staff.map(s => `${s.username} / ${s.email}`));
}

main().finally(() => prisma.$disconnect());
