import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateExistingUsers() {
    try {
        const defaultPermissions = [
            'pos_access',
            'customer_view',
            'customer_create',
            'customer_edit',
            'inventory_view',
            'sales_archive',
            'finance_view',
            'settings_manage'
        ];

        // Get all users
        const users = await prisma.user.findMany();

        let updated = 0;
        for (const user of users) {
            if (!user.permissions || user.permissions.length === 0) {
                await prisma.user.update({
                    where: { id: user.id },
                    data: { permissions: defaultPermissions }
                });
                updated++;
            }
        }

        console.log(`✅ Updated ${updated} users with default permissions`);
    } catch (error) {
        console.error('Error updating users:', error);
    } finally {
        await prisma.$disconnect();
    }
}

updateExistingUsers();
