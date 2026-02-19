const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const email = 'ertugrul.kekec@periodya.com';
    const password = '12385788';

    console.log('Final provisioning for User table...');

    await prisma.user.upsert({
        where: { email: email },
        update: {
            password: password, // Plain text for now to ensure access
            role: 'SUPER_ADMIN',
            permissions: ['*'],
            tenantId: 'PLATFORM_ADMIN'
        },
        create: {
            email: email,
            name: 'Ertuğrul Keleş',
            password: password,
            role: 'SUPER_ADMIN',
            permissions: ['*'],
            tenantId: 'PLATFORM_ADMIN'
        }
    });

    console.log('DONE.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
