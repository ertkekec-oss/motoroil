const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const email = 'ertugrul.kekec@periodya.com';
    const password = '12385788';

    console.log('Setting password to plain text for debugging...');
    await prisma.user.update({
        where: { email: email },
        data: { password: password }
    });
    console.log('DONE. Try logging in now with plain text.');
}

main().finally(() => prisma.$disconnect());
