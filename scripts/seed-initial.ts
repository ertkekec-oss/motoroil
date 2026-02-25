import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding initial data...');

    // 1. Create Tenant
    let tenant = await prisma.tenant.findFirst();
    if (!tenant) {
        tenant = await prisma.tenant.create({
            data: {
                name: 'Demo Tenant',
                ownerEmail: 'admin@demo.com',
                status: 'ACTIVE'
            }
        });
        console.log('Tenant created:', tenant.id);
    }

    // 2. Create Company
    let company = await prisma.company.findFirst();
    if (!company) {
        company = await prisma.company.create({
            data: {
                tenantId: tenant.id,
                name: 'Periodya Demo A.Ş.',
                vkn: '1234567890',
                taxNumber: '1234567890',
                city: 'Istanbul'
            }
        });
        console.log('Company created:', company.id);
    }

    // 3. Create User
    const email = 'admin@demo.com';
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        const password = await bcrypt.hash('admin123', 10);
        user = await prisma.user.create({
            data: {
                email,
                password,
                name: 'Demo Admin',
                role: 'ADMIN',
                tenantId: tenant.id
            }
        });
        // Access
        await prisma.userCompanyAccess.create({
            data: { userId: user.id, companyId: company.id, role: 'ADMIN' }
        });
        console.log('User created:', email);
    }

    // 4. Create dummy products
    const productCount = await prisma.product.count();
    if (productCount === 0) {
        await prisma.product.createMany({
            data: [
                { companyId: company.id, name: 'Motor Yağı 5W-30', code: 'MY-001', price: 500, stock: 100 },
                { companyId: company.id, name: 'Fren Balatası', code: 'FR-002', price: 1200, stock: 50 },
                { companyId: company.id, name: 'Hava Filtresi', code: 'HF-003', price: 250, stock: 200 },
            ]
        });
        console.log('Products created.');
    }
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
