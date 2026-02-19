const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findFirst({
        where: { email: { contains: 'ertugrul.kekec', mode: 'insensitive' } }
    });

    if (user) {
        console.log(`Email in DB: "${user.email}"`);
    } else {
        console.log('User not found even insensitive');
    }
}

main().finally(() => prisma.$disconnect());
