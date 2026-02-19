const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const username = 'ertugrul.kekec@periodya.com';
    console.log('CLEARING FAILED LOGIN ATTEMPTS FOR:', username);

    const deleted = await prisma.loginAttempt.deleteMany({
        where: {
            OR: [
                { username: username },
                { username: username.toLowerCase() }
            ]
        }
    });

    console.log(`DELETED ${deleted.count} ATTEMPTS.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
