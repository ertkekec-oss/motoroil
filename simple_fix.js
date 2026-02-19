const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const email = 'ertugrul.kekec@periodya.com';
    const password = '12385788';

    console.log('UPDATING PASSWORD FOR:', email);
    const user = await prisma.user.update({
        where: { email: email },
        data: { password: password }
    });
    console.log('SUCCESS. ID:', user.id);
}

main().catch(console.error).finally(() => prisma.$disconnect());
