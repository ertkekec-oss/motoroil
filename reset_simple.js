const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    const email = 'ertugrul.kekec@periodya.com';
    const password = 'periodya123'; // NEW SIMPLE PASSWORD
    const hashed = await bcrypt.hash(password, 10);

    console.log('RESETTING PASSWORD TO: periodya123');
    await prisma.user.update({
        where: { email: email },
        data: { password: hashed }
    });

    // Clear all attempts one last time
    await prisma.loginAttempt.deleteMany({});

    console.log('SUCCESS. DB IS READY.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
