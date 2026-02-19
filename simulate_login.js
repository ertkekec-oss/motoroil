const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    const username = 'ertugrul.kekec@periodya.com';
    const password = '12385788';

    console.log(`Checking login for: ${username}`);

    const user = await prisma.user.findFirst({
        where: {
            OR: [
                { email: username }
            ]
        }
    });

    if (!user) {
        console.log('User not found in DB');
        return;
    }

    console.log('User found. Comparing passwords...');
    console.log(`Hash in DB: ${user.password}`);

    const isMatch = await bcrypt.compare(password, user.password);
    console.log(`Match Result: ${isMatch}`);
}

main().finally(() => prisma.$disconnect());
