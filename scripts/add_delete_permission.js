const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addDeletePermission() {
    try {
        console.log('🔧 Adding delete_records permission to admin...\n');

        const admin = await prisma.staff.findUnique({
            where: { username: 'admin' }
        });

        console.log('Current permissions:', admin.permissions);

        if (!admin.permissions.includes('delete_records')) {
            const updated = await prisma.staff.update({
                where: { username: 'admin' },
                data: {
                    permissions: [...admin.permissions, 'delete_records']
                }
            });

            console.log('\n✅ Added delete_records permission!');
            console.log('New permissions:', updated.permissions);
        } else {
            console.log('\n✅ Admin already has delete_records permission');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

addDeletePermission();
