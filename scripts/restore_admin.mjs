
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Restoring Admin User ---');

    // 1. Create Tenant
    const tenant = await prisma.tenant.upsert({
        where: { id: 'PLATFORM_TENANT' },
        update: {},
        create: {
            id: 'PLATFORM_TENANT',
            name: 'Kech TR',
            ownerEmail: 'admin@periodya.com',
            status: 'ACTIVE',
            setupState: 'COMPLETED'
        }
    });
    console.log('✅ Tenant created:', tenant.id);

    // 2. Create Company
    const company = await prisma.company.upsert({
        where: { tenantId_vkn: { tenantId: tenant.id, vkn: '0000000000' } },
        update: {},
        create: {
            tenantId: tenant.id,
            name: 'Kech TR Enterprise',
            vkn: '0000000000',
            taxOffice: 'Ankara',
            city: 'Ankara'
        }
    });
    console.log('✅ Company created:', company.id);

    // 3. Create Admin User
    const hashedPassword = await bcrypt.hash('admin1234', 10);
    const user = await prisma.user.upsert({
        where: { email: 'admin@periodya.com' },
        update: {
            password: hashedPassword,
            role: 'ADMIN',
            permissions: ['*']
        },
        create: {
            tenantId: tenant.id,
            email: 'admin@periodya.com',
            password: hashedPassword,
            role: 'ADMIN',
            name: 'Admin',
            permissions: ['*']
        }
    });

    // 4. Give User Company Access
    await prisma.userCompanyAccess.upsert({
        where: { userId_companyId: { userId: user.id, companyId: company.id } },
        update: {},
        create: {
            userId: user.id,
            companyId: company.id,
            role: 'COMPANY_ADMIN'
        }
    });

    console.log('✅ Admin user restored: admin@periodya.com / admin1234');
}

main().catch(console.error).finally(() => prisma.$disconnect());
