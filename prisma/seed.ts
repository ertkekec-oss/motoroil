import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    // 1. Create Default Tenant
    // We use upsert to ensure idempotency
    const tenant = await prisma.tenant.upsert({
        where: { id: 'demo-tenant' },
        update: {},
        create: {
            id: 'demo-tenant',
            name: 'Periodya Demo',
            ownerEmail: 'admin@kech.tr',
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
            address: 'Demo Adres',
            city: 'Istanbul'
        }
    });

    console.log('Company created:', company.name);

    // 3. Create Admin User
    // Password: admin1234
    const passwordHash = await bcrypt.hash('admin1234', 10);

    const user = await prisma.user.upsert({
        where: { email: 'admin@kech.tr' },
        update: {
            password: passwordHash,
            role: 'SUPER_ADMIN',
            tenantId: tenant.id
        },
        create: {
            email: 'admin@kech.tr',
            name: 'Admin User',
            password: passwordHash,
            role: 'SUPER_ADMIN',
            tenantId: tenant.id,
            permissions: ['ALL'] // Grant all permissions
        }
    });

    console.log('User created:', user.email);

    // 4. Link User to Company as Admin
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
            role: 'ADMIN'
        }
    });

    console.log('User linked to company with ADMIN role.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
