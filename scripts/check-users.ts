import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const count = await prisma.user.count();
    console.log(`User Count in DB: ${count}`);

    if (count > 0) {
        const users = await prisma.user.findMany({
            select: { email: true, role: true }
        });
        console.log('Existing Users:');
        users.forEach(u => console.log(`- ${u.email} (${u.role})`));
    } else {
        console.log('WARNING: Database is EMPTY. All users might have been reset.');
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
