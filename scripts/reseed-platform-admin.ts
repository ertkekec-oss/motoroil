import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('--- RESEEDING PLATFORM ADMIN ---');

    const email = 'admin@periodya.com';
    const password = 'admin1234';
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log('1. Ensuring "PLATFORM_ADMIN" Tenant exists...');

    // 1. Create PLATFORM_ADMIN Tenant
    const tenant = await prisma.tenant.upsert({
        where: { id: 'PLATFORM_ADMIN' },
        update: {},
        create: {
            id: 'PLATFORM_ADMIN',
            name: 'Platform Administration Force',
            ownerEmail: email,
            status: 'ACTIVE',
            setupState: 'COMPLETED'
        }
    });
    console.log('✅ Created/Found Tenant: PLATFORM_ADMIN');

    // 2. Create/Update User as SUPER_ADMIN
    console.log(`2. Promoting ${email} to SUPER_ADMIN...`);
    const user = await prisma.user.upsert({
        where: { email },
        update: {
            password: hashedPassword,
            tenantId: 'PLATFORM_ADMIN',
            role: 'SUPER_ADMIN',
            name: 'Platform Super Admin'
        },
        create: {
            email,
            name: 'Platform Super Admin',
            password: hashedPassword,
            tenantId: 'PLATFORM_ADMIN',
            role: 'SUPER_ADMIN'
        }
    });

    // 3. Sync Staff Table (crucial for actual login logic)
    const staff = await prisma.staff.findFirst({
        where: { OR: [{ email }, { username: email }] }
    });

    if (staff) {
        await prisma.staff.update({
            where: { id: staff.id },
            data: {
                tenantId: 'PLATFORM_ADMIN',
                role: 'SUPER_ADMIN',
                permissions: ['*'],
                status: 'Active',
                password: hashedPassword // Ensure password matches
            }
        });
        console.log('✅ Created/Updated STAFF record for admin.');
    } else {
        // Create new Staff if not exists
        await prisma.staff.create({
            data: {
                // If ID is string/cuid, let it be generated or reuse user ID if compatible?
                // Staff ID usually int or string? Let's check schema via error if needed, but usually CUID string.
                name: 'Platform Super Admin',
                email: email,
                username: email,
                password: hashedPassword,
                role: 'SUPER_ADMIN',
                tenantId: 'PLATFORM_ADMIN',
                permissions: ['*'],
                status: 'Active',
                branch: 'Global Command',
                currentJob: 'System Administrator'
            }
        });
        console.log('✅ Created NEW STAFF record for admin.');
    }

    console.log('🎉 PLATFORM ADMIN RESET COMPLETE.');
    console.log(`Credentials: ${email} / ${password}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
