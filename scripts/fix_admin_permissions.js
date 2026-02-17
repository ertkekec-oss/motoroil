const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAdminPermissions() {
    try {
        console.log('🔧 Fixing admin permissions...\n');

        // Update admin user with ALL permissions
        const admin = await prisma.staff.update({
            where: { username: 'admin' },
            data: {
                permissions: [
                    'ALL',
                    'pos_access',
                    'finance_view',
                    'finance_manage',
                    'customer_view',
                    'customer_manage',
                    'supplier_view',
                    'supplier_manage',
                    'inventory_view',
                    'inventory_manage',
                    'service_view',
                    'service_manage',
                    'sales_archive',
                    'reports_view',
                    'security_access',
                    'settings_manage',
                    'staff_manage',
                    'branch_manage'
                ]
            }
        });

        console.log('✅ Admin permissions updated successfully!');
        console.log(`\n📋 Permissions: ${admin.permissions.join(', ')}`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixAdminPermissions();
