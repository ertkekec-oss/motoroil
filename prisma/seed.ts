import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    // 1. Create Default Tenant
    const tenant = await prisma.tenant.upsert({
        where: { id: 'demo-tenant' },
        update: {},
        create: {
            id: 'demo-tenant',
            name: 'Periodya Demo',
            ownerEmail: 'admin@periodya.com',
            status: 'ACTIVE',
            setupState: 'COMPLETED'
        }
    });

    console.log('Tenant created:', tenant.name);

    // 2. Create Default Company
    const company = await prisma.company.upsert({
        where: {
            tenantId_vkn: {
                tenantId: tenant.id,
                vkn: '1111111111'
            }
        },
        update: {},
        create: {
            tenantId: tenant.id,
            name: 'Merkez Şube',
            vkn: '1111111111',
            taxNumber: '1111111111',
            address: 'Demo Adres',
            city: 'Istanbul'
        }
    });

    console.log('Company created:', company.name);

    // 3. Create Admin User
    const passwordHash = await bcrypt.hash('admin1234', 10);

    const user = await prisma.user.upsert({
        where: { email: 'admin@periodya.com' },
        update: {
            password: passwordHash,
            role: 'SUPER_ADMIN',
            tenantId: tenant.id
        },
        create: {
            email: 'admin@periodya.com',
            name: 'Admin User',
            password: passwordHash,
            role: 'SUPER_ADMIN', // SUPER_ADMIN has full access
            tenantId: tenant.id,
            permissions: ['ALL']
        }
    });

    console.log('User created:', user.email);

    // 4. Link User to Company as ADMIN
    await prisma.userCompanyAccess.upsert({
        where: {
            userId_companyId: {
                userId: user.id,
                companyId: company.id
            }
        },
        update: {
            role: 'ADMIN'
        },
        create: {
            userId: user.id,
            companyId: company.id,
            role: 'ADMIN' // High level role for company access
        }
    });

    console.log('User linked to company with ADMIN role.');

    // 5. Create Platform Admin Tenant
    const platformTenant = await prisma.tenant.upsert({
        where: { id: 'PLATFORM_ADMIN' },
        update: {},
        create: {
            id: 'PLATFORM_ADMIN',
            name: 'Periodya Platform',
            ownerEmail: 'ertugrul.kekec@periodya.com',
            status: 'ACTIVE',
            setupState: 'COMPLETED'
        }
    });

    console.log('Platform Tenant confirmed.');

    // 6. Create Super Admin User
    const superAdminPass = await bcrypt.hash('12385788', 10);
    const superAdmin = await prisma.user.upsert({
        where: { email: 'ertugrul.kekec@periodya.com' },
        update: {
            password: superAdminPass,
            role: 'SUPER_ADMIN',
            tenantId: platformTenant.id,
            permissions: ['ALL', 'SUPER_ADMIN']
        },
        create: {
            email: 'ertugrul.kekec@periodya.com',
            name: 'Ertugrul Kekec',
            password: superAdminPass,
            role: 'SUPER_ADMIN',
            tenantId: platformTenant.id,
            permissions: ['ALL', 'SUPER_ADMIN']
        }
    });

    console.log(`Super Admin created: ${superAdmin.email}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
