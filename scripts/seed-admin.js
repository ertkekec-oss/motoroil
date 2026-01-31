const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const admin = await prisma.staff.upsert({
        where: { username: 'admin' },
        update: {
            password: hashedPassword,
            role: 'Admin',
            permissions: ['*']
        },
        create: {
            username: 'admin',
            password: hashedPassword,
            name: 'Sistem Yöneticisi',
            role: 'Admin',
            branch: 'Merkez',
            permissions: ['*'],
            status: 'Boşta'
        }
    });

    console.log('Admin user ensured:', admin.username);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
