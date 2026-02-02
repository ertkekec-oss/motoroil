const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAdmin() {
    const admin = await prisma.staff.findUnique({
        where: { username: 'admin' }
    });

    console.log('Admin User Info:');
    console.log('  Username:', admin.username);
    console.log('  Role:', admin.role);
    console.log('  Type:', admin.type);
    console.log('  Permissions:', admin.permissions);

    await prisma.$disconnect();
}

checkAdmin();
