const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const email = 'ertugrul.kekec@periodya.com';
    const password = 'abc';

    console.log('Setting password to "abc" (plain text) and creating a Staff record...');

    // Update User
    await prisma.user.update({
        where: { email: email },
        data: { password: password }
    });

    // Create Staff (as a backup)
    await prisma.staff.upsert({
        where: { id: 'superadmin_staff_id' }, // Generic ID
        update: {
            username: email,
            email: email,
            password: password,
            role: 'ADMIN',
            tenantId: 'PLATFORM_ADMIN'
        },
        create: {
            id: 'superadmin_staff_id',
            username: email,
            email: email,
            password: password,
            role: 'ADMIN',
            tenantId: 'PLATFORM_ADMIN',
            name: 'Ertuğrul Keleş',
            branch: 'Merkez'
        }
    });

    console.log('DONE. Try logging in with email and password "abc".');
}

main().finally(() => prisma.$disconnect());
