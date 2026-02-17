const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateAdminRole() {
    try {
        console.log('🔧 Updating admin role to SUPER_ADMIN...\n');

        const admin = await prisma.staff.update({
            where: { username: 'admin' },
            data: {
                role: 'SUPER_ADMIN',  // Sistem Yöneticisi
                type: 'admin'
            }
        });

        console.log('✅ Admin role updated successfully!');
        console.log(`\n📋 New Role: ${admin.role}`);
        console.log(`   Type: ${admin.type}`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

updateAdminRole();
