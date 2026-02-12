import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('--- SEEDING ADMIN USER ---');

    // 1. Create Tenant
    const tenant = await prisma.tenant.upsert({
        where: { id: 'test-tenant-id' },
        update: {},
        create: {
            id: 'test-tenant-id',
            name: 'Periodya Enterprise',
            ownerEmail: 'admin@kech.tr',
            status: 'ACTIVE'
        }
    });

    // 2. Create Company
    const company = await prisma.company.upsert({
        where: { id: 'test-company-id' },
        update: {},
        create: {
            id: 'test-company-id',
            tenantId: tenant.id,
            name: 'Period Tech A.S.',
            vkn: '1234567890',
            address: 'Istanbul Technopark'
        }
    });

    // 3. Create Admin User
    const hashedPassword = await bcrypt.hash('admin1234', 10);
    const user = await prisma.user.upsert({
        where: { email: 'admin@kech.tr' },
        update: { password: hashedPassword },
        create: {
            tenantId: tenant.id,
            email: 'admin@kech.tr',
            name: 'Periodya Admin',
            password: hashedPassword,
            role: 'ADMIN'
        }
    });

    // 4. Link User to Company
    await prisma.userCompanyAccess.upsert({
        where: { userId_companyId: { userId: user.id, companyId: company.id } },
        update: {},
        create: {
            userId: user.id,
            companyId: company.id,
            role: 'COMPANY_ADMIN'
        }
    });

    console.log('✅ Admin user created: admin@kech.tr / admin1234');
}

main().catch(console.error).finally(() => prisma.$disconnect());
