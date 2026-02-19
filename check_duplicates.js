const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const email = 'ertugrul.kekec@periodya.com';
    const users = await prisma.user.findMany({
        where: { email: email }
    });

    console.log(`Found ${users.length} users with email ${email}`);
    users.forEach((u, i) => {
        console.log(`User ${i + 1}:`);
        console.log(`  ID: ${u.id}`);
        console.log(`  Role: ${u.role}`);
        console.log(`  Hash: ${u.password}`);
    });
}

main().finally(() => prisma.$disconnect());
