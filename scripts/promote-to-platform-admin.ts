import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@kech.tr';
    console.log(`Promoting ${email} to PLATFORM ADMIN...`);

    // 1. Update User Table
    const user = await prisma.user.findFirst({ where: { email } });
    if (user) {
        await prisma.user.update({
            where: { id: user.id },
            data: {
                tenantId: 'PLATFORM_ADMIN',
                role: 'SUPER_ADMIN'
            }
        });
        console.log('✅ User table updated: tenantId=PLATFORM_ADMIN, role=SUPER_ADMIN');
    } else {
        console.log('⚠️ User not found in User table.');
    }

    // 2. Update Staff Table
    const staff = await prisma.staff.findFirst({
        where: { OR: [{ email: email }, { username: email }] }
    });

    if (staff) {
        await prisma.staff.update({
            where: { id: staff.id },
            data: {
                tenantId: 'PLATFORM_ADMIN',
                role: 'SUPER_ADMIN',
                permissions: ['*'] // Give all permissions
            }
        });
        console.log('✅ Staff table updated: tenantId=PLATFORM_ADMIN, role=SUPER_ADMIN, permissions=[*]');
    } else {
        console.log('⚠️ User not found in Staff table.');
    }

    // 3. Ensure 'PLATFORM_ADMIN' tenant exists (optional but good for consistency)
    // We don't necessarily need a Tenant record for PLATFORM_ADMIN if the code handles the string literal,
    // but having one prevents foreign key issues if strict.
    // However, usually PLATFORM_ADMIN is a magic string. Let's not force create a tenant unless verified strictly.
}

main().catch(console.error).finally(() => prisma.$disconnect());
