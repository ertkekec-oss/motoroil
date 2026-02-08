const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function createStaffAdmin() {
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
            email: 'admin@motoroil.com',
            role: 'Admin',
            branch: 'Merkez',
            permissions: ['*'],
            status: 'Aktif'
        }
    });

    console.log('✅ Staff Admin created!');
    console.log('Username: admin');
    console.log('Password: admin123');

    await prisma.$disconnect();
}

createStaffAdmin().catch(console.error);
