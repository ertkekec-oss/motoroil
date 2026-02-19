const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    const email = 'ertugrul.kekec@periodya.com';
    const password = '12385788';
    const hashed = await bcrypt.hash(password, 10);

    console.log('UPDATING BOTH USER AND STAFF WITH CORRECT HASH...');

    await prisma.user.update({
        where: { email: email },
        data: { password: hashed }
    });

    await prisma.staff.upsert({
        where: { id: 'superadmin_staff_id' },
        update: { password: hashed },
        create: {
            id: 'superadmin_staff_id',
            username: email,
            email: email,
            password: hashed,
            role: 'ADMIN',
            name: 'Ertuğrul Keleş',
            tenantId: 'PLATFORM_ADMIN'
        }
    });

    console.log('SUCCESS.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
