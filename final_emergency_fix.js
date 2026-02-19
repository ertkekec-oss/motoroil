const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    const email = 'ertugrul.kekec@periodya.com';
    const password = '12385788';
    const hashed = await bcrypt.hash(password, 10);

    console.log('RESETTING PASSWORD HASH FOR ACCURACY...');
    await prisma.user.update({
        where: { email: email },
        data: {
            password: hashed,
            role: 'SUPER_ADMIN',
            tenantId: 'PLATFORM_ADMIN'
        }
    });

    // Also clear ANY login attempts again just in case IP was blocked too
    await prisma.loginAttempt.deleteMany({});

    console.log('DONE. DATABASE IS CLEAN AND PASSWORD IS RESET.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
