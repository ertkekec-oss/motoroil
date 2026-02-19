const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const email = 'ertugrul.kekec@periodya.com';
    const staff = await prisma.staff.findFirst({
        where: {
            OR: [
                { username: email },
                { email: email }
            ],
            deletedAt: null
        }
    });

    if (staff) {
        console.log('STAFF FOUND:');
        console.log(`ID: ${staff.id}`);
        console.log(`Email: ${staff.email}`);
        console.log(`Password starts with: ${staff.password.substring(0, 10)}...`);
    } else {
        console.log('STAFF NOT FOUND');
    }
}

main().finally(() => prisma.$disconnect());
