
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    const adminEmail = 'admin@periodya.com';
    const hashedPassword = await bcrypt.hash('admin1234', 10);

    console.log(`Upserting admin user: ${adminEmail}`);

    const user = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {
            role: 'SUPER_ADMIN',
            name: 'Admin',
            tenantId: 'PLATFORM_ADMIN'
        },
        create: {
            email: adminEmail,
            name: 'Admin',
            password: hashedPassword,
            role: 'SUPER_ADMIN',
            tenantId: 'PLATFORM_ADMIN'
        },
    });

    console.log('Admin user upserted:', user.id);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
