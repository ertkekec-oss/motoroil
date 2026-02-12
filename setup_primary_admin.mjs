
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Setting Up Single Primary Platform Admin ---');

    // 1. Identify users to delete
    const usersToDelete = await prisma.user.findMany({
        where: {
            email: { not: 'ertugrul.kekec@periodya.com' },
            OR: [
                { role: 'SUPER_ADMIN' },
                { tenantId: 'PLATFORM_ADMIN' },
                { email: 'admin@kech.tr' }
            ]
        }
    });

    const userIds = usersToDelete.map(u => u.id);

    // 2. Clean up related records for these users
    if (userIds.length > 0) {
        await prisma.userCompanyAccess.deleteMany({
            where: { userId: { in: userIds } }
        });
        await prisma.notification.deleteMany({
            where: { userId: { in: userIds } }
        });
        await prisma.user.deleteMany({
            where: { id: { in: userIds } }
        });
        console.log(`✅ Cleaned up ${userIds.length} other admin accounts.`);
    }

    // 3. Ensure Platform Tenant exists
    const tenant = await prisma.tenant.upsert({
        where: { id: 'PLATFORM_ADMIN' },
        update: {
            status: 'ACTIVE',
            setupState: 'COMPLETED'
        },
        create: {
            id: 'PLATFORM_ADMIN',
            name: 'Periodya Platform',
            ownerEmail: 'ertugrul.kekec@periodya.com',
            status: 'ACTIVE',
            setupState: 'COMPLETED'
        }
    });

    // 4. Create or Update Primary Admin
    const hashedPassword = await bcrypt.hash('12385788', 10);
    await prisma.user.upsert({
        where: { email: 'ertugrul.kekec@periodya.com' },
        update: {
            password: hashedPassword,
            role: 'SUPER_ADMIN',
            permissions: ['*'],
            tenantId: tenant.id
        },
        create: {
            tenantId: tenant.id,
            email: 'ertugrul.kekec@periodya.com',
            password: hashedPassword,
            role: 'SUPER_ADMIN',
            name: 'Ertuğrul Kekeç',
            permissions: ['*']
        }
    });

    console.log('✅ Secondary primary admin updated: ertugrul.kekec@periodya.com');
    console.log('--- DONE ---');
}

main().catch(console.error).finally(() => prisma.$disconnect());
